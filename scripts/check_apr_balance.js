const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
)

async function checkAprBalance() {
  // 期初餘額
  const SAVINGS_OPENING = 82755.59  // 儲蓄戶口 2025-04-01 期初
  const CURRENT_OPENING = 1086.54   // 支票戶口 2025-04-01 期初

  // 查詢4月份所有流水帳交易
  const { data: transactions, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-04-01')
    .lte('transaction_date', '2025-04-30')
    .order('transaction_date', { ascending: true })
    .order('journal_number', { ascending: true })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('='.repeat(80))
  console.log('2025年4月份 銀行戶口餘額對帳')
  console.log('='.repeat(80))

  // ============================================
  // 儲蓄戶口：銀行轉賬、FPS、Payme、支票收入
  // ============================================
  console.log('\n【儲蓄戶口 DBS 002113176】')
  console.log(`期初餘額 (2025-04-01): $${SAVINGS_OPENING.toFixed(2)}`)
  console.log('-'.repeat(80))
  
  let savingsBalance = SAVINGS_OPENING
  let savingsIncome = 0
  let savingsExpense = 0
  let savingsCount = 0

  transactions.forEach(t => {
    const pm = (t.payment_method || '').trim()
    const income = t.income_amount || 0
    const expense = t.expense_amount || 0
    
    // 儲蓄戶口包括：
    // 1. 銀行轉賬（收入和支出）
    // 2. FPS、Payme
    // 3. 支票收入（支票收入入儲蓄戶口）
    // 4. 空白付款方式（非零用金）
    // 5. 現金但不從零用金扣除
    
    let includeInSavings = false
    
    if (pm === '銀行轉賬' || pm === 'FPS' || pm === 'Payme') {
      includeInSavings = true
    } else if (pm === '支票' && income > 0) {
      // 支票收入入儲蓄戶口
      includeInSavings = true
    } else if (!pm && t.expense_category !== 'Petty Cash' && t.deduct_from_petty_cash !== true) {
      includeInSavings = true
    } else if (pm === '現金' && t.deduct_from_petty_cash === false) {
      includeInSavings = true
    }
    
    if (includeInSavings) {
      savingsBalance += income - expense
      savingsIncome += income
      savingsExpense += expense
      savingsCount++
      console.log(`${t.transaction_date} | ${t.journal_number} | ${(pm || '空白').padEnd(6)} | +${income.toFixed(2).padStart(10)} -${expense.toFixed(2).padStart(10)} | ${t.transaction_item.substring(0, 35)}`)
    }
  })

  console.log('-'.repeat(80))
  console.log(`交易筆數: ${savingsCount}`)
  console.log(`總收入: $${savingsIncome.toFixed(2)}`)
  console.log(`總支出: $${savingsExpense.toFixed(2)}`)
  console.log(`期末餘額 (2025-04-30): $${savingsBalance.toFixed(2)}`)

  // ============================================
  // 支票戶口：支票支出 + 支票收入（內部轉帳）
  // ============================================
  console.log('\n' + '='.repeat(80))
  console.log('\n【支票戶口 DBS 002520252】')
  console.log(`期初餘額 (2025-04-01): $${CURRENT_OPENING.toFixed(2)}`)
  console.log('-'.repeat(80))

  let currentBalance = CURRENT_OPENING
  let currentIncome = 0
  let currentExpense = 0
  let currentCount = 0

  transactions.forEach(t => {
    const pm = (t.payment_method || '').trim()
    const income = t.income_amount || 0
    const expense = t.expense_amount || 0
    
    // 支票戶口包括：支票支出 和 支票收入（內部轉帳）
    if (pm === '支票') {
      currentBalance += income - expense
      currentIncome += income
      currentExpense += expense
      currentCount++
      if (income > 0) {
        console.log(`${t.transaction_date} | ${t.journal_number} | +${income.toFixed(2).padStart(10)} | ${t.transaction_item.substring(0, 40)}`)
      } else {
        console.log(`${t.transaction_date} | ${t.journal_number} | -${expense.toFixed(2).padStart(10)} | ${t.transaction_item.substring(0, 40)}`)
      }
    }
  })

  console.log('-'.repeat(80))
  console.log(`交易筆數: ${currentCount}`)
  console.log(`總收入: $${currentIncome.toFixed(2)}`)
  console.log(`總支出: $${currentExpense.toFixed(2)}`)
  console.log(`期末餘額 (2025-04-30): $${currentBalance.toFixed(2)}`)

  console.log('\n' + '='.repeat(80))
  console.log('【摘要】')
  console.log('='.repeat(80))
  console.log(`儲蓄戶口 期末餘額: $${savingsBalance.toFixed(2)}`)
  console.log(`支票戶口 期末餘額: $${currentBalance.toFixed(2)}`)
  console.log(`兩戶口合計: $${(savingsBalance + currentBalance).toFixed(2)}`)
}

checkAprBalance()
