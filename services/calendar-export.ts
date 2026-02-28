// 📅 日曆導出服務
// Calendar Export Service

import { BillingSalaryRecord, BillingSalaryFilters } from '../types/billing-salary'
import { supabase } from '../lib/supabase'

// =============================================================================
// 類型定義
// =============================================================================

export interface CalendarEvent {
  uid: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  location?: string
  categories?: string[]
  organizer?: string
  attendees?: string[]
}

export interface CalendarExportOptions {
  format?: 'pdf'
  filters: BillingSalaryFilters
  includeStaffDetails?: boolean
  includeCustomerDetails?: boolean
  timezone?: string
  nameMode?: 'customer' | 'staff'  // PDF 檔案名稱使用客戶名稱或護理人員名稱
  selectedStaffName?: string        // 選定的護理人員名稱（多位時由使用者選擇）
}

export interface CalendarExportResult {
  success: boolean
  data?: string | URL
  filename?: string
  error?: string
}

// =============================================================================
// 主要導出功能
// =============================================================================

/**
 * 導出日曆數據
 */
export async function exportCalendar(options: CalendarExportOptions): Promise<CalendarExportResult> {
  try {
    const format = options.format ?? 'pdf'
    console.log('🚀 開始導出日曆，格式:', format, '選項:', options)

    // 1. 獲取排班數據
    const scheduleData = await getScheduleDataForExport(options.filters)
    if (!scheduleData.success || !scheduleData.data) {
      return {
        success: false,
        error: scheduleData.error || '無法獲取排班數據'
      }
    }

    // 2. 轉換為日曆事件
    const events = convertToCalendarEvents(scheduleData.data, options)

    // 3. 如果不是用護理人員搜尋，獲取客戶CCSV資料
    let customerInfoMap = new Map<string, { voucher_number: string }>()
    if (!options.filters.careStaffName) {
      const uniqueCustomerIds = Array.from(
        new Set(scheduleData.data.map((r: BillingSalaryRecord) => r.customer_id).filter((id: string | undefined): id is string => Boolean(id)))
      )
      if (uniqueCustomerIds.length > 0) {
        const { data: customerData } = await supabase
          .from('customer_personal_data')
          .select('customer_id, voucher_number')
          .in('customer_id', uniqueCustomerIds)
        if (customerData) {
          customerData.forEach((c: { customer_id: string; voucher_number: string | null }) => {
            customerInfoMap.set(c.customer_id, {
              voucher_number: c.voucher_number || ''
            })
          })
        }
      }
    }

    return exportToPDF(events, scheduleData.data, options, customerInfoMap)

  } catch (error) {
    console.error('❌ 日曆導出失敗:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '導出失敗'
    }
  }
}

// =============================================================================
// 數據獲取
// =============================================================================

/**
 * 獲取排班數據用於導出
 */
