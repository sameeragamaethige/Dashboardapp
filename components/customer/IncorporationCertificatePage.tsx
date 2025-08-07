"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle2, Download, ArrowLeft, LogOut, FileText, Eye } from "lucide-react"
import { LocalStorageService } from "@/lib/database-service"

type IncorporationCertificatePageProps = {
  companyId: string
  navigateTo: (page: string) => void
  onLogout: () => void
}

export default function IncorporationCertificatePage({
  companyId,
  navigateTo,
  onLogout,
}: IncorporationCertificatePageProps) {
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<any>(null)

  useEffect(() => {
    // Load company data from database
    const loadCompanyData = async () => {
      try {
        console.log('🔍 Loading company data for customer view:', companyId)
        const registration = await LocalStorageService.getRegistrationById(companyId)
        if (registration) {
          console.log('✅ Company data loaded from database:', registration)
          console.log('📄 Incorporation Certificate:', registration.incorporationCertificate)
          console.log('📁 Step 4 Additional Documents:', registration.step4FinalAdditionalDoc)
          setCompany(registration)
        } else {
          console.log('⚠️ Company not found in database, trying localStorage fallback')
          // Fallback to localStorage
          const savedRegistrations = localStorage.getItem("registrations")
          if (savedRegistrations) {
            const registrations = JSON.parse(savedRegistrations)
            const fallbackRegistration = registrations.find((reg: any) => reg._id === companyId)
            if (fallbackRegistration) {
              console.log('✅ Company found in localStorage fallback')
              console.log('📄 Incorporation Certificate (fallback):', fallbackRegistration.incorporationCertificate)
              console.log('📁 Step 4 Additional Documents (fallback):', fallbackRegistration.step4FinalAdditionalDoc)
              setCompany(fallbackRegistration)
            } else {
              setCompany(null)
            }
          } else {
            setCompany(null)
          }
        }
      } catch (error) {
        console.error('❌ Error loading company data:', error)
        setCompany(null)
      } finally {
        setLoading(false)
      }
    }

    loadCompanyData()

    // Listen for registration updates (when admin submits documents)
    const handleRegistrationUpdate = async (event: any) => {
      if (event.detail?.companyId === companyId) {
        console.log('🔄 Registration update received, reloading data...')
        await loadCompanyData()
      }
    }

    window.addEventListener("registration-updated", handleRegistrationUpdate)

    return () => {
      window.removeEventListener("registration-updated", handleRegistrationUpdate)
    }
  }, [companyId])

  const handleViewDocument = (document: any) => {
    setViewingDocument(document)
    setViewDialogOpen(true)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!company) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground mb-4">Company not found</p>
          <Button onClick={() => navigateTo("customerDashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateTo("customerDashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Company Documents</h1>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <Card className="w-full">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="text-xl font-semibold">Company Registration Complete</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Your company {company.companyNameEnglish || company.companyName} has been successfully registered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-4 sm:px-6">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700 text-sm">Registration Successful</AlertTitle>
              <AlertDescription className="text-green-700 text-sm">
                Your company has been successfully incorporated in Sri Lanka. You can download your incorporation
                certificate below.
              </AlertDescription>
            </Alert>


          </CardContent>
        </Card>

        {/* Modern Incorporation Certificate & Documents Card */}
        <Card className="w-full border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-3 text-center px-3 sm:px-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 text-center">Incorporation Certificate & Documents</CardTitle>
              <CardDescription className="text-xs text-muted-foreground text-center mt-1 px-2">
                Access your official documents
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 space-y-4">
            {/* Incorporation Certificate Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="flex items-start sm:items-center justify-between mb-3 gap-2">
                <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-800 text-sm">Incorporation Certificate</h4>
                    <p className="text-xs text-muted-foreground">Official registration document</p>
                  </div>
                </div>
                {company.incorporationCertificate && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium hidden sm:inline">Available</span>
                  </div>
                )}
              </div>

              {company.incorporationCertificate ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 break-words sm:truncate text-sm leading-tight">{company.incorporationCertificate.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 sm:mt-0">
                        {company.incorporationCertificate.size
                          ? `${(company.incorporationCertificate.size / 1024).toFixed(1)} KB`
                          : "Document"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1 sm:flex-none px-3"
                      onClick={() => handleViewDocument(company.incorporationCertificate)}
                    >
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white flex-1 sm:flex-none px-3"
                      onClick={() => {
                        if (company.incorporationCertificate.url) {
                          const link = document.createElement("a")
                          link.href = company.incorporationCertificate.url
                          link.download = company.incorporationCertificate.name
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground border border-dashed border-gray-200 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">Certificate not available yet</p>
                  <p className="text-xs">Our team is processing your incorporation certificate</p>
                </div>
              )}
            </div>

            {/* Step 4 Additional Documents Section */}
            {company.step4FinalAdditionalDoc && company.step4FinalAdditionalDoc.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                <div className="flex items-start sm:items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-800 text-sm">Step 4 Additional Documents</h4>
                    <p className="text-xs text-muted-foreground">Additional documents provided by the administrator</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {company.step4FinalAdditionalDoc.map((doc: any, index: number) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 break-words sm:truncate text-sm leading-tight" title={doc.title || doc.name}>
                            {doc.title || doc.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 sm:mt-0 break-words sm:truncate">
                            {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : "Document"} • {doc.type || "File"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1 sm:flex-none px-3"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 flex-1 sm:flex-none px-3"
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
                          <Download className="h-3 w-3 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Step 4 Additional Documents Message */}
            {(!company.step4FinalAdditionalDoc || company.step4FinalAdditionalDoc.length === 0) && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                <div className="flex items-start sm:items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-800 text-sm">Step 4 Additional Documents</h4>
                    <p className="text-xs text-muted-foreground">Additional documents provided by the administrator</p>
                  </div>
                </div>

                <div className="text-center py-3 sm:py-4 text-muted-foreground border border-dashed border-gray-200 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">No additional documents</p>
                  <p className="text-xs px-2">Additional documents will appear here when available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {viewingDocument?.title || viewingDocument?.name || "Document Viewer"}
              </DialogTitle>
              <DialogDescription>
                {viewingDocument?.type || "Document"} • {viewingDocument?.size ? `${(viewingDocument.size / 1024).toFixed(1)} KB` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {viewingDocument && (
                <div className="border rounded-md p-2 bg-muted/20">
                  {viewingDocument.type?.startsWith("image/") ? (
                    <img
                      src={viewingDocument.url || (viewingDocument.data ? URL.createObjectURL(new Blob([viewingDocument.data], { type: viewingDocument.type })) : "/placeholder.svg")}
                      alt={viewingDocument.name}
                      className="max-w-full h-auto mx-auto"
                      style={{ maxHeight: "60vh" }}
                    />
                  ) : viewingDocument.type === "application/pdf" ? (
                    <div className="aspect-video">
                      <iframe
                        src={viewingDocument.url || (viewingDocument.data ? URL.createObjectURL(new Blob([viewingDocument.data], { type: viewingDocument.type })) : "")}
                        className="w-full h-full"
                        title="PDF Viewer"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">This file type cannot be previewed in the browser.</p>
                      <Button
                        onClick={() => {
                          if (viewingDocument.url) {
                            const link = document.createElement("a")
                            link.href = viewingDocument.url
                            link.download = viewingDocument.name
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          } else if (viewingDocument.data) {
                            const blob = new Blob([viewingDocument.data], { type: viewingDocument.type || "application/octet-stream" })
                            const url = URL.createObjectURL(blob)
                            const link = document.createElement("a")
                            link.href = url
                            link.download = viewingDocument.name
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            URL.revokeObjectURL(url)
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" /> Download to View
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}
