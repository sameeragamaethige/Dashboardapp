# Customer Documents Migration

## Overview

This migration separates customer signed documents from a single `customer_documents` JSON column into individual columns for each document type in the MySQL database. This provides better data organization, easier querying, and improved performance.

## Changes Made

### 1. Database Schema Updates

#### New Columns Added
- `customer_form1` (JSON) - Customer signed Form 1
- `customer_letter_of_engagement` (JSON) - Customer signed Letter of Engagement  
- `customer_aoa` (JSON) - Customer signed Articles of Association
- `customer_form18` (JSON) - Customer signed Form 18 (array for multiple directors)
- `customer_address_proof` (JSON) - Customer uploaded address proof document

#### Files Updated
- `lib/database.ts` - Database initialization schema
- `scripts/auto-setup.js` - Auto-setup script schema
- `scripts/init-database.js` - Database initialization script schema

### 2. API Updates

#### Customer Documents API (`/api/registrations/[id]/customer-documents`)
- **Before**: Updated single `customer_documents` JSON column
- **After**: Updates separate columns for each document type
- **File**: `app/api/registrations/[id]/customer-documents/route.ts`

#### Registrations API (`/api/registrations`)
- **GET**: Combines customer documents from separate columns into expected format
- **File**: `app/api/registrations/route.ts`

#### Single Registration API (`/api/registrations/[id]`)
- **GET**: Combines customer documents from separate columns into expected format
- **PUT**: Updates separate customer document columns
- **DELETE**: Handles deletion of files from new columns
- **File**: `app/api/registrations/[id]/route.ts`

### 3. Migration Scripts

#### Migration Script (`scripts/migrate-customer-documents.js`)
- Adds new columns to existing database
- Migrates existing `customer_documents` data to separate columns
- Handles errors gracefully (column already exists, etc.)

#### Test Script (`scripts/test-customer-documents.js`)
- Verifies new columns exist
- Checks for registrations with customer documents
- Provides validation of the migration

## Benefits

### 1. Better Data Organization
- Each document type has its own column
- Easier to query specific document types
- Clearer database structure

### 2. Improved Performance
- No need to parse large JSON objects for simple queries
- Indexing can be applied to individual columns
- Reduced data transfer for partial document access

### 3. Enhanced Querying
- Can easily find registrations with specific document types
- Better support for analytics and reporting
- Simplified data filtering

### 4. Maintainability
- Easier to add new document types in the future
- Clear separation of concerns
- Better debugging and troubleshooting

## Migration Process

### 1. Run Migration
```bash
node scripts/migrate-customer-documents.js
```

### 2. Verify Migration
```bash
node scripts/test-customer-documents.js
```

### 3. Test Application
- Start the development server
- Test customer document upload functionality
- Verify documents are saved to correct columns

## Data Structure

### Before Migration
```json
{
  "customer_documents": {
    "form1": { "name": "form1.pdf", "url": "...", ... },
    "letterOfEngagement": { "name": "letter.pdf", "url": "...", ... },
    "aoa": { "name": "aoa.pdf", "url": "...", ... },
    "form18": [{ "name": "form18_1.pdf", "url": "...", ... }],
    "addressProof": { "name": "address.pdf", "url": "...", ... }
  }
}
```

### After Migration
```sql
customer_form1: {"name": "form1.pdf", "url": "...", ...}
customer_letter_of_engagement: {"name": "letter.pdf", "url": "...", ...}
customer_aoa: {"name": "aoa.pdf", "url": "...", ...}
customer_form18: [{"name": "form18_1.pdf", "url": "...", ...}]
customer_address_proof: {"name": "address.pdf", "url": "...", ...}
```

## Backward Compatibility

The API maintains backward compatibility by:
- Reading from separate columns and combining into the expected format
- Supporting both old and new data structures during transition
- Gracefully handling missing columns

## File Storage

Files continue to be stored in the file storage system (`uploads/` folder) as before. Only the metadata is stored in the database columns.

## Testing

To test the implementation:

1. **Database Test**: Run `node scripts/test-customer-documents.js`
2. **Application Test**: 
   - Start development server: `npm run dev`
   - Navigate to customer registration flow
   - Upload signed documents in step 3
   - Verify documents are saved correctly

## Rollback Plan

If rollback is needed:
1. Keep the old `customer_documents` column
2. Revert API changes to use the old column
3. Data in separate columns can be migrated back if needed

## Future Enhancements

- Add individual document status tracking
- Implement document versioning
- Add document approval workflows per document type
- Create document-specific validation rules 