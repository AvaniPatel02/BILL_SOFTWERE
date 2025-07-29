# Balance Sheet Unsettled Entries Functionality

## Overview

This enhancement modifies the balance sheet calculation to include unsettled entries from previous years in the current year's balance sheet. This ensures that all outstanding amounts are properly tracked and displayed regardless of when they were originally created. **Fully settled entries (amount = 0) are automatically discarded from the balance sheet data.**

## Key Features

### 1. Unsettled Invoice Tracking
- **Tax invoices** from previous years that are not fully settled appear in the current year's balance sheet
- Unsettled amounts are calculated as: `Invoice Amount - All Payments/Settlements`
- Only invoices with outstanding balances (≠ 0) are carried forward
- **Fully settled invoices (amount = 0) are automatically removed from the balance sheet**

### 2. Comprehensive Unsettled Entry Tracking
- **All balance sheet categories** are checked for unsettled amounts
- Entries with credit/debit calculations ≠ 0 are carried forward to the current year
- **Entries with zero amounts are automatically discarded**
- Categories include:
  - Capital (Partners)
  - Loans (Credit/Debit)
  - Unsecure Loans (Credit/Debit)
  - Fixed Assets (Credit/Debit)
  - Salary
  - Sundry Debtors/Creditors
  - Custom Transaction Types

### 3. Automatic Settlement Calculation & Zero-Amount Filtering
- The system automatically calculates net amounts for each entity
- Positive amounts become "Debtors" (money owed to you)
- Negative amounts become "Creditors" (money you owe)
- **Only non-zero amounts are included in the balance sheet**
- **Fully settled entries (amount = 0) are completely removed**

## Technical Implementation

### Zero-Amount Filtering Logic

The system uses a consistent threshold of `0.0001` to determine if an amount is effectively zero:

```python
# Filter out zero amounts (fully settled entries)
capital = [item for item in capital if abs(item['amount']) > 0.0001]

# Only include entries with non-zero amounts (not fully settled)
if abs(total) > 0.0001:
    sundry_dict[key] = total
```

This filtering is applied to **all balance sheet categories**:
- Capital entries
- Loan entries (credit/debit)
- Unsecure loan entries (credit/debit)
- Fixed assets entries (credit/debit)
- Salary entries
- Sundry debtors/creditors
- Custom transaction types

### New Method: `get_unsettled_entries()`

This method calculates all unsettled entries from before the current financial year:

```python
def get_unsettled_entries(self, current_fy_start):
    """
    Calculate unsettled entries from all previous years up to current financial year start
    Returns unsettled amounts for each category
    """
```

### Modified Balance Sheet Calculation

The main balance sheet calculation now:

1. **Gets current year data** (normal operation)
2. **Gets unsettled entries** from previous years
3. **Combines both** to show complete picture
4. **Calculates net amounts** for each entity
5. **Filters out zero amounts** (fully settled entries)

### Affected Views

1. **`BalanceSheetView.get()`** - Main balance sheet display
2. **`BalanceSheetSnapshotView.post()`** - Balance sheet snapshot creation

## Example Scenarios

### Scenario 1: Unsettled Invoice from Previous Year

**Previous Year (2023-2024):**
- Invoice: ABC Company - ₹50,000 (Feb 2024)
- No payments received

**Current Year (2024-2025):**
- Partial payment: ABC Company - ₹30,000 (May 2024)
- Balance sheet shows: ABC Company as Debtor - ₹20,000

### Scenario 2: Multiple Settlements

**Previous Year (2023-2024):**
- Invoice: XYZ Corp - ₹100,000 (Mar 2024)
- Buyer payment: XYZ Corp - ₹40,000 (Mar 2024)

**Current Year (2024-2025):**
- Company bill: XYZ Corp - ₹30,000 (June 2024)
- Balance sheet shows: XYZ Corp as Debtor - ₹30,000

### Scenario 3: Fully Settled Entry (Discarded)

**Previous Year (2023-2024):**
- Invoice: DEF Ltd - ₹25,000 (Jan 2024)
- Buyer payment: DEF Ltd - ₹25,000 (Jan 2024)

**Current Year (2024-2025):**
- Balance sheet: DEF Ltd does **NOT** appear (fully settled, automatically discarded)

### Scenario 4: Near-Zero Amount (Discarded)

**Previous Year (2023-2024):**
- Invoice: GHI Corp - ₹10,000 (Mar 2024)
- Buyer payment: GHI Corp - ₹9,999.99 (Mar 2024)

