'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { BackToHomeButton } from '../../components/BackToHomeButton'

interface FinancialTransaction {
  id: string
  transaction_code: string
  journal_number: string | null      // 純數字流水序號
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
  transaction_type?: string
  is_petty_cash_transaction?: boolean
  created_at: string
  updated_at: string
}

interface MonthSummary {
  month: string
  totalIncome: number
  totalExpense: number
  netAmount: number
  transactionCount: number
}

interface CategorySummary {
  category: string
  amount: number
  count: number
}

interface PettyCashSummary {
  totalIn: number
  totalOut: number
  balance: number
  transactions: FinancialTransaction[]
}

type ViewMode = 'list' | 'summary' | 'petty_cash' | 'ledger'
type TransactionFilter = 'all' | 'income' | 'expense' | 'petty_cash'

export default function AccountingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransaction[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  
  // 摘要數據
  const [monthSummaries, setMonthSummaries] = useState<MonthSummary[]>([])
  const [incomeSummaries, setIncomeSummaries] = useState<CategorySummary[]>([])
  const [expenseSummaries, setExpenseSummaries] = useState<CategorySummary[]>([])
  const [pettyCashSummary, setPettyCashSummary] = useState<PettyCashSummary>({
    totalIn: 0, totalOut: 0, balance: 0, transactions: []
  })
  
  // 新增交易表單
  const [newTransaction, setNewTransaction] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_item: '',
    payment_method: '現金',
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: '',
    handler: '',
    notes: ''
  })

  // 可用年份列表
  const availableYears = [...new Set(transactions.map(t => t.fiscal_year))].sort((a, b) => b - a)

  useEffect(() => {
    checkUser()
    fetchTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
    calculateSummaries()
  }, [transactions, selectedYear, selectedMonth, searchTerm, transactionFilter])

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

    // 類型篩選
    if (transactionFilter === 'income') {
      filtered = filtered.filter(t => t.income_amount > 0)
    } else if (transactionFilter === 'expense') {
      filtered = filtered.filter(t => t.expense_amount > 0 && (!t.petty_cash || t.petty_cash === 0))
    } else if (transactionFilter === 'petty_cash') {
      filtered = filtered.filter(t => t.petty_cash && t.petty_cash > 0)
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
    
    // Petty Cash 統計
    let pettyCashIn = 0
    let pettyCashOut = 0
    const pettyCashTxns: FinancialTransaction[] = []

    const yearTransactions = transactions.filter(t => t.fiscal_year === selectedYear)

    yearTransactions.forEach(t => {
      // Petty Cash 統計
      if (t.petty_cash && t.petty_cash > 0) {
        pettyCashTxns.push(t)
        if (t.income_amount > 0) {
          pettyCashIn += t.petty_cash
        } else {
          pettyCashOut += t.petty_cash
        }
      }

      // 月度統計
      if (!monthMap.has(t.billing_month)) {
        monthMap.set(t.billing_month, {
          month: t.billing_month,
          totalIncome: 0,
          totalExpense: 0,
          netAmount: 0,
          transactionCount: 0
        })
      }
      const monthData = monthMap.get(t.billing_month)!
      monthData.totalIncome += t.income_amount || 0
      monthData.totalExpense += t.expense_amount || 0
      monthData.netAmount = monthData.totalIncome - monthData.totalExpense
      monthData.transactionCount += 1

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

    setPettyCashSummary({
      totalIn: pettyCashIn,
      totalOut: pettyCashOut,
      balance: pettyCashIn - pettyCashOut,
      transactions: pettyCashTxns.sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      )
    })

    setMonthSummaries(Array.from(monthMap.values()).sort((a, b) => b.month.localeCompare(a.month)))
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const getTotalIncome = () => filteredTransactions.reduce((sum, t) => sum + (t.income_amount || 0), 0)
  const getTotalExpense = () => filteredTransactions.reduce((sum, t) => sum + (t.expense_amount || 0), 0)
  const getNetAmount = () => getTotalIncome() - getTotalExpense()

  // 自動生成交易編號 (前端臨時顯示用)
  const generateTransactionCode = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const random = String(Math.floor(Math.random() * 9999)).padStart(4, '0')
    return `MC-${year}-${month}-${random}`
  }

  const handleAddTransaction = async () => {
    try {
      const transactionDate = new Date(newTransaction.transaction_date)
      const fiscalYear = transactionDate.getFullYear()
      const billingMonth = `${fiscalYear}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`
      
      const amount = parseFloat(newTransaction.amount)
      
      const { error } = await supabase
        .from('financial_transactions')
        .insert({
          transaction_code: generateTransactionCode(),
          billing_month: billingMonth,
          transaction_date: newTransaction.transaction_date,
          transaction_item: newTransaction.transaction_item,
          payment_method: newTransaction.payment_method,
          income_category: newTransaction.type === 'income' ? newTransaction.category : null,
          expense_category: newTransaction.type === 'expense' ? newTransaction.category : null,
          income_amount: newTransaction.type === 'income' ? amount : 0,
          expense_amount: newTransaction.type === 'expense' ? amount : 0,
          handler: newTransaction.handler || null,
          fiscal_year: fiscalYear
        })

      if (error) throw error
      
      setShowAddModal(false)
      setNewTransaction({
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_item: '',
        payment_method: '現金',
        type: 'expense',
        category: '',
        amount: '',
        handler: '',
        notes: ''
      })
      fetchTransactions()
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('新增交易失敗')
    }
  }

  // 支出類別選項
  const expenseCategories = [
    '護理人員工資', '辦公用品', '廣告及軟件費用', '辦公費用', 
    '電話費及上網費', '辦公室同事工資', '交通開支', '商務餐',
    'MPF', '租金', '電費', '銀行手續費', '保險', '牌照費',
    '佣金', '水費', '維修費用', '客人退款', 'Steven 會籍費用', '股東支出'
  ]

  // 收入類別選項
  const incomeCategories = ['護理服務費用', '股東資本', '銀行利息', '政府補貼']

  // 經手人選項
  const handlers = ['Candy Ho', 'Joe Cheung', 'Kanas Leung', 'Amy Yiu', 'Albert Lee', 'Dennis Ho']

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
                <p className="text-xs text-text-tertiary">Professional Accounting System</p>
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
        {/* 統計卡片 - 4欄設計 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card-apple">
            <div className="card-apple-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-text-secondary mb-1">總收入</p>
                  <p className="text-lg sm:text-2xl font-bold text-success">{formatCurrency(getTotalIncome())}</p>
                  <p className="text-xs text-text-tertiary mt-1">{filteredTransactions.filter(t => t.income_amount > 0).length} 筆</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success-light text-success flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <p className="text-xs sm:text-sm text-text-secondary mb-1">總支出</p>
                  <p className="text-lg sm:text-2xl font-bold text-error">{formatCurrency(getTotalExpense())}</p>
                  <p className="text-xs text-text-tertiary mt-1">{filteredTransactions.filter(t => t.expense_amount > 0).length} 筆</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-error-light text-error flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <p className="text-xs sm:text-sm text-text-secondary mb-1">淨額</p>
                  <p className={`text-lg sm:text-2xl font-bold ${getNetAmount() >= 0 ? 'text-success' : 'text-error'}`}>
                    {formatCurrency(getNetAmount())}
                  </p>
                  <p className="text-xs text-text-tertiary mt-1">
                    {getNetAmount() >= 0 ? '盈餘' : '虧損'}
                  </p>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                  getNetAmount() >= 0 ? 'bg-success-light text-success' : 'bg-error-light text-error'
                }`}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Petty Cash 餘額卡 */}
          <div className="card-apple bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <div className="card-apple-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mb-1">零用金</p>
                  <p className="text-lg sm:text-2xl font-bold text-amber-800 dark:text-amber-200">
                    {formatCurrency(pettyCashSummary.balance)}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {pettyCashSummary.transactions.length} 筆交易
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-200 dark:bg-amber-700 text-amber-700 dark:text-amber-200 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 篩選和視圖切換 */}
        <div className="card-apple mb-6">
          <div className="card-apple-content">
            <div className="flex flex-col gap-4">
              {/* 第一行：視圖切換標籤 */}
              <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl overflow-x-auto">
                {[
                  { id: 'list', label: '交易列表', icon: '📋' },
                  { id: 'summary', label: '財務摘要', icon: '📊' },
                  { id: 'petty_cash', label: '零用金', icon: '💵' },
                  { id: 'ledger', label: '流水帳', icon: '📖' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id as ViewMode)}
                    className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      viewMode === tab.id 
                        ? 'bg-white dark:bg-fill-tertiary text-primary shadow-sm' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 第二行：篩選選項 */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* 年份選擇 */}
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="input-apple min-w-[120px]"
                >
                  {availableYears.length > 0 ? (
                    availableYears.map(year => (
                      <option key={year} value={year}>{year}年</option>
                    ))
                  ) : (
                    <>
                      <option value={2024}>2024年</option>
                      <option value={2025}>2025年</option>
                    </>
                  )}
                </select>

                {/* 月份選擇 */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input-apple min-w-[120px]"
                >
                  <option value="all">全部月份</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = `${selectedYear}-${String(i + 1).padStart(2, '0')}`
                    return <option key={month} value={month}>{i + 1}月</option>
                  })}
                </select>

                {/* 類型篩選 */}
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value as TransactionFilter)}
                  className="input-apple min-w-[120px]"
                >
                  <option value="all">全部類型</option>
                  <option value="income">只看收入</option>
                  <option value="expense">只看支出</option>
                  <option value="petty_cash">零用金交易</option>
                </select>

                {/* 搜尋 */}
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="搜尋交易項目、經手人..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-apple pl-10 w-full"
                  />
                </div>

                {/* 筆數統計 */}
                <div className="flex items-center px-4 py-2 bg-bg-secondary rounded-xl">
                  <span className="text-sm text-text-secondary">
                    共 <span className="font-bold text-primary">{filteredTransactions.length}</span> 筆
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 內容區域 */}
        {viewMode === 'list' && (
          /* 交易列表視圖 */
          <div className="card-apple">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-light bg-bg-secondary">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">序號</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">交易編號</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">日期</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">交易項目</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">類別</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">收入</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">支出</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">付款方式</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">經手人</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {filteredTransactions.map((transaction, index) => (
                    <tr key={transaction.id} className="hover:bg-bg-secondary/50 transition-colors">
                      <td className="px-3 py-3 text-xs text-text-tertiary font-mono">
                        #{transaction.journal_number || String(index + 1).padStart(8, '0')}
                      </td>
                      <td className="px-3 py-3 text-xs text-primary font-mono">
                        {transaction.transaction_code || '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-text-primary whitespace-nowrap">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="px-3 py-3 text-sm text-text-primary max-w-[250px]">
                        <div className="truncate" title={transaction.transaction_item}>
                          {transaction.transaction_item}
                        </div>
                        {transaction.petty_cash && transaction.petty_cash > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 mt-1">
                            💵 零用金
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-text-secondary">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                          transaction.income_category 
                            ? 'bg-success-light text-success' 
                            : 'bg-error-light text-error'
                        }`}>
                          {transaction.income_category || transaction.expense_category || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-right font-semibold text-success">
                        {transaction.income_amount > 0 ? formatCurrency(transaction.income_amount) : '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-right font-semibold text-error">
                        {transaction.expense_amount > 0 ? formatCurrency(transaction.expense_amount) : '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                          transaction.payment_method === '銀行轉賬' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {transaction.payment_method}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-text-secondary">{transaction.handler || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-bg-secondary border-t-2 border-border-light">
                  <tr>
                    <td colSpan={5} className="px-3 py-3 text-sm font-bold text-text-primary">總計</td>
                    <td className="px-3 py-3 text-sm text-right font-bold text-success">{formatCurrency(getTotalIncome())}</td>
                    <td className="px-3 py-3 text-sm text-right font-bold text-error">{formatCurrency(getTotalExpense())}</td>
                    <td colSpan={2} className="px-3 py-3 text-sm text-center font-bold">
                      <span className={getNetAmount() >= 0 ? 'text-success' : 'text-error'}>
                        淨額: {formatCurrency(getNetAmount())}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'summary' && (
          /* 財務摘要視圖 */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 月度摘要 */}
            <div className="lg:col-span-1 card-apple">
              <div className="card-apple-content">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <span>📅</span> 月度摘要
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {monthSummaries.map((summary) => (
                    <div key={summary.month} className="p-4 rounded-xl bg-bg-secondary hover:bg-bg-tertiary transition-colors">
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
                      <div className="mt-2 text-xs text-text-tertiary">
                        {summary.transactionCount} 筆交易
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 收入類別統計 */}
            <div className="card-apple">
              <div className="card-apple-content">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <span>📈</span> 收入來源
                </h3>
                <div className="space-y-4">
                  {incomeSummaries.map((summary) => {
                    const percentage = (summary.amount / getTotalIncome()) * 100
                    return (
                      <div key={summary.category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-text-primary">{summary.category}</span>
                          <span className="text-success font-bold">{formatCurrency(summary.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-success h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-text-tertiary mt-1">
                          <span>{summary.count} 筆</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 支出類別統計 */}
            <div className="card-apple">
              <div className="card-apple-content">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <span>📉</span> 支出分析
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {expenseSummaries.map((summary) => {
                    const percentage = (summary.amount / getTotalExpense()) * 100
                    return (
                      <div key={summary.category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-text-primary truncate flex-1 mr-2">{summary.category}</span>
                          <span className="text-error font-bold">{formatCurrency(summary.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-error h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-text-tertiary mt-1">
                          <span>{summary.count} 筆</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'petty_cash' && (
          /* 零用金專區 */
          <div className="space-y-6">
            {/* 零用金概覽 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card-apple bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="card-apple-content text-center">
                  <p className="text-sm text-green-700 dark:text-green-300 mb-2">零用金補充</p>
                  <p className="text-3xl font-bold text-green-800 dark:text-green-200">
                    {formatCurrency(pettyCashSummary.totalIn)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    共 {pettyCashSummary.transactions.filter(t => t.income_amount > 0).length} 次補充
                  </p>
                </div>
              </div>
              
              <div className="card-apple bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
                <div className="card-apple-content text-center">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">零用金支出</p>
                  <p className="text-3xl font-bold text-red-800 dark:text-red-200">
                    {formatCurrency(pettyCashSummary.totalOut)}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    共 {pettyCashSummary.transactions.filter(t => t.expense_amount > 0).length} 筆支出
                  </p>
                </div>
              </div>
              
              <div className="card-apple bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
                <div className="card-apple-content text-center">
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">當前餘額</p>
                  <p className={`text-3xl font-bold ${pettyCashSummary.balance >= 0 ? 'text-amber-800 dark:text-amber-200' : 'text-red-600'}`}>
                    {formatCurrency(pettyCashSummary.balance)}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    截至 {selectedYear}年
                  </p>
                </div>
              </div>
            </div>

            {/* 零用金交易記錄 */}
            <div className="card-apple">
              <div className="card-apple-content">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <span>💵</span> 零用金交易記錄
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-light bg-bg-secondary">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">日期</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">說明</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary">類型</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">金額</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">經手人</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                      {pettyCashSummary.transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-bg-secondary/50">
                          <td className="px-4 py-3 text-sm text-text-primary whitespace-nowrap">
                            {formatDate(txn.transaction_date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-text-primary">
                            {txn.transaction_item}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              txn.income_amount > 0
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {txn.income_amount > 0 ? '📥 補充' : '📤 支出'}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-bold ${
                            txn.income_amount > 0 ? 'text-success' : 'text-error'
                          }`}>
                            {txn.income_amount > 0 ? '+' : '-'}{formatCurrency(txn.petty_cash || 0)}
                          </td>
                          <td className="px-4 py-3 text-sm text-text-secondary">
                            {txn.handler || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {pettyCashSummary.transactions.length === 0 && (
                  <div className="text-center py-12 text-text-tertiary">
                    <span className="text-4xl mb-4 block">💵</span>
                    <p>暫無零用金交易記錄</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'ledger' && (
          /* 流水帳視圖 */
          <div className="card-apple">
            <div className="card-apple-content">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <span>📖</span> 流水帳 - {selectedYear}年{selectedMonth !== 'all' ? selectedMonth.split('-')[1] + '月' : '全年'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-border-light bg-bg-secondary">
                      <th className="px-2 py-2 text-center font-semibold text-text-secondary w-20">流水號</th>
                      <th className="px-2 py-2 text-center font-semibold text-text-secondary w-32">交易編號</th>
                      <th className="px-2 py-2 text-center font-semibold text-text-secondary w-24">日期</th>
                      <th className="px-2 py-2 text-left font-semibold text-text-secondary">摘要</th>
                      <th className="px-2 py-2 text-right font-semibold text-text-secondary w-28">借方(支出)</th>
                      <th className="px-2 py-2 text-right font-semibold text-text-secondary w-28">貸方(收入)</th>
                      <th className="px-2 py-2 text-right font-semibold text-text-secondary w-32">餘額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {(() => {
                      let runningBalance = 0
                      const sortedTransactions = [...filteredTransactions].sort(
                        (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
                      )
                      return sortedTransactions.map((txn, index) => {
                        runningBalance += (txn.income_amount || 0) - (txn.expense_amount || 0)
                        return (
                          <tr key={txn.id} className="hover:bg-bg-secondary/50">
                            <td className="px-2 py-2 text-center text-text-tertiary font-mono text-xs">
                              #{txn.journal_number || String(index + 1).padStart(8, '0')}
                            </td>
                            <td className="px-2 py-2 text-center text-primary font-mono text-xs">
                              {txn.transaction_code || '-'}
                            </td>
                            <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                              {formatDate(txn.transaction_date)}
                            </td>
                            <td className="px-2 py-2 text-text-primary">
                              <div className="truncate max-w-[250px]" title={txn.transaction_item}>
                                {txn.transaction_item}
                              </div>
                              <span className="text-xs text-text-tertiary">
                                {txn.income_category || txn.expense_category}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-error">
                              {txn.expense_amount > 0 ? formatCurrency(txn.expense_amount) : ''}
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-success">
                              {txn.income_amount > 0 ? formatCurrency(txn.income_amount) : ''}
                            </td>
                            <td className={`px-2 py-2 text-right font-mono font-bold ${
                              runningBalance >= 0 ? 'text-success' : 'text-error'
                            }`}>
                              {formatCurrency(runningBalance)}
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                  <tfoot className="bg-bg-secondary border-t-2 border-border-light">
                    <tr>
                      <td colSpan={4} className="px-2 py-3 text-right font-bold text-text-primary">期末合計</td>
                      <td className="px-2 py-3 text-right font-bold text-error">{formatCurrency(getTotalExpense())}</td>
                      <td className="px-2 py-3 text-right font-bold text-success">{formatCurrency(getTotalIncome())}</td>
                      <td className={`px-2 py-3 text-right font-bold ${getNetAmount() >= 0 ? 'text-success' : 'text-error'}`}>
                        {formatCurrency(getNetAmount())}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 新增交易 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-bg-primary rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border-light">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-text-primary">新增交易</h2>
                <button onClick={() => setShowAddModal(false)} className="text-text-tertiary hover:text-text-primary">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* 交易類型切換 */}
              <div className="flex gap-2 p-1 bg-bg-secondary rounded-xl">
                <button
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'income', category: '' })}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    newTransaction.type === 'income' 
                      ? 'bg-success text-white' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  收入
                </button>
                <button
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'expense', category: '' })}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    newTransaction.type === 'expense' 
                      ? 'bg-error text-white' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  支出
                </button>
              </div>

              {/* 日期 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">交易日期</label>
                <input
                  type="date"
                  value={newTransaction.transaction_date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                  className="input-apple w-full"
                />
              </div>

              {/* 交易項目 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">交易項目</label>
                <input
                  type="text"
                  placeholder="輸入交易說明..."
                  value={newTransaction.transaction_item}
                  onChange={(e) => setNewTransaction({ ...newTransaction, transaction_item: e.target.value })}
                  className="input-apple w-full"
                />
              </div>

              {/* 類別 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">類別</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className="input-apple w-full"
                >
                  <option value="">選擇類別...</option>
                  {(newTransaction.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* 金額 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">金額 (HKD)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  className="input-apple w-full text-right text-xl font-bold"
                />
              </div>

              {/* 付款方式 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">付款方式</label>
                <select
                  value={newTransaction.payment_method}
                  onChange={(e) => setNewTransaction({ ...newTransaction, payment_method: e.target.value })}
                  className="input-apple w-full"
                >
                  <option value="現金">現金</option>
                  <option value="銀行轉賬">銀行轉賬</option>
                </select>
              </div>

              {/* 經手人 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">經手人</label>
                <select
                  value={newTransaction.handler}
                  onChange={(e) => setNewTransaction({ ...newTransaction, handler: e.target.value })}
                  className="input-apple w-full"
                >
                  <option value="">選擇經手人...</option>
                  {handlers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-border-light flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-apple-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleAddTransaction}
                disabled={!newTransaction.transaction_item || !newTransaction.amount || !newTransaction.category}
                className="btn-apple-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                儲存交易
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
