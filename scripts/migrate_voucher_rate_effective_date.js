const { Client } = require('pg')

async function main() {
  const c = new Client({
    connectionString: 'postgresql://postgres.cvkxlvdicympakfecgvv:Stw1856aSSS@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  })
  await c.connect()
  console.log('Connected!')

  // Step 1: Add effective_date column (DATE, default '2024-01-01')
  console.log('\n--- Step 1: Add effective_date column ---')
  await c.query(`
    ALTER TABLE voucher_rate 
    ADD COLUMN IF NOT EXISTS effective_date DATE NOT NULL DEFAULT '2024-01-01'
  `)
  console.log('effective_date column added')

  // Step 2: Drop unique constraint on service_type (allow multiple rows per type)
  console.log('\n--- Step 2: Drop unique constraint on service_type ---')
  // Find and drop the constraint
  const { rows: constraints } = await c.query(`
    SELECT constraint_name FROM information_schema.table_constraints 
    WHERE table_name = 'voucher_rate' AND constraint_type = 'UNIQUE'
  `)
  for (const con of constraints) {
    await c.query(`ALTER TABLE voucher_rate DROP CONSTRAINT IF EXISTS "${con.constraint_name}"`)
    console.log(`  Dropped constraint: ${con.constraint_name}`)
  }
  // Also drop any unique index (except primary key)
  const { rows: indexes } = await c.query(`
    SELECT indexname FROM pg_indexes 
    WHERE tablename = 'voucher_rate' AND indexdef LIKE '%UNIQUE%' AND indexname != 'voucher_rate_pkey'
  `)
  for (const idx of indexes) {
    await c.query(`DROP INDEX IF EXISTS "${idx.indexname}"`)
    console.log(`  Dropped index: ${idx.indexname}`)
  }

  // Step 3: Set existing rows' effective_date to '2024-01-01' (old rates)
  console.log('\n--- Step 3: Set existing rows effective_date ---')
  await c.query(`UPDATE voucher_rate SET effective_date = '2024-01-01'`)
  console.log('All existing rows set to effective_date = 2024-01-01')

  // Add new unique constraint on (service_type, effective_date) pair
  await c.query(`
    ALTER TABLE voucher_rate 
    ADD CONSTRAINT voucher_rate_service_type_effective_date_key 
    UNIQUE (service_type, effective_date)
  `)
  console.log('Added unique constraint on (service_type, effective_date)')

  // Step 4: Insert new rows for April 2026 prices
  console.log('\n--- Step 4: Insert April 2026 rate rows ---')
  const newRates = [
    { type: 'RT-復康運動(專業⼈員)', rate: 997 },
    { type: 'NC-護理服務(專業⼈員)', rate: 959 },
    { type: 'RA-復康運動(輔助⼈員)', rate: 252 },
    { type: 'RT-復康運動(OTA輔助⼈員)', rate: 252 },
    { type: 'PC-到⼾看顧(輔助⼈員)', rate: 252 },
    { type: 'NA-護理服務（輔助人員）', rate: 252 },
    { type: 'HC-家居服務', rate: 152 },
    { type: 'ES-護送服務(陪診)', rate: 152 },
    { type: 'NA-護理服務(輔助人員)', rate: 150 },
    { type: 'FD-送飯服務', rate: 63 },
  ]

  for (const r of newRates) {
    await c.query(
      `INSERT INTO voucher_rate (service_type, service_rate, effective_date) VALUES ($1, $2, '2026-04-01')`,
      [r.type, r.rate]
    )
    console.log(`  Inserted: ${r.type} = $${r.rate} (effective 2026-04-01)`)
  }

  // Step 5: Drop the service_rate_new column (no longer needed)
  console.log('\n--- Step 4: Drop service_rate_new column ---')
  await c.query(`ALTER TABLE voucher_rate DROP COLUMN IF EXISTS service_rate_new`)
  console.log('service_rate_new column dropped')

  // Step 6: Show final result
  console.log('\n=== Final voucher_rate table ===')
  const { rows } = await c.query(`
    SELECT service_type, service_rate, effective_date 
    FROM voucher_rate 
    ORDER BY service_type, effective_date
  `)
  console.log('Service Type | Rate | Effective Date')
  console.log('-------------|------|---------------')
  rows.forEach(r => {
    console.log(`${r.service_type}: $${r.service_rate} | ${r.effective_date.toISOString().split('T')[0]}`)
  })

  await c.end()
  console.log('\nDone!')
}

main().catch(e => { console.error(e.message); process.exit(1) })
