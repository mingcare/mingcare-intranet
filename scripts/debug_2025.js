const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://cvkxlvdicympakfecgvv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI'
)

async function debug2025() {
  // Get 2025 transactions only (like the app does)
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', '2025-01-01')
    .lte('transaction_date', '2025-12-31')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('transaction_date', { ascending: true })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('2025 total transactions:', data.length)

  // Filter petty cash - this is what the app shows
  const pettyCashTxns = data.filter(t => {
    const isSystemAdj = t.income_category === '期初調整' || (t.transaction_code && t.transaction_code.startsWith('ADJ-'))
    return !isSystemAdj && (
      (t.payment_method === '現金' && t.deduct_from_petty_cash !== false) ||
      t.expense_category === 'Petty Cash'
    )
  })

  console.log('2025 petty cash transactions (displayed):', pettyCashTxns.length)

  // Calculate stats (without opening balance)
  let totalIn = 0
  let totalOut = 0

  pettyCashTxns.forEach(t => {
    const isReplenishment = t.expense_category === 'Petty Cash'
    if (isReplenishment) {
      totalIn += t.expense_amount || 0
    } else {
      totalIn += t.income_amount || 0
      totalOut += t.expense_amount || 0
    }
  })

  console.log('\n2025 stats (without opening balance):')
  console.log('Total In:', totalIn.toFixed(2))
  console.log('Total Out:', totalOut.toFixed(2))
  console.log('Net:', (totalIn - totalOut).toFixed(2))

  // Opening balance should be Dec 2024 closing = $136,098.83
  const openingBalance = 136098.83
  console.log('\nWith opening balance ($136,098.83):')
  console.log('Balance:', (openingBalance + totalIn - totalOut).toFixed(2))

  // Check first few transactions
  console.log('\nFirst 5 petty cash transactions in 2025:')
  pettyCashTxns.slice(0, 5).forEach(t => {
    console.log(`${t.transaction_date} | ${t.transaction_item} | In: ${t.income_amount || 0} | Out: ${t.expense_amount || 0}`)
  })
}

debug2025()
