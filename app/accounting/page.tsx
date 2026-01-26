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
  deduct_from_petty_cash: boolean | null
  is_deleted?: boolean
  created_by?: string
  updated_by?: string
}

// 審計日誌類型
interface AuditLog {
  id: string
  transaction_id: string
  journal_number: string
  action_type: string
  changed_fields: string[]
  old_values: Record<string, any>
  new_values: Record<string, any>
  performed_by: string
  performed_at: string
  notes: string | null
}

// 類別選項類型
interface CategoryOption {
  id: number
  name: string
  color?: string
  is_active: boolean
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
  const [showExcludedModal, setShowExcludedModal] = useState(false)
  
  // 編輯相關狀態
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null)
  const [currentUser, setCurrentUser] = useState<string>('')
  const [saving, setSaving] = useState(false)
  
  // 審計日誌
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [selectedTransactionForLog, setSelectedTransactionForLog] = useState<FinancialTransaction | null>(null)

  // 類別選項
  const [handlers, setHandlers] = useState<CategoryOption[]>([])
  const [incomeCategories, setIncomeCategories] = useState<CategoryOption[]>([])
  const [expenseCategories, setExpenseCategories] = useState<CategoryOption[]>([])
  const [paymentMethods, setPaymentMethods] = useState<CategoryOption[]>([])
  const [reimbursementStatuses, setReimbursementStatuses] = useState<CategoryOption[]>([])

  // 可用年份列表
  const availableYears = [...new Set(transactions.map(t => t.fiscal_year))].sort((a, b) => b - a)

  useEffect(() => {
    checkUser()
    fetchCategories()
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
    setCurrentUser(user.email || user.id)
    setLoading(false)
    fetchTransactions()
  }

  // 載入所有類別選項
  const fetchCategories = async () => {
    const [handlersRes, incomeCatRes, expenseCatRes, paymentRes, reimbursementRes] = await Promise.all([
      supabase.from('accounting_handlers').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('income_categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('expense_categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('payment_methods').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('reimbursement_statuses').select('*').eq('is_active', true).order('sort_order')
    ])

    if (handlersRes.data) setHandlers(handlersRes.data)
    if (incomeCatRes.data) setIncomeCategories(incomeCatRes.data)
    if (expenseCatRes.data) setExpenseCategories(expenseCatRes.data)
    if (paymentRes.data) setPaymentMethods(paymentRes.data)
    if (reimbursementRes.data) setReimbursementStatuses(reimbursementRes.data)
  }

  const fetchTransactions = async () => {
    // 分頁取得所有交易 (Supabase 預設每次最多 1000 筆)
    let allData: FinancialTransaction[] = []
    let offset = 0
    const pageSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('fiscal_year', selectedYear)
        .or('is_deleted.is.null,is_deleted.eq.false')  // 只顯示未刪除的
        .order('transaction_date', { ascending: true })
        .range(offset, offset + pageSize - 1)

      if (error) {
        console.error('Error fetching transactions:', error)
        return
      }

      if (data) {
        allData = [...allData, ...data]
      }

      // 如果取得的數據少於 pageSize，表示已經取完
      if (!data || data.length < pageSize) {
        break
      }
      offset += pageSize
    }

    setTransactions(allData)
  }

  // 從交易日期提取 YYYY-MM 格式
  const getMonthFromDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  // 篩選流水帳交易：銀行轉賬 + 不從零用金扣除的現金支出
  const getLedgerTransactions = () => {
    let filtered = transactions.filter(t => 
      t.payment_method === '銀行轉賬' ||
      (t.payment_method === '現金' && t.expense_amount > 0 && t.deduct_from_petty_cash === false)
    )

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

  // 篩選零用金交易：現金交易（支出默認從零用金扣除，除非明確設為 false）
  const getPettyCashTransactions = () => {
    let filtered = transactions.filter(t => 
      t.payment_method === '現金' && 
      (t.deduct_from_petty_cash !== false)  // null 或 true 都顯示，只有 false 才排除
    )

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

  // 獲取已排除的現金支出（不在零用金顯示）
  const getExcludedCashExpenses = () => {
    return transactions.filter(t => 
      t.payment_method === '現金' && 
      t.expense_amount > 0 && 
      t.deduct_from_petty_cash === false
    )
  }

  // 切換是否從零用金扣除（帶確認訊息）
  const toggleDeductFromPettyCash = async (id: string, currentValue: boolean, transactionItem: string) => {
    const action = currentValue ? '移至流水帳' : '移回零用金'
    const message = currentValue 
      ? `確定要將「${transactionItem}」移至流水帳嗎？\n\n此項目將不再從零用金扣除。`
      : `確定要將「${transactionItem}」移回零用金嗎？\n\n此項目將從零用金中扣除。`
    
    if (!confirm(message)) {
      return
    }

    const { error } = await supabase
      .from('financial_transactions')
      .update({ deduct_from_petty_cash: !currentValue })
      .eq('id', id)

    if (error) {
      console.error('Error updating:', error)
      alert('更新失敗')
      return
    }

    // 重新載入數據
    fetchTransactions()
  }

  // 開啟編輯 Modal
  const openEditModal = (txn: FinancialTransaction) => {
    setEditingTransaction({ ...txn })
    setShowEditModal(true)
  }

  // 儲存編輯
  const saveTransaction = async () => {
    if (!editingTransaction) return
    
    setSaving(true)
    
    // 找出原始交易
    const originalTxn = transactions.find(t => t.id === editingTransaction.id)
    if (!originalTxn) {
      alert('找不到原始交易')
      setSaving(false)
      return
    }

    // 計算變更的欄位
    const changedFields: string[] = []
    const oldValues: Record<string, any> = {}
    const newValues: Record<string, any> = {}
    
    const fieldsToCheck = [
      'transaction_date', 'transaction_item', 'payment_method',
      'income_category', 'income_amount', 'expense_category', 'expense_amount',
      'handler', 'notes', 'deduct_from_petty_cash'
    ]
    
    fieldsToCheck.forEach(field => {
      const oldVal = (originalTxn as any)[field]
      const newVal = (editingTransaction as any)[field]
      if (oldVal !== newVal) {
        changedFields.push(field)
        oldValues[field] = oldVal
        newValues[field] = newVal
      }
    })

    if (changedFields.length === 0) {
      setShowEditModal(false)
      setSaving(false)
      return
    }

    // 更新交易
    const { error: updateError } = await supabase
      .from('financial_transactions')
      .update({
        transaction_date: editingTransaction.transaction_date,
        transaction_item: editingTransaction.transaction_item,
        payment_method: editingTransaction.payment_method,
        income_category: editingTransaction.income_category,
        income_amount: editingTransaction.income_amount,
        expense_category: editingTransaction.expense_category,
        expense_amount: editingTransaction.expense_amount,
        handler: editingTransaction.handler,
        notes: editingTransaction.notes,
        deduct_from_petty_cash: editingTransaction.deduct_from_petty_cash,
        updated_by: currentUser
      })
      .eq('id', editingTransaction.id)

    if (updateError) {
      console.error('Error updating:', updateError)
      alert('更新失敗')
      setSaving(false)
      return
    }

    // 記錄審計日誌
    await supabase.from('financial_audit_log').insert({
      transaction_id: editingTransaction.id,
      journal_number: editingTransaction.journal_number,
      action_type: 'update',
      changed_fields: changedFields,
      old_values: oldValues,
      new_values: newValues,
      performed_by: currentUser
    })

    setShowEditModal(false)
    setSaving(false)
    fetchTransactions()
  }

  // 確認刪除
  const confirmDelete = (txn: FinancialTransaction) => {
    setTransactionToDelete(txn)
    setShowDeleteConfirm(true)
  }

  // 執行刪除（軟刪除）
  const deleteTransaction = async () => {
    if (!transactionToDelete) return
    
    setSaving(true)

    // 軟刪除
    const { error: deleteError } = await supabase
      .from('financial_transactions')
      .update({
        is_deleted: true,
        deleted_by: currentUser,
        deleted_at: new Date().toISOString()
      })
      .eq('id', transactionToDelete.id)

    if (deleteError) {
      console.error('Error deleting:', deleteError)
      alert('刪除失敗')
      setSaving(false)
      return
    }

    // 記錄審計日誌
    await supabase.from('financial_audit_log').insert({
      transaction_id: transactionToDelete.id,
      journal_number: transactionToDelete.journal_number,
      action_type: 'delete',
      changed_fields: ['is_deleted'],
      old_values: { is_deleted: false },
      new_values: { is_deleted: true },
      performed_by: currentUser
    })

    setShowDeleteConfirm(false)
    setTransactionToDelete(null)
    setSaving(false)
    fetchTransactions()
  }

  // 查看審計日誌
  const viewAuditLog = async (txn: FinancialTransaction) => {
    setSelectedTransactionForLog(txn)
    
    const { data, error } = await supabase
      .from('financial_audit_log')
      .select('*')
      .eq('transaction_id', txn.id)
      .order('performed_at', { ascending: false })

    if (error) {
      console.error('Error fetching audit log:', error)
      return
    }

    setAuditLogs(data || [])
    setShowAuditLog(true)
  }

  // 格式化審計日誌的欄位名稱
  const formatFieldName = (field: string) => {
    const fieldNames: Record<string, string> = {
      transaction_date: '交易日期',
      transaction_item: '交易項目',
      payment_method: '付款方式',
      income_category: '收入類別',
      income_amount: '收入金額',
      expense_category: '支出類別',
      expense_amount: '支出金額',
      handler: '經手人',
      notes: '備註',
      deduct_from_petty_cash: '從零用金扣除',
      is_deleted: '已刪除'
    }
    return fieldNames[field] || field
  }

  // 格式化審計日誌的操作類型
  const formatActionType = (action: string) => {
    const actions: Record<string, { text: string, color: string }> = {
      create: { text: '新增', color: 'text-success' },
      update: { text: '修改', color: 'text-warning' },
      delete: { text: '刪除', color: 'text-error' },
      restore: { text: '還原', color: 'text-primary' }
    }
    return actions[action] || { text: action, color: 'text-text-secondary' }
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
                <p className="text-xs text-text-tertiary mt-1">銀行轉賬及非零用金現金支出</p>
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
                      <th className="px-3 py-2 text-right font-semibold text-text-secondary w-28">餘額</th>
                      <th className="px-3 py-2 text-center font-semibold text-text-secondary w-32">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {(() => {
                      let runningBalance = 0
                      const data = getLedgerTransactions()
                      return data.map((txn, index) => {
                        runningBalance += (txn.income_amount || 0) - (txn.expense_amount || 0)
                        const isCashExpenseFromLedger = txn.payment_method === '現金' && txn.expense_amount > 0 && txn.deduct_from_petty_cash === false
                        return (
                          <tr key={txn.id} className="hover:bg-bg-secondary/50 cursor-pointer" onClick={() => openEditModal(txn)}>
                            <td className="px-3 py-2 text-text-tertiary font-mono text-xs">
                              {txn.journal_number}
                            </td>
                            <td className="px-3 py-2 text-text-primary whitespace-nowrap">
                              {formatDate(txn.transaction_date)}
                            </td>
                            <td className="px-3 py-2 text-text-primary">
                              <div className="truncate max-w-[200px]" title={txn.transaction_item}>
                                {txn.transaction_item}
                                {isCashExpenseFromLedger && (
                                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-warning/10 text-warning">現金</span>
                                )}
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
                            <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openEditModal(txn)}
                                  className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors"
                                  title="編輯"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => viewAuditLog(txn)}
                                  className="p-1.5 rounded hover:bg-info/10 text-info transition-colors"
                                  title="查看記錄"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => confirmDelete(txn)}
                                  className="p-1.5 rounded hover:bg-error/10 text-error transition-colors"
                                  title="刪除"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                {isCashExpenseFromLedger && (
                                  <button
                                    onClick={() => toggleDeductFromPettyCash(txn.id, false, txn.transaction_item)}
                                    className="p-1.5 rounded hover:bg-warning/10 text-warning transition-colors"
                                    title="移回零用金"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                  </button>
                                )}
                              </div>
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
                      <td></td>
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
                      <th className="px-3 py-2 text-right font-semibold text-text-secondary w-24">餘額</th>
                      <th className="px-3 py-2 text-center font-semibold text-text-secondary w-32">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {(() => {
                      let runningBalance = 0
                      const data = getPettyCashTransactions()
                      return data.map((txn) => {
                        runningBalance += (txn.income_amount || 0) - (txn.expense_amount || 0)
                        return (
                          <tr key={txn.id} className="hover:bg-bg-secondary/50 cursor-pointer" onClick={() => openEditModal(txn)}>
                            <td className="px-3 py-2 text-primary font-mono text-xs">
                              {txn.transaction_code || txn.journal_number}
                            </td>
                            <td className="px-3 py-2 text-text-primary whitespace-nowrap">
                              {formatDate(txn.transaction_date)}
                            </td>
                            <td className="px-3 py-2 text-text-primary">
                              <div className="truncate max-w-[180px]" title={txn.transaction_item}>
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
                            <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openEditModal(txn)}
                                  className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors"
                                  title="編輯"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => viewAuditLog(txn)}
                                  className="p-1.5 rounded hover:bg-info/10 text-info transition-colors"
                                  title="查看記錄"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => confirmDelete(txn)}
                                  className="p-1.5 rounded hover:bg-error/10 text-error transition-colors"
                                  title="刪除"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                {txn.expense_amount > 0 && (
                                  <button
                                    onClick={() => toggleDeductFromPettyCash(txn.id, true, txn.transaction_item)}
                                    className="p-1.5 rounded hover:bg-warning/10 text-warning transition-colors"
                                    title="移至流水帳"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                  </button>
                                )}
                              </div>
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
                      <td></td>
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

      {/* 編輯交易 Modal */}
      {showEditModal && editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-bg-primary rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-bg-primary px-6 py-4 border-b border-border-light flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">編輯交易</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">流水號</label>
                  <input
                    type="text"
                    value={editingTransaction.journal_number}
                    disabled
                    className="input-apple w-full bg-bg-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">交易日期</label>
                  <input
                    type="date"
                    value={editingTransaction.transaction_date}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, transaction_date: e.target.value })}
                    className="input-apple w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">交易項目</label>
                <input
                  type="text"
                  value={editingTransaction.transaction_item}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, transaction_item: e.target.value })}
                  className="input-apple w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">付款方式</label>
                  <select
                    value={editingTransaction.payment_method || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, payment_method: e.target.value })}
                    className="input-apple w-full"
                  >
                    <option value="">請選擇</option>
                    {paymentMethods.map(pm => (
                      <option key={pm.id} value={pm.name}>{pm.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">經手人</label>
                  <select
                    value={editingTransaction.handler || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, handler: e.target.value })}
                    className="input-apple w-full"
                  >
                    <option value="">請選擇</option>
                    {handlers.map(h => (
                      <option key={h.id} value={h.name}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">收入類別</label>
                  <select
                    value={editingTransaction.income_category || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, income_category: e.target.value || null })}
                    className="input-apple w-full"
                  >
                    <option value="">請選擇</option>
                    {incomeCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">收入金額</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingTransaction.income_amount || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, income_amount: parseFloat(e.target.value) || 0 })}
                    className="input-apple w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">支出類別</label>
                  <select
                    value={editingTransaction.expense_category || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, expense_category: e.target.value || null })}
                    className="input-apple w-full"
                  >
                    <option value="">請選擇</option>
                    {expenseCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">支出金額</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingTransaction.expense_amount || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, expense_amount: parseFloat(e.target.value) || 0 })}
                    className="input-apple w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">申請報銷</label>
                  <select
                    value={editingTransaction.reimbursement_status || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, reimbursement_status: e.target.value || null })}
                    className="input-apple w-full"
                  >
                    <option value="">請選擇</option>
                    {reimbursementStatuses.map(status => (
                      <option key={status.id} value={status.name}>{status.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  {editingTransaction.payment_method === '現金' && editingTransaction.expense_amount > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg w-full">
                      <input
                        type="checkbox"
                        id="deduct_from_petty_cash"
                        checked={editingTransaction.deduct_from_petty_cash !== false}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, deduct_from_petty_cash: e.target.checked })}
                        className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
                      />
                      <label htmlFor="deduct_from_petty_cash" className="text-xs text-warning">
                        從零用金扣除
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">備註</label>
                <textarea
                  value={editingTransaction.notes || ''}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, notes: e.target.value })}
                  className="input-apple w-full h-20 resize-none"
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-bg-primary px-6 py-4 border-t border-border-light flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-lg border border-border-light text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveTransaction}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? '儲存中...' : '儲存變更'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除確認 Modal */}
      {showDeleteConfirm && transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-bg-primary rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">確定刪除？</h3>
              <p className="text-sm text-text-secondary mb-4">
                即將刪除交易「{transactionToDelete.transaction_item}」
              </p>
              <p className="text-xs text-text-tertiary mb-6">
                流水號：{transactionToDelete.journal_number}<br/>
                此操作將被記錄，可由管理員還原
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setTransactionToDelete(null)
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-border-light text-text-secondary hover:bg-bg-secondary transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={deleteTransaction}
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-error text-white hover:bg-error/90 transition-colors disabled:opacity-50"
                >
                  {saving ? '刪除中...' : '確定刪除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 審計日誌 Modal */}
      {showAuditLog && selectedTransactionForLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-bg-primary rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-bg-primary px-6 py-4 border-b border-border-light flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">修改記錄</h2>
                <p className="text-xs text-text-tertiary">
                  流水號：{selectedTransactionForLog.journal_number}
                </p>
              </div>
              <button
                onClick={() => setShowAuditLog(false)}
                className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>暫無修改記錄</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => {
                    const actionInfo = formatActionType(log.action_type)
                    return (
                      <div key={log.id} className="border border-border-light rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-sm font-semibold ${actionInfo.color}`}>
                            {actionInfo.text}
                          </span>
                          <span className="text-xs text-text-tertiary">
                            {new Date(log.performed_at).toLocaleString('zh-HK')}
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary mb-2">
                          操作者：{log.performed_by}
                        </div>
                        {log.changed_fields && log.changed_fields.length > 0 && (
                          <div className="space-y-2">
                            {log.changed_fields.map((field) => (
                              <div key={field} className="bg-bg-secondary rounded p-2 text-xs">
                                <span className="font-medium text-text-primary">{formatFieldName(field)}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-error line-through">
                                    {log.old_values?.[field]?.toString() || '(空)'}
                                  </span>
                                  <span className="text-text-quaternary">→</span>
                                  <span className="text-success">
                                    {log.new_values?.[field]?.toString() || '(空)'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
