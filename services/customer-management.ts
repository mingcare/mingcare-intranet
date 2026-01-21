// 客戶管理中心 - API 服務層
// 基於後端 API 規格 v1

import { supabase } from '../lib/supabase'
import type {
  CustomerData,
  CustomerListItem,
  CustomerFilters,
  SearchSuggestion,
  SearchRequest,
  CustomerIdGenerationRequest,
  CustomerIdGenerationResponse,
  ApiResponse,
  PaginatedResponse
} from '../types/customer-management'
import type { CustomerType, Introducer, CustomerFormData } from '../types/database'

export class CustomerManagementService {

  // ========================================================================
  // 工具函數 (內部使用)
  // ========================================================================

  /**
   * 檢查 ID 是否為 UUID 格式
   * @param id 要檢查的 ID
   * @returns true 如果是 UUID 格式，false 如果是客戶編號格式
   */
  private static isUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  /**
   * 智能查詢：根據 ID 格式自動選擇查詢欄位
   * @param id UUID 或客戶編號
   * @param operation 查詢操作
   * @returns 查詢結果
   */
  private static async queryBySmartId(
    id: string,
    operation: (queryBuilder: any, idField: string) => any
  ) {
    const isUUID = this.isUUID(id);
    const idField = isUUID ? 'id' : 'customer_id';

    console.log(`Using ${idField} query for ${isUUID ? 'UUID' : 'customer number'}:`, id);

    return operation(supabase.from('customer_personal_data'), idField);
  }

  // ========================================================================
  // 客戶編號生成 (使用 Supabase RPC - 並發安全)
  // ========================================================================

