'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import LoadingScreen from '../../components/LoadingScreen'

interface CommissionRate {
  id?: string
  introducer: string
  first_month_commission: number
  subsequent_month_commission: number
  voucher_commission_percentage?: number | null
}

interface CustomerData {
  customer_id: string
  customer_name: string
  introducer: string
  customer_type: string
  voucher_number?: string
}

interface BillingData {
  customer_id: string
  service_date: string
  service_hours: number
  service_fee?: number
  project_category?: string
}

interface MonthlyStatsData {
  customer_id: string
  customer_name: string
  introducer: string
  service_month: string
  monthly_hours: number
  monthly_fee: number
  first_service_date: string
  voucher_number?: string
}

interface CustomerCommissionData {
  customer_id: string
  customer_name: string
  introducer: string
  service_month: string
  monthly_hours: number
  monthly_fee: number
  is_qualified: boolean
  month_sequence: number
  commission_amount: number
  first_service_date: string
  voucher_number?: string
}

interface IntroducerSummary {
  introducer: string
  total_commission: number
  first_month_count: number
  subsequent_month_count: number
  customers: CustomerCommissionData[]
}

export default function CommissionsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [commissionData, setCommissionData] = useState<IntroducerSummary[]>([])
  const [commissionRatesData, setCommissionRatesData] = useState<CommissionRate[]>([])
  const [allCommissionData, setAllCommissionData] = useState<CustomerCommissionData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedIntroducer, setSelectedIntroducer] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [showRateSettings, setShowRateSettings] = useState(false)
  const [editingRates, setEditingRates] = useState<CommissionRate[]>([])
  const [savingRates, setSavingRates] = useState(false)
  const [allIntroducers, setAllIntroducers] = useState<string[]>([])
  const router = useRouter()

  // PDF生成函數
  const generatePDF = () => {
    try {
      // 按月份分組數據
      const monthlyData = new Map<string, CustomerCommissionData[]>()
      allFilteredCommissionData.forEach((item: CustomerCommissionData) => {
        if (!monthlyData.has(item.service_month)) {
          monthlyData.set(item.service_month, [])
        }
        monthlyData.get(item.service_month)!.push(item)
      })

      const sortedMonths = Array.from(monthlyData.keys()).sort()
      
      // 總計數據
      let totalServiceFee = 0
      let totalServiceHours = 0
      let totalQualifiedCustomers = 0
      let totalUnqualifiedCustomers = 0
      let totalCommission = 0
      const allIntroducers = new Set<string>() // 用來統計所有出現的介紹人

      // 為每個月計算統計並按介紹人分組
      const monthlyStats = sortedMonths.map((month: string) => {
        const monthData = monthlyData.get(month)!
        const [year, monthNum] = month.split('-')
        
        // 按介紹人分組 - 包含所有有佣金的記錄
        const introducerGroups = new Map<string, CustomerCommissionData[]>()
        monthData.forEach((item: CustomerCommissionData) => {
          // 處理有佣金率設定的介紹人，且實際有佣金的記錄
          const commissionRateRecord = commissionRatesData.find(r => r.introducer === item.introducer)
          const hasCommissionRate = commissionRateRecord && commissionRateRecord.first_month_commission > 0
          const hasActualCommission = item.commission_amount > 0
          
          if (hasCommissionRate && hasActualCommission) {
            if (!introducerGroups.has(item.introducer)) {
              introducerGroups.set(item.introducer, [])
            }
            introducerGroups.get(item.introducer)!.push(item)
          }
        })

        // 計算月統計 - 包含所有有佣金的記錄
        const monthServiceFee = monthData.reduce((sum: number, item: CustomerCommissionData) => sum + item.monthly_fee, 0)
        const monthServiceHours = monthData.reduce((sum: number, item: CustomerCommissionData) => sum + item.monthly_hours, 0)
        const monthQualifiedCount = monthData.filter(item => item.is_qualified).length
        const monthUnqualifiedCount = monthData.filter(item => !item.is_qualified && item.commission_amount > 0).length
        
        // 計算所有佣金（只有達標才有佣金）
        const monthCommission = monthData.reduce((sum: number, item: CustomerCommissionData) => {
          // 只計算實際有佣金的記錄
          return sum + (item.commission_amount || 0)
        }, 0)

        // 累加到總計 - 使用 Math.round 修復浮點數精度問題
        totalServiceFee = Math.round((totalServiceFee + monthServiceFee) * 100) / 100
        totalServiceHours = Math.round((totalServiceHours + monthServiceHours) * 100) / 100
        totalQualifiedCustomers += monthQualifiedCount
        totalUnqualifiedCustomers += monthUnqualifiedCount
        totalCommission = Math.round((totalCommission + monthCommission) * 100) / 100

        // 收集所有介紹人（只計算有佣金率設定的）
        Array.from(introducerGroups.keys()).forEach((introducerName: string) => {
          allIntroducers.add(introducerName)
        })

        console.log(`📊 ${month} 月份佣金統計調試:`)
        console.log(`   月服務費: $${monthServiceFee.toLocaleString()}`)
        console.log(`   月佣金: $${monthCommission.toLocaleString()}`)
        console.log(`   介紹人組數: ${introducerGroups.size}`)
        
        // 檢查每個介紹人的佣金
        introducerGroups.forEach((customers: CustomerCommissionData[], introducerName: string) => {
          const introducerCommission = customers.reduce((sum: number, c: CustomerCommissionData) => sum + (c.commission_amount || 0), 0)
          const qualifiedCount = customers.filter(c => c.is_qualified).length
          const unqualifiedCount = customers.filter(c => !c.is_qualified).length
          const firstMonthCount = customers.filter(c => c.month_sequence === 1).length
          const subsequentMonthCount = customers.filter(c => c.month_sequence > 1).length
          
          console.log(`   ${introducerName}: $${introducerCommission.toLocaleString()} (達標:${qualifiedCount}, 不達標:${unqualifiedCount})`)
          console.log(`     首月:${firstMonthCount}, 後續:${subsequentMonthCount}`)
          
          // 詳細列出每個客戶的佣金
          customers.forEach((c: CustomerCommissionData) => {
            console.log(`     客戶 ${c.customer_id}: 第${c.month_sequence}月, ${c.is_qualified ? '達標' : '不達標'}, 佣金$${c.commission_amount}`)
          })
        })

        // 計算介紹人佣金和詳細客戶資料
        const introducerCommissions = Array.from(introducerGroups.entries()).map(([introducerName, customers]: [string, CustomerCommissionData[]]) => {
          // 修正：包含所有有佣金的客戶，不只是達標的
          const customersWithCommission = customers.filter(c => c.commission_amount > 0)
          const qualifiedCustomers = customersWithCommission.filter(c => c.is_qualified)
          const unqualifiedCustomers = customersWithCommission.filter(c => !c.is_qualified)
          const totalFee = customersWithCommission.reduce((sum, c) => sum + c.monthly_fee, 0)
          const commissionAmount = customersWithCommission.reduce((sum, c) => sum + c.commission_amount, 0)
          
          // 獲取佣金率
          const commissionRate = commissionRatesData.find(r => r.introducer === introducerName)?.first_month_commission || 0
          
          return {
            introducerName,
            rate: commissionRate,
            qualifiedCustomers: qualifiedCustomers.length,
            unqualifiedCustomers: unqualifiedCustomers.length,
            totalFee,
            amount: commissionAmount,
            customerDetails: customers.map(customer => ({
              customerName: customer.customer_name,
              customerId: customer.customer_id,
              hours: customer.monthly_hours,
              fee: customer.monthly_fee,
              isQualified: customer.is_qualified,
              commission: customer.commission_amount
            }))
          }
        })

        return {
          year,
          month: monthNum,
          qualifiedCustomers: monthQualifiedCount,
          unqualifiedCustomers: monthUnqualifiedCount,
          totalHours: monthServiceHours,
          totalFee: monthServiceFee,
          totalCommission: monthCommission,
          commissions: introducerCommissions,
          allCustomers: monthData.map(customer => ({
            customerName: customer.customer_name,
            customerId: customer.customer_id,
            voucherNumber: customer.voucher_number || '',
            introducer: customer.introducer,
            hours: customer.monthly_hours,
            fee: customer.monthly_fee,
            isQualified: customer.is_qualified,
            commission: customer.commission_amount
          }))
        }
      })

      // 計算每個介紹人的總統計
      const introducerSummary = new Map<string, {
        introducerName: string,
        qualifiedCustomers: number,
        unqualifiedCustomers: number,
        totalServiceFee: number,
        totalCommission: number
      }>()

      // 先按客戶分組，避免重複計算
      const customerMap = new Map<string, {
        introducer: string,
        customer_id: string,
        customer_name: string,
        total_fee: number,
        total_commission: number,
        is_qualified: boolean
      }>()
      
      allFilteredCommissionData.forEach((item: CustomerCommissionData) => {
        const key = `${item.introducer}-${item.customer_id}`
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            introducer: item.introducer,
            customer_id: item.customer_id,
            customer_name: item.customer_name,
            total_fee: 0,
            total_commission: 0,
            is_qualified: item.is_qualified
          })
        }
        
        const customer = customerMap.get(key)!
        customer.total_fee = Math.round((customer.total_fee + item.monthly_fee) * 100) / 100
        customer.total_commission = Math.round((customer.total_commission + item.commission_amount) * 100) / 100
      })

      // 再按介紹人匯總
      customerMap.forEach((customer: any) => {
        // 只計算有佣金率設定的介紹人
        const commissionRateRecord = commissionRatesData.find((r: CommissionRate) => r.introducer === customer.introducer)
        const hasCommissionRate = commissionRateRecord && commissionRateRecord.first_month_commission > 0
        
        // 只包含達標且有佣金的客戶
        const hasCommission = hasCommissionRate && customer.is_qualified
        
        if (hasCommission && customer.total_commission > 0) {
          if (!introducerSummary.has(customer.introducer)) {
            introducerSummary.set(customer.introducer, {
              introducerName: customer.introducer,
              qualifiedCustomers: 0,
              unqualifiedCustomers: 0,
              totalServiceFee: 0,
              totalCommission: 0
            })
          }
          
          const summary = introducerSummary.get(customer.introducer)!
          if (customer.is_qualified) {
            summary.qualifiedCustomers += 1
          } else {
            summary.unqualifiedCustomers += 1
          }
          summary.totalServiceFee = Math.round((summary.totalServiceFee + customer.total_fee) * 100) / 100
          summary.totalCommission = Math.round((summary.totalCommission + customer.total_commission) * 100) / 100
        }
      })

      // 轉換為數組並排序
      const introducerSummaryArray = Array.from(introducerSummary.values())
        .sort((a, b) => a.introducerName.localeCompare(b.introducerName, 'zh-TW'))

      // 創建 HTML 內容
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>佣金計算報告</title>
          <style>
            body {
              font-family: 'Microsoft JhengHei', '微軟正黑體', Arial, sans-serif;
              margin: 20px;
              font-size: 12px;
              line-height: 1.4;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #428bca;
              padding-bottom: 15px;
              position: relative;
            }
            
            .header h1 {
              color: #428bca;
              margin: 0;
              font-size: 24px;
            }
            
            .save-pdf-btn {
              position: absolute;
              top: 10px;
              right: 10px;
              background-color: #428bca;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
            }
            
            .save-pdf-btn:hover {
              background-color: #357abd;
            }
            
            .date-range {
              color: #666;
              margin-top: 10px;
              font-size: 14px;
            }
            
            .filters {
              margin-top: 10px;
              font-size: 12px;
              color: #888;
            }
            
            .month-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            
            .month-header {
              background-color: #f8f9fa;
              padding: 10px;
              border-left: 4px solid #428bca;
              margin-bottom: 15px;
            }
            
            .month-title {
              font-size: 16px;
              font-weight: bold;
              color: #428bca;
              margin: 0;
            }
            
            .month-summary {
              display: flex;
              justify-content: space-around;
              background-color: #e7f3ff;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
            }
            
            .summary-item {
              text-align: center;
            }
            
            .summary-label {
              font-weight: bold;
              color: #428bca;
              display: block;
              font-size: 11px;
            }
            
            .summary-value {
              font-size: 14px;
              font-weight: bold;
              color: #333;
            }
            
            .commissions-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            
            .commissions-table th,
            .commissions-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            .commissions-table th {
              background-color: #428bca;
              color: white;
              font-weight: bold;
            }
            
            .commissions-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .customer-details {
              margin: 20px 0;
            }
            
            .customer-details h4 {
              color: #428bca;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            
            .customer-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 11px;
            }
            
            .customer-table th,
            .customer-table td {
              border: 1px solid #ddd;
              padding: 6px;
              text-align: left;
            }
            
            .customer-table th {
              background-color: #f5f5f5;
              font-weight: bold;
              color: #333;
            }
            
            .customer-table tr.qualified {
              background-color: #e8f5e8;
            }
            
            .customer-table tr.not-qualified {
              background-color: #ffe8e8;
            }
            
            .number {
              text-align: right;
            }
            
            .introducer-summary-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            
            .introducer-summary-table th,
            .introducer-summary-table td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            
            .introducer-summary-table th {
              background-color: #428bca;
              color: white;
              font-weight: bold;
            }
            
            .introducer-summary-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .overall-summary {
              margin-top: 40px;
              padding: 20px;
              border: 2px solid #428bca;
              background-color: #f8f9fa;
              page-break-inside: avoid;
            }
            
            .overall-summary h2 {
              text-align: center;
              color: #428bca;
              margin-bottom: 20px;
            }
            
            .total-stats {
              display: flex;
              justify-content: space-around;
              margin-top: 15px;
            }
            
            .total-stat {
              text-align: center;
            }
            
            .total-stat-label {
              font-weight: bold;
              color: #428bca;
              display: block;
              margin-bottom: 5px;
            }
            
            .total-stat-value {
              font-size: 18px;
              font-weight: bold;
              color: #333;
            }
            
            @media print {
              body { margin: 15px; }
              .month-section { page-break-inside: avoid; }
              .overall-summary { page-break-inside: avoid; }
              .save-pdf-btn { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <button class="save-pdf-btn" onclick="window.print()">儲存為PDF</button>
            <h1>佣金計算報告</h1>
            <div class="date-range">
              生成日期: ${new Date().toLocaleDateString('zh-TW')}
            </div>
            <div class="filters">
              ${selectedIntroducer !== 'all' ? `介紹人: ${selectedIntroducer} | ` : ''}${selectedYear !== 'all' ? `年份: ${selectedYear} | ` : ''}${selectedMonth !== 'all' ? `月份: ${selectedMonth}` : ''}
            </div>
          </div>
          
          ${monthlyStats.map(monthData => `
            <div class="month-section">
              <div class="month-header">
                <h3 class="month-title">${monthData.year}年${monthData.month}月 佣金統計</h3>
              </div>
              
              <div class="month-summary">
                <div class="summary-item">
                  <span class="summary-label">達標客戶</span>
                  <span class="summary-value">${monthData.qualifiedCustomers}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">不達標客戶</span>
                  <span class="summary-value">${monthData.unqualifiedCustomers}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">總服務時數</span>
                  <span class="summary-value">${monthData.totalHours.toFixed(1)}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">總服務金額</span>
                  <span class="summary-value">$${monthData.totalFee.toLocaleString()}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">總佣金</span>
                  <span class="summary-value">$${monthData.totalCommission.toLocaleString()}</span>
                </div>
              </div>
              
              <div class="customer-details">
                <h4>客戶明細</h4>
                <table class="customer-table">
                  <thead>
                    <tr>
                      <th>客戶編號</th>
                      <th>客戶姓名</th>
                      <th>CCSV 號碼</th>
                      <th>介紹人</th>
                      <th>服務時數</th>
                      <th>服務費用</th>
                      <th>達標狀態</th>
                      <th>佣金金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${monthData.allCustomers.map(customer => `
                      <tr class="${customer.isQualified ? 'qualified' : 'not-qualified'}">
                        <td>${customer.customerId}</td>
                        <td>${customer.customerName}</td>
                        <td>${customer.voucherNumber || '-'}</td>
                        <td>${customer.introducer}</td>
                        <td class="number">${customer.hours.toFixed(1)} 小時</td>
                        <td class="number">$${customer.fee.toLocaleString()}</td>
                        <td style="text-align: center;">${customer.isQualified ? '✓ 達標' : '✗ 不達標'}</td>
                        <td class="number">${customer.commission > 0 ? '$' + customer.commission.toLocaleString() : '$0'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              ${monthData.commissions.length > 0 ? `
                <div class="customer-details">
                  <h4>介紹人佣金匯總</h4>
                  <table class="commissions-table">
                    <thead>
                      <tr>
                        <th>介紹人</th>
                        <th>達標客戶</th>
                        <th>不達標客戶</th>
                        <th>總服務金額</th>
                        <th>佣金金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${monthData.commissions.map(commission => `
                        <tr>
                          <td>${commission.introducerName}</td>
                          <td class="number">${commission.qualifiedCustomers}</td>
                          <td class="number">${commission.unqualifiedCustomers}</td>
                          <td class="number">$${commission.totalFee.toLocaleString()}</td>
                          <td class="number">$${commission.amount.toLocaleString()}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : '<p style="text-align: center; color: #666; font-style: italic;">本月無佣金記錄</p>'}
            </div>
          `).join('')}
          
          <div class="overall-summary">
            <h2>總結報告</h2>
            
            <h3 style="color: #428bca; margin-bottom: 15px;">各介紹人統計明細</h3>
            <table class="introducer-summary-table">
              <thead>
                <tr>
                  <th>介紹人</th>
                  <th>達標客戶數</th>
                  <th>不達標客戶數</th>
                  <th>總服務金額</th>
                  <th>總佣金金額</th>
                </tr>
              </thead>
              <tbody>
                ${introducerSummaryArray.map(summary => `
                  <tr>
                    <td>${summary.introducerName}</td>
                    <td class="number">${summary.qualifiedCustomers}</td>
                    <td class="number">${summary.unqualifiedCustomers}</td>
                    <td class="number">$${summary.totalServiceFee.toLocaleString()}</td>
                    <td class="number">$${summary.totalCommission.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <h3 style="color: #428bca; margin: 30px 0 15px 0;">整體統計總計</h3>
            <div class="total-stats">
              <div class="total-stat">
                <span class="total-stat-label">介紹人總數</span>
                <span class="total-stat-value">${allIntroducers.size}</span>
              </div>
              <div class="total-stat">
                <span class="total-stat-label">總達標客戶</span>
                <span class="total-stat-value">${totalQualifiedCustomers}</span>
              </div>
              <div class="total-stat">
                <span class="total-stat-label">總不達標客戶</span>
                <span class="total-stat-value">${totalUnqualifiedCustomers}</span>
              </div>
              <div class="total-stat">
                <span class="total-stat-label">總服務時數</span>
                <span class="total-stat-value">${totalServiceHours.toFixed(1)}</span>
              </div>
              <div class="total-stat">
                <span class="total-stat-label">總服務金額</span>
                <span class="total-stat-value">$${totalServiceFee.toLocaleString()}</span>
              </div>
              <div class="total-stat">
                <span class="total-stat-label">總佣金</span>
                <span class="total-stat-value">$${totalCommission.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
      
      // 在新視窗中顯示HTML內容
      const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')
      if (newWindow) {
        newWindow.document.write(htmlContent)
        newWindow.document.close()
      } else {
        alert('請允許彈出視窗以顯示報告')
      }
      
    } catch (error) {
      console.error('PDF導出錯誤:', error)
      alert('PDF導出失敗，請稍後再試')
    }
  }

  useEffect(() => {
    const getUser = async () => {
      console.log('開始獲取用戶...')
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('用戶數據:', user, '錯誤:', error)
      
      if (user) {
        setUser(user)
        console.log('開始獲取佣金數據...')
        await fetchCommissionData()
      } else {
        console.log('沒有用戶，重定向到首頁')
        router.push('/')
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  const fetchCommissionData = async () => {
    try {
      setError(null)
      console.log('開始獲取佣金率數據...')

    // 取得佣金率設定
    const { data: commissionRates, error: commissionError } = await supabase
      .from('commission_rate_introducer')
      .select('*')
      
    console.log('佣金率數據:', commissionRates, '錯誤:', commissionError)
    
    // 儲存佣金率數據
    if (commissionRates) {
      setCommissionRatesData(commissionRates)
    }
    
    if (commissionError) {
      console.error('佣金率錯誤:', commissionError)
      // 如果表格不存在，使用默認數據繼續
      if (commissionError.code === 'PGRST116' || commissionError.message.includes('does not exist')) {
        console.log('佣金率表格不存在，使用默認數據')
        // 繼續處理，不拋出錯誤
      } else {
        throw commissionError
      }
    }

      // 獲取符合條件的客戶和服務數據
      const { data: customerData, error: customerError } = await supabase
        .from('customer_personal_data')
        .select(`
          customer_id,
          customer_name,
          introducer,
          customer_type,
          voucher_number
        `)
        .eq('customer_type', '社區券客戶')

      if (customerError) throw customerError

      // 獲取所有介紹人列表（用於佣金設定）
      const { data: allCustomers } = await supabase
        .from('customer_personal_data')
        .select('introducer')
        .not('introducer', 'is', null)
      
      if (allCustomers) {
        const introducerSet = new Set<string>()
        allCustomers.forEach((c: { introducer: string | null }) => {
          if (c.introducer) introducerSet.add(c.introducer)
        })
        setAllIntroducers(Array.from(introducerSet).sort())
      }

      // 獲取所有記錄，使用分頁避免超時
      let allBillingData: any[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data: pageData, error: pageError } = await supabase
          .from('billing_salary_data')
          .select(`
            customer_id,
            customer_name,
            service_date,
            service_hours,
            service_fee,
            project_category
          `)
          .range(from, from + pageSize - 1)

        if (pageError) throw pageError

        if (pageData && pageData.length > 0) {
          allBillingData = [...allBillingData, ...pageData]
          from += pageSize
          hasMore = pageData.length === pageSize
        } else {
          hasMore = false
        }
      }

      const billingData = allBillingData

      console.log(`📊 查詢結果檢查:`)
      console.log(`   查詢返回記錄數: ${billingData?.length}`)
      
      // 檢查是否有古樹蕚的任何記錄
      const allGuShuERecords = billingData?.filter(r => r.customer_id === 'CCSV-MC0011') || []
      console.log(`   古樹蕚總記錄數: ${allGuShuERecords.length}`)
      
      if (allGuShuERecords.length > 0) {
        console.log(`   古樹蕚記錄樣本:`)
        allGuShuERecords.slice(0, 3).forEach((record, index) => {
          console.log(`   記錄${index + 1}: ${record.service_date} - ${record.service_hours}小時, ${record.project_category}`)
        })
        
        // 檢查古樹蕚的9月記錄
        const september2025Records = allGuShuERecords.filter(r => {
          const date = new Date(r.service_date)
          return date.getFullYear() === 2025 && date.getMonth() === 8 // 9月是index 8
        })
        
        console.log(`   🔍 古樹蕚2025年9月詳細檢查:`)
        console.log(`   9月記錄數: ${september2025Records.length}`)
        
        if (september2025Records.length > 0) {
          september2025Records.forEach((record, index) => {
            console.log(`   9月記錄${index + 1}: ${record.service_date} - ${record.service_hours}小時, ${record.project_category}`)
          })
        }
        
        // 檢查所有月份的分佈
        const monthlyDistribution: { [key: string]: number } = allGuShuERecords.reduce((acc, record) => {
          const date = new Date(record.service_date)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          acc[monthKey] = (acc[monthKey] || 0) + parseFloat(record.service_hours || 0)
          return acc
        }, {} as { [key: string]: number })
        
        console.log(`   📅 古樹蕚各月時數分佈:`)
        Object.entries(monthlyDistribution).forEach(([month, hours]) => {
          console.log(`   ${month}: ${hours}小時`)
        })
      } else {
        console.log(`❌ 未找到古樹蕚的任何記錄！可能的問題:`)
        console.log(`   1. customer_id 不是 'CCSV-MC0011'`)
        console.log(`   2. 數據在其他表中`)
        console.log(`   3. 查詢限制問題`)
        
        // 檢查是否有類似的客戶ID
        const similarIds = billingData?.filter(r => 
          r.customer_id?.includes('MC0011') || 
          r.customer_name?.includes('古樹蕚')
        ) || []
        
        console.log(`   尋找類似記錄: ${similarIds.length}筆`)
        similarIds.slice(0, 3).forEach((record, index) => {
          console.log(`   相似記錄${index + 1}: ID=${record.customer_id}, 姓名=${record.customer_name}`)
        })
      }

      // 在前端進行項目類別篩選，避免 Supabase 查詢問題
      const filteredBillingData = billingData?.filter(record => 
        record.project_category !== 'MC街客' && record.project_category !== 'Steven140'
      ) || []

      console.log(`📊 數據篩選結果:`)
      console.log(`   原始記錄數: ${billingData?.length}`)
      console.log(`   篩選後記錄數: ${filteredBillingData.length}`)
      
      // 特別檢查古樹蕚的記錄
      const guShuERecords = billingData?.filter(r => r.customer_id === 'CCSV-MC0011' && r.service_date.startsWith('2025-09')) || []
      const guShuEFiltered = filteredBillingData.filter(r => r.customer_id === 'CCSV-MC0011' && r.service_date.startsWith('2025-09'))
      console.log(`   古樹蕚9月原始: ${guShuERecords.length}筆, 篩選後: ${guShuEFiltered.length}筆`)

      // 在前端處理數據分組和計算
      const monthlyStats = new Map()

      // 合併客戶和服務數據，同時過濾掉沒有佣金率設定的介紹人
      const qualifiedCustomers = customerData.filter((customer: CustomerData) => {
        const hasCommissionRate = commissionRates?.some((rate: CommissionRate) => rate.introducer === customer.introducer)
        const hasBillingData = filteredBillingData.some((billing: BillingData) => billing.customer_id === customer.customer_id)
        return hasCommissionRate && hasBillingData
      })

      qualifiedCustomers.forEach((customer: CustomerData) => {
        const customerBilling = filteredBillingData.filter((b: BillingData) => b.customer_id === customer.customer_id)
        
        customerBilling.forEach((billing: BillingData) => {
          const serviceMonth = new Date(billing.service_date).toISOString().substring(0, 7)
          const key = `${customer.customer_id}-${serviceMonth}`

          if (!monthlyStats.has(key)) {
            monthlyStats.set(key, {
              customer_id: customer.customer_id,
              customer_name: customer.customer_name,
              introducer: customer.introducer,
              service_month: serviceMonth,
              monthly_hours: 0,
              monthly_fee: 0,
              first_service_date: billing.service_date,
              voucher_number: customer.voucher_number || ''
            })
          }

          const existing = monthlyStats.get(key)
          existing.monthly_hours = Math.round((existing.monthly_hours + (Number(billing.service_hours) || 0)) * 100) / 100
          existing.monthly_fee = Math.round((existing.monthly_fee + (Number(billing.service_fee) || 0)) * 100) / 100
          
          if (billing.service_date < existing.first_service_date) {
            existing.first_service_date = billing.service_date
          }
        })
      })

      // 計算佣金 - 包含達標和不達標的記錄
      const allResults: CustomerCommissionData[] = []
      const customerMonthSequence = new Map()

      Array.from(monthlyStats.values())
        .sort((a, b) => a.service_month.localeCompare(b.service_month))
        .forEach((monthData: MonthlyStatsData) => {
          // 修改達標條件：只計算服務費用，超過$6000就有佣金
          const isQualified = monthData.monthly_fee >= 6000
          
          let commissionAmount = 0
          let monthSequence = 0

          const customerKey = monthData.customer_id
          const currentSequence = (customerMonthSequence.get(customerKey) || 0) + 1
          customerMonthSequence.set(customerKey, currentSequence)
          monthSequence = currentSequence

          const commissionRate = commissionRates?.find((rate: CommissionRate) => rate.introducer === monthData.introducer)

          if (commissionRate) {
            const baseCommission = currentSequence === 1 
              ? commissionRate.first_month_commission 
              : commissionRate.subsequent_month_commission
            
            // 只有達標才有佣金，不達標一律為0（包括 Steven Kwok）
            if (isQualified) {
              commissionAmount = baseCommission
            } else {
              commissionAmount = 0
            }
          }

          // 添加所有記錄（達標和不達標）
          allResults.push({
            ...monthData,
            is_qualified: isQualified,
            month_sequence: monthSequence,
            commission_amount: commissionAmount
          })
          
          // 調試：檢查 Steven Kwok 的記錄
          if (monthData.introducer === 'Steven Kwok') {
            console.log(`🔍 Steven Kwok 記錄: ${monthData.customer_id}, 第${monthSequence}月, ${isQualified ? '達標' : '不達標'}, 佣金$${commissionAmount}`)
          }
        })

      // 儲存所有數據用於篩選
      setAllCommissionData(allResults)

      // 按介紹人分組（只有達標才有佣金）
      const groupedByIntroducer = new Map<string, IntroducerSummary>()

      allResults.forEach(result => {
        if (!groupedByIntroducer.has(result.introducer)) {
          groupedByIntroducer.set(result.introducer, {
            introducer: result.introducer,
            total_commission: 0,
            first_month_count: 0,
            subsequent_month_count: 0,
            customers: []
          })
        }

        const summary = groupedByIntroducer.get(result.introducer)!
        summary.customers.push(result)
        
        // 只有達標才計算佣金
        summary.total_commission = Math.round((summary.total_commission + result.commission_amount) * 100) / 100
        
        if (result.month_sequence === 1) {
          summary.first_month_count++
        } else if (result.month_sequence > 1) {
          summary.subsequent_month_count++
        }
      })

      console.log(`🎯 最終 Steven Kwok 統計:`)
      const stevenData = Array.from(groupedByIntroducer.values()).find(item => item.introducer === 'Steven Kwok')
      if (stevenData) {
        console.log(`   總佣金: $${stevenData.total_commission}`)
        console.log(`   首月: ${stevenData.first_month_count}, 後續: ${stevenData.subsequent_month_count}`)
        console.log(`   客戶數: ${stevenData.customers.length}`)
      }

      setCommissionData(Array.from(groupedByIntroducer.values()))
    } catch (err: any) {
      console.error('獲取佣金數據時發生錯誤:', err)
      setError(err.message || '獲取數據失敗')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    return `${year}年${month}月`
  }

  // 篩選邏輯
  const getFilteredData = () => {
    let filtered = allCommissionData

    console.log(`🔍 篩選調試:`)
    console.log(`   原始數據: ${allCommissionData.length}`)
    console.log(`   selectedIntroducer: "${selectedIntroducer}"`)
    console.log(`   selectedYear: "${selectedYear}"`)
    console.log(`   selectedMonth: "${selectedMonth}"`)

    // 按介紹人篩選
    if (selectedIntroducer !== 'all') {
      const beforeFilter = filtered.length
      filtered = filtered.filter(item => item.introducer === selectedIntroducer)
      console.log(`   介紹人篩選: ${beforeFilter} → ${filtered.length}`)
    }

    // 按年份篩選
    if (selectedYear !== 'all') {
      const beforeFilter = filtered.length
      filtered = filtered.filter(item => item.service_month.startsWith(selectedYear))
      console.log(`   年份篩選: ${beforeFilter} → ${filtered.length}`)
    }

    // 按月份篩選
    if (selectedMonth !== 'all') {
      const beforeFilter = filtered.length
      filtered = filtered.filter(item => item.service_month.endsWith(`-${selectedMonth.padStart(2, '0')}`))
      console.log(`   月份篩選: ${beforeFilter} → ${filtered.length}`)
    }

    // 計算篩選後的佣金總計
    const totalCommissionFiltered = filtered.reduce((sum, item) => sum + item.commission_amount, 0)
    console.log(`   篩選後佣金總計: $${totalCommissionFiltered}`)
    
    // 如果選擇了特定月份，顯示詳細信息
    if (selectedMonth !== 'all' && filtered.length > 0) {
      console.log(`   📋 ${selectedMonth}月詳細記錄:`)
      filtered.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.customer_id}(${item.customer_name}): 第${item.month_sequence}月, ${item.is_qualified ? '達標' : '不達標'}, 佣金$${item.commission_amount}`)
      })
    }

    return filtered
  }

  const allFilteredCommissionData = getFilteredData()

  // 獲取可用的年份和月份選項
  const availableYears = Array.from(new Set(allCommissionData.map(item => item.service_month.split('-')[0]))).sort()
  const availableMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

  // 按介紹人重新分組已篩選的數據
  const filteredGroupedData = new Map<string, IntroducerSummary>()
  allFilteredCommissionData.forEach(result => {
    if (!filteredGroupedData.has(result.introducer)) {
      filteredGroupedData.set(result.introducer, {
        introducer: result.introducer,
        total_commission: 0,
        first_month_count: 0,
        subsequent_month_count: 0,
        customers: []
      })
    }

    const summary = filteredGroupedData.get(result.introducer)!
    summary.customers.push(result)
    
    if (result.is_qualified) {
      summary.total_commission = Math.round((summary.total_commission + result.commission_amount) * 100) / 100
      if (result.month_sequence === 1) {
        summary.first_month_count++
      } else {
        summary.subsequent_month_count++
      }
    }
  })

  const filteredData = Array.from(filteredGroupedData.values())
  
  // 修正：使用客戶詳細記錄計算總佣金，確保包含所有有佣金的記錄
  const totalCommission = allFilteredCommissionData.reduce((sum, item) => sum + item.commission_amount, 0)
  
  console.log(`💰 總佣金計算調試:`)
  console.log(`   使用客戶詳細記錄: ${allFilteredCommissionData.length}筆`)
  console.log(`   總佣金: $${totalCommission}`)
  console.log(`   介紹人分組總佣金: $${filteredData.reduce((sum, item) => sum + item.total_commission, 0)}`)

  if (loading) {
    return <LoadingScreen message="正在載入佣金數據..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center card-apple max-w-md mx-4">
          <div className="card-apple-content">
            <h2 className="text-lg font-semibold text-red-600 mb-4">載入數據時發生錯誤</h2>
            <p className="text-text-secondary mb-4">{error}</p>
            <button
              onClick={fetchCommissionData}
              className="btn-apple-primary"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="card-apple border-b border-border-light fade-in-apple sticky top-0 z-10">
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-6 lg:py-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-text-primary mb-1 truncate">佣金計算</h1>
              <p className="text-xs sm:text-sm text-text-secondary hidden md:block">計算業務佣金、獎金及績效獎勵</p>
              <p className="text-xs text-orange-600 mt-1">達標：月費 ≥ $6,000</p>
            </div>
            <div className="flex gap-2 ml-2 sm:ml-3 flex-shrink-0">
              <button
                onClick={() => router.push('/commissions/voucher-commission')}
                className="btn-apple-primary text-xs px-2 sm:px-3 py-2 bg-purple-600 hover:bg-purple-700"
              >
                📊 社區券佣金
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-apple-secondary text-xs px-2 sm:px-3 py-2"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
        {/* 篩選器 - 移動端優化 */}
        <div className="card-apple fade-in-apple mb-4 sm:mb-6">
          <div className="card-apple-content">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1 sm:mb-2">介紹人：</label>
                <select
                  value={selectedIntroducer}
                  onChange={(e) => setSelectedIntroducer(e.target.value)}
                  className="form-input-apple w-full text-xs sm:text-sm"
                >
                  <option value="all">全部介紹人</option>
                  {Array.from(new Set(allCommissionData.map(item => item.introducer))).map(introducer => (
                    <option key={introducer} value={introducer}>
                      {introducer}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1 sm:mb-2">年份：</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="form-input-apple w-full text-xs sm:text-sm"
                >
                  <option value="all">全部年份</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1 sm:mb-2">月份：</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="form-input-apple w-full text-xs sm:text-sm"
                >
                  <option value="all">全部月份</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {month}月
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 操作按鈕 - 移動端優化 */}
              <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-2 sm:flex sm:items-end gap-2 sm:space-x-2">
                <button
                  onClick={() => {
                    setSelectedIntroducer('all')
                    setSelectedYear('all')
                    setSelectedMonth('all')
                  }}
                  className="btn-apple-secondary text-xs sm:text-sm py-2 sm:py-3 sm:flex-1"
                >
                  清除篩選
                </button>
                <button
                  onClick={fetchCommissionData}
                  className="btn-apple-primary text-xs sm:text-sm py-2 sm:py-3 sm:flex-1"
                >
                  重新載入
                </button>
                <button
                  onClick={generatePDF}
                  className="btn-apple-primary col-span-2 sm:col-span-1 sm:flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm py-2 sm:py-3"
                >
                  📄 導出PDF
                </button>
                <button
                  onClick={() => {
                    // 準備編輯數據：合併現有費率和所有介紹人
                    const ratesMap = new Map(commissionRatesData.map(r => [r.introducer, r]))
                    const allRates = allIntroducers.map(intro => 
                      ratesMap.get(intro) || {
                        introducer: intro,
                        first_month_commission: 0,
                        subsequent_month_commission: 0,
                        voucher_commission_percentage: null
                      }
                    )
                    setEditingRates(allRates)
                    setShowRateSettings(true)
                  }}
                  className="btn-apple-secondary col-span-2 sm:col-span-1 sm:flex-1 text-xs sm:text-sm py-2 sm:py-3"
                >
                  ⚙️ 佣金設定
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 佣金費率設定面板 */}
        {showRateSettings && (
          <div className="card-apple mb-6 fade-in-apple">
            <div className="bg-bg-secondary px-4 sm:px-6 py-4 border-b border-border-light rounded-t-apple flex justify-between items-center">
              <h2 className="text-lg font-semibold text-text-primary">介紹人佣金費率設定</h2>
              <button
                onClick={() => setShowRateSettings(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-secondary">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">介紹人</th>
                      <th className="px-4 py-3 text-center font-medium text-text-secondary">首月佣金 ($)</th>
                      <th className="px-4 py-3 text-center font-medium text-text-secondary">後續月份佣金 ($)</th>
                      <th className="px-4 py-3 text-center font-medium text-text-secondary">社區券佣金 (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {editingRates.map((rate, index) => (
                      <tr key={rate.introducer} className="hover:bg-bg-secondary transition-colors">
                        <td className="px-4 py-3 font-medium text-text-primary">{rate.introducer}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={rate.first_month_commission || 0}
                            onChange={(e) => {
                              const newRates = [...editingRates]
                              newRates[index].first_month_commission = parseFloat(e.target.value) || 0
                              setEditingRates(newRates)
                            }}
                            className="form-input-apple w-24 text-center text-sm"
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={rate.subsequent_month_commission || 0}
                            onChange={(e) => {
                              const newRates = [...editingRates]
                              newRates[index].subsequent_month_commission = parseFloat(e.target.value) || 0
                              setEditingRates(newRates)
                            }}
                            className="form-input-apple w-24 text-center text-sm"
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={rate.voucher_commission_percentage || ''}
                            onChange={(e) => {
                              const newRates = [...editingRates]
                              newRates[index].voucher_commission_percentage = e.target.value ? parseFloat(e.target.value) : null
                              setEditingRates(newRates)
                            }}
                            className="form-input-apple w-24 text-center text-sm"
                            placeholder="不設定"
                            min="0"
                            max="100"
                            step="0.5"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowRateSettings(false)}
                  className="btn-apple-secondary text-sm py-2 px-4"
                  disabled={savingRates}
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    setSavingRates(true)
                    try {
                      // 先刪除所有現有記錄，再重新插入
                      for (const rate of editingRates) {
                        if (rate.first_month_commission > 0 || rate.subsequent_month_commission > 0 || rate.voucher_commission_percentage) {
                          const { error } = await supabase
                            .from('commission_rate_introducer')
                            .upsert({
                              introducer: rate.introducer,
                              first_month_commission: rate.first_month_commission,
                              subsequent_month_commission: rate.subsequent_month_commission,
                              voucher_commission_percentage: rate.voucher_commission_percentage
                            }, { onConflict: 'introducer' })
                          if (error) {
                            // 如果沒有 unique constraint，嘗試更新或插入
                            const { data: existing } = await supabase
                              .from('commission_rate_introducer')
                              .select('id')
                              .eq('introducer', rate.introducer)
                              .single()
                            
                            if (existing) {
                              await supabase
                                .from('commission_rate_introducer')
                                .update({
                                  first_month_commission: rate.first_month_commission,
                                  subsequent_month_commission: rate.subsequent_month_commission,
                                  voucher_commission_percentage: rate.voucher_commission_percentage
                                })
                                .eq('introducer', rate.introducer)
                            } else {
                              await supabase
                                .from('commission_rate_introducer')
                                .insert({
                                  introducer: rate.introducer,
                                  first_month_commission: rate.first_month_commission,
                                  subsequent_month_commission: rate.subsequent_month_commission,
                                  voucher_commission_percentage: rate.voucher_commission_percentage
                                })
                            }
                          }
                        }
                      }
                      alert('佣金費率已保存！')
                      setShowRateSettings(false)
                      await fetchCommissionData()
                    } catch (err) {
                      console.error('保存失敗:', err)
                      alert('保存失敗，請重試')
                    } finally {
                      setSavingRates(false)
                    }
                  }}
                  className="btn-apple-primary text-sm py-2 px-4"
                  disabled={savingRates}
                >
                  {savingRates ? '保存中...' : '保存設定'}
                </button>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p><strong>說明：</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>首月/後續月份佣金：</strong>固定金額佣金（$800, $700 等）</li>
                  <li><strong>社區券佣金 (%)：</strong>按社區券費率計算的百分比佣金（例如 15% = 服務費 × 15%）</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 總覽統計 - 移動端優化 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="card-apple fade-in-apple" style={{ animationDelay: '0.1s' }}>
            <div className="card-apple-content text-center py-3 sm:py-4">
              <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">總佣金</h3>
              <p className="text-sm sm:text-xl font-bold text-mingcare-green">{formatCurrency(totalCommission)}</p>
            </div>
          </div>
          <div className="card-apple fade-in-apple" style={{ animationDelay: '0.2s' }}>
            <div className="card-apple-content text-center py-3 sm:py-4">
              <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">介紹人數量</h3>
              <p className="text-sm sm:text-xl font-bold text-primary">{filteredData.length}</p>
            </div>
          </div>
          <div className="card-apple fade-in-apple" style={{ animationDelay: '0.3s' }}>
            <div className="card-apple-content text-center py-3 sm:py-4">
              <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">首月佣金</h3>
              <p className="text-sm sm:text-xl font-bold text-mingcare-purple">
                {filteredData.reduce((sum, item) => sum + item.first_month_count, 0)}
              </p>
            </div>
          </div>
          <div className="card-apple fade-in-apple" style={{ animationDelay: '0.4s' }}>
            <div className="card-apple-content text-center py-3 sm:py-4">
              <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-2">後續月份</h3>
              <p className="text-sm sm:text-xl font-bold text-mingcare-orange">
                {filteredData.reduce((sum, item) => sum + item.subsequent_month_count, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* 佣金明細 - 移動端優化 */}
        <div className="space-y-4 sm:space-y-6">
          {filteredData.map((introducerData, index) => (
            <div key={introducerData.introducer} className="card-apple fade-in-apple" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
              <div className="bg-bg-secondary px-3 sm:px-6 py-3 sm:py-4 border-b border-border-light rounded-t-apple">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div className="mb-2 sm:mb-0">
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-1">
                      介紹人：{introducerData.introducer}
                    </h2>
                    {(() => {
                      const rate = commissionRatesData.find(r => r.introducer === introducerData.introducer)
                      return rate ? (
                        <div className="text-xs sm:text-sm text-text-secondary">
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 text-xs">
                            首月: {formatCurrency(rate.first_month_commission)}
                          </span>
                          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                            後續: {formatCurrency(rate.subsequent_month_commission)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-red-600">
                          未設定佣金率
                        </div>
                      )
                    })()}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-mingcare-green">
                      總佣金：{formatCurrency(introducerData.customers.reduce((sum, customer) => sum + customer.commission_amount, 0))}
                    </p>
                    <p className="text-sm text-text-secondary">
                      首月：{introducerData.first_month_count} | 後續：{introducerData.subsequent_month_count}
                    </p>
                  </div>
                </div>
              </div>

              {/* 桌面版表格 */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-secondary">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">客戶編號</th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">客戶姓名</th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">服務月份</th>
                      <th className="px-4 py-3 text-right font-medium text-text-secondary">服務時數</th>
                      <th className="px-4 py-3 text-right font-medium text-text-secondary">服務費用</th>
                      <th className="px-4 py-3 text-center font-medium text-text-secondary">月份序號</th>
                      <th className="px-4 py-3 text-right font-medium text-text-secondary">佣金金額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {introducerData.customers.map((customer, customerIndex) => (
                      <tr key={`${customer.customer_id}-${customer.service_month}`} className="hover:bg-bg-secondary transition-colors">
                        <td className="px-4 py-3 text-text-primary">{customer.customer_id}</td>
                        <td className="px-4 py-3 text-text-primary">{customer.customer_name}</td>
                        <td className="px-4 py-3 text-text-secondary">{formatMonth(customer.service_month)}</td>
                        <td className="px-4 py-3 text-right text-text-secondary">{customer.monthly_hours.toFixed(1)}h</td>
                        <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(customer.monthly_fee)}</td>
                        <td className="px-4 py-3 text-center">
                          {customer.is_qualified ? (
                            <span className={`px-2 py-1 rounded-apple-sm text-xs font-medium ${
                              customer.month_sequence === 1 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {customer.month_sequence === 1 ? '首月' : `第${customer.month_sequence}月`}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-apple-sm text-xs font-medium bg-red-100 text-red-800">
                              不達標
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {customer.commission_amount > 0 ? (
                            <span className="text-mingcare-green">
                              {formatCurrency(customer.commission_amount)}
                            </span>
                          ) : (
                            <span className="text-text-secondary">
                              $0
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 移動版卡片佈局 */}
              <div className="sm:hidden space-y-3 p-3">
                {introducerData.customers.map((customer, customerIndex) => (
                  <div key={`${customer.customer_id}-${customer.service_month}`} className="bg-white border border-border-light rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-text-primary text-sm">{customer.customer_name}</div>
                        <div className="text-xs text-text-secondary">{customer.customer_id}</div>
                      </div>
                      <div className="text-right">
                        {customer.is_qualified ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            customer.month_sequence === 1 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {customer.month_sequence === 1 ? '首月' : `第${customer.month_sequence}月`}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            不達標
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-text-secondary">服務月份：</span>
                        <span className="text-text-primary">{formatMonth(customer.service_month)}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">服務時數：</span>
                        <span className="text-text-primary">{customer.monthly_hours.toFixed(1)}h</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">服務費用：</span>
                        <span className="text-text-primary">{formatCurrency(customer.monthly_fee)}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">佣金金額：</span>
                        {customer.commission_amount > 0 ? (
                          <span className="font-semibold text-mingcare-green">
                            {formatCurrency(customer.commission_amount)}
                          </span>
                        ) : (
                          <span className="text-text-secondary">$0</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="card-apple fade-in-apple">
            <div className="card-apple-content text-center py-12">
              <div className="mx-auto w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">暫無符合條件的佣金數據</h3>
              <p className="text-text-secondary">請檢查是否有符合計算條件的客戶和服務記錄</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
