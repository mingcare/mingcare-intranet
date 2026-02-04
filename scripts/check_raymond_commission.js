const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cvkxlvdicympakfecgvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3hsdmRpY3ltcGFrZmVjZ3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyOTE4MSwiZXhwIjoyMDY3MDA1MTgxfQ.ZAix35wqh5s7ZIC_L1sDQorpDarTzYo9PWRAsiBAaXI');

async function check() {
  // 查找 raymond 介紹的客戶
  const { data: customers } = await supabase
    .from('customer_personal_data')
    .select('customer_id, customer_name, introducer')
    .eq('introducer', 'raymond');
  
  console.log('raymond 介紹的客戶:', customers?.length, '個');
  const customerIds = customers?.map(c => c.customer_id) || [];
  
  if (customerIds.length === 0) {
    console.log('沒有找到 raymond 客戶');
    return;
  }
  
  // 查詢這些客戶在 2026年1月的服務記錄
  const { data: records } = await supabase
    .from('billing_salary_data')
    .select('customer_id, customer_name, service_date, service_hours, service_type, project_category')
    .in('customer_id', customerIds)
    .gte('service_date', '2026-01-01')
    .lte('service_date', '2026-01-31');
  
  console.log('\n2026年1月 raymond客戶服務記錄:', records?.length, '筆');
  
  // 計算佣金
  const getRate = (st) => {
    if (!st) return 0;
    if (st.includes('NC') || st.includes('護理')) return 945;
    if (st.includes('RT') && st.includes('專業')) return 982;
    if (st.includes('RT') || st.includes('復康') || st.includes('OTA') || st.includes('RA')) return 248;
    if (st.includes('PC') || st.includes('看顧')) return 248;
    if (st.includes('HC') || st.includes('家居')) return 150;
    if (st.includes('ES') || st.includes('護送') || st.includes('陪診')) return 150;
    return 0;
  };
  
  let totalCommission = 0;
  records?.forEach(r => {
    if (!r.project_category?.includes('MC街客')) {
      const rate = getRate(r.service_type || '');
      const hours = r.service_hours || 0;
      const voucherTotal = hours * rate;
      const commission = Math.round(voucherTotal * 15 / 100 * 100) / 100;
      totalCommission += commission;
      if (commission > 0) {
        console.log(r.customer_name, r.service_type, hours + 'h', 'rate:' + rate, '佣金:' + commission);
      }
    }
  });
  
  console.log('\nraymond 客戶 2026年1月佣金總額: HK$' + totalCommission.toFixed(2));
}
check();
