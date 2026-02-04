'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../lib/supabase'
import { getAssetPath } from '../../utils/asset-path'
import LoadingScreen from '../../components/LoadingScreen'

interface User {
  id: string
  email?: string
}

type HkoRhrreadResponse = {
  updateTime?: string
  warningMessage?: string[]
  temperature?: {
    data?: Array<{ place?: string; value?: string; unit?: string }>
    recordTime?: string
  }
  humidity?: {
    data?: Array<{ place?: string; value?: string; unit?: string }>
    recordTime?: string
  }
  rainfall?: {
    data?: Array<{ place?: string; max?: string; max1?: string; value?: string; value1?: string; min?: string; min1?: string; unit?: string; unit1?: string }>
    startTime?: string
    endTime?: string
  }
}

type HkoWeatherSnapshot = {
  updatedAt?: string
  temperature?: { place: string; value: string; unit: string }
  humidity?: { place: string; value: string; unit: string }
  rainfall?: { place: string; value: string; unit: string }
  warnings: string[]
}

type HkoFndResponse = {
  updateTime?: string
  weatherForecast?: Array<{
    forecastDate?: string
    week?: string
    forecastWeather?: string
    forecastMaxtemp?: { value?: string; unit?: string }
    forecastMintemp?: { value?: string; unit?: string }
    forecastMaxrh?: { value?: string; unit?: string }
    forecastMinrh?: { value?: string; unit?: string }
    ForecastIcon?: number | string
    PSR?: string
  }>
}

