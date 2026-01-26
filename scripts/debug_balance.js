const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
)

async function debugBalance() {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true })

  if (error) {
    console.error('Error:', error)
    return
  }

  // Filter petty cash transactions
  const pettyCashTxns = data.filter(t => 
    (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
    t.expense_category === 'Petty Cash'
  )

  console.log('Total petty cash transactions:', pettyCashTxns.length)

  // Calculate monthly balance
  const monthlyBalance = {}
  let runningBalance = 0

  pettyCashTxns.forEach(t => {
    const txnMonth = t.transaction_date.substring(0, 7)
    const isReplenishment = t.expense_category === 'Petty Cash'
    const isAdjustment = t.income_category === '期初調整' || (t.transaction_code && t.transaction_code.startsWith('ADJ-'))
    
    let change = 0
    if (isReplenishment) {
      change = t.expense_amount || 0
    } else if (isAdjustment) {
      change = t.income_amount || 0
    } else {
      change = (t.income_amount || 0) - (t.expense_amount || 0)
    }
    
    runningBalance += change
    monthlyBalance[txnMonth] = runningBalance
  })

  console.log('\nMonthly closing balances:')
  const sortedMonths = Object.keys(monthlyBalance).sort()
  sortedMonths.forEach(m => {
    console.log(m + ': $' + monthlyBalance[m].toFixed(2))
  })

  console.log('\nFinal balance: $' + runningBalance.toFixed(2))
}

debugBalance()
