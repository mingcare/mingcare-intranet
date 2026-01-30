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
  sort_order?: number
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

const DISPLAY_START_DATE = '2025-04-01'
const DISPLAY_START_MONTH = '2025-04'
const LEDGER_OPENING_BALANCE = 82755.59

const isOnOrAfter = (dateStr: string, cutoff: string) => dateStr >= cutoff

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
  const [isCreating, setIsCreating] = useState(false)  // 標記是新增還是編輯
  const [billingYear, setBillingYear] = useState<number>(new Date().getFullYear())
  const [billingMonthNum, setBillingMonthNum] = useState<number>(new Date().getMonth() + 1)
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | null>(null)  // 收入或支出類型
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null)
  const [currentUser, setCurrentUser] = useState<string>('')
  const [saving, setSaving] = useState(false)
  
  // 批量新增相關狀態
  const [pendingTransactions, setPendingTransactions] = useState<Array<{
    tempId: string
    journalNumber: string
    billingYear: number
    billingMonthNum: number
    transactionType: 'income' | 'expense'
    data: FinancialTransaction
  }>>([])
  const [editingPendingIndex, setEditingPendingIndex] = useState<number | null>(null)  // 正在編輯的待提交項目索引
  const [nextTempJournalNumber, setNextTempJournalNumber] = useState<string>('')  // 下一個流水號
  
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

  // 可用年份列表 - 獨立從數據庫獲取
  const [availableYears, setAvailableYears] = useState<number[]>([2025, 2026])
  
  // 零用金歷史累計餘額（用於計算上月結餘）
  const [pettyCashHistoricalBalance, setPettyCashHistoricalBalance] = useState<Record<string, number>>({})

  // 交易項目自動完成
  const [transactionItemSuggestions, setTransactionItemSuggestions] = useState<Array<{ item: string; billingMonth: string }>>([])
  const [showItemSuggestions, setShowItemSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<Array<{ item: string; billingMonth: string }>>([])

  useEffect(() => {
    checkUser()
    fetchCategories()
    fetchAvailableYears()
    fetchPettyCashHistoricalBalance()
    fetchTransactionItemSuggestions()
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

  // 獲取所有可用年份（從交易日期提取）
  const fetchAvailableYears = async () => {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('transaction_date')
      .or('is_deleted.is.null,is_deleted.eq.false')
    
    if (data && !error) {
      // 從 transaction_date 提取年份
      const yearsFromDb = data.map((t: { transaction_date: string }) => {
        const date = new Date(t.transaction_date)
        return date.getFullYear()
      })
      // 確保至少有 2025, 2026 年，並隱藏 2025-04-01 之前的年份
      const defaultYears = [2025, 2026]
      const allYears: number[] = Array.from(new Set([...yearsFromDb, ...defaultYears]))
        .filter(year => year >= 2025)
        .sort((a, b) => b - a)
      setAvailableYears(allYears)
    }
  }

  // 獲取零用金歷史累計餘額（按月份計算）
  const fetchPettyCashHistoricalBalance = async () => {
    // 獲取所有現金交易
    let allData: FinancialTransaction[] = []
    let offset = 0
    const pageSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('transaction_date', { ascending: true })
        .range(offset, offset + pageSize - 1)

      if (error) {
        console.error('Error fetching historical balance:', error)
        return
      }

      if (data) {
        allData = [...allData, ...data]
      }

      if (!data || data.length < pageSize) {
        break
      }
      offset += pageSize
    }

    // 篩選零用金相關交易（2025-04-01 之後）
    const pettyCashTxns = allData.filter(t => 
      isOnOrAfter(t.transaction_date, DISPLAY_START_DATE) &&
      (
        (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
        t.expense_category === 'Petty Cash' ||
        t.income_category === '期初調整' ||
        t.expense_category === '期初調整'
      )
    )

    // 按月份計算累計餘額
    const monthlyBalance: Record<string, number> = {}
    let runningBalance = 0

    pettyCashTxns.forEach(t => {
      const txnMonth = t.transaction_date.substring(0, 7) // YYYY-MM
      const isReplenishment = t.expense_category === 'Petty Cash'
      const isAdjustment = t.income_category === '期初調整' || t.expense_category === '期初調整' || t.transaction_code?.startsWith('ADJ-')
      
      if (isReplenishment) {
        runningBalance += (t.expense_amount || 0)
      } else if (isAdjustment) {
        // 調整記錄：收入增加餘額，支出減少餘額
        runningBalance += (t.income_amount || 0) - (t.expense_amount || 0)
      } else {
        runningBalance += (t.income_amount || 0) - (t.expense_amount || 0)
      }
      
      monthlyBalance[txnMonth] = runningBalance
    })

    setPettyCashHistoricalBalance(monthlyBalance)
  }

  // 獲取歷史交易項目（用於自動完成）
  const fetchTransactionItemSuggestions = async () => {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('transaction_item, billing_month')
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('created_at', { ascending: false })
    
    if (data && !error) {
      // 保留每個項目及其最近的帳單月份，並按出現頻率排序
      const itemMap: Record<string, { count: number; billingMonth: string }> = {}
      data.forEach((t: { transaction_item: string; billing_month: string }) => {
        const item = t.transaction_item?.trim()
        if (item) {
          if (!itemMap[item]) {
            itemMap[item] = { count: 1, billingMonth: t.billing_month || '' }
          } else {
            itemMap[item].count += 1
          }
        }
      })
      
      // 按頻率排序
      const sortedItems = Object.entries(itemMap)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([item, info]) => ({ item, billingMonth: info.billingMonth }))
      
      setTransactionItemSuggestions(sortedItems)
    }
  }

  // 處理交易項目輸入變化
  const handleTransactionItemChange = (value: string) => {
    setEditingTransaction({ ...editingTransaction!, transaction_item: value })
    
    if (value.trim().length > 0) {
      // 過濾匹配的建議
      const filtered = transactionItemSuggestions.filter(suggestion =>
        suggestion.item.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10)  // 最多顯示 10 個
      setFilteredSuggestions(filtered)
      setShowItemSuggestions(filtered.length > 0)
    } else {
      setShowItemSuggestions(false)
    }
  }

  // 選擇建議項目
  const selectSuggestion = (item: string) => {
    setEditingTransaction({ ...editingTransaction!, transaction_item: item })
    setShowItemSuggestions(false)
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
    // 使用 transaction_date (交易日期) 來過濾年份，而非 fiscal_year
    let allData: FinancialTransaction[] = []
    let offset = 0
    const pageSize = 1000

    // 計算該年份的日期範圍
    const startDate = `${selectedYear}-01-01`
    const endDate = `${selectedYear}-12-31`

    while (true) {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', startDate)  // 交易日期 >= 年初
        .lte('transaction_date', endDate)    // 交易日期 <= 年末
        .or('is_deleted.is.null,is_deleted.eq.false')  // 只顯示未刪除的
        .order('transaction_date', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('journal_number', { ascending: true })
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

  // 篩選流水帳交易：
  // 1. 銀行轉賬（所有，包括 Petty Cash 補充）
  // 2. 付款方式為空的記錄（顯示在流水帳以免遺漏）
  // 3. 現金交易（僅不從零用金扣除的支出）
  const getLedgerTransactions = () => {
    let filtered = transactions.filter(t => {
      const paymentMethod = (t.payment_method || '').trim()
      const isCashPayment = paymentMethod === '現金'

      return (
        paymentMethod === '銀行轉賬' ||
        !paymentMethod || // 付款方式為空的顯示在流水帳
        (isCashPayment && t.deduct_from_petty_cash === false)
      )
    }).filter(t => isOnOrAfter(t.transaction_date, DISPLAY_START_DATE))

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(t => getMonthFromDate(t.transaction_date) === selectedMonth)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.transaction_item.toLowerCase().includes(term) ||
        t.transaction_code?.toLowerCase().includes(term) ||
        t.journal_number?.toLowerCase().includes(term) ||
        t.income_category?.toLowerCase().includes(term) ||
        t.expense_category?.toLowerCase().includes(term)
      )
    }

    return filtered
  }

  // 判斷是否為零用金補充交易（expense_category = 'Petty Cash'）
  const isPettyCashReplenishment = (t: FinancialTransaction) => {
    return t.expense_category === 'Petty Cash'
  }

  // 判斷是否為系統調整交易（不在表格中顯示，但計入餘額）
  const isSystemAdjustment = (t: FinancialTransaction) => {
    return t.income_category === '期初調整' || t.expense_category === '期初調整' || t.transaction_code?.startsWith('ADJ-')
  }

  // 篩選零用金交易：
  // 1. 現金交易（支出默認從零用金扣除，除非明確設為 false）
  // 2. expense_category = 'Petty Cash'（當作補充顯示）
  // 注意：系統調整交易不在列表顯示，但計入餘額計算
  const getPettyCashTransactions = () => {
    let filtered = transactions.filter(t => {
      const paymentMethod = (t.payment_method || '').trim()
      const isCashOrMissing = paymentMethod === '現金' || !paymentMethod

      return (
        // 排除系統調整（不在表格顯示）
        !isSystemAdjustment(t) &&
        (
          // Petty Cash 補充交易
          isPettyCashReplenishment(t) ||
          // 現金/未填付款方式且從零用金扣除
          (isCashOrMissing && t.deduct_from_petty_cash !== false)
        )
      )
    }).filter(t => isOnOrAfter(t.transaction_date, DISPLAY_START_DATE))

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(t => getMonthFromDate(t.transaction_date) === selectedMonth)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.transaction_item.toLowerCase().includes(term) ||
        t.transaction_code?.toLowerCase().includes(term) ||
        t.journal_number?.toLowerCase().includes(term) ||
        t.income_category?.toLowerCase().includes(term) ||
        t.expense_category?.toLowerCase().includes(term)
      )
    }

    return filtered
  }

  // 計算零用金期初餘額（使用歷史累計數據）
  const getPettyCashOpeningBalance = () => {
    // 如果選擇「全部月份」，則計算該年度之前的累計餘額
    if (selectedMonth === 'all') {
      // 找到選擇年份的前一年12月的餘額
      const prevYear = selectedYear - 1
      const prevYearEndKey = `${prevYear}-12`
      
      const sortedMonths = Object.keys(pettyCashHistoricalBalance).sort()
      let openingBalance = 0
      
      for (const m of sortedMonths) {
        if (m <= prevYearEndKey) {
          openingBalance = pettyCashHistoricalBalance[m]
        } else {
          break
        }
      }
      
      return openingBalance
    }
    
    // 找到選擇月份的上一個月
    const [year, month] = selectedMonth.split('-').map(Number)
    let prevYear = year
    let prevMonth = month - 1
    
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear -= 1
    }
    
    const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
    
    // 從歷史累計餘額中獲取上月結餘
    // 需要找到 <= prevMonthKey 的最近一個月的餘額
    const sortedMonths = Object.keys(pettyCashHistoricalBalance).sort()
    let openingBalance = 0
    
    for (const m of sortedMonths) {
      if (m <= prevMonthKey) {
        openingBalance = pettyCashHistoricalBalance[m]
      } else {
        break
      }
    }
    
    return openingBalance
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
    return months.filter(month => month >= DISPLAY_START_MONTH).sort()
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

  // 零用金統計：補充(收入 + 零用金補充交易) - 支出 = 餘額
  // 包含上月結餘
  const getPettyCashStats = () => {
    const data = getPettyCashTransactions()
    const openingBalance = getPettyCashOpeningBalance()
    
    // 補充 = 現金收入 + 零用金補充交易的支出金額（銀行轉賬到零用金）
    const totalIn = data.reduce((sum, t) => {
      if (isPettyCashReplenishment(t)) {
        return sum + (t.expense_amount || 0)  // 零用金補充：銀行支出 = 零用金收入
      }
      return sum + (t.income_amount || 0)  // 現金收入
    }, 0)
    // 支出 = 現金支出（排除零用金補充交易）
    const totalOut = data.reduce((sum, t) => {
      if (isPettyCashReplenishment(t)) {
        return sum  // 零用金補充不算支出
      }
      return sum + (t.expense_amount || 0)
    }, 0)
    return { 
      totalIn, 
      totalOut, 
      openingBalance,
      balance: openingBalance + totalIn - totalOut, 
      count: data.length 
    }
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
    setIsCreating(false)
    
    // 從現有的 billing_month 解析年份和月份
    if (txn.billing_month) {
      const match = txn.billing_month.match(/(\d{4})年(\d{1,2})月/)
      if (match) {
        setBillingYear(parseInt(match[1]))
        setBillingMonthNum(parseInt(match[2]))
      }
    } else {
      // 如果沒有 billing_month，使用當前年月
      setBillingYear(new Date().getFullYear())
      setBillingMonthNum(new Date().getMonth() + 1)
    }
    
    // 根據現有數據設定交易類型
    if (txn.income_amount && txn.income_amount > 0) {
      setTransactionType('income')
    } else if (txn.expense_amount && txn.expense_amount > 0) {
      setTransactionType('expense')
    } else {
      setTransactionType(null)
    }
    
    setShowEditModal(true)
  }

  // 獲取下一個流水號
  const getNextJournalNumber = async () => {
    // 從 global_journal_sequence 表獲取
    const { data: seqData, error: seqError } = await supabase
      .from('global_journal_sequence')
      .select('last_number')
      .eq('id', 1)
      .single()

    if (!seqError && seqData) {
      const nextNumber = seqData.last_number + 1
      return nextNumber.toString().padStart(8, '0')
    }

    // 備用方案：從 financial_transactions 找最大的數字流水號
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('journal_number')

    if (error || !data || data.length === 0) {
      return '00000001'
    }

    // 只考慮純數字的 journal_number
    const numericOnly = data.filter((r: { journal_number: string }) => /^\d+$/.test(r.journal_number))
    if (numericOnly.length === 0) {
      return '00000001'
    }

    const maxNumber = Math.max(...numericOnly.map((r: { journal_number: string }) => parseInt(r.journal_number, 10)))
    const nextNumber = maxNumber + 1
    return nextNumber.toString().padStart(8, '0')
  }

  // 開啟新增 Modal
  const openCreateModal = async () => {
    const nextJournalNumber = await getNextJournalNumber()
    const today = new Date().toISOString().split('T')[0]
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    setBillingYear(currentYear)
    setBillingMonthNum(currentMonth)
    setTransactionType(null)  // 重置交易類型
    setPendingTransactions([])  // 清空待提交清單
    setEditingPendingIndex(null)
    setNextTempJournalNumber(nextJournalNumber)
    
    setEditingTransaction({
      id: '',
      journal_number: nextJournalNumber,
      transaction_code: '',
      fiscal_year: currentYear,
      billing_month: `${currentYear}年${currentMonth}月`,
      transaction_date: today,
      transaction_item: '',
      payment_method: '',
      income_category: null,
      income_amount: 0,
      expense_category: null,
      expense_amount: 0,
      handler: null,
      reimbursement_status: null,
      notes: null,
      deduct_from_petty_cash: true
    })
    setIsCreating(true)
    setShowEditModal(true)
  }

  // 驗證當前表單
  const validateCurrentForm = (): boolean => {
    if (!editingTransaction) return false
    
    if (!editingTransaction.transaction_item.trim()) {
      alert('請輸入交易項目')
      return false
    }
    if (!editingTransaction.transaction_date) {
      alert('請選擇交易日期')
      return false
    }
    if (!editingTransaction.payment_method) {
      alert('請選擇付款方式')
      return false
    }
    if (!transactionType) {
      alert('請選擇交易類型（收入或支出）')
      return false
    }
    if (transactionType === 'income' && (!editingTransaction.income_category || editingTransaction.income_amount === 0)) {
      alert('請選擇收入類別並輸入收入金額')
      return false
    }
    if (transactionType === 'expense' && (!editingTransaction.expense_category || editingTransaction.expense_amount === 0)) {
      alert('請選擇支出類別並輸入支出金額')
      return false
    }
    return true
  }

  // 加入待提交清單
  const addToPendingList = () => {
    if (!validateCurrentForm() || !editingTransaction || !transactionType) return
    
    const today = new Date().toISOString().split('T')[0]
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    if (editingPendingIndex !== null) {
      // 更新已有的待提交項目
      const updatedList = [...pendingTransactions]
      updatedList[editingPendingIndex] = {
        tempId: pendingTransactions[editingPendingIndex].tempId,
        journalNumber: editingTransaction.journal_number,
        billingYear,
        billingMonthNum,
        transactionType,
        data: { ...editingTransaction }
      }
      setPendingTransactions(updatedList)
      setEditingPendingIndex(null)
    } else {
      // 新增到待提交清單
      setPendingTransactions([...pendingTransactions, {
        tempId: Date.now().toString(),
        journalNumber: editingTransaction.journal_number,
        billingYear,
        billingMonthNum,
        transactionType,
        data: { ...editingTransaction }
      }])
      
      // 計算下一個流水號
      const nextNum = parseInt(editingTransaction.journal_number, 10) + 1
      const nextJournalNumber = nextNum.toString().padStart(8, '0')
      setNextTempJournalNumber(nextJournalNumber)
    }
    
    // 重置表單準備輸入下一筆
    setBillingYear(currentYear)
    setBillingMonthNum(currentMonth)
    setTransactionType(null)
    
    const nextNum = editingPendingIndex !== null 
      ? parseInt(nextTempJournalNumber, 10)
      : parseInt(editingTransaction.journal_number, 10) + 1
    const nextJournalNumber = nextNum.toString().padStart(8, '0')
    
    setEditingTransaction({
      id: '',
      journal_number: nextJournalNumber,
      transaction_code: '',
      fiscal_year: currentYear,
      billing_month: `${currentYear}年${currentMonth}月`,
      transaction_date: today,
      transaction_item: '',
      payment_method: '',
      income_category: null,
      income_amount: 0,
      expense_category: null,
      expense_amount: 0,
      handler: null,
      reimbursement_status: null,
      notes: null,
      deduct_from_petty_cash: true
    })
  }

  // 編輯待提交項目
  const editPendingItem = (index: number) => {
    const item = pendingTransactions[index]
    setEditingTransaction({ ...item.data })
    setBillingYear(item.billingYear)
    setBillingMonthNum(item.billingMonthNum)
    setTransactionType(item.transactionType)
    setEditingPendingIndex(index)
  }

  // 刪除待提交項目
  const deletePendingItem = (index: number) => {
    const updatedList = pendingTransactions.filter((_, i) => i !== index)
    setPendingTransactions(updatedList)
    if (editingPendingIndex === index) {
      setEditingPendingIndex(null)
    } else if (editingPendingIndex !== null && editingPendingIndex > index) {
      setEditingPendingIndex(editingPendingIndex - 1)
    }
  }

  // 批量提交所有帳目
  const submitAllTransactions = async () => {
    // 建立要提交的交易清單（從現有 pendingTransactions 開始）
    let allTransactions = [...pendingTransactions]
    
    // 檢查當前表單是否有實質內容（不只是自動填入的流水號和日期）
    const hasSubstantialContent = editingTransaction && 
      editingTransaction.transaction_item.trim() && 
      (transactionType || editingTransaction.payment_method)
    
    // 如果當前表單有填寫實質內容，先加入到提交清單
    if (hasSubstantialContent) {
      if (!validateCurrentForm()) return
      
      // 直接構建新項目並加入（不依賴 state 更新）
      const newItem = {
        tempId: Date.now().toString(),
        journalNumber: editingTransaction.journal_number,
        billingYear,
        billingMonthNum,
        transactionType: transactionType!,
        data: { ...editingTransaction }
      }
      allTransactions = [...allTransactions, newItem]
    }
    
    // 如果清單有項目，直接提交（不需要檢查當前空白表單）
    if (allTransactions.length === 0) {
      alert('請至少新增一筆帳目')
      return
    }
    
    setSaving(true)
    
    try {
      // 準備批量插入的數據
      const insertData = allTransactions.map(item => ({
        journal_number: item.journalNumber,
        transaction_code: '',
        fiscal_year: item.billingYear,
        billing_month: `${item.billingYear}年${item.billingMonthNum}月`,
        transaction_date: item.data.transaction_date,
        transaction_item: item.data.transaction_item,
        payment_method: item.data.payment_method,
        income_category: item.data.income_category,
        income_amount: item.data.income_amount || 0,
        expense_category: item.data.expense_category,
        expense_amount: item.data.expense_amount || 0,
        handler: item.data.handler,
        reimbursement_status: item.data.reimbursement_status,
        notes: item.data.notes,
        deduct_from_petty_cash: item.data.payment_method === '現金' ? item.data.deduct_from_petty_cash : null,
        created_by: currentUser,
        is_deleted: false
      }))
      
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(insertData)
        .select()
      
      if (error) {
        console.error('Error creating:', error)
        alert('新增失敗: ' + error.message)
        setSaving(false)
        return
      }
      
      // 更新 global_journal_sequence 表的 last_number
      const maxJournalNumber = Math.max(...allTransactions.map(item => parseInt(item.journalNumber, 10)))
      await supabase
        .from('global_journal_sequence')
        .update({ last_number: maxJournalNumber })
        .eq('id', 1)
      
      // 批量記錄審計日誌
      if (data && data.length > 0) {
        const auditLogs = data.map((txn: any) => ({
          transaction_id: txn.id,
          journal_number: txn.journal_number,
          action_type: 'create',
          changed_fields: ['all'],
          old_values: {},
          new_values: txn,
          performed_by: currentUser
        }))
        
        await supabase.from('financial_audit_log').insert(auditLogs)
      }
      
      setShowEditModal(false)
      setIsCreating(false)
      setSaving(false)
      setPendingTransactions([])
      setEditingPendingIndex(null)
      fetchTransactions()
      fetchPettyCashHistoricalBalance()
      alert(`成功新增 ${allTransactions.length} 筆帳目！`)
    } catch (err) {
      console.error('Error:', err)
      alert('新增失敗')
      setSaving(false)
    }
  }

  // 新增單筆交易（保留原有功能，用於直接提交當前表單）
  const createTransaction = async () => {
    if (!editingTransaction) return
    
    // 如果有待提交清單，使用批量提交（批量提交會自行處理驗證）
    if (pendingTransactions.length > 0) {
      await submitAllTransactions()
      return
    }
    
    // 只有單筆提交時才驗證當前表單
    if (!validateCurrentForm()) return
    
    setSaving(true)
    
    // 使用選擇的 billingYear 和 billingMonthNum
    const billingMonth = `${billingYear}年${billingMonthNum}月`
    
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert({
        journal_number: editingTransaction.journal_number,
        transaction_code: '',
        fiscal_year: billingYear,
        billing_month: billingMonth,
        transaction_date: editingTransaction.transaction_date,
        transaction_item: editingTransaction.transaction_item,
        payment_method: editingTransaction.payment_method,
        income_category: editingTransaction.income_category,
        income_amount: editingTransaction.income_amount || 0,
        expense_category: editingTransaction.expense_category,
        expense_amount: editingTransaction.expense_amount || 0,
        handler: editingTransaction.handler,
        reimbursement_status: editingTransaction.reimbursement_status,
        notes: editingTransaction.notes,
        deduct_from_petty_cash: editingTransaction.payment_method === '現金' ? editingTransaction.deduct_from_petty_cash : null,
        created_by: currentUser,
        is_deleted: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating:', error)
      alert('新增失敗: ' + error.message)
      setSaving(false)
      return
    }

    // 記錄審計日誌
    await supabase.from('financial_audit_log').insert({
      transaction_id: data.id,
      journal_number: editingTransaction.journal_number,
      action_type: 'create',
      changed_fields: ['all'],
      old_values: {},
      new_values: data,
      performed_by: currentUser
    })

    setShowEditModal(false)
    setIsCreating(false)
    setSaving(false)
    setPendingTransactions([])
    fetchTransactions()
    fetchPettyCashHistoricalBalance()
    alert('新增成功！')
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
    
    // 計算新的 billing_month 和 fiscal_year
    const newBillingMonth = `${billingYear}年${billingMonthNum}月`
    const newFiscalYear = billingYear
    
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
    
    // 檢查 billing_month 是否有變更
    if (originalTxn.billing_month !== newBillingMonth) {
      changedFields.push('billing_month')
      oldValues['billing_month'] = originalTxn.billing_month
      newValues['billing_month'] = newBillingMonth
    }
    
    // 檢查 fiscal_year 是否有變更
    if (originalTxn.fiscal_year !== newFiscalYear) {
      changedFields.push('fiscal_year')
      oldValues['fiscal_year'] = originalTxn.fiscal_year
      newValues['fiscal_year'] = newFiscalYear
    }

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
        billing_month: newBillingMonth,
        fiscal_year: newFiscalYear,
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

  // 移動交易順序（上移/下移）
  const moveTransaction = async (txn: FinancialTransaction, direction: 'up' | 'down', transactionList: FinancialTransaction[]) => {
    // 找出同一天的所有交易
    const sameDayTxns = transactionList.filter(t => t.transaction_date === txn.transaction_date)
    const currentIndex = sameDayTxns.findIndex(t => t.id === txn.id)
    
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === sameDayTxns.length - 1) return

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const swapTxn = sameDayTxns[swapIndex]

    // 使用索引位置作為 sort_order（確保不同值）
    const newCurrentSortOrder = swapIndex  // 當前項目移到對方位置
    const newSwapSortOrder = currentIndex  // 對方移到當前位置

    console.log('Moving:', txn.transaction_item, 'from', currentIndex, 'to', swapIndex)
    console.log('Swapping with:', swapTxn.transaction_item)

    // 更新數據庫
    const { error: error1 } = await supabase
      .from('financial_transactions')
      .update({ sort_order: newCurrentSortOrder })
      .eq('id', txn.id)

    const { error: error2 } = await supabase
      .from('financial_transactions')
      .update({ sort_order: newSwapSortOrder })
      .eq('id', swapTxn.id)

    if (error1 || error2) {
      console.error('Error updating sort order:', error1 || error2)
      alert('排序更新失敗')
      return
    }

    // 重新獲取數據
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
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">新增帳目</span>
            </button>
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
                  {availableYears.map(year => (
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
                  placeholder="搜尋交易項目、編號、收入/支出類別..."
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
          <div className={`grid grid-cols-2 gap-4 ${selectedMonth !== 'all' && pettyCashStats.openingBalance !== 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
            {selectedMonth !== 'all' && pettyCashStats.openingBalance !== 0 && (
              <div className="card-apple bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
                <div className="card-apple-content text-center">
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">上月結餘</p>
                  <p className={`text-xl font-bold ${pettyCashStats.openingBalance >= 0 ? 'text-purple-700 dark:text-purple-300' : 'text-orange-700 dark:text-orange-300'}`}>{formatCurrency(pettyCashStats.openingBalance)}</p>
                </div>
              </div>
            )}
            <div className="card-apple bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <div className="card-apple-content text-center">
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">交易筆數</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pettyCashStats.count}</p>
              </div>
            </div>
            <div className="card-apple bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="card-apple-content text-center">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">{selectedMonth === 'all' ? '總補充' : '本月補充'}</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(pettyCashStats.totalIn)}</p>
              </div>
            </div>
            <div className="card-apple bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
              <div className="card-apple-content text-center">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">{selectedMonth === 'all' ? '總支出' : '本月支出'}</p>
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
                      <th className="px-3 py-2 text-center font-semibold text-text-secondary min-w-[180px]">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {(() => {
                      const ledgerOpeningBalance = (selectedMonth === 'all' || selectedMonth >= DISPLAY_START_MONTH)
                        ? LEDGER_OPENING_BALANCE
                        : 0
                      let runningBalance = ledgerOpeningBalance
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
                      <th className="px-3 py-2 text-center font-semibold text-text-secondary min-w-[180px]">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {(() => {
                      // 餘額從上月結餘開始計算
                      let runningBalance = getPettyCashOpeningBalance()
                      const data = getPettyCashTransactions()
                      return data.map((txn, index) => {
                        // 計算餘額：零用金補充交易的 expense_amount 算作補充（加），其他算支出（減）
                        const isReplenishment = isPettyCashReplenishment(txn)
                        if (isReplenishment) {
                          runningBalance += (txn.expense_amount || 0)  // 補充：加
                        } else {
                          runningBalance += (txn.income_amount || 0) - (txn.expense_amount || 0)
                        }
                        // 判斷同一天是否有多筆交易（用於顯示排序按鈕）
                        const sameDayTxns = data.filter(t => t.transaction_date === txn.transaction_date)
                        const sameDayIndex = sameDayTxns.findIndex(t => t.id === txn.id)
                        const isFirstOfDay = sameDayIndex === 0
                        const isLastOfDay = sameDayIndex === sameDayTxns.length - 1
                        const canMoveUp = sameDayTxns.length > 1 && !isFirstOfDay
                        const canMoveDown = sameDayTxns.length > 1 && !isLastOfDay
                        return (
                          <tr key={txn.id} className={`hover:bg-bg-secondary/50 cursor-pointer ${isReplenishment ? 'bg-green-50 dark:bg-green-900/10' : ''}`} onClick={() => openEditModal(txn)}>
                            <td className="px-3 py-2 text-primary font-mono text-xs">
                              {txn.transaction_code || txn.journal_number}
                            </td>
                            <td className="px-3 py-2 text-text-primary whitespace-nowrap">
                              {formatDate(txn.transaction_date)}
                            </td>
                            <td className="px-3 py-2 text-text-primary">
                              <div className="truncate max-w-[180px]" title={txn.transaction_item}>
                                {txn.transaction_item}
                                {isReplenishment && (
                                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-success/10 text-success">補充</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-text-secondary text-xs">
                              {txn.income_category || txn.expense_category || '-'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-success">
                              {/* 補充欄：現金收入 或 零用金補充的支出金額 */}
                              {isReplenishment 
                                ? (txn.expense_amount > 0 ? formatCurrency(txn.expense_amount) : '')
                                : (txn.income_amount > 0 ? formatCurrency(txn.income_amount) : '')
                              }
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-error">
                              {/* 支出欄：非補充交易的支出 */}
                              {!isReplenishment && txn.expense_amount > 0 ? formatCurrency(txn.expense_amount) : ''}
                            </td>
                            <td className={`px-3 py-2 text-right font-mono font-bold ${runningBalance >= 0 ? 'text-success' : 'text-error'}`}>
                              {formatCurrency(runningBalance)}
                            </td>
                            <td className="px-1 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1">
                                {/* 排序按鈕組 - 始終顯示，禁用時弱化 */}
                                <button
                                  onClick={() => canMoveUp && moveTransaction(txn, 'up', data)}
                                  className={`p-0.5 rounded transition-colors ${canMoveUp ? 'hover:bg-purple-500/10 text-purple-500' : 'text-purple-300 cursor-not-allowed'}`}
                                  title="上移"
                                  disabled={!canMoveUp}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => canMoveDown && moveTransaction(txn, 'down', data)}
                                  className={`p-0.5 rounded transition-colors ${canMoveDown ? 'hover:bg-purple-500/10 text-purple-500' : 'text-purple-300 cursor-not-allowed'}`}
                                  title="下移"
                                  disabled={!canMoveDown}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => openEditModal(txn)}
                                  className="p-0.5 rounded hover:bg-primary/10 text-primary transition-colors"
                                  title="編輯"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => viewAuditLog(txn)}
                                  className="p-0.5 rounded hover:bg-info/10 text-info transition-colors"
                                  title="查看記錄"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => confirmDelete(txn)}
                                  className="p-0.5 rounded hover:bg-error/10 text-error transition-colors"
                                  title="刪除"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                {/* 現金交易可移至流水帳（零用金補充交易不顯示此按鈕） */}
                                {!isReplenishment && (
                                <button
                                  onClick={() => toggleDeductFromPettyCash(txn.id, true, txn.transaction_item)}
                                  className="p-0.5 rounded hover:bg-warning/10 text-warning transition-colors"
                                  title="移至流水帳"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* 編輯/新增交易 Modal */}
      {showEditModal && editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-bg-primary rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-bg-primary px-6 py-4 border-b border-border-light flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">{isCreating ? '新增帳目' : '編輯交易'}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              
              {/* 第一行：流水號 + 日期 + 帳單所屬月份 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-tertiary mb-1">流水號</label>
                  <div className="text-sm font-mono text-text-primary bg-bg-secondary px-3 py-2 rounded-lg">
                    {editingTransaction.journal_number}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-tertiary mb-1">交易日期 <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={editingTransaction.transaction_date}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, transaction_date: e.target.value })}
                    className="input-apple w-full text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-tertiary mb-1">帳單所屬月份 <span className="text-red-500">*</span></label>
                  <div className="flex gap-1">
                    <select
                      value={billingYear}
                      onChange={(e) => setBillingYear(Number(e.target.value))}
                      className="input-apple flex-1 text-sm"
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select
                      value={billingMonthNum}
                      onChange={(e) => setBillingMonthNum(Number(e.target.value))}
                      className="input-apple w-16 text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{month}月</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 交易項目 */}
              <div className="relative">
                <label className="block text-xs font-medium text-text-tertiary mb-1">交易項目 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingTransaction.transaction_item}
                  onChange={(e) => handleTransactionItemChange(e.target.value)}
                  onFocus={() => {
                    if (editingTransaction.transaction_item.trim().length > 0) {
                      const filtered = transactionItemSuggestions.filter(suggestion =>
                        suggestion.item.toLowerCase().includes(editingTransaction.transaction_item.toLowerCase())
                      ).slice(0, 10)
                      setFilteredSuggestions(filtered)
                      setShowItemSuggestions(filtered.length > 0)
                    }
                  }}
                  onBlur={() => {
                    // 延遲關閉以允許點擊選擇
                    setTimeout(() => setShowItemSuggestions(false), 200)
                  }}
                  className="input-apple w-full"
                  placeholder="輸入關鍵字搜尋歷史項目..."
                  autoComplete="off"
                />
                {/* 自動完成下拉選單 */}
                {showItemSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          selectSuggestion(suggestion.item)
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-text-tertiary">🔍</span>
                          <span className="text-text-primary">{suggestion.item}</span>
                        </div>
                        {suggestion.billingMonth && (
                          <span className="text-xs text-text-tertiary bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {suggestion.billingMonth}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 付款方式 + 經手人 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-tertiary mb-1">付款方式 <span className="text-red-500">*</span></label>
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
                  <label className="block text-xs font-medium text-text-tertiary mb-1">經手人</label>
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

              {/* 交易類型選擇 - 更醒目的設計 */}
              <div>
                <label className="block text-xs font-medium text-text-tertiary mb-2">交易類型 <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionType('income')
                      setEditingTransaction({
                        ...editingTransaction,
                        expense_category: null,
                        expense_amount: 0
                      })
                    }}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      transactionType === 'income'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                    }`}
                  >
                    <span className="text-2xl">💰</span>
                    <span className={`font-semibold ${transactionType === 'income' ? 'text-green-600 dark:text-green-400' : 'text-text-secondary'}`}>收入</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionType('expense')
                      setEditingTransaction({
                        ...editingTransaction,
                        income_category: null,
                        income_amount: 0
                      })
                    }}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      transactionType === 'expense'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'
                    }`}
                  >
                    <span className="text-2xl">💸</span>
                    <span className={`font-semibold ${transactionType === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-text-secondary'}`}>支出</span>
                  </button>
                </div>
              </div>

              {/* 收入詳情 */}
              {transactionType === 'income' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <span>💰</span>
                    <span className="font-medium">收入詳情</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-green-600 dark:text-green-400 mb-1">類別 <span className="text-red-500">*</span></label>
                      <select
                        value={editingTransaction.income_category || ''}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, income_category: e.target.value || null })}
                        className="input-apple w-full bg-white dark:bg-gray-800"
                      >
                        <option value="">請選擇類別</option>
                        {incomeCategories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-green-600 dark:text-green-400 mb-1">金額 <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingTransaction.income_amount || ''}
                          onChange={(e) => setEditingTransaction({ ...editingTransaction, income_amount: parseFloat(e.target.value) || 0 })}
                          className="input-apple w-full pl-7 bg-white dark:bg-gray-800"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 支出詳情 */}
              {transactionType === 'expense' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 space-y-3">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <span>💸</span>
                    <span className="font-medium">支出詳情</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-red-600 dark:text-red-400 mb-1">類別 <span className="text-red-500">*</span></label>
                      <select
                        value={editingTransaction.expense_category || ''}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, expense_category: e.target.value || null })}
                        className="input-apple w-full bg-white dark:bg-gray-800"
                      >
                        <option value="">請選擇類別</option>
                        {expenseCategories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-red-600 dark:text-red-400 mb-1">金額 <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingTransaction.expense_amount || ''}
                          onChange={(e) => setEditingTransaction({ ...editingTransaction, expense_amount: parseFloat(e.target.value) || 0 })}
                          className="input-apple w-full pl-7 bg-white dark:bg-gray-800"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  {/* 零用金選項 */}
                  {editingTransaction.payment_method === '現金' && (
                    <label className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTransaction.deduct_from_petty_cash !== false}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, deduct_from_petty_cash: e.target.checked })}
                        className="w-4 h-4 rounded border-amber-300 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-xs text-amber-700 dark:text-amber-300">從零用金扣除</span>
                    </label>
                  )}
                </div>
              )}

              {/* 其他選項 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-tertiary mb-1">申請報銷</label>
                  <select
                    value={editingTransaction.reimbursement_status || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, reimbursement_status: e.target.value || null })}
                    className="input-apple w-full"
                  >
                    <option value="">無</option>
                    {reimbursementStatuses.map(status => (
                      <option key={status.id} value={status.name}>{status.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-tertiary mb-1">備註</label>
                  <input
                    type="text"
                    value={editingTransaction.notes || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, notes: e.target.value })}
                    className="input-apple w-full"
                    placeholder="選填"
                  />
                </div>
              </div>

              {/* 新增：加入清單按鈕（僅新增模式） */}
              {isCreating && (
                <button
                  type="button"
                  onClick={addToPendingList}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <span className="text-lg">➕</span>
                  {editingPendingIndex !== null ? '更新此帳目' : '加入清單並繼續新增'}
                </button>
              )}

              {/* 待提交帳目清單（僅新增模式） */}
              {isCreating && pendingTransactions.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <span>📋</span>
                      待提交帳目
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingTransactions.length}</span>
                    </h4>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pendingTransactions.map((item, index) => (
                      <div 
                        key={item.tempId} 
                        className={`p-3 bg-white dark:bg-gray-800 rounded-lg border ${
                          editingPendingIndex === index 
                            ? 'border-primary ring-2 ring-primary/30' 
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-text-tertiary">{item.journalNumber}</span>
                              <span className="text-xs text-text-tertiary">{item.data.transaction_date}</span>
                              <span className="text-xs text-text-tertiary">{item.billingYear}年{item.billingMonthNum}月</span>
                            </div>
                            <p className="text-sm font-medium text-text-primary truncate">{item.data.transaction_item}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {item.transactionType === 'income' ? (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  +${item.data.income_amount?.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                  -${item.data.expense_amount?.toLocaleString()}
                                </span>
                              )}
                              <span className="text-xs text-text-tertiary">{item.data.payment_method}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => editPendingItem(index)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                              title="修改"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePendingItem(index)}
                              className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                              title="刪除"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 底部按鈕 */}
            <div className="sticky bottom-0 bg-bg-primary px-6 py-4 border-t border-border-light flex justify-end gap-3">
              <button
                onClick={() => { 
                  setShowEditModal(false)
                  setIsCreating(false)
                  setPendingTransactions([])
                  setEditingPendingIndex(null)
                }}
                className="px-5 py-2.5 rounded-xl border border-border-light text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                取消
              </button>
              {isCreating ? (
                <button
                  onClick={createTransaction}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium"
                >
                  {saving ? '處理中...' : pendingTransactions.length > 0 ? `提交全部 (${pendingTransactions.length + (editingTransaction?.transaction_item?.trim() ? 1 : 0)})` : '新增'}
                </button>
              ) : (
                <button
                  onClick={saveTransaction}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium"
                >
                  {saving ? '處理中...' : '儲存'}
                </button>
              )}
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
