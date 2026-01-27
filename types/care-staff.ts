// 護理人員管理 - TypeScript 類型定義
// 基於實際 Supabase 資料庫結構：care_staff_profiles

// ========================================================================
// 列舉類型（基於實際 ENUM）
// ========================================================================

export type Gender = '男' | '女'
export type ContractStatus = '同意' | '不同意'
export type CovidVaccine = '1針' | '2針' | '3針' | '4針' | '無接種' | 'Other'

// 偏好區域（基於 preferred_area_enum）
export type PreferredArea = 
  | '所有區域' | '灣仔區' | '中西區' | '東區' | '南區' 
  | '油尖旺區' | '深水埗區' | '九龍城區' | '黃大仙區' | '觀塘區' 
  | '西貢區' | '沙田區' | '大埔區' | '北區' | '荃灣區' 
  | '屯門區' | '元朗區' | '葵青區' | '離島區'

// 語言選項（基於 language_options 表）
export type LanguageOption = 
  | '廣東話' | '英文' | '普通話' | '福建話' 
  | '潮州話' | '客家話' | '上海話' | '四邑話'

// 職位選項（基於 job_position_options 表）
export type JobPositionOption = 
  | '陪診員 (Medical Escort)' | '居家照顧員(PCW)' | '家務助理(Housekeeper)'
  | '醫護支援人員(CRSW)' | '保健員(HCW)' | '登記護士(EN)' 
  | '註冊護士(RN)' | '護士學生' | '中國護士' | '註冊營養師(Dietitian)'
  | '職業治療師(OT)' | '言語治療師(ST)' | '物理治療師(PT)' 
  | '醫生(Doctor)' | '抽血員(Phlebotomist)' | '物理治療助理 (PTA)' | '職業治療助理 (OTA)'

// ========================================================================
// 護理人員基本資料（完全對應 care_staff_profiles 表）
// ========================================================================

export interface CareStaff {
  // 系統欄位
  id: string // uuid
  staff_id?: string | null // 員工編號（自動生成觸發器）
  created_at: string // timestamptz

  // 基本資料
  name_chinese?: string | null
  name_english?: string | null
  phone?: string | null
  email?: string | null
  hkid?: string | null // 身份證號碼
  dob?: string | null // 出生日期（date）
  gender?: Gender | null
  nationality?: string | null
  address?: string | null // 住址
  preferred_area?: PreferredArea | null

  // 聯絡資料
  emergency_contact?: string | null
  emergency_contact_phone?: string | null

  // 多選欄位（來自對應的 options 表）
  language?: string[] | null // 對應 language_options
  job_position?: string[] | null // 對應 job_position_options

  // 工作經驗
  experience_years?: string | null // 注意：資料庫是 text 類型
  covid_vaccine?: CovidVaccine | null
  referrer?: string | null // 介紹人姓名
  referrer_phone?: string | null

  // 前雇主資料
  company_name?: string | null
  company_position?: string | null
  employment_period?: string | null
  main_duties?: string | null

  // 文件連結
  profile_photo_url?: string | null // 個人照片
  hkid_copy_url?: string | null
  certificate_1?: string | null
  certificate_2?: string | null
  certificate_3?: string | null
  certificate_4?: string | null
  certificate_5?: string | null
  scrc_status?: string | null

  // 合約狀態
  contract_status?: ContractStatus | null
}

// ========================================================================
// 列表顯示類型
// ========================================================================

export interface CareStaffListItem {
  id: string
  staff_id?: string | null
  name_chinese?: string | null
  phone?: string | null
  preferred_area?: PreferredArea | null
  contract_status?: ContractStatus | null
  created_at: string
  job_position?: string[] | null // 用於顯示主要職位
}

// ========================================================================
// 搜尋與篩選
// ========================================================================

export interface CareStaffFilters {
  search?: string // 搜尋護理人員姓名、電話、員工編號
  gender?: Gender
  preferred_area?: PreferredArea
  contract_status?: ContractStatus
  job_position?: JobPositionOption // 篩選特定職位
  covid_vaccine?: CovidVaccine
  has_certificate?: boolean // 是否有證書
  language?: LanguageOption // 篩選特定語言
}

export interface CareStaffSearchSuggestion {
  id: string
  name_chinese: string
  staff_id?: string | null
  phone?: string | null
  match_type: 'name' | 'phone' | 'staff_id' | 'mixed'
}

// ========================================================================
// 表單類型
// ========================================================================

export interface CareStaffFormData {
  // 基本資料（必填）
  name_chinese: string
  phone: string

  // 基本資料（選填）
  name_english?: string
  email?: string
  hkid?: string
  dob?: string
  gender?: Gender
  nationality?: string
  preferred_area?: PreferredArea
  address?: string

  // 聯絡資料
  emergency_contact?: string
  emergency_contact_phone?: string

  // 多選欄位
  language?: LanguageOption[]
  job_position?: JobPositionOption[]

  // 工作經驗
  experience_years?: string
  covid_vaccine?: CovidVaccine
  referrer?: string
  referrer_phone?: string

  // 前雇主資料
  company_name?: string
  company_position?: string
  employment_period?: string
  main_duties?: string

  // 合約狀態
  contract_status?: ContractStatus
}

export interface CareStaffFormErrors {
  name_chinese?: string
  phone?: string
  email?: string
  hkid?: string
  dob?: string
  experience_years?: string
  [key: string]: string | undefined
}

// ========================================================================
// 檔案上載
// ========================================================================

export interface CareStaffFileUpload {
  field_name: 'profile_photo_url' | 'hkid_copy_url' | 'certificate_1' | 'certificate_2' | 'certificate_3' | 'certificate_4' | 'certificate_5' | 'scrc_status'
  file: File
  preview_url?: string
}

export interface CareStaffFileInfo {
  field_name: string
  file_name: string
  file_url: string
  file_size?: number
  uploaded_at?: string
}

// ========================================================================
// API 響應類型
// ========================================================================

export interface CareStaffListResponse {
  data: CareStaffListItem[]
  count: number
  total_pages: number
  current_page: number
  page_size: number
}

export interface CareStaffDetailResponse {
  data: CareStaff | null
  error?: string
}

export interface CareStaffSuggestionsResponse {
  data: CareStaffSearchSuggestion[]
  count: number
}

export interface CareStaffOptionsResponse {
  languages: Array<{ id: number; label: string }>
  job_positions: Array<{ id: number; label: string }>
}

// ========================================================================
// UI 狀態類型
// ========================================================================

export type ViewMode = 'list' | 'card'
export type SortField = 'name_chinese' | 'staff_id' | 'created_at' | 'preferred_area' | 'contract_status'
export type SortDirection = 'asc' | 'desc'

export interface CareStaffSort {
  field: SortField
  direction: SortDirection
}

// ========================================================================
// 驗證規則
// ========================================================================

export interface CareStaffValidationRules {
  name_chinese: {
    required: true
    min_length: 2
    max_length: 50
  }
  phone: {
    required: true
    pattern: RegExp // 香港電話號碼格式
  }
  email: {
    pattern: RegExp // 電郵格式
  }
  hkid: {
    pattern: RegExp // 香港身份證格式
  }
  experience_years: {
    pattern: RegExp // 數字格式
  }
}
