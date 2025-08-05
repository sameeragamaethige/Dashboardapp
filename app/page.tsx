"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/ui/header"
import SignupForm from "@/components/auth/SignupForm"
import LoginForm from "@/components/auth/LoginForm"
import CustomerDashboard from "@/components/customer/CustomerDashboard"
import AdminDashboard from "@/components/admin/AdminDashboard"
import CompanyRegistrationFlow from "@/components/customer/CompanyRegistrationFlow"
import CompanyDetailsPage from "@/components/admin/CompanyDetailsPage"
import IncorporationCertificatePage from "@/components/customer/IncorporationCertificatePage"
import UserSettingsPage from "@/components/user/UserSettingsPage"
import {
  userStorage,
  registrationStorage,
  bankDetailsStorage,
  initializeLocalStorage,
  type Registration,
  type BankDetails,
  type User,
} from "@/lib/utils"
import { initializeUsers } from "@/lib/auth-utils"
import { initializeTestData } from "@/lib/initialize-data"
import { isAdmin } from "@/lib/auth-utils"
import { LocalStorageService } from "@/lib/database-service"

export default function App() {
  const [currentPage, setCurrentPage] = useState("login")
  const [user, setUser] = useState<User | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [bankDetails, setBankDetails] = useState<any[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    return [];
  })
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isNewUser, setIsNewUser] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize localStorage with default values
  useEffect(() => {
    initializeLocalStorage()
    initializeUsers() // Initialize users with default admin
    initializeTestData() // No-op now
    setIsInitialized(true)
  }, [])

  // Load saved data from localStorage on initial render
  useEffect(() => {
    if (!isInitialized) return

    const loadData = async () => {
      // Load user data
      const savedUser = userStorage.getUser()
      if (savedUser) {
        setUser(savedUser)

        // If user was logged in, set the appropriate page based on role
        if (isAdmin(savedUser)) {
          setCurrentPage("adminDashboard")
        } else {
          setCurrentPage("customerDashboard")
        }
      }

      // Load registrations
      console.log('🔍 Loading registrations...');
      const savedRegistrations = await registrationStorage.getRegistrations()
      console.log('🔍 Saved registrations:', savedRegistrations);
      console.log('🔍 Saved registrations type:', typeof savedRegistrations);
      console.log('🔍 Is Array:', Array.isArray(savedRegistrations));
      // Ensure we always set an array
      const safeRegistrations = Array.isArray(savedRegistrations) ? savedRegistrations : [];
      console.log('🔍 Setting safe registrations:', safeRegistrations);
      setRegistrations(safeRegistrations)

      // Load bank details from database
      try {
        const savedBankDetails = await LocalStorageService.getBankDetails()
        setBankDetails(savedBankDetails)
      } catch (error) {
        console.error('Error loading bank details:', error)
        // Fallback to localStorage
        const fallbackBankDetails = bankDetailsStorage.getBankDetails()
        setBankDetails(fallbackBankDetails)
      }
    }

    loadData()
  }, [isInitialized])

  // Listen for storage events (for multi-tab support)
  useEffect(() => {
    if (!isInitialized) return

    const handleStorageChange = async () => {
      console.log('🔍 handleStorageChange called');
      // Reload registrations
      const updatedRegistrations = await registrationStorage.getRegistrations()
      console.log('🔍 Storage change - Updated registrations:', updatedRegistrations);
      console.log('🔍 Storage change - Type:', typeof updatedRegistrations);
      console.log('🔍 Storage change - Is Array:', Array.isArray(updatedRegistrations));
      // Ensure we always set an array
      const safeRegistrations = Array.isArray(updatedRegistrations) ? updatedRegistrations : [];
      console.log('🔍 Setting safe registrations from storage change:', safeRegistrations);
      setRegistrations(safeRegistrations)

      // Reload bank details from database
      try {
        const updatedBankDetails = await LocalStorageService.getBankDetails()
        setBankDetails(updatedBankDetails)
      } catch (error) {
        console.error('Error loading bank details:', error)
        // Fallback to localStorage
        const fallbackBankDetails = bankDetailsStorage.getBankDetails()
        setBankDetails(fallbackBankDetails)
      }

      // Reload user (if changed)
      const updatedUser = userStorage.getUser()
      if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
        setUser(updatedUser)
      }
    }

    const handleUserUpdated = (event: CustomEvent) => {
      // Update user state when user data is updated
      setUser(event.detail)
    }

    // Listen for storage events
    window.addEventListener("storage", handleStorageChange)
    // Listen for user update events
    window.addEventListener("user-updated", handleUserUpdated as EventListener)

    // Clean up
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("user-updated", handleUserUpdated as EventListener)
    }
  }, [isInitialized, user])

  // Listen for registration updates
  useEffect(() => {
    if (!isInitialized) return

    const handleRegistrationUpdate = () => {
      console.log('🔍 handleRegistrationUpdate called');
      const updatedRegistrations = registrationStorage.getRegistrations()
      console.log('🔍 Updated registrations:', updatedRegistrations);
      console.log('🔍 Updated registrations type:', typeof updatedRegistrations);
      console.log('🔍 Is Array:', Array.isArray(updatedRegistrations));
      // Ensure we always set an array
      const safeRegistrations = Array.isArray(updatedRegistrations) ? updatedRegistrations : [];
      console.log('🔍 Setting safe registrations from registration update:', safeRegistrations);
      setRegistrations(safeRegistrations)
    }

    // Listen for the custom event
    window.addEventListener("registration-updated", handleRegistrationUpdate)

    // Clean up
    return () => {
      window.removeEventListener("storage", handleRegistrationUpdate)
    }
  }, [isInitialized])

  const navigateTo = (page: string, companyId?: string, tab?: string) => {
    setCurrentPage(page)
    if (companyId) {
      setSelectedCompanyId(companyId)
    }
    // Store tab in sessionStorage for AdminDashboard to pick up
    if (tab && page === 'adminDashboard') {
      sessionStorage.setItem('adminDashboardTab', tab)
    }
  }

  const handleLogin = async (userData: User) => {
    // Fetch fresh user data from database to ensure we have the latest info
    let finalUserData = userData;

    try {
      const { LocalStorageService } = await import('@/lib/database-service');
      const freshUserData = await LocalStorageService.getUserById(userData.id);
      if (freshUserData) {
        finalUserData = freshUserData;
        userStorage.saveUser(freshUserData);
      } else {
        // Fallback to the original user data if database fetch fails
        userStorage.saveUser(userData);
      }
    } catch (error) {
      console.warn('Failed to fetch fresh user data, using cached data:', error);
      userStorage.saveUser(userData);
    }

    // For new users, clear any data
    if (isNewUser) {
      // Clear registrations for new users
      registrationStorage.saveRegistrations([])
      setRegistrations([])
      setIsNewUser(false) // Reset the flag
    }

    // Set user state and navigate in the next tick to ensure state is updated
    setUser(finalUserData);

    // Use requestAnimationFrame to ensure state is set before navigation
    requestAnimationFrame(() => {
      if (isAdmin(finalUserData)) {
        navigateTo("adminDashboard")
      } else {
        navigateTo("customerDashboard")
      }
    })
  }

  const handleSignup = (message: string) => {
    setMessage(message)
    setIsNewUser(true) // Set the flag for new users
    navigateTo("login")
  }

  const handleLogout = () => {
    setUser(null)
    userStorage.removeUser() // Clear user from localStorage
    navigateTo("login")
  }

  const handleUpdateBankDetails = async (newBankDetails: any[]) => {
    try {
      // Save to database
      await LocalStorageService.saveBankDetails(newBankDetails);
      // Update local state
      setBankDetails(newBankDetails);
    } catch (error) {
      console.error('Error updating bank details:', error);
      // Still update local state as fallback
      setBankDetails(newBankDetails);
    }
  }

  const handleSaveRegistration = async (registrationData: Registration) => {
    console.log('🔍 handleSaveRegistration called with:', registrationData);
    console.log('🔍 Current registrations state:', registrations);
    console.log('🔍 Registrations type:', typeof registrations);
    console.log('🔍 Is Array:', Array.isArray(registrations));

    // Ensure registrations is an array
    if (!Array.isArray(registrations)) {
      console.error('Registrations is not an array:', registrations);
      console.error('Registrations type:', typeof registrations);
      console.error('Registrations value:', JSON.stringify(registrations, null, 2));
      return;
    }

    // Check if this is an update to an existing registration
    const existingIndex = registrations.findIndex((reg) => reg._id === registrationData._id)

    if (existingIndex >= 0) {
      // Update existing registration
      await registrationStorage.updateRegistration(registrationData)
    } else {
      // Add new registration
      await registrationStorage.addRegistration(registrationData)
    }

    // Update local state
    try {
      const updatedRegistrations = await registrationStorage.getRegistrations()
      const safeRegistrations = Array.isArray(updatedRegistrations) ? updatedRegistrations : [];
      console.log('🔍 Setting safe registrations from save:', safeRegistrations);
      setRegistrations(safeRegistrations)
    } catch (error) {
      console.error('Error updating local state:', error);
    }
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
      <div className="min-h-screen bg-background">
        {/* Show header for all pages except admin dashboard */}
        {currentPage !== "adminDashboard" && (
          <Header
            user={user}
            navigateTo={navigateTo}
            onLogout={handleLogout}
            centerLogo={currentPage === "login" || currentPage === "signup"}
          />
        )}
        {currentPage === "signup" && <SignupForm onSignupSuccess={handleSignup} navigateTo={navigateTo} />}
        {currentPage === "login" && (
          <LoginForm onLoginSuccess={handleLogin} navigateTo={navigateTo} message={message} />
        )}
        {currentPage === "customerDashboard" && user && (
          <CustomerDashboard
            user={user}
            navigateTo={navigateTo}
            onLogout={handleLogout}
            registrations={isNewUser ? [] : registrations}
          />
        )}
        {currentPage === "adminDashboard" && user && isAdmin(user) && (
          <AdminDashboard
            user={user}
            navigateTo={navigateTo}
            onLogout={handleLogout}
            bankDetails={bankDetails}
            onUpdateBankDetails={handleUpdateBankDetails}
            registrations={registrations}
          />
        )}
        {currentPage === "adminDashboard" && (!user || !isAdmin(user)) && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold">Loading Admin Dashboard...</h2>
              <p className="text-gray-600 mt-2">Please wait while we set up your dashboard.</p>
            </div>
          </div>
        )}

        {currentPage === "userSettings" && user && (
          <UserSettingsPage user={user} navigateTo={navigateTo} onLogout={handleLogout} />
        )}
        {currentPage === "companyDetails" && user && isAdmin(user) && selectedCompanyId && (
          <CompanyDetailsPage
            companyId={selectedCompanyId}
            navigateTo={navigateTo}
            onApprovePayment={async (companyId) => {
              try {
                const registration = await registrationStorage.getRegistrationById(companyId)
                if (registration) {
                  const updatedRegistration = {
                    ...registration,
                    paymentApproved: true,
                    status: "documentation-processing",
                    updatedAt: new Date().toISOString(),
                  }

                  await registrationStorage.updateRegistration(updatedRegistration)
                }
              } catch (error) {
                console.error('Error approving payment:', error)
              }
            }}
            onRejectPayment={async (companyId) => {
              try {
                const registration = await registrationStorage.getRegistrationById(companyId)
                if (registration) {
                  const updatedRegistration = {
                    ...registration,
                    paymentRejected: true,
                    status: "payment-rejected",
                    updatedAt: new Date().toISOString(),
                  }

                  await registrationStorage.updateRegistration(updatedRegistration)
                }
              } catch (error) {
                console.error('Error rejecting payment:', error)
              }
            }}
            onApproveDetails={async (companyId) => {
              try {
                const registration = await registrationStorage.getRegistrationById(companyId)
                if (registration) {
                  const updatedRegistration = {
                    ...registration,
                    detailsApproved: true,
                    status: "incorporation-processing",
                    updatedAt: new Date().toISOString(),
                  }

                  await registrationStorage.updateRegistration(updatedRegistration)
                }
              } catch (error) {
                console.error('Error approving details:', error)
              }
            }}
            onApproveDocuments={async (companyId) => {
              try {
                const registration = await registrationStorage.getRegistrationById(companyId)
                if (registration) {
                  const updatedRegistration = {
                    ...registration,
                    documentsApproved: true,
                    status: "incorporation-processing",
                    currentStep: "incorporate",
                    updatedAt: new Date().toISOString(),
                  }

                  await registrationStorage.updateRegistration(updatedRegistration)
                }
              } catch (error) {
                console.error('Error approving documents:', error)
              }
            }}
            user={user} // Add the user prop here
          />
        )}
        {currentPage === "companyRegistration" && user && (
          <CompanyRegistrationFlow
            user={user}
            companyId={selectedCompanyId}
            navigateTo={navigateTo}
            onLogout={handleLogout}
            bankDetails={bankDetails}
            onSaveRegistration={handleSaveRegistration}
          />
        )}
        {currentPage === "incorporationCertificate" && user && (
          <IncorporationCertificatePage
            companyId={selectedCompanyId!}
            navigateTo={navigateTo}
            onLogout={handleLogout}
          />
        )}
      </div>
    </ThemeProvider>
  )
}
