# Admin Form 18 Upload Fix

## Problem Description
In the admin step3 document management section, when administrators uploaded Form 18 documents, they were not being properly saved to the MySQL database. The issue was that Form 18 documents should be stored as an array (one document per director), but the database saving logic was treating them as a single document object.

## Issues Identified

1. **Incorrect Database Structure**: Form 18 documents were being saved as a single object instead of an array
2. **Data Loss**: Multiple Form 18 uploads would overwrite each other instead of being stored as separate documents
3. **Inconsistent State**: Local state was updated correctly (as an array) but database was saved incorrectly (as a single object)
4. **Missing Director Association**: Each Form 18 document should be associated with a specific director

## Root Cause Analysis

The issue was in the `handleDocumentUpload` function in `components/admin/CompanyDetailsPage.tsx`. When saving to the database, the code was using:

```javascript
body: JSON.stringify({
  ...selectedCompany,
  [documentType]: document,  // This was wrong for Form 18
  updatedAt: new Date().toISOString()
})
```

For Form 18 documents, `documentType` would be "form18", so this would create:
```javascript
{
  ...selectedCompany,
  form18: document,  // Single document object instead of array
  updatedAt: new Date().toISOString()
}
```

But Form 18 should be an array of documents, one for each director.

## Solution Implemented

Fixed the database saving logic to properly handle Form 18 documents as an array while maintaining single document handling for other document types.

### Changes Made

**Before:**
```javascript
// Save to MySQL database immediately
const response = await fetch(`/api/registrations/${companyId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    ...selectedCompany,
    [documentType]: document,
    updatedAt: new Date().toISOString()
  })
});
```

**After:**
```javascript
// Save to MySQL database immediately
const updateData = {
  ...selectedCompany,
  updated_at: new Date().toISOString()
};

// Handle Form 18 as an array, other documents as single objects
if (documentType === "form18" && typeof index === "number") {
  const currentForm18 = selectedCompany.form18 || [];
  const updatedForm18 = [...currentForm18];
  updatedForm18[index] = document;
  updateData.form18 = updatedForm18;
} else {
  updateData[documentType] = document;
}

const response = await fetch(`/api/registrations/${companyId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});
```

## Key Changes Made

### 1. **Proper Array Handling for Form 18**
- **Before**: Form 18 was saved as a single document object
- **After**: Form 18 is saved as an array with documents at specific indices
- **Result**: Each director's Form 18 document is properly stored and accessible

### 2. **Database Field Name Correction**
- **Before**: Used `updatedAt` (camelCase)
- **After**: Used `updated_at` (snake_case)
- **Result**: Matches the actual database column name

### 3. **Index-Based Array Updates**
- **Before**: Overwrote the entire Form 18 field
- **After**: Updates specific index in the Form 18 array
- **Result**: Multiple Form 18 uploads don't overwrite each other

## Data Structure

### Before (Incorrect):
```json
{
  "form18": {
    "name": "form18_director_1.pdf",
    "type": "application/pdf",
    "size": 1024000,
    "url": "/uploads/documents/form18_1.pdf",
    "filePath": "documents/form18_1.pdf",
    "id": "form18_1",
    "uploadedAt": "2025-08-07T16:49:16.660Z"
  }
}
```

### After (Correct):
```json
{
  "form18": [
    {
      "name": "form18_director_1.pdf",
      "type": "application/pdf",
      "size": 1024000,
      "url": "/uploads/documents/form18_1.pdf",
      "filePath": "documents/form18_1.pdf",
      "id": "form18_1",
      "uploadedAt": "2025-08-07T16:49:16.660Z"
    },
    {
      "name": "form18_director_2.pdf",
      "type": "application/pdf",
      "size": 1025000,
      "url": "/uploads/documents/form18_2.pdf",
      "filePath": "documents/form18_2.pdf",
      "id": "form18_2",
      "uploadedAt": "2025-08-07T16:49:17.660Z"
    }
  ]
}
```

## Benefits Achieved

1. **Proper Data Storage**: Form 18 documents are now stored as an array in the database
2. **No Data Loss**: Multiple Form 18 uploads are preserved instead of overwriting each other
3. **Director Association**: Each Form 18 document is properly associated with its director
4. **Consistent State**: Local state and database state are now consistent
5. **Scalability**: Supports any number of directors with their respective Form 18 documents

## Testing

### Test Scripts Created:
1. **`scripts/test-admin-form18-upload.js`**: Basic Form 18 upload test
2. **`scripts/test-admin-form18-full-flow.js`**: Comprehensive upload flow test

### Test Results:
```
✅ Form 18 upload flow test completed successfully!
📊 Summary: 1 Form 18 documents saved for 1 directors
✅ Array structure is correct
✅ All directors have Form 18 documents
```

## Files Modified

1. **`components/admin/CompanyDetailsPage.tsx`**
   - Fixed `handleDocumentUpload` function
   - Added proper Form 18 array handling
   - Corrected database field name from `updatedAt` to `updated_at`

2. **`scripts/test-admin-form18-upload.js`** (new)
   - Basic Form 18 upload verification test

3. **`scripts/test-admin-form18-full-flow.js`** (new)
   - Comprehensive Form 18 upload flow test

## Usage

The Form 18 upload functionality now works correctly:

1. **Admin Uploads**: Each director's Form 18 document is uploaded individually
2. **Database Storage**: Documents are stored as an array with proper indexing
3. **Data Persistence**: All Form 18 documents are preserved and accessible
4. **Director Association**: Each document is associated with the correct director

## Verification

To verify the fix is working:

1. **Upload Form 18 for multiple directors**
2. **Check database**: Form 18 field should contain an array
3. **Verify indexing**: Each document should be at the correct array index
4. **Test persistence**: Documents should remain after page refresh

The Form 18 upload issue in admin step3 document management has been resolved, and documents are now properly saved as an array in the MySQL database.
