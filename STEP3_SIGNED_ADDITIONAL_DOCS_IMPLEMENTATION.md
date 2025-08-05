# Step 3 Signed Additional Documents Implementation

## Overview

This implementation adds support for step 3 signed additional documents in the customer registration flow. When an admin uploads additional documents in step 3, customers can now view these documents and upload their signed versions, which are immediately saved to the database and file storage.

## Database Changes

### New Column Added
- **Column Name**: `step3_signed_additional_doc`
- **Data Type**: JSON
- **Purpose**: Stores customer-signed step 3 additional documents
- **Location**: `registrations` table

### Migration Scripts
- `scripts/migrate-step3-signed-additional-doc.js` - Adds the new column to existing databases
- `scripts/test-step3-signed-additional-doc.js` - Tests the column functionality
- `scripts/test-step3-signed-additional-doc-integration.js` - Comprehensive integration testing

## API Changes

### Customer Documents API (`/api/registrations/[id]/customer-documents`)
- **Updated**: Now handles `step3SignedAdditionalDoc` field
- **Method**: PUT
- **Purpose**: Saves customer-signed step 3 additional documents

### Registration API (`/api/registrations/[id]`)
- **GET**: Now returns `step3SignedAdditionalDoc` field
- **PUT**: Now accepts `step3SignedAdditionalDoc` field for updates

## Frontend Changes

### Customer Step 3 Component (`components/customer/registration-steps/DocumentationStep.tsx`)

#### New State Management
```typescript
const [signedDocuments, setSignedDocuments] = useState({
  // ... existing fields ...
  // Step 3 additional documents will be stored with keys like step3_additional_0, step3_additional_1, etc.
})
```

#### Enhanced Document Loading
- Loads existing step 3 signed additional documents from `companyData.step3SignedAdditionalDoc`
- Maps document titles to state keys for easy access

#### Updated File Upload Handler
- Handles `step3_additional_*` document types
- Immediately saves to database and file storage
- Updates local state for UI feedback

#### Enhanced Database Saving
- `saveCustomerDocumentToDatabase()`: Now handles step 3 additional documents
- `saveForm18DocumentToDatabase()`: Includes step 3 additional documents in updates
- `onSubmit()`: Includes step 3 additional documents in final submission

#### New UI Sections

##### Download Tab
```tsx
{companyData.step3AdditionalDoc && companyData.step3AdditionalDoc.length > 0 && (
  <>
    <div className="col-span-full mt-4 mb-2">
      <h3 className="text-lg font-semibold text-gray-900">Step 3 Additional Documents</h3>
      <p className="text-sm text-gray-600">Additional documents provided by the administrator for step 3</p>
    </div>
    {companyData.step3AdditionalDoc.map((doc: any, index: number) => (
      <DocumentDownloadCard
        key={`step3-additional-${index}`}
        title={doc.title}
        description="Step 3 Additional document"
        document={doc}
        onDownload={() => handleDownload(doc)}
      />
    ))}
  </>
)}
```

##### Upload Tab
```tsx
{companyData.step3AdditionalDoc && companyData.step3AdditionalDoc.length > 0 && (
  <>
    <div className="col-span-full mt-4 mb-2">
      <h3 className="text-lg font-semibold text-gray-900">Step 3 Additional Documents</h3>
      <p className="text-sm text-gray-600">Upload signed versions of step 3 additional documents</p>
    </div>
    {companyData.step3AdditionalDoc.map((doc: any, index: number) => (
      <DocumentUploadCard
        key={`step3-additional-upload-${index}`}
        title={`Signed ${doc.title}`}
        description={`Upload signed version of ${doc.title}`}
        document={signedDocuments[`step3_additional_${index}`] || null}
        onUpload={(file) => handleFileUpload(`step3_additional_${index}`, file)}
      />
    ))}
  </>
)}
```

#### Enhanced Validation
- `step3AdditionalDocumentsUploaded`: Checks if all step 3 additional documents are uploaded
- `allSignedDocumentsUploaded`: Now includes step 3 additional documents requirement

### Admin Step 3 Component (`components/admin/CompanyDetailsPage.tsx`)

#### Customer Submitted Documents Section
- **Enhanced Display Logic**: Now checks for both `customerDocuments` and `step3SignedAdditionalDoc`
- **Document Separation**: Step 3 signed additional documents are displayed in a separate section
- **Conditional Rendering**: Shows documents section only if customer has submitted any documents

#### New UI Section
```tsx
{/* Render step 3 signed additional documents */}
{step3SignedAdditionalDocs.length > 0 && (
  <>
    <div className="col-span-full mt-4 mb-2">
      <h3 className="text-lg font-semibold text-gray-900">Step 3 Additional Documents</h3>
      <p className="text-sm text-gray-600">Signed step 3 additional documents submitted by the customer</p>
    </div>
    {step3SignedAdditionalDocs.map(([title, doc]: [string, any]) =>
      renderDocumentCard([title, { ...doc, title: `Signed ${title}` }])
    )}
  </>
)}
```

