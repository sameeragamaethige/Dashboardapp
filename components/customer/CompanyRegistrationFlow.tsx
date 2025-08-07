"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ArrowLeft, Lock, FileText } from "lucide-react"
import ContactDetailsStep from "./registration-steps/ContactDetailsStep"
import CompanyDetailsStep from "./registration-steps/CompanyDetailsStep"
import DocumentationStep from "./registration-steps/DocumentationStep"
import IncorporateStep from "./registration-steps/IncorporateStep"
import { DatabaseService } from "@/lib/database-service"

const steps = [
  { id: "contact-details", title: "Contact Details" },
  { id: "company-details", title: "Company Details" },
  { id: "documentation", title: "Documentation" },
  { id: "incorporate", title: "Incorporate" },
]

// Empty company data template with only required default values
const emptyCompanyData = {
  _id: "",
  companyName: "",
  contactPersonName: "",
  contactPersonEmail: "",
  contactPersonPhone: "",
  selectedPackage: "",
  paymentMethod: "bankTransfer", // Default payment method
  currentStep: "contact-details",
  paymentApproved: false,
  detailsApproved: false,
  documentsApproved: false,
  paymentReceipt: null,
  status: "payment-processing", // Default status
}

type CompanyRegistrationFlowProps = {
  user: any
  companyId: string | null
  navigateTo: (page: string) => void
  onLogout: () => void
  bankDetails: any
  onSaveRegistration: (data: any) => Promise<void>
}

export default function CompanyRegistrationFlow({
  user,
  companyId,
  navigateTo,
  onLogout,
  bankDetails,
  onSaveRegistration,
}: CompanyRegistrationFlowProps) {
  const [activeStep, setActiveStep] = useState("contact-details")
  const [companyData, setCompanyData] = useState<any>(emptyCompanyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Add a check at the beginning of the component to redirect if payment is rejected
  useEffect(() => {
    // Redirect to dashboard if payment is rejected
    if (!loading && companyData && companyData.status === "payment-rejected") {
      // Add a small delay to ensure the UI updates before redirecting
      const timer = setTimeout(() => {
        navigateTo("customerDashboard")
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [companyData, loading, navigateTo])

  // Function to load the latest company data from database/localStorage
  const loadLatestCompanyData = async () => {
    if (companyId) {
      try {
        console.log("🔍 Loading registration data for companyId:", companyId)

        // First try to get by ID from MySQL database
        const registration = await DatabaseService.getRegistrationById(companyId)
        if (registration) {
          console.log("✅ Found registration by ID from MySQL database:", registration.currentStep)
          console.log("✅ Registration status:", registration.status)
          return registration
        }

        // If not found in database, try localStorage fallback
        console.log("⚠️ Registration not found in MySQL database, trying localStorage fallback...")
        const savedRegistrations = localStorage.getItem("registrations")
        if (savedRegistrations) {
          const allRegistrations = JSON.parse(savedRegistrations)

          // Try to find by company name or other fields
          const foundRegistration = allRegistrations.find((reg: any) => {
            return reg._id === companyId ||
              reg.companyName === companyId ||
              reg.companyNameEnglish === companyId
          })

          if (foundRegistration) {
            console.log("✅ Found registration by search in localStorage:", foundRegistration.currentStep)
            console.log("✅ Registration status:", foundRegistration.status)
            return foundRegistration
          }
        }

        console.log("❌ No registration found for companyId:", companyId)
        return null
      } catch (error) {
        console.error("❌ Error loading registration:", error)
        return null
      }
    }
    return null
  }

  // Function to get saved step from localStorage
  const getSavedStep = (companyId: string): string | null => {
    try {
      const savedStep = localStorage.getItem(`registration_step_${companyId}`)
      if (savedStep) {
        console.log("💾 Found saved step in localStorage:", savedStep)
        return savedStep
      }
    } catch (error) {
      console.error("❌ Error loading saved step:", error)
    }
    return null
  }

  useEffect(() => {
    console.log("🚀 Customer component mounted - CompanyId:", companyId)
    console.log("🚀 Setting up event listeners and polling...")

    // Load company data
    const loadCompanyData = async () => {
      if (companyId) {
        // Check if this is a new registration request
        if (companyId === "new") {
          // For a new registration, always start at the first step with empty data
          const newCompany = {
            ...emptyCompanyData,
            _id: "new-" + Date.now(),
            currentStep: "contact-details", // Explicitly set to first step
            status: "payment-processing", // Start with payment processing
          }
          setCompanyData(newCompany)
          setActiveStep("contact-details") // Force the first step
        } else {
          // Try to load from database/localStorage
          const loadedData = await loadLatestCompanyData()

          if (loadedData) {
            console.log("✅ Loaded existing registration:", loadedData.currentStep)
            setCompanyData(loadedData)

            // If registration has been completed, allow access to step 4
            if (loadedData.status === "completed") {
              console.log("Registration completed, setting active step to incorporate")
              setActiveStep("incorporate")
            } else {
              setActiveStep(loadedData.currentStep)
            }
          } else {
            // Check for saved step in localStorage
            const savedStep = getSavedStep(companyId)
            if (savedStep) {
              console.log("💾 Using saved step from localStorage:", savedStep)
              // Try to find any registration to use as base data
              try {
                const savedRegistrations = localStorage.getItem("registrations")
                const allRegistrations = savedRegistrations ? JSON.parse(savedRegistrations) : []
                if (allRegistrations.length > 0) {
                  const baseRegistration = allRegistrations[0] // Use most recent
                  const updatedRegistration = {
                    ...baseRegistration,
                    currentStep: savedStep
                  }
                  setCompanyData(updatedRegistration)
                  setActiveStep(savedStep)
                } else {
                  // Create fallback data with saved step
                  const fallbackData = {
                    ...emptyCompanyData,
                    _id: companyId,
                    currentStep: savedStep,
                    status: "payment-processing",
                  }
                  setCompanyData(fallbackData)
                  setActiveStep(savedStep)
                }
              } catch (error) {
                console.error("❌ Error using saved step:", error)
              }
            } else {
              // If not found, check if this might be a completed Step 1 registration
              console.log("⚠️ Registration not found, checking if Step 1 was completed...")

              // Try to find any registration for this user/company
              try {
                const savedRegistrations = localStorage.getItem("registrations")
                const allRegistrations = savedRegistrations ? JSON.parse(savedRegistrations) : []
                const existingRegistration = allRegistrations.find((reg: any) =>
                  reg._id === companyId || reg.companyName === companyId
                )

                if (existingRegistration) {
                  console.log("✅ Found existing registration:", existingRegistration.currentStep)
                  setCompanyData(existingRegistration)
                  setActiveStep(existingRegistration.currentStep)
                } else {
                  // Check if there are any registrations at all (user might have completed Step 1)
                  if (allRegistrations.length > 0) {
                    // Use the most recent registration
                    const mostRecentRegistration = allRegistrations[0] // Already sorted by date
                    console.log("✅ Using most recent registration:", mostRecentRegistration.currentStep)
                    setCompanyData(mostRecentRegistration)
                    setActiveStep(mostRecentRegistration.currentStep)
                  } else {
                    // Fallback: assume they completed Step 1
                    console.log("📝 Assuming Step 1 completed, setting to Step 2")
                    const fetchedCompany = {
                      ...emptyCompanyData,
                      _id: companyId,
                      currentStep: "company-details", // They've completed contact details
                      status: "payment-processing",
                      paymentApproved: false,
                    }
                    setCompanyData(fetchedCompany)
                    setActiveStep(fetchedCompany.currentStep)
                  }
                }
              } catch (error) {
                console.error("❌ Error checking registrations:", error)
                // Fallback: assume they completed Step 1
                const fetchedCompany = {
                  ...emptyCompanyData,
                  _id: companyId,
                  currentStep: "company-details", // They've completed contact details
                  status: "payment-processing",
                  paymentApproved: false,
                }
                setCompanyData(fetchedCompany)
                setActiveStep(fetchedCompany.currentStep)
              }
            }
          }
        }
      }

      setLoading(false)
    }

    loadCompanyData()
  }, [companyId])

  // Listen for registration updates
  useEffect(() => {
    const handleRegistrationUpdate = async (event: any) => {
      console.log("🔄 Registration update event received:", event.detail)
      console.log("🔄 Current companyId:", companyId)
      console.log("🔄 Event companyId:", event.detail?.companyId)

      if (companyId && event.detail?.companyId === companyId) {
        console.log("✅ Update is for current company, processing...")

        // Handle registration-completed event specifically
        if (event.detail?.type === "registration-completed") {
          console.log("🎯 Registration-completed event detected - granting step 4 access")

          // Immediately grant access to step 4
          setActiveStep("incorporate")
          console.log("🎉 Step 4 access granted immediately")

          // Also update the company data in background
          setTimeout(async () => {
            console.log("🔄 Updating company data in background...")
            const updatedData = await loadLatestCompanyData()
            if (updatedData) {
              console.log("✅ Company data updated:", updatedData.status)
              setCompanyData(updatedData)
            }
          }, 1000)

          return
        }

        // Handle other events
        const updatedData = await loadLatestCompanyData()
        if (updatedData) {
          console.log("✅ Updated company data loaded:", updatedData)
          console.log("✅ Current status:", updatedData.status)
          setCompanyData(updatedData)

          // Handle balance payment rejection - redirect to documentation step
          if (event.detail?.type === "balance-payment-rejected" && event.detail?.redirectToStep) {
            console.log("Balance payment rejected, redirecting to documentation step")
            setActiveStep(event.detail.redirectToStep)
            return
          }

          // If documents were approved, update the active step to incorporate
          if (updatedData.documentsApproved && updatedData.currentStep === "incorporate") {
            console.log("Documents approved, setting active step to incorporate")
            setActiveStep("incorporate")
          }

          // If documents were published, stay on current step but update data
          if (updatedData.documentsPublished || updatedData.status === "documents-published") {
            console.log("Documents published to customer, updating company data")
            // Don't change the active step, just update the data so documents become visible
          }

          // If documents were submitted, allow access to step 4
          if (updatedData.status === "documents-submitted") {
            console.log("🎉 Documents submitted, allowing access to step 4")
            console.log("🎉 Setting active step to 'incorporate'")
            setActiveStep("incorporate")
          }
        } else {
          console.log("❌ No updated data found")
        }
      } else {
        console.log("❌ Update is not for current company or companyId is null")
      }
    }

    window.addEventListener("registration-updated", handleRegistrationUpdate)

    // Add listener for global admin event as backup
    const handleGlobalAdminEvent = (event: any) => {
      console.log("🌍 Global admin event received:", event.detail)
      if (event.detail?.companyId === companyId && event.detail?.status === "completed") {
        console.log("🎯 Global event matches current company - granting step 4 access")
        setActiveStep("incorporate")
      }
    }
    window.addEventListener("admin-complete-registration", handleGlobalAdminEvent)

    // Test event listener to verify events are being received
    const handleTestEvent = (event: any) => {
      console.log("🧪 Test event received:", event.type, event.detail)
    }
    window.addEventListener("registration-updated", handleTestEvent)
    window.addEventListener("admin-complete-registration", handleTestEvent)

    // DISABLED: Polling mechanism to prevent automatic API calls
    // const pollInterval = setInterval(async () => {
    //   if (companyId && activeStep !== "incorporate") {
    //     try {
    //       console.log("🔍 Polling check - Current activeStep:", activeStep)
    //       console.log("🔍 Polling check - Current companyId:", companyId)

    //       const currentData = await loadLatestCompanyData()
    //       if (currentData) {
    //         console.log("🔍 Polling check - Current status:", currentData.status)
    //         if (currentData.status === "completed") {
    //           console.log("🎉 Polling detected completed status - granting step 4 access")
    //           setActiveStep("incorporate")
    //           setCompanyData(currentData)
    //         }
    //       } else {
    //         console.log("🔍 Polling check - No data found")
    //       }
    //     } catch (error) {
    //       console.error("Error during polling:", error)
    //     }
    //   }
    // }, 2000) // Check every 2 seconds for faster response

    console.log("🚫 CompanyRegistrationFlow - Polling mechanism DISABLED to prevent automatic API calls")

    return () => {
      window.removeEventListener("registration-updated", handleRegistrationUpdate)
      window.removeEventListener("admin-complete-registration", handleGlobalAdminEvent)
      window.removeEventListener("registration-updated", handleTestEvent)
      window.removeEventListener("admin-complete-registration", handleTestEvent)
      // clearInterval(pollInterval) // Disabled since polling is disabled
    }
  }, [companyId, activeStep])

  const handleStepChange = (step: string) => {
    // Only allow navigation to the current step
    // Previous steps are locked once completed
    if (step === activeStep) {
      setActiveStep(step)
    }
    // We don't allow going back to previous steps or jumping ahead
  }

  const handleStepComplete = async (stepData: any, nextStep: string) => {
    console.log("🚀 CompanyRegistrationFlow - handleStepComplete called");
    console.log("🚀 Current step:", companyData.currentStep);
    console.log("🚀 Next step:", nextStep);
    console.log("🚀 Step data:", stepData);

    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Determine the status based on the completed step
    let status = "payment-processing" // Default status

    if (companyData.currentStep === "contact-details") {
      status = "payment-processing"
    } else if (companyData.currentStep === "company-details") {
      status = "documentation-processing"
    } else if (companyData.currentStep === "documentation") {
      status = "incorporation-processing"
    }

    const updatedData = {
      ...companyData,
      ...stepData,
      currentStep: nextStep,
      status: status,
    }

    setCompanyData(updatedData)
    setActiveStep(nextStep)

    // Save current step to localStorage for persistence across page refreshes
    if (companyId && companyId !== "new") {
      try {
        localStorage.setItem(`registration_step_${companyId}`, nextStep)
        console.log("💾 Saved current step to localStorage:", nextStep)
      } catch (error) {
        console.error("❌ Error saving step to localStorage:", error)
      }
    }

    // Save to database for step progression
    if (companyData.currentStep === "contact-details" && nextStep === "company-details") {
      console.log("💾 CompanyRegistrationFlow - Saving new registration (first step)");
      // Use the registration ID from stepData if available
      const newRegistration = {
        ...updatedData,
        _id: stepData._id || "new-" + Date.now(),
        createdAt: new Date().toISOString(),
        status: "payment-processing",
      }

      // Save the registration data for the first step
      await onSaveRegistration(newRegistration)

      // Dispatch registration update event for admin dashboard
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "registration-saved",
            registrationId: newRegistration._id,
            registration: newRegistration
          },
        })
      )
    } else if (companyData.currentStep === "documentation" && nextStep === "incorporate") {
      console.log("💾 CompanyRegistrationFlow - Saving step progression to database (step 3 to step 4)");

      // Update the registration in the database to reflect step progression
      try {
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

        if (response.ok) {
          console.log("✅ Step progression saved to database successfully");

          // Dispatch registration update event
          window.dispatchEvent(
            new CustomEvent("registration-updated", {
              detail: {
                type: "step-progression",
                registrationId: companyId,
                currentStep: nextStep,
                status: status
              },
            })
          )
        } else {
          console.error("❌ Failed to save step progression to database:", response.status);
        }
      } catch (error) {
        console.error("❌ Error saving step progression to database:", error);
      }
    } else {
      console.log("🚫 CompanyRegistrationFlow - Skipping database save for other step transitions");
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId)
    const activeStepIndex = steps.findIndex((s) => s.id === activeStep)

    if (stepIndex < activeStepIndex) return "completed"
    if (stepIndex === activeStepIndex) return "current"
    return "upcoming"
  }

  // Get the alert title based on the current status
  const getAlertTitle = () => {
    switch (companyData.status) {
      case "payment-processing":
        return "Payment Processing"
      case "documentation-processing":
        return "Documentation Processing"
      case "incorporation-processing":
        return "Incorporation Processing"
      case "completed":
        return "Registration Completed - Step 4 Available"
      default:
        return "Processing"
    }
  }

  const handleManualCheck = async () => {
    console.log("🔍 Manual check triggered...")
    const currentData = await loadLatestCompanyData()
    if (currentData) {
      console.log("📊 Current registration data:", currentData)
      console.log("📊 Current status:", currentData.status)
      if (currentData.status === "completed") {
        console.log("🎉 Manual check: Registration completed - granting step 4 access")
        setActiveStep("incorporate")
        setCompanyData(currentData)
      }
    }
  }

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigateTo("customerDashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Company Registration</h1>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleManualCheck}>
            🔍 Check Status
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Company Registration</CardTitle>
            <CardDescription>
              Complete the following steps to register your company. Once a step is completed, you cannot go back.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Stepper: round numbers only, no tab shapes, with connecting line */}
            <div className="relative mb-6 sm:mb-8">
              {/* Connecting line: background line (from center of 1st to center of last step) */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted z-0"
                style={{
                  transform: 'translateY(-50%)',
                  left: `calc((100% / ${steps.length}) / 2)`,
                  right: `calc((100% / ${steps.length}) / 2)`,
                }}
              />
              {/* Connecting line: colored up to active step (from center of 1st to center of active step) */}
              <div
                className="absolute top-1/2 h-0.5 bg-primary z-0 transition-all duration-300"
                style={{
                  left: `calc((100% / ${steps.length}) / 2)`,
                  width: `calc((100% - (100% / ${steps.length})) * ${steps.length > 1 ? (steps.findIndex(s => s.id === activeStep) / (steps.length - 1)) : 0})`,
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <div className="flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-4 sm:gap-2 sm:overflow-visible relative z-10">
                {steps.map((step, idx) => {
                  const status = getStepStatus(step.id);
                  const isActive = activeStep === step.id;
                  return (
                    <div
                      key={step.id}
                      className="flex flex-col items-center flex-shrink-0 min-w-[40px] sm:min-w-0 flex-1 relative"
                    >
                      <span
                        className={`flex items-center justify-center rounded-full w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base font-bold border-2 transition-all duration-200 mb-1
                          ${isActive ? "bg-primary text-primary-foreground border-primary shadow-lg" : "bg-muted text-muted-foreground border-muted-foreground"}
                          ${status === "completed" ? "opacity-70 text-green-600 border-green-600" : ""}
                        `}
                        style={{ zIndex: 1 }}
                      >
                        {status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        {activeStep === "contact-details" && (
          <ContactDetailsStep
            companyData={companyData}
            bankDetails={bankDetails}
            onComplete={(data) => handleStepComplete(data, "company-details")}
          />
        )}

        {activeStep === "company-details" && (
          companyData.paymentApproved ? (
            <CompanyDetailsStep
              companyData={companyData}
              onComplete={(data) => handleStepComplete(data, "documentation")}
              isResubmission={companyData.currentStep === "documentation" || companyData.isUpdating}
            />
          ) : (
            <Card className="w-full p-4 rounded-lg shadow-md border border-gray-200 bg-white">
              <CardHeader className="p-4 border-b border-gray-100">
                <CardTitle className="text-base font-semibold text-gray-800">Payment Processing</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">
                  Payment is being processed. Our team is working on the registration documents for your company. This will take up to 48 working hours.
                </p>
              </CardContent>
            </Card>
          )
        )}

        {activeStep === "documentation" && (
          companyData.documentsPublished ? (
            <DocumentationStep
              companyData={companyData}
              onComplete={(data) => handleStepComplete(data, "incorporate")}
              bankDetails={bankDetails}
              onNavigateToStep={(step) => {
                console.log("🖱️ CompanyRegistrationFlow - Navigating to step:", step);
                const updatedData = {
                  ...companyData,
                  isUpdating: true,
                  currentStep: step
                };
                setCompanyData(updatedData);
                setActiveStep(step);
              }}
            />
          ) : (
            <div className="space-y-4">
              {/* Update Information Card */}
              <Card className="w-full bg-muted/10 border-dashed">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-center sm:text-left w-full sm:w-auto">
                      <h3 className="text-sm font-medium mb-1">Need to update company details?</h3>
                      <p className="text-xs text-muted-foreground">You can modify your previous information</p>
                    </div>
                    <Button
                      onClick={async () => {
                        console.log("🖱️ CompanyRegistrationFlow - Update Information button clicked");
                        const updatedData = {
                          ...companyData,
                          isUpdating: true,
                          currentStep: "company-details"
                        };
                        setCompanyData(updatedData);
                        setActiveStep("company-details");
                        // NO AUTOMATIC API CALL - User will save manually
                        console.log("🚫 CompanyRegistrationFlow - NO AUTOMATIC API CALL for Update Information");
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

              {/* Details Processing Card */}
              <Card className="w-full p-4 rounded-lg shadow-md border border-gray-200 bg-white">
                <CardHeader className="p-4 border-b border-gray-100">
                  <CardTitle className="text-base font-semibold text-gray-800">Details Processing</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">
                    Details are being processed. Our team is working on the registration documents for your company. This will take up to 48 working hours.
                  </p>
                </CardContent>
              </Card>
            </div>
          )
        )}

        {activeStep === "incorporate" && (
          companyData.registrationCompleted ? (
            <IncorporateStep
              companyData={companyData}
              onComplete={() => navigateTo("customerDashboard")}
            />
          ) : (
            <>
              {/* Update Information Card (yellow, like step 3) */}
              <Card className="w-full bg-muted/10 border-dashed mb-4">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-center sm:text-left w-full sm:w-auto">
                      <h3 className="text-sm font-medium mb-1">Need to update company details?</h3>
                      <p className="text-xs text-muted-foreground">You can modify your previous information</p>
                    </div>
                    <Button
                      onClick={() => {
                        setActiveStep("documentation");
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
              {/* Incorporation Processing Card (lower) */}
              <Card className="w-full p-4 rounded-lg shadow-md border border-gray-200 bg-white">
                <CardHeader className="p-4 border-b border-gray-100">
                  <CardTitle className="text-base font-semibold text-gray-800">Incorporation Processing</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">
                    Incorporation is being processed. Our team is working on the registration documents for your company. This will take up to 48 working hours.
                  </p>
                </CardContent>
              </Card>
            </>
          )
        )}
      </div>
    </div>
  )
}