async function getScheduleDataForExport(filters: BillingSalaryFilters) {
  try {
    let query = supabase
      .from('billing_salary_data')
      .select('*')
      .order('service_date', { ascending: true })

    // 應用篩選條件
    if (filters.dateRange.start && filters.dateRange.end) {
      query = query
        .gte('service_date', filters.dateRange.start)
        .lte('service_date', filters.dateRange.end)
    }

    if (filters.serviceType) {
      query = query.eq('service_type', filters.serviceType)
    }

    if (Array.isArray(filters.projectCategory)) {
      const categories = filters.projectCategory.filter(category => !!category)
      if (categories.length > 0) {
        query = query.in('project_category', categories)
      }
    } else if (filters.projectCategory) {
      query = query.eq('project_category', filters.projectCategory)
    }

    if (filters.projectManager) {
      query = query.eq('project_manager', filters.projectManager)
    }

    if (filters.careStaffName) {
      query = query.ilike('care_staff_name', `%${filters.careStaffName}%`)
    }

    if (filters.selectedCustomerIds && filters.selectedCustomerIds.length > 0) {
      query = query.in('customer_id', filters.selectedCustomerIds)
    } else if (filters.searchTerm && filters.searchTerm.trim().length >= 2) {
      const searchTerm = filters.searchTerm.trim()
      query = query.or(
        `customer_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,customer_id.ilike.%${searchTerm}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('數據庫查詢錯誤:', error)
      return {
        success: false,
        error: `數據庫錯誤: ${error.message}`
      }
    }

    return {
      success: true,
      data: data || []
    }

  } catch (error) {
    console.error('獲取排班數據錯誤:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取數據失敗'
    }
  }
}

// =============================================================================
// 事件轉換
// =============================================================================

/**
 * 將排班數據轉換為日曆事件
 */
function convertToCalendarEvents(
  records: BillingSalaryRecord[],
  options: CalendarExportOptions
): CalendarEvent[] {
  return records.map((record, index) => {
    // 建立事件時間
    const serviceDate = new Date(record.service_date)
    const startTime = record.start_time || '09:00'
    const endTime = record.end_time || '17:00'

    const startDate = new Date(serviceDate)
    const [startHour, startMinute] = startTime.split(':').map(Number)
    startDate.setHours(startHour, startMinute, 0, 0)

    const endDate = new Date(serviceDate)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    endDate.setHours(endHour, endMinute, 0, 0)

    // 建立事件標題
    let title = `${record.customer_name} - ${record.service_type}`
    if (options.includeStaffDetails && record.care_staff_name) {
      title += ` (${record.care_staff_name})`
    }

    // 建立事件描述
    let description = `服務類型: ${record.service_type}\n`
    description += `客戶: ${record.customer_name}\n`
    
    if (options.includeStaffDetails && record.care_staff_name) {
      description += `護理員: ${record.care_staff_name}\n`
    }
    
    if (options.includeCustomerDetails) {
      if (record.customer_id) description += `客戶編號: ${record.customer_id}\n`
      if (record.phone) description += `聯絡電話: ${record.phone}\n`
    }
    
    if (record.service_hours) description += `服務時數: ${record.service_hours} 小時\n`
    if (record.project_category) description += `所屬項目: ${record.project_category}\n`
    if (record.project_manager) description += `項目經理: ${record.project_manager}\n`

    return {
      uid: `mingcare-${record.id || index}-${Date.now()}@mingcarehome.com`,
      title,
      description: description.trim(),
      startDate,
      endDate,
      location: record.service_address || undefined,
      categories: [record.project_category || '護理服務', record.service_type || '一般服務'],
      organizer: record.project_manager || 'MingCare',
      attendees: record.care_staff_name ? [record.care_staff_name] : undefined
    }
  })
}

// =============================================================================
// PDF 導出
// =============================================================================


function exportToPDF(
  events: CalendarEvent[],
  records: BillingSalaryRecord[],
  options: CalendarExportOptions,
  customerInfoMap: Map<string, { voucher_number: string }> = new Map()
): CalendarExportResult {
  try {
    const sortedRecords = [...records].sort((a, b) => {
      const dateDiff = new Date(a.service_date).getTime() - new Date(b.service_date).getTime()
      if (dateDiff !== 0) return dateDiff
      const startA = (a.start_time || '').localeCompare(b.start_time || '')
      if (startA !== 0) return startA
      return (a.customer_name || '').localeCompare(b.customer_name || '')
    })

    const timeFormatter = (time?: string) => {
      if (!time) return '—'
      const [hour, minute] = time.split(':')
      return `${hour}:${minute}`
    }

    const filters = options.filters
    const rangeLabel = filters.dateRange?.start && filters.dateRange?.end
      ? `${filters.dateRange.start} 至 ${filters.dateRange.end}`
      : '未指定日期範圍'

    const monthReference = (() => {
      if (filters.dateRange?.start) {
        const date = new Date(filters.dateRange.start)
        if (!Number.isNaN(date.getTime())) return date
      }
      if (sortedRecords.length > 0) {
        const date = new Date(sortedRecords[0].service_date)
        if (!Number.isNaN(date.getTime())) return date
      }
      return new Date()
    })()

    const monthLabel = `${monthReference.getFullYear()}年${String(monthReference.getMonth() + 1).padStart(2, '0')}月`

    const uniqueCustomers = Array.from(
      new Set(sortedRecords.map(record => record.customer_name).filter((name): name is string => Boolean(name)))
    )

    const uniqueStaff = Array.from(
      new Set(sortedRecords.map(record => record.care_staff_name).filter((name): name is string => Boolean(name)))
    )

    const isStaffMode = options.nameMode === 'staff'

    const customerLabel = uniqueCustomers.length === 0
      ? '全部客戶'
      : uniqueCustomers.length === 1
        ? uniqueCustomers[0]
        : `${uniqueCustomers[0]} 等 ${uniqueCustomers.length} 位客戶`

    const staffLabel = isStaffMode
      ? (options.selectedStaffName || (uniqueStaff.length === 1 ? uniqueStaff[0] : `${uniqueStaff[0] || '護理員'} 等 ${uniqueStaff.length} 位護理員`))
      : ''

    const primaryRecord = sortedRecords.find(record => record.customer_name) || sortedRecords[0]
    const primaryCustomerName = primaryRecord?.customer_name || '全部客戶'
    const primaryCustomerId = primaryRecord?.customer_id || '無編號'

    const totalHours = sortedRecords.reduce((sum, record) => sum + (record.service_hours || 0), 0)

    const headerValues: string[] = isStaffMode
      ? [staffLabel, customerLabel, rangeLabel]
      : [customerLabel, rangeLabel]

    if (filters.careStaffName && !isStaffMode) {
      headerValues.push(`護理員 ${filters.careStaffName}`)
    }

    // 如果不是護理人員搜尋，顯示客戶CCSV
    if (!filters.careStaffName && customerInfoMap.size > 0) {
      if (uniqueCustomers.length === 1 && primaryRecord) {
        // 單一客戶：直接在 header 顯示
        const info = customerInfoMap.get(primaryRecord.customer_id)
        if (info) {
          if (info.voucher_number) headerValues.push(`CCSV: ${info.voucher_number}`)
        }
      } else if (uniqueCustomers.length > 1) {
        // 多位客戶：列出所有客戶的CCSV
        const customerDetails: string[] = []
        sortedRecords.forEach(record => {
          if (record.customer_id && !customerDetails.some(d => d.startsWith(record.customer_name || ''))) {
            const info = customerInfoMap.get(record.customer_id)
            if (info && info.voucher_number) {
              const parts = [record.customer_name || record.customer_id]
              parts.push(`CCSV: ${info.voucher_number}`)
              customerDetails.push(parts.join(' / '))
            }
          }
        })
        if (customerDetails.length > 0) {
          headerValues.push(customerDetails.join(' | '))
        }
      }
    }

    headerValues.push(
      `${events.length} 筆排班`,
      `${totalHours.toFixed(1)} 小時`,
      uniqueCustomers.length ? `${uniqueCustomers.length} 位客戶` : '0 位客戶'
    )

    const valuesHtml = headerValues
      .map(item => escapeHtmlWithNbsp(item))
      .join('<span class="info-separator">·</span>')

    const filenameDisplayName = isStaffMode
      ? sanitizeForFilename(options.selectedStaffName || uniqueStaff[0] || primaryCustomerName)
      : sanitizeForFilename(primaryCustomerName)
    const filenameIdPart = isStaffMode
      ? sanitizeForFilename(options.selectedStaffName || uniqueStaff[0] || '護理員')
      : sanitizeForFilename(primaryCustomerId)
    const filenameBase = `${filenameDisplayName}${sanitizeForFilename(monthLabel)}更表-${filenameIdPart}-明家居家護理服務`
    const estimatedPages = Math.max(1, Math.ceil(events.length / 10))
    const filenameWithPages = `${filenameBase} (${estimatedPages}).pdf`
    const pageTitle = filenameWithPages.replace(/\.pdf$/, '')

    const formatDateKey = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const recordsByDate = sortedRecords.reduce<Record<string, BillingSalaryRecord[]>>((acc, record) => {
      const key = record.service_date
      acc[key] = acc[key] || []
      acc[key].push(record)
      return acc
    }, {})

    const year = monthReference.getFullYear()
    const month = monthReference.getMonth()
    const defaultRangeStart = new Date(year, month, 1)
    const defaultRangeEnd = new Date(year, month + 1, 0)
    const rangeStart = filters.dateRange?.start ? parseISODate(filters.dateRange.start) : defaultRangeStart
    const rangeEnd = filters.dateRange?.end ? parseISODate(filters.dateRange.end) : defaultRangeEnd

    const calendarStart = new Date(rangeStart)
    calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay())
    const calendarEnd = new Date(rangeEnd)
    const endOffset = 6 - calendarEnd.getDay()
    calendarEnd.setDate(calendarEnd.getDate() + (endOffset >= 0 ? endOffset : 0))

    const dayMillis = 24 * 60 * 60 * 1000
    const calendarDays: Date[] = []
    for (let time = calendarStart.getTime(); time <= calendarEnd.getTime(); time += dayMillis) {
      calendarDays.push(new Date(time))
    }

    const rangeStartTime = rangeStart.getTime()
    const rangeEndTime = rangeEnd.getTime()
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const weekCount = Math.ceil(calendarDays.length / 7)
    const todayKey = formatDateKey(new Date())

    const calendarRows: string[] = []
    for (let week = 0; week < weekCount; week++) {
      const cells = calendarDays.slice(week * 7, week * 7 + 7).map(date => {
        const dayKey = formatDateKey(date)
        const dayRecords = recordsByDate[dayKey] || []
        const isCurrentMonth = date.getMonth() === month && date.getFullYear() === year
        const isWithinRange = date.getTime() >= rangeStartTime && date.getTime() <= rangeEndTime
        const classes = ['calendar-cell']
        if (!isCurrentMonth) classes.push('other-month')
        if (!isWithinRange) classes.push('out-of-range')
        if (dayKey === todayKey) classes.push('today')
        if (date.getDay() === 0 || date.getDay() === 6) classes.push('weekend')

        const densityClass = isWithinRange && dayRecords.length >= 5
          ? 'density-high'
          : isWithinRange && dayRecords.length >= 3
            ? 'density-medium'
            : 'density-low'

        const eventsHtml = isWithinRange && dayRecords.length > 0
          ? dayRecords.map(record => {
              const timeRange = `${timeFormatter(record.start_time)}${record.end_time ? ` - ${timeFormatter(record.end_time)}` : ''}`
              const hoursText = record.service_hours ? ` (${record.service_hours.toFixed(1)} 小時)` : ''
              const timeLine = `${timeRange}${hoursText}`
              const nameParts: string[] = []
              if (record.customer_name) nameParts.push(escapeHtml(record.customer_name))
              if (record.care_staff_name) nameParts.push(escapeHtml(record.care_staff_name))
              const serviceLine = record.service_type ? `<div class="event-line event-line--service">${escapeHtml(record.service_type)}</div>` : ''
              const locationLine = record.service_address ? `<div class="event-line event-line--location">${escapeHtml(record.service_address)}</div>` : ''
              return `
                <div class="event">
                  <div class="event-line event-line--time">${escapeHtml(timeLine)}</div>
                  ${nameParts.length > 0 ? `<div class="event-line">${nameParts.join(' · ')}</div>` : ''}
                  ${serviceLine}
                  ${locationLine}
                </div>
              `
            }).join('')
          : isWithinRange
            ? '<div class="no-events">無排班</div>'
            : ''

        return `
          <td class="${classes.join(' ')}">
            <div class="day-number">${date.getDate()}</div>
            <div class="events ${densityClass}">${eventsHtml}</div>
          </td>
        `
      })
      calendarRows.push(`<tr>${cells.join('')}</tr>`)
    }

    const calendarTable = `
      <table class="calendar-grid">
        <thead>
          <tr>${weekdays.map(weekDay => `<th>${weekDay}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${calendarRows.join('\n')}
        </tbody>
      </table>
    `

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="zh-HK">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(pageTitle)}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          :root {
            color-scheme: light;
          }
          body {
            font-family: "PingFang TC", "Microsoft JhengHei", "SimSun", sans-serif;
            margin: 0;
            padding: 16px;
            background: #f8fafc;
            color: #1f2933;
            line-height: 1.5;
          }
          .header {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
          }
          .header-actions {
            align-self: flex-end;
          }
          .download-button {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            border: none;
            color: #fff;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 8px 16px rgba(37, 99, 235, 0.25);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .download-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 20px rgba(29, 78, 216, 0.3);
          }
          .download-button:active {
            transform: translateY(0);
            box-shadow: 0 6px 14px rgba(37, 99, 235, 0.25);
          }
          .header-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
          }
          .info-strip {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 8px 12px;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 15px;
            font-weight: 600;
            color: #1f2937;
            line-height: 1.4;
          }
          .info-strip span {
            white-space: nowrap;
          }
          .info-separator {
            color: #cbd5f5;
            font-size: 11px;
          }
          .calendar-grid {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
            page-break-inside: avoid;
          }
          .calendar-grid th {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: #fff;
            padding: 12px 8px;
            font-weight: 600;
            text-align: center;
            font-size: 13px;
            letter-spacing: 0.12em;
          }
          .calendar-grid td {
            width: 14.285%;
            min-height: 120px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
            padding: 8px;
            position: relative;
            background: #fff;
            transition: background 0.2s ease;
          }
          .calendar-cell.other-month {
            background: #f8fafc;
            color: #94a3b8;
          }
          .calendar-cell.out-of-range {
            background: #f1f5f9;
            color: #cbd5f5;
          }
          .calendar-cell.out-of-range .day-number {
            color: #cbd5f5;
          }
          .calendar-cell.weekend {
            background: #fff7ed;
          }
          .calendar-cell.weekend.other-month {
            background: #fff1e6;
          }
          .calendar-cell.today {
            box-shadow: inset 0 0 0 2px #2563eb;
            background: #eff6ff;
          }
          .day-number {
            font-weight: 700;
            font-size: 15px;
            color: #0f172a;
            margin-bottom: 6px;
          }
          .calendar-cell.other-month .day-number {
            color: #94a3b8;
          }
          .events {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .events.density-medium {
            gap: 6px;
          }
          .events.density-high {
            gap: 4px;
          }
          .event {
            border-left: 3px solid #2563eb;
            background: #eef2ff;
            padding: 6px 8px;
            border-radius: 10px;
            box-shadow: 0 10px 18px rgba(37, 99, 235, 0.15);
          }
          .events.density-medium .event {
            padding: 5px 7px;
            border-radius: 8px;
          }
          .events.density-high .event {
            padding: 4px 6px;
            border-radius: 6px;
          }
          .calendar-cell.weekend .event {
            border-left-color: #db2777;
            background: #fce7f3;
          }
          .calendar-cell.today .event {
            border-left-color: #1d4ed8;
          }
          .event-line {
            font-size: 12px;
            color: #0f172a;
            margin-top: 2px;
            line-height: 1.4;
          }
          .event-line:first-child {
            margin-top: 0;
          }
          .event-line--time {
            font-weight: 600;
            color: #1d4ed8;
          }
          .event-line--service {
            color: #475569;
          }
          .event-line--location {
            color: #94a3b8;
            word-break: break-word;
          }
          .events.density-medium .event-line {
            font-size: 10.8px;
          }
          .events.density-medium .event-line--time {
            font-size: 11.5px;
          }
          .events.density-high .event-line {
            font-size: 10px;
          }
          .events.density-high .event-line--time {
            font-size: 10.5px;
          }
          .no-events {
            font-size: 11px;
            color: #94a3b8;
            font-style: italic;
          }
          .calendar-cell.out-of-range .events {
            display: none;
          }
          .footer-note {
            margin-top: 32px;
            font-size: 12px;
            color: #64748b;
            text-align: center;
          }
          @media print {
            body {
              background: transparent;
              padding: 4mm 6mm;
            }
            .download-button {
              display: none;
            }
            .header-info {
              gap: 6px;
            }
            .info-strip {
              font-size: 12px;
              padding: 5px 8px;
            }
            .calendar-grid {
              box-shadow: none;
              border: 1px solid #cbd5f5;
              font-size: 11px;
              page-break-inside: avoid;
            }
            .calendar-grid tr,
            .calendar-grid td {
              page-break-inside: avoid;
            }
            .calendar-grid th {
              background: #1e3a8a;
              -webkit-print-color-adjust: exact;
              padding: 6px 5px;
              font-size: 11px;
            }
            .calendar-cell.weekend {
              background: #fff0f6 !important;
            }
            .calendar-cell.other-month {
              background: #f5f5f5 !important;
            }
            .calendar-cell.out-of-range {
              background: #f8fafc !important;
              color: #d1d5db !important;
            }
            .calendar-cell.out-of-range .day-number {
              color: #d1d5db !important;
            }
            .calendar-grid td {
              min-height: 90px;
              padding: 4px;
            }
            .event {
              border-left-width: 2px;
              padding: 3px 5px;
              box-shadow: none;
            }
            .events.density-medium {
              gap: 3px;
            }
            .events.density-high {
              gap: 2px;
            }
            .events.density-medium .event {
              padding: 2px 4px;
            }
            .events.density-high .event {
              padding: 2px 3px;
            }
            .event-line {
              font-size: 9.4px;
            }
            .event-line--time {
              font-size: 10px;
            }
            .events.density-medium .event-line {
              font-size: 9px;
            }
            .events.density-medium .event-line--time {
              font-size: 9.6px;
            }
            .events.density-high .event-line {
              font-size: 8.6px;
            }
            .events.density-high .event-line--time {
              font-size: 9.2px;
            }
            .calendar-cell.out-of-range .events {
              display: none;
            }
            .footer-note {
              margin-top: 8px;
              font-size: 10px;
            }
          }
        </style>
      </head>
      <body>
        <header class="header">
          <div class="header-actions">
            <button class="download-button" onclick="window.print()">儲存 PDF</button>
          </div>
          <div class="header-info">
            <div class="info-strip">${valuesHtml}</div>
          </div>
        </header>
        ${calendarTable}
        <p class="footer-note">此文件由 MingCare Intranet 於 ${escapeHtml(new Date().toLocaleString('zh-TW'))} 生成。使用瀏覽器「列印」功能即可匯出為 PDF 並分享。</p>
        <script>document.title = ${JSON.stringify(pageTitle)}</script>
      </body>
      </html>
    `

    return {
      success: true,
      data: htmlContent,
      filename: filenameWithPages
    }
  } catch (error) {
    console.error('PDF 導出錯誤:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PDF 導出失敗'
    }
  }
}

// =============================================================================
// 輔助函數
// =============================================================================

function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeHtmlWithNbsp(value: string): string {
  return escapeHtml(value).replace(/ /g, '&nbsp;')
}

function sanitizeForFilename(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 100)
}