#### Enhanced Document Filtering
```tsx
// Separate documents by type for better organization
const normalDocs = Object.entries(customerDocuments).filter(([key, doc]: [string, any]) => 
  key !== 'form18' && key !== 'addressProof' && key !== 'additionalDocuments' && key !== 'step3SignedAdditionalDoc'
)

// Handle step 3 signed additional documents
const step3SignedAdditionalDocs = selectedCompany.step3SignedAdditionalDoc ? Object.entries(selectedCompany.step3SignedAdditionalDoc) : []
```

#### Updated Condition Check
```tsx
// Check if customer has submitted any documents
const customerDocuments = selectedCompany.customerDocuments || {}
const hasCustomerDocuments = Object.keys(customerDocuments).length > 0
const hasStep3SignedAdditionalDocs = selectedCompany.step3SignedAdditionalDoc && Object.keys(selectedCompany.step3SignedAdditionalDoc).length > 0

if (!hasCustomerDocuments && !hasStep3SignedAdditionalDocs) {
  // Show "No customer documents submitted yet" message
}
```

## Data Flow

### Admin Upload Flow
1. Admin uploads additional documents in step 3
2. Documents are stored in `step3_additional_doc` column (array format)
3. Documents are published to customer when admin clicks "Publish Documents"

### Customer View Flow
1. Customer sees step 3 additional documents in download tab
2. Customer can download and review the documents
3. Customer switches to upload tab to upload signed versions

### Customer Upload Flow
1. Customer selects file for each step 3 additional document
2. File is immediately uploaded to file storage
3. Document metadata is saved to `step3_signed_additional_doc` column (object format)
4. Local state is updated for UI feedback
5. Database is updated via API call

### Final Submission Flow
1. Customer clicks "Submit" when all documents are uploaded
2. All signed documents (including step 3) are included in final submission
3. `documentsAcknowledged` is set to true
4. Registration proceeds to next step

## Data Structure

### Admin Uploads (step3_additional_doc)
```json
[
  {
    "title": "Business Plan",
    "name": "business-plan.pdf",
    "type": "application/pdf",
    "size": 2048000,
    "url": "/uploads/documents/business-plan.pdf",
    "filePath": "documents/business-plan.pdf",
    "id": "doc-001",
    "uploadedAt": "2025-08-05T21:46:33.203Z"
  }
]
```

### Customer Uploads (step3_signed_additional_doc)
```json
{
  "Business Plan": {
    "name": "signed-business-plan.pdf",
    "type": "application/pdf",
    "size": 2150400,
    "url": "/uploads/documents/signed-business-plan.pdf",
    "filePath": "documents/signed-business-plan.pdf",
    "id": "signed-doc-001",
    "title": "Business Plan",
    "uploadedAt": "2025-08-05T21:46:33.203Z",
    "signedByCustomer": true,
    "submittedAt": "2025-08-05T21:46:33.203Z"
  }
}
```

## Testing

### Available Test Scripts
- `npm run migrate-step3-signed` - Run migration
- `npm run test-step3-signed` - Test column functionality
- `npm run test-step3-integration` - Test full integration
- `npm run test-admin-step3` - Test admin step 3 display functionality

### Test Coverage
- Database column creation and functionality
- API endpoint handling
- File upload and storage
- Data persistence and retrieval
- Frontend state management
- UI rendering and interactions
- Admin step 3 display functionality
- Customer document submission and retrieval

## Usage

### For Admins
1. Navigate to company details page
2. Go to step 3 (Documentation)
3. Upload additional documents using "Add Additional Document" button
4. Publish documents to customer

### For Customers
1. Navigate to step 3 (Documentation)
2. Download and review step 3 additional documents
3. Switch to upload tab
4. Upload signed versions of each document
5. Submit when all documents are uploaded

## Benefits

1. **Immediate Feedback**: Documents are saved immediately upon upload
2. **File Storage Integration**: Uses existing file storage system
3. **Database Persistence**: All data is properly stored in MySQL
4. **UI Consistency**: Follows existing patterns for document handling
5. **Validation**: Ensures all required documents are uploaded before proceeding
6. **Error Handling**: Comprehensive error handling and user feedback

## Future Enhancements

1. **Document Preview**: Add preview functionality for uploaded documents
2. **Bulk Upload**: Allow uploading multiple documents at once
3. **Document Templates**: Provide templates for common document types
4. **Version Control**: Track document versions and changes
5. **Digital Signatures**: Integrate digital signature capabilities 