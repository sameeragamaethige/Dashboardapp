"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusCircle, Trash2, Upload, FileText, User, CheckCircle2, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { settingsStorage } from "@/lib/local-storage"
import { LocalStorageService, DatabaseService } from "@/lib/database-service"
import { fileUploadClient } from "@/lib/file-upload-client"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]

const fileSchema = z
  .array(
    z.object({
      name: z.string(),
      type: z.string(),
      size: z.number(),
      url: z.string(),
    }),
  )
  .optional()
  .default([])

const shareholderSchema = z.object({
  type: z.string().min(1, "Shareholder type is required"),
  residency: z.string().min(1, "Residency status is required"),
  fullName: z.string().min(1, "Full name is required"),
  nicNumber: z.string().min(1, "NIC number is required"),
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string(),
  })).min(1, "At least one document is required"),
  email: z.string().email("Valid email is required").min(1, "Email is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  isDirector: z.boolean().optional(),
  shares: z.string().min(1, "Number of shares is required"),
})

const directorSchema = z.object({
  residency: z.string().min(1, "Residency status is required"),
  fullName: z.string().min(1, "Full name is required"),
  nicNumber: z.string().min(1, "NIC number is required"),
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string(),
  })).min(1, "At least one document is required"),
  email: z.string().email("Valid email is required").min(1, "Email is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  fromShareholder: z.boolean().optional(),
  shareholderIndex: z.number().optional(),
})