type HkoForecastDay = {
  dateLabel: string
  weekLabel?: string
  iconUrl?: string
  weather?: string
  minTemp?: string
  maxTemp?: string
  psr?: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [hkoStatus, setHkoStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [hkoWeather, setHkoWeather] = useState<HkoWeatherSnapshot | null>(null)
  const [hkoForecast, setHkoForecast] = useState<HkoForecastDay[]>([])
  const [expandedForecastIndex, setExpandedForecastIndex] = useState<number | null>(null)
  const [expandedWarningIndex, setExpandedWarningIndex] = useState<number | null>(null)
  const [allHkoData, setAllHkoData] = useState<{
    temperature: Array<{ place: string; value: string; unit: string }>
    humidity: Array<{ place: string; value: string; unit: string }>
    rainfall: Array<{ place: string; value: string; unit: string }>
  } | null>(null)
  const [selectedTempPlace, setSelectedTempPlace] = useState<string>('京士柏')
  const [selectedHumidityPlace, setSelectedHumidityPlace] = useState<string>('香港天文台')
  const [selectedRainfallPlace, setSelectedRainfallPlace] = useState<string>('九龍城')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [reminderPopup, setReminderPopup] = useState<{
    type: 'serviceFee3' | 'serviceFee5' | 'commission'
    isToday: boolean
  } | null>(null)
  const router = useRouter()

  // 檢查是否需要顯示提醒
  useEffect(() => {
    const today = new Date()
    const day = today.getDate()
    
    // 檢查 localStorage 是否已關閉提醒
    const dismissedKey = `reminder_dismissed_${today.getFullYear()}_${today.getMonth()}_${day}`
    const isDismissed = localStorage.getItem(dismissedKey)
    
    if (isDismissed) return
    
    // 3日或2日（提前一天）
    if (day === 3) {
      setReminderPopup({ type: 'serviceFee3', isToday: true })
    } else if (day === 2) {
      setReminderPopup({ type: 'serviceFee3', isToday: false })
    }
    // 5日或4日（提前一天）
    else if (day === 5) {
      setReminderPopup({ type: 'serviceFee5', isToday: true })
    } else if (day === 4) {
      setReminderPopup({ type: 'serviceFee5', isToday: false })
    }
    // 7日或6日（提前一天）
    else if (day === 7) {
      setReminderPopup({ type: 'commission', isToday: true })
    } else if (day === 6) {
      setReminderPopup({ type: 'commission', isToday: false })
    }
  }, [])

  const dismissReminder = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      const today = new Date()
      const day = today.getDate()
      const dismissedKey = `reminder_dismissed_${today.getFullYear()}_${today.getMonth()}_${day}`
      localStorage.setItem(dismissedKey, 'true')
    }
    setReminderPopup(null)
  }

  // 獲取提醒內容
  const getReminderContent = () => {
    if (!reminderPopup) return null
    
    const today = new Date()
    const month = today.getMonth()
    const year = today.getFullYear()
    const day = today.getDate()
    
    // 計算提醒對應的實際日期
    const reminderDay = reminderPopup.isToday ? day : day + 1
    const reminderDate = new Date(year, month, reminderDay)
    const reminderMonth = reminderDate.getMonth() + 1
    const reminderDayOfMonth = reminderDate.getDate()
    
    // getMonthInfo helper
    const getMonthInfoLocal = (m: number, y: number) => {
      let adjustedMonth = m
      let adjustedYear = y
      while (adjustedMonth < 0) { adjustedMonth += 12; adjustedYear -= 1 }
      while (adjustedMonth > 11) { adjustedMonth -= 12; adjustedYear += 1 }
      const lastDay = new Date(adjustedYear, adjustedMonth + 1, 0).getDate()
      const monthName = `${adjustedMonth + 1}月`
      return { name: monthName, range: `${adjustedMonth + 1}月1日 - ${adjustedMonth + 1}月${lastDay}日` }
    }
    
    const twoMonthsAgo = getMonthInfoLocal(month - 2, year)
    const threeMonthsAgo = getMonthInfoLocal(month - 3, year)
    const prevMonth = getMonthInfoLocal(month - 1, year)
    const fourMonthsAgo = getMonthInfoLocal(month - 4, year)
    
    const timeLabel = reminderPopup.isToday ? '【今天】' : '【明天】'
    const dateLabel = `${reminderMonth}月${reminderDayOfMonth}日`
    
    switch (reminderPopup.type) {
      case 'serviceFee3':
        return {
          icon: '💵',
          title: `${timeLabel} ${dateLabel} 服務費收取提醒`,
          items: [
            { name: 'Steven140', period: twoMonthsAgo.range },
            { name: 'Steven200', period: twoMonthsAgo.range }
          ]
        }
      case 'serviceFee5':
        return {
          icon: '💵',
          title: `${timeLabel} ${dateLabel} 服務費收取提醒`,
          items: [
            { name: '俊佳218', period: fourMonthsAgo.range },
            { name: '醫點', period: fourMonthsAgo.range }
          ]
        }
      case 'commission':
        return {
          icon: '💰',
          title: `${timeLabel} ${dateLabel} 佣金發放提醒`,
          items: [
            { name: 'Doctor Lee', period: prevMonth.range },
            { name: 'Annie', period: prevMonth.range },
            { name: 'Carmen', period: prevMonth.range },
            { name: 'Steven', period: fourMonthsAgo.range, highlight: true }
          ]
        }
    }
  }

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

  // 實時時鐘
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 香港天文台（開放數據）即時天氣
  useEffect(() => {
    const controller = new AbortController()

    const preferredPlaces = ['香港天文台', '京士柏', '香港公園', '黃大仙', '深水埗']

    const pickReading = <T extends { place?: string }>(data?: T[]) => {
      if (!data || data.length === 0) return undefined
      return (
        data.find((row) => row.place && preferredPlaces.includes(row.place)) ??
        data.find((row) => row.place) ??
        data[0]
      )
    }

    const normalizeUnit = (unit?: string) => {
      const u = (unit ?? '').trim().toLowerCase()
      if (u === 'percent' || u === '%' || u === 'percentage') return '%'
      if (u === 'c' || u === '°c') return '°C'
      if (u === 'mm') return 'mm'
      return unit ?? ''
    }

    const hkoForecastIconUrl = (icon?: number | string) => {
      const raw = typeof icon === 'number' ? String(icon) : (icon ?? '').trim()
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 0) return undefined
      return `https://www.hko.gov.hk/images/HKOWxIconOutline/pic${n}.png`
    }

    const formatYmd = (yyyymmdd?: string) => {
      if (!yyyymmdd || yyyymmdd.length !== 8) return '—'
      const y = Number(yyyymmdd.slice(0, 4))
      const m = Number(yyyymmdd.slice(4, 6))
      const d = Number(yyyymmdd.slice(6, 8))
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return '—'
      const dt = new Date(y, m - 1, d)
      return dt.toLocaleDateString('zh-HK', { month: 'numeric', day: 'numeric' })
    }

    const fetchHko = async () => {
      try {
        setHkoStatus('loading')
        const [rhrRes, fndRes] = await Promise.all([
          fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc', {
            signal: controller.signal,
          }),
          fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=tc', {
            signal: controller.signal,
          }),
        ])

        if (!rhrRes.ok) throw new Error(`HKO rhrread HTTP ${rhrRes.status}`)
        if (!fndRes.ok) throw new Error(`HKO fnd HTTP ${fndRes.status}`)

        const json = (await rhrRes.json()) as HkoRhrreadResponse
        const fndJson = (await fndRes.json()) as HkoFndResponse

        // Store all location data for picker
        const allTempData = (json.temperature?.data ?? [])
          .filter((d) => d.place && d.value)
          .map((d) => ({ place: d.place!, value: d.value!, unit: normalizeUnit(d.unit) }))
        const allHumidityData = (json.humidity?.data ?? [])
          .filter((d) => d.place && d.value)
          .map((d) => ({ place: d.place!, value: d.value!, unit: normalizeUnit(d.unit) }))
        const allRainfallData = (json.rainfall?.data ?? [])
          .filter((d) => d.place)
          .map((d) => {
            const val = d.max ?? d.max1 ?? d.value ?? d.value1 ?? d.min ?? d.min1 ?? '0'
            return { place: d.place!, value: String(val), unit: normalizeUnit(d.unit ?? d.unit1 ?? 'mm') }
          })

        setAllHkoData({
          temperature: allTempData,
          humidity: allHumidityData,
          rainfall: allRainfallData,
        })

        const temp = pickReading(json.temperature?.data)
        const humidity = pickReading(json.humidity?.data)

        const rainfallRow = pickReading(json.rainfall?.data)
        const rainfallValue =
          rainfallRow?.max ??
          rainfallRow?.max1 ??
          rainfallRow?.value ??
          rainfallRow?.value1 ??
          rainfallRow?.min ??
          rainfallRow?.min1

        const warnings: string[] = Array.isArray(json.warningMessage)
          ? json.warningMessage.filter((m) => typeof m === 'string' && m.trim().length > 0)
          : typeof json.warningMessage === 'string' && (json.warningMessage as string).trim().length > 0
            ? [json.warningMessage as string]
            : []

        const snapshot: HkoWeatherSnapshot = {
          updatedAt: json.updateTime ?? json.temperature?.recordTime ?? json.humidity?.recordTime ?? json.rainfall?.endTime,
          temperature: temp
            ? { place: temp.place ?? '—', value: temp.value ?? '—', unit: normalizeUnit(temp.unit) }
            : undefined,
          humidity: humidity
            ? { place: humidity.place ?? '—', value: humidity.value ?? '—', unit: normalizeUnit(humidity.unit) }
            : undefined,
          rainfall:
            rainfallRow && rainfallValue !== undefined && rainfallValue !== null
              ? {
                  place: rainfallRow.place ?? '—',
                  value: String(rainfallValue),
                  unit: normalizeUnit(rainfallRow.unit ?? rainfallRow.unit1 ?? 'mm'),
                }
              : undefined,
          warnings,
        }

        const forecastDays: HkoForecastDay[] = Array.isArray(fndJson.weatherForecast)
          ? fndJson.weatherForecast.slice(0, 4).map((d) => {
              const minUnit = normalizeUnit(d.forecastMintemp?.unit)
              const maxUnit = normalizeUnit(d.forecastMaxtemp?.unit)
              return {
                dateLabel: formatYmd(d.forecastDate),
                weekLabel: d.week,
                iconUrl: hkoForecastIconUrl(d.ForecastIcon),
                weather: d.forecastWeather,
                minTemp: d.forecastMintemp?.value ? `${d.forecastMintemp.value}${minUnit}` : undefined,
                maxTemp: d.forecastMaxtemp?.value ? `${d.forecastMaxtemp.value}${maxUnit}` : undefined,
                psr: d.PSR,
              }
            })
          : []

        setHkoWeather(snapshot)
        setHkoForecast(forecastDays)
        setHkoStatus('ready')
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return
        console.error('HKO 天氣載入失敗:', err)
        setHkoStatus('error')
      }
    }

    fetchHko()
    const refresh = setInterval(fetchHko, 5 * 60 * 1000)

    return () => {
      controller.abort()
      clearInterval(refresh)
    }
  }, [])

  // （已移除）今日摘要：用戶不需要

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      const shouldClearRemembered = confirm('是否清除記憶的登入信息？')
      if (shouldClearRemembered) {
        localStorage.removeItem('mingcare_email')
        localStorage.removeItem('mingcare_password')
        localStorage.removeItem('mingcare_remember')
      }
      router.push('/')
    } catch (error) {
      console.error('登出錯誤:', error)
      router.push('/')
    }
  }

  if (loading) {
    return <LoadingScreen message="正在載入控制台..." />
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return '早安'
    if (hour < 18) return '午安'
    return '晚安'
  }

  const navigationItems = [
    {
      title: '客戶管理',
      description: '管理客戶資料與服務記錄',
      href: '/clients',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      accent: 'primary',
      layout: 'xl:col-span-7'
    },
    {
      title: '護理服務',
      description: '服務排程與記錄管理',
      href: '/services',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
      accent: 'success',
      layout: 'xl:col-span-5'
    },
    {
      title: '護理人員',
      description: '人員資料與排班管理',
      href: '/care-staff',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      accent: 'info',
      layout: 'xl:col-span-4'
    },
    {
      title: '佣金計算',
      description: '佣金與績效獎勵計算',
      href: '/commissions',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      accent: 'warning',
      layout: 'xl:col-span-4'
    },
    {
      title: '打卡記錄',
      description: '員工出勤與位置記錄',
      href: '/clock-records',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'error',
      layout: 'xl:col-span-4'
    },
    {
      title: '財務會計',
      description: '流水帳及零用金管理',
      href: '/accounting',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'success',
      layout: 'xl:col-span-6'
    },
    {
      title: '系統通知',
      description: '通知與公告訊息管理',
      href: '/notifications',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
      accent: 'primary',
      layout: 'xl:col-span-6'
    }
  ]

  const accentClasses = (accent: string) => {
    switch (accent) {
      case 'success':
        return {
          iconBg: 'bg-success-light',
          iconText: 'text-success',
          ring: 'ring-success/20',
        }
      case 'warning':
        return {
          iconBg: 'bg-warning-light',
          iconText: 'text-warning',
          ring: 'ring-warning/20',
        }
      case 'error':
        return {
          iconBg: 'bg-error-light',
          iconText: 'text-error',
          ring: 'ring-error/20',
        }
      case 'info':
        return {
          iconBg: 'bg-info-light',
          iconText: 'text-info',
          ring: 'ring-info/20',
        }
      case 'primary':
      default:
        return {
          iconBg: 'bg-primary-50',
          iconText: 'text-primary',
          ring: 'ring-primary/20',
        }
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  }

  const formatHkoUpdateTime = (iso?: string) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatHumidity = (value?: string, unit?: string) => {
    if (!value) return '—'
    const u = (unit ?? '').trim()
    if (u === '%' || u.toLowerCase() === 'percent' || u.toLowerCase() === 'percentage') return `${value}%`
    if (!u) return `${value}%`
    return `${value}${u}`
  }

  const formatTemp = (value?: string, unit?: string) => {
    if (!value) return '—'
    const rawValue = String(value).trim()
    const cleanedValue = rawValue.replace(/\s*°?c\s*$/i, '').trim()
    const u = (unit ?? '').trim()
    if (u === '°C' || u.toLowerCase() === 'c') return `${cleanedValue}°C`
    if (!u) return value
    return `${value}${u}`
  }

  const formatRainfall = (value?: string, unit?: string) => {
    if (!value) return '0mm'
    if (value.trim().toUpperCase() === 'M') return '0mm'
    return `${value}${unit ?? 'mm'}`
  }

  const reminderContent = getReminderContent()

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* 提醒彈出框 */}
      {reminderPopup && reminderContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-[90%] max-w-md mx-4 animate-scale-in">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{reminderContent.icon}</div>
              <h2 className="text-xl font-bold text-text-primary">{reminderContent.title}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-5">
              {reminderContent.items.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl text-center ${
                    item.highlight 
                      ? 'bg-warning/10 border border-warning/20' 
                      : 'bg-bg-secondary'
                  }`}
                >
                  <div className="text-sm font-semibold text-text-primary">{item.name}</div>
                  <div className="text-xs text-text-secondary mt-1">{item.period}</div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => dismissReminder(false)}
                className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
              >
                知道了
              </button>
              <button
                onClick={() => dismissReminder(true)}
                className="w-full py-2 px-4 text-text-tertiary text-sm hover:text-text-secondary transition-colors"
              >
                今日不再顯示
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 背景光暈（不影響白底，但更有質感） */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-24 -right-24 h-72 w-72 rounded-full bg-info/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-success/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-light bg-bg-primary/80 backdrop-blur-glass">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-16 h-16 sm:w-28 md:w-36 sm:h-28 md:h-36 -my-2 sm:-my-6 md:-my-8">
                <Image
                  src={getAssetPath('images/mingcare-logo.png')}
                  alt="明家護理服務"
                  width={256}
                  height={256}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-text-primary leading-tight">管理控制台</div>
                <div className="text-xs text-text-tertiary leading-tight">MingCare Intranet</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-text-tertiary">{getGreeting()}</p>
                  <p className="text-sm text-text-secondary truncate max-w-[220px]">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn-apple-secondary"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative max-w-screen-2xl mx-auto px-3 sm:px-6 py-6">
        {/* Hero - 2026 Premium Design */}
        <div className="card-apple mb-4 animate-fade-in overflow-hidden relative">
          {/* 背景裝飾 */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-success/20 to-transparent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="card-apple-content relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-primary text-xs font-semibold">系統運行正常</span>
                </div>
                <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
                  {getGreeting()}，歡迎回來
                </h1>
                <p className="mt-2 text-text-secondary">
                  {formatDate(currentTime)} · <span className="font-mono tabular-nums">{formatTime(currentTime)}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/clients/new')}
                className="btn-apple-primary w-full py-3.5 min-h-[52px] text-sm sm:text-base group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新增客戶
              </button>
              <button
                onClick={() => router.push('/services?tab=schedule')}
                className="btn-apple-secondary w-full py-3.5 min-h-[52px] text-sm sm:text-base group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                新增服務記錄
              </button>
            </div>
          </div>
        </div>

        {/* 天氣 + 日曆 並排 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* 香港天文台天氣 */}
          <div className="card-apple">
            <div className="card-apple-content">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-text-primary">天氣預報</div>
                <div className="text-xs text-text-tertiary">香港天文台</div>
              </div>
              
              {hkoStatus === 'loading' && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}

            {hkoStatus === 'error' && (
              <div className="text-center py-8">
                <div className="text-sm text-white/60">暫時無法讀取天文台資料</div>
              </div>
            )}

            {hkoStatus === 'ready' && (
              <div className="space-y-4">
                {/* 頂部：地點 + 今日天氣 */}
                <div className="text-center">
                  <div className="relative inline-block">
                    <select
                      value={selectedTempPlace}
                      onChange={(e) => setSelectedTempPlace(e.target.value)}
                      className="text-lg text-text-primary font-medium bg-transparent border-none cursor-pointer text-center appearance-none pr-5 focus:ring-0 focus:outline-none"
                    >
                      {allHkoData?.temperature.map((d) => (
                        <option key={d.place} value={d.place}>{d.place}</option>
                      ))}
                    </select>
                    <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="text-6xl font-extralight text-text-primary tabular-nums mt-1">
                    {formatTemp(
                      allHkoData?.temperature.find((d) => d.place === selectedTempPlace)?.value ?? hkoWeather?.temperature?.value,
                      allHkoData?.temperature.find((d) => d.place === selectedTempPlace)?.unit ?? hkoWeather?.temperature?.unit
                    )}
                  </div>
                  {/* 今日天氣描述 + 圖標 */}
                  {hkoForecast[0] && (
                    <div className="flex items-center justify-center gap-2 mt-1">
                      {hkoForecast[0].iconUrl && (
                        <img
                          src={hkoForecast[0].iconUrl}
                          alt=""
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      <span className="text-sm text-text-secondary">
                        {hkoForecast[0].weather || '—'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {hkoForecast[0] && (
                      <>
                        <span className="text-sm text-text-secondary">
                          最高 {hkoForecast[0].maxTemp?.replace('°C', '')}°
                        </span>
                        <span className="text-sm text-text-secondary">
                          最低 {hkoForecast[0].minTemp?.replace('°C', '')}°
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* 天氣警告 - 顯示在今日天氣下面 */}
                  {hkoWeather?.warnings.length ? (
                    <div className="mt-3 px-3 py-2 rounded-xl bg-warning/10 border border-warning/20">
                      <div className="text-xs text-warning line-clamp-1">
                        ⚠️ {hkoWeather.warnings[0]}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* 分隔線 */}
                <div className="border-t border-border-light" />

                {/* 未來天氣預報 - iOS 風格 */}
                {hkoForecast.length > 0 && (
                  <div className="space-y-2">
                    {hkoForecast.slice(0, 5).map((d, idx) => {
                      const minTemp = parseInt(d.minTemp?.replace('°C', '') ?? '15');
                      const maxTemp = parseInt(d.maxTemp?.replace('°C', '') ?? '25');
                      // 計算溫度條位置 (假設範圍 10-35°C)
                      const rangeMin = 10;
                      const rangeMax = 35;
                      const leftPercent = ((minTemp - rangeMin) / (rangeMax - rangeMin)) * 100;
                      const widthPercent = ((maxTemp - minTemp) / (rangeMax - rangeMin)) * 100;
                      
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-10 text-sm text-text-secondary">{d.dateLabel}</div>
                          {d.iconUrl && (
                            <img
                              src={d.iconUrl}
                              alt=""
                              className="w-6 h-6 object-contain"
                              loading="lazy"
                            />
                          )}
                          <div className="w-8 text-sm text-text-tertiary tabular-nums text-right">
                            {minTemp}°
                          </div>
                          {/* 溫度條 */}
                          <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full relative overflow-hidden">
                            <div
                              className="absolute h-full rounded-full"
                              style={{
                                left: `${Math.max(0, leftPercent)}%`,
                                width: `${Math.min(100 - leftPercent, widthPercent)}%`,
                                background: 'linear-gradient(to right, #3b82f6, #22c55e, #eab308, #f97316)',
                              }}
                            />
                          </div>
                          <div className="w-8 text-sm text-text-primary tabular-nums">
                            {maxTemp}°
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          {/* 當月日曆 */}
          <div className="card-apple">
            <div className="card-apple-content">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-bg-secondary transition-colors text-text-tertiary hover:text-text-primary"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="text-lg font-semibold text-text-primary min-w-[120px] text-center">
                    {calendarDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}
                  </div>
                  <button
                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-bg-secondary transition-colors text-text-tertiary hover:text-text-primary"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={() => setCalendarDate(new Date())}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  今日
                </button>
              </div>
              
              {/* 星期標題 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
                  <div key={day} className={`text-center text-xs font-medium py-1 ${idx === 0 || idx === 6 ? 'text-text-tertiary' : 'text-text-secondary'}`}>
                    {day}
                  </div>
                ))}
              </div>
              
              {/* 日曆格子 */}
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const year = calendarDate.getFullYear();
                  const month = calendarDate.getMonth();
                  const todayDate = new Date();
                  const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month;
                  const today = isCurrentMonth ? todayDate.getDate() : -1;
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const days = [];
                  
                  // 計算佣金月份和日期範圍
                  const getMonthInfo = (m: number, baseYear: number) => {
                    let adjustedYear = baseYear;
                    let adjustedMonth = m;
                    while (adjustedMonth < 0) {
                      adjustedMonth += 12;
                      adjustedYear -= 1;
                    }
                    while (adjustedMonth >= 12) {
                      adjustedMonth -= 12;
                      adjustedYear += 1;
                    }
                    const monthNum = adjustedMonth + 1;
                    const lastDay = new Date(adjustedYear, adjustedMonth + 1, 0).getDate();
                    return {
                      name: `${monthNum}月`,
                      range: `${monthNum}月1日 - ${monthNum}月${lastDay}日`,
                    };
                  };
                  // Doctor Lee, Annie, Carmen: 上個月（發放月份 - 1）
                  const prevMonthInfo = getMonthInfo(month - 1, year);
                  // Steven: 前4個月（發放月份 - 4）
                  const fourMonthsAgoInfo = getMonthInfo(month - 4, year);
                  
                  // 填充月初空白
                  for (let i = 0; i < firstDay; i++) {
                    days.push(<div key={`empty-${i}`} className="aspect-square" />);
                  }
                  
                  // 填充日期
                  for (let d = 1; d <= daysInMonth; d++) {
                    const isToday = d === today;
                    const dayOfWeek = new Date(year, month, d).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isCommissionDay = d === 7;
                    const isServiceFeeDay3 = d === 3; // Steven140/Steven200 收費日
                    const isServiceFeeDay5 = d === 5; // 俊佳218/醫點 收費日
                    
                    // 服務費收取：3日收2個月前、5日收4個月前
                    const twoMonthsAgoInfo = getMonthInfo(month - 2, year);
                    const fourMonthsAgoInfo = getMonthInfo(month - 4, year);
                    
                    days.push(
                      <div
                        key={d}
                        className={`aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer transition-colors relative group/day
                          ${isToday 
                            ? 'bg-primary text-white font-semibold' 
                            : isWeekend 
                              ? 'text-text-tertiary hover:bg-bg-secondary' 
                              : 'text-text-primary hover:bg-bg-secondary'
                          }
                          ${isCommissionDay && !isToday ? 'ring-2 ring-success/50' : ''}
                          ${(isServiceFeeDay3 || isServiceFeeDay5) && !isToday ? 'ring-2 ring-primary/50' : ''}`}
                      >
                        {d}
                        
                        {/* 3日服務費收取提示 - Steven140/Steven200 */}
                        {isServiceFeeDay3 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[420px] p-4 rounded-2xl bg-bg-primary border border-border-light shadow-apple-hover opacity-0 invisible group-hover/day:opacity-100 group-hover/day:visible transition-all duration-200 z-50 pointer-events-none">
                            <div className="text-base font-bold text-text-primary mb-3">💵 服務費收取日</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2.5 rounded-xl bg-bg-secondary">
                                <div className="text-sm font-semibold text-text-primary">Steven140</div>
                                <div className="text-xs text-text-secondary">{twoMonthsAgoInfo.range}</div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-bg-secondary">
                                <div className="text-sm font-semibold text-text-primary">Steven200</div>
                                <div className="text-xs text-text-secondary">{twoMonthsAgoInfo.range}</div>
                              </div>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                              <div className="w-3 h-3 bg-bg-primary border-r border-b border-border-light transform rotate-45" />
                            </div>
                          </div>
                        )}
                        
                        {/* 5日服務費收取提示 - 俊佳218/醫點 (收4個月前) */}
                        {isServiceFeeDay5 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[420px] p-4 rounded-2xl bg-bg-primary border border-border-light shadow-apple-hover opacity-0 invisible group-hover/day:opacity-100 group-hover/day:visible transition-all duration-200 z-50 pointer-events-none">
                            <div className="text-base font-bold text-text-primary mb-3">💵 服務費收取日</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2.5 rounded-xl bg-bg-secondary">
                                <div className="text-sm font-semibold text-text-primary">俊佳218</div>
                                <div className="text-xs text-text-secondary">{fourMonthsAgoInfo.range}</div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-bg-secondary">
                                <div className="text-sm font-semibold text-text-primary">醫點</div>
                                <div className="text-xs text-text-secondary">{fourMonthsAgoInfo.range}</div>
                              </div>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                              <div className="w-3 h-3 bg-bg-primary border-r border-b border-border-light transform rotate-45" />
                            </div>
                          </div>
                        )}
                        
                        {/* 7日佣金發放提示 */}
                        {isCommissionDay && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[480px] p-4 rounded-2xl bg-bg-primary border border-border-light shadow-apple-hover opacity-0 invisible group-hover/day:opacity-100 group-hover/day:visible transition-all duration-200 z-50 pointer-events-none">
                            <div className="text-base font-bold text-text-primary mb-3">💰 佣金發放日</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2.5 rounded-xl bg-bg-secondary">
                                <div className="text-sm font-semibold text-text-primary">Doctor Lee</div>
                                <div className="text-xs text-text-secondary">{prevMonthInfo.range}</div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-bg-secondary">
                                <div className="text-sm font-semibold text-text-primary">Annie</div>
                                <div className="text-xs text-text-secondary">{prevMonthInfo.range}</div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-bg-secondary">
                                <div className="text-sm font-semibold text-text-primary">Carmen</div>
                                <div className="text-xs text-text-secondary">{prevMonthInfo.range}</div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/20">
                                <div className="text-sm font-semibold text-text-primary">Steven</div>
                                <div className="text-xs text-text-secondary">{fourMonthsAgoInfo.range}</div>
                              </div>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                              <div className="w-3 h-3 bg-bg-primary border-r border-b border-border-light transform rotate-45" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return days;
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Bento Navigation - 2026 Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
          {navigationItems.map((item, index) => {
            const accent = accentClasses(item.accent)
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`group ${item.layout} card-apple text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-white hover:shadow-apple-hover transition-all duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="card-apple-content relative overflow-hidden">
                  {/* 背景光效 */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 ${accent.iconBg} rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2`} />
                  </div>
                  
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className={`w-14 h-14 rounded-2xl ${accent.iconBg} ${accent.iconText} ring-1 ${accent.ring} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                        {item.icon}
                      </div>
                      <h3 className="text-2xl font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-bg-secondary border border-border-light flex items-center justify-center text-text-tertiary group-hover:text-white group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-5 flex items-center gap-2 text-xs text-text-tertiary">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-bg-secondary border border-border-light group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                      快速進入
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-text-tertiary">
            <span className="w-2 h-2 bg-success rounded-full" />
            <span>系統運行正常</span>
            <span className="mx-2">•</span>
            <span>© 2025 明家居家護理服務有限公司</span>
          </div>
        </div>
      </main>
    </div>
  )
}
