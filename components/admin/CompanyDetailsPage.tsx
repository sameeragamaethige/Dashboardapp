"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  CheckCircle,
  XCircle,
  X,
  Calendar,
  Clock,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  User,
  Briefcase,
  FileText,
  ArrowLeft,
  Eye,
  Download,
  FileCheck,
  Upload,
  RefreshCw,
  Shield,
  ShieldAlert,
  Plus,
  Trash2,
} from "lucide-react"
import PaymentReceiptViewer from "./PaymentReceiptViewer"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { canManageRegistrations, isAdmin } from "@/lib/auth-utils"
import { settingsStorage } from "@/lib/local-storage"
import { LocalStorageService } from "@/lib/database-service"
import type React from "react"
import type { User as UserType } from "@/lib/utils"
import { getPackageById, type Package } from "@/lib/package-utils"
import type { PackagePlan } from "@/components/admin/PackagesManager"

type CompanyDetailsPageProps = {
  companyId: string
  navigateTo: (page: string) => void
  onApprovePayment: (companyId: string) => Promise<void>
  onRejectPayment: (companyId: string) => Promise<void>
  onApproveDetails: (companyId: string) => Promise<void>
  onApproveDocuments: (companyId: string) => Promise<void>
  user?: UserType // Make user prop optional
}

// Using LocalStorageService for database operations

