// 客戶管理中心 - TypeScript 類型定義
// 基於開發需求 v1

// ========================================================================
// 客戶編號生成相關
// ========================================================================

export interface CustomerIdGenerationRequest {
  customer_type: '社區券客戶' | '明家街客' | '家訪客戶';
  introducer: string;
}

export interface CustomerIdGenerationResponse {
  customer_id: string;
  prefix: string;
  sequence: number;
}

// ========================================================================
// 搜尋建議相關
// ========================================================================

export interface SearchSuggestion {
  id: string;
  customer_id: string;
  customer_name: string;
  phone: string;
  display_text: string; // [客戶姓名] - [電話] - [項目編號]
}

export interface SearchRequest {
  query: string; // 最少 2 個字元
  limit?: number; // 默認 10
}

// ========================================================================
// 客戶表單相關
// ========================================================================

// 基本客戶資料 (顯示用)
export interface CustomerListItem {
  id: string;
  customer_id: string;
  customer_name: string;
  phone: string;
  district: string;
  service_address: string;
  project_manager: string;
  created_at: string;
  updated_at?: string; // 最後更新時間（可選，如果不存在則使用 created_at）
  customer_type: string;
  introducer?: string;
  voucher_application_status?: string;
  lds_status?: string;
  home_visit_status?: string;
  copay_level?: string;
}

// 完整客戶資料 (編輯用)
export interface CustomerData {
  id?: string;
  customer_id?: string;
  customer_type: '社區券客戶' | '明家街客' | '家訪客戶';
  customer_name: string;
  phone: string;
  district: string;
  service_address: string;
  hkid: string;
  dob: string;
  age?: number; // 自動計算
  health_status: string;
  introducer: string;
  project_manager: string;

  // 社區券相關欄位 (條件顯示)
  voucher_application_status?: '申請中' | '已經持有';
  voucher_number?: string; // 已經持有時必填
  copay_level?: '5%' | '8%' | '12%' | '16%' | '25%' | '40%'; // 已經持有時必選
  charity_support?: boolean; // copay_level=5%時必選
  lds_status?: '已完成評估' | '已經持有' | '待社工評估';
  home_visit_status?: '已完成' | '未完成';

  created_at?: string;
}

// 表單驗證錯誤
export interface ValidationErrors {
  [key: string]: string;
}

// ========================================================================
// 篩選和檢視相關
// ========================================================================

export interface CustomerFilters {
  search?: string;
  customer_type?: string;
  district?: string;
  introducer?: string;
  project_manager?: string;
  lds_status?: string;
  voucher_application_status?: string;
}

export type ViewMode = 'card' | 'list';

// ========================================================================
// API 回應格式
// ========================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ========================================================================
// Enum 選項 (從數據庫結構對應)
// ========================================================================

export const CUSTOMER_TYPE_OPTIONS = ['社區券客戶', '明家街客', '家訪客戶'] as const;

export const DISTRICT_OPTIONS = [
  '中西區', '九龍城區', '元朗區', '北區', '南區', '大埔區',
  '屯門區', '東區', '沙田區', '油尖旺區', '深水埗區', '灣仔區',
  '荃灣區', '葵青區', '西貢區', '觀塘區', '離島區', '黃大仙區',
  '未分類（醫院,院舍)'
] as const;

export const HEALTH_STATUS_OPTIONS = [
  '良好', '中風', '需協助', '長期病患', '認知障礙'
] as const;

export const INTRODUCER_OPTIONS = [
  'Kanas Leung', 'Joe Cheung', 'Candy Ho', 'Tracy Yau', 'Steven Kwok',
  'Dr.Lee', 'Annie', 'Janet', '陸sir', '吳翹政', '余翠英',
  '陳小姐MC01', '曾先生', 'raymond'
] as const;

export const PROJECT_MANAGER_OPTIONS = [
  'Kanas Leung', 'Joe Cheung', 'Candy Ho', 'Tracy Yau'
] as const;

export const VOUCHER_APPLICATION_STATUS_OPTIONS = [
  '申請中', '已經持有'
] as const;

export const COPAY_LEVEL_OPTIONS = [
  '5%', '8%', '12%', '16%', '25%', '40%'
] as const;

export const LDS_STATUS_OPTIONS = [
  '已完成評估', '已經持有', '待社工評估'
] as const;

export const HOME_VISIT_STATUS_OPTIONS = [
  '已完成', '未完成'
] as const;
