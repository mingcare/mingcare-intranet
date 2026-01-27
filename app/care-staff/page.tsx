'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { CareStaffManagementService } from '../../services/care-staff-management'
import { FileUploadCard } from '../../components/FileUploadCard'
import LoadingScreen from '../../components/LoadingScreen'
import { FileUploadService } from '../../services/file-upload'
import CardUpdateIndicator from '../../components/CardUpdateIndicator'
import type {
  CareStaff,
  CareStaffListItem,
  CareStaffFilters,
  ViewMode,
  CareStaffSearchSuggestion,
  CareStaffSort,
  SortField,
  SortDirection,
  CareStaffFormData,
  Gender,
  PreferredArea
} from '../../types/care-staff'

interface User {
  id: string
  email?: string
}

export default function CareStaffPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [careStaff, setCareStaff] = useState<CareStaffListItem[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [filters, setFilters] = useState<CareStaffFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<CareStaffSearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [sort, setSort] = useState<CareStaffSort>({ field: 'created_at', direction: 'desc' })
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // 追蹤每個護理人員的更新時間
  const [staffUpdateTimes, setStaffUpdateTimes] = useState<Record<string, Date>>({})

  // 從 localStorage 載入所有護理人員的更新時間（頁面載入時）
  useEffect(() => {
    const loadStaffUpdateTimes = () => {
      const times: Record<string, Date> = {}
      const now = new Date()
      
      // 遍歷所有 localStorage 項目，找出護理人員更新時間
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('staff_update_')) {
          const staffId = key.replace('staff_update_', '')
          const timeStr = localStorage.getItem(key)
          if (timeStr) {
            const updateTime = new Date(timeStr)
            const diffInMinutes = (now.getTime() - updateTime.getTime()) / (1000 * 60)
            
            // 只加載30分鐘內的更新時間
            if (diffInMinutes < 30) {
              times[staffId] = updateTime
            } else {
              // 清除超過30分鐘的舊記錄
              localStorage.removeItem(key)
            }
          }
        }
      }
      
      setStaffUpdateTimes(times)
    }

    loadStaffUpdateTimes()
  }, [])

  // Drawer 編輯狀態
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<CareStaff | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // 文件上載狀態
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
  const [fileUploadDisabled, setFileUploadDisabled] = useState(false)

  // 選項數據
  const [languageOptions, setLanguageOptions] = useState<Array<{id: number, label: string}>>([])
  const [jobPositionOptions, setJobPositionOptions] = useState<Array<{id: number, label: string}>>([])
  const [optionsLoading, setOptionsLoading] = useState(false)

  const router = useRouter()

  // 確保只在客戶端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 計算下拉選單位置
  const updateDropdownPosition = () => {
    if (!searchInputRef.current) return

    const rect = searchInputRef.current.getBoundingClientRect()
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    setDropdownPosition({
      top: rect.bottom + scrollY + 2,
      left: rect.left + scrollX,
      width: rect.width
    })
  }

  // 職位顏色配置
  const getJobPositionColor = (position: string) => {
    // 簡化職位名稱（去除英文部分）
    const simplifiedPosition = position.replace(/\s*\([^)]*\)/g, '').trim()

    const colorMap: { [key: string]: string } = {
      '陪診員': 'bg-blue-100 text-blue-800',
      '居家照顧員': 'bg-green-100 text-green-800',
      '家務助理': 'bg-yellow-100 text-yellow-800',
      '醫護支援人員': 'bg-purple-100 text-purple-800',
      '保健員': 'bg-cyan-100 text-cyan-800',
      '登記護士': 'bg-indigo-100 text-indigo-800',
      '註冊護士': 'bg-blue-100 text-blue-800',
      '護士學生': 'bg-sky-100 text-sky-800',
      '中國護士': 'bg-teal-100 text-teal-800',
      '註冊營養師': 'bg-orange-100 text-orange-800',
      '職業治療師': 'bg-emerald-100 text-emerald-800',
      '言語治療師': 'bg-rose-100 text-rose-800',
      '物理治療師': 'bg-lime-100 text-lime-800',
      '醫生': 'bg-red-100 text-red-800',
      '抽血員': 'bg-pink-100 text-pink-800',
      '物理治療助理': 'bg-amber-100 text-amber-800',
      '職業治療助理': 'bg-violet-100 text-violet-800'
    }

    return colorMap[simplifiedPosition] || 'bg-bg-tertiary text-text-primary'
  }

  // 簡化職位名稱
  const simplifyJobPosition = (position: string) => {
    return position.replace(/\s*\([^)]*\)/g, '').trim()
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await loadCareStaff()
      } else {
        router.push('/')
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  // 重置選中的建議索引當建議列表改變時
  useEffect(() => {
    setSelectedSuggestionIndex(-1)
  }, [searchSuggestions])

  // 監聽位置變化
  useEffect(() => {
    if (!showSuggestions) return

    const handleScroll = () => updateDropdownPosition()
    const handleResize = () => updateDropdownPosition()

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [showSuggestions])

  // 監聽護理人員更新事件
  useEffect(() => {
    const handleStaffUpdate = (event: any) => {
      if (event?.detail?.staffId) {
        // 處理自定義事件
        const staffId = event.detail.staffId
        const updateTime = localStorage.getItem(`staff_update_${staffId}`)
        if (updateTime) {
          setStaffUpdateTimes(prev => ({
            ...prev,
            [staffId]: new Date(updateTime)
          }))
        }
      }
    }

    const handleStorageUpdate = () => {
      // 處理 storage 事件或頁面載入時的檢查
      const updatedStaffInfo = localStorage.getItem('staffUpdated')
      if (updatedStaffInfo) {
        const { staffId, updateTime } = JSON.parse(updatedStaffInfo)
        setStaffUpdateTimes(prev => ({
          ...prev,
          [staffId]: new Date(updateTime)
        }))
        localStorage.removeItem('staffUpdated')
      }
    }

    // 檢查頁面載入時是否有更新
    handleStorageUpdate()

    // 監聽 storage 事件
    window.addEventListener('storage', handleStorageUpdate)
    
    // 監聽自定義事件（同頁面內的更新）
    window.addEventListener('staffUpdated', handleStaffUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageUpdate)
      window.removeEventListener('staffUpdated', handleStaffUpdate)
    }
  }, [])

  // 載入選項數據
  const loadOptions = async () => {
    try {
      setOptionsLoading(true)
      const result = await CareStaffManagementService.getCareStaffOptions()

      setLanguageOptions(result.languages || [])
      setJobPositionOptions(result.job_positions || [])
    } catch (error) {
      console.error('載入選項失敗:', error)
    } finally {
      setOptionsLoading(false)
    }
  }

  // 載入護理人員列表
  const loadCareStaff = async (newFilters?: CareStaffFilters, page = 1, newSort?: CareStaffSort) => {
    try {
      const filtersToUse = newFilters !== undefined ? newFilters : filters
      const sortToUse = newSort !== undefined ? newSort : sort
      const { data, count } = await CareStaffManagementService.getCareStaff(
        filtersToUse,
        page,
        pageSize,
        sortToUse
      )
      setCareStaff(data)
      setTotalCount(count)
    } catch (error) {
      console.error('載入護理人員列表失敗:', error)
    }
  }

  // 中文輸入法狀態
  const [isComposing, setIsComposing] = useState(false)

  // 搜尋建議
  const loadSearchSuggestions = async (query: string) => {
    if (query.length < 1) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      console.log('開始搜尋建議:', query)
      const result = await CareStaffManagementService.getCareStaffSuggestions({ query })
      const suggestions = result.data || []

      console.log('搜尋建議結果:', suggestions.length, '筆')
      setSearchSuggestions(suggestions)

      updateDropdownPosition() // 更新位置
      // 確保有結果時顯示建議，沒有結果時也要更新狀態
      setShowSuggestions(true) // 總是顯示，即使沒有結果也要顯示空狀態
    } catch (error) {
      console.error('載入搜尋建議失敗:', error)
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }

  // 處理搜尋輸入
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    // 如果正在使用中文輸入法，不觸發搜尋
    if (isComposing) {
      return
    }

    // 清除之前的 timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // 根據不同搜尋類型的最小長度要求
    const shouldTriggerSearch = query.length >= 1 // 至少1個字符就可以搜尋（姓名）

    if (shouldTriggerSearch) {
      const timeout = setTimeout(() => {
        loadSearchSuggestions(query)
      }, 200)
      setSearchTimeout(timeout)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }

  // 中文輸入法開始
  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  // 中文輸入法結束
  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false)
    const query = e.currentTarget.value

    // 輸入法結束後，根據新的搜尋邏輯立即觸發搜尋
    const shouldTriggerSearch = query.length >= 1 // 至少1個字符就可以搜尋

    if (shouldTriggerSearch) {
      loadSearchSuggestions(query)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }

    // 處理鍵盤導航（整合搜尋建議導航和原有功能）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 如果有顯示搜尋建議，處理建議列表導航
    if (showSuggestions && searchSuggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedSuggestionIndex(prev =>
            prev < searchSuggestions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchSuggestions.length) {
            handleSuggestionClick(searchSuggestions[selectedSuggestionIndex])
          } else {
            handleSearch()
          }
          break
        case 'Escape':
          setShowSuggestions(false)
          setSelectedSuggestionIndex(-1)
          break
      }
    } else {
      // 原有的鍵盤導航邏輯
      if (e.key === 'Enter') {
        handleSearch()
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    }
  }  // 執行搜尋
  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery
    if (searchTerm.trim()) {
      const newFilters = { ...filters, search: searchTerm.trim() }
      setFilters(newFilters)
      setCurrentPage(1)
      await loadCareStaff(newFilters, 1)
    }
    setShowSuggestions(false)
  }

  // 選擇搜尋建議
  const handleSuggestionClick = (suggestion: CareStaffSearchSuggestion) => {
    // 只填入護理人員姓名，觸發智慧搜尋功能
    setSearchQuery(suggestion.name_chinese)
    setShowSuggestions(false)
    // 觸發實際搜尋
    handleSearch(suggestion.name_chinese)
  }

  // 清除搜尋
  const handleClearSearch = () => {
    setSearchQuery('')
    const newFilters = { ...filters }
    delete newFilters.search
    setFilters(newFilters)
    setCurrentPage(1)
    loadCareStaff(newFilters, 1)
  }

  // 處理排序
  const handleSort = (field: SortField) => {
    const newDirection: SortDirection =
      sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc'
    const newSort = { field, direction: newDirection }
    setSort(newSort)
    setCurrentPage(1)
    loadCareStaff(filters, 1, newSort)
  }

  // 處理編輯護理人員
  const handleEditStaff = async (staff: CareStaffListItem) => {
    try {
      setEditLoading(true)
      // 獲取完整的護理人員數據
      const result = await CareStaffManagementService.getCareStaffById(staff.id)
      if (result.data) {
        setEditingStaff(result.data)
        setIsDrawerOpen(true)

        // 初始化文件 URLs
        setFileUrls({
          profile_photo_url: result.data.profile_photo_url || '',
          hkid_copy_url: result.data.hkid_copy_url || '',
          certificate_1: result.data.certificate_1 || '',
          certificate_2: result.data.certificate_2 || '',
          certificate_3: result.data.certificate_3 || '',
          certificate_4: result.data.certificate_4 || '',
          certificate_5: result.data.certificate_5 || '',
          scrc_status: result.data.scrc_status || '',
        })
      } else {
        alert(result.error || '無法載入護理人員詳細資料')
      }
    } catch (error) {
      console.error('載入護理人員詳細資料失敗:', error)
      alert('載入失敗，請稍後再試')
    } finally {
      setEditLoading(false)
    }
  }

  // 處理刪除護理人員
  const handleDeleteStaff = async (staff: CareStaffListItem) => {
    if (!confirm(`確定要刪除護理人員「${staff.name_chinese}」嗎？\n\n此操作無法復原。`)) {
      return
    }

    try {
      setEditLoading(true)
      const result = await CareStaffManagementService.deleteCareStaff(staff.id)

      if (result.success) {
        // 刪除成功，重新載入列表
        await loadCareStaff()
        setIsDrawerOpen(false)
        setEditingStaff(null)
        alert('護理人員已成功刪除')
      } else {
        alert(result.error || '刪除失敗，請稍後再試')
      }
    } catch (error) {
      console.error('刪除護理人員時發生錯誤:', error)
      alert('刪除失敗，請稍後再試')
    } finally {
      setEditLoading(false)
    }
  }

  // 處理保存編輯
  const handleSaveEdit = async (formData: FormData) => {
    if (!editingStaff) return

    try {
      setSaveLoading(true)

      // 表單驗證
      const name_chinese = formData.get('name_chinese') as string
      const phone = formData.get('phone') as string
      const contract_status = formData.get('contract_status') as string

      // 必填欄位驗證
      if (!name_chinese?.trim()) {
        alert('中文姓名為必填欄位')
        return
      }

      if (!phone?.trim()) {
        alert('聯絡電話為必填欄位')
        return
      }

      // 電話格式驗證（8位數字）
      const phoneRegex = /^\d{8}$/
      if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
        alert('聯絡電話必須為8位數字')
        return
      }

      if (!contract_status) {
        alert('合約狀態為必填欄位')
        return
      }

      // 構建更新數據
      const updateData: Partial<CareStaffFormData> = {
        name_chinese: name_chinese.trim(),
        name_english: (formData.get('name_english') as string)?.trim() || undefined,
        phone: phone.replace(/\s+/g, ''),
        email: (formData.get('email') as string)?.trim() || undefined,
        hkid: (formData.get('hkid') as string)?.trim() || undefined,
        dob: (formData.get('dob') as string) || undefined,
        gender: (formData.get('gender') as string) as Gender || undefined,
        preferred_area: (formData.get('preferred_area') as string) as PreferredArea || undefined,
        emergency_contact: (formData.get('emergency_contact') as string)?.trim() || undefined,
        emergency_contact_phone: (formData.get('emergency_contact_phone') as string)?.trim() || undefined,
      }

      // 更新護理人員資料
      const result = await CareStaffManagementService.updateCareStaff(editingStaff.id, updateData)

      if (result.data) {
        alert('護理人員資料已更新')
        setIsDrawerOpen(false)
        setEditingStaff(null)
        // 重新載入列表
        await loadCareStaff()
      } else {
        alert(result.error || '更新失敗')
      }
    } catch (error) {
      console.error('更新護理人員資料失敗:', error)
      alert('更新失敗，請稍後再試')
    } finally {
      setSaveLoading(false)
    }
  }

  // 處理文件上載成功
  const handleFileUploadSuccess = async (fieldName: string, url: string) => {
    if (!editingStaff) return

    try {
      setFileUploadDisabled(true)

      // 更新本地狀態
      setFileUrls(prev => ({
        ...prev,
        [fieldName]: url
      }))

      // 立即更新資料庫
      const updateData = { [fieldName]: url }
      const result = await CareStaffManagementService.updateCareStaff(editingStaff.id, updateData)

      if (result.data) {
        // 更新編輯中的護理人員資料
        setEditingStaff(prev => prev ? { ...prev, [fieldName]: url } : null)
        alert('檔案上載成功')
      } else {
        // 回寫失敗，還原狀態
        setFileUrls(prev => ({
          ...prev,
          [fieldName]: editingStaff[fieldName as keyof CareStaff] as string || ''
        }))
        alert('更新資料庫失敗，已還原檔案狀態')
      }
    } catch (error) {
      console.error('文件上載回寫失敗:', error)
      // 還原狀態
      setFileUrls(prev => ({
        ...prev,
        [fieldName]: editingStaff[fieldName as keyof CareStaff] as string || ''
      }))
      alert('更新資料庫失敗，已還原檔案狀態')
    } finally {
      setFileUploadDisabled(false)
    }
  }

  // 處理文件移除
  const handleFileRemove = async (fieldName: string) => {
    if (!editingStaff) return

    try {
      setFileUploadDisabled(true)

      // 更新資料庫
      const updateData = { [fieldName]: null }
      const result = await CareStaffManagementService.updateCareStaff(editingStaff.id, updateData)

      if (result.data) {
        // 更新本地狀態
        setFileUrls(prev => ({
          ...prev,
          [fieldName]: ''
        }))

        // 更新編輯中的護理人員資料
        setEditingStaff(prev => prev ? { ...prev, [fieldName]: null } : null)
        alert('檔案連結已移除')
      } else {
        alert('移除失敗，請稍後再試')
      }
    } catch (error) {
      console.error('文件移除失敗:', error)
      alert('移除失敗，請稍後再試')
    } finally {
      setFileUploadDisabled(false)
    }
  }

  // 載入中狀態
  if (loading) {
    return <LoadingScreen message="正在載入護理人員資料..." />
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="card-apple border-b border-border-light fade-in-apple sticky top-0 z-10">
        <div className="px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 lg:py-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-text-primary mb-1 truncate">護理人員管理</h1>
              <p className="text-xs sm:text-sm text-text-secondary hidden sm:block">管理護理人員資料和文件</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-apple-secondary text-xs px-3 py-2 ml-3 flex-shrink-0"
            >
              返回
            </button>
          </div>
        </div>
      </header>

      <main className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
        {/* Search and Filter Section */}
        <div className="card-apple mb-3 sm:mb-4 lg:mb-6 fade-in-apple" style={{ animationDelay: '0.1s' }}>
          <div className="card-apple-content p-3 sm:p-4 lg:p-6">
            {/* Enhanced Search Bar */}
            {/* Search Bar */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    updateDropdownPosition() // 更新位置
                    // 根據新的搜尋邏輯判斷是否顯示建議
                    const shouldShowSuggestions = (
                      searchQuery.length >= 1 && searchSuggestions.length > 0
                    )
                    if (shouldShowSuggestions) {
                      setShowSuggestions(true)
                    }
                  }}
                  onBlur={() => {
                    // 延遲隱藏建議，讓點擊建議有時間執行
                    setTimeout(() => {
                      setShowSuggestions(false)
                    }, 150)
                  }}
                  placeholder="智慧搜尋：姓名1字/員工編號3字/電話4字..."
                  className="w-full pl-8 sm:pl-12 pr-8 sm:pr-12 py-2 sm:py-3 border border-border-light rounded-apple-pill bg-white text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4">{
                  searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="p-1 text-text-tertiary hover:text-text-secondary transition-colors rounded-full hover:bg-bg-tertiary"
                    >
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Search Suggestions Portal */}
              {mounted && showSuggestions && searchQuery.length >= 1 && createPortal(
                <div
                  className="fixed bg-white border border-border-light rounded-apple-sm shadow-apple-card max-h-80 overflow-y-auto z-[9999] scrollbar-thin scrollbar-thumb-bg-tertiary scrollbar-track-transparent"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    minWidth: '300px',
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgb(156 163 175) transparent'
                  }}
                  onMouseDown={(e) => e.preventDefault()} // 防止 blur 事件觸發
                >
                  {searchSuggestions.length > 0 ? (
                    <>
                      {/* 顯示結果數量和鍵盤提示 */}
                      {searchSuggestions.length > 5 && (
                        <div className="px-4 py-2 bg-bg-secondary border-b border-border-light text-xs text-text-secondary">
                          找到 {searchSuggestions.length} 個結果，可上下滾動或使用 ↑↓ 鍵導航
                        </div>
                      )}
                      {searchSuggestions.length <= 5 && searchSuggestions.length > 0 && (
                        <div className="px-4 py-1 bg-bg-secondary border-b border-border-light text-xs text-text-tertiary text-center">
                          使用 ↑↓ 鍵選擇，Enter 確認
                        </div>
                      )}
                      {searchSuggestions.map((suggestion, index) => {
                        const isSelected = index === selectedSuggestionIndex
                        return (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`w-full text-left px-4 py-3 transition-colors border-b border-border-light last:border-b-0 group focus:outline-none ${
                              isSelected
                                ? 'bg-brand-primary text-white'
                                : 'hover:bg-bg-tertiary focus:bg-bg-tertiary'
                            }`}
                            ref={(el) => {
                              // 自動滾動到選中項目
                              if (isSelected && el) {
                                el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className={`text-sm font-medium transition-colors ${
                                  isSelected
                                    ? 'text-white'
                                    : 'text-text-primary group-hover:text-brand-primary group-focus:text-brand-primary'
                                }`}>
                                  {suggestion.name_chinese}
                                </div>
                                <div className={`text-xs mt-1 space-y-1 ${
                                  isSelected ? 'text-blue-100' : 'text-text-secondary'
                                }`}>
                                  {suggestion.staff_id && (
                                    <div className="flex items-center">
                                      <span className="mr-1">👤</span>
                                      <span>{suggestion.staff_id}</span>
                                    </div>
                                  )}
                                  {suggestion.phone && (
                                    <div className="flex items-center">
                                      <span className="mr-1">📞</span>
                                      <span>{suggestion.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                isSelected
                                  ? 'bg-blue-500 text-white'
                                  : 'text-text-tertiary bg-bg-secondary group-hover:bg-brand-secondary group-focus:bg-brand-secondary'
                              }`}>
                                {suggestion.match_type === 'name' && '姓名'}
                                {suggestion.match_type === 'phone' && '電話'}
                                {suggestion.match_type === 'staff_id' && '編號'}
                                {suggestion.match_type === 'mixed' && '混合'}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </>
                  ) : (
                    <div className="px-4 py-6 text-center text-text-secondary">
                      <div className="text-sm mb-2">沒有找到相關護理人員</div>
                      <div className="text-xs">請嘗試其他關鍵字</div>
                    </div>
                  )}
                </div>,
                document.body
              )}
            </div>            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="form-group-apple">
                <label className="form-label-apple text-sm sm:text-base">性別</label>
                <select
                  value={filters.gender || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters }
                    if (e.target.value) {
                      newFilters.gender = e.target.value as '男' | '女'
                    } else {
                      delete newFilters.gender
                    }
                    setFilters(newFilters)
                    setCurrentPage(1)
                    loadCareStaff(newFilters, 1)
                  }}
                  className="form-select-apple text-sm sm:text-base py-2 sm:py-3"
                >
                  <option value="">全部性別</option>
                  <option value="男">男性</option>
                  <option value="女">女性</option>
                </select>
              </div>
              <div className="form-group-apple">
                <label className="form-label-apple text-sm sm:text-base">偏好地區</label>
                <select
                  value={filters.preferred_area || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters }
                    if (e.target.value) {
                      newFilters.preferred_area = e.target.value as any
                    } else {
                      delete newFilters.preferred_area
                    }
                    setFilters(newFilters)
                    setCurrentPage(1)
                    loadCareStaff(newFilters, 1)
                  }}
                  className="form-select-apple text-sm sm:text-base py-2 sm:py-3"
                >
                  <option value="">全部地區</option>
                  <option value="所有區域">所有區域</option>
                  <option value="中西區">中西區</option>
                  <option value="東區">東區</option>
                  <option value="南區">南區</option>
                  <option value="灣仔區">灣仔區</option>
                  <option value="油尖旺區">油尖旺區</option>
                  <option value="深水埗區">深水埗區</option>
                  <option value="九龍城區">九龍城區</option>
                  <option value="黃大仙區">黃大仙區</option>
                  <option value="觀塘區">觀塘區</option>
                  <option value="西貢區">西貢區</option>
                  <option value="沙田區">沙田區</option>
                  <option value="大埔區">大埔區</option>
                  <option value="北區">北區</option>
                  <option value="荃灣區">荃灣區</option>
                  <option value="屯門區">屯門區</option>
                  <option value="元朗區">元朗區</option>
                  <option value="葵青區">葵青區</option>
                  <option value="離島區">離島區</option>
                </select>
              </div>
              <div className="form-group-apple sm:col-span-2 lg:col-span-1">
                <label className="form-label-apple text-sm sm:text-base">職位</label>
                <select
                  value={filters.job_position || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters }
                    if (e.target.value) {
                      newFilters.job_position = e.target.value as any
                    } else {
                      delete newFilters.job_position
                    }
                    setFilters(newFilters)
                    setCurrentPage(1)
                    loadCareStaff(newFilters, 1)
                  }}
                  className="form-select-apple text-sm sm:text-base py-2 sm:py-3"
                >
                  <option value="">全部職位</option>
                  <option value="陪診員 (Medical Escort)">陪診員 (Medical Escort)</option>
                  <option value="居家照顧員(PCW)">居家照顧員(PCW)</option>
                  <option value="家務助理(Housekeeper)">家務助理(Housekeeper)</option>
                  <option value="醫護支援人員(CRSW)">醫護支援人員(CRSW)</option>
                  <option value="保健員(HCW)">保健員(HCW)</option>
                  <option value="登記護士(EN)">登記護士(EN)</option>
                  <option value="註冊護士(RN)">註冊護士(RN)</option>
                  <option value="護士學生">護士學生</option>
                  <option value="中國護士">中國護士</option>
                  <option value="註冊營養師(Dietitian)">註冊營養師(Dietitian)</option>
                  <option value="職業治療師(OT)">職業治療師(OT)</option>
                  <option value="言語治療師(ST)">言語治療師(ST)</option>
                  <option value="物理治療師(PT)">物理治療師(PT)</option>
                  <option value="醫生(Doctor)">醫生(Doctor)</option>
                  <option value="抽血員(Phlebotomist)">抽血員(Phlebotomist)</option>
                  <option value="物理治療助理 (PTA)">物理治療助理 (PTA)</option>
                  <option value="職業治療助理 (OTA)">職業治療助理 (OTA)</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(Object.keys(filters).length > 0 || searchQuery.trim()) && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={async () => {
                    // 清除所有篩選和搜尋狀態
                    setFilters({})
                    setCurrentPage(1)
                    setSearchQuery('')
                    setShowSuggestions(false)

                    // 重新載入全部護理人員（無任何篩選）
                    try {
                      setLoading(true)
                      const { data, count } = await CareStaffManagementService.getCareStaff(
                        {}, // 空篩選條件
                        1,  // 第一頁
                        pageSize
                      )
                      setCareStaff(data)
                      setTotalCount(count)
                    } catch (error) {
                      console.error('重新載入護理人員列表失敗:', error)
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="text-sm text-text-secondary hover:text-text-primary flex items-center space-x-1 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>清除所有篩選</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Controls Section */}
        <div className="card-apple mb-3 sm:mb-4 lg:mb-6 fade-in-apple" style={{ animationDelay: '0.2s' }}>
          <div className="card-apple-content p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-6">
                <span className="text-sm sm:text-base text-text-primary">
                  共 <span className="font-semibold text-primary">{totalCount}</span> 位護理人員
                </span>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-4">
                <div className="flex rounded-apple-sm border border-border-light p-1 bg-bg-tertiary">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-apple-xs transition-all duration-300 ${
                      viewMode === 'card'
                        ? 'bg-white text-primary shadow-apple'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="hidden sm:inline">卡片檢視</span>
                      <span className="sm:hidden">卡片</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-apple-xs transition-all duration-300 ${
                      viewMode === 'list'
                        ? 'bg-white text-primary shadow-apple'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span className="hidden sm:inline">列表檢視</span>
                      <span className="sm:hidden">列表</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="card-apple fade-in-apple" style={{ animationDelay: '0.3s' }}>
          <div className="card-apple-content p-3 sm:p-4 lg:p-6">
            {careStaff.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-apple-heading text-text-primary mb-2">
                  {Object.keys(filters).length > 0 ? '沒有符合條件的護理人員' : '暫無護理人員資料'}
                </h3>
                <p className="text-apple-body text-text-secondary mb-6">
                  {Object.keys(filters).length > 0
                    ? '請嘗試調整搜尋條件或篩選器'
                    : '目前還沒有護理人員資料'}
                </p>
              </div>
            ) : (
              /* Data Display */
              <>
                {viewMode === 'list' ? (
                  /* List View */
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-light">
                      <thead className="bg-bg-secondary">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSort('name_chinese')}
                              className="flex items-center space-x-1 text-xs font-medium text-text-tertiary uppercase tracking-wider hover:text-text-primary transition-colors"
                            >
                              <span>護理人員</span>
                              {sort.field === 'name_chinese' && (
                                <svg className={`h-3 w-3 transform ${sort.direction === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSort('staff_id')}
                              className="flex items-center space-x-1 text-xs font-medium text-text-tertiary uppercase tracking-wider hover:text-text-primary transition-colors"
                            >
                              <span>員工編號</span>
                              {sort.field === 'staff_id' && (
                                <svg className={`h-3 w-3 transform ${sort.direction === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSort('preferred_area')}
                              className="flex items-center space-x-1 text-xs font-medium text-text-tertiary uppercase tracking-wider hover:text-text-primary transition-colors"
                            >
                              <span>偏好地區</span>
                              {sort.field === 'preferred_area' && (
                                <svg className={`h-3 w-3 transform ${sort.direction === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            職位
                          </th>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSort('contract_status')}
                              className="flex items-center space-x-1 text-xs font-medium text-text-tertiary uppercase tracking-wider hover:text-text-primary transition-colors"
                            >
                              <span>合約狀態</span>
                              {sort.field === 'contract_status' && (
                                <svg className={`h-3 w-3 transform ${sort.direction === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSort('created_at')}
                              className="flex items-center space-x-1 text-xs font-medium text-text-tertiary uppercase tracking-wider hover:text-text-primary transition-colors"
                            >
                              <span>建立日期</span>
                              {sort.field === 'created_at' && (
                                <svg className={`h-3 w-3 transform ${sort.direction === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              )}
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-border-light">
                        {careStaff.map((staff, index) => (
                          <tr
                            key={staff.id}
                            className="hover:bg-bg-tertiary transition-colors cursor-pointer"
                            onClick={() => handleEditStaff(staff)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-apple-body text-text-primary font-medium">
                                  {staff.name_chinese}
                                </div>
                                <div className="text-apple-caption text-text-secondary">
                                  {staff.phone}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-apple-caption text-text-secondary">
                              {staff.staff_id || '沒有提供'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-apple-caption text-text-secondary">
                              {staff.preferred_area || '沒有提供'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {staff.job_position && staff.job_position.length > 0 ? (
                                  staff.job_position.map((position, idx) => (
                                    <span
                                      key={idx}
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getJobPositionColor(position)}`}
                                    >
                                      {simplifyJobPosition(position)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-bg-tertiary text-text-primary">
                                    沒有提供
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                staff.contract_status === '同意'
                                  ? 'bg-green-100 text-green-800'
                                  : staff.contract_status === '不同意'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-bg-tertiary text-text-primary'
                              }`}>
                                {staff.contract_status || '沒有提供'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-apple-caption text-text-secondary">
                              {new Date(staff.created_at).toLocaleDateString('zh-TW')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Card View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {careStaff.map((staff, index) => (
                      <div
                        key={staff.id}
                        className="card-apple group cursor-pointer transition-all duration-300 hover:shadow-apple-card relative"
                        style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                        onClick={() => handleEditStaff(staff)}
                      >
                        {/* 30分鐘更新提示 */}
                        <CardUpdateIndicator 
                          lastUpdateTime={staffUpdateTimes[staff.staff_id || staff.id] || null} 
                        />
                        
                        <div className="card-apple-content">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-apple-heading text-text-primary truncate mb-1">
                                {staff.name_chinese}
                              </h3>
                              <p className="text-apple-caption text-text-secondary">
                                {staff.staff_id || '沒有提供'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="flex items-center text-apple-caption text-text-secondary">
                              <svg className="h-4 w-4 mr-3 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{staff.phone}</span>
                            </div>

                            <div className="flex items-center text-apple-caption text-text-secondary">
                              <svg className="h-4 w-4 mr-3 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{staff.preferred_area || '沒有提供'}</span>
                            </div>
                          </div>

                          {/* 職位標籤區域 */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {staff.job_position && staff.job_position.length > 0 ? (
                                staff.job_position.map((position, idx) => (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getJobPositionColor(position)}`}
                                  >
                                    {simplifyJobPosition(position)}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-bg-tertiary text-text-primary">
                                  沒有提供
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-border-light pt-3">
                            <div className="flex justify-between items-center text-apple-caption text-text-tertiary">
                              <span>建立於 {new Date(staff.created_at).toLocaleDateString('zh-TW')}</span>
                              <svg className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* TODO: 分頁控制 */}

        {/* 編輯 Drawer */}
        {isDrawerOpen && editingStaff && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            />

            {/* Drawer */}
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl transform transition-transform">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="border-b border-border-light px-6 py-4 bg-bg-secondary">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-text-primary">
                        編輯護理人員
                      </h2>
                      <p className="text-sm text-text-secondary mt-1">
                        {editingStaff.name_chinese} ({editingStaff.staff_id || '未分配編號'})
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteStaff(editingStaff)}
                        disabled={editLoading}
                        className="px-4 py-2 bg-red-500 text-white rounded-apple-sm hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
                      >
                        {editLoading ? '刪除中...' : '刪除'}
                      </button>
                      <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <form
                  action={handleSaveEdit}
                  className="flex-1 overflow-y-auto"
                >
                  <div className="p-6">{/* 基本資料 */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                      基本資料
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group-apple">
                        <label className="form-label-apple">中文姓名 *</label>
                        <input
                          type="text"
                          name="name_chinese"
                          defaultValue={editingStaff.name_chinese || ''}
                          className="form-input-apple"
                          placeholder="請輸入中文姓名"
                        />
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">員工編號</label>
                        <input
                          type="text"
                          value={editingStaff.staff_id || '系統自動生成'}
                          className="form-input-apple bg-bg-secondary"
                          disabled
                        />
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">英文姓名</label>
                        <input
                          type="text"
                          name="name_english"
                          defaultValue={editingStaff.name_english || ''}
                          className="form-input-apple"
                          placeholder="請輸入英文姓名"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.name_english ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">電子郵箱</label>
                        <input
                          type="email"
                          name="email"
                          defaultValue={editingStaff.email || ''}
                          className="form-input-apple"
                          placeholder="請輸入電子郵箱"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.email ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">身份證號碼</label>
                        <input
                          type="text"
                          name="hkid"
                          defaultValue={editingStaff.hkid || ''}
                          className="form-input-apple"
                          placeholder="請輸入身份證號碼"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.hkid ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">出生日期</label>
                        <input
                          type="date"
                          name="dob"
                          defaultValue={editingStaff.dob || ''}
                          className="form-input-apple"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.dob ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">聯絡電話 *</label>
                        <input
                          type="tel"
                          name="phone"
                          defaultValue={editingStaff.phone || ''}
                          className="form-input-apple"
                          placeholder="請輸入8位數電話號碼"
                        />
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">性別</label>
                        <select
                          name="gender"
                          defaultValue={editingStaff.gender || ''}
                          className="form-select-apple"
                        >
                          <option value="">請選擇性別</option>
                          <option value="男">男性</option>
                          <option value="女">女性</option>
                        </select>
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.gender ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">偏好工作區域</label>
                        <select
                          name="preferred_area"
                          defaultValue={editingStaff.preferred_area || ''}
                          className="form-select-apple"
                        >
                          <option value="">請選擇偏好地區</option>
                          <option value="所有區域">所有區域</option>
                          <option value="中西區">中西區</option>
                          <option value="東區">東區</option>
                          <option value="南區">南區</option>
                          <option value="灣仔區">灣仔區</option>
                          <option value="油尖旺區">油尖旺區</option>
                          <option value="深水埗區">深水埗區</option>
                          <option value="九龍城區">九龍城區</option>
                          <option value="黃大仙區">黃大仙區</option>
                          <option value="觀塘區">觀塘區</option>
                          <option value="西貢區">西貢區</option>
                          <option value="沙田區">沙田區</option>
                          <option value="大埔區">大埔區</option>
                          <option value="北區">北區</option>
                          <option value="荃灣區">荃灣區</option>
                          <option value="屯門區">屯門區</option>
                          <option value="元朗區">元朗區</option>
                          <option value="葵青區">葵青區</option>
                          <option value="離島區">離島區</option>
                        </select>
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.preferred_area ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">合約狀態 *</label>
                        <select
                          name="contract_status"
                          defaultValue={editingStaff.contract_status || ''}
                          className="form-select-apple"
                        >
                          <option value="">請選擇合約狀態</option>
                          <option value="同意">同意</option>
                          <option value="不同意">不同意</option>
                        </select>
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.contract_status ? '' : '沒有提供'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 緊急聯絡資料 */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                      緊急聯絡資料
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group-apple">
                        <label className="form-label-apple">緊急聯絡人姓名</label>
                        <input
                          type="text"
                          name="emergency_contact"
                          defaultValue={editingStaff.emergency_contact || ''}
                          className="form-input-apple"
                          placeholder="請輸入緊急聯絡人姓名"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.emergency_contact ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">緊急聯絡人電話</label>
                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          defaultValue={editingStaff.emergency_contact_phone || ''}
                          className="form-input-apple"
                          placeholder="請輸入緊急聯絡人電話"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.emergency_contact_phone ? '' : '沒有提供'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 其他資料 */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                      其他資料
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group-apple">
                        <label className="form-label-apple">國籍</label>
                        <input
                          type="text"
                          name="nationality"
                          defaultValue={editingStaff.nationality || ''}
                          className="form-input-apple"
                          placeholder="請輸入國籍"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.nationality ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">年資（年）</label>
                        <input
                          type="text"
                          name="experience_years"
                          defaultValue={editingStaff.experience_years || ''}
                          className="form-input-apple"
                          placeholder="請輸入年資"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.experience_years ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">新冠疫苗</label>
                        <select
                          name="covid_vaccine"
                          defaultValue={editingStaff.covid_vaccine || ''}
                          className="form-select-apple"
                        >
                          <option value="">請選擇疫苗狀態</option>
                          <option value="1針">1針</option>
                          <option value="2針">2針</option>
                          <option value="3針">3針</option>
                          <option value="4針">4針</option>
                          <option value="無接種">無接種</option>
                          <option value="Other">其他</option>
                        </select>
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.covid_vaccine ? '' : '沒有提供'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 介紹人資料 */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                      介紹人資料
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group-apple">
                        <label className="form-label-apple">介紹人姓名</label>
                        <input
                          type="text"
                          name="referrer"
                          defaultValue={editingStaff.referrer || ''}
                          className="form-input-apple"
                          placeholder="請輸入介紹人姓名"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.referrer ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">介紹人電話</label>
                        <input
                          type="tel"
                          name="referrer_phone"
                          defaultValue={editingStaff.referrer_phone || ''}
                          className="form-input-apple"
                          placeholder="請輸入介紹人電話"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.referrer_phone ? '' : '沒有提供'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 前雇主資料 */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                      前雇主資料
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group-apple">
                        <label className="form-label-apple">公司名稱</label>
                        <input
                          type="text"
                          name="company_name"
                          defaultValue={editingStaff.company_name || ''}
                          className="form-input-apple"
                          placeholder="請輸入前雇主公司名稱"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.company_name ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">職位</label>
                        <input
                          type="text"
                          name="company_position"
                          defaultValue={editingStaff.company_position || ''}
                          className="form-input-apple"
                          placeholder="請輸入在前雇主的職位"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.company_position ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">任職期間</label>
                        <input
                          type="text"
                          name="employment_period"
                          defaultValue={editingStaff.employment_period || ''}
                          className="form-input-apple"
                          placeholder="請輸入任職期間"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.employment_period ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple md:col-span-2">
                        <label className="form-label-apple">主要職責</label>
                        <textarea
                          name="main_duties"
                          defaultValue={editingStaff.main_duties || ''}
                          className="form-textarea-apple"
                          placeholder="請輸入主要職責"
                          rows={3}
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.main_duties ? '' : '沒有提供'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 職位與語言 */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                      職位與語言
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="form-group-apple">
                        <label className="form-label-apple">申請職位</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {[
                            '陪診員 (Medical Escort)',
                            '居家照顧員(PCW)',
                            '家務助理(Housekeeper)',
                            '醫護支援人員(CRSW)',
                            '保健員(HCW)',
                            '登記護士(EN)',
                            '註冊護士(RN)',
                            '護士學生',
                            '中國護士',
                            '註冊營養師(Dietitian)',
                            '職業治療師(OT)',
                            '言語治療師(ST)',
                            '物理治療師(PT)',
                            '醫生(Doctor)',
                            '抽血員(Phlebotomist)',
                            '物理治療助理 (PTA)',
                            '職業治療助理 (OTA)'
                          ].map((position) => (
                            <label key={position} className="flex items-center">
                              <input
                                type="checkbox"
                                defaultChecked={editingStaff.job_position?.includes(position)}
                                className="rounded border-border-light text-primary focus:ring-primary mr-2"
                              />
                              <span className="text-sm text-text-secondary">{position}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.job_position && editingStaff.job_position.length > 0 ? '' : '沒有提供'}
                        </p>
                      </div>
                      <div className="form-group-apple">
                        <label className="form-label-apple">語言能力</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {['廣東話', '英文', '普通話', '福建話', '潮州話', '客家話', '上海話', '四邑話'].map((language) => (
                            <label key={language} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editingStaff?.language?.includes(language) || false}
                                onChange={(e) => {
                                  if (!editingStaff) return
                                  const currentLanguages = editingStaff.language || []
                                  let newLanguages: string[]

                                  if (e.target.checked) {
                                    // 添加語言
                                    newLanguages = [...currentLanguages, language]
                                  } else {
                                    // 移除語言
                                    newLanguages = currentLanguages.filter(lang => lang !== language)
                                  }

                                  setEditingStaff({
                                    ...editingStaff,
                                    language: newLanguages
                                  })
                                }}
                                className="rounded border-border-light text-primary focus:ring-primary mr-2"
                              />
                              <span className="text-sm text-text-secondary">{language}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-text-tertiary mt-1">
                          {editingStaff.language && editingStaff.language.length > 0 ? '' : '沒有提供'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 個人照片 */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                      個人照片
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FileUploadCard
                        label="個人照片"
                        fieldName="profile_photo_url"
                        staffId={editingStaff.staff_id || ''}
                        currentUrl={fileUrls.profile_photo_url}
                        onUploadSuccess={(url: string) => handleFileUploadSuccess('profile_photo_url', url)}
                        onRemove={() => handleFileRemove('profile_photo_url')}
                        disabled={fileUploadDisabled}
                      />
                    </div>
                  </div>

                  {/* 文件管理 */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-text-primary mb-4 border-b border-border-light pb-2">
                      文件管理
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FileUploadCard
                        label="身份證副本"
                        fieldName="hkid_copy_url"
                        staffId={editingStaff.staff_id || ''}
                        currentUrl={fileUrls.hkid_copy_url}
                        onUploadSuccess={(url: string) => handleFileUploadSuccess('hkid_copy_url', url)}
                        onRemove={() => handleFileRemove('hkid_copy_url')}
                        disabled={fileUploadDisabled}
                      />

                      {[1, 2, 3, 4, 5].map((num) => (
                        <FileUploadCard
                          key={num}
                          label={`證書 ${num}`}
                          fieldName={`certificate_${num}`}
                          staffId={editingStaff.staff_id || ''}
                          currentUrl={fileUrls[`certificate_${num}`]}
                          onUploadSuccess={(url: string) => handleFileUploadSuccess(`certificate_${num}`, url)}
                          onRemove={() => handleFileRemove(`certificate_${num}`)}
                          disabled={fileUploadDisabled}
                        />
                      ))}

                      <FileUploadCard
                        label="SCRC 文件"
                        fieldName="scrc_status"
                        staffId={editingStaff.staff_id || ''}
                        currentUrl={fileUrls.scrc_status}
                        onUploadSuccess={(url: string) => handleFileUploadSuccess('scrc_status', url)}
                        onRemove={() => handleFileRemove('scrc_status')}
                        disabled={fileUploadDisabled}
                      />
                    </div>
                  </div>
                  </div>
                </form>

                {/* Footer */}
                <div className="border-t border-border-light px-6 py-4 bg-bg-secondary">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      type="button"
                      className="px-4 py-2 border border-border-light rounded-apple-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        const form = e.currentTarget.closest('.flex.flex-col.h-full')?.querySelector('form') as HTMLFormElement
                        if (form) {
                          const formData = new FormData(form)
                          handleSaveEdit(formData)
                        }
                      }}
                      disabled={saveLoading}
                      type="button"
                      className="px-4 py-2 bg-primary text-white rounded-apple-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {saveLoading ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