// DocumentUploadCard Component
const DocumentUploadCard = ({ title, description, document, onUpload, onDelete, disabled, showReplace }: any) => {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputId = `${title.replace(/\s+/g, "-").toLowerCase()}-replace-upload`;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0]
    if (file) {
      setIsUploading(true)
      try {
        await onUpload(file)
      } catch (error) {
        console.error('Upload failed:', error)
      } finally {
        setIsUploading(false)
      }
    }
  }

  // Use the same style for all document cards, including Form 18
  return (
    <Card className={document ? "border-green-200 bg-green-50/30" : "border-dashed"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {document ? (
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-sm">{document.name}</span>
            </div>
            <div className="flex gap-2 items-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (document.url) {
                            const link = document.createElement("a")
                            link.href = document.url
                            link.download = document.name
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }
                        }}
                      >
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
              {showReplace && !disabled && (
                <>
                  <input
                    type="file"
                    id={fileInputId}
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={disabled}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 ml-2"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    Replace
                  </Button>
                </>
              )}
              {onDelete && !disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <input
              type="file"
              id={`${title}-upload`}
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled}
            />
            <label htmlFor={`${title}-upload`} className={`w-full ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
              <Button variant="outline" asChild disabled={disabled || isUploading}>
                <div className="flex items-center justify-center w-full">
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" /> Upload {title}
                    </>
                  )}
                </div>
              </Button>
            </label>
            {isUploading && (
              <p className="mt-2 text-sm text-blue-600">
                Uploading to database and file storage...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function CompanyDetailsPage({
  companyId,
  navigateTo,
  onApprovePayment,
  onRejectPayment,
  onApproveDetails,
  onApproveDocuments,
  user,
}: CompanyDetailsPageProps) {
  const { toast } = useToast()
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [viewStep, setViewStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [availablePackages, setAvailablePackages] = useState<PackagePlan[]>([])
  const [documentsChanged, setDocumentsChanged] = useState(false)
  // New: Store pending documents before publishing
  const [pendingDocuments, setPendingDocuments] = useState<any>({})
  // New: Store pending step 4 documents (incorporation certificate and additional documents)
  const [pendingStep4Documents, setPendingStep4Documents] = useState<any>({})
  // New: Store pending step 3 additional documents
  const [pendingStep3Documents, setPendingStep3Documents] = useState<any>({})
  const [completeRegistrationClicked, setCompleteRegistrationClicked] = useState(false)
  const [documentsSubmitted, setDocumentsSubmitted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)
  const [showCompleteSuccess, setShowCompleteSuccess] = useState(false)
  const [appTitle, setAppTitle] = useState('')
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false)
  const [additionalDocumentTitle, setAdditionalDocumentTitle] = useState('')
  const [additionalDocumentFile, setAdditionalDocumentFile] = useState<File | null>(null)

  // Add Document Dialog State for Step 3
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false)
  const [newDocument, setNewDocument] = useState({
    title: "",
    file: null as File | null
  })

  // Track balance payment approval status for enabling "Continue to Incorporation" button
  const [balancePaymentApproved, setBalancePaymentApproved] = useState(false)

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

  // Check if user can manage registrations (admin only)
  const canManage = user ? canManageRegistrations(user) : false

  useEffect(() => {
    // Load company data from database
    const loadCompanyData = async () => {
      try {
        console.log('🔍 Loading company data for admin view:', companyId)
        const registration = await LocalStorageService.getRegistrationById(companyId)
        if (registration) {
          console.log('✅ Company data loaded:', registration)
          setSelectedCompany(registration)
          // Determine which step to show
          const activeStep = determineActiveStep(registration)
          setViewStep(activeStep)

          // Initialize balance payment approval state
          const isBalancePaymentApproved = registration.balancePaymentReceipt?.status === 'approved'
          setBalancePaymentApproved(isBalancePaymentApproved)

          // Initialize documents submitted state
          const isDocumentsSubmitted = registration.status === 'completed' || registration.documentsSubmittedAt || registration.incorporationCertificate
          setDocumentsSubmitted(isDocumentsSubmitted)
        } else {
          console.log('⚠️ Company not found in database, trying localStorage fallback')
          // Fallback to localStorage
          const savedRegistrations = localStorage.getItem("registrations")
          if (savedRegistrations) {
            const registrations = JSON.parse(savedRegistrations)
            const fallbackRegistration = registrations.find((reg: any) => reg._id === companyId)
            if (fallbackRegistration) {
              console.log('✅ Company found in localStorage fallback')
              setSelectedCompany(fallbackRegistration)
              const activeStep = determineActiveStep(fallbackRegistration)
              setViewStep(activeStep)
              const isBalancePaymentApproved = fallbackRegistration.balancePaymentReceipt?.status === 'approved'
              setBalancePaymentApproved(isBalancePaymentApproved)

              // Initialize documents submitted state
              const isDocumentsSubmitted = fallbackRegistration.status === 'completed' || fallbackRegistration.documentsSubmittedAt || fallbackRegistration.incorporationCertificate
              setDocumentsSubmitted(isDocumentsSubmitted)
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading company data:', error)
        // Fallback to localStorage
        const savedRegistrations = localStorage.getItem("registrations")
        if (savedRegistrations) {
          const registrations = JSON.parse(savedRegistrations)
          const fallbackRegistration = registrations.find((reg: any) => reg._id === companyId)
          if (fallbackRegistration) {
            setSelectedCompany(fallbackRegistration)
            const activeStep = determineActiveStep(fallbackRegistration)
            setViewStep(activeStep)
            const isBalancePaymentApproved = fallbackRegistration.balancePaymentReceipt?.status === 'approved'
            setBalancePaymentApproved(isBalancePaymentApproved)

            // Initialize documents submitted state
            const isDocumentsSubmitted = fallbackRegistration.status === 'completed' || fallbackRegistration.documentsSubmittedAt || fallbackRegistration.incorporationCertificate
            setDocumentsSubmitted(isDocumentsSubmitted)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadCompanyData()

    // Load available packages from database with fallback to localStorage
    const loadPackages = async () => {
      try {
        // First try to load from database
        const packages = await LocalStorageService.getPackages()
        console.log('📦 Admin - Raw packages from database:', packages)
        if (packages && packages.length > 0) {
          setAvailablePackages(packages)
          console.log('✅ Loaded packages from database:', packages.length)
          console.log('📦 Admin - Package details:', packages.map(pkg => ({ id: pkg.id, name: pkg.name, type: pkg.type })))
        } else {
          // Fallback to localStorage
          const savedPackages = localStorage.getItem("packages")
          if (savedPackages) {
            const packages = JSON.parse(savedPackages) as PackagePlan[]
            setAvailablePackages(packages)
            console.log('📦 Loaded packages from localStorage fallback:', packages.length)
          }
        }
      } catch (error) {
        console.error('❌ Error loading packages from database, using localStorage:', error)
        // Fallback to localStorage
        const savedPackages = localStorage.getItem("packages")
        if (savedPackages) {
          try {
            const packages = JSON.parse(savedPackages) as PackagePlan[]
            setAvailablePackages(packages)
            console.log('📦 Loaded packages from localStorage fallback:', packages.length)
          } catch (localError) {
            console.error('❌ Error loading packages from localStorage:', localError)
            setAvailablePackages([])
          }
        }
      }
    }

    loadPackages()

    // Listen for updates to the registration data
    const handleRegistrationUpdate = async (event: any) => {
      console.log('🔄 Registration update event received in admin view:', event.detail)

      // Check if this update should prevent navigation
      const shouldPreventNavigation = event.detail && event.detail.preventNavigation

      if (shouldPreventNavigation) {
        // Just reload the company data without resetting the view step
        try {
          const registration = await LocalStorageService.getRegistrationById(companyId)
          if (registration) {
            setSelectedCompany(registration)
            // Update balance payment approval state
            const isBalancePaymentApproved = registration.balancePaymentReceipt?.status === 'approved'
            setBalancePaymentApproved(isBalancePaymentApproved)
          }
        } catch (error) {
          console.error('❌ Error reloading company data:', error)
        }
      } else {
        // Normal behavior - reload data and potentially change step
        loadCompanyData()

        // If payment was just approved, redirect to step 2
        if (event.detail && event.detail.type === "payment-approved") {
          setViewStep(2)
        }
      }

      // Special handling for balance payment rejection - prevent admin navigation
      if (event.detail && event.detail.type === "balance-payment-rejected") {
        // Just update the company data without changing the view step
        try {
          const registration = await LocalStorageService.getRegistrationById(companyId)
          if (registration) {
            setSelectedCompany(registration)
            // Update balance payment approval state
            setBalancePaymentApproved(false)
          }
        } catch (error) {
          console.error('❌ Error reloading company data for balance payment rejection:', error)
        }
      }
    }

    window.addEventListener("registration-updated", handleRegistrationUpdate)

    return () => {
      window.removeEventListener("registration-updated", handleRegistrationUpdate)
    }
  }, [companyId])

  // Persist completeRegistrationClicked in localStorage per company
  useEffect(() => {
    if (!companyId) return;
    // On mount, check if registration was completed for this company
    const completed = localStorage.getItem(`completeRegistrationClicked_${companyId}`)
    setCompleteRegistrationClicked(completed === "true")
  }, [companyId])

  // Function to determine the active step based on company status
  const determineActiveStep = (company: any) => {
    if (company.status === "payment-processing" || company.status === "payment-rejected") {
      return 1
    } else if (company.status === "documentation-processing" && !company.detailsApproved) {
      return 2
    } else if (company.status === "incorporation-processing" && !company.documentsApproved) {
      return 3
    } else if (company.status === "documents-published") {
      return 3 // Stay on step 3 when documents are published
    } else if (company.status === "documents-submitted" || company.status === "incorporation-processing" || company.status === "completed") {
      return 4
    }
    return 1 // Default to step 1
  }

  // Function to get package information with enhanced price display
  const getPackageInfo = (selectedPackage: string) => {
    // First try to find in available packages (from database)
    let pkgObj = availablePackages.find((pkg: any) =>
      pkg.name === selectedPackage || pkg.id === selectedPackage
    );

    // Fallback to localStorage if not found
    if (!pkgObj) {
      try {
        const pkgs = typeof window !== "undefined" ? localStorage.getItem("packages") : null;
        if (pkgs) {
          const allPackages = JSON.parse(pkgs);
          pkgObj = allPackages.find((p: any) =>
            p.name === selectedPackage || p.id === selectedPackage
          );
        }
      } catch (error) {
        console.error('Error loading packages from localStorage:', error);
      }
    }

    return pkgObj;
  };

  // Function to render status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "payment-processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Payment Processing
          </Badge>
        )
      case "payment-rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Payment Rejected
          </Badge>
        )
      case "documentation-processing":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Documentation Processing
          </Badge>
        )
      case "incorporation-processing":
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
            Incorporation Processing
          </Badge>
        )
      case "documents-submitted":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Documents Submitted
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Payment Processing
          </Badge>
        )
    }
  }

  // Function to render step status
  const renderStepStatus = (step: number, activeStep: number, status: string) => {
    if (step < activeStep) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
          <CheckCircle className="h-5 w-5" />
        </div>
      )
    } else if (step === activeStep) {
      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">{step}</div>
    } else {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
          {step}
        </div>
      )
    }
  }

  // Function to render shareholder information
  const renderShareholderInfo = (shareholder: any, index: number) => {
    if (!shareholder) return null

    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <User className="h-4 w-4 mr-2 text-primary" />
            Shareholder {index + 1}
          </CardTitle>
          <CardDescription>
            {shareholder.type === "person" ? "Individual" : "Company"} •
            {shareholder.residency === "sri-lankan" ? " Sri Lankan Resident" : " Foreign Resident"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{shareholder.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NIC/Passport</p>
              <p className="font-medium">{shareholder.nicNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{shareholder.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact Number</p>
              <p className="font-medium">{shareholder.contactNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Is Director</p>
              <p className="font-medium">{shareholder.isDirector ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shares</p>
              <p className="font-medium">{shareholder.shares}</p>
            </div>
          </div>

          {shareholder.documents && shareholder.documents.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h5 className="text-sm font-medium mb-2">Uploaded Documents</h5>
              <div className="space-y-2">
                {shareholder.documents.map((doc: any, docIndex: number) => (
                  <div key={docIndex} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">{doc.name}</span>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Document Viewer</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm font-medium">
                                <FileText className="h-4 w-4 inline mr-1" />
                                {doc.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : ""} • {doc.type || "Unknown type"}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (doc.url) {
                                  const link = document.createElement("a")
                                  link.href = doc.url
                                  link.download = doc.name
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                } else if (doc.data) {
                                  const blob = new Blob([doc.data], { type: doc.type || "application/octet-stream" })
                                  const url = URL.createObjectURL(blob)
                                  const link = document.createElement("a")
                                  link.href = url
                                  link.download = doc.name
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                  URL.revokeObjectURL(url)
                                }
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" /> Download
                            </Button>
                          </div>

                          <div className="border rounded-md p-2 bg-muted/20">
                            {doc.type?.startsWith("image/") ? (
                              <img
                                src={
                                  doc.url ||
                                  (doc.data
                                    ? URL.createObjectURL(new Blob([doc.data], { type: doc.type }))
                                    : "/placeholder.svg")
                                }
                                alt={doc.name}
                                className="max-w-full h-auto mx-auto"
                                style={{ maxHeight: "70vh" }}
                              />
                            ) : doc.type === "application/pdf" ? (
                              <div className="aspect-video">
                                <iframe
                                  src={
                                    doc.url ||
                                    (doc.data ? URL.createObjectURL(new Blob([doc.data], { type: doc.type })) : "")
                                  }
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Function to render director information
  const renderDirectorInfo = (director: any, index: number) => {
    if (!director) return null

    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-primary" />
            Director {index + 1} {director.fromShareholder && <Badge className="ml-2 text-xs">Shareholder</Badge>}
          </CardTitle>
          <CardDescription>
            {director.residency === "sri-lankan" ? "Sri Lankan Resident" : "Foreign Resident"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{director.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NIC/Passport</p>
              <p className="font-medium">{director.nicNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{director.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact Number</p>
              <p className="font-medium">{director.contactNumber}</p>
            </div>
          </div>

          {!director.fromShareholder && director.documents && director.documents.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h5 className="text-sm font-medium mb-2">Uploaded Documents</h5>
              <div className="space-y-2">
                {director.documents.map((doc: any, docIndex: number) => (
                  <div key={docIndex} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">{doc.name}</span>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Document Viewer</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm font-medium">
                                <FileText className="h-4 w-4 inline mr-1" />
                                {doc.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : ""} • {doc.type || "Unknown type"}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (doc.url) {
                                  const link = document.createElement("a")
                                  link.href = doc.url
                                  link.download = doc.name
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                } else if (doc.data) {
                                  const blob = new Blob([doc.data], { type: doc.type || "application/octet-stream" })
                                  const url = URL.createObjectURL(blob)
                                  const link = document.createElement("a")
                                  link.href = url
                                  link.download = doc.name
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                  URL.revokeObjectURL(url)
                                }
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" /> Download
                            </Button>
                          </div>

                          <div className="border rounded-md p-2 bg-muted/20">
                            {doc.type?.startsWith("image/") ? (
                              <img
                                src={
                                  doc.url ||
                                  (doc.data
                                    ? URL.createObjectURL(new Blob([doc.data], { type: doc.type }))
                                    : "/placeholder.svg")
                                }
                                alt={doc.name}
                                className="max-w-full h-auto mx-auto"
                                style={{ maxHeight: "70vh" }}
                              />
                            ) : doc.type === "application/pdf" ? (
                              <div className="aspect-video">
                                <iframe
                                  src={
                                    doc.url ||
                                    (doc.data ? URL.createObjectURL(new Blob([doc.data], { type: doc.type })) : "")
                                  }
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Function to handle document upload
  const handleDocumentUpload = async (companyId: string, documentType: string, file: File, index?: number) => {
    try {
      // For incorporation certificate, store temporarily without saving to file storage
      if (documentType === "incorporationCertificate") {
        console.log(`📁 Admin - Storing incorporation certificate temporarily: ${file.name}`);

        const document = {
          name: file.name,
          type: file.type,
          size: file.size,
          file: file, // Store the actual file object temporarily
          uploadedAt: new Date().toISOString(),
          // These will be set when actually saved to file storage
          url: null,
          filePath: null,
          id: null,
        }

        setPendingStep4Documents((prev: any) => ({
          ...prev,
          incorporationCertificate: document
        }))

        console.log(`✅ Incorporation certificate stored temporarily: ${file.name}`)
        return
      }

      // For step 3 documents, immediately upload to file storage and database
      console.log(`📁 Admin - Immediately uploading step 3 document: ${documentType}, file: ${file.name}`);

      // Import the file upload client
      const { fileUploadClient } = await import('@/lib/file-upload-client')

      // Upload file to file storage immediately
      const uploadResult = await fileUploadClient.uploadFile(file, companyId);

      if (!uploadResult.success || !uploadResult.file) {
        throw new Error(`Failed to upload file to storage: ${uploadResult.error}`);
      }

      console.log(`✅ File uploaded to storage successfully: ${file.name}`);

      // Create document object with file storage data
      const document = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: uploadResult.file.url,
        filePath: uploadResult.file.filePath,
        id: uploadResult.file.id,
        uploadedAt: uploadResult.file.uploadedAt,
      }

      // Update local state immediately
      setSelectedCompany((prev: any) => {
        const updated = { ...prev }
        if (documentType === "form18" && typeof index === "number") {
          updated.form18 = Array.isArray(prev.form18)
            ? [...prev.form18]
            : Array.isArray(prev.directors)
              ? prev.directors.map(() => null)
              : []
          updated.form18[index] = document
        } else {
          updated[documentType] = document
        }
        return updated
      })

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

      if (!response.ok) {
        throw new Error(`Failed to save to database: ${response.statusText}`);
      }

      console.log(`✅ Document saved to database successfully: ${file.name}`);

    } catch (error) {
      console.error("Error uploading document:", error)
      throw error; // Re-throw to be handled by the calling component
    }
  }

  // Function to handle additional document upload
  const handleAdditionalDocumentUpload = async (companyId: string, title: string, file: File) => {
    try {
      console.log(`📁 Admin - Storing step 3 additional document temporarily: ${file.name}`);

      const document = {
        name: file.name,
        type: file.type,
        size: file.size,
        file: file, // Store the actual file object temporarily
        title: title,
        uploadedAt: new Date().toISOString(),
        // These will be set when actually saved to file storage
        url: null,
        filePath: null,
        id: null,
      }

      setPendingStep3Documents((prev: any) => ({
        ...prev,
        step3AdditionalDoc: [...(prev.step3AdditionalDoc || []), document]
      }))

      console.log(`✅ Step 3 additional document stored temporarily: ${file.name}`)
    } catch (error) {
      console.error("Error storing step 3 additional document:", error)
    }
  }

  // Function to save ALL step3 documents instantly to MySQL and file storage
  const saveAllStep3DocumentsToDatabase = async (companyId: string) => {
    try {
      console.log('📝 Admin - Saving ALL step3 documents to MySQL database...');

      // Import the file upload client
      const { fileUploadClient } = await import('@/lib/file-upload-client')

      // Get current registration from MySQL database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error('❌ Failed to fetch registration from database:', response.status, response.statusText);
        return false;
      }

      const currentRegistration = await response.json();
      console.log('📝 Admin - Current registration from database:', currentRegistration);

      let updatedRegistration = { ...currentRegistration };
      let hasChanges = false;

      // Process form1
      if (pendingDocuments.form1 && pendingDocuments.form1.file) {
        console.log('📁 Processing form1 document...');
        const uploadResult = await fileUploadClient.uploadFile(pendingDocuments.form1.file, companyId);
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.form1 = {
            ...pendingDocuments.form1,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined // Remove the file object
          };
          hasChanges = true;
          console.log('✅ Form1 uploaded and saved to database');
        }
      }

      // Process letterOfEngagement
      if (pendingDocuments.letterOfEngagement && pendingDocuments.letterOfEngagement.file) {
        console.log('📁 Processing letter of engagement document...');
        const uploadResult = await fileUploadClient.uploadFile(pendingDocuments.letterOfEngagement.file, companyId);
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.letterOfEngagement = {
            ...pendingDocuments.letterOfEngagement,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined // Remove the file object
          };
          hasChanges = true;
          console.log('✅ Letter of engagement uploaded and saved to database');
        }
      }

      // Process aoa (articles of association)
      if (pendingDocuments.aoa && pendingDocuments.aoa.file) {
        console.log('📁 Processing articles of association document...');
        const uploadResult = await fileUploadClient.uploadFile(pendingDocuments.aoa.file, companyId);
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.aoa = {
            ...pendingDocuments.aoa,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined // Remove the file object
          };
          hasChanges = true;
          console.log('✅ Articles of association uploaded and saved to database');
        }
      }

      // Process form18 array
      if (pendingDocuments.form18 && Array.isArray(pendingDocuments.form18)) {
        console.log('📁 Processing form18 documents...');
        const processedForm18 = [];
        for (let i = 0; i < pendingDocuments.form18.length; i++) {
          const doc = pendingDocuments.form18[i];
          if (doc && doc.file) {
            const uploadResult = await fileUploadClient.uploadFile(doc.file, companyId);
            if (uploadResult.success && uploadResult.file) {
              processedForm18.push({
                ...doc,
                url: uploadResult.file.url,
                filePath: uploadResult.file.filePath,
                id: uploadResult.file.id,
                file: undefined // Remove the file object
              });
              console.log(`✅ Form18 document ${i + 1} uploaded and saved to database`);
            }
          } else if (doc) {
            processedForm18.push(doc);
          } else {
            processedForm18.push(null);
          }
        }
        if (processedForm18.length > 0) {
          updatedRegistration.form18 = processedForm18;
          hasChanges = true;
        }
      }

      // Process step3 additional documents
      if (pendingStep3Documents.step3AdditionalDoc && Array.isArray(pendingStep3Documents.step3AdditionalDoc)) {
        console.log('📁 Processing step3 additional documents...');
        const processedStep3Documents = [];
        for (const doc of pendingStep3Documents.step3AdditionalDoc) {
          if (doc && doc.file) {
            const uploadResult = await fileUploadClient.uploadFile(doc.file, companyId);
            if (uploadResult.success && uploadResult.file) {
              processedStep3Documents.push({
                ...doc,
                url: uploadResult.file.url,
                filePath: uploadResult.file.filePath,
                id: uploadResult.file.id,
                file: undefined // Remove the file object
              });
            }
          } else if (doc) {
            processedStep3Documents.push(doc);
          }
        }

        // Merge with existing step3 documents
        const existingStep3Documents = currentRegistration.step3AdditionalDoc || [];
        updatedRegistration.step3AdditionalDoc = [...existingStep3Documents, ...processedStep3Documents];
        hasChanges = true;
        console.log(`✅ ${processedStep3Documents.length} step3 additional documents uploaded and saved to database`);
      }

      // Only update database if there are changes
      if (hasChanges) {
        updatedRegistration.updatedAt = new Date().toISOString();

        // Update MySQL database
        const updateResponse = await fetch(`/api/registrations/${companyId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedRegistration)
        });

        if (updateResponse.ok) {
          console.log('✅ ALL step3 documents saved to MySQL database successfully');

          // Update local state
          setSelectedCompany(prev => ({
            ...prev,
            ...updatedRegistration
          }));

          // Reset pending documents
          setPendingDocuments({});
          setPendingStep3Documents({});
          setDocumentsChanged(false);

          return true;
        } else {
          console.error('❌ Failed to save step3 documents to database:', updateResponse.status, updateResponse.statusText);
          return false;
        }
      } else {
        console.log('ℹ️ No new documents to save');
        return true;
      }
    } catch (error) {
      console.error('❌ Error saving step3 documents to database:', error);
      return false;
    }
  }

  // Function to save ONLY step3 additional documents to MySQL and file storage
  const saveStep3AdditionalDocumentsToDatabase = async (companyId: string) => {
    try {
      console.log('📝 Admin - Saving step3 additional documents to MySQL database...');

      // Import the file upload client
      const { fileUploadClient } = await import('@/lib/file-upload-client')

      // Get current registration from MySQL database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error('❌ Failed to fetch registration from database:', response.status, response.statusText);
        return false;
      }

      const currentRegistration = await response.json();
      console.log('📝 Admin - Current registration from database:', currentRegistration);

      // Process only step3 additional documents
      const pendingAdditionalDocuments = pendingStep3Documents.step3AdditionalDoc || [];
      const processedStep3Documents = [];

      for (const doc of pendingAdditionalDocuments) {
        if (doc && doc.file) {
          const uploadResult = await fileUploadClient.uploadFile(doc.file, companyId);
          if (uploadResult.success && uploadResult.file) {
            processedStep3Documents.push({
              ...doc,
              url: uploadResult.file.url,
              filePath: uploadResult.file.filePath,
              id: uploadResult.file.id,
              file: undefined // Remove the file object
            });
          }
        } else if (doc) {
          processedStep3Documents.push(doc);
        }
      }

      if (processedStep3Documents.length > 0) {
        // Merge with existing step3 documents
        const existingStep3Documents = currentRegistration.step3AdditionalDoc || [];
        const updatedStep3Documents = [...existingStep3Documents, ...processedStep3Documents];

        // Update MySQL database
        const updateResponse = await fetch(`/api/registrations/${companyId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...currentRegistration,
            step3AdditionalDoc: updatedStep3Documents,
            updatedAt: new Date().toISOString(),
          })
        });

        if (updateResponse.ok) {
          console.log('✅ Step3 additional documents saved to MySQL database successfully');

          // Update local state
          setSelectedCompany(prev => ({
            ...prev,
            step3AdditionalDoc: updatedStep3Documents
          }));

          // Reset only the processed documents from pending state
          setPendingStep3Documents(prev => ({
            ...prev,
            step3AdditionalDoc: []
          }));

          return true;
        } else {
          console.error('❌ Failed to save step3 additional documents to database:', updateResponse.status, updateResponse.statusText);
          return false;
        }
      } else {
        console.log('ℹ️ No new step3 additional documents to save');
        return true;
      }
    } catch (error) {
      console.error('❌ Error saving step3 additional documents to database:', error);
      return false;
    }
  }



  // Function to save step3 additional documents instantly to MySQL and file storage (for backward compatibility)
  const saveStep3DocumentsToDatabase = async (companyId: string) => {
    return await saveAllStep3DocumentsToDatabase(companyId);
  }

  // Function to remove additional document
  const handleRemoveAdditionalDocument = async (companyId: string, documentIndex: number) => {
    try {
      // First check if it's a pending document
      const pendingDocuments = pendingStep3Documents.step3AdditionalDoc || []
      if (pendingDocuments.length > 0) {
        // Remove from pending documents
        const updatedPendingDocuments = pendingDocuments.filter((_: any, index: number) => index !== documentIndex)
        setPendingStep3Documents((prev: any) => ({
          ...prev,
          step3AdditionalDoc: updatedPendingDocuments
        }))
        console.log(`✅ Pending step 3 additional document removed: index ${documentIndex}`)
        return
      }

      // If not pending, remove from existing documents in MySQL database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error('❌ Failed to fetch registration from database:', response.status, response.statusText);
        return;
      }

      const currentRegistration = await response.json();
      const currentAdditionalDocuments = currentRegistration.step3AdditionalDoc || []
      const updatedAdditionalDocuments = currentAdditionalDocuments.filter((_: any, index: number) => index !== documentIndex)

      // Update MySQL database
      const updateResponse = await fetch(`/api/registrations/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentRegistration,
          step3AdditionalDoc: updatedAdditionalDocuments,
          updatedAt: new Date().toISOString(),
        })
      });

      if (updateResponse.ok) {
        console.log('✅ Step3 additional document removed from MySQL database successfully');

        // Update local state
        setSelectedCompany(prev => ({
          ...prev,
          step3AdditionalDoc: updatedAdditionalDocuments
        }));
      } else {
        console.error('❌ Failed to remove step3 document from database:', updateResponse.status, updateResponse.statusText);
      }
    } catch (error) {
      console.error("Error removing step 3 additional document:", error)
    }
  }

  // Function to handle add document dialog submit
  const handleAddDocumentSubmit = () => {
    if (additionalDocumentTitle.trim() && additionalDocumentFile) {
      handleAdditionalDocumentUpload(selectedCompany._id, additionalDocumentTitle.trim(), additionalDocumentFile)
      setAdditionalDocumentTitle('')
      setAdditionalDocumentFile(null)
      setShowAddDocumentDialog(false)
    }
  }

  // Function to handle new document file selection for Step 3
  const handleNewDocumentFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNewDocument(prev => ({ ...prev, file }))
    }
  }

  // Function to handle adding new document in Step 3
  const handleAddNewDocument = async () => {
    if (!newDocument.title.trim() || !newDocument.file) {
      return
    }

    try {
      console.log('📝 Admin - Starting immediate save of additional document...');

      // Import the file upload client
      const { fileUploadClient } = await import('@/lib/file-upload-client')

      // Get current registration from MySQL database
      const response = await fetch(`/api/registrations/${selectedCompany._id}`);
      if (!response.ok) {
        console.error('❌ Failed to fetch registration from database:', response.status, response.statusText);
        toast({
          title: "Error",
          description: "Failed to fetch registration data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const currentRegistration = await response.json();
      console.log('📝 Admin - Current registration from database:', currentRegistration);

      // Upload the file immediately
      console.log('📁 Uploading file to file storage...');
      const uploadResult = await fileUploadClient.uploadFile(newDocument.file, selectedCompany._id);
      if (!uploadResult.success || !uploadResult.file) {
        console.error('❌ Failed to upload file to file storage');
        toast({
          title: "Error",
          description: "Failed to upload file. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ File uploaded to file storage successfully');

      // Create the document object
      const newDocumentData = {
        name: newDocument.file.name,
        type: newDocument.file.type,
        size: newDocument.file.size,
        title: newDocument.title.trim(),
        uploadedAt: new Date().toISOString(),
        url: uploadResult.file.url,
        filePath: uploadResult.file.filePath,
        id: uploadResult.file.id,
      };

      // Add to existing step3 documents
      const existingStep3Documents = currentRegistration.step3AdditionalDoc || [];
      const updatedStep3Documents = [...existingStep3Documents, newDocumentData];

      console.log('📝 Saving document to MySQL database...');

      // Update MySQL database immediately
      const updateResponse = await fetch(`/api/registrations/${selectedCompany._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentRegistration,
          step3AdditionalDoc: updatedStep3Documents,
          updatedAt: new Date().toISOString(),
        })
      });

      if (!updateResponse.ok) {
        console.error('❌ Failed to save document to MySQL database:', updateResponse.status, updateResponse.statusText);
        toast({
          title: "Error",
          description: "Failed to save document to database. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Document saved to MySQL database successfully');

      // Update local state
      setSelectedCompany(prev => ({
        ...prev,
        step3AdditionalDoc: updatedStep3Documents
      }));

      // Reset form
      setNewDocument({
        title: "",
        file: null
      })
      setIsAddDocumentDialogOpen(false)

      // Show success message
      console.log('✅ Step3 additional document added and saved to database successfully');
      toast({
        title: "Success",
        description: "Document uploaded and saved successfully!",
      });

    } catch (error) {
      console.error("Error adding new document:", error)
      toast({
        title: "Error",
        description: "Error adding document. Please try again.",
        variant: "destructive",
      });
    }
  }

  // Function to handle replacing additional document
  const handleReplaceAdditionalDocument = async (companyId: string, documentIndex: number, file: File) => {
    try {
      // First check if it's a pending document
      const pendingDocuments = pendingStep3Documents.step3AdditionalDoc || []
      if (pendingDocuments.length > 0) {
        // Replace in pending documents
        const existingDoc = pendingDocuments[documentIndex]
        if (!existingDoc) {
          console.error("Pending step 3 document not found for replacement")
          return
        }

        // Create new document with same title but new file
        const newDocument = {
          ...existingDoc,
          name: file.name,
          type: file.type,
          size: file.size,
          file: file,
          uploadedAt: new Date().toISOString(),
        }

        // Update pending documents
        const updatedPendingDocuments = [...pendingDocuments]
        updatedPendingDocuments[documentIndex] = newDocument

        setPendingStep3Documents((prev: any) => ({
          ...prev,
          step3AdditionalDoc: updatedPendingDocuments
        }))

        console.log(`✅ Pending step 3 additional document replaced: ${file.name}`)
        return
      }

      // If not pending, replace existing document in MySQL database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error('❌ Failed to fetch registration from database:', response.status, response.statusText);
        return;
      }

      const currentRegistration = await response.json();
      const existingDocuments = currentRegistration.step3AdditionalDoc || []
      const existingDoc = existingDocuments[documentIndex]

      if (!existingDoc) {
        console.error("Step 3 document not found for replacement")
        return
      }

      // Import the file upload client
      const { fileUploadClient } = await import('@/lib/file-upload-client')

      // Upload the new file
      const uploadResult = await fileUploadClient.uploadFile(file, companyId)
      if (!uploadResult.success || !uploadResult.file) {
        console.error('❌ Failed to upload replacement file')
        return
      }

      // Create new document with uploaded file data
      const newDocument = {
        ...existingDoc,
        name: file.name,
        type: file.type,
        size: file.size,
        url: uploadResult.file.url,
        filePath: uploadResult.file.filePath,
        id: uploadResult.file.id,
        uploadedAt: new Date().toISOString(),
      }

      // Update the document in the array
      const updatedDocuments = [...existingDocuments]
      updatedDocuments[documentIndex] = newDocument

      // Update MySQL database
      const updateResponse = await fetch(`/api/registrations/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentRegistration,
          step3AdditionalDoc: updatedDocuments,
          updatedAt: new Date().toISOString(),
        })
      });

      if (updateResponse.ok) {
        console.log('✅ Step3 additional document replaced in MySQL database successfully');

        // Update local state
        setSelectedCompany(prev => ({
          ...prev,
          step3AdditionalDoc: updatedDocuments
        }));
      } else {
        console.error('❌ Failed to replace step3 document in database:', updateResponse.status, updateResponse.statusText);
      }

    } catch (error) {
      console.error("Error replacing step 3 additional document:", error)
    }
  }



  // Function to publish documents to customer
  const publishDocumentsToCustomer = async (companyId: string) => {
    try {
      console.log('📝 Admin - Publishing documents to customer...');

      // Import the file upload client
      const { fileUploadClient } = await import('@/lib/file-upload-client')

      // Get current registration from MySQL database
      const response = await fetch(`/api/registrations/${companyId}`);
      if (!response.ok) {
        console.error('❌ Failed to fetch registration from database:', response.status, response.statusText);
        return;
      }

      const currentRegistration = await response.json();
      console.log('📝 Admin - Current registration from database:', currentRegistration);

      // Process pending documents and save files to storage
      let updatedRegistration = { ...currentRegistration }

      // Process form1
      if (pendingDocuments.form1 && pendingDocuments.form1.file) {
        const uploadResult = await fileUploadClient.uploadFile(pendingDocuments.form1.file, companyId)
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.form1 = {
            ...pendingDocuments.form1,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined // Remove the file object
          }
        }
      }

      // Process letterOfEngagement
      if (pendingDocuments.letterOfEngagement && pendingDocuments.letterOfEngagement.file) {
        const uploadResult = await fileUploadClient.uploadFile(pendingDocuments.letterOfEngagement.file, companyId)
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.letterOfEngagement = {
            ...pendingDocuments.letterOfEngagement,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined // Remove the file object
          }
        }
      }

      // Process aoa
      if (pendingDocuments.aoa && pendingDocuments.aoa.file) {
        const uploadResult = await fileUploadClient.uploadFile(pendingDocuments.aoa.file, companyId)
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.aoa = {
            ...pendingDocuments.aoa,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined // Remove the file object
          }
        }
      }

      // Process form18 array
      if (pendingDocuments.form18 && Array.isArray(pendingDocuments.form18)) {
        const processedForm18 = []
        for (let i = 0; i < pendingDocuments.form18.length; i++) {
          const doc = pendingDocuments.form18[i]
          if (doc && doc.file) {
            const uploadResult = await fileUploadClient.uploadFile(doc.file, companyId)
            if (uploadResult.success && uploadResult.file) {
              processedForm18.push({
                ...doc,
                url: uploadResult.file.url,
                filePath: uploadResult.file.filePath,
                id: uploadResult.file.id,
                file: undefined // Remove the file object
              })
            }
          } else if (doc) {
            processedForm18.push(doc)
          } else {
            processedForm18.push(null)
          }
        }
        updatedRegistration.form18 = processedForm18
      }

      // Process additional documents
      if (pendingStep4Documents.additionalDocuments && Array.isArray(pendingStep4Documents.additionalDocuments)) {
        const processedAdditionalDocuments = []
        for (const doc of pendingStep4Documents.additionalDocuments) {
          if (doc && doc.file) {
            const uploadResult = await fileUploadClient.uploadFile(doc.file, companyId)
            if (uploadResult.success && uploadResult.file) {
              processedAdditionalDocuments.push({
                ...doc,
                url: uploadResult.file.url,
                filePath: uploadResult.file.filePath,
                id: uploadResult.file.id,
                file: undefined // Remove the file object
              })
            }
          } else if (doc) {
            processedAdditionalDocuments.push(doc)
          }
        }

        // Merge with existing additional documents
        const existingAdditionalDocuments = updatedRegistration.additionalDocuments || []
        updatedRegistration.additionalDocuments = [...existingAdditionalDocuments, ...processedAdditionalDocuments]
      }

      // Process step 3 additional documents
      if (pendingStep3Documents.step3AdditionalDoc && Array.isArray(pendingStep3Documents.step3AdditionalDoc)) {
        const processedStep3Documents = []
        for (const doc of pendingStep3Documents.step3AdditionalDoc) {
          if (doc && doc.file) {
            const uploadResult = await fileUploadClient.uploadFile(doc.file, companyId)
            if (uploadResult.success && uploadResult.file) {
              processedStep3Documents.push({
                ...doc,
                url: uploadResult.file.url,
                filePath: uploadResult.file.filePath,
                id: uploadResult.file.id,
                file: undefined // Remove the file object
              })
            }
          } else if (doc) {
            processedStep3Documents.push(doc)
          }
        }

        // Merge with existing step 3 additional documents
        const existingStep3Documents = updatedRegistration.step3AdditionalDoc || []
        updatedRegistration.step3AdditionalDoc = [...existingStep3Documents, ...processedStep3Documents]
      }

      updatedRegistration.documentsPublished = true
      updatedRegistration.documentsPublishedAt = new Date().toISOString()
      updatedRegistration.status = "documents-published" // Set status to allow customer to see documents
      updatedRegistration.updatedAt = new Date().toISOString()

      // Save to MySQL database
      const updateResponse = await fetch(`/api/registrations/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRegistration)
      });

      if (updateResponse.ok) {
        console.log('✅ Documents published to customer and saved to MySQL database successfully');

        // Update the selected company in state
        setSelectedCompany({
          ...updatedRegistration,
        })

        // Reset documentsChanged and pendingDocuments after publishing
        setDocumentsChanged(false)
        setPendingDocuments({})
        setPendingStep4Documents({}) // Reset pending additional documents
        setPendingStep3Documents({}) // Reset pending step 3 documents

        // Show success message
        setShowPublishSuccess(true)
        setTimeout(() => {
          setShowPublishSuccess(false)
        }, 3000) // Hide after 3 seconds
      } else {
        console.error('❌ Failed to publish documents to database:', updateResponse.status, updateResponse.statusText);
        toast({
          title: "Error",
          description: "Failed to publish documents. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error publishing documents:", error)
      toast({
        title: "Error",
        description: "Error publishing documents. Please try again.",
        variant: "destructive",
      });
    }
  }

  // Get role badge for user
  const getRoleBadge = () => {
    if (!user) return null // Add null check for user

    if (isAdmin(user)) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 ml-2">
          <ShieldAlert className="h-3 w-3" /> Admin
        </Badge>
      )
    }
    return null
  }

  // Function to handle balance payment receipt approval/rejection
  const handleBalancePaymentApproval = async (companyId: string, status: 'approved' | 'rejected') => {
    try {
      console.log(`📝 Admin - Updating balance payment status to ${status} for company ${companyId}`);

      // First, get the current registration from MySQL database
      try {
        const response = await fetch(`/api/registrations/${companyId}`)
        if (!response.ok) {
          console.error('❌ Failed to fetch registration from database:', response.status, response.statusText)
          return
        }

        const currentRegistration = await response.json()
        console.log('📝 Admin - Current registration from database:', currentRegistration)

        // Update the balance payment receipt status
        const updatedBalancePaymentReceipt = {
          ...currentRegistration.balancePaymentReceipt,
          status: status,
          reviewedAt: new Date().toISOString(),
          reviewedBy: user?.name || 'Admin'
        }

        console.log('📝 Admin - Updated balance payment receipt:', updatedBalancePaymentReceipt)

        // Update MySQL database
        console.log('📝 Admin - Updating balance payment status in database')
        const updateResponse = await fetch(`/api/registrations/${companyId}/balance-payment`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            balancePaymentReceipt: updatedBalancePaymentReceipt
          })
        })

        if (updateResponse.ok) {
          console.log('✅ Balance payment status updated in database successfully')

          // Update the selected company state with the new data
          const updatedCompany = {
            ...currentRegistration,
            balancePaymentReceipt: updatedBalancePaymentReceipt,
            // If rejected, redirect customer to step 3 (documentation)
            currentStep: status === 'rejected' ? 'documentation' : currentRegistration.currentStep
          }

          setSelectedCompany(updatedCompany)
          setBalancePaymentApproved(status === 'approved')

          // Dispatch event to notify of update
          window.dispatchEvent(
            new CustomEvent("registration-updated", {
              detail: {
                type: `balance-payment-${status}`,
                companyId: companyId,
                redirectToStep: status === 'rejected' ? 'documentation' : undefined,
                preventNavigation: true // Prevent admin from being redirected
              },
            }),
          )

          console.log(`✅ Balance payment receipt ${status} for company ${companyId}`)
        } else {
          console.error('❌ Failed to update balance payment status in database:', updateResponse.status, updateResponse.statusText)
        }
      } catch (dbError) {
        console.error('❌ Error updating balance payment status in database:', dbError)
      }
    } catch (error) {
      console.error("Error updating balance payment receipt status:", error)
    }
  }

  const handleSubmitDocuments = async () => {
    try {
      console.log('📄 Admin - Submitting documents for company:', selectedCompany._id);

      // Import the file upload client
      const { fileUploadClient } = await import('@/lib/file-upload-client')

      // Get the most current registration from database
      const registration = await LocalStorageService.getRegistrationById(selectedCompany._id);
      if (!registration) {
        console.error('Registration not found in database');
        return;
      }

      let updatedRegistration = { ...registration };

      // Process pending incorporation certificate if it exists
      if (pendingStep4Documents.incorporationCertificate && pendingStep4Documents.incorporationCertificate.file) {
        const uploadResult = await fileUploadClient.uploadFile(pendingStep4Documents.incorporationCertificate.file, selectedCompany._id);
        if (uploadResult.success && uploadResult.file) {
          updatedRegistration.incorporationCertificate = {
            ...pendingStep4Documents.incorporationCertificate,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            file: undefined // Remove the file object
          };
        }
      }

      // Process pending additional documents if they exist
      if (pendingStep4Documents.additionalDocuments && Array.isArray(pendingStep4Documents.additionalDocuments)) {
        const processedAdditionalDocuments = [];
        for (const doc of pendingStep4Documents.additionalDocuments) {
          if (doc && doc.file) {
            const uploadResult = await fileUploadClient.uploadFile(doc.file, selectedCompany._id);
            if (uploadResult.success && uploadResult.file) {
              processedAdditionalDocuments.push({
                ...doc,
                url: uploadResult.file.url,
                filePath: uploadResult.file.filePath,
                id: uploadResult.file.id,
                file: undefined // Remove the file object
              });
            }
          } else if (doc) {
            processedAdditionalDocuments.push(doc);
          }
        }
        updatedRegistration.additionalDocuments = processedAdditionalDocuments;
      }

      // Update registration timestamp
      updatedRegistration.updatedAt = new Date().toISOString();

      // Save to database
      await LocalStorageService.saveRegistration(updatedRegistration);

      // Update localStorage as fallback
      const savedRegistrations = localStorage.getItem("registrations")
      let currentRegistrations = savedRegistrations ? JSON.parse(savedRegistrations) : []

      currentRegistrations = currentRegistrations.map((reg: any) => {
        if (reg._id === selectedCompany._id) {
          return updatedRegistration;
        }
        return reg
      })

      localStorage.setItem("registrations", JSON.stringify(currentRegistrations))

      // Update the selected company in state
      setSelectedCompany(updatedRegistration);

      console.log('✅ Documents submitted successfully:', updatedRegistration);

      // Clear pending step 4 documents after successful upload
      setPendingStep4Documents({})

      // Set documents submitted state
      setDocumentsSubmitted(true)

      console.log('✅ Documents submitted successfully:', updatedRegistration);
      console.log('✅ Complete Registration button is now enabled');

    } catch (error) {
      console.error('Error submitting documents:', error);
      toast({
        title: "Error",
        description: "Error submitting documents. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleCompleteRegistration = async () => {
    try {
      console.log('🎉 Admin - Completing registration for company:', selectedCompany._id);

      // Get the most current registration from database
      const registration = await LocalStorageService.getRegistrationById(selectedCompany._id);
      if (!registration) {
        console.error('Registration not found in database');
        return;
      }

      // Prepare the updated registration with completion data
      const updatedRegistration = {
        ...registration,
        status: "completed", // Mark registration as completed
        documentsSubmittedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Include admin uploaded documents for customer access
        incorporationCertificate: selectedCompany.incorporationCertificate,
        additionalDocuments: selectedCompany.additionalDocuments || [],
        // Mark as completed by admin
        completedByAdmin: true,
        adminCompletionDate: new Date().toISOString(),
      };

      // Save to database
      await LocalStorageService.saveRegistration(updatedRegistration);

      // Update localStorage as fallback
      const savedRegistrations = localStorage.getItem("registrations")
      let currentRegistrations = savedRegistrations ? JSON.parse(savedRegistrations) : []

      currentRegistrations = currentRegistrations.map((reg: any) => {
        if (reg._id === selectedCompany._id) {
          return updatedRegistration;
        }
        return reg
      })

      localStorage.setItem("registrations", JSON.stringify(currentRegistrations))

      // Update the selected company in state
      setSelectedCompany(updatedRegistration);

      console.log('✅ Registration completed successfully:', updatedRegistration);
      console.log('📋 Status set to "completed" - Customer should now have access to step 4');

      // Dispatch event to notify of update and allow customer access to step 4
      console.log('📡 Dispatching registration-updated event for customer access...');
      console.log('📡 Company ID:', selectedCompany._id);
      console.log('📡 Event type: registration-completed');

      const event = new CustomEvent("registration-updated", {
        detail: {
          type: "registration-completed",
          companyId: selectedCompany._id,
        },
      });

      // Dispatch the event
      window.dispatchEvent(event);
      console.log('📡 Event dispatched successfully:', event.detail);

      // Also dispatch a global event for testing
      const globalEvent = new CustomEvent("admin-complete-registration", {
        detail: {
          companyId: selectedCompany._id,
          status: "completed",
        },
      });
      window.dispatchEvent(globalEvent);
      console.log('📡 Global event also dispatched for testing');

      // Hide the button after first click
      setCompleteRegistrationClicked(true)
      localStorage.setItem(`completeRegistrationClicked_${selectedCompany._id}`, "true")

      // Show success message
      setShowCompleteSuccess(true)
      setTimeout(() => {
        setShowCompleteSuccess(false)
      }, 5000) // Hide after 5 seconds

      // Test: Dispatch another event after a delay to ensure it reaches the customer
      setTimeout(() => {
        console.log('📡 Dispatching delayed test event...')
        const testEvent = new CustomEvent("registration-updated", {
          detail: {
            type: "registration-completed",
            companyId: selectedCompany._id,
          },
        });
        window.dispatchEvent(testEvent);
        console.log('📡 Delayed test event dispatched')
      }, 1000)

      // Navigate back to admin dashboard after showing the message
      setTimeout(() => {
        navigateTo("adminDashboard")
      }, 3000) // Wait 3 seconds before redirecting
    } catch (error) {
      console.error('Error completing registration:', error);
      toast({
        title: "Error",
        description: "Error completing registration. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!selectedCompany) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground mb-4">Company not found</p>
          <Button onClick={() => navigateTo("adminDashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigateTo("adminDashboard")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">{selectedCompany.companyNameEnglish || selectedCompany.companyName}</h1>
        <div className="ml-auto flex items-center gap-2">
          {getStatusBadge(selectedCompany.status)}
        </div>
      </div>

      <div className="mb-6 bg-white rounded-lg border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {renderStepStatus(1, viewStep, selectedCompany.status)}
            <div className="h-0.5 w-12 bg-muted"></div>
            {renderStepStatus(2, viewStep, selectedCompany.status)}
            <div className="h-0.5 w-12 bg-muted"></div>
            {renderStepStatus(3, viewStep, selectedCompany.status)}
            <div className="h-0.5 w-12 bg-muted"></div>
            {renderStepStatus(4, viewStep, selectedCompany.status)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewStep(1)}
              className={viewStep === 1 ? "bg-muted" : ""}
            >
              Contact
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewStep(2)}
              className={viewStep === 2 ? "bg-muted" : ""}
              disabled={!selectedCompany.paymentApproved}
            >
              Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewStep(3)}
              className={viewStep === 3 ? "bg-muted" : ""}
              disabled={!selectedCompany.detailsApproved}
            >
              Documents
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewStep(4)}
              className={viewStep === 4 ? "bg-muted" : ""}
              disabled={!selectedCompany.documentsApproved}
            >
              Incorporate
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Created on {new Date(selectedCompany.createdAt).toLocaleDateString()}
            <span className="mx-2">•</span>
            <Clock className="h-3.5 w-3.5 mr-1" />
            Last updated {new Date(selectedCompany.updatedAt || selectedCompany.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Contact Details */}
          {viewStep === 1 && (
            <div className="space-y-6 pb-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Company</h3>
                    <p className="font-medium text-lg">{selectedCompany.companyName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Package</h3>
                    {/* Enhanced package display with price information */}
                    {(() => {
                      const packageName = selectedCompany.selectedPackage || selectedCompany.package?.name;
                      const pkgObj = getPackageInfo(packageName);

                      return (
                        <div>
                          {/* Package Price Details */}
                          {pkgObj && (
                            <div className="mt-2 space-y-1">
                              {pkgObj.type === "advance-balance" ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Advance Payment:</span>
                                    <span className="font-semibold text-blue-700">
                                      {pkgObj.advanceAmount ? `Rs. ${pkgObj.advanceAmount.toLocaleString()}` : "Rs. 0"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Balance Payment:</span>
                                    <span className="font-semibold text-orange-700">
                                      {pkgObj.balanceAmount ? `Rs. ${pkgObj.balanceAmount.toLocaleString()}` : "Rs. 0"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Total Package:</span>
                                    <span className="font-semibold text-green-700">
                                      {pkgObj.price ? `Rs. ${pkgObj.price.toLocaleString()}` : "Rs. 0"}
                                    </span>
                                  </div>
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Advance + Balance Payment
                                    </span>
                                  </div>
                                </>
                              ) : pkgObj.type === "one-time" ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Total Fee:</span>
                                    <span className="font-semibold text-green-700">
                                      {pkgObj.price ? `Rs. ${pkgObj.price.toLocaleString()}` : "Rs. 0"}
                                    </span>
                                  </div>
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      One-Time Payment
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">Price:</span>
                                  <span className="font-semibold text-gray-700">
                                    {pkgObj.price ? `Rs. ${pkgObj.price.toLocaleString()}` : "Not specified"}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Person</h3>
                    <p className="font-medium">{selectedCompany.contactPersonName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Email</h3>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{selectedCompany.contactPersonEmail}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Phone</h3>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{selectedCompany.contactPersonPhone}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Method</h3>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium capitalize">
                        {selectedCompany.paymentMethod
                          ? selectedCompany.paymentMethod.replace(/([A-Z])/g, " $1").trim()
                          : "Not specified"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Payment Receipt</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCompany.paymentReceipt ? (
                    <PaymentReceiptViewer receipt={selectedCompany.paymentReceipt} />
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No payment receipt uploaded</p>
                    </div>
                  )}
                </CardContent>
                {selectedCompany.status === "payment-processing" && canManage && (
                  <CardFooter className="flex justify-end gap-3 pt-0">
                    <Button variant="destructive" size="sm" onClick={() => onRejectPayment(selectedCompany._id)}>
                      <XCircle className="h-4 w-4 mr-2" /> Reject Payment
                    </Button>
                    <Button size="sm" onClick={() => onApprovePayment(selectedCompany._id)}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Approve Payment
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          )}

          {/* Step 2: Company Details */}
          {viewStep === 2 && (
            <div className="space-y-6">
              {selectedCompany.companyNameEnglish ||
                selectedCompany.businessAddressNumber ||
                selectedCompany.shareholders ||
                selectedCompany.directors ? (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Company Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedCompany.companyNameEnglish && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Company Name (English)</h3>
                          <p className="font-medium">{selectedCompany.companyNameEnglish}</p>
                        </div>
                      )}
                      {selectedCompany.companyNameSinhala && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Company Name (Sinhala)</h3>
                          <p className="font-medium">{selectedCompany.companyNameSinhala}</p>
                        </div>
                      )}
                      {selectedCompany.isForeignOwned && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Foreign Owned</h3>
                          <p className="font-medium">{selectedCompany.isForeignOwned}</p>
                        </div>
                      )}
                      {(selectedCompany.businessAddressNumber ||
                        selectedCompany.businessAddressStreet ||
                        selectedCompany.businessAddressCity) && (
                          <div className="col-span-2">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Business Address</h3>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <p className="font-medium">
                                {selectedCompany.businessAddressNumber || ""}{" "}
                                {selectedCompany.businessAddressStreet || ""}
                                {", "}
                                {selectedCompany.businessAddressCity || ""}{" "}
                                {selectedCompany.postalCode ? `- ${selectedCompany.postalCode}` : ""}
                              </p>
                            </div>
                          </div>
                        )}

                      {/* Company Secretary Information */}
                      {(selectedCompany.companySecretary !== undefined ||
                        selectedCompany.isSimpleBooksSecretary !== undefined ||
                        selectedCompany.secretaryService !== undefined) && (
                          <div className="col-span-2 mt-2 pt-4 border-t">
                            <h3 className="text-sm font-medium mb-3">Company Secretary Information</h3>
                            <div className="bg-blue-50/50 rounded-md p-3">
                              <p className="font-medium">
                                {selectedCompany.companySecretary === true ||
                                  selectedCompany.isSimpleBooksSecretary === true ||
                                  selectedCompany.secretaryService === true ||
                                  selectedCompany.makeSimpleBooksSecretary === "yes"
                                  ? `${appTitle} selected as company secretary`
                                  : "Customer declined company secretary service"}
                              </p>
                              {(selectedCompany.secretaryNotes || selectedCompany.secretaryDetails) && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {selectedCompany.secretaryNotes || selectedCompany.secretaryDetails}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                      {selectedCompany.sharePrice && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Share Price</h3>
                          <p className="font-medium">
                            {typeof selectedCompany.sharePrice === "number"
                              ? `${selectedCompany.sharePrice.toFixed(2)} LKR`
                              : selectedCompany.sharePrice}
                          </p>
                        </div>
                      )}

                      {selectedCompany.makeSimpleBooksSecretary && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Company Secretary</h3>
                          <p className="font-medium">
                            {selectedCompany.makeSimpleBooksSecretary === "yes"
                              ? `${appTitle} acts as company secretary`
                              : "Customer declined company secretary service"}
                          </p>
                        </div>
                      )}

                      {selectedCompany.businessEmail && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Business Email</h3>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{selectedCompany.businessEmail}</p>
                          </div>
                        </div>
                      )}
                      {selectedCompany.businessContactNumber && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Business Contact Number</h3>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{selectedCompany.businessContactNumber}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Shareholders Section */}
                  {selectedCompany.shareholders && selectedCompany.shareholders.length > 0 && (
                    <div>
                      <h2 className="text-lg font-medium mb-3 flex items-center">
                        <User className="h-5 w-5 mr-2 text-primary" />
                        Shareholders ({selectedCompany.shareholders.length})
                      </h2>
                      <div className="space-y-4">
                        {selectedCompany.shareholders.map((shareholder: any, index: number) =>
                          renderShareholderInfo(shareholder, index),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Directors Section */}
                  {selectedCompany.directors && selectedCompany.directors.length > 0 && (
                    <div>
                      <h2 className="text-lg font-medium mb-3 flex items-center">
                        <Briefcase className="h-5 w-5 mr-2 text-primary" />
                        Directors ({selectedCompany.directors.length})
                      </h2>
                      <div className="space-y-4">
                        {selectedCompany.directors.map((director: any, index: number) =>
                          renderDirectorInfo(director, index),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Company Activities Section */}
                  {(selectedCompany.importExportStatus ||
                    selectedCompany.importsToAdd ||
                    selectedCompany.exportsToAdd ||
                    selectedCompany.otherBusinessActivities) && (
                      <Card className="mt-6">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Company Activities</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedCompany.importExportStatus && (
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-2">Import/Export Status</h3>
                              <p className="font-medium capitalize">
                                {selectedCompany.importExportStatus.replace(/-/g, " ")}
                              </p>
                            </div>
                          )}

                          {selectedCompany.importsToAdd && (
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-2">Imports</h3>
                              <p className="font-medium">{selectedCompany.importsToAdd}</p>
                            </div>
                          )}

                          {selectedCompany.exportsToAdd && (
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-2">Exports</h3>
                              <p className="font-medium">{selectedCompany.exportsToAdd}</p>
                            </div>
                          )}

                          {selectedCompany.otherBusinessActivities && (
                            <div className="col-span-2">
                              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                Other Business Activities
                              </h3>
                              <p className="font-medium">{selectedCompany.otherBusinessActivities}</p>
                            </div>
                          )}

                          {selectedCompany.dramaSedakaDivision && (
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-2">Grama Sevaka Division</h3>
                              <p className="font-medium">{selectedCompany.dramaSedakaDivision}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                  {/* Business Contact Details Section */}
                  {(selectedCompany.businessEmail || selectedCompany.businessContactNumber) && (
                    <Card className="mt-6">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Business Contact Details</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedCompany.businessEmail && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Business Email</h3>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium">{selectedCompany.businessEmail}</p>
                            </div>
                          </div>
                        )}

                        {selectedCompany.businessContactNumber && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Business Contact Number</h3>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium">{selectedCompany.businessContactNumber}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {selectedCompany.status === "documentation-processing" &&
                    !selectedCompany.detailsApproved &&
                    canManage && (
                      <div className="flex justify-end mt-6">
                        <Button onClick={() => onApproveDetails(selectedCompany._id)}>
                          <CheckCircle className="h-4 w-4 mr-2" /> Approve Company Details
                        </Button>
                      </div>
                    )}
                </>
              ) : (
                <Card>
                  <CardContent className="flex items-center py-6">
                    <div className="bg-blue-50 p-2 rounded-full mr-3">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium mb-1">Waiting for Customer Information</h3>
                      <p className="text-sm text-muted-foreground">
                        The customer has not yet submitted their company details.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Documentation */}
          {viewStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Document Management</CardTitle>
                  <CardDescription>Upload and manage registration documents for the customer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentUploadCard
                      title="FORM 1"
                      description="Application for incorporation"
                      document={pendingDocuments.form1 || selectedCompany.form1}
                      onUpload={(file: File) => handleDocumentUpload(selectedCompany._id, "form1", file)}
                      disabled={!canManage}
                      showReplace={canManage}
                    />

                    <DocumentUploadCard
                      title="Letter Of Engagement"
                      description="Engagement letter for company registration"
                      document={pendingDocuments.letterOfEngagement || selectedCompany.letterOfEngagement}
                      onUpload={(file: File) => handleDocumentUpload(selectedCompany._id, "letterOfEngagement", file)}
                      disabled={!canManage}
                      showReplace={canManage}
                    />

                    <DocumentUploadCard
                      title="Articles of Association (AOA)"
                      description="Company's constitution document"
                      document={pendingDocuments.aoa || selectedCompany.aoa}
                      onUpload={(file: File) => handleDocumentUpload(selectedCompany._id, "aoa", file)}
                      disabled={!canManage}
                      showReplace={canManage}
                    />

                    {/* Render Form 18 upload cards for each director */}
                    {Array.isArray(selectedCompany.directors) && selectedCompany.directors.length > 0 &&
                      selectedCompany.directors.map((director: any, idx: number) => (
                        <DocumentUploadCard
                          key={idx}
                          title={`FORM 18 - ${director.name || director.fullName || `Director ${idx + 1}`}`}
                          description={`Consent to act as director (${director.name || director.fullName || `Director ${idx + 1}`})`}
                          document={Array.isArray(pendingDocuments.form18) ? pendingDocuments.form18[idx] : (Array.isArray(selectedCompany.form18) ? selectedCompany.form18[idx] : null)}
                          onUpload={(file: File) => handleDocumentUpload(selectedCompany._id, "form18", file, idx)}
                          disabled={!canManage}
                          showReplace={canManage}
                        />
                      ))}

                    {/* Render Step 3 Additional Documents as individual cards */}
                    {/* Show pending step 3 additional documents first */}
                    {pendingStep3Documents.step3AdditionalDoc && pendingStep3Documents.step3AdditionalDoc.map((doc: any, index: number) => (
                      <DocumentUploadCard
                        key={`pending-step3-additional-${index}`}
                        title={doc.title}
                        description="Step 3 Additional document"
                        document={doc}
                        onUpload={(file: File) => handleReplaceAdditionalDocument(selectedCompany._id, index, file)}
                        onDelete={() => handleRemoveAdditionalDocument(selectedCompany._id, index)}
                        disabled={!canManage}
                        showReplace={canManage}
                      />
                    ))}

                    {/* Show existing step 3 additional documents */}
                    {selectedCompany.step3AdditionalDoc && selectedCompany.step3AdditionalDoc.map((doc: any, index: number) => (
                      <DocumentUploadCard
                        key={`existing-step3-additional-${index}`}
                        title={doc.title}
                        description="Step 3 Additional document"
                        document={doc}
                        onUpload={(file: File) => handleReplaceAdditionalDocument(selectedCompany._id, index, file)}
                        onDelete={() => handleRemoveAdditionalDocument(selectedCompany._id, index)}
                        disabled={!canManage}
                        showReplace={canManage}
                      />
                    ))}

                    {/* Add Document Button */}
                    {canManage && (
                      <div className="col-span-full">
                        <Dialog open={isAddDocumentDialogOpen} onOpenChange={setIsAddDocumentDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-20 border-dashed border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                              <Plus className="h-6 w-6 mr-2" />
                              Add Additional Document
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Add Additional Document</DialogTitle>
                              <DialogDescription>
                                Upload an additional document for the customer with a custom name.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              {/* Document Title */}
                              <div>
                                <Label htmlFor="document-title">Document Title *</Label>
                                <Input
                                  id="document-title"
                                  placeholder="e.g., Business License, Tax Certificate"
                                  value={newDocument.title}
                                  onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                                />
                              </div>



                              {/* File Upload */}
                              <div>
                                <Label htmlFor="document-file">Document File *</Label>
                                <Input
                                  id="document-file"
                                  type="file"
                                  onChange={handleNewDocumentFileSelect}
                                  accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png"
                                />
                                {newDocument.file && (
                                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-green-600" />
                                      <span className="text-sm text-green-800">{newDocument.file.name}</span>
                                      <span className="text-xs text-green-600">({(newDocument.file.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsAddDocumentDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={handleAddNewDocument}
                                disabled={!newDocument.title.trim() || !newDocument.file}
                              >
                                Add Document
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardContent>
                {canManage && (
                  <CardFooter className="flex justify-end gap-3">
                    {showPublishSuccess && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm animate-in slide-in-from-left duration-300">
                        <CheckCircle className="h-4 w-4" />
                        <span>Documents successfully submitted to customer</span>
                      </div>
                    )}
                    <Button
                      onClick={() => {
                        publishDocumentsToCustomer(selectedCompany._id)
                      }}
                      disabled={
                        !(pendingDocuments.form1 || selectedCompany.form1) ||
                        !(pendingDocuments.letterOfEngagement || selectedCompany.letterOfEngagement) ||
                        !(pendingDocuments.aoa || selectedCompany.aoa) ||
                        !Array.isArray(pendingDocuments.form18 || selectedCompany.form18) ||
                        ((pendingDocuments.form18 || selectedCompany.form18)?.length !== (selectedCompany.directors?.length || 0)) ||
                        ((pendingDocuments.form18 || selectedCompany.form18)?.some((doc: any) => !doc)) ||
                        (!documentsChanged && selectedCompany.documentsPublished) ||
                        // Check if there are any pending additional documents that need to be processed
                        (pendingStep4Documents.additionalDocuments && pendingStep4Documents.additionalDocuments.length > 0 &&
                          pendingStep4Documents.additionalDocuments.some((doc: any) => !doc.file))
                      }
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      {selectedCompany.documentsPublished
                        ? documentsChanged
                          ? "Resubmit to Customer"
                          : "Documents Published"
                        : "Publish to Customer"}
                    </Button>
                  </CardFooter>
                )}
              </Card>



              {/* Balance Payment Receipt Management */}
              {(() => {
                // Check if this is an advance+balance package
                const selectedPackage = availablePackages.find(pkg => pkg.id === selectedCompany.selectedPackage || pkg.name === selectedCompany.selectedPackage)
                const isAdvanceBalancePackage = selectedPackage?.type === "advance-balance"

                console.log('🔍 Admin Step 3 - Balance payment section check:', {
                  selectedPackageId: selectedCompany.selectedPackage,
                  selectedPackage: selectedPackage,
                  isAdvanceBalancePackage: isAdvanceBalancePackage,
                  hasBalancePaymentReceipt: !!selectedCompany.balancePaymentReceipt,
                  balancePaymentReceipt: selectedCompany.balancePaymentReceipt
                })

                // Show balance payment section for advance+balance packages, regardless of receipt status
                return isAdvanceBalancePackage || selectedCompany.balancePaymentReceipt
              })() && (
                  <Card className="mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Balance Payment Receipt</CardTitle>
                      <CardDescription>Review and approve/reject the customer's balance payment receipt</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedCompany.balancePaymentReceipt ? (
                        <div className={`p-4 border rounded-md ${selectedCompany.balancePaymentReceipt.status === 'approved'
                          ? 'bg-green-50/30 border-green-200'
                          : selectedCompany.balancePaymentReceipt.status === 'rejected'
                            ? 'bg-red-50/30 border-red-200'
                            : 'bg-yellow-50/30 border-yellow-200'
                          }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <FileText className={`h-5 w-5 mr-3 ${selectedCompany.balancePaymentReceipt.status === 'approved'
                                ? 'text-green-600'
                                : selectedCompany.balancePaymentReceipt.status === 'rejected'
                                  ? 'text-red-600'
                                  : 'text-yellow-600'
                                }`} />
                              <div>
                                <h3 className="font-medium">
                                  Balance Payment Receipt
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {selectedCompany.balancePaymentReceipt.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted: {new Date(selectedCompany.balancePaymentReceipt.submittedAt).toLocaleDateString()}
                                </p>
                                {(() => {
                                  // Find package from the PackagePlan array
                                  const selectedPackage = availablePackages.find(pkg => pkg.id === selectedCompany.selectedPackage)

                                  console.log('Debug balance amount:', {
                                    availablePackages,
                                    selectedPackageId: selectedCompany.selectedPackage,
                                    selectedPackage,
                                    balanceAmount: selectedPackage?.balanceAmount
                                  })

                                  if (selectedPackage?.balanceAmount) {
                                    return (
                                      <p className="text-sm font-medium text-blue-600 mt-1">
                                        💰 Balance Amount: Rs {selectedPackage.balanceAmount.toLocaleString()}
                                      </p>
                                    )
                                  }

                                  // Fallback: try to get balance amount from the receipt data itself
                                  if (selectedCompany.balancePaymentReceipt?.selectedPackage) {
                                    const packageFromReceipt = availablePackages.find(pkg => pkg.id === selectedCompany.balancePaymentReceipt.selectedPackage)
                                    if (packageFromReceipt?.balanceAmount) {
                                      return (
                                        <p className="text-sm font-medium text-blue-600 mt-1">
                                          💰 Balance Amount: ${packageFromReceipt.balanceAmount.toLocaleString()}
                                        </p>
                                      )
                                    }
                                  }

                                  // Show debug info if no balance amount found
                                  return (
                                    <p className="text-xs text-orange-600 mt-1">
                                      Debug: Package ID: {selectedCompany.selectedPackage || 'Not found'} | Packages loaded: {availablePackages.length}
                                    </p>
                                  )
                                })()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={selectedCompany.balancePaymentReceipt.status === 'approved' ? 'default' :
                                selectedCompany.balancePaymentReceipt.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {selectedCompany.balancePaymentReceipt.status.charAt(0).toUpperCase() + selectedCompany.balancePaymentReceipt.status.slice(1)}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                              <span className="text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[150px]">{selectedCompany.balancePaymentReceipt.name}</span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              {selectedCompany.balancePaymentReceipt.type?.startsWith("image/") ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 flex-1 sm:flex-none">
                                      <Eye className="h-3.5 w-3.5 mr-1" />
                                      <span className="text-xs sm:text-sm">View</span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="w-[95vw] max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle>Balance Payment Receipt Viewer</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4">
                                      <div className="flex items-center justify-between mb-4">
                                        <div>
                                          <h3 className="font-medium">Balance Payment Receipt</h3>
                                          <p className="text-sm text-muted-foreground">{selectedCompany.balancePaymentReceipt.name}</p>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const link = document.createElement("a")
                                            link.href = selectedCompany.balancePaymentReceipt.url
                                            link.download = selectedCompany.balancePaymentReceipt.name
                                            document.body.appendChild(link)
                                            link.click()
                                            document.body.removeChild(link)
                                          }}
                                        >
                                          <Download className="h-3.5 w-3.5 mr-1" /> Download
                                        </Button>
                                      </div>
                                      <div className="border rounded-md h-96">
                                        <img
                                          src={selectedCompany.balancePaymentReceipt.url || "/placeholder.svg"}
                                          alt={selectedCompany.balancePaymentReceipt.name}
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ) : selectedCompany.balancePaymentReceipt.type === "application/pdf" ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 flex-1 sm:flex-none">
                                      <Eye className="h-3.5 w-3.5 mr-1" />
                                      <span className="text-xs sm:text-sm">View</span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="w-[95vw] max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle>Balance Payment Receipt Viewer</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4">
                                      <div className="flex items-center justify-between mb-4">
                                        <div>
                                          <h3 className="font-medium">Balance Payment Receipt</h3>
                                          <p className="text-sm text-muted-foreground">{selectedCompany.balancePaymentReceipt.name}</p>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const link = document.createElement("a")
                                            link.href = selectedCompany.balancePaymentReceipt.url
                                            link.download = selectedCompany.balancePaymentReceipt.name
                                            document.body.appendChild(link)
                                            link.click()
                                            document.body.removeChild(link)
                                          }}
                                        >
                                          <Download className="h-3.5 w-3.5 mr-1" /> Download
                                        </Button>
                                      </div>
                                      <div className="border rounded-md h-96">
                                        <iframe src={selectedCompany.balancePaymentReceipt.url || ""} className="w-full h-full" title="PDF Viewer"></iframe>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ) : null}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 flex-1 sm:flex-none"
                                onClick={() => {
                                  const link = document.createElement("a")
                                  link.href = selectedCompany.balancePaymentReceipt.url
                                  link.download = selectedCompany.balancePaymentReceipt.name
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                }}
                              >
                                <Download className="h-3.5 w-3.5 mr-1" /> Download
                              </Button>
                            </div>
                          </div>

                          {canManage && selectedCompany.balancePaymentReceipt.status === 'pending' && (
                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleBalancePaymentApproval(selectedCompany._id, 'approved')}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleBalancePaymentApproval(selectedCompany._id, 'rejected')}
                              >
                                <X className="h-3.5 w-3.5 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        // No balance payment receipt submitted yet
                        <div className="p-4 border rounded-md bg-blue-50/30 border-blue-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 mr-3 text-blue-600" />
                              <div>
                                <h3 className="font-medium">Balance Payment Pending</h3>
                                <p className="text-sm text-muted-foreground">
                                  Customer has not submitted balance payment receipt yet
                                </p>
                                {(() => {
                                  // Find package from the PackagePlan array
                                  const selectedPackage = availablePackages.find(pkg => pkg.id === selectedCompany.selectedPackage || pkg.name === selectedCompany.selectedPackage)

                                  console.log('Debug balance amount (no receipt):', {
                                    availablePackages,
                                    selectedPackageId: selectedCompany.selectedPackage,
                                    selectedPackage,
                                    balanceAmount: selectedPackage?.balanceAmount
                                  })

                                  if (selectedPackage?.balanceAmount) {
                                    return (
                                      <p className="text-sm font-medium text-blue-600 mt-1">
                                        💰 Required Balance Amount: Rs {selectedPackage.balanceAmount.toLocaleString()}
                                      </p>
                                    )
                                  }

                                  return (
                                    <p className="text-xs text-orange-600 mt-1">
                                      Debug: Package ID: {selectedCompany.selectedPackage || 'Not found'} | Packages loaded: {availablePackages.length}
                                    </p>
                                  )
                                })()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Pending</Badge>
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-700">
                              <strong>Note:</strong> The customer needs to submit the balance payment receipt before you can proceed to incorporation.
                              The balance amount for this package is Rs {(() => {
                                const selectedPackage = availablePackages.find(pkg => pkg.id === selectedCompany.selectedPackage || pkg.name === selectedCompany.selectedPackage)
                                return selectedPackage?.balanceAmount?.toLocaleString() || 'Unknown'
                              })()}.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Customer Submitted Documents */}
              {(() => {
                // Check if customer has submitted any documents
                const customerDocuments = selectedCompany.customerDocuments || {}
                const hasCustomerDocuments = Object.keys(customerDocuments).length > 0
                const hasStep3SignedAdditionalDocs = selectedCompany.step3SignedAdditionalDoc && Object.keys(selectedCompany.step3SignedAdditionalDoc).length > 0

                if (!hasCustomerDocuments && !hasStep3SignedAdditionalDocs) {
                  return (
                    <Card className="mt-6">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Customer Submitted Documents</CardTitle>
                        <CardDescription>Documents uploaded by the customer after reviewing your documents</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-6 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                          <p>No customer documents submitted yet</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                // Separate documents by type for better organization
                const normalDocs = Object.entries(customerDocuments).filter(([key, doc]: [string, any]) => key !== 'form18' && key !== 'addressProof' && key !== 'additionalDocuments' && key !== 'step3SignedAdditionalDoc')
                const form18Docs = customerDocuments.form18 || []
                const addressProofDoc = customerDocuments.addressProof ? ['addressProof', customerDocuments.addressProof] : null

                // Handle additional documents
                const additionalDocs = customerDocuments.additionalDocuments ? Object.entries(customerDocuments.additionalDocuments) : []

                // Handle step 3 signed additional documents
                const step3SignedAdditionalDocs = selectedCompany.step3SignedAdditionalDoc ? Object.entries(selectedCompany.step3SignedAdditionalDoc) : []

                const renderDocumentCard = ([key, doc]: [string, any], isForm18 = false) => {
                  return (
                    <Card key={key} className="border-dashed">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-medium text-sm sm:text-base">{doc.title || key}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : ""} • {doc.type || "Unknown type"}
                            </p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-500 hidden sm:block" />
                        </div>

                        <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                            <span className="text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[150px]">{doc.name}</span>
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
                                  <DialogTitle>Document Viewer - {doc.title || key}</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  <div className="flex items-center justify-between mb-4">
                                    <div>
                                      <h3 className="font-medium">{doc.title || key}</h3>
                                      <p className="text-sm text-muted-foreground">{doc.name}</p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (doc.url) {
                                          const link = document.createElement("a")
                                          link.href = doc.url
                                          link.download = doc.name
                                          document.body.appendChild(link)
                                          link.click()
                                          document.body.removeChild(link)
                                        } else if (doc.data) {
                                          const blob = new Blob([doc.data], { type: doc.type || "application/octet-stream" })
                                          const url = URL.createObjectURL(blob)
                                          const link = document.createElement("a")
                                          link.href = url
                                          link.download = doc.name
                                          document.body.appendChild(link)
                                          link.click()
                                          document.body.removeChild(link)
                                          URL.revokeObjectURL(url)
                                        }
                                      }}
                                    >
                                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                                    </Button>
                                  </div>
                                  <div className="border rounded-md h-96">
                                    {doc.type?.startsWith("image/") ? (
                                      <img
                                        src={doc.url || (doc.data ? URL.createObjectURL(new Blob([doc.data], { type: doc.type })) : "/placeholder.svg")}
                                        alt={doc.name}
                                        className="w-full h-full object-contain"
                                      />
                                    ) : doc.type === "application/pdf" ? (
                                      <iframe
                                        src={doc.url || (doc.data ? URL.createObjectURL(new Blob([doc.data], { type: doc.type })) : "")}
                                        className="w-full h-full"
                                        title="PDF Viewer"
                                      ></iframe>
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
                              onClick={() => {
                                if (doc.url) {
                                  const link = document.createElement("a")
                                  link.href = doc.url
                                  link.download = doc.name
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                } else if (doc.data) {
                                  const blob = new Blob([doc.data], { type: doc.type || "application/octet-stream" })
                                  const url = URL.createObjectURL(blob)
                                  const link = document.createElement("a")
                                  link.href = url
                                  link.download = doc.name
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                  URL.revokeObjectURL(url)
                                }
                              }}
                            >
                              <Download className="h-3.5 w-3.5 mr-1" /> Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                };

                return (
                  <Card className="mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Customer Submitted Documents</CardTitle>
                      <CardDescription>Documents uploaded by the customer after reviewing your documents</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Render normal docs first */}
                        {normalDocs.map((doc) => renderDocumentCard(doc))}

                        {/* Then render Form 18 docs */}
                        {form18Docs.map((doc: any, index: number) =>
                          renderDocumentCard(["form18", { ...doc, title: `FORM 18 - Director ${index + 1}` }], true)
                        )}

                        {/* Finally render address proof if it exists */}
                        {addressProofDoc && renderDocumentCard(addressProofDoc)}

                        {/* Render additional documents */}
                        {additionalDocs.length > 0 && (
                          <>
                            <div className="col-span-full mt-4 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">Additional Documents</h3>
                              <p className="text-sm text-gray-600">Signed additional documents submitted by the customer</p>
                            </div>
                            {additionalDocs.map(([title, doc]: [string, any]) =>
                              renderDocumentCard([title, { ...doc, title: `Signed ${title}` }])
                            )}
                          </>
                        )}

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
                      </div>

                      {/* Continue to Incorporation button at the bottom */}
                      {canManage && (
                        <div className="flex justify-end mt-6 pt-4 border-t">
                          <Button
                            onClick={() => onApproveDocuments(selectedCompany._id)}
                            className="gap-2"
                            disabled={(() => {
                              // Get the selected package
                              const selectedPackage = availablePackages.find(pkg => pkg.id === selectedCompany.selectedPackage)

                              // Check if this is an advance+balance package that requires balance payment approval
                              const requiresBalancePayment = selectedPackage?.type === "advance-balance"

                              // Check if customer has submitted documents
                              const hasCustomerDocuments = selectedCompany.customerDocuments &&
                                Object.keys(selectedCompany.customerDocuments).length > 0

                              // For one-time packages: Enable if customer has submitted documents
                              if (!requiresBalancePayment) {
                                return !hasCustomerDocuments // Only disable if no documents submitted
                              }

                              // For advance+balance packages: Enable only if balance payment is approved AND documents submitted
                              if (requiresBalancePayment) {
                                return !balancePaymentApproved || !hasCustomerDocuments
                              }

                              return true // Default to disabled
                            })()}
                          >
                            <CheckCircle className="h-4 w-4" /> Continue to Incorporation
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}

          {/* Step 4: Incorporation */}
          {viewStep === 4 && (
            <div className="space-y-6">
              <Card className="overflow-hidden border bg-card text-card-foreground shadow-sm relative">
                {selectedCompany.status === "completed" ? (
                  <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8">
                    <div className="absolute transform rotate-45 bg-green-50/50 w-full h-full"></div>
                  </div>
                ) : (
                  <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8">
                    <div className="absolute transform rotate-45 bg-indigo-50/50 w-full h-full"></div>
                  </div>
                )}

                <CardHeader className="pb-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Incorporation Status</CardTitle>
                      <CardDescription>Registration process status</CardDescription>
                    </div>
                    {selectedCompany.status === "completed" ? (
                      <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        <CheckCircle className="h-4 w-4" />
                        <span>Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        <span>In Progress</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pb-6 relative z-10">
                  {selectedCompany.status === "completed" ? (
                    <div className="flex items-start space-x-4 mt-4">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium mb-1">Successfully Incorporated</h3>
                        <p className="text-sm text-muted-foreground">
                          All documents have been processed and the company has been officially registered.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-4 mt-4">
                      <div className="bg-indigo-100 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium mb-1">Processing Registration</h3>
                        <p className="text-sm text-muted-foreground">
                          Documents approved and incorporation is being processed by the registrar.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Incorporation Certificate & Documents</CardTitle>
                      <CardDescription>Upload the official incorporation certificate and additional documents for the customer</CardDescription>
                    </div>
                    {canManage && (
                      <Button
                        onClick={() => setShowAddDocumentDialog(true)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add Document
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Incorporation Certificate */}
                  <div>
                    <h4 className="font-medium text-sm mb-3">Incorporation Certificate</h4>
                    <DocumentUploadCard
                      title="Incorporation Certificate"
                      description="Official certificate of incorporation"
                      document={pendingStep4Documents.incorporationCertificate || selectedCompany.incorporationCertificate}
                      onUpload={(file: File) => handleDocumentUpload(selectedCompany._id, "incorporationCertificate", file)}
                      disabled={!canManage}
                      showReplace={canManage}
                    />
                  </div>

                  {/* Additional Documents */}
                  <div>
                    <h4 className="font-medium text-sm mb-3">Additional Documents</h4>
                    {(pendingStep4Documents.additionalDocuments && pendingStep4Documents.additionalDocuments.length > 0) || (selectedCompany.additionalDocuments && selectedCompany.additionalDocuments.length > 0) ? (
                      <div className="space-y-3">
                        {/* Show pending additional documents first */}
                        {pendingStep4Documents.additionalDocuments && pendingStep4Documents.additionalDocuments.map((doc: any, index: number) => (
                          <div key={`pending-${index}`} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="font-medium text-sm">{doc.title}</p>
                                <p className="text-xs text-muted-foreground">{doc.name} (Pending)</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600">
                                <Clock className="h-3.5 w-3.5 mr-1" /> Pending
                              </Button>
                            </div>
                          </div>
                        ))}
                        {/* Show existing additional documents */}
                        {selectedCompany.additionalDocuments && selectedCompany.additionalDocuments.map((doc: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-primary" />
                              <div>
                                <p className="font-medium text-sm">{doc.title}</p>
                                <p className="text-xs text-muted-foreground">{doc.name}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 px-2">
                                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>Document Viewer - {doc.title}</DialogTitle>
                                  </DialogHeader>
                                  <div className="mt-4">
                                    <div className="flex items-center justify-between mb-4">
                                      <div>
                                        <p className="text-sm font-medium">
                                          <FileText className="h-4 w-4 inline mr-1" />
                                          {doc.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : ""} • {doc.type || "Unknown type"}
                                        </p>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (doc.url) {
                                            const link = document.createElement("a")
                                            link.href = doc.url
                                            link.download = doc.name
                                            document.body.appendChild(link)
                                            link.click()
                                            document.body.removeChild(link)
                                          } else if (doc.data) {
                                            const blob = new Blob([doc.data], { type: doc.type || "application/octet-stream" })
                                            const url = URL.createObjectURL(blob)
                                            const link = document.createElement("a")
                                            link.href = url
                                            link.download = doc.name
                                            document.body.appendChild(link)
                                            link.click()
                                            document.body.removeChild(link)
                                            URL.revokeObjectURL(url)
                                          }
                                        }}
                                      >
                                        <Download className="h-4 w-4 mr-1" /> Download
                                      </Button>
                                    </div>
                                    <div className="border rounded-md p-2 bg-muted/20">
                                      {doc.type?.startsWith("image/") ? (
                                        <img
                                          src={doc.url || (doc.data ? URL.createObjectURL(new Blob([doc.data], { type: doc.type })) : "/placeholder.svg")}
                                          alt={doc.name}
                                          className="max-w-full h-auto mx-auto"
                                          style={{ maxHeight: "70vh" }}
                                        />
                                      ) : doc.type === "application/pdf" ? (
                                        <div className="aspect-video">
                                          <iframe
                                            src={doc.url || (doc.data ? URL.createObjectURL(new Blob([doc.data], { type: doc.type })) : "")}
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
                              {canManage && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveAdditionalDocument(selectedCompany._id, index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                        <FileText className="h-6 w-6 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No additional documents added yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                {canManage && (
                  <CardFooter className="flex justify-end gap-3">
                    {showCompleteSuccess && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm animate-in slide-in-from-left duration-300">
                        <CheckCircle className="h-4 w-4" />
                        <span>Registration completed successfully! Customer can now access step 4.</span>
                      </div>
                    )}
                    <Button
                      onClick={handleSubmitDocuments}
                      variant="outline"
                      className="gap-2"
                    >
                      <FileCheck className="h-4 w-4" /> Submit Documents
                    </Button>
                    {!completeRegistrationClicked && (
                      <Button
                        onClick={handleCompleteRegistration}
                        disabled={!documentsSubmitted}
                        className="gap-2"
                        title={!documentsSubmitted ? "Submit documents first to enable this button" : "Click to complete registration"}
                      >
                        <CheckCircle className="h-4 w-4" /> Complete Registration
                      </Button>
                    )}
                  </CardFooter>
                )}
              </Card>

              {/* Add Document Dialog */}
              <Dialog open={showAddDocumentDialog} onOpenChange={setShowAddDocumentDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Additional Document</DialogTitle>
                    <DialogDescription>
                      Add a new document for the customer to download
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="document-title">Document Title</Label>
                      <Input
                        id="document-title"
                        value={additionalDocumentTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdditionalDocumentTitle(e.target.value)}
                        placeholder="Enter document title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="document-file">Document File</Label>
                      <Input
                        id="document-file"
                        type="file"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (e.target.files && e.target.files[0]) {
                            setAdditionalDocumentFile(e.target.files[0])
                          }
                        }}
                      />
                      {additionalDocumentFile && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Selected: {additionalDocumentFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDocumentDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddDocumentSubmit}
                      disabled={!additionalDocumentTitle.trim() || !additionalDocumentFile}
                    >
                      Add Document
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {showSuccess && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="bg-green-600 text-white px-6 py-3 rounded shadow-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" /> Incorporation certificate and documents have been successfully submitted to customer
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
