# Customer Step 3 to Step 4 Progression - 500 Error Fix

## Problem Description

After implementing the step progression fix, customers were encountering a **500 Internal Server Error** when trying to complete step 3 and progress to step 4. The error message was:

```
Failed to save step progression to database: 500
```

## Root Cause Analysis

### The Issue
The 500 error was caused by a **database constraint violation**. Specifically, the error was:

```
"Column 'company_name' cannot be null"
```

### Why This Happened
The problem occurred because:

1. **API Endpoint Design**: The `/api/registrations/[id]` PUT endpoint was designed to update ALL fields in the database
2. **Minimal Data Sent**: When customers completed step 3, only minimal data was sent:
   ```javascript
   {
     currentStep: 'incorporate',
     status: 'incorporation-processing',
     documentsAcknowledged: true
   }
   ```
3. **Missing Required Fields**: The API endpoint tried to set all other fields to `null`, including `company_name` which has a NOT NULL constraint
4. **Database Constraint Violation**: MySQL rejected the update due to the null constraint

### Code That Caused the Problem
```javascript
// In CompanyRegistrationFlow.tsx
const response = await fetch(`/api/registrations/${companyId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    currentStep: nextStep,
    status: status,
    documentsAcknowledged: true,
    ...stepData
  })
});
```

## Solution Implemented

### Key Changes Made

1. **Include Existing Company Data**: Modified the API call to include all existing company data to avoid null values
2. **Enhanced Error Handling**: Added detailed error logging to the API endpoint
3. **Database Schema Support**: Added `documents_acknowledged` field support to the API endpoint

### Code Changes

**Before (Causing 500 Error):**
```javascript
const response = await fetch(`/api/registrations/${companyId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    currentStep: nextStep,
    status: status,
    documentsAcknowledged: true,
    ...stepData
  })
});
```

**After (Fixed):**
```javascript
// Get current company data to avoid null values
const currentData = await loadLatestCompanyData();

// Include existing company data to avoid null values
const updateData = {
  ...currentData, // Include all existing data
  currentStep: nextStep,
  status: status,
  documentsAcknowledged: true,
  ...stepData
};

console.log('📤 Sending update data to API:', {
  currentStep: updateData.currentStep,
  status: updateData.status,
  documentsAcknowledged: updateData.documentsAcknowledged
});

const response = await fetch(`/api/registrations/${companyId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});
```

### API Endpoint Changes

**Added `documents_acknowledged` field support:**
```sql
-- In the UPDATE query
documents_approved = ?, documents_published = ?, documents_acknowledged = ?, payment_receipt = ?
```

**Added parameter handling:**
```javascript
body.documentsApproved || false,
body.documentsPublished || false,
body.documentsAcknowledged || false,  // Added this line
body.paymentReceipt ? JSON.stringify(body.paymentReceipt) : null,
```

**Enhanced error logging:**
```javascript
return NextResponse.json({ 
  error: 'Failed to update registration',
  details: error.message,
  code: error.code
}, { status: 500 });
```

## Testing Verification

### Test Scripts Created
1. **`scripts/test-step-progression-api-debug.js`**: Identified the root cause
2. **`scripts/test-simple-step-progression.js`**: Confirmed the null constraint issue
3. **`scripts/test-step-progression-with-full-data.js`**: Verified the fix

### Test Results

**Before Fix:**
```
📥 API Response status: 500
📥 API Response statusText: Internal Server Error
❌ API call failed: {"error":"Failed to update registration","details":"Column 'company_name' cannot be null","code":"ER_BAD_NULL_ERROR"}
```

**After Fix:**
```
📥 API Response status: 200
📥 API Response statusText: OK
✅ API call successful: { success: true }
✅ The 500 error issue has been resolved!
```

## Data Flow After Fix

### Step 3 Completion Flow
1. **Customer submits documents** → `onComplete` called
2. **`handleStepComplete` triggered** → Gets current company data
3. **Full update data prepared** → Includes existing data + new step data
4. **API call made** → All required fields included
5. **Database updated successfully** → No constraint violations
6. **Customer redirected to step 4** → Permanent access granted

### API Request Structure
```javascript
{
  // Existing company data (prevents null values)
  companyName: "Acme Inc",
  contactPersonName: "John Doe",
  contactPersonEmail: "john@acme.com",
  // ... all other existing fields
  
  // New step progression data
  currentStep: "incorporate",
  status: "incorporation-processing",
  documentsAcknowledged: true,
  
  // Additional step data
  customerDocuments: { ... }
}
```

## Database Schema Requirements

### Required Columns
- `company_name` (VARCHAR, NOT NULL): Company name
- `current_step` (VARCHAR): Current step ("contact-details", "company-details", "documentation", "incorporate")
- `status` (VARCHAR): Registration status
- `documents_acknowledged` (BOOLEAN): Documents acknowledgment status

### Example Database State After Fix
```sql
UPDATE registrations 
SET current_step = 'incorporate',
    status = 'incorporation-processing',
    documents_acknowledged = 1,
    updated_at = NOW()
WHERE id = 'company_id';
-- All other fields remain unchanged (no null values)
```

## Benefits Achieved

1. **No More 500 Errors**: API calls now succeed without constraint violations
2. **Data Integrity**: Existing company data is preserved during step progression
3. **Reliable Step Progression**: Customers can successfully complete step 3 and access step 4
4. **Better Error Handling**: Detailed error messages for debugging
5. **Database Consistency**: All required fields are properly maintained

## Files Modified

1. **`components/customer/CompanyRegistrationFlow.tsx`**
   - Fixed API call to include existing company data
   - Added proper data preparation before API call

2. **`app/api/registrations/[id]/route.ts`**
   - Added `documents_acknowledged` field support
   - Enhanced error logging and response details

3. **Test Scripts** (3 new files)
   - Comprehensive testing for the fix

## Usage

### For Customers
- Complete step 3 by uploading all required documents
- Click "Submit" button
- No more 500 errors
- Automatically redirected to step 4
- Page refresh maintains step 4 access

### For Developers
- API calls now include full company data
- No more null constraint violations
- Detailed error logging for debugging
- Reliable step progression

## Verification

To verify the fix is working:

1. **Complete step 3**: Upload documents and submit
2. **Check for errors**: Should see no 500 errors in console
3. **Verify step 4 access**: Should be redirected to step 4
4. **Refresh page**: Should remain on step 4
5. **Check database**: `current_step` should be "incorporate" and `documents_acknowledged` should be `true`

## Conclusion

The 500 error issue in customer step 3 to step 4 progression has been **completely resolved**. The root cause was a database constraint violation due to null values being sent to required fields. The solution ensures that all existing company data is included in API calls, preventing null constraint violations while maintaining data integrity.

Customers can now successfully complete step 3 and progress to step 4 without encountering 500 errors, and the step progression is properly persisted in the database.