// Form schema: required field validation
const formSchema = z.object({
  companyNameEnglish: z.string().min(1, "Company name in English is required"),
  companyNameSinhala: z.string().min(1, "Company name in Sinhala is required"),
  isForeignOwned: z.string().min(1, "Please select if company is foreign owned"),
  businessAddressNumber: z.string().optional(),
  businessAddressStreet: z.string().min(1, "Business address street is required"),
  businessAddressCity: z.string().min(1, "Business address city is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  sharePrice: z.string().min(1, "Price of share is required"),
  numberOfShareholders: z.string().min(1, "Number of shareholders is required"),
  shareholders: z.array(shareholderSchema).min(1, "At least one shareholder is required"),
  makeSimpleBooksSecretary: z.string().min(1, "Please select company secretary option"),
  numberOfDirectors: z.string().optional(),
  directors: z.array(directorSchema).refine(
    (directors) => directors.length > 0,
    "At least one director is required (can be from shareholders)"
  ).refine(
    (directors) => directors.every(d =>
      !d.fromShareholder ? (
        d.fullName && d.fullName.trim().length > 0 &&
        d.nicNumber && d.nicNumber.trim().length > 0 &&
        d.email && d.email.trim().length > 0 &&
        d.contactNumber && d.contactNumber.trim().length > 0 &&
        d.documents && d.documents.length > 0
      ) : true
    ),
    "All non-shareholder director details including documents must be completed"
  ),
  importExportStatus: z.string().min(1, "Please select import/export status"),
  importsToAdd: z.string().optional(),
  exportsToAdd: z.string().optional(),
  otherBusinessActivities: z.string().min(1, "Please describe other business activities"),
  dramaSedakaDivision: z.string().min(1, "Grama Sevaka division is required"),
  businessEmail: z.string().email("Valid business email is required").min(1, "Business email is required"),
  businessContactNumber: z.string().min(1, "Business contact number is required"),
  companySecretary: z.boolean().optional(),
})

type CompanyDetailsProps = {
  companyData: any
  onComplete: (data: any) => void
  isResubmission?: boolean
}

// Helper to normalize companyData to match formSchema
function normalizeCompanyData(companyData: any): z.infer<typeof formSchema> {
  // Normalize shareholders
  const shareholders = (companyData.shareholders || []).map((s: any) => ({
    ...s,
    type: s.type || 'person',
    residency: s.residency || 'sri-lankan',
    fullName: s.fullName || '',
    nicNumber: s.nicNumber || '',
    email: s.email || '',
    contactNumber: s.contactNumber || '',
    shares: s.shares || '',
    isDirector: typeof s.isDirector === 'boolean' ? s.isDirector : false,
    documents: Array.isArray(s.documents) ? s.documents : [],
  }))
  // Normalize directors
  const directors = (companyData.directors || []).map((d: any) => ({
    ...d,
    residency: d.residency || 'sri-lankan',
    fullName: d.fullName || '',
    nicNumber: d.nicNumber || '',
    email: d.email || '',
    contactNumber: d.contactNumber || '',
    fromShareholder: typeof d.fromShareholder === 'boolean' ? d.fromShareholder : false,
    documents: Array.isArray(d.documents) ? d.documents : [],
    shareholderIndex: typeof d.shareholderIndex === 'number' ? d.shareholderIndex : undefined,
  }))
  return {
    companyNameEnglish: companyData.companyNameEnglish || '',
    companyNameSinhala: companyData.companyNameSinhala || '',
    isForeignOwned: companyData.isForeignOwned || 'no',
    businessAddressNumber: companyData.businessAddressNumber || '',
    businessAddressStreet: companyData.businessAddressStreet || '',
    businessAddressCity: companyData.businessAddressCity || '',
    postalCode: companyData.postalCode || '',
    sharePrice: companyData.sharePrice || '',
    numberOfShareholders: companyData.numberOfShareholders || '1',
    shareholders: shareholders.length > 0 ? shareholders : [{
      type: 'person',
      residency: 'sri-lankan',
      fullName: '',
      nicNumber: '',
      documents: [],
      email: '',
      contactNumber: '',
      shares: '',
      isDirector: false,
    }],
    makeSimpleBooksSecretary: companyData.makeSimpleBooksSecretary || 'yes',
    numberOfDirectors: companyData.numberOfDirectors || '0',
    directors: directors.length > 0 ? directors : [],
    importExportStatus: companyData.importExportStatus || 'imports-only',
    importsToAdd: companyData.importsToAdd || '',
    exportsToAdd: companyData.exportsToAdd || '',
    otherBusinessActivities: companyData.otherBusinessActivities || '',
    dramaSedakaDivision: companyData.dramaSedakaDivision || '',
    businessEmail: companyData.businessEmail || '',
    businessContactNumber: companyData.businessContactNumber || '',
    companySecretary: typeof companyData.companySecretary === 'boolean' ? companyData.companySecretary : false,
  }
}

export default function CompanyDetailsStep({ companyData, onComplete, isResubmission = false }: CompanyDetailsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [updatingDirectors, setUpdatingDirectors] = useState(false)
  const [appTitle, setAppTitle] = useState('')
  const [isManualSubmission, setIsManualSubmission] = useState(false)
  const [submissionLock, setSubmissionLock] = useState(false)
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0)

  // Load app title from settings
  useEffect(() => {
    try {
      const settings = settingsStorage.getSettings()
      setAppTitle(settings?.title || '')
    } catch (error) {
      console.error('Error loading app title:', error)
      setAppTitle('')
    }
  }, [])

  // Use normalized default values
  const normalizedDefaults = normalizeCompanyData(companyData)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: normalizedDefaults,
    mode: "onSubmit", // Only validate on submit, not on change
  })

  const {
    fields: shareholderFields,
    append: appendShareholder,
    remove: removeShareholder,
  } = useFieldArray({
    control: form.control as any, // ensure type compatibility
    name: "shareholders",
  })

  const {
    fields: directorFields,
    append: appendDirector,
    remove: removeDirector,
  } = useFieldArray({
    control: form.control as any, // ensure type compatibility
    name: "directors",
  })

  // Set initialization flag after initial render
  useEffect(() => {
    console.log("🔒 CompanyDetailsStep - Component initialized, submission locked");
    setIsInitialized(true)
    // Ensure submission is locked during initialization
    setSubmissionLock(true)
    setIsManualSubmission(false)

    // Unlock after a short delay to allow manual submissions
    const timer = setTimeout(() => {
      console.log("🔓 CompanyDetailsStep - Submission unlocked after initialization");
      setSubmissionLock(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Update shareholders when number changes
  useEffect(() => {
    if (!isInitialized) return

    const numberOfShareholders = form.watch("numberOfShareholders")
    const currentCount = shareholderFields.length
    const newCount = Number.parseInt(numberOfShareholders || "1", 10)

    if (newCount > currentCount) {
      // Add more shareholders without triggering validation
      for (let i = currentCount; i < newCount; i++) {
        appendShareholder({
          type: "person",
          residency: "sri-lankan",
          fullName: "",
          nicNumber: "",
          documents: [],
          email: "",
          contactNumber: "",
          isDirector: false,
          shares: "",
        })
      }
      // Clear any validation errors for the new shareholders
      setTimeout(() => {
        form.clearErrors(`shareholders.${newCount - 1}`)
      }, 100)
    } else if (newCount < currentCount) {
      // Remove excess shareholders
      for (let i = currentCount - 1; i >= newCount; i--) {
        removeShareholder(i)
      }
    }
  }, [
    form.watch("numberOfShareholders"),
    shareholderFields.length,
    appendShareholder,
    removeShareholder,
    isInitialized,
  ])

  // Update directors when shareholders change
  useEffect(() => {
    if (!isInitialized || updatingDirectors) return

    const updateDirectorsFromShareholders = () => {
      setUpdatingDirectors(true)
      try {
        const shareholders = form.getValues("shareholders") || []
        const currentDirectors = form.getValues("directors") || []

        // Count directors from shareholders
        const directorCount = shareholders.filter((s: any) => s.isDirector).length

        // Update the number of directors field
        form.setValue("numberOfDirectors", directorCount.toString(), { shouldValidate: false })

        // Keep existing non-shareholder directors
        const newDirectors = currentDirectors.filter((director: any) => !director.fromShareholder)

        // Add directors from shareholders
        shareholders.forEach((shareholder: any, index: number) => {
          if (shareholder.isDirector) {
            newDirectors.push({
              residency: shareholder.residency,
              fullName: shareholder.fullName,
              nicNumber: shareholder.nicNumber,
              documents: shareholder.documents || [],
              email: shareholder.email,
              contactNumber: shareholder.contactNumber,
              fromShareholder: true,
              shareholderIndex: index,
            })
          }
        })

        form.setValue("directors", newDirectors, { shouldValidate: false })
      } finally {
        setUpdatingDirectors(false)
      }
    }

    // Create a debounced version of the update function
    const timeoutId = setTimeout(updateDirectorsFromShareholders, 100)
    return () => clearTimeout(timeoutId)
  }, [form.watch("shareholders"), isInitialized, updatingDirectors, form])

  const handleAddDirector = () => {
    const currentCount = directorFields.length
    appendDirector({
      residency: "sri-lankan",
      fullName: "",
      nicNumber: "",
      documents: [],
      email: "",
      contactNumber: "",
      fromShareholder: false,
    })
    // Clear any validation errors for the new director
    setTimeout(() => {
      form.clearErrors(`directors.${currentCount}`)
    }, 100)
  }

  // Custom function to check if form is ready for submission
  const isFormReadyForSubmission = () => {
    const basicFieldsValid = form.getValues("companyNameEnglish") &&
      form.getValues("companyNameSinhala") &&
      form.getValues("isForeignOwned") &&
      form.getValues("businessAddressStreet") &&
      form.getValues("businessAddressCity") &&
      form.getValues("postalCode") &&
      form.getValues("numberOfShareholders") &&
      form.getValues("makeSimpleBooksSecretary") &&
      form.getValues("importExportStatus") &&
      form.getValues("otherBusinessActivities")

    const importExportValid = !(
      (form.getValues("importExportStatus") === "imports-only" || form.getValues("importExportStatus") === "both") &&
      !form.getValues("importsToAdd")
    ) && !(
      (form.getValues("importExportStatus") === "exports-only" || form.getValues("importExportStatus") === "both") &&
      !form.getValues("exportsToAdd")
    )

    const shareholdersValid = form.getValues("shareholders")?.length > 0 &&
      form.getValues("shareholders")?.every((s: any) =>
        s.type && s.residency && s.fullName && s.nicNumber && s.documents?.length > 0 && s.email && s.contactNumber && s.shares
      )

    const directorsValid = form.getValues("directors")?.length > 0 &&
      form.getValues("directors")?.every((d: any) =>
        d.fromShareholder || (
          d.residency && d.fullName && d.nicNumber && d.documents?.length > 0 && d.email && d.contactNumber
        )
      )

    return basicFieldsValid && importExportValid && shareholdersValid && directorsValid
  }

  // File upload handler for shareholders and directors
  // Helper function to scroll to first error
  const scrollToFirstError = () => {
    setTimeout(() => {
      // Get form errors from react-hook-form
      const formErrors = form.formState.errors;
      console.log("🔍 CompanyDetailsStep - Form errors:", formErrors);

      // Find the first error field by checking form errors in order
      let firstErrorPath = null;

      // Check for errors in order of form fields (top to bottom)
      const errorCheckOrder = [
        'companyNameEnglish',
        'companyNameSinhala',
        'isForeignOwned',
        'businessAddressNumber',
        'businessAddressStreet',
        'businessAddressCity',
        'postalCode',
        'sharePrice',
        'shareholders',
        'makeSimpleBooksSecretary',
        'directors',
        'importExportStatus',
        'importsToAdd',
        'exportsToAdd',
        'otherBusinessActivities',
        'dramaSedakaDivision',
        'businessEmail',
        'businessContactNumber'
      ];

      for (const fieldPath of errorCheckOrder) {
        if ((formErrors as any)[fieldPath]) {
          firstErrorPath = fieldPath;
          break;
        }
      }

      // Handle nested array errors (shareholders, directors)
      if (firstErrorPath === 'shareholders' && formErrors.shareholders) {
        for (let i = 0; i < (formErrors.shareholders as any)?.length; i++) {
          const shareholderErrors = (formErrors.shareholders as any)?.[i];
          if (shareholderErrors) {
            // Check shareholder fields in order
            const shareholderFields = ['type', 'residency', 'fullName', 'nicNumber', 'documents', 'email', 'contactNumber', 'shares'];
            for (const field of shareholderFields) {
              if (shareholderErrors[field]) {
                firstErrorPath = `shareholders.${i}.${field}`;
                break;
              }
            }
            break;
          }
        }
      }

      if (firstErrorPath === 'directors' && formErrors.directors) {
        for (let i = 0; i < (formErrors.directors as any)?.length; i++) {
          const directorErrors = (formErrors.directors as any)?.[i];
          if (directorErrors) {
            // Check director fields in order
            const directorFields = ['residency', 'fullName', 'nicNumber', 'documents', 'email', 'contactNumber'];
            for (const field of directorFields) {
              if (directorErrors[field]) {
                firstErrorPath = `directors.${i}.${field}`;
                break;
              }
            }
            break;
          }
        }
      }

      console.log("🎯 CompanyDetailsStep - First error path:", firstErrorPath);

      // Find the DOM element for the first error
      let targetElement = null;

      if (firstErrorPath) {
        console.log("🔍 CompanyDetailsStep - Looking for element with path:", firstErrorPath);

        // Try to find the input element by name attribute
        const inputSelector = `input[name="${firstErrorPath}"], textarea[name="${firstErrorPath}"], select[name="${firstErrorPath}"]`;
        targetElement = document.querySelector(inputSelector);
        console.log("🔍 CompanyDetailsStep - Input element found:", targetElement);

        // If not found, try to find the form item container
        if (!targetElement) {
          console.log("🔍 CompanyDetailsStep - Looking for form item with error message");
          // Look for the form item that contains this field
          const formItems = document.querySelectorAll('.space-y-3, .space-y-4, .space-y-6');
          for (const formItem of formItems) {
            const errorMessage = formItem.querySelector('.text-destructive');
            if (errorMessage) {
              targetElement = formItem;
              console.log("🔍 CompanyDetailsStep - Form item with error found:", formItem);
              break;
            }
          }
        }

        // Fallback: find the first error message element
        if (!targetElement) {
          console.log("🔍 CompanyDetailsStep - Using fallback: first error message");
          targetElement = document.querySelector('.text-destructive');
        }
      }

      if (targetElement) {
        console.log("🎯 CompanyDetailsStep - Scrolling to element:", targetElement);

        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });

        // Add a subtle highlight effect
        (targetElement as HTMLElement).style.transition = 'all 0.3s ease';
        (targetElement as HTMLElement).style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        (targetElement as HTMLElement).style.borderRadius = '4px';
        (targetElement as HTMLElement).style.padding = '4px';

        // Remove highlight after 2 seconds
        setTimeout(() => {
          (targetElement as HTMLElement).style.backgroundColor = '';
          (targetElement as HTMLElement).style.borderRadius = '';
          (targetElement as HTMLElement).style.padding = '';
        }, 2000);

        console.log("📜 CompanyDetailsStep - Scrolled to first error with highlight");
      } else {
        console.log("❌ CompanyDetailsStep - No error element found to scroll to");
      }
    }, 100);
  };

  const handleManualSave = async (): Promise<boolean> => {
    console.log("💾 CompanyDetailsStep - Manual save triggered");

    // Get current form values
    const values = form.getValues();
    console.log("📝 CompanyDetailsStep - Manual save values:", values);

    // Validate form
    const isValid = await form.trigger();
    if (!isValid) {
      console.log("❌ CompanyDetailsStep - Form validation failed, cannot save");
      scrollToFirstError();
      return false;
    }

    setIsSubmitting(true);
    try {
      // Validate that at least one director exists
      if (!values.directors || values.directors.length === 0) {
        form.setError("directors", {
          type: "required",
          message: "At least one director is required. Mark shareholders as directors or add additional directors."
        });
        setIsSubmitting(false);
        scrollToFirstError();
        return false;
      }

      // Require importsToAdd for 'imports-only' and 'both'
      if (values.importExportStatus === "imports-only" || values.importExportStatus === "both") {
        if (!values.importsToAdd || values.importsToAdd?.trim().length === 0) {
          form.setError("importsToAdd", {
            type: "required",
            message: "Please specify imports when import status is selected"
          });
          setIsSubmitting(false);
          scrollToFirstError();
          return false;
        }
      }

      // Require exportsToAdd for 'exports-only' and 'both'
      if (values.importExportStatus === "exports-only" || values.importExportStatus === "both") {
        if (!values.exportsToAdd || values.exportsToAdd?.trim().length === 0) {
          form.setError("exportsToAdd", {
            type: "required",
            message: "Please specify exports when export status is selected"
          });
          setIsSubmitting(false);
          scrollToFirstError();
          return false;
        }
      }

      // Process form values
      const processedValues = {
        ...values,
        shareholders: values.shareholders || [],
        directors: values.directors || [],
      };

      // Get the current registration ID from companyData
      const registrationId = companyData._id || companyData.id;
      if (!registrationId) {
        console.error("❌ CompanyDetailsStep - No registration ID found in companyData:", companyData);
        throw new Error("Registration ID not found");
      }

      console.log("💾 CompanyDetailsStep - Manual save to registration:", registrationId);

      // Get the current registration from database to preserve existing data
      let currentRegistration;
      try {
        currentRegistration = await LocalStorageService.getRegistrationById(registrationId);
        console.log("📋 CompanyDetailsStep - Current registration data:", currentRegistration);
      } catch (error) {
        console.error("❌ CompanyDetailsStep - Error fetching current registration:", error);
        // Continue with localStorage fallback
        const localStorageRegistrations = JSON.parse(localStorage.getItem("registrations") || "[]");
        currentRegistration = localStorageRegistrations.find((reg: any) => reg._id === registrationId || reg.id === registrationId);
      }

      if (!currentRegistration) {
        console.error("❌ CompanyDetailsStep - Current registration not found");
        throw new Error("Current registration not found");
      }

      // Create updated registration data
      const updatedRegistrationData = {
        ...currentRegistration,
        // Company details
        companyNameEnglish: processedValues.companyNameEnglish,
        companyNameSinhala: processedValues.companyNameSinhala,
        isForeignOwned: processedValues.isForeignOwned,
        businessAddressNumber: processedValues.businessAddressNumber,
        businessAddressStreet: processedValues.businessAddressStreet,
        businessAddressCity: processedValues.businessAddressCity,
        postalCode: processedValues.postalCode,
        sharePrice: processedValues.sharePrice,
        numberOfShareholders: processedValues.numberOfShareholders,
        shareholders: processedValues.shareholders,
        makeSimpleBooksSecretary: processedValues.makeSimpleBooksSecretary,
        numberOfDirectors: processedValues.numberOfDirectors,
        directors: processedValues.directors,
        importExportStatus: processedValues.importExportStatus,
        importsToAdd: processedValues.importsToAdd,
        exportsToAdd: processedValues.exportsToAdd,
        otherBusinessActivities: processedValues.otherBusinessActivities,
        dramaSedakaDivision: processedValues.dramaSedakaDivision,
        businessEmail: processedValues.businessEmail,
        businessContactNumber: processedValues.businessContactNumber,
        currentStep: 'documentation',
        status: 'documentation-processing',
        updatedAt: new Date().toISOString()
      };

      console.log("💾 CompanyDetailsStep - Manual save data:", JSON.stringify(updatedRegistrationData, null, 2));

      // Save to MySQL database
      try {
        console.log("💾 CompanyDetailsStep - Manual save to MySQL database...");
        console.log("💾 CompanyDetailsStep - Registration ID:", registrationId);
        console.log("💾 CompanyDetailsStep - Files in shareholders:", processedValues.shareholders?.map((s: any) => s.documents?.length || 0));
        console.log("💾 CompanyDetailsStep - Files in directors:", processedValues.directors?.map((d: any) => d.documents?.length || 0));

        await DatabaseService.updateRegistration(registrationId, updatedRegistrationData);
        console.log("✅ CompanyDetailsStep - Manual save to MySQL successful");
        console.log("✅ CompanyDetailsStep - All form data and file references saved to database");
      } catch (dbError) {
        console.error("❌ CompanyDetailsStep - Error manual save to MySQL:", dbError);
        // Fallback to localStorage if database fails
        console.log("📦 CompanyDetailsStep - Manual save fallback to localStorage");
        await LocalStorageService.saveRegistrationLocalOnly(updatedRegistrationData);
      }

      // Also save to localStorage for immediate access (no API calls)
      await LocalStorageService.saveRegistrationLocalOnly(updatedRegistrationData);

      // Dispatch registration update event for real-time updates
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "registration-updated",
            registrationId: registrationId,
            registration: updatedRegistrationData
          },
        })
      );

      console.log("✅ CompanyDetailsStep - Manual save completed successfully");
      console.log("✅ CompanyDetailsStep - Summary:");
      console.log("   📊 MySQL Database: Form data and file references saved");
      console.log("   📁 File Storage: All uploaded files saved to uploads/documents/");
      console.log("   💾 LocalStorage: Backup copy saved locally");
      console.log("   🔄 Event: Registration update event dispatched");

      return true; // Success
    } catch (error) {
      console.error("❌ CompanyDetailsStep - Error during manual save:", error as Error);
      return false; // Failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (files: FileList, registrationId: string, personType: 'shareholder' | 'director', personIndex: number) => {
    try {
      console.log(`📁 CompanyDetailsStep - Uploading files for ${personType} ${personIndex}:`, files);

      const uploadedFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type and size
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
          throw new Error(`File type ${file.type} is not supported. Please upload PDF, JPG, or PNG files.`);
        }

        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
        }

        // Upload file to file storage (uploads folder)
        console.log(`📁 CompanyDetailsStep - Uploading file to file storage: ${file.name}`);
        console.log(`📁 CompanyDetailsStep - File storage path: uploads/documents/${registrationId}_${personType}_${personIndex}`);

        const uploadResult = await fileUploadClient.uploadFile(file, `${registrationId}_${personType}_${personIndex}`);

        if (uploadResult.success && uploadResult.file) {
          uploadedFiles.push({
            name: file.name,
            type: file.type,
            size: file.size,
            url: uploadResult.file.url,
            id: uploadResult.file.id,
            uploadedAt: uploadResult.file.uploadedAt
          });
          console.log(`✅ CompanyDetailsStep - File uploaded successfully to file storage: ${file.name}`);
          console.log(`✅ CompanyDetailsStep - File URL: ${uploadResult.file.url}`);
          console.log(`✅ CompanyDetailsStep - File stored in: ${uploadResult.file.filePath}`);
        } else {
          throw new Error(`Failed to upload file ${file.name}: ${uploadResult.error}`);
        }
      }

      console.log(`✅ CompanyDetailsStep - All files uploaded for ${personType} ${personIndex}:`, uploadedFiles);
      return uploadedFiles;

    } catch (error) {
      console.error(`❌ CompanyDetailsStep - Error uploading files for ${personType} ${personIndex}:`, error);
      throw error;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("🚀 CompanyDetailsStep - Form submission triggered");
    console.log("🚀 Is manual submission flag set?", isManualSubmission);
    console.log("🚀 Is submission locked?", submissionLock);

    // Prevent any submissions if locked
    if (submissionLock) {
      console.log("❌ CompanyDetailsStep - Submission is locked, preventing submission");
      return;
    }

    // Prevent rapid successive submissions (debounce)
    const now = Date.now();
    if (now - lastSubmissionTime < 2000) { // 2 second debounce
      console.log("❌ CompanyDetailsStep - Submission too soon, preventing rapid submission");
      return;
    }

    // Only allow manual submissions
    if (!isManualSubmission) {
      console.log("❌ CompanyDetailsStep - Preventing automatic submission");
      return;
    }

    // Lock submission to prevent multiple calls
    setSubmissionLock(true);
    setLastSubmissionTime(Date.now());
    setIsSubmitting(true);
    try {
      console.log("🚫 CompanyDetailsStep - NO AUTOMATIC API CALLS - Form submission blocked");
      console.log("🚫 CompanyDetailsStep - User must use 'Continue to Next Step' button for manual saves");
      return; // Exit early - no API calls allowed
    } catch (error) {
      console.error("❌ CompanyDetailsStep - Error in blocked submission:", error);
    } finally {
      setSubmissionLock(false);
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          console.log("🛡️ CompanyDetailsStep - Form submit event intercepted and BLOCKED");
          console.log("🚫 CompanyDetailsStep - NO FORM SUBMISSIONS ALLOWED");
          e.preventDefault();
          return false;
        }}
        onKeyDown={(e) => {
          // Prevent form submission on Enter key unless manual submission is enabled
          if (e.key === 'Enter' && !isManualSubmission) {
            console.log("❌ CompanyDetailsStep - Preventing Enter key submission");
            e.preventDefault();
            return false;
          }
        }}
        className="space-y-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>Company Details {isResubmission && "(Updating)"}</CardTitle>
            <CardDescription>
              {isResubmission
                ? "Update your company details below. You can modify any information as needed."
                : "Please provide the details for your company registration"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Name Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="companyNameEnglish"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name (English) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name in English" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyNameSinhala"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name (සිංහල​) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name in Sinhala" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isForeignOwned"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Is the company a foreign owned company? <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="foreign-yes" />
                        <Label htmlFor="foreign-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="foreign-no" />
                        <Label htmlFor="foreign-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Business Address Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Address</h3>

              <FormField
                control={form.control}
                name="businessAddressNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address number (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessAddressStreet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address Street <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessAddressCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address City <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter postal code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Shares & Shareholder Details */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h3 className="text-lg font-medium">Shares & Shareholder Details</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentCount = shareholderFields.length
                      const newCount = currentCount + 1
                      form.setValue("numberOfShareholders", newCount.toString(), { shouldValidate: false })
                      appendShareholder({
                        type: "person",
                        residency: "sri-lankan",
                        fullName: "",
                        nicNumber: "",
                        documents: [],
                        email: "",
                        contactNumber: "",
                        isDirector: false,
                        shares: "",
                      })
                      // Clear any validation errors for the new shareholder
                      setTimeout(() => {
                        form.clearErrors(`shareholders.${currentCount}`)
                      }, 100)
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add More Shareholder
                  </Button>
                </div>
              </div>

              {/* General Share Price Field */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="sharePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What is the price of share? <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter price per share" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <h4 className="text-sm font-medium">Current Shareholders:</h4>
                  <Badge variant="outline" className="text-sm w-fit sm:w-auto self-end sm:self-auto">
                    Total: {shareholderFields.length}
                  </Badge>
                </div>

                {shareholderFields.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {shareholderFields.map((shareholder, idx) => (
                      <div key={idx} className="bg-muted/30 rounded-md px-3 py-1.5 text-sm flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{form.watch(`shareholders.${idx}.fullName`) || `Shareholder ${idx + 1}`}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    No shareholders added yet. Add shareholders to register them.
                  </p>
                )}
              </div>

              {/* Shareholder Forms */}
              {shareholderFields.map((field, index) => (
                <Card key={field.id} className="border-dashed -mx-4 sm:mx-0 sm:border-2">
                  <CardHeader className="pb-2 flex flex-row justify-between items-center px-4 sm:px-6">
                    <CardTitle className="text-base">Shareholder {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (shareholderFields.length > 1) {
                          removeShareholder(index)
                          form.setValue("numberOfShareholders", (shareholderFields.length - 1).toString(), { shouldValidate: false })
                        }
                      }}
                      className="h-8 w-8 p-0"
                      disabled={shareholderFields.length === 1}
                      aria-label="Remove Shareholder"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 sm:px-6">
                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.type`}
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Is this shareholder a person or a company? <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="person" id={`shareholder-type-person-${index}`} />
                                <Label htmlFor={`shareholder-type-person-${index}`}>Person</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="company" id={`shareholder-type-company-${index}`} />
                                <Label htmlFor={`shareholder-type-company-${index}`}>Company</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.residency`}
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Is your shareholder a Sri Lankan Resident or Foreign Resident? <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sri-lankan" id={`shareholder-residency-sl-${index}`} />
                                <Label htmlFor={`shareholder-residency-sl-${index}`}>Sri Lankan Resident</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="foreign" id={`shareholder-residency-foreign-${index}`} />
                                <Label htmlFor={`shareholder-residency-foreign-${index}`}>Foreign Resident</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.fullName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What is the full name of your shareholder according to their NIC? <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.nicNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What is your shareholder's NIC Number? <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter NIC number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.documents`}
                      render={({ field }) => (
                        <FormItem
                          className={`space-y-2 ${field.value && field.value.length > 0 ? "border-l-4 border-green-500 pl-3 rounded-l-md" : ""}`}
                        >
                          <FormLabel className="flex items-center justify-between">
                            <div className="flex items-center">
                              Please Upload a copy of your NIC/Passport/Driving Licence/BRC as an attachment below
                              <span className="text-destructive ml-1">*</span>
                            </div>
                            {field.value && field.value.length > 0 && (
                              <span className="text-xs text-green-600 flex items-center">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Files attached
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <div className="mt-2">
                              <div
                                className={`border-2 border-dashed rounded-md p-4 ${form.formState.errors.shareholders?.[index]?.documents
                                  ? "border-destructive bg-destructive/5"
                                  : field.value && field.value.length > 0
                                    ? "border-green-500/50 bg-green-50/50"
                                    : ""
                                  }`}
                              >
                                <Input
                                  type="file"
                                  id={`shareholder-documents-${index}`}
                                  multiple
                                  className="hidden"
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      try {
                                        console.log(`📁 CompanyDetailsStep - Uploading files for shareholder ${index}:`, e.target.files);

                                        const uploadedFiles = [];
                                        const registrationId = companyData._id || companyData.id;

                                        for (let i = 0; i < e.target.files.length; i++) {
                                          const file = e.target.files[i];

                                          // Validate file type and size
                                          if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
                                            throw new Error(`File type ${file.type} is not supported. Please upload PDF, JPG, or PNG files.`);
                                          }

                                          if (file.size > MAX_FILE_SIZE) {
                                            throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
                                          }

                                          // Upload file to file storage immediately
                                          const uploadResult = await fileUploadClient.uploadFile(
                                            file,
                                            `${registrationId}_shareholder_${index}`
                                          );

                                          if (uploadResult.success && uploadResult.file) {
                                            uploadedFiles.push({
                                              name: file.name,
                                              type: file.type,
                                              size: file.size,
                                              url: uploadResult.file.url,
                                              id: uploadResult.file.id,
                                              uploadedAt: uploadResult.file.uploadedAt,
                                              uploaded: true
                                            });
                                            console.log(`✅ CompanyDetailsStep - Shareholder ${index} file uploaded: ${file.name}`);
                                          } else {
                                            throw new Error(`Failed to upload file ${file.name}: ${uploadResult.error}`);
                                          }
                                        }

                                        // Update the form field value with uploaded file data
                                        field.onChange(uploadedFiles);

                                        console.log(`✅ CompanyDetailsStep - All files uploaded for shareholder ${index}:`, uploadedFiles);
                                      } catch (error) {
                                        console.error(`❌ CompanyDetailsStep - Error uploading files for shareholder ${index}:`, error as Error);
                                        // You might want to show a toast notification here
                                        alert(`Error uploading files: ${error.message}`);
                                      }
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`shareholder-documents-${index}`}
                                  className="flex flex-col items-center justify-center gap-2 py-4 cursor-pointer"
                                >
                                  <Upload
                                    className={`h-8 w-8 ${form.formState.errors.shareholders?.[index]?.documents
                                      ? "text-destructive"
                                      : field.value && field.value.length > 0
                                        ? "text-green-500"
                                        : "text-muted-foreground"
                                      }`}
                                  />
                                  <p
                                    className={`text-sm ${form.formState.errors.shareholders?.[index]?.documents
                                      ? "text-destructive"
                                      : field.value && field.value.length > 0
                                        ? "text-green-600"
                                        : "text-muted-foreground"
                                      }`}
                                  >
                                    {field.value && field.value.length > 0
                                      ? "Files attached - Click to change"
                                      : "Click to upload or drag and drop"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max. 5MB)</p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      document.getElementById(`shareholder-documents-${index}`)?.click()
                                    }}
                                    className={
                                      field.value && field.value.length > 0
                                        ? "border-green-500/50 text-green-600 hover:bg-green-50"
                                        : ""
                                    }
                                  >
                                    {field.value && field.value.length > 0 ? "Change Files" : "Select Files"}
                                  </Button>
                                </label>
                              </div>

                              {/* Display uploaded files */}
                              {field.value && field.value.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <p className="text-sm font-medium text-green-600">Selected Documents:</p>
                                  <div className="space-y-2">
                                    {field.value.map((file: any, fileIndex: number) => (
                                      <div
                                        key={fileIndex}
                                        className={`flex items-center p-2 border rounded-md ${file.uploaded
                                          ? 'bg-green-50 border-green-200'
                                          : 'bg-blue-50 border-blue-200'
                                          }`}
                                      >
                                        <FileText className={`h-4 w-4 mr-2 ${file.uploaded ? 'text-green-600' : 'text-blue-600'
                                          }`} />
                                        <span className={`text-sm ${file.uploaded ? 'text-green-700' : 'text-blue-700'
                                          }`}>
                                          {file.name}
                                        </span>
                                        {!file.uploaded && (
                                          <span className="ml-2 text-xs text-blue-600">
                                            (Will be uploaded on submit)
                                          </span>
                                        )}
                                        {file.uploaded && (
                                          <span className="ml-2 text-xs text-green-600">
                                            ✓ Uploaded
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What is your shareholder's email address? <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.contactNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What is your shareholder's contact number? <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.isDirector`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                // Update the checkbox value
                                field.onChange(checked)

                                // Immediately update directors list
                                const currentShareholder = form.getValues(`shareholders.${index}`)
                                const currentDirectors = form.getValues("directors") || []

                                if (checked) {
                                  // Add this shareholder as a director if checked
                                  const newDirectors = [
                                    ...currentDirectors.filter(
                                      (d) => !(d.fromShareholder && d.shareholderIndex === index),
                                    ),
                                    {
                                      residency: currentShareholder.residency,
                                      fullName: currentShareholder.fullName,
                                      nicNumber: currentShareholder.nicNumber,
                                      documents: currentShareholder.documents || [],
                                      email: currentShareholder.email,
                                      contactNumber: currentShareholder.contactNumber,
                                      fromShareholder: true,
                                      shareholderIndex: index,
                                    },
                                  ]

                                  // Update the directors array and count
                                  form.setValue("directors", newDirectors, { shouldValidate: false })
                                  form.setValue("numberOfDirectors", newDirectors.length.toString(), {
                                    shouldValidate: false,
                                  })
                                } else {
                                  // Remove this shareholder from directors if unchecked
                                  const filteredDirectors = currentDirectors.filter(
                                    (d) => !(d.fromShareholder && d.shareholderIndex === index),
                                  )

                                  // Update the directors array and count
                                  form.setValue("directors", filteredDirectors, { shouldValidate: false })
                                  form.setValue("numberOfDirectors", filteredDirectors.length.toString(), {
                                    shouldValidate: false,
                                  })
                                }
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>This shareholder is going to be a director</FormLabel>
                            <FormDescription>
                              Check this if the shareholder will also be a director of the company
                            </FormDescription>
                            {field.value && (
                              <p className="text-xs text-primary mt-1">
                                {form.watch(`shareholders.${index}.fullName`) || `Shareholder ${index + 1}`} will be
                                listed as a director
                              </p>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.shares`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How many shares will they have? <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Enter number of shares" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                  </CardContent>
                </Card>
              ))}

              <Separator />

              {/* Company Secretary Question */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-medium">Company Secretary</h3>
                <FormField
                  control={form.control}
                  name="makeSimpleBooksSecretary"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Do you want to make {appTitle} your company secretary? <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            // Update the field value
                            field.onChange(value)

                            // Also set the companySecretary field for admin dashboard
                            form.setValue("companySecretary", value === "yes", { shouldValidate: false })
                          }}
                          defaultValue={field.value}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="secretary-yes" />
                            <Label htmlFor="secretary-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="secretary-no" />
                            <Label htmlFor="secretary-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        {appTitle} can act as your company secretary, handling all secretarial duties and compliance
                        requirements.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Director Details */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <h3 className="text-lg font-medium">Director Details</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddDirector}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Add More Director
                  </Button>
                </div>

                {/* Replace the numberOfDirectors FormField with an improved current directors display */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <p className="text-sm font-medium">Current Directors:</p>
                    <Badge
                      variant={(form.watch("directors") || []).length === 0 ? "destructive" : "outline"}
                      className="text-sm w-fit sm:w-auto self-end sm:self-auto"
                    >
                      Total: {(form.watch("directors") || []).length}
                      {(form.watch("directors") || []).length === 0 && " (Required)"}
                    </Badge>
                  </div>
                  {(form.watch("directors") || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(form.watch("directors") || []).map((director: any, index: number) => (
                        <div
                          key={index}
                          className={`rounded-md px-3 py-1.5 text-sm flex items-center gap-1.5 ${director.fromShareholder ? "bg-primary/10 border border-primary/20" : "bg-muted/30"
                            }`}
                        >
                          <User
                            className={`h-3.5 w-3.5 ${director.fromShareholder ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <span>
                            {director.fullName || `Director ${index + 1}`}
                            {director.fromShareholder && (
                              <span className="ml-1 text-xs text-primary-foreground/70 bg-primary/20 px-1.5 py-0.5 rounded-full">
                                Shareholder
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No directors added yet. Mark shareholders as directors or add additional directors.
                    </p>
                  )}
                  {(form.watch("directors") || []).length === 0 && (
                    <p className="text-sm text-destructive">
                      You must add at least one director. Mark shareholders as directors or add additional directors.
                    </p>
                  )}
                </div>

                {/* Director Forms (only for non-shareholder directors) */}
                {directorFields.map((field, index) => {
                  // Skip rendering for directors that come from shareholders
                  if (form.watch(`directors.${index}.fromShareholder`)) {
                    return null
                  }

                  return (
                    <Card key={field.id} className="border-dashed -mx-4 sm:mx-0 sm:border-2">
                      <CardHeader className="pb-2 flex flex-row justify-between items-center px-4 sm:px-6">
                        <CardTitle className="text-base">Director {index + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDirector(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4 px-4 sm:px-6">
                        <FormField
                          control={form.control}
                          name={`directors.${index}.residency`}
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Is your director a Sri Lankan resident or foreign resident? <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="sri-lankan" id={`director-residency-sl-${index}`} />
                                    <Label htmlFor={`director-residency-sl-${index}`}>Sri Lankan Resident</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="foreign" id={`director-residency-foreign-${index}`} />
                                    <Label htmlFor={`director-residency-foreign-${index}`}>Foreign Resident</Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`directors.${index}.fullName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What is the full name of your director according to their NIC? <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Enter full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`directors.${index}.nicNumber`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What is your director's NIC Number? <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Enter NIC number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`directors.${index}.documents`}
                          render={({ field }) => (
                            <FormItem
                              className={`space-y-2 ${field.value && field.value.length > 0 ? "border-l-4 border-green-500 pl-3 rounded-l-md" : ""}`}
                            >
                              <FormLabel className="flex items-center justify-between">
                                <div className="flex items-center">
                                  Please Upload a copy of your NIC/Passport/Driving Licence as an attachment below
                                  <span className="text-destructive ml-1">*</span>
                                </div>
                                {field.value && field.value.length > 0 && (
                                  <span className="text-xs text-green-600 flex items-center">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Files attached
                                  </span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <div className="mt-2">
                                  <div
                                    className={`border-2 border-dashed rounded-md p-4 ${form.formState.errors.directors?.[index]?.documents
                                      ? "border-destructive bg-destructive/5"
                                      : field.value && field.value.length > 0
                                        ? "border-green-500/50 bg-green-50/50"
                                        : ""
                                      }`}
                                  >
                                    <Input
                                      type="file"
                                      id={`director-documents-${index}`}
                                      multiple
                                      className="hidden"
                                      onChange={async (e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          try {
                                            console.log(`📁 CompanyDetailsStep - Uploading files for director ${index}:`, e.target.files);

                                            const uploadedFiles = [];
                                            const registrationId = companyData._id || companyData.id;

                                            for (let i = 0; i < e.target.files.length; i++) {
                                              const file = e.target.files[i];

                                              // Validate file type and size
                                              if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
                                                throw new Error(`File type ${file.type} is not supported. Please upload PDF, JPG, or PNG files.`);
                                              }

                                              if (file.size > MAX_FILE_SIZE) {
                                                throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
                                              }

                                              // Upload file to file storage immediately
                                              const uploadResult = await fileUploadClient.uploadFile(
                                                file,
                                                `${registrationId}_director_${index}`
                                              );

                                              if (uploadResult.success && uploadResult.file) {
                                                uploadedFiles.push({
                                                  name: file.name,
                                                  type: file.type,
                                                  size: file.size,
                                                  url: uploadResult.file.url,
                                                  id: uploadResult.file.id,
                                                  uploadedAt: uploadResult.file.uploadedAt,
                                                  uploaded: true
                                                });
                                                console.log(`✅ CompanyDetailsStep - Director ${index} file uploaded: ${file.name}`);
                                              } else {
                                                throw new Error(`Failed to upload file ${file.name}: ${uploadResult.error}`);
                                              }
                                            }

                                            // Update the form field value with uploaded file data
                                            field.onChange(uploadedFiles);

                                            console.log(`✅ CompanyDetailsStep - All files uploaded for director ${index}:`, uploadedFiles);
                                          } catch (error) {
                                            console.error(`❌ CompanyDetailsStep - Error uploading files for director ${index}:`, error as Error);
                                            // You might want to show a toast notification here
                                            alert(`Error uploading files: ${error.message}`);
                                          }
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={`director-documents-${index}`}
                                      className="flex flex-col items-center justify-center gap-2 py-4 cursor-pointer"
                                    >
                                      <Upload
                                        className={`h-8 w-8 ${form.formState.errors.directors?.[index]?.documents
                                          ? "text-destructive"
                                          : field.value && field.value.length > 0
                                            ? "text-green-500"
                                            : "text-muted-foreground"
                                          }`}
                                      />
                                      <p
                                        className={`text-sm ${form.formState.errors.directors?.[index]?.documents
                                          ? "text-destructive"
                                          : field.value && field.value.length > 0
                                            ? "text-green-600"
                                            : "text-muted-foreground"
                                          }`}
                                      >
                                        {field.value && field.value.length > 0
                                          ? "Files attached - Click to change"
                                          : "Click to upload or drag and drop"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max. 5MB)</p>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          document.getElementById(`director-documents-${index}`)?.click()
                                        }}
                                        className={
                                          field.value && field.value.length > 0
                                            ? "border-green-500/50 text-green-600 hover:bg-green-50"
                                            : ""
                                        }
                                      >
                                        {field.value && field.value.length > 0 ? "Change Files" : "Select Files"}
                                      </Button>
                                    </label>
                                  </div>

                                  {/* Display uploaded files */}
                                  {field.value && field.value.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                      <p className="text-sm font-medium text-green-600">Selected Documents:</p>
                                      <div className="space-y-2">
                                        {field.value.map((file: any, fileIndex: number) => (
                                          <div
                                            key={fileIndex}
                                            className={`flex items-center p-2 border rounded-md ${file.uploaded
                                              ? 'bg-green-50 border-green-200'
                                              : 'bg-blue-50 border-blue-200'
                                              }`}
                                          >
                                            <FileText className={`h-4 w-4 mr-2 ${file.uploaded ? 'text-green-600' : 'text-blue-600'
                                              }`} />
                                            <span className={`text-sm ${file.uploaded ? 'text-green-700' : 'text-blue-700'
                                              }`}>
                                              {file.name}
                                            </span>
                                            {!file.uploaded && (
                                              <span className="ml-2 text-xs text-blue-600">
                                                (Will be uploaded on submit)
                                              </span>
                                            )}
                                            {file.uploaded && (
                                              <span className="ml-2 text-xs text-green-600">
                                                ✓ Uploaded
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`directors.${index}.email`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What is your director's email address? <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter email address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`directors.${index}.contactNumber`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What is your director's contact number? <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Enter contact number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Company Activities */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Company Activities</h3>

              <FormField
                control={form.control}
                name="importExportStatus"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="flex items-center">
                      Does your business import or export products?
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value)
                          // Clear import/export fields when "other" is selected
                          if (value === "other") {
                            form.setValue("importsToAdd", "", { shouldValidate: false })
                            form.setValue("exportsToAdd", "", { shouldValidate: false })
                          }
                        }}
                        value={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="imports-only" id="imports-only" />
                          <Label htmlFor="imports-only">Imports Only</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="exports-only" id="exports-only" />
                          <Label htmlFor="exports-only">Exports Only</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="both" id="both-import-export" />
                          <Label htmlFor="both-import-export">Both</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other-import-export" />
                          <Label htmlFor="other-import-export">Other</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditionally render imports field */}
              {(form.watch("importExportStatus") === "imports-only" || form.watch("importExportStatus") === "both") && (
                <FormField
                  control={form.control}
                  name="importsToAdd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imports that need to be added <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Specify imports (required)" {...field} />
                      </FormControl>
                      <FormDescription>List any specific imports your business will handle</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Conditionally render exports field */}
              {(form.watch("importExportStatus") === "exports-only" || form.watch("importExportStatus") === "both") && (
                <FormField
                  control={form.control}
                  name="exportsToAdd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exports that need to be added <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Specify exports (required)" {...field} />
                      </FormControl>
                      <FormDescription>List any specific exports your business will handle</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="otherBusinessActivities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Are there any other business activities the company will undertake?
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe other business activities" className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormDescription>
                      Describe any additional business activities your company will undertake.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dramaSedakaDivision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      What is the Grama Sevaka division of the business?
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Grama Sevaka division" {...field} />
                    </FormControl>
                    <FormDescription>
                      Specify the administrative division where your business is located. This information is required
                      for registration.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Contact Information</h3>

              <FormField
                control={form.control}
                name="businessEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter business email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessContactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Contact Number <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter business contact number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              disabled={isSubmitting}
              className="ml-auto"
              onClick={async () => {
                console.log("🖱️ CompanyDetailsStep - Continue to Next Step button clicked");
                console.log("💾 CompanyDetailsStep - Saving data and proceeding to next step");

                // First validate and save all data to MySQL and file storage
                const saveSuccess = await handleManualSave();

                // Only proceed to next step if save was successful
                if (saveSuccess) {
                  const currentValues = form.getValues();
                  console.log("🚀 CompanyDetailsStep - Proceeding to next step with values:", currentValues);
                  onComplete(currentValues);
                } else {
                  console.log("❌ CompanyDetailsStep - Save failed, not proceeding to next step");
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving & Continuing...
                </>
              ) : (
                <>
                  Continue to Next Step
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
