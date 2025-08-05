"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, CheckCircle, AlertCircle, Upload, Eye, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { getSubmitButtonText, getPackageById, type Package, isAdvanceBalancePackage } from "@/lib/package-utils"
import BankTransferDetails from "../BankTransferDetails"
import { fileUploadClient } from "@/lib/file-upload-client"

type DocumentationProps = {
  companyData: any
  onComplete: (data: any) => void
  bankDetails?: any
  onNavigateToStep?: (step: string) => void
}

export default function DocumentationStep({ companyData, onComplete, bankDetails, onNavigateToStep }: DocumentationProps) {
  const directors = companyData.directors || []
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("download")
  const [availablePackages, setAvailablePackages] = useState<Record<string, Package>>({})
  const [showPaymentSection, setShowPaymentSection] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("bankTransfer")
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null)
  const [selectedBankId, setSelectedBankId] = useState<string>(bankDetails && bankDetails.length > 0 ? bankDetails[0].id : "")
  const balancePaymentRef = useRef<HTMLDivElement>(null)
  const [documents, setDocuments] = useState({
    form1: companyData.form1 || null,
    letterOfEngagement: companyData.letterOfEngagement || null,
    aoa: companyData.aoa || null,
    form18: Array.isArray(companyData.form18)
      ? companyData.form18
      : directors.map(() => null),
    addressProof: companyData.addressProof || null,
  })
  const [signedDocuments, setSignedDocuments] = useState({
    form1: null,
    letterOfEngagement: null,
    aoa: null,
    form18: directors.map(() => null),
    addressProof: null,
    // Additional documents will be stored with keys like additional_0, additional_1, etc.
    // Step 3 additional documents will be stored with keys like step3_additional_0, step3_additional_1, etc.
  })
  const [documentsPublished, setDocumentsPublished] = useState(companyData.documentsPublished || false)

  useEffect(() => {
    // Update documents if companyData changes
    setDocuments({
      form1: companyData.form1 || null,
      letterOfEngagement: companyData.letterOfEngagement || null,
      aoa: companyData.aoa || null,
      form18: Array.isArray(companyData.form18)
        ? companyData.form18
        : directors.map(() => null),
      addressProof: companyData.addressProof || null
    })
    setDocumentsPublished(companyData.documentsPublished || false)

    // Load any previously uploaded signed documents
    if (companyData.customerDocuments) {
      setSignedDocuments({
        form1: companyData.customerDocuments.form1 || null,
        letterOfEngagement: companyData.customerDocuments.letterOfEngagement || null,
        aoa: companyData.customerDocuments.aoa || null,
        form18: Array.isArray(companyData.customerDocuments.form18)
          ? companyData.customerDocuments.form18
          : directors.map(() => null),
        addressProof: companyData.customerDocuments.addressProof || null,
        // Load step 3 signed additional documents
        ...(companyData.step3SignedAdditionalDoc && Object.keys(companyData.step3SignedAdditionalDoc).reduce((acc, key, index) => {
          acc[`step3_additional_${index}`] = companyData.step3SignedAdditionalDoc[key];
          return acc;
        }, {}))
      })
    }

    // Show payment section if balance payment was rejected
    if (companyData.balancePaymentReceipt?.status === 'rejected') {
      setShowPaymentSection(true)
      // Clear the previous payment receipt to force re-upload
      setPaymentReceipt(null)
    }
  }, [companyData])

  // Fetch available packages directly from MySQL database
  useEffect(() => {
    const loadPackages = async () => {
      try {
        console.log('📦 Customer Step 3 - Loading packages from MySQL database...')
        console.log('📦 Customer Step 3 - Current companyData.selectedPackage:', companyData.selectedPackage)

        // Fetch packages directly from the API
        const response = await fetch('/api/packages')
        if (!response.ok) {
          throw new Error(`Failed to fetch packages: ${response.status} ${response.statusText}`)
        }

        const dbPackages = await response.json()
        console.log('📦 Customer Step 3 - Raw database packages:', dbPackages)

        // Convert database format to frontend format
        const convertedPackages = dbPackages.map((pkg: any) => ({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          price: Number(pkg.price),
          type: pkg.advance_amount && pkg.balance_amount ? "advance-balance" : "one-time",
          advanceAmount: pkg.advance_amount ? Number(pkg.advance_amount) : undefined,
          balanceAmount: pkg.balance_amount ? Number(pkg.balance_amount) : undefined,
          features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : (pkg.features || [])
        }))

        console.log('📦 Customer Step 3 - Converted packages:', convertedPackages)

        // Convert array to object with package ID as key
        const packagesMap: Record<string, Package> = {}
        convertedPackages.forEach((pkg: Package) => {
          packagesMap[pkg.id] = pkg
        })

        // Also create a mapping for package names to handle existing registrations
        const packagesByName: Record<string, Package> = {}
        convertedPackages.forEach((pkg: Package) => {
          packagesByName[pkg.name] = pkg
        })

        console.log('📦 Customer Step 3 - Packages map (by ID):', packagesMap)
        console.log('📦 Customer Step 3 - Packages map (by name):', packagesByName)
        console.log('📦 Customer Step 3 - Available package IDs:', Object.keys(packagesMap))
        console.log('📦 Customer Step 3 - Available package names:', Object.keys(packagesByName))
        console.log('📦 Customer Step 3 - Selected package ID/name:', companyData.selectedPackage)
        console.log('📦 Customer Step 3 - Selected package found (by ID):', packagesMap[companyData.selectedPackage])
        console.log('📦 Customer Step 3 - Selected package found (by name):', packagesByName[companyData.selectedPackage])

        // Store both mappings
        setAvailablePackages({ ...packagesMap, ...packagesByName })
      } catch (error) {
        console.error('Error loading packages from database:', error)
      }
    }

    loadPackages()
  }, [companyData.selectedPackage]) // Add dependency to reload when selectedPackage changes

  const handleForm18Upload = async (index: number, file: File) => {
    try {
      console.log(`📁 DocumentationStep - Uploading Form 18 file for director ${index}:`, file.name);

      // Upload file to file storage immediately
      const uploadResult = await fileUploadClient.uploadFile(file, companyData._id);

      if (uploadResult.success && uploadResult.file) {
        // Create document object with file storage data
        const document = {
          name: file.name,
          type: file.type,
          size: file.size,
          url: uploadResult.file.url,
          filePath: uploadResult.file.filePath,
          id: uploadResult.file.id,
          title: `FORM 18 (Signed) - ${directors[index]?.name || `Director ${index + 1}`}`,
          uploadedAt: uploadResult.file.uploadedAt,
          uploaded: true,
          signedByCustomer: true,
          submittedAt: new Date().toISOString()
        }

        // Update the signed documents state
        setSignedDocuments((prev) => ({
          ...prev,
          form18: prev.form18.map((doc: any, i: number) => (i === index ? document : doc)),
        }))

        console.log(`✅ Form 18 document uploaded successfully: ${file.name}`);
        console.log(`📁 Form 18 document object:`, document);

        // Save to MySQL database immediately
        await saveForm18DocumentToDatabase(index, document);
      } else {
        throw new Error(`Failed to upload file ${file.name}: ${uploadResult.error}`);
      }
    } catch (error) {
      console.error('Error uploading Form 18 file:', error);
      // You might want to show a toast notification here
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error uploading file: ${errorMessage}`);
    }
  }

  const handleFileUpload = async (documentType: string, file: File) => {
    try {
      console.log(`📁 DocumentationStep - Uploading ${documentType} file:`, file.name);

      // Upload file to file storage immediately
      const uploadResult = await fileUploadClient.uploadFile(file, companyData._id);

      if (uploadResult.success && uploadResult.file) {
        // Create document object with file storage data
        const document = {
          name: file.name,
          type: file.type,
          size: file.size,
          url: uploadResult.file.url,
          filePath: uploadResult.file.filePath,
          id: uploadResult.file.id,
          title: getDocumentTitle(documentType),
          uploadedAt: uploadResult.file.uploadedAt,
          uploaded: true,
          signedByCustomer: true,
          submittedAt: new Date().toISOString()
        }

        // Update the signed documents state
        setSignedDocuments((prev) => ({
          ...prev,
          [documentType]: document,
        }))

        console.log(`✅ ${documentType} document uploaded successfully: ${file.name}`);
        console.log(`📁 ${documentType} document object:`, document);

        // Save to MySQL database immediately
        await saveCustomerDocumentToDatabase(documentType, document);
      } else {
        throw new Error(`Failed to upload file ${file.name}: ${uploadResult.error}`);
      }
    } catch (error) {
      console.error(`Error uploading ${documentType} file:`, error);
      // You might want to show a toast notification here
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error uploading file: ${errorMessage}`);
    }
  }

  // Function to save balance payment receipt immediately when uploaded
  const saveBalancePaymentReceipt = async (file: File) => {
    try {
      console.log('📁 DocumentationStep - Uploading balance payment receipt:', file.name);

      const uploadResult = await fileUploadClient.uploadFile(file, companyData._id)

      if (uploadResult.success && uploadResult.file) {
        // Create balance payment receipt object with file storage data
        const balancePaymentReceiptData = {
          name: file.name,
          type: file.type,
          size: file.size,
          url: uploadResult.file.url,
          filePath: uploadResult.file.filePath,
          id: uploadResult.file.id,
          uploadedAt: uploadResult.file.uploadedAt,
          submittedAt: new Date().toISOString(),
          status: 'pending',
          companyName: companyData.companyNameEnglish || companyData.companyName,
          selectedPackage: companyData.selectedPackage
        }

        // Update the payment receipt in the component state
        setPaymentReceipt(file)

        console.log('✅ Balance payment receipt uploaded successfully:', uploadResult.file.url)
        console.log('📁 Balance payment receipt object:', balancePaymentReceiptData)

        // Save to MySQL database immediately
        await saveBalancePaymentReceiptToDatabase(balancePaymentReceiptData)
      } else {
        console.error('Failed to upload payment receipt:', uploadResult.error)
      }
    } catch (error) {
      console.error('Error saving balance payment receipt:', error)
    }
  }

  // Function to save individual customer document to database immediately
  const saveCustomerDocumentToDatabase = async (documentType: string, document: any) => {
    try {
      console.log(`📝 Saving ${documentType} to database immediately:`, document);

      // Get current signed documents state
      const currentSignedDocuments = signedDocuments;

      // Create the customer documents object with the new document
      const customerDocuments = {
        form1: documentType === 'form1' ? document : currentSignedDocuments.form1,
        letterOfEngagement: documentType === 'letterOfEngagement' ? document : currentSignedDocuments.letterOfEngagement,
        aoa: documentType === 'aoa' ? document : currentSignedDocuments.aoa,
        form18: currentSignedDocuments.form18, // Form 18 is handled separately
        addressProof: documentType === 'addressProof' ? document : currentSignedDocuments.addressProof,
      }

      // Handle additional documents
      if (documentType.startsWith('additional_')) {
        const additionalIndex = parseInt(documentType.split('_')[1])
        const additionalDocuments = companyData.additionalDocuments || []
        const originalDoc = additionalDocuments[additionalIndex]

        if (originalDoc) {
          // Initialize additionalDocuments if it doesn't exist
          customerDocuments.additionalDocuments = customerDocuments.additionalDocuments || {}

          // Add the current signed additional document
          customerDocuments.additionalDocuments[originalDoc.title] = document

          // Include ALL previously uploaded additional documents
          if (companyData.additionalDocuments && companyData.additionalDocuments.length > 0) {
            companyData.additionalDocuments.forEach((doc: any, index: number) => {
              const signedDoc = currentSignedDocuments[`additional_${index}`]
              if (signedDoc && typeof signedDoc === 'object' && index !== additionalIndex) {
                customerDocuments.additionalDocuments[doc.title] = signedDoc
              }
            })
          }
        }
      } else if (documentType.startsWith('step3_additional_')) {
        // Handle step 3 additional documents
        const step3AdditionalIndex = parseInt(documentType.split('_')[2])
        const step3AdditionalDocuments = companyData.step3AdditionalDoc || []
        const originalDoc = step3AdditionalDocuments[step3AdditionalIndex]

        if (originalDoc) {
          // Initialize step3SignedAdditionalDoc if it doesn't exist
          customerDocuments.step3SignedAdditionalDoc = customerDocuments.step3SignedAdditionalDoc || {}

          // Add the current signed step 3 additional document
          customerDocuments.step3SignedAdditionalDoc[originalDoc.title] = document

          // Include ALL previously uploaded step 3 additional documents
          if (companyData.step3AdditionalDoc && companyData.step3AdditionalDoc.length > 0) {
            companyData.step3AdditionalDoc.forEach((doc: any, index: number) => {
              const signedDoc = currentSignedDocuments[`step3_additional_${index}`]
              if (signedDoc && typeof signedDoc === 'object' && index !== step3AdditionalIndex) {
                customerDocuments.step3SignedAdditionalDoc[doc.title] = signedDoc
              }
            })
          }
        }
      } else {
        // For non-additional documents, include existing additional documents
        if (companyData.additionalDocuments && companyData.additionalDocuments.length > 0) {
          customerDocuments.additionalDocuments = {}
          companyData.additionalDocuments.forEach((doc: any, index: number) => {
            const signedDoc = currentSignedDocuments[`additional_${index}`]
            if (signedDoc && typeof signedDoc === 'object') {
              customerDocuments.additionalDocuments[doc.title] = signedDoc
            }
          })
        }

        // Include existing step 3 additional documents
        if (companyData.step3AdditionalDoc && companyData.step3AdditionalDoc.length > 0) {
          customerDocuments.step3SignedAdditionalDoc = {}
          companyData.step3AdditionalDoc.forEach((doc: any, index: number) => {
            const signedDoc = currentSignedDocuments[`step3_additional_${index}`]
            if (signedDoc && typeof signedDoc === 'object') {
              customerDocuments.step3SignedAdditionalDoc[doc.title] = signedDoc
            }
          })
        }
      }

      // Save to database
      const response = await fetch(`/api/registrations/${companyData._id}/customer-documents`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerDocuments: customerDocuments,
          documentsAcknowledged: false // Keep as false until all documents are uploaded
        })
      });

      if (response.ok) {
        console.log(`✅ ${documentType} saved to database successfully`);
      } else {
        console.error(`❌ Failed to save ${documentType} to database:`, response.status, response.statusText);
      }
    } catch (error) {
      console.error(`❌ Error saving ${documentType} to database:`, error);
    }
  };

  // Function to save Form 18 document to database immediately
  const saveForm18DocumentToDatabase = async (index: number, document: any) => {
    try {
      console.log(`📝 Saving Form 18 (index ${index}) to database immediately:`, document);

      // Get current signed documents state
      const currentSignedDocuments = signedDocuments;

      // Create new form18 array with the updated document
      const newForm18 = [...(currentSignedDocuments.form18 || [])];
      newForm18[index] = document;

      // Create the customer documents object
      const customerDocuments = {
        form1: currentSignedDocuments.form1,
        letterOfEngagement: currentSignedDocuments.letterOfEngagement,
        aoa: currentSignedDocuments.aoa,
        form18: newForm18,
        addressProof: currentSignedDocuments.addressProof,
      };

      // Handle additional documents in Form 18 function as well
      if (companyData.additionalDocuments && companyData.additionalDocuments.length > 0) {
        customerDocuments.additionalDocuments = {}
        companyData.additionalDocuments.forEach((doc: any, index: number) => {
          const signedDoc = currentSignedDocuments[`additional_${index}`]
          if (signedDoc && typeof signedDoc === 'object') {
            customerDocuments.additionalDocuments[doc.title] = signedDoc
          }
        })
      }

      // Handle step 3 additional documents in Form 18 function as well
      if (companyData.step3AdditionalDoc && companyData.step3AdditionalDoc.length > 0) {
        customerDocuments.step3SignedAdditionalDoc = {}
        companyData.step3AdditionalDoc.forEach((doc: any, index: number) => {
          const signedDoc = currentSignedDocuments[`step3_additional_${index}`]
          if (signedDoc && typeof signedDoc === 'object') {
            customerDocuments.step3SignedAdditionalDoc[doc.title] = signedDoc
          }
        })
      }

      // Save to database
      const response = await fetch(`/api/registrations/${companyData._id}/customer-documents`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerDocuments: customerDocuments,
          documentsAcknowledged: false // Keep as false until all documents are uploaded
        })
      });

      if (response.ok) {
        console.log(`✅ Form 18 (index ${index}) saved to database successfully`);
      } else {
        console.error(`❌ Failed to save Form 18 (index ${index}) to database:`, response.status, response.statusText);
      }
    } catch (error) {
      console.error(`❌ Error saving Form 18 (index ${index}) to database:`, error);
    }
  };

  // Function to save balance payment receipt to database immediately
  const saveBalancePaymentReceiptToDatabase = async (balancePaymentReceiptData: any) => {
    try {
      console.log('📝 Saving balance payment receipt to database immediately:', balancePaymentReceiptData);

      // Save to database using the balance payment API endpoint
      const response = await fetch(`/api/registrations/${companyData._id}/balance-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          balancePaymentReceipt: balancePaymentReceiptData
        })
      });

      if (response.ok) {
        console.log('✅ Balance payment receipt saved to database successfully');
      } else {
        console.error('❌ Failed to save balance payment receipt to database:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error saving balance payment receipt to database:', error);
    }
  };

  const getDocumentTitle = (documentType: string): string => {
    switch (documentType) {
      case "form1":
        return "FORM 1 (Signed)"
      case "letterOfEngagement":
        return "Letter Of Engagement (Signed)"
      case "aoa":
        return "Articles of Association (Signed)"
      case "form18":
        return "FORM 18 (Signed)"
      case "addressProof":
        return "Address Proof Document"
      default:
        return "Signed Document"
    }
  }

  const allDocumentsAvailable =
    documents.form1 &&
    documents.letterOfEngagement &&
    documents.aoa &&
    documents.form18.length === directors.length &&
    documents.form18.every((doc: any) => !!doc) &&
    // Step 3 additional documents are optional, so we don't need to check them for availability
    true

  // Check if address proof is required based on business address number
  const isAddressProofRequired = !companyData.businessAddressNumber || companyData.businessAddressNumber.trim() === ""

  // Check if all additional documents are uploaded
  const additionalDocumentsUploaded = companyData.additionalDocuments && companyData.additionalDocuments.length > 0
    ? companyData.additionalDocuments.every((doc: any, index: number) => !!signedDocuments[`additional_${index}`])
    : true

  // Check if all step 3 additional documents are uploaded
  const step3AdditionalDocumentsUploaded = companyData.step3AdditionalDoc && companyData.step3AdditionalDoc.length > 0
    ? companyData.step3AdditionalDoc.every((doc: any, index: number) => !!signedDocuments[`step3_additional_${index}`])
    : true

  const allSignedDocumentsUploaded =
    signedDocuments.form1 &&
    signedDocuments.letterOfEngagement &&
    signedDocuments.aoa &&
    signedDocuments.form18.length === directors.length &&
    signedDocuments.form18.every((doc: any) => !!doc) &&
    // Only require address proof if business address number is not provided
    (!isAddressProofRequired || signedDocuments.addressProof) &&
    // Check if all additional documents are uploaded
    additionalDocumentsUploaded &&
    // Check if all step 3 additional documents are uploaded
    step3AdditionalDocumentsUploaded

  console.log('📝 Customer Step 3 - allSignedDocumentsUploaded check:', {
    form1: !!signedDocuments.form1,
    letterOfEngagement: !!signedDocuments.letterOfEngagement,
    aoa: !!signedDocuments.aoa,
    form18Length: signedDocuments.form18.length,
    directorsLength: directors.length,
    form18AllUploaded: signedDocuments.form18.every((doc: any) => !!doc),
    isAddressProofRequired,
    addressProof: !!signedDocuments.addressProof,
    additionalDocumentsCount: companyData.additionalDocuments?.length || 0,
    step3AdditionalDocumentsCount: companyData.step3AdditionalDoc?.length || 0,
    additionalDocumentsUploaded,
    step3AdditionalDocumentsUploaded,
    allSignedDocumentsUploaded
  });

  const onSubmit = async () => {
    console.log('📝 Customer Step 3 - onSubmit function called');
    setIsSubmitting(true)
    try {
      const selectedPackage = getPackageById(availablePackages, companyData.selectedPackage)

      // If it's an advance+balance package and payment section is not shown yet, show it
      if (isAdvanceBalancePackage(selectedPackage) && !showPaymentSection) {
        setShowPaymentSection(true)
        setIsSubmitting(false)

        // Scroll to balance payment section after a short delay to ensure it's rendered
        setTimeout(() => {
          balancePaymentRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }, 100)

        return
      }

      // In a real app, you would submit to your server
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Save customer document uploads to localStorage
      const savedRegistrations = localStorage.getItem("registrations")
      if (savedRegistrations) {
        const registrations = JSON.parse(savedRegistrations)

        // Ensure registrations is an array
        if (!Array.isArray(registrations)) {
          console.error('Registrations is not an array:', registrations);
          return;
        }

        const companyIndex = registrations.findIndex((reg: any) => reg._id === companyData._id)

        if (companyIndex !== -1) {
          // Files are already uploaded immediately when selected, so we can use the signed documents directly
          console.log('📝 Customer Step 3 - Current signedDocuments state:', signedDocuments);

          const customerDocuments = {
            form1: signedDocuments.form1 && typeof signedDocuments.form1 === 'object'
              ? {
                ...signedDocuments.form1,
                signedByCustomer: true,
                submittedAt: new Date().toISOString(),
              }
              : null,
            letterOfEngagement: signedDocuments.letterOfEngagement && typeof signedDocuments.letterOfEngagement === 'object'
              ? {
                ...signedDocuments.letterOfEngagement,
                signedByCustomer: true,
                submittedAt: new Date().toISOString(),
              }
              : null,
            aoa: signedDocuments.aoa && typeof signedDocuments.aoa === 'object'
              ? {
                ...signedDocuments.aoa,
                signedByCustomer: true,
                submittedAt: new Date().toISOString(),
              }
              : null,
            form18: signedDocuments.form18.map((doc: any) =>
              doc && typeof doc === 'object'
                ? {
                  ...doc,
                  signedByCustomer: true,
                  submittedAt: new Date().toISOString(),
                }
                : null
            ),
            addressProof: signedDocuments.addressProof && typeof signedDocuments.addressProof === 'object'
              ? {
                ...signedDocuments.addressProof,
                signedByCustomer: true,
                submittedAt: new Date().toISOString(),
              }
              : null,
          }

          // Add additional documents to customerDocuments
          if (companyData.additionalDocuments && companyData.additionalDocuments.length > 0) {
            customerDocuments.additionalDocuments = {}
            companyData.additionalDocuments.forEach((doc: any, index: number) => {
              const signedDoc = signedDocuments[`additional_${index}`]
              if (signedDoc && typeof signedDoc === 'object') {
                customerDocuments.additionalDocuments[doc.title] = {
                  ...signedDoc,
                  signedByCustomer: true,
                  submittedAt: new Date().toISOString(),
                }
              }
            })
          }

          // Add step 3 additional documents to customerDocuments
          if (companyData.step3AdditionalDoc && companyData.step3AdditionalDoc.length > 0) {
            customerDocuments.step3SignedAdditionalDoc = {}
            companyData.step3AdditionalDoc.forEach((doc: any, index: number) => {
              const signedDoc = signedDocuments[`step3_additional_${index}`]
              if (signedDoc && typeof signedDoc === 'object') {
                customerDocuments.step3SignedAdditionalDoc[doc.title] = {
                  ...signedDoc,
                  signedByCustomer: true,
                  submittedAt: new Date().toISOString(),
                }
              }
            })
          }

          console.log('📝 Customer Step 3 - Processed customerDocuments object:', customerDocuments);

          // Balance payment receipt is already saved to database immediately when uploaded
          // No need to save it again here

          // Update the registration with customer documents (only file references, not file data)
          registrations[companyIndex].customerDocuments = customerDocuments
          registrations[companyIndex].documentsAcknowledged = true

          // Save back to localStorage (only file references, not file data)
          localStorage.setItem("registrations", JSON.stringify(registrations))

          // Update MySQL database to set documentsAcknowledged to true
          try {
            console.log('📝 Customer Step 3 - Setting documentsAcknowledged to true')
            console.log('📝 Customer Step 3 - Registration ID:', companyData._id)

            const response = await fetch(`/api/registrations/${companyData._id}/customer-documents`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                customerDocuments: customerDocuments,
                documentsAcknowledged: true
              })
            })

            console.log('📝 Customer Step 3 - Response status:', response.status)
            console.log('📝 Customer Step 3 - Response headers:', Object.fromEntries(response.headers.entries()))

            if (response.ok) {
              const result = await response.json()
              console.log('✅ Documents acknowledged successfully:', result)
            } else {
              const errorText = await response.text()
              console.error('❌ Failed to acknowledge documents:', response.status, response.statusText)
              console.error('❌ Error response:', errorText)
            }
          } catch (dbError) {
            console.error('❌ Error acknowledging documents:', dbError)
            console.error('❌ Error details:', {
              message: dbError.message,
              stack: dbError.stack
            })
          }

          // Dispatch event to notify of update
          window.dispatchEvent(new CustomEvent("registration-updated"))
        }
      }

      onComplete({
        documentsAcknowledged: true,
        customerDocuments: signedDocuments,
      })
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = (docFile: any) => {
    if (docFile && docFile.url) {
      // File uploaded to storage
      const link = window.document.createElement("a")
      link.href = docFile.url
      link.download = docFile.name
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    }
  }

  if (!documentsPublished) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Registration Documents</CardTitle>
          <CardDescription>Documents will be available once the administrator publishes them</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10">
            <div className="rounded-full bg-amber-100 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Documents Not Available Yet</h3>
            <p className="text-center text-muted-foreground">
              The administrator has not yet published the required documents. Please check back later.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="w-full bg-muted/10 border-dashed">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left w-full sm:w-auto">
              <h3 className="text-sm font-medium mb-1">Need to update company details?</h3>
              <p className="text-xs text-muted-foreground">You can modify your previous information</p>
            </div>
            <Button
              onClick={() => {
                // Get current registrations from localStorage
                const savedRegistrations = localStorage.getItem("registrations")
                if (savedRegistrations) {
                  const registrations = JSON.parse(savedRegistrations)

                  // Ensure registrations is an array
                  if (!Array.isArray(registrations)) {
                    console.error('Registrations is not an array:', registrations);
                    return;
                  }

                  const companyIndex = registrations.findIndex((reg: any) => reg._id === companyData._id)

                  if (companyIndex !== -1) {
                    // Update the current step to company-details (step 2) and set isUpdating flag
                    registrations[companyIndex].currentStep = "company-details"
                    registrations[companyIndex].isUpdating = true
                    localStorage.setItem("registrations", JSON.stringify(registrations))

                    // Dispatch event to notify of update
                    window.dispatchEvent(new CustomEvent("registration-updated"))
                  }
                }

                // Navigate to step 2 (company-details) if navigation function is provided
                if (onNavigateToStep) {
                  onNavigateToStep("company-details")
                }
              }}
              variant="outline"
              className="w-full sm:w-auto bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-700 border-yellow-200 hover:text-yellow-800"
            >
              <FileText className="h-4 w-4 mr-2" />
              Update Information
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Registration Documents</CardTitle>
          <CardDescription>Download the documents, sign them, and upload the signed versions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="download" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex w-full gap-2 mb-6">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm border text-sm md:text-base
                  ${activeTab === "download"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"}
                `}
                onClick={() => setActiveTab("download")}
                aria-selected={activeTab === "download"}
              >
                <Download className="h-4 w-4" />
                <span className="hidden md:inline">Download Documents</span>
                <span className="md:hidden">Download</span>
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm border text-sm md:text-base
                  ${activeTab === "upload"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"}
                `}
                onClick={() => setActiveTab("upload")}
                aria-selected={activeTab === "upload"}
              >
                <Upload className="h-4 w-4" />
                <span className="hidden md:inline">Upload Signed Documents</span>
                <span className="md:hidden">Upload</span>
              </button>
            </div>

            <div className="mt-6">
              <TabsContent
                value="download"
                className="mt-0 border-0 p-0 data-[state=inactive]:hidden"
              >
                <div className="grid grid-cols-1 gap-4">
                  <DocumentDownloadCard
                    title="FORM 1"
                    description="Application for incorporation"
                    document={documents.form1}
                    onDownload={() => handleDownload(documents.form1)}
                  />

                  <DocumentDownloadCard
                    title="Letter Of Engagement"
                    description="Engagement letter for company registration"
                    document={documents.letterOfEngagement}
                    onDownload={() => handleDownload(documents.letterOfEngagement)}
                  />

                  <DocumentDownloadCard
                    title="Articles of Association (AOA)"
                    description="Company's constitution document"
                    document={documents.aoa}
                    onDownload={() => handleDownload(documents.aoa)}
                  />

                  {/* Render Form 18 download cards for each director */}
                  {directors.map((director: any, idx: number) => (
                    <DocumentDownloadCard
                      key={idx}
                      title={`FORM 18 - ${director.name || director.fullName || `Director ${idx + 1}`}`}
                      description={`Consent to act as director (${director.name || director.fullName || `Director ${idx + 1}`})`}
                      document={documents.form18[idx]}
                      onDownload={() => handleDownload(documents.form18[idx])}
                    />
                  ))}

                  {/* Render Step 3 Additional Documents */}
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

                  {/* Render Other Additional Documents */}
                  {companyData.additionalDocuments && companyData.additionalDocuments.length > 0 && (
                    <>
                      <div className="col-span-full mt-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Other Additional Documents</h3>
                        <p className="text-sm text-gray-600">Additional documents provided by the administrator</p>
                      </div>
                      {companyData.additionalDocuments.map((doc: any, index: number) => (
                        <DocumentDownloadCard
                          key={`additional-${index}`}
                          title={doc.title}
                          description="Additional document"
                          document={doc}
                          onDownload={() => handleDownload(doc)}
                        />
                      ))}
                    </>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => setActiveTab("upload")}
                    disabled={!allDocumentsAvailable}
                    className="w-full sm:w-auto"
                  >
                    Continue to Upload
                  </Button>
                </div>
              </TabsContent>

              <TabsContent
                value="upload"
                className="mt-0 border-0 p-0 data-[state=inactive]:hidden"
              >
                <div className="grid grid-cols-1 gap-4">
                  <DocumentUploadCard
                    title="FORM 1"
                    description="Upload signed application form"
                    document={signedDocuments.form1}
                    onUpload={(file) => handleFileUpload("form1", file)}
                  />

                  <DocumentUploadCard
                    title="Letter Of Engagement"
                    description="Upload signed engagement letter"
                    document={signedDocuments.letterOfEngagement}
                    onUpload={(file) => handleFileUpload("letterOfEngagement", file)}
                  />

                  <DocumentUploadCard
                    title="Articles of Association (AOA)"
                    description="Upload signed AOA document"
                    document={signedDocuments.aoa}
                    onUpload={(file) => handleFileUpload("aoa", file)}
                  />

                  {/* Render Form 18 upload cards for each director */}
                  {directors.map((director: any, idx: number) => (
                    <DocumentUploadCard
                      key={idx}
                      title={`FORM 18 - ${director.name || director.fullName || `Director ${idx + 1}`}`}
                      description={`Upload signed director consent form (${director.name || director.fullName || `Director ${idx + 1}`})`}
                      document={signedDocuments.form18[idx]}
                      onUpload={(file) => handleForm18Upload(idx, file)}
                    />
                  ))}

                  {/* Address Proof Document Upload */}
                  <DocumentUploadCard
                    title={`Address Proof Document${!companyData.businessAddressNumber ? " (Required)" : " (Optional)"}`}
                    description={`${!companyData.businessAddressNumber
                      ? "Business address number not provided. Please upload a valid address proof document"
                      : "Upload address proof document if needed"} (e.g., Utility Bill, Grama Niladari Letter, Rent Agreement)`}
                    document={signedDocuments.addressProof}
                    onUpload={(file) => handleFileUpload("addressProof", file)}
                  />

                  {/* Render Additional Documents Upload */}
                  {companyData.additionalDocuments && companyData.additionalDocuments.length > 0 && (
                    <>
                      <div className="col-span-full mt-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Additional Documents</h3>
                        <p className="text-sm text-gray-600">Upload signed versions of additional documents</p>
                      </div>
                      {companyData.additionalDocuments.map((doc: any, index: number) => (
                        <DocumentUploadCard
                          key={`additional-upload-${index}`}
                          title={`Signed ${doc.title}`}
                          description={`Upload signed version of ${doc.title}`}
                          document={signedDocuments[`additional_${index}`] || null}
                          onUpload={(file) => handleFileUpload(`additional_${index}`, file)}
                        />
                      ))}
                    </>
                  )}

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
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end">
          {activeTab === "upload" && (
            <>

              <Button
                onClick={onSubmit}
                disabled={isSubmitting || !allSignedDocumentsUploaded}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {console.log('🔍 Customer Step 3 - Button state:', {
                  isSubmitting,
                  allSignedDocumentsUploaded,
                  disabled: isSubmitting || !allSignedDocumentsUploaded
                })}
                {(() => {
                  const selectedPackage = getPackageById(availablePackages, companyData.selectedPackage)

                  // Debug package detection
                  console.log('🔍 Customer Step 3 - Button text debugging:', {
                    selectedPackageId: companyData.selectedPackage,
                    availablePackages: Object.keys(availablePackages),
                    selectedPackage: selectedPackage,
                    isAdvanceBalance: isAdvanceBalancePackage(selectedPackage),
                    packageType: selectedPackage?.type,
                    advanceAmount: selectedPackage?.advanceAmount,
                    balanceAmount: selectedPackage?.balanceAmount,
                    buttonText: getSubmitButtonText(selectedPackage, isSubmitting),
                    packageName: selectedPackage?.name,
                    packageId: selectedPackage?.id
                  });

                  return getSubmitButtonText(selectedPackage, isSubmitting)
                })()}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Payment Section for Advance+Balance Packages */}
      {showPaymentSection && (() => {
        const selectedPackage = getPackageById(availablePackages, companyData.selectedPackage)
        if (!isAdvanceBalancePackage(selectedPackage)) return null

        // Check if balance payment was rejected
        const isBalancePaymentRejected = companyData.balancePaymentReceipt?.status === 'rejected'
        const isBalancePaymentPending = companyData.balancePaymentReceipt?.status === 'pending'
        const isBalancePaymentApproved = companyData.balancePaymentReceipt?.status === 'approved'

        return (
          <Card ref={balancePaymentRef} className="mt-6">
            <CardHeader>
              <CardTitle>Balance Payment</CardTitle>
              <CardDescription>
                Complete your balance payment to proceed with the incorporation process
                {isBalancePaymentRejected && (
                  <span className="block mt-1 text-red-600 font-medium">
                    Status: Rejected - Please resubmit
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Balance Payment Rejection Alert */}
              {isBalancePaymentRejected && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertTitle className="text-red-700">Balance Payment Rejected</AlertTitle>
                  <AlertDescription className="text-red-700">
                    Your previous balance payment receipt was rejected by the admin. Please review the payment details and upload a new receipt.
                    <br />
                    <strong>Common reasons for rejection:</strong>
                    <ul className="list-disc list-inside mt-2 ml-4">
                      <li>Receipt image is unclear or blurry</li>
                      <li>Payment amount doesn't match the required balance amount</li>
                      <li>Receipt is incomplete or missing important details</li>
                      <li>Wrong payment method or account details</li>
                    </ul>
                    <br />
                    <strong>Please ensure your new receipt is clear and shows the correct payment amount of Rs. {selectedPackage?.balanceAmount?.toLocaleString()}.</strong>
                  </AlertDescription>
                </Alert>
              )}

              {/* Payment Information Alert */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-700">Balance Payment Required</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Please transfer <b>Rs. {selectedPackage?.balanceAmount?.toLocaleString()}</b> as the balance payment for the <b>{selectedPackage?.name}</b> package.
                  <br />
                  You have already paid the advance amount of <b>Rs. {selectedPackage?.advanceAmount?.toLocaleString()}</b>.
                </AlertDescription>
              </Alert>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Payment Method</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bankTransfer" id="balance-bankTransfer" />
                    <Label htmlFor="balance-bankTransfer">Bank Transfer</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Bank transfer details are provided below for your balance payment.
                </p>
              </div>

              {/* Bank Transfer Details */}
              {paymentMethod === "bankTransfer" && (
                <div className="space-y-4">
                  {/* Multiple Bank Selection Cards (like step 1) */}
                  {Array.isArray(bankDetails) && bankDetails.length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {bankDetails.map((bank: any) => (
                        <Card
                          key={bank.id}
                          className={`cursor-pointer border-2 ${selectedBankId === bank.id ? "border-primary" : "border-gray-200"
                            }`}
                          onClick={() => setSelectedBankId(bank.id)}
                        >
                          <CardHeader>
                            <CardTitle className="text-base">{bank.bankName}</CardTitle>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Single Bank Transfer Details for Selected Bank */}
                  <BankTransferDetails
                    bankDetails={
                      Array.isArray(bankDetails) && bankDetails.length > 1
                        ? bankDetails.find((b: any) => b.id === selectedBankId)
                        : bankDetails?.[0]
                    }
                    onFileUpload={(file: File) => {
                      setPaymentReceipt(file)
                      saveBalancePaymentReceipt(file)
                    }}
                    uploadedFile={paymentReceipt}
                  />
                </div>
              )}

            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={onSubmit}
                disabled={isSubmitting || !paymentReceipt}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Processing..." : isBalancePaymentRejected ? "Resubmit Balance Payment" : "Complete Balance Payment"}
              </Button>
            </CardFooter>
          </Card>
        )
      })()}
    </div>
  )
}

// Document Download Card Component
function DocumentDownloadCard({
  title,
  description,
  document,
  onDownload,
}: {
  title: string
  description: string
  document: any
  onDownload: () => void
}) {
  if (!document) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="font-medium text-sm sm:text-base">{title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="mt-2 text-center py-4 text-muted-foreground">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs sm:text-sm">Not available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="font-medium text-sm sm:text-base">{title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
          </div>
          <CheckCircle className="h-5 w-5 text-green-500 hidden sm:block" />
        </div>

        <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[150px]">{document.name}</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 flex-1 sm:flex-none">
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs sm:text-sm">View</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Document Viewer - {title}</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium">
                        <FileText className="h-4 w-4 inline mr-1" />
                        {document.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {document.size ? `${(document.size / 1024).toFixed(2)} KB` : ""} •{" "}
                        {document.type || "Unknown type"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={onDownload}>
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                  </div>

                  <div className="border rounded-md p-2 bg-muted/20">
                    {document.type?.startsWith("image/") ? (
                      <img
                        src={document.url || "/placeholder.svg"}
                        alt={document.name}
                        className="max-w-full h-auto mx-auto"
                        style={{ maxHeight: "70vh" }}
                      />
                    ) : document.type === "application/pdf" ? (
                      <div className="aspect-video">
                        <iframe src={document.url || ""} className="w-full h-full" title="PDF Viewer"></iframe>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p>This file type cannot be previewed. Please download to view.</p>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 flex-1 sm:flex-none"
              onClick={onDownload}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs sm:text-sm">Download</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Document Upload Card Component
function DocumentUploadCard({
  title,
  description,
  document,
  onUpload,
}: {
  title: string
  description: string
  document: any
  onUpload: (file: File) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputId = `upload-${title.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <Card className={document ? "border-green-200 bg-green-50/30" : "border-dashed"}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="font-medium text-sm sm:text-base">{title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
          </div>
          {document && <CheckCircle2 className="h-5 w-5 text-green-500 hidden sm:block" />}
        </div>

        {document ? (
          <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[150px]">{document.name}</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 flex-1 sm:flex-none">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs sm:text-sm">View</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Document Viewer - {title}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium">
                          <FileText className="h-4 w-4 inline mr-1" />
                          {document.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {document.size ? `${(document.size / 1024).toFixed(2)} KB` : ""} • {document.type || "Unknown type"}
                        </p>
                      </div>
                    </div>

                    <div className="border rounded-md p-2 bg-muted/20">
                      {document.type?.startsWith("image/") ? (
                        <img
                          src={document.url || "/placeholder.svg"}
                          alt={document.name}
                          className="max-w-full h-auto mx-auto"
                          style={{ maxHeight: "70vh" }}
                        />
                      ) : document.type === "application/pdf" ? (
                        <div className="aspect-video">
                          <iframe
                            src={document.url || ""}
                            className="w-full h-full"
                            title="PDF Viewer"
                          ></iframe>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p>This file type cannot be previewed. Please download to view.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 flex-1 sm:flex-none"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs sm:text-sm">Replace</span>
              </Button>

              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files?.[0]) onUpload(e.target.files[0])
                }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-2 border-2 border-dashed rounded-md p-2">
            <input
              type="file"
              className="hidden"
              id={inputId}
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) onUpload(e.target.files[0])
              }}
            />
            <label
              htmlFor={inputId}
              className="flex flex-col sm:flex-row items-center justify-between gap-2 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <Upload className="h-4 w-4" />
                <p className="text-xs sm:text-sm text-muted-foreground">Upload signed {title}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 w-full sm:w-auto"
                onClick={(e) => {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }}
              >
                <span className="text-xs sm:text-sm">Select File</span>
              </Button>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
