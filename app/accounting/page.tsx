'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// 財務交易類型
interface FinancialTransaction {
  id: string
  journal_number: string
  transaction_code: string
  fiscal_year: number
  billing_month: string
  transaction_date: string
  transaction_item: string
  payment_method: string
  income_category: string | null
  income_amount: number
  expense_category: string | null
  expense_amount: number
  handler: string | null
  reimbursement_status: string | null
  notes: string | null
}

type ViewMode = 'ledger' | 'petty_cash'

export default function AccountingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('ledger')

  // 可用年份列表
  const availableYears = [...new Set(transactions.map(t => t.fiscal_year))].sort((a, b) => b - a)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchTransactions()
    }
  }, [selectedYear])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    setLoading(false)
    fetchTransactions()
  }

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('fiscal_year', selectedYear)
      .order('transaction_date', { ascending: true })

    if (error) {
      console.error('Error fetching transactions:', error)
      return
    }

    setTransactions(data || [])
  }

  // 從交易日期提取 YYYY-MM 格式
  const getMonthFromDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  // 篩選流水帳交易：只有銀行轉賬
  const getLedgerTransactions = () => {
    let filtered = transactions.filter(t => t.payment_method === '銀行轉賬')

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(t => getMonthFromDate(t.transaction_date) === selectedMonth)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.transaction_item.toLowerCase().includes(term) ||
        t.transaction_code?.toLowerCase().includes(term) ||
        t.income_category?.toLowerCase().includes(term) ||
        t.expense_category?.toLowerCase().includes(term)
      )
    }

    return filtered
  }

  // 篩選零用金交易：所有現金交易（收入=補充，支出=使用）
  const getPettyCashTransactions = () => {
    let filtered = transactions.filter(t => t.payment_method === '現金')

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(t => getMonthFromDate(t.transaction_date) === selectedMonth)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.transaction_item.toLowerCase().includes(term) ||
        t.transaction_code?.toLowerCase().includes(term) ||
        t.income_category?.toLowerCase().includes(term) ||
        t.expense_category?.toLowerCase().includes(term)
      )
    }

    return filtered
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 取得可用月份（從交易日期提取）
  const getAvailableMonths = () => {
    const months = [...new Set(transactions.map(t => getMonthFromDate(t.transaction_date)))]
    return months.sort()
  }

  // 格式化月份顯示
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    return `${year}年${parseInt(month)}月`
  }

  // 流水帳統計
  const getLedgerStats = () => {
    const data = getLedgerTransactions()
    const totalIncome = data.reduce((sum, t) => sum + (t.income_amount || 0), 0)
    const totalExpense = data.reduce((sum, t) => sum + (t.expense_amount || 0), 0)
    return { totalIncome, totalExpense, net: totalIncome - totalExpense, count: data.length }
  }

  // 零用金統計：補充(收入) - 支出 = 餘額
  const getPettyCashStats = () => {
    const data = getPettyCashTransactions()
    const totalIn = data.reduce((sum, t) => sum + (t.income_amount || 0), 0)  // 補充
    const totalOut = data.reduce((sum, t) => sum + (t.expense_amount || 0), 0) // 支出
    return { totalIn, totalOut, balance: totalIn - totalOut, count: data.length }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">載入中...</p>
        </div>
      </div>
    )
  }

  const ledgerStats = getLedgerStats()
  const pettyCashStats = getPettyCashStats()

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-xl border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl hover:bg-bg-secondary transition-colors"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">財務會計</h1>
                <p className="text-sm text-text-secondary">流水帳及零用金管理</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 視圖切換 */}
        <div className="flex gap-2 p-1 bg-bg-secondary rounded-xl">
          <button
            onClick={() => setViewMode('ledger')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'ledger'
                ? 'bg-white dark:bg-fill-tertiary text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="mr-2">🏦</span>
            流水帳
          </button>
          <button
            onClick={() => setViewMode('petty_cash')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'petty_cash'
                ? 'bg-white dark:bg-fill-tertiary text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="mr-2">💵</span>
            零用金
          </button>
        </div>

        {/* 篩選器 */}
        <div className="card-apple">
          <div className="card-apple-content">
            <div className="flex flex-wrap gap-4">
              {/* 年份選擇 */}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-text-secondary mb-1">年份</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="input-apple w-full"
                >
                  {(availableYears.length > 0 ? availableYears : [2024, 2025, 2026]).map(year => (
                    <option key={year} value={year}>{year}年</option>
                  ))}
                </select>
              </div>

              {/* 月份選擇 */}
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-text-secondary mb-1">月份（按交易日期）</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input-apple w-full"
                >
                  <option value="all">全年</option>
                  {getAvailableMonths().map(month => (
                    <option key={month} value={month}>{formatMonth(month)}</option>
                  ))}
                </select>
              </div>

              {/* 搜尋 */}
              <div className="flex-[2] min-w-[200px]">
                <label className="block text-xs font-medium text-text-secondary mb-1">搜尋</label>
                <input
                  type="text"
                  placeholder="搜尋交易項目、編號..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-apple w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 統計摘要 */}
        {viewMode === 'ledger' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-apple bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="card-apple-content text-center">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">交易筆數</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{ledgerStats.count}</p>
              </div>
            </div>
            <div className="card-apple bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="card-apple-content text-center">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">總收入</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(ledgerStats.totalIncome)}</p>
              </div>
            </div>
            <div className="card-apple bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
              <div className="card-apple-content text-center">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">總支出</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatCurrency(ledgerStats.totalExpense)}</p>
              </div>
            </div>
            <div className={`card-apple bg-gradient-to-br ${ledgerStats.net >= 0 ? 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20' : 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'}`}>
              <div className="card-apple-content text-center">
                <p className={`text-xs mb-1 ${ledgerStats.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>淨額</p>
                <p className={`text-xl font-bold ${ledgerStats.net >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'}`}>{formatCurrency(ledgerStats.net)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-apple bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <div className="card-apple-content text-center">
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">交易筆數</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pettyCashStats.count}</p>
              </div>
            </div>
            <div className="card-apple bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="card-apple-content text-center">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">總補充</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(pettyCashStats.totalIn)}</p>
              </div>
            </div>
            <div className="card-apple bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
              <div className="card-apple-content text-center">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">總支出</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatCurrency(pettyCashStats.totalOut)}</p>
              </div>
            </div>
            <div className={`card-apple bg-gradient-to-br ${pettyCashStats.balance >= 0 ? 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20' : 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'}`}>
              <div className="card-apple-content text-center">
                <p className={`text-xs mb-1 ${pettyCashStats.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>餘額</p>
                <p className={`text-xl font-bold ${pettyCashStats.balance >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'}`}>{formatCurrency(pettyCashStats.balance)}</p>
              </div>
            </div>
          </div>
        )}

        {/* 流水帳表格 */}
        {viewMode === 'ledger' && (
          <div className="card-apple overflow-hidden">
            <div className="card-apple-content p-0">
              <div className="px-4 py-3 border-b border-border-light bg-bg-secondary">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  <span>🏦</span> 流水帳 - {selectedMonth !== 'all' ? formatMonth(selectedMonth) : `${selectedYear}年全年`}
                </h3>
                <p className="text-xs text-text-tertiary mt-1">銀行轉賬記錄</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-secondary border-b border-border-light">
                      <th className="px-3 py-2 text-left font-semibold text-text-secondary w-20">流水號</th>
                      <th className="px-3 py-2 text-left font-semibold text-text-secondary w-24">日期</th>
                      <th className="px-3 py-2 text-left font-semibold text-text-secondary">摘要</th>
                      <th className="px-3 py-2 text-left font-semibold text-text-secondary w-24">類別</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-secondary w-28">收入</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-secondary w-28">支出</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-secondary w-32">餘額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {(() => {
                      let runningBalance = 0
                      const data = getLedgerTransactions()
                      return data.map((txn, index) => {
                        runningBalance += (txn.income_amount || 0) - (txn.expense_amount || 0)
                        return (
                          <tr key={txn.id} className="hover:bg-bg-secondary/50">
                            <td className="px-3 py-2 text-text-tertiary font-mono text-xs">
                              {txn.journal_number}
                            </td>
                            <td className="px-3 py-2 text-text-primary whitespace-nowrap">
                              {formatDate(txn.transaction_date)}
                            </td>
                            <td className="px-3 py-2 text-text-primary">
                              <div className="truncate max-w-[300px]" title={txn.transaction_item}>
                                {txn.transaction_item}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-text-secondary text-xs">
                              {txn.income_category || txn.expense_category || '-'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-success">
                              {txn.income_amount > 0 ? formatCurrency(txn.income_amount) : ''}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-error">
                              {txn.expense_amount > 0 ? formatCurrency(txn.expense_amount) : ''}
                            </td>
                            <td className={`px-3 py-2 text-right font-mono font-bold ${runningBalance >= 0 ? 'text-success' : 'text-error'}`}>
                              {formatCurrency(runningBalance)}
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                  <tfoot className="bg-bg-secondary border-t-2 border-border-light">
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-right font-bold text-text-primary">合計</td>
                      <td className="px-3 py-3 text-right font-bold text-success">{formatCurrency(ledgerStats.totalIncome)}</td>
                      <td className="px-3 py-3 text-right font-bold text-error">{formatCurrency(ledgerStats.totalExpense)}</td>
                      <td className={`px-3 py-3 text-right font-bold ${ledgerStats.net >= 0 ? 'text-success' : 'text-error'}`}>
                        {formatCurrency(ledgerStats.net)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {getLedgerTransactions().length === 0 && (
                <div className="text-center py-12 text-text-tertiary">
                  <span className="text-4xl mb-4 block">🏦</span>
                  <p>暫無流水帳記錄</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 零用金表格 */}
        {viewMode === 'petty_cash' && (
          <div className="card-apple overflow-hidden">
            <div className="card-apple-content p-0">
              <div className="px-4 py-3 border-b border-border-light bg-bg-secondary">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  <span>💵</span> 零用金帳戶 - {selectedMonth !== 'all' ? formatMonth(selectedMonth) : `${selectedYear}年全年`}
                </h3>
                <p className="text-xs text-text-tertiary mt-1">現金補充及支出記錄</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-secondary border-b border-border-light">
                      <th className="px-3 py-2 text-left font-semibold text-text-secondary w-28">編號</th>
                      <th className="px-3 py-2 text-left font-semibold text-text-secondary w-24">日期</th>
                      <th className="px-3 py-2 text-left font-semibold text-text-secondary">項目</th>
                      <th className="px-3 py-2 text-left font-semibold text-text-secondary w-28">類別</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-secondary w-24">補充</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-secondary w-24">支出</th>
                      <th className="px-3 py-2 text-right font-semibold text-text-secondary w-28">餘額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {(() => {
                      let runningBalance = 0
                      const data = getPettyCashTransactions()
                      return data.map((txn) => {
                        runningBalance += (txn.income_amount || 0) - (txn.expense_amount || 0)
                        return (
                          <tr key={txn.id} className="hover:bg-bg-secondary/50">
                            <td className="px-3 py-2 text-primary font-mono text-xs">
                              {txn.transaction_code || txn.journal_number}
                            </td>
                            <td className="px-3 py-2 text-text-primary whitespace-nowrap">
                              {formatDate(txn.transaction_date)}
                            </td>
                            <td className="px-3 py-2 text-text-primary">
                              <div className="truncate max-w-[250px]" title={txn.transaction_item}>
                                {txn.transaction_item}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-text-secondary text-xs">
                              {txn.income_category || txn.expense_category || '-'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-success">
                              {txn.income_amount > 0 ? formatCurrency(txn.income_amount) : ''}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-error">
                              {txn.expense_amount > 0 ? formatCurrency(txn.expense_amount) : ''}
                            </td>
                            <td className={`px-3 py-2 text-right font-mono font-bold ${runningBalance >= 0 ? 'text-success' : 'text-error'}`}>
                              {formatCurrency(runningBalance)}
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                  <tfoot className="bg-bg-secondary border-t-2 border-border-light">
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-right font-bold text-text-primary">合計</td>
                      <td className="px-3 py-3 text-right font-bold text-success">{formatCurrency(pettyCashStats.totalIn)}</td>
                      <td className="px-3 py-3 text-right font-bold text-error">{formatCurrency(pettyCashStats.totalOut)}</td>
                      <td className={`px-3 py-3 text-right font-bold ${pettyCashStats.balance >= 0 ? 'text-success' : 'text-error'}`}>
                        {formatCurrency(pettyCashStats.balance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {getPettyCashTransactions().length === 0 && (
                <div className="text-center py-12 text-text-tertiary">
                  <span className="text-4xl mb-4 block">💵</span>
                  <p>暫無零用金記錄</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