**Current Year (2024-2025):**
- Balance sheet: GHI Corp does **NOT** appear (amount < 0.0001, considered fully settled)

## API Usage

### Get Balance Sheet with Unsettled Entries

```bash
GET /api/balance-sheet/?financial_year=2024-2025
```

**Response includes:**
- Current year transactions
- Unsettled amounts from previous years
- Net calculations for each entity
- **Only non-zero amounts (fully settled entries excluded)**

### Create Balance Sheet Snapshot

```bash
POST /api/balance-sheet-snapshot/
{
    "financial_year": "2024-2025"
}
```

**Response includes:**
- Snapshot with unsettled entries included
- **Zero amounts filtered out**
- Saved to database for future reference

## Data Structure

### Unsettled Entries Structure

```python
unsettled_data = {
    'capital': [],                    # Partner capital entries
    'loan_credit': [],               # Loan credit entries
    'loan_debit': [],                # Loan debit entries
    'unsecure_loan_credit': [],      # Unsecure loan credit entries
    'unsecure_loan_debit': [],       # Unsecure loan debit entries
    'fixed_assets_credit': {},       # Fixed assets credit amounts
    'fixed_assets_debit': {},        # Fixed assets debit amounts
    'salary': {},                    # Salary amounts
    'sundry_debtors_creditors': [],  # Sundry debtors/creditors
    'custom_types_credit': {},       # Custom transaction types credit
    'custom_types_debit': {},        # Custom transaction types debit
}
```

### Balance Sheet Response Structure

```json
{
    "financial_year": "2024-2025",
    "data": {
        "capital": [...],                    // Only non-zero amounts
        "loan_credit": [...],               // Only non-zero amounts
        "loan_debit": [...],                // Only non-zero amounts
        "unsecure_loan_credit": [...],      // Only non-zero amounts
        "unsecure_loan_debit": [...],       // Only non-zero amounts
        "fixed_assets_credit": [...],       // Only non-zero amounts
        "fixed_assets_debit": [...],        // Only non-zero amounts
        "salary": [...],                    // Only non-zero amounts
        "salary_total": 0.0,
        "sundry_debtors_creditors": [       // Only non-zero amounts
            {
                "name": "Company Name",
                "amount": 1000.0,
                "type": "Debtor"  // or "Creditor"
            }
        ],
        "custom_types_credit": {...},       // Only non-zero amounts
        "custom_types_debit": {...}         // Only non-zero amounts
    }
}
```

## Benefits

1. **Complete Financial Picture**: Shows all outstanding amounts regardless of creation date
2. **Accurate Reporting**: Ensures no unsettled amounts are missed in financial reports
3. **Clean Data**: Automatically removes fully settled entries (no clutter)
4. **Better Decision Making**: Provides clear view of receivables and payables
5. **Compliance**: Helps maintain accurate financial records for tax and audit purposes
6. **User-Friendly**: Automatically handles complex settlement calculations and cleanup

## Testing

A test script `test_balancesheet_unsettled.py` is provided to verify the functionality:

```bash
python test_balancesheet_unsettled.py
```

The test creates sample data and verifies that:
- Unsettled amounts are correctly calculated and included in the balance sheet
- **Fully settled entries are properly discarded from the balance sheet**

### Test Cases Included:
1. **Unsettled Entry Test**: Verifies partial settlements are correctly calculated
2. **Fully Settled Entry Test**: Verifies zero-amount entries are discarded
3. **Near-Zero Amount Test**: Verifies amounts below threshold are discarded

## Migration Notes

- **No database changes required** - uses existing data structure
- **Backward compatible** - existing balance sheet functionality remains unchanged
- **Performance impact minimal** - additional queries only for unsettled entries
- **No user interface changes needed** - works with existing frontend
- **Automatic cleanup** - zero amounts are filtered out automatically

## Future Enhancements

Potential improvements for future versions:

1. **Settlement Tracking**: Add explicit settlement tracking fields
2. **Aging Reports**: Show how long amounts have been outstanding
3. **Interest Calculation**: Calculate interest on overdue amounts
4. **Payment Plans**: Track structured payment arrangements
5. **Automated Reminders**: Send notifications for overdue amounts
6. **Configurable Threshold**: Allow users to set custom zero-amount thresholds

## Support

For questions or issues with this functionality, please refer to:
- The test script for usage examples
- The code comments for technical details
- The API documentation for integration guidance