"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  FileText,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  Briefcase,
  Users,
  Target,
} from "lucide-react"
import { LocalStorageService } from "@/lib/database-service"

type CustomerDashboardProps = {
  user: any
  navigateTo: (page: string, companyId?: string) => void
  onLogout: () => void
  registrations?: any[]
}

export default function CustomerDashboard({ user, navigateTo, onLogout, registrations }: CustomerDashboardProps) {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("companies")
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    // Function to load data
    const loadData = async () => {
      try {
        setLoading(true)
        console.log('🔄 Loading customer dashboard data...')

        // First try to load from database
        let databaseRegistrations = []
        try {
          databaseRegistrations = await LocalStorageService.getRegistrations()
          console.log('✅ Customer dashboard loaded registrations from database:', databaseRegistrations.length)
        } catch (dbError) {
          console.warn('⚠️ Database unavailable, using fallback:', dbError)
        }

        // Use database registrations if available, otherwise use props
        let allRegistrations = databaseRegistrations.length > 0 ? databaseRegistrations : registrations

        // If still no data, try localStorage as final fallback
        if (!allRegistrations || allRegistrations.length === 0) {
          const savedRegistrations = localStorage.getItem("registrations")
          if (savedRegistrations) {
            const parsedRegistrations = JSON.parse(savedRegistrations)
            if (parsedRegistrations && parsedRegistrations.length > 0) {
              allRegistrations = parsedRegistrations
              console.log('📦 Loaded from localStorage fallback:', allRegistrations.length)
            }
          }
        }

        // Sort registrations by updatedAt date (newest first)
        const sortedRegistrations = [...(allRegistrations || [])].sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
          return dateB - dateA
        })

        setCompanies(sortedRegistrations)
        console.log('🎉 Customer dashboard loaded companies:', sortedRegistrations.length)

        // Log each company for debugging
        sortedRegistrations.forEach((company, index) => {
          console.log(`   ${index + 1}. ${company.companyName || company.companyNameEnglish} - ${company.status} (ID: ${company._id})`)
          console.log(`      📊 Company Data:`, {
            id: company._id || company.id,
            companyName: company.companyName,
            companyNameEnglish: company.companyNameEnglish,
            contactPersonName: company.contactPersonName,
            status: company.status,
            currentStep: company.currentStep,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt
          })
        })
      } catch (error) {
        console.error('❌ Error loading companies:', error)
        setCompanies([])
      } finally {
        setLoading(false)
      }
    }

    // Initial load
    loadData()

    // Initial load only - registration updates handled in separate useEffect
  }, [registrations, user])

  // Component mount effect - force initial load
  useEffect(() => {
    console.log('🚀 CustomerDashboard mounted, forcing initial data load...')
    const forceLoad = async () => {
      try {
        setLoading(true)
        const databaseRegistrations = await LocalStorageService.getRegistrations()
        const sortedRegistrations = [...databaseRegistrations].sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
          return dateB - dateA
        })
        setCompanies(sortedRegistrations)
        console.log('🚀 Initial load completed:', sortedRegistrations.length)
      } catch (error) {
        console.error('❌ Error in initial load:', error)
      } finally {
        setLoading(false)
      }
    }
    forceLoad()
  }, [])

  // Separate useEffect for handling registration updates
  useEffect(() => {
    const handleRegistrationUpdate = (event: any) => {
      console.log('🔄 Registration update detected, refreshing customer dashboard...', event.detail)
      // Force a refresh from database
      const refreshFromDatabase = async () => {
        try {
          setLoading(true)
          const databaseRegistrations = await LocalStorageService.getRegistrations()
          const sortedRegistrations = [...databaseRegistrations].sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
            return dateB - dateA
          })
          setCompanies(sortedRegistrations)
          console.log('🔄 Refreshed companies from database:', sortedRegistrations.length)
        } catch (error) {
          console.error('❌ Error refreshing from database:', error)
        } finally {
          setLoading(false)
        }
      }
      refreshFromDatabase()
    }

    window.addEventListener("registration-updated", handleRegistrationUpdate)
    return () => {
      window.removeEventListener("registration-updated", handleRegistrationUpdate)
    }
  }, [])

  const handleRegisterNewCompany = () => {
    // Use a special identifier "new" to indicate this is a brand new registration
    // This will ensure we start from the first step (contact-details)
    navigateTo("companyRegistration", "new")
  }

  const handleContinueRegistration = (companyId: string) => {
    // Find the company in our list
    const company = companies.find((c) => c._id === companyId)

    if (company) {
      // Set the selected company ID and navigate to the registration flow
      // The registration flow will determine the correct step based on the company data
      navigateTo("companyRegistration", companyId)

      // In a real app, you might want to pass additional information about the current step
      // For example, you could use a URL parameter or state management
      console.log(`Continuing registration for company ${companyId} at step ${company.currentStep}`)
    } else {
      console.error(`Company with ID ${companyId} not found`)
    }
  }

  const handleCancelRegistration = async (companyId: string) => {
    try {
      console.log('🗑️ Cancelling registration:', companyId);

      // Delete from database
      await LocalStorageService.deleteRegistration(companyId);
      console.log('✅ Registration deleted from database');

      // Update local state
      const updatedCompanies = companies.filter((company) => company._id !== companyId);
      setCompanies(updatedCompanies);

      // Update localStorage
      localStorage.setItem("registrations", JSON.stringify(updatedCompanies));

      // Dispatch event to notify other components
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "registration-deleted",
            registrationId: companyId,
          },
        })
      );

      console.log('✅ Registration cancelled successfully');
    } catch (error) {
      console.error('❌ Error cancelling registration:', error);
      // Fallback to localStorage only if database deletion fails
      const updatedCompanies = companies.filter((company) => company._id !== companyId);
      setCompanies(updatedCompanies);
      localStorage.setItem("registrations", JSON.stringify(updatedCompanies));
    }
  }

  // Update the getStatusBadge function to include the "completed" status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "payment-processing":
        return (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm"
          >
            <Clock className="w-3 h-3 mr-1" />
            Payment Processing
          </Badge>
        )
      case "payment-rejected":
        return (
          <Badge variant="outline" className="bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-300 shadow-sm">
            <AlertCircle className="w-3 h-3 mr-1" />
            Payment Rejected
          </Badge>
        )
      case "documentation-processing":
        return (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-200 shadow-sm"
          >
            <FileText className="w-3 h-3 mr-1" />
            Documentation Processing
          </Badge>
        )
      case "incorporation-processing":
        return (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 shadow-sm"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Incorporation Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200 shadow-sm"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      default:
        // Default to Payment Processing for any unrecognized status
        return (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm"
          >
            <Clock className="w-3 h-3 mr-1" />
            Payment Processing
          </Badge>
        )
    }
  }

  const refreshData = async () => {
    try {
      console.log('🔄 Manual refresh triggered...')
      setLoading(true)
      const databaseRegistrations = await LocalStorageService.getRegistrations()
      const sortedRegistrations = [...databaseRegistrations].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return dateB - dateA
      })
      setCompanies(sortedRegistrations)
      console.log('✅ Manual refresh completed:', sortedRegistrations.length)

      // Log each company for debugging
      sortedRegistrations.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.companyName || company.companyNameEnglish} - ${company.status} (ID: ${company._id})`)
      })
    } catch (error) {
      console.error('❌ Error refreshing companies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(".relative")) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  // No registrations empty state component
  const NoRegistrationsCard = () => (
    <div className="col-span-full">
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary/5 border-2 border-dashed border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-8">
            {/* Removed Building2 icon as requested */}
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Start Your Business Journey?</h3>
          <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
            You haven't registered any companies yet. Take the first step towards building your business empire with our
            streamlined incorporation process.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-2xl">
            <div key="fast-process" className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Fast Process</h4>
              <p className="text-sm text-gray-600">Complete registration in just a few steps</p>
            </div>

            <div key="expert-support" className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Expert Support</h4>
              <p className="text-sm text-gray-600">Get help from our incorporation specialists</p>
            </div>

            <div key="all-in-one" className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center mb-3">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">All-in-One</h4>
              <p className="text-sm text-gray-600">Everything you need to get started</p>
            </div>
          </div>

          <Button
            onClick={handleRegisterNewCompany}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
          >
            <Plus className="w-5 h-5 mr-2" />
            Register Your First Company
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // Helper for progress percentage by step
  const stepOrder = ["contact-details", "company-details", "documentation", "incorporate"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-sm border">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-600">Loading your companies...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList>
                <TabsTrigger value="companies">All Companies</TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <TabsContent value="companies">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {companies.length === 0 ? (
                  <NoRegistrationsCard />
                ) : (
                  <>
                    {/* New Registration Card */}
                    <Card
                      className="group relative overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg hover:scale-[1.01] col-span-full sm:col-span-1 px-2 py-2 min-h-[240px] h-[240px] flex flex-col"
                      onClick={handleRegisterNewCompany}
                    >
                      <CardContent className="flex flex-col items-center justify-start py-5 text-center relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative z-10 flex flex-1 w-full h-full items-start justify-center text-center pt-0">
                          <div className="flex flex-col items-center w-full">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-300 shadow-lg mx-auto">
                              <Plus className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <h3 className="text-base font-semibold mb-0.5 text-gray-900">Start New Registration</h3>
                            <p className="text-xs text-gray-600 mb-2 max-w-xs">
                              Begin the journey to incorporate your new company with our streamlined process
                            </p>
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow transition-all duration-300 group-hover:scale-105 text-xs py-2 mt-0.5">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Get Started
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Existing Company Cards */}
                    {companies.map((company: any, index: number) => {
                      // Progress: Only show completed steps. 1 step completed = 25%, 2 = 50%, 3 = 75%, 4 = 100%
                      let progressPercent = 0;
                      const status = company.status || 'payment-processing';

                      // If status is completed, show 100%
                      if (status === 'completed') {
                        progressPercent = 100;
                      } else {
                        const stepIdx = company.currentStep ? stepOrder.indexOf(company.currentStep) : -1;
                        // Only count steps before the current step as completed
                        if (stepIdx > 0 && stepIdx <= stepOrder.length) {
                          progressPercent = (stepIdx / stepOrder.length) * 100;
                        } else if (stepIdx === 0) {
                          progressPercent = 0;
                        } else if (stepIdx === stepOrder.length - 1) {
                          progressPercent = 100;
                        }
                      }
                      return (
                        <Card
                          key={company._id || `company-${index}`}
                          className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01] bg-white px-2 py-2 min-h-[240px] h-[240px] flex flex-col ${(company.status || "") === "payment-rejected"
                            ? "border-red-200 shadow-red-100"
                            : "border-gray-200 shadow-gray-100"
                            }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <CardHeader
                            className={`pb-2 pt-3 px-3 relative z-10 ${(company.status || "") === "payment-rejected"
                              ? "bg-gradient-to-r from-red-50 to-pink-50"
                              : "bg-gradient-to-r from-gray-50 to-slate-50"
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base font-semibold text-gray-900 mb-0 truncate">
                                  {company.companyNameEnglish || company.companyName}
                                </CardTitle>
                                <CardDescription className="text-xs text-gray-500">
                                  Started {company.createdAt ? new Date(company.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                                </CardDescription>
                              </div>
                              <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-gray-600" />
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="relative z-10 space-y-2 px-3 py-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-700">Status</span>
                              {getStatusBadge(company.status || "payment-processing")}
                            </div>



                            {(company.status || "") === "payment-rejected" ? (
                              <Alert
                                variant="destructive"
                                className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 py-2 px-2"
                              >
                                <AlertCircle className="h-3 w-3" />
                                <AlertTitle className="text-xs font-medium">Payment Rejected</AlertTitle>
                                <AlertDescription className="text-xs">
                                  Your payment has been rejected. Please start a new registration.
                                </AlertDescription>
                              </Alert>
                            ) : (company.status || "") === "completed" ? (
                              <Alert className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 py-2 px-2">
                                <CheckCircle2 className="h-3 w-3 text-gray-500" />
                                <AlertTitle className="text-xs font-medium text-gray-700">
                                  Registration Complete
                                </AlertTitle>
                                <AlertDescription className="text-xs text-gray-700">
                                  Your company has been successfully incorporated.
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-medium text-gray-700">Progress</span>
                                  <span className="text-gray-600">
                                    {progressPercent}%
                                  </span>
                                </div>

                                <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>

                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Current Step:</span> {company.currentStep ? company.currentStep.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Not Started"}
                                </div>
                              </div>
                            )}
                          </CardContent>

                          <CardFooter className="relative z-10 pt-2 px-3 pb-3">
                            {(company.status || "") === "payment-rejected" ? (
                              <Button
                                variant="destructive"
                                className="w-full bg-gradient-to-r from-red-500 to-pink-600 shadow transition-all duration-300 text-xs py-2"
                                onClick={() => handleCancelRegistration(company._id)}
                              >
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Cancel Registration
                              </Button>
                            ) : (company.status || "") === "completed" ? (
                              <Button
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow transition-all duration-300 text-xs py-2"
                                onClick={() => navigateTo("incorporationCertificate", company._id)}
                              >
                                <Building2 className="w-3 h-3 mr-1" />
                                Manage Company
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                className="w-full border-2 bg-primary text-primary-foreground border-primary shadow-sm transition-all duration-300 text-xs py-2"
                                onClick={() => handleContinueRegistration(company._id)}
                              >
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Continue Registration
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
