'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { BackToHomeButton } from '../../components/BackToHomeButton'

interface FinancialTransaction {
  id: string
  transaction_code: string
  billing_month: string
  transaction_date: string
  transaction_item: string
  payment_method: string
  income_category: string | null
  expense_category: string | null
  income_amount: number
  expense_amount: number
  petty_cash: number | null
  handler: string | null
  reimbursement_status: string | null
  fiscal_year: number
  created_at: string
  updated_at: string
}

interface MonthSummary {
  month: string
  totalIncome: number
  totalExpense: number
  netAmount: number
}

interface CategorySummary {
  category: string
  amount: number
  count: number
}

export default function AccountingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransaction[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'summary'>('list')
  const [showAddModal, setShowAddModal] = useState(false)
  
  // 摘要數據
  const [monthSummaries, setMonthSummaries] = useState<MonthSummary[]>([])
  const [incomeSummaries, setIncomeSummaries] = useState<CategorySummary[]>([])
  const [expenseSummaries, setExpenseSummaries] = useState<CategorySummary[]>([])

  useEffect(() => {
    checkUser()
    fetchTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
    calculateSummaries()
  }, [transactions, selectedYear, selectedMonth, searchTerm])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions.filter(t => t.fiscal_year === selectedYear)
    
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(t => t.billing_month === selectedMonth)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.transaction_item.toLowerCase().includes(term) ||
        t.transaction_code?.toLowerCase().includes(term) ||
        t.handler?.toLowerCase().includes(term) ||
        t.income_category?.toLowerCase().includes(term) ||
        t.expense_category?.toLowerCase().includes(term)
      )
    }

    setFilteredTransactions(filtered)
  }

  const calculateSummaries = () => {
    // 月度摘要
    const monthMap = new Map<string, MonthSummary>()
    const incomeMap = new Map<string, CategorySummary>()
    const expenseMap = new Map<string, CategorySummary>()

    filteredTransactions.forEach(t => {
      // 月度統計
      if (!monthMap.has(t.billing_month)) {
        monthMap.set(t.billing_month, {
          month: t.billing_month,
          totalIncome: 0,
          totalExpense: 0,
          netAmount: 0
        })
      }
      const monthData = monthMap.get(t.billing_month)!
      monthData.totalIncome += t.income_amount || 0
      monthData.totalExpense += t.expense_amount || 0
      monthData.netAmount = monthData.totalIncome - monthData.totalExpense

      // 收入類別統計
      if (t.income_category && t.income_amount > 0) {
        if (!incomeMap.has(t.income_category)) {
          incomeMap.set(t.income_category, { category: t.income_category, amount: 0, count: 0 })
        }
        const incomeData = incomeMap.get(t.income_category)!
        incomeData.amount += t.income_amount
        incomeData.count += 1
      }

      // 支出類別統計
      if (t.expense_category && t.expense_amount > 0) {
        if (!expenseMap.has(t.expense_category)) {
          expenseMap.set(t.expense_category, { category: t.expense_category, amount: 0, count: 0 })
        }
        const expenseData = expenseMap.get(t.expense_category)!
        expenseData.amount += t.expense_amount
        expenseData.count += 1
      }
    })

    setMonthSummaries(Array.from(monthMap.values()))
    setIncomeSummaries(Array.from(incomeMap.values()).sort((a, b) => b.amount - a.amount))
    setExpenseSummaries(Array.from(expenseMap.values()).sort((a, b) => b.amount - a.amount))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getTotalIncome = () => filteredTransactions.reduce((sum, t) => sum + (t.income_amount || 0), 0)
  const getTotalExpense = () => filteredTransactions.reduce((sum, t) => sum + (t.expense_amount || 0), 0)
  const getNetAmount = () => getTotalIncome() - getTotalExpense()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-light bg-bg-primary/80 backdrop-blur-glass">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <BackToHomeButton />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">財務會計系統</h1>
                <p className="text-xs text-text-tertiary">Financial Accounting</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn-apple-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增交易
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-6">
        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card-apple">
            <div className="card-apple-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">總收入</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(getTotalIncome())}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success-light text-success flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="card-apple">
            <div className="card-apple-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">總支出</p>
                  <p className="text-2xl font-bold text-error">{formatCurrency(getTotalExpense())}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-error-light text-error flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="card-apple">
            <div className="card-apple-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">淨額</p>
                  <p className={`text-2xl font-bold ${getNetAmount() >= 0 ? 'text-success' : 'text-error'}`}>
                    {formatCurrency(getNetAmount())}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  getNetAmount() >= 0 ? 'bg-success-light text-success' : 'bg-error-light text-error'
                }`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 篩選和視圖切換 */}
        <div className="card-apple mb-6">
          <div className="card-apple-content">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 年份選擇 */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="input-apple"
              >
                <option value={2024}>2024年</option>
                <option value={2025}>2025年</option>
                <option value={2026}>2026年</option>
              </select>

              {/* 月份選擇 */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-apple"
              >
                <option value="all">全部月份</option>
                {Array.from(new Set(transactions.map(t => t.billing_month))).sort().map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>

              {/* 搜尋 */}
              <input
                type="text"
                placeholder="搜尋交易項目、經手人..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-apple flex-1"
              />

              {/* 視圖切換 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`btn-apple-secondary ${viewMode === 'list' ? 'bg-primary text-white' : ''}`}
                >
                  列表
                </button>
                <button
                  onClick={() => setViewMode('summary')}
                  className={`btn-apple-secondary ${viewMode === 'summary' ? 'bg-primary text-white' : ''}`}
                >
                  摘要
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 內容區域 */}
        {viewMode === 'list' ? (
          /* 交易列表 */
          <div className="card-apple">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">日期</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">交易項目</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">類別</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-text-secondary">收入</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-text-secondary">支出</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">付款方式</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">經手人</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border-light hover:bg-bg-secondary transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary whitespace-nowrap">
                        {new Date(transaction.transaction_date).toLocaleDateString('zh-HK')}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">{transaction.transaction_item}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {transaction.income_category || transaction.expense_category || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-success">
                        {transaction.income_amount > 0 ? formatCurrency(transaction.income_amount) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-error">
                        {transaction.expense_amount > 0 ? formatCurrency(transaction.expense_amount) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{transaction.payment_method}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{transaction.handler || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* 摘要視圖 */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 月度摘要 */}
            <div className="card-apple">
              <div className="card-apple-content">
                <h3 className="text-lg font-semibold text-text-primary mb-4">月度摘要</h3>
                <div className="space-y-3">
                  {monthSummaries.map((summary) => (
                    <div key={summary.month} className="p-4 rounded-xl bg-bg-secondary">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-text-primary">{summary.month}</span>
                        <span className={`font-bold ${summary.netAmount >= 0 ? 'text-success' : 'text-error'}`}>
                          {formatCurrency(summary.netAmount)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-text-tertiary">收入：</span>
                          <span className="text-success font-semibold">{formatCurrency(summary.totalIncome)}</span>
                        </div>
                        <div>
                          <span className="text-text-tertiary">支出：</span>
                          <span className="text-error font-semibold">{formatCurrency(summary.totalExpense)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 收支類別統計 */}
            <div className="space-y-6">
              {/* 收入類別 */}
              <div className="card-apple">
                <div className="card-apple-content">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">收入類別統計</h3>
                  <div className="space-y-3">
                    {incomeSummaries.map((summary) => (
                      <div key={summary.category} className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-text-primary">{summary.category}</div>
                          <div className="text-xs text-text-tertiary">{summary.count} 筆交易</div>
                        </div>
                        <div className="text-success font-bold">{formatCurrency(summary.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 支出類別 */}
              <div className="card-apple">
                <div className="card-apple-content">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">支出類別統計</h3>
                  <div className="space-y-3">
                    {expenseSummaries.slice(0, 10).map((summary) => (
                      <div key={summary.category} className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-text-primary">{summary.category}</div>
                          <div className="text-xs text-text-tertiary">{summary.count} 筆交易</div>
                        </div>
                        <div className="text-error font-bold">{formatCurrency(summary.amount)}</div>
                      </div>
                    ))}
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
