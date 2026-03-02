'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { CustomerManagementService } from '../../../services/customer-management'
import LastUpdateIndicator from '../../../components/LastUpdateIndicator'
import LoadingScreen from '../../../components/LoadingScreen'
import Script from 'next/script'
import type {
  CustomerFormData,
  CustomerType,
  District,
  HealthStatus,
  Introducer,
  VoucherApplicationStatus,
  LdsStatus,
  HomeVisitStatus,
  StaffOwner,
  CopayLevel
} from '../../../types/database'

interface User {
  id: string
  email?: string
}

export default function NewCustomerPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [generatedCustomerId, setGeneratedCustomerId] = useState<string>('')
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)

  // 兩階段表單狀態
  const [formStage, setFormStage] = useState<'initial' | 'expanded'>('initial')

  const [formData, setFormData] = useState<CustomerFormData>({
    customer_type: '社區券客戶',
    customer_name: '',
    service_address: '',
    charity_support: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showMapModal, setShowMapModal] = useState(false)
  const [tempMarkerPosition, setTempMarkerPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const [isGoogleMapsLoading, setIsGoogleMapsLoading] = useState(true) // 新增載入中狀態
  const [mapSearchQuery, setMapSearchQuery] = useState('')
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const mapSearchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const router = useRouter()

  // 檢查 Google Maps 是否已經載入（頁面重載後可能已經在 cache 中）
  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if ((window as any).google?.maps) {
        setIsGoogleMapsLoaded(true)
        setIsGoogleMapsLoading(false)
        return true
      }
      return false
    }

    // 立即檢查一次
    if (checkGoogleMapsLoaded()) return

    // 如果還沒載入，每 200ms 檢查一次，最多 30 秒
    const interval = setInterval(() => {
      if (checkGoogleMapsLoaded()) {
        clearInterval(interval)
      }
    }, 200)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      setIsGoogleMapsLoading(false)
    }, 30000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        router.push('/')
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  // 生成客戶編號 - 使用 Supabase RPC（並發安全）
  const generateCustomerId = async () => {
    try {
      // 僅在符合條件時生成編號 - 家訪客戶不需要編號
      const shouldGenerate = formData.customer_type === '明家街客' ||
        (formData.customer_type === '社區券客戶' && formData.voucher_application_status === '已經持有')

      if (!shouldGenerate) {
        setGeneratedCustomerId('')
        return
      }

      const customerId = await CustomerManagementService.generateNextCustomerId(
        formData.customer_type,
        formData.introducer
      )
      setGeneratedCustomerId(customerId)
      setErrors(prev => ({ ...prev, general: '' }))
    } catch (error: any) {
      console.error('生成客戶編號失敗:', error)
      setErrors(prev => ({ ...prev, general: error.message || '生成客戶編號失敗，請稍後再試' }))
    }
  }

  // 當客戶類型、介紹人或申請狀況改變時重新生成編號
  useEffect(() => {
    if (formData.customer_type && formData.introducer) {
      generateCustomerId()
    }
  }, [formData.customer_type, formData.introducer, formData.voucher_application_status])

  // 檢查是否可以展開第二階段 - 自動展開邏輯
  useEffect(() => {
    const canExpand = formData.customer_type && formData.introducer
    if (canExpand && formStage === 'initial') {
      // 添加短暫延遲，然後自動展開第二階段
      const timer = setTimeout(() => {
        setFormStage('expanded')
      }, 500) // 500ms 延遲，讓用戶看到客戶編號生成

      return () => clearTimeout(timer)
    }
  }, [formData.customer_type, formData.introducer, formStage])

  // 自動計算年齡
  const calculateAge = (dob: string): number | undefined => {
    if (!dob) return undefined
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 ? age : undefined
  }

  // 自動設置 LDS 狀況
  const autoSetLdsStatus = (voucherStatus: VoucherApplicationStatus | undefined) => {
    if (voucherStatus === '已經持有') {
      return '已經持有' as LdsStatus
    }
    return undefined
  }

  // 更新表單數據，包含自動邏輯
  const updateFormData = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // 自動計算年齡
      if (field === 'dob') {
        updated.age = calculateAge(value)
      }

      // 處理客戶類型變化
      if (field === 'customer_type') {
        if (value === '明家街客' || value === '家訪客戶') {
          // 清除所有社區券相關欄位
          updated.voucher_application_status = undefined
          updated.voucher_number = ''
          updated.copay_level = undefined
          updated.charity_support = undefined
          updated.lds_status = undefined
          updated.home_visit_status = undefined
        } else if (value === '社區券客戶') {
          // 切換到社區券客戶時，只保留基本狀態
          updated.voucher_application_status = undefined
          updated.voucher_number = ''
          updated.copay_level = undefined
          updated.charity_support = undefined
          updated.lds_status = undefined
          updated.home_visit_status = undefined
        }
      }

      // 處理社區券申請狀況變化
      if (field === 'voucher_application_status') {
        if (value === '已經持有') {
          // 自動設置 LDS 狀況為「已經持有」
          updated.lds_status = '已經持有'
        } else if (value === '申請中') {
          // 清除只有"已經持有"才顯示的欄位
          updated.voucher_number = ''
          updated.copay_level = undefined
          updated.charity_support = undefined
          // LDS 狀況可以自由選擇
          updated.lds_status = undefined
        } else {
          // 未選擇申請狀況時清空所有相關欄位
          updated.voucher_number = ''
          updated.copay_level = undefined
          updated.charity_support = undefined
          updated.lds_status = undefined
          updated.home_visit_status = undefined
        }
      }

      // 處理自付比例等級變化
      if (field === 'copay_level') {
        if (value !== '5%') {
          // 清除慈善支援欄位
          updated.charity_support = undefined
        }
      }

      return updated
    })

    // 清除相關錯誤
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // 初始化 Google Maps
  const initializeMap = () => {
    if (!mapRef.current || !isGoogleMapsLoaded) return

    // 如果已有座標，優先使用座標
    let center = { lat: 22.3193, lng: 114.1694 } // 默認香港中心
    let shouldGeocode = true

    if (formData.location_latitude && formData.location_longitude) {
      center = {
        lat: formData.location_latitude,
        lng: formData.location_longitude
      }
      shouldGeocode = false
    }

    // 創建地圖
    googleMapRef.current = new (window as any).google.maps.Map(mapRef.current, {
      center: center,
      zoom: 16,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true
    })

    // 如果需要 geocoding 並且有地址
    if (shouldGeocode && formData.service_address?.trim()) {
      const address = formData.service_address.trim()
      const geocoder = new (window as any).google.maps.Geocoder()

      console.log('🗺️ 開始地址地理編碼:', address)

      // 嘗試多個搜尋策略（加強版）
      const searchStrategies = [
        address + ', 香港',              // 完整地址 + 香港
        address + ', Hong Kong',         // 完整地址 + Hong Kong
        address,                          // 只用地址
        address.replace(/[樓層座]/g, '') + ', 香港',  // 移除樓層資訊再試
        address.split(',')[0] + ', 香港', // 只用第一部分地址
      ]

      let foundLocation = false
      let attemptCount = 0

      const tryGeocode = (index: number) => {
        if (index >= searchStrategies.length) {
          // 所有策略都失敗
          if (!foundLocation) {
            console.warn('⚠️ 所有地理編碼策略都失敗，地圖將顯示在香港中心位置')
            // 顯示提示訊息
            if (googleMapRef.current) {
              const infoWindow = new (window as any).google.maps.InfoWindow({
                content: `
                  <div style="padding: 10px; max-width: 250px;">
                    <h3 style="margin: 0 0 8px 0; color: #d32f2f; font-size: 14px; font-weight: bold;">⚠️ 無法定位地址</h3>
                    <p style="margin: 0 0 8px 0; font-size: 13px;">系統無法找到此地址：</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; background: #f5f5f5; padding: 6px; border-radius: 4px;">${address}</p>
                    <p style="margin: 0; font-size: 12px; color: #666;">請在地圖上手動點擊選擇正確位置，或檢查地址是否正確。</p>
                  </div>
                `,
                position: googleMapRef.current.getCenter()
              })
              infoWindow.open(googleMapRef.current)
              
              // 3秒後自動關閉
              setTimeout(() => {
                infoWindow.close()
              }, 5000)
            }
          }
          return
        }

        if (foundLocation) return

        attemptCount++
        console.log(`🔍 嘗試策略 ${attemptCount}:`, searchStrategies[index])

        geocoder.geocode({ address: searchStrategies[index] }, (results: any, status: any) => {
          console.log(`📍 策略 ${attemptCount} 結果:`, status, results)
          
          if (status === 'OK' && results && results[0] && !foundLocation) {
            foundLocation = true
            const newCenter = {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng()
            }
            console.log('✅ 成功定位地址:', newCenter)
            
            if (googleMapRef.current) {
              googleMapRef.current.setCenter(newCenter)
              googleMapRef.current.setZoom(17)
              
              // 顯示成功訊息
              const infoWindow = new (window as any).google.maps.InfoWindow({
                content: `
                  <div style="padding: 8px;">
                    <p style="margin: 0; font-size: 13px; color: #2e7d32;">✓ 已定位到此地址</p>
                  </div>
                `,
                position: newCenter
              })
              infoWindow.open(googleMapRef.current)
              
              // 2秒後自動關閉
              setTimeout(() => {
                infoWindow.close()
              }, 2000)
            }
          } else {
            console.log(`⚠️ 策略 ${attemptCount} 失敗，嘗試下一個策略`)
            // 嘗試下一個策略
            tryGeocode(index + 1)
          }
        })
      }

      tryGeocode(0)
    }

    // 如果已有座標，顯示標記
    if (formData.location_latitude && formData.location_longitude) {
      const existingPosition = {
        lat: formData.location_latitude,
        lng: formData.location_longitude
      }
      placeMarker(existingPosition)
      setTempMarkerPosition(existingPosition)
    }

    // 地圖點擊事件
    googleMapRef.current.addListener('click', (e: any) => {
      const position = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      }
      placeMarker(position)
      setTempMarkerPosition(position)
    })

    // 初始化 Google Places Autocomplete
    if (mapSearchInputRef.current && (window as any).google?.maps?.places) {
      autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(
        mapSearchInputRef.current,
        {
          componentRestrictions: { country: 'hk' }, // 限制在香港
          fields: ['geometry', 'formatted_address', 'name']
        }
      )

      // 監聽地點選擇事件
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace()
        
        if (place.geometry && place.geometry.location) {
          const position = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          }
          
          // 移動地圖到選擇的位置
          googleMapRef.current.setCenter(position)
          googleMapRef.current.setZoom(17)
          
          // 放置標記
          placeMarker(position)
          setTempMarkerPosition(position)
          
          // 更新搜尋欄文字
          setMapSearchQuery(place.formatted_address || place.name || '')
          
          console.log('✅ 搜尋地點成功:', place.formatted_address || place.name)
        } else {
          console.warn('⚠️ 無法取得地點座標')
        }
      })
    }
  }

  // 放置標記
  const placeMarker = (position: { lat: number; lng: number }) => {
    if (!googleMapRef.current) return

    // 移除舊標記
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }

    // 創建新標記
    markerRef.current = new (window as any).google.maps.Marker({
      position: position,
      map: googleMapRef.current,
      draggable: true,
      animation: (window as any).google.maps.Animation.DROP
    })

    // 標記拖動事件
    markerRef.current.addListener('dragend', (e: any) => {
      const newPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      }
      setTempMarkerPosition(newPosition)
    })
  }

  // 打開地圖選擇位置
  const openMapSelector = () => {
    if (!formData.service_address?.trim()) {
      alert('請先輸入服務地址')
      return
    }
    
    // 檢查 Google Maps 是否已載入
    if (!isGoogleMapsLoaded) {
      // 不用 alert，因為按鈕已經被禁用了
      console.warn('Google Maps 尚未載入')
      return
    }
    
    setShowMapModal(true)
    // 延遲初始化地圖，確保 modal 已經渲染
    setTimeout(() => {
      initializeMap()
    }, 150) // 稍微增加延遲以確保 DOM 完全渲染
  }

  // 當 modal 打開且 Google Maps 載入完成時，重新初始化地圖
  useEffect(() => {
    if (showMapModal && isGoogleMapsLoaded && mapRef.current && !googleMapRef.current) {
      console.log('🗺️ Modal 已打開，重新初始化地圖...')
      setTimeout(() => {
        initializeMap()
      }, 150)
    }
  }, [showMapModal, isGoogleMapsLoaded])

  // 確認地圖上選擇的位置
  const confirmMapLocation = () => {
    if (tempMarkerPosition) {
      setFormData(prev => ({
        ...prev,
        location_latitude: tempMarkerPosition.lat,
        location_longitude: tempMarkerPosition.lng
      }))
      setShowMapModal(false)
      setTempMarkerPosition(null)
    } else {
      alert('請在地圖上點擊以選擇位置')
    }
  }

  // 取消地圖選擇
  const cancelMapSelection = () => {
    setShowMapModal(false)
    setTempMarkerPosition(null)
  }

  // 表單驗證 - 按照完整規格實施
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 必填基本資料驗證
    if (!formData.customer_name?.trim()) {
      newErrors.customer_name = '請輸入客戶姓名'
    }

    if (!formData.service_address?.trim()) {
      newErrors.service_address = '請輸入服務地址'
    }

    // 社區券客戶的條件式驗證
    if (formData.customer_type === '社區券客戶') {
      if (!formData.voucher_application_status) {
        newErrors.voucher_application_status = '請選擇社區券申請狀況'
      }

      // 申請狀況為「已經持有」時的必填驗證
      if (formData.voucher_application_status === '已經持有') {
        if (!formData.voucher_number?.trim()) {
          newErrors.voucher_number = '請輸入社區券號碼'
        }

        if (!formData.copay_level) {
          newErrors.copay_level = '請選擇自付比例等級'
        }

        if (formData.copay_level === '5%' && formData.charity_support === undefined) {
          newErrors.charity_support = '請選擇是否需要慈善機構贊助'
        }
      }

      // 有選擇申請狀況時的 LDS 和家訪驗證
      if (formData.voucher_application_status === '申請中' || formData.voucher_application_status === '已經持有') {
        if (!formData.lds_status) {
          newErrors.lds_status = '請選擇LDS狀況'
        }

        if (!formData.home_visit_status) {
          newErrors.home_visit_status = '請選擇家訪狀況'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表單 - 按照完整規格實施
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // 計算年齡
      let calculatedAge: number | undefined
      if (formData.dob) {
        const birthDate = new Date(formData.dob)
        const today = new Date()
        calculatedAge = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--
        }
      }

      // 準備提交數據 - 僅包含目前可見且符合條件的欄位
      const submissionData: CustomerFormData = {
        customer_type: formData.customer_type,
        customer_name: formData.customer_name,
        service_address: formData.service_address,
        phone: formData.phone || undefined,
        hkid: formData.hkid || undefined,
        dob: formData.dob || undefined,
        age: calculatedAge || undefined,
        district: formData.district || undefined,
        health_status: formData.health_status || undefined,
        introducer: formData.introducer || undefined,
        staff_owner: formData.staff_owner || undefined,
        charity_support: false // 預設值
      }

      // 僅在社區券客戶且有申請狀況時添加相關欄位
      if (formData.customer_type === '社區券客戶' && formData.voucher_application_status) {
        submissionData.voucher_application_status = formData.voucher_application_status

        // LDS 和家訪狀況在有申請狀況時都可能存在
        if (formData.lds_status) {
          submissionData.lds_status = formData.lds_status
        }
        if (formData.home_visit_status) {
          submissionData.home_visit_status = formData.home_visit_status
        }

        // 僅在「已經持有」時添加這些欄位
        if (formData.voucher_application_status === '已經持有') {
          if (formData.voucher_number) {
            submissionData.voucher_number = formData.voucher_number
          }
          if (formData.copay_level) {
            submissionData.copay_level = formData.copay_level
          }
          // 僅在自付比例為5%時添加慈善支援
          if (formData.copay_level === '5%' && formData.charity_support !== undefined) {
            submissionData.charity_support = formData.charity_support
          }
        }
      }

      // 調用服務層
      const result = await CustomerManagementService.createCustomer(submissionData)

      if (result.success) {
        // Set last update time for notification
        setLastUpdateTime(new Date())
        // Navigate after a brief delay to show notification
        setTimeout(() => {
          router.push('/clients')
        }, 1500)
      } else {
        setErrors({ general: result.error || '新增客戶失敗' })
      }
    } catch (error: any) {
      console.error('新增客戶失敗:', error)
      setErrors({ general: error.message || '新增客戶失敗，請稍後再試' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Google Maps Script - 只載入一次 */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyBFBLFI1GhfRuSwyZXO4-kS9YYg2eJ694I&libraries=places`}
        onLoad={() => {
          console.log('✅ Google Maps API 已載入')
          setIsGoogleMapsLoaded(true)
          setIsGoogleMapsLoading(false)
        }}
        onError={() => {
          console.error('❌ Google Maps API 載入失敗')
          setIsGoogleMapsLoading(false)
        }}
      />
      
      {loading ? (
        <LoadingScreen message="正在載入表單..." />
      ) : (
      
      <div className="bg-bg-primary min-h-screen" style={{ minHeight: '100vh', height: 'auto' }}>
        {/* Header */}
      <header className="card-apple border-b border-border-light fade-in-apple">
        <div className="w-full px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-lg sm:text-xl font-bold text-text-primary mb-1">新增客戶</h1>
                <LastUpdateIndicator lastUpdateTime={lastUpdateTime} />
              </div>
              <p className="text-sm text-text-secondary">建立新的客戶資料</p>
            </div>
            <button
              onClick={() => router.push('/clients')}
              className="btn-apple-secondary w-full sm:w-auto text-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回客戶列表
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="w-full py-4 sm:py-6 px-4 sm:px-6 pb-32 sm:pb-20">
        <div className="w-full max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

          {/* 錯誤訊息 */}
          {errors.general && (
            <div className="card-apple border-danger bg-danger-light fade-in-apple">
              <div className="card-apple-content">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-danger mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-apple-body text-danger">{errors.general}</p>
                </div>
              </div>
            </div>
          )}

          {/* 第一階段：基礎選擇 */}
          <div className="card-apple fade-in-apple">
            <div className="card-apple-content">
              <h2 className="text-lg sm:text-apple-heading text-text-primary mb-4 sm:mb-6">基礎資訊</h2>

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-6">
                {/* 客戶類型 */}
                <div>
                  <label className="block text-sm sm:text-apple-body font-medium text-text-primary mb-2">
                    客戶類型 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => updateFormData('customer_type', e.target.value as CustomerType)}
                    className="form-input-apple text-base min-h-[44px]"
                    required
                  >
                    <option value="社區券客戶">社區券客戶</option>
                    <option value="明家街客">明家街客</option>
                    <option value="家訪客戶">家訪客戶</option>
                  </select>
                </div>

                {/* 介紹人 */}
                <div>
                  <label className="block text-sm sm:text-apple-body font-medium text-text-primary mb-2">
                    介紹人 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.introducer || ''}
                    onChange={(e) => updateFormData('introducer', e.target.value as Introducer)}
                    className="form-input-apple text-base min-h-[44px]"
                    required
                  >
                    <option value="">請選擇介紹人</option>
                    <option value="Kanas Leung">Kanas Leung</option>
                    <option value="Joe Cheung">Joe Cheung</option>
                    <option value="Candy Ho">Candy Ho</option>
                    <option value="Tracy Yau">Tracy Yau</option>
                    <option value="Steven Kwok">Steven Kwok</option>
                    <option value="Dr.Lee">Dr.Lee</option>
                    <option value="Annie">Annie</option>
                    <option value="Janet">Janet</option>
                    <option value="陸sir">陸sir</option>
                    <option value="吳翹政">吳翹政</option>
                    <option value="余翠英">余翠英</option>
                    <option value="陳小姐MC01">陳小姐MC01</option>
                    <option value="曾先生">曾先生</option>
                    <option value="梁曉峰">梁曉峰</option>
                    <option value="raymond">raymond</option>
                  </select>
                </div>
              </div>

              {/* 社區券資訊 - 在基礎資訊中條件顯示 */}
              {formData.customer_type === '社區券客戶' && (
                <div className="mt-6 pt-6 border-t border-border-primary">
                  <h3 className="text-base sm:text-apple-body font-semibold text-text-primary mb-4">社區券資訊</h3>

                  <div className="space-y-4">
                    {/* 社區券申請狀況 */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        申請狀況 <span className="text-danger">*</span>
                      </label>
                      <select
                        value={formData.voucher_application_status || ''}
                        onChange={(e) => updateFormData('voucher_application_status', e.target.value as VoucherApplicationStatus)}
                        className={`form-input-apple text-base min-h-[44px] ${errors.voucher_application_status ? 'border-danger' : ''}`}
                        required
                      >
                        <option value="">請選擇申請狀況</option>
                        <option value="已經持有">已經持有</option>
                        <option value="申請中">申請中</option>
                      </select>
                      {errors.voucher_application_status && (
                        <p className="text-apple-caption text-danger mt-1">{errors.voucher_application_status}</p>
                      )}
                    </div>

                    {/* 當有申請狀況時顯示 LDS 和家訪狀況 */}
                    {(formData.voucher_application_status === '申請中' || formData.voucher_application_status === '已經持有') && (
                      <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-4">
                        {/* LDS 狀態 */}
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            LDS 狀態 <span className="text-danger">*</span>
                          </label>
                          <select
                            value={formData.lds_status || ''}
                            onChange={(e) => updateFormData('lds_status', e.target.value as LdsStatus)}
                            className={`form-input-apple text-base min-h-[44px] ${errors.lds_status ? 'border-danger' : ''}`}
                            disabled={formData.voucher_application_status === '已經持有'}
                            required
                          >
                            <option value="">請選擇 LDS 狀態</option>
                            <option value="已完成評估">已完成評估</option>
                            <option value="已經持有">已經持有</option>
                            <option value="待社工評估">待社工評估</option>
                          </select>
                          {formData.voucher_application_status === '已經持有' && (
                            <p className="text-apple-caption text-text-secondary mt-1">
                              已自動設為「已經持有」
                            </p>
                          )}
                          {errors.lds_status && (
                            <p className="text-apple-caption text-danger mt-1">{errors.lds_status}</p>
                          )}
                        </div>

                        {/* 家訪狀況 */}
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            家訪狀況 <span className="text-danger">*</span>
                          </label>
                          <select
                            value={formData.home_visit_status || ''}
                            onChange={(e) => updateFormData('home_visit_status', e.target.value as HomeVisitStatus)}
                            className={`form-input-apple text-base min-h-[44px] ${errors.home_visit_status ? 'border-danger' : ''}`}
                            required
                          >
                            <option value="">請選擇家訪狀況</option>
                            <option value="已完成">已完成</option>
                            <option value="未完成">未完成</option>
                          </select>
                          {errors.home_visit_status && (
                            <p className="text-apple-caption text-danger mt-1">{errors.home_visit_status}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 當申請狀況為「已經持有」時顯示額外欄位 */}
                    {formData.voucher_application_status === '已經持有' && (
                      <div className="space-y-4">
                        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-4">
                          {/* 社區券號碼 */}
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              社區券號碼 <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.voucher_number || ''}
                              onChange={(e) => updateFormData('voucher_number', e.target.value)}
                              className={`form-input-apple text-base min-h-[44px] ${errors.voucher_number ? 'border-danger' : ''}`}
                              placeholder="請輸入社區券號碼"
                              required
                            />
                            {errors.voucher_number && (
                              <p className="text-apple-caption text-danger mt-1">{errors.voucher_number}</p>
                            )}
                          </div>

                          {/* 自付額等級 */}
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              自付額 <span className="text-danger">*</span>
                            </label>
                            <select
                              value={formData.copay_level || ''}
                              onChange={(e) => updateFormData('copay_level', e.target.value as CopayLevel)}
                              className={`form-input-apple text-base min-h-[44px] ${errors.copay_level ? 'border-danger' : ''}`}
                              required
                            >
                              <option value="">請選擇自付額</option>
                              <option value="5%">5%</option>
                              <option value="8%">8%</option>
                              <option value="12%">12%</option>
                              <option value="16%">16%</option>
                              <option value="25%">25%</option>
                              <option value="40%">40%</option>
                            </select>
                            {errors.copay_level && (
                              <p className="text-apple-caption text-danger mt-1">{errors.copay_level}</p>
                            )}
                          </div>
                        </div>

                        {/* 慈善補助 - 僅在自付額為5%時顯示 */}
                        {formData.copay_level === '5%' && (
                          <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                              慈善補助 <span className="text-danger">*</span>
                            </label>
                            <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-3 sm:space-y-0 mt-3">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="charity_support"
                                  value="true"
                                  checked={formData.charity_support === true}
                                  onChange={(e) => updateFormData('charity_support', e.target.value === 'true')}
                                  className="w-5 h-5 text-primary focus:ring-primary"
                                />
                                <span className="ml-3 text-base">是</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="charity_support"
                                  value="false"
                                  checked={formData.charity_support === false}
                                  onChange={(e) => updateFormData('charity_support', e.target.value === 'false')}
                                  className="w-5 h-5 text-primary focus:ring-primary"
                                />
                                <span className="ml-3 text-base">否</span>
                              </label>
                            </div>
                            {errors.charity_support && (
                              <p className="text-apple-caption text-danger mt-1">{errors.charity_support}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 客戶編號預覽 */}
              {formData.customer_type && formData.introducer && (
                <div className="mt-6 bg-bg-tertiary rounded-apple-sm p-4 fade-in-apple">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-apple-caption text-text-secondary">客戶編號</p>
                      <p className="text-apple-heading text-text-primary font-mono">
                        {generatedCustomerId || (
                          formData.customer_type === '家訪客戶'
                            ? '不需要編號'
                            : formData.customer_type === '社區券客戶' && formData.voucher_application_status === '申請中'
                            ? '申請中不生成編號'
                            : '生成中...'
                        )}
                      </p>
                      {formData.customer_type === '社區券客戶' && formData.voucher_application_status === '申請中' && (
                        <p className="text-apple-caption text-text-secondary mt-1">
                          客戶編號將在申請狀況變更為「已經持有」後生成
                        </p>
                      )}
                      {formData.customer_type === '家訪客戶' && (
                        <p className="text-apple-caption text-text-secondary mt-1">
                          家訪客戶無需客戶編號
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 第二階段：詳細表單 (條件顯示 + 滑下動畫) */}
          <div
            className={`overflow-visible transition-all duration-700 ease-in-out ${
              formStage === 'expanded'
                ? 'max-h-none opacity-100 transform translate-y-0'
                : 'max-h-0 opacity-0 transform -translate-y-4 overflow-hidden'
            }`}
          >
            <div className="space-y-6 sm:space-y-8">
              {/* 基本資料 */}
              <div className="card-apple">
                <div className="card-apple-content">
                  <h2 className="text-lg sm:text-apple-heading text-text-primary mb-4 sm:mb-6">基本資料</h2>

                  <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-6">
                    {/* 客戶姓名 */}
                    <div>
                      <label className="block text-sm sm:text-apple-body font-medium text-text-primary mb-2">
                        客戶姓名 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.customer_name}
                        onChange={(e) => updateFormData('customer_name', e.target.value)}
                        className={`form-input-apple text-base min-h-[44px] ${errors.customer_name ? 'border-danger' : ''}`}
                        placeholder="請輸入客戶姓名"
                        required
                      />
                      {errors.customer_name && (
                        <p className="text-sm text-danger mt-2">{errors.customer_name}</p>
                      )}
                    </div>

                    {/* 服務地址 */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm sm:text-apple-body font-medium text-text-primary mb-2">
                        服務地址 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.service_address}
                        onChange={(e) => updateFormData('service_address', e.target.value)}
                        className={`form-input-apple text-base min-h-[44px] ${errors.service_address ? 'border-danger' : ''}`}
                        placeholder="請輸入服務地址"
                        required
                      />
                      {errors.service_address && (
                        <p className="text-sm text-danger mt-2">{errors.service_address}</p>
                      )}
                      
                      {/* 地圖定位功能 - 必填 */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm font-semibold text-text-primary">
                            服務地址定位
                          </label>
                          <span className="text-red-600 text-sm font-bold">*必填</span>
                          {isGoogleMapsLoading && (
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              地圖載入中...
                            </span>
                          )}
                          {!isGoogleMapsLoading && isGoogleMapsLoaded && (
                            <span className="text-xs text-green-600">✓ 地圖已就緒</span>
                          )}
                          {!isGoogleMapsLoading && !isGoogleMapsLoaded && (
                            <span className="text-xs text-red-600">⚠️ 地圖載入失敗</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={openMapSelector}
                            disabled={!isGoogleMapsLoaded}
                            className={`px-6 py-3 font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2 ${
                              isGoogleMapsLoaded 
                                ? 'bg-primary hover:bg-primary-dark text-white hover:shadow-xl transform hover:scale-105' 
                                : 'bg-border-light text-text-secondary cursor-not-allowed'
                            }`}
                          >
                            {isGoogleMapsLoading ? (
                              <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                載入中...
                              </>
                            ) : (
                              <>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                📍 在地圖上標記位置
                              </>
                            )}
                          </button>
                          {formData.location_latitude && formData.location_longitude ? (
                            <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                              ✓ 已定位 ({formData.location_latitude.toFixed(6)}, {formData.location_longitude.toFixed(6)})
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full animate-pulse">
                              ⚠️ 尚未標記位置
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 電話號碼 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        電話號碼
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        className={`form-input-apple ${errors.phone ? 'border-danger' : ''}`}
                        placeholder="請輸入電話號碼"
                      />
                      {errors.phone && (
                        <p className="text-apple-caption text-danger mt-2">{errors.phone}</p>
                      )}
                    </div>

                    {/* 身份證號碼 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        身份證號碼
                      </label>
                      <input
                        type="text"
                        value={formData.hkid || ''}
                        onChange={(e) => updateFormData('hkid', e.target.value.toUpperCase())}
                        className={`form-input-apple ${errors.hkid ? 'border-danger' : ''}`}
                        placeholder="例: A123456(7)"
                      />
                      {errors.hkid && (
                        <p className="text-apple-caption text-danger mt-2">{errors.hkid}</p>
                      )}
                    </div>

                    {/* 出生日期 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        出生日期
                      </label>
                      <input
                        type="date"
                        value={formData.dob || ''}
                        onChange={(e) => updateFormData('dob', e.target.value)}
                        className="form-input-apple"
                      />
                    </div>

                    {/* 年齡 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        年齡
                      </label>
                      <input
                        type="text"
                        value={formData.age ? `${formData.age} 歲` : ''}
                        readOnly
                        disabled
                        className="form-input-apple bg-bg-secondary text-text-secondary"
                        placeholder="自動計算"
                      />
                      <p className="text-apple-caption text-text-secondary mt-1">
                        年齡將根據出生日期自動計算
                      </p>
                    </div>

                    {/* 客戶地區 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        客戶地區
                      </label>
                      <select
                        value={formData.district || ''}
                        onChange={(e) => updateFormData('district', e.target.value as District)}
                        className="form-input-apple"
                      >
                        <option value="">請選擇地區</option>
                        <option value="中西區">中西區</option>
                        <option value="九龍城區">九龍城區</option>
                        <option value="元朗區">元朗區</option>
                        <option value="北區">北區</option>
                        <option value="南區">南區</option>
                        <option value="大埔區">大埔區</option>
                        <option value="屯門區">屯門區</option>
                        <option value="東區">東區</option>
                        <option value="沙田區">沙田區</option>
                        <option value="油尖旺區">油尖旺區</option>
                        <option value="深水埗區">深水埗區</option>
                        <option value="灣仔區">灣仔區</option>
                        <option value="荃灣區">荃灣區</option>
                        <option value="葵青區">葵青區</option>
                        <option value="西貢區">西貢區</option>
                        <option value="觀塘區">觀塘區</option>
                        <option value="離島區">離島區</option>
                        <option value="黃大仙區">黃大仙區</option>
                        <option value="未分類（醫院,院舍)">未分類（醫院,院舍)</option>
                      </select>
                    </div>

                    {/* 項目經理 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        項目經理
                      </label>
                      <select
                        value={formData.staff_owner || ''}
                        onChange={(e) => updateFormData('staff_owner', e.target.value as StaffOwner)}
                        className="form-input-apple"
                      >
                        <option value="">請選擇項目經理</option>
                        <option value="Kanas Leung">Kanas Leung</option>
                        <option value="Joe Cheung">Joe Cheung</option>
                        <option value="Candy Ho">Candy Ho</option>
                        <option value="Tracy Yau">Tracy Yau</option>
                      </select>
                    </div>

                    {/* 身體狀況 */}
                    <div>
                      <label className="block text-apple-body font-medium text-text-primary mb-2">
                        身體狀況
                      </label>
                      <select
                        value={formData.health_status || ''}
                        onChange={(e) => updateFormData('health_status', e.target.value as HealthStatus)}
                        className="form-input-apple"
                      >
                        <option value="">請選擇身體狀況</option>
                        <option value="良好">良好</option>
                        <option value="中風">中風</option>
                        <option value="需協助">需協助</option>
                        <option value="長期病患">長期病患</option>
                        <option value="認知障礙">認知障礙</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 提交按鈕 */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/clients')}
                  className="btn-apple-secondary w-full sm:w-auto min-h-[44px]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-apple-primary w-full sm:w-auto min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '新增中...' : '新增客戶'}
                </button>
              </div>
            </div>
          </div>
        </form>
        </div>
      </main>

      {/* 地圖選擇器模態框 */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-border-light flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">選擇服務地址位置</h3>
                <p className="text-sm text-text-secondary mt-1">地址：{formData.service_address}</p>
              </div>
              <button
                onClick={cancelMapSelection}
                className="text-text-secondary hover:text-text-primary"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-hidden">
              {/* 地圖搜尋欄 */}
              <div className="mb-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    ref={mapSearchInputRef}
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    placeholder="搜尋地址或地點（例如：旺角彌敦道、銅鑼灣時代廣場）"
                    className="w-full pl-10 pr-4 py-2.5 border border-border-medium rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1.5 ml-1">
                  💡 在搜尋欄輸入地址或地點名稱，選擇建議項目後地圖會自動移動到該位置
                </p>
              </div>

              {/* 互動式 Google Maps */}
              <div 
                ref={mapRef}
                className="h-96 rounded-xl border border-border-medium overflow-hidden mb-4"
              ></div>
              
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800 font-medium mb-1">💡 使用說明：</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 在上方<strong>搜尋欄</strong>輸入地址快速定位</li>
                  <li>• 直接在地圖上<strong>點擊</strong>任何位置來設置標記</li>
                  <li>• 可以<strong>拖動標記</strong>來調整精確位置</li>
                  <li>• 座標會自動更新到下方欄位</li>
                  <li>• 或者直接在下方手動輸入座標</li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-border-light">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-text-primary whitespace-nowrap">
                    座標輸入：
                  </label>
                  <input
                    type="text"
                    placeholder="緯度 (例如: 22.3193)"
                    value={tempMarkerPosition?.lat || ''}
                    onChange={(e) => {
                      const lat = parseFloat(e.target.value)
                      if (!isNaN(lat)) {
                        setTempMarkerPosition(prev => ({ lat, lng: prev?.lng || 0 }))
                      }
                    }}
                    className="form-input-apple flex-1 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="經度 (例如: 114.1694)"
                    value={tempMarkerPosition?.lng || ''}
                    onChange={(e) => {
                      const lng = parseFloat(e.target.value)
                      if (!isNaN(lng)) {
                        setTempMarkerPosition(prev => ({ lat: prev?.lat || 0, lng }))
                      }
                    }}
                    className="form-input-apple flex-1 text-sm"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={cancelMapSelection}
                    className="btn-secondary-apple"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={confirmMapLocation}
                    disabled={!tempMarkerPosition?.lat || !tempMarkerPosition?.lng}
                    className="btn-apple-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    確認位置
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </>
  )
}
