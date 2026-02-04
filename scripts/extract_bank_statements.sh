#!/bin/bash
# Extract bank statement data from all PDFs

echo "=== Bank Statement Summary ==="
echo ""

# Savings Account (002113176)
echo "=== Savings Account (002113176) ==="
for month in 04 05 06 07 08 09 10 11 12; do
  file="/Users/joecheung/Documents/GitHub/mingcare-intranet/bank statement/002113176/002113176_5304482_USD_${month}2025.pdf"
  if [ -f "$file" ]; then
    echo ""
    echo "--- ${month}/2025 ---"
    pdftotext -layout "$file" - 2>/dev/null | grep -E "(承上結餘|戶口結餘|Closing Balance|總額)" | grep -E "[0-9]+\.[0-9]{2}" | head -5
  fi
done

echo ""
echo ""

# Current Account (002520252)
echo "=== Current Account (002520252) ==="
for month in 04 05 06 07 08 09 10 11 12; do
  file="/Users/joecheung/Documents/GitHub/mingcare-intranet/bank statement/002520252/002520252_5304482_HKD_${month}2025.pdf"
  if [ -f "$file" ]; then
    echo ""
    echo "--- ${month}/2025 ---"
    pdftotext -layout "$file" - 2>/dev/null | grep -E "(承上結餘|戶口結餘|Closing Balance|總額)" | grep -E "[0-9]+\.[0-9]{2}" | head -3
  fi
done