  /**
   * 生成下一個客戶編號
   * 使用後端 RPC 函數，確保並發安全
   *
   * 規則:
   * 1. 社區券客戶 → CCSV-MC-0001
   * 2. 明家街客 → MC-0001
   * 3. Steven Kwok + 社區券 → S-CCSV-0001
   * 4. Steven Kwok + 明家街客 → MC-0001 (共用)
   */
  static async generateNextCustomerId(
    customerType: CustomerType,
    introducer?: Introducer
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_next_customer_id', {
        p_customer_type: customerType,
        p_introducer: introducer || null
      });

      if (error) {
        console.error('RPC 錯誤:', error);
        throw new Error(`生成客戶編號失敗: ${error.message}`);
      }

      if (!data) {
        throw new Error('RPC 未返回編號');
      }

      return data;
    } catch (error: any) {
      console.error('生成客戶編號失敗:', error);
      throw new Error(`生成客戶編號失敗: ${error.message || '未知錯誤'}`);
    }
  }

  // ========================================================================
  // 搜尋建議功能 (符合 API 規格)
  // ========================================================================

  /**
   * 獲取搜尋建議 (支援姓名/電話/編號)
   * API 規格: GET /api/customers/search-suggestions?q={query}&limit={limit}
   * 格式: [客戶姓名] - [電話] - [項目編號]
   */
  static async getSearchSuggestions(
    request: SearchRequest
  ): Promise<ApiResponse<SearchSuggestion[]>> {
    try {
      // 符合 API 規格的參數檢查
      if (request.query.length < 2) {
        return {
          data: [],
          error: '請輸入至少 2 個字元後再搜尋'
        };
      }

      const query = request.query.trim();
      const limit = request.limit || 10;

                  // 符合 API 規格的 SQL 查詢
      const { data, error } = await supabase
        .from('customer_personal_data')
        .select('id, customer_id, customer_name, phone')
        .or(`customer_name.ilike.%${query}%,phone.ilike.%${query}%,customer_id.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // 符合 API 規格的回應格式
      const suggestions: SearchSuggestion[] = (data || []).map((item: any) => ({
        id: item.id,
        customer_id: item.customer_id,
        customer_name: item.customer_name,
        phone: item.phone,
        display_text: `${item.customer_name} - ${item.phone}${item.customer_id ? ` - ${item.customer_id}` : ' - 未分配編號'}`
      }));

      return { data: suggestions };
    } catch (error: any) {
      return {
        data: [],
        error: '搜尋建議載入失敗',
        message: error.message
      };
    }
  }

  // ========================================================================
  // 客戶列表管理 (符合 API 規格)
  // ========================================================================

  /**
   * 獲取客戶列表 (支援篩選和分頁)
   * API 規格: GET /api/customers?page={page}&limit={limit}&filters={filters}
   */
  static async getCustomers(
    filters?: CustomerFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<CustomerListItem>> {
    try {
      // 符合 API 規格的查詢欄位
      let query = supabase
        .from('customer_personal_data')
        .select(`
          id,
          customer_id,
          customer_name,
          phone,
          district,
          service_address,
          project_manager,
          created_at,
          customer_type,
          introducer,
          voucher_application_status,
          lds_status,
          home_visit_status,
          copay_level
        `, { count: 'exact' });

      // 符合 API 規格的篩選條件
      if (filters?.customer_type) {
        query = query.eq('customer_type', filters.customer_type);
      }
      if (filters?.district) {
        query = query.eq('district', filters.district);
      }
      if (filters?.introducer) {
        query = query.eq('introducer', filters.introducer);
      }
      if (filters?.project_manager) {
        query = query.eq('project_manager', filters.project_manager);
      }
      if (filters?.lds_status) {
        query = query.eq('lds_status', filters.lds_status);
      }
      if (filters?.voucher_application_status) {
        query = query.eq('voucher_application_status', filters.voucher_application_status);
      }
      if (filters?.search) {
        // 符合 API 規格的搜尋邏輯，處理 customer_id 可能為 null 的情況
        query = query.or(`customer_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,customer_id.ilike.%${filters.search}%`);
      }

      // 符合 API 規格的排序（必須在 range 之前）
      query = query.order('created_at', { ascending: false });

      // 符合 API 規格的分頁
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Supabase 錯誤詳情:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      // 符合 API 規格的回應格式
      return {
        data: data || [],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error: any) {
      console.error('獲取客戶列表失敗:', error);
      return {
        data: [],
        count: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }
  }

  // ========================================================================
  // 客戶 CRUD 操作 (符合 API 規格)
  // ========================================================================

  /**
   * 根據 ID 獲取客戶詳細資料
   * API 規格: GET /api/customers/{customer_id}
   *
   * 智能查詢：自動識別 UUID 或客戶編號格式
   */
  static async getCustomerById(id: string): Promise<ApiResponse<CustomerData>> {
    try {
      console.log('Fetching customer with ID:', id);

      // 使用智能查詢
      const result = await this.queryBySmartId(id, (queryBuilder, idField) =>
        queryBuilder.select('*').eq(idField, id).single()
      );

      const { data, error } = result;

      // 如果第一次查詢失敗，嘗試另一種方式（備用邏輯）
      if (error && error.code === 'PGRST116') {
        console.log('First query failed, trying alternative method...');

        const isUUID = this.isUUID(id);
        const alternativeField = isUUID ? 'customer_id' : 'id';

        const alternativeResult = await supabase
          .from('customer_personal_data')
          .select('*')
          .eq(alternativeField, id)
          .single();

        if (alternativeResult.error) {
          console.error('Database error:', alternativeResult.error);
          throw alternativeResult.error;
        }

        console.log('Customer data found via alternative method:', alternativeResult.data);
        return { data: alternativeResult.data || undefined };
      }

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Customer data found:', data);
      return { data: data || undefined };
    } catch (error: any) {
      console.error('Service error:', error);
      return {
        error: '客戶資料載入失敗',
        message: error.message
      };
    }
  }

  /**
   * 新增客戶
   * 使用 RPC 生成 customer_id，並發安全
   */
  static async createCustomer(formData: CustomerFormData): Promise<{ success: boolean; customer_id?: string; error?: string }> {
    try {
      // 1. 生成客戶編號
      const customerId = await this.generateNextCustomerId(
        formData.customer_type,
        formData.introducer
      );

      // 2. 準備客戶數據
      const customerData = {
        customer_id: customerId,
        customer_type: formData.customer_type,
        customer_name: formData.customer_name,
        service_address: formData.service_address,
        charity_support: formData.charity_support || false,
        phone: formData.phone || null,
        hkid: formData.hkid || null,
        dob: formData.dob || null,
        age: formData.age || null,
        district: formData.district || null,
        health_status: formData.health_status || null,
        introducer: formData.introducer || null,
        voucher_application_status: formData.voucher_application_status || null,
        lds_status: formData.lds_status || null,
        home_visit_status: formData.home_visit_status || null,
        project_manager: formData.staff_owner || null,
        copay_level: formData.copay_level || null,
        voucher_number: formData.voucher_number || null,
        location_latitude: formData.location_latitude || null,
        location_longitude: formData.location_longitude || null,
        created_at: new Date().toISOString()
      };

      // 3. 插入客戶數據
      const { error } = await supabase
        .from('customer_personal_data')
        .insert([customerData]);

      if (error) {
        console.error('Supabase 插入錯誤:', error);
        throw new Error(error.message);
      }

      return {
        success: true,
        customer_id: customerId
      };
    } catch (error: any) {
      console.error('新增客戶失敗:', error);
      return {
        success: false,
        error: error.message || '新增客戶失敗'
      };
    }
  }

  /**
   * 更新客戶資料
   * API 規格: PUT /api/customers/{customer_id}
   *
   * 智能查詢：自動識別 UUID 或客戶編號格式
   */
  static async updateCustomer(id: string, customerData: Partial<CustomerData>): Promise<ApiResponse<CustomerData>> {
    try {
      // 自動計算年齡 (如果更新了出生日期)
      if (customerData.dob) {
        const birthDate = new Date(customerData.dob);
        const today = new Date();
        customerData.age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          customerData.age--;
        }
      }

      // 轉換表單字段到資料庫字段（處理欄位對應）
      const mappedData = { ...customerData };
      
      // 重要：staff_owner (表單) → project_manager (資料庫)
      if ('staff_owner' in mappedData && (mappedData as any).staff_owner) {
        mappedData.project_manager = (mappedData as any).staff_owner as string;
        delete (mappedData as any).staff_owner;
      }

      // 清理空字串，轉為 null 以避免資料庫約束問題
      const cleanedData = Object.fromEntries(
        Object.entries(mappedData).map(([key, value]) => [
          key,
          typeof value === 'string' && value.trim() === '' ? null : value
        ])
      );

      // 使用智能查詢，並允許部分失敗
      const result = await this.queryBySmartId(id, (queryBuilder, idField) =>
        queryBuilder.update(cleanedData).eq(idField, id).select().single()
      );

      if (result.error) {
        console.warn('Update error:', result.error);
        // 如果是約束錯誤，嘗試更寬鬆的更新
        if (result.error.message?.includes('violates')) {
          const essentialData = {
            customer_name: cleanedData.customer_name,
            phone: cleanedData.phone,
            service_address: cleanedData.service_address,
            customer_type: cleanedData.customer_type,
            district: cleanedData.district,
            project_manager: cleanedData.project_manager,
            updated_at: new Date().toISOString()
          };

          const retryResult = await this.queryBySmartId(id, (queryBuilder, idField) =>
            queryBuilder.update(essentialData).eq(idField, id).select().single()
          );

          if (retryResult.error) throw retryResult.error;
          return { data: retryResult.data || undefined };
        }
        throw result.error;
      }

      return { data: result.data || undefined };
    } catch (error: any) {
      console.error('Update customer error:', error);
      return {
        error: '客戶資料更新失敗',
        message: error.message || '更新時發生未知錯誤'
      };
    }
  }

  /**
   * 刪除客戶
   * API 規格: DELETE /api/customers/{customer_id}
   *
   * 智能查詢：自動識別 UUID 或客戶編號格式
   */
  static async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    try {
      // 使用智能查詢
      const result = await this.queryBySmartId(id, (queryBuilder, idField) =>
        queryBuilder.delete().eq(idField, id)
      );

      if (result.error) throw result.error;

      return {};
    } catch (error: any) {
      return {
        error: '客戶刪除失敗',
        message: error.message
      };
    }
  }

  // ========================================================================
  // 驗證函數 (符合 API 規格驗證規則)
  // ========================================================================

  /**
   * 客戶資料驗證 (符合後端驗證規則)
   */
  static validateCustomerData(data: CustomerData): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // 必填欄位檢查
    if (!data.customer_name?.trim()) errors.customer_name = '客戶姓名為必填欄位';
    if (!data.phone?.trim()) errors.phone = '電話為必填欄位';
    if (!data.district?.trim()) errors.district = '地區為必填欄位';
    if (!data.service_address?.trim()) errors.service_address = '服務地址為必填欄位';
    if (!data.hkid?.trim()) errors.hkid = '身份證號碼為必填欄位';
    if (!data.dob?.trim()) errors.dob = '出生日期為必填欄位';
    if (!data.health_status?.trim()) errors.health_status = '身體狀況為必填欄位';
    if (!data.introducer?.trim()) errors.introducer = '介紹人為必填欄位';
    if (!data.project_manager?.trim()) errors.project_manager = '項目經理為必填欄位';

    // 格式驗證
    if (data.phone && !/^[0-9]{8}$/.test(data.phone)) {
      errors.phone = '電話格式錯誤，請輸入 8 位數字';
    }

    if (data.hkid && !/^[A-Z]{1,2}[0-9]{6}([0-9A])$/.test(data.hkid)) {
      errors.hkid = 'HKID 格式錯誤';
    }

    if (data.dob && new Date(data.dob) > new Date()) {
      errors.dob = '出生日期不能是未來日期';
    }

    // 條件性欄位檢查
    if (data.voucher_application_status === '已經持有') {
      if (!data.voucher_number?.trim()) {
        errors.voucher_number = 'voucher_number：只有 voucher_application_status=已經持有 時必填';
      }
      if (!data.copay_level?.trim()) {
        errors.copay_level = '請選擇自付比例（copay_level）';
      }
    }

    if (data.copay_level === '5%' && data.charity_support === undefined) {
      errors.charity_support = 'copay_level 為 5% 時，必須選擇慈善資助（charity_support）';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * 獲取本月社區券客戶服務使用情況，按所屬項目分組
   * @returns 本月服務使用統計，按所屬項目分組
   */
  static async getMonthlyVoucherServiceUsage(): Promise<Record<string, number>> {
    try {
      // 獲取當前月份的開始和結束日期
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      // 使用本地日期格式避免時區問題
      const formatDateLocal = (y: number, m: number, d: number) => 
        `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const startOfMonth = formatDateLocal(currentYear, currentMonth, 1);
      const endOfMonth = formatDateLocal(currentYear, currentMonth, lastDayOfMonth);

      console.log('=== Monthly Voucher Service Usage Query ===');
      console.log('Current date:', formatDateLocal(currentYear, currentMonth, now.getDate()));
      console.log('Current year:', currentYear);
      console.log('Current month (0-indexed):', currentMonth);
      console.log('Current month (display):', currentMonth + 1);
      console.log('Date range:', { startOfMonth, endOfMonth });
      console.log('Grouping by project_category instead of introducer');

      // Step 1: 首先獲取所有社區券客戶
      console.log('Step 1: Fetching 社區券客戶 from customer_personal_data...');
      const { data: voucherCustomers, error: customerError } = await supabase
        .from('customer_personal_data')
        .select('customer_name')
        .eq('customer_type', '社區券客戶');

      if (customerError) {
        console.error('Error querying voucher customers:', customerError);
        return {};
      }

      if (!voucherCustomers || voucherCustomers.length === 0) {
        console.log('No 社區券客戶 found in customer_personal_data');
        return {};
      }

      console.log(`Found ${voucherCustomers.length} 社區券客戶`);
      
      // 獲取客戶姓名列表
      const voucherCustomerNames = voucherCustomers.map((c: any) => c.customer_name).filter(Boolean);
      console.log('Voucher customer names:', voucherCustomerNames.slice(0, 5), '...'); // Log first 5 names

      if (voucherCustomerNames.length === 0) {
        console.log('No customer names found');
        return {};
      }

      // Step 2: 查詢 billing_salary_data 表中本月這些客戶的服務記錄（所有project_category）
      console.log('Step 2: Querying billing_salary_data for current month...');
      const { data: billingData, error: billingError } = await supabase
        .from('billing_salary_data')
        .select('customer_name, service_date, project_category')
        .gte('service_date', startOfMonth)
        .lte('service_date', endOfMonth)
        .in('customer_name', voucherCustomerNames);

      if (billingError) {
        console.error('Error querying billing_salary_data:', billingError);
        return {};
      }

      if (!billingData || billingData.length === 0) {
        console.log('No billing records found for voucher customers in current month');
        return {};
      }

      console.log(`Found ${billingData.length} billing records for current month`);

      // Step 3: 按所屬項目(project_category)分組計算服務人數（排除MC街客）
      const projectCategoryServiceCount = new Map<string, Set<string>>();
      
      billingData.forEach((record: any) => {
        const projectCategory = record.project_category || '未知';
        
        // 跳過 MC街客，只統計社區券相關項目
        if (projectCategory === 'MC街客') {
          return;
        }
        
        if (!projectCategoryServiceCount.has(projectCategory)) {
          projectCategoryServiceCount.set(projectCategory, new Set());
        }
        
        // 使用 Set 確保同一個客戶在同一項目下只被計算一次
        projectCategoryServiceCount.get(projectCategory)!.add(record.customer_name);
      });

      // Step 4: 轉換為最終結果格式
      const result: Record<string, number> = {};
      projectCategoryServiceCount.forEach((customerSet, projectCategory) => {
        result[projectCategory] = customerSet.size;
      });

      console.log('Monthly voucher service usage by project_category:', result);
      console.log('Total customers served:', Object.values(result).reduce((sum, count) => sum + count, 0));
      
      return result;

    } catch (error) {
      console.error('Error in getMonthlyVoucherServiceUsage:', error);
      return {};
    }
  }

  /**
   * 獲取過往月份社區券客戶服務使用情況（最近6個月）
   * @returns 過往月份服務使用統計數組
   */
  static async getHistoricalMonthlyVoucherServiceUsage(): Promise<Array<{
    month: string;
    year: number;
    monthNum: number;
    totalCount: number;
    byCategory: Record<string, number>;
  }>> {
    try {
      const results = [];
      const now = new Date();
      
      // 獲取過去6個月的數據
      for (let i = 1; i <= 6; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        
        const formatDateLocal = (y: number, m: number, d: number) => 
          `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        const startOfMonth = formatDateLocal(year, month, 1);
        const endOfMonth = formatDateLocal(year, month, lastDayOfMonth);

        // 獲取社區券客戶
        const { data: voucherCustomers, error: customerError } = await supabase
          .from('customer_personal_data')
          .select('customer_name')
          .eq('customer_type', '社區券客戶');

        if (customerError || !voucherCustomers || voucherCustomers.length === 0) {
          continue;
        }

        const voucherCustomerNames = voucherCustomers.map((c: any) => c.customer_name).filter(Boolean);

        // 查詢該月份的服務記錄
        const { data: billingData, error: billingError } = await supabase
          .from('billing_salary_data')
          .select('customer_name, service_date, project_category')
          .gte('service_date', startOfMonth)
          .lte('service_date', endOfMonth)
          .in('customer_name', voucherCustomerNames);

        if (billingError || !billingData || billingData.length === 0) {
          results.push({
            month: `${year}年${month + 1}月`,
            year,
            monthNum: month + 1,
            totalCount: 0,
            byCategory: {}
          });
          continue;
        }

        // 按項目分類統計
        const projectCategoryServiceCount = new Map<string, Set<string>>();
        
        billingData.forEach((record: any) => {
          const projectCategory = record.project_category || '未知';
          
          if (projectCategory === 'MC街客') {
            return;
          }
          
          if (!projectCategoryServiceCount.has(projectCategory)) {
            projectCategoryServiceCount.set(projectCategory, new Set());
          }
          
          projectCategoryServiceCount.get(projectCategory)!.add(record.customer_name);
        });

        const byCategory: Record<string, number> = {};
        let totalCount = 0;
        projectCategoryServiceCount.forEach((customerSet, projectCategory) => {
          byCategory[projectCategory] = customerSet.size;
          totalCount += customerSet.size;
        });

        results.push({
          month: `${year}年${month + 1}月`,
          year,
          monthNum: month + 1,
          totalCount,
          byCategory
        });
      }

      return results.reverse(); // 由舊到新排序
    } catch (error) {
      console.error('Error in getHistoricalMonthlyVoucherServiceUsage:', error);
      return [];
    }
  }

  /**
   * 獲取明家街客當月使用情況
   * @returns 當月明家街客服務使用統計
   */
  static async getMCStreetCustomerMonthlyUsage(): Promise<{
    totalCustomers: number;
    servedCustomers: number;
    serviceCount: number;
    customerDetails: Array<{
      customerName: string;
      serviceCount: number;
    }>;
  }> {
    try {
      // 獲取當前月份的開始和結束日期
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const formatDateLocal = (y: number, m: number, d: number) => 
        `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const startOfMonth = formatDateLocal(currentYear, currentMonth, 1);
      const endOfMonth = formatDateLocal(currentYear, currentMonth, lastDayOfMonth);

      console.log('=== MC Street Customer Monthly Usage ===');
      console.log('Date range:', { startOfMonth, endOfMonth });

      // Step 1: 獲取所有明家街客客戶
      const { data: mcCustomers, error: customerError } = await supabase
        .from('customer_personal_data')
        .select('customer_name')
        .eq('customer_type', '明家街客');

      if (customerError) {
        console.error('Error querying MC street customers:', customerError);
        return {
          totalCustomers: 0,
          servedCustomers: 0,
          serviceCount: 0,
          customerDetails: []
        };
      }

      const totalCustomers = mcCustomers?.length || 0;
      
      if (!mcCustomers || mcCustomers.length === 0) {
        console.log('No MC street customers found');
        return {
          totalCustomers: 0,
          servedCustomers: 0,
          serviceCount: 0,
          customerDetails: []
        };
      }

      const mcCustomerNames = mcCustomers.map((c: any) => c.customer_name).filter(Boolean);

      // Step 2: 查詢本月服務記錄（project_category = 'MC街客'）
      const { data: billingData, error: billingError } = await supabase
        .from('billing_salary_data')
        .select('customer_name, service_date')
        .gte('service_date', startOfMonth)
        .lte('service_date', endOfMonth)
        .eq('project_category', 'MC街客')
        .in('customer_name', mcCustomerNames);

      if (billingError) {
        console.error('Error querying MC street billing data:', billingError);
        return {
          totalCustomers,
          servedCustomers: 0,
          serviceCount: 0,
          customerDetails: []
        };
      }

      const serviceCount = billingData?.length || 0;
      
      if (!billingData || billingData.length === 0) {
        console.log('No MC street service records found for current month');
        return {
          totalCustomers,
          servedCustomers: 0,
          serviceCount: 0,
          customerDetails: []
        };
      }

      // Step 3: 統計每個客戶的服務次數
      const customerServiceMap = new Map<string, number>();
      billingData.forEach((record: any) => {
        const count = customerServiceMap.get(record.customer_name) || 0;
        customerServiceMap.set(record.customer_name, count + 1);
      });

      const customerDetails = Array.from(customerServiceMap.entries())
        .map(([customerName, count]) => ({
          customerName,
          serviceCount: count
        }))
        .sort((a, b) => b.serviceCount - a.serviceCount);

      const servedCustomers = customerServiceMap.size;

      console.log('MC Street Monthly Usage:', {
        totalCustomers,
        servedCustomers,
        serviceCount,
        customerDetails: customerDetails.slice(0, 5)
      });

      return {
        totalCustomers,
        servedCustomers,
        serviceCount,
        customerDetails
      };
    } catch (error) {
      console.error('Error in getMCStreetCustomerMonthlyUsage:', error);
      return {
        totalCustomers: 0,
        servedCustomers: 0,
        serviceCount: 0,
        customerDetails: []
      };
    }
  }

  /**
   * 獲取各介紹人當月活躍客戶數據
   * @returns 介紹人當月活躍客戶統計
   */
  static async getIntroducerMonthlyActiveCustomers(): Promise<Record<string, {
    activeCount: number;
    activeCustomers: string[];
  }>> {
    try {
      // 獲取當前月份的開始和結束日期
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const formatDateLocal = (y: number, m: number, d: number) => 
        `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const startOfMonth = formatDateLocal(currentYear, currentMonth, 1);
      const endOfMonth = formatDateLocal(currentYear, currentMonth, lastDayOfMonth);

      console.log('=== Introducer Monthly Active Customers ===');
      console.log('Date range:', { startOfMonth, endOfMonth });

      // Step 1: 獲取所有客戶及其介紹人
      const { data: allCustomers, error: customerError } = await supabase
        .from('customer_personal_data')
        .select('customer_name, introducer');

      if (customerError) {
        console.error('Error querying customers:', customerError);
        return {};
      }

      // 過濾有介紹人的客戶
      const customersWithIntroducer = (allCustomers || []).filter(
        (c: any) => c.introducer && c.introducer.trim() !== ''
      );

      console.log('Customers with introducer found:', customersWithIntroducer.length);

      if (!customersWithIntroducer || customersWithIntroducer.length === 0) {
        console.log('No customers with introducer found');
        return {};
      }

      // 建立客戶名到介紹人的映射
      const customerToIntroducer = new Map<string, string>();
      customersWithIntroducer.forEach((c: any) => {
        if (c.customer_name && c.introducer) {
          customerToIntroducer.set(c.customer_name, c.introducer);
        }
      });

      const customerNames = Array.from(customerToIntroducer.keys());
      console.log('Customer names to search:', customerNames.length, 'first 5:', customerNames.slice(0, 5));

      // Step 2: 查詢本月所有服務記錄
      const { data: billingData, error: billingError } = await supabase
        .from('billing_salary_data')
        .select('customer_name')
        .gte('service_date', startOfMonth)
        .lte('service_date', endOfMonth);

      if (billingError) {
        console.error('Error querying billing data:', billingError);
        return {};
      }

      console.log('All billing records this month:', billingData?.length || 0);

      if (!billingData || billingData.length === 0) {
        console.log('No billing records found this month');
        return {};
      }

      // 獲取所有本月有服務的客戶名
      const activeCustomerNames = new Set(billingData.map((r: any) => r.customer_name));
      console.log('Active customer names this month:', activeCustomerNames.size);

      // Step 3: 統計每個介紹人的活躍客戶
      const introducerActiveCustomers = new Map<string, Set<string>>();
      
      customerNames.forEach((customerName) => {
        if (activeCustomerNames.has(customerName)) {
          const introducer = customerToIntroducer.get(customerName);
          if (introducer) {
            if (!introducerActiveCustomers.has(introducer)) {
              introducerActiveCustomers.set(introducer, new Set());
            }
            introducerActiveCustomers.get(introducer)!.add(customerName);
          }
        }
      });

      // Step 4: 轉換為結果格式
      const result: Record<string, { activeCount: number; activeCustomers: string[] }> = {};
      introducerActiveCustomers.forEach((customerSet, introducer) => {
        result[introducer] = {
          activeCount: customerSet.size,
          activeCustomers: Array.from(customerSet)
        };
      });

      console.log('Introducer monthly active customers result:', result);
      console.log('Introducers with active customers:', Object.keys(result).length);
      return result;

    } catch (error) {
      console.error('Error in getIntroducerMonthlyActiveCustomers:', error);
      return {};
    }
  }
}
