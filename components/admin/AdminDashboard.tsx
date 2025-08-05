"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Eye,
  RefreshCw,
  LogOut,
  FileText,
  CheckCircle,
  Building,
  Users,
  SettingsIcon,
  User,
  Briefcase,
  ShieldAlert,
  Shield,
  Search,
  X,
  Mail,
  Clock,
  Phone,
} from "lucide-react"
import BankDetailsSettings from "./BankDetailsSettings"
import UserManagement from "./UserManagement"
import { isAdmin, changeUserPassword, updateUser, getUserById } from "@/lib/auth-utils"
import CustomizationSettings from "./CustomizationSettings"
import ChangePasswordForm from "../user/ChangePasswordForm"
import ChangeEmailForm from "../user/ChangeEmailForm"
import { settingsStorage } from "@/lib/local-storage"
import { LocalStorageService } from "@/lib/database-service"

// Helper function to format time ago
const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
  }

  return date.toLocaleDateString()
}

// AccountSettingsTabs helper component (must be after export default)
function AccountSettingsTabs({ user }: { user: any }) {
  const [tab, setTab] = useState("email");
  return (
    <div>
      <div className="flex mb-6 border border-gray-200 rounded-lg overflow-hidden w-fit bg-white">
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r border-gray-200 first:rounded-l-lg last:rounded-r-lg ${tab === 'email' ? 'bg-gray-100 text-black' : 'bg-white text-gray-600 hover:text-black'}`}
          onClick={() => setTab('email')}
        >
          Change Email
        </button>
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r-0 border-gray-200 first:rounded-l-lg last:rounded-r-lg ${tab === 'password' ? 'bg-gray-100 text-black' : 'bg-white text-gray-600 hover:text-black'}`}
          onClick={() => setTab('password')}
        >
          Change Password
        </button>
      </div>
      {tab === "email" && (
        <div>
          <h3 className="text-lg font-medium mb-4">Change Email</h3>
          <ChangeEmailForm
            currentEmail={user.email}
            onSubmit={async (newEmail: string) => {
              try {
                // Get the current user data to include password
                const currentUser = await getUserById(user.id);
                if (!currentUser) {
                  console.error('Current user not found');
                  return false;
                }

                const updatedUser = await updateUser(user.id, {
                  name: user.name,
                  email: newEmail,
                  role: user.role,
                  password: currentUser.password // Include the current password
                });
                if (updatedUser) {
                  // Update localStorage with the new user data
                  localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                  // Dispatch a custom event to notify the parent component
                  window.dispatchEvent(new CustomEvent("user-updated", { detail: updatedUser }));
                  return true;
                }
                return false;
              } catch (error) {
                console.error('Error updating email:', error);
                return false;
              }
            }}
          />
        </div>
      )}
      {tab === "password" && (
        <div>
          <h3 className="text-lg font-medium mb-4">Change Password</h3>
          <ChangePasswordForm
            onSubmit={async (currentPassword: string, newPassword: string) => {
              try {
                const success = await changeUserPassword(user.id, currentPassword, newPassword);
                return success;
              } catch (error) {
                console.error('Error changing password:', error);
                return false;
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

type AdminDashboardProps = {
  user: any
  navigateTo: (page: string, id?: string) => void
  onLogout: () => void
  bankDetails: any
  onUpdateBankDetails: (data: any) => Promise<any>
  registrations?: any[]
}

export default function AdminDashboard({
  user,
  navigateTo,
  onLogout,
  bankDetails,
  onUpdateBankDetails,
  registrations = [],
}: AdminDashboardProps) {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("companies")
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [viewStep, setViewStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([])
  const [logo, setLogo] = useState<string | null>(null)
  const [sidebarColor, setSidebarColor] = useState<string>("")
  const [sidebarTextColor, setSidebarTextColor] = useState<string>("")

  // Helper to determine if a color is dark
  function isColorDark(hex: string) {
    if (!hex) return false;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    // Perceived brightness formula
    return ((r * 299) + (g * 587) + (b * 114)) / 1000 < 128;
  }

  // Check if user is admin
  const userIsAdmin = isAdmin(user)

  // Load logo and sidebar color from settings
  useEffect(() => {
    const updateLogoAndSidebarColor = () => {
      const settings = settingsStorage.getSettings()
      setLogo(settings?.logo || null)
      // If admin enabled color switch, use primary color, else use default
      const color = settings?.changeNavbarColor ? settings?.primaryColor || "#2563eb" : ""
      setSidebarColor(color)
      setSidebarTextColor(isColorDark(color) ? "#fff" : "")
    }

    updateLogoAndSidebarColor()

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'appSettings') {
        updateLogoAndSidebarColor()
      }
    }

    const handleLocalChange = () => {
      updateLogoAndSidebarColor()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('storage-updated', handleLocalChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('storage-updated', handleLocalChange)
    }
  }, [])

  // Check for tab navigation from header
  useEffect(() => {
    const savedTab = sessionStorage.getItem('adminDashboardTab')
    if (savedTab) {
      setActiveTab(savedTab)
      sessionStorage.removeItem('adminDashboardTab')
    }
  }, [])

  // Update filtered companies whenever search query or companies change
  useEffect(() => {
    const searchLower = searchQuery.toLowerCase().trim()
    if (!searchLower) {
      setFilteredCompanies(companies)
      return
    }

    const filtered = companies.filter((company) => {
      const companyName = (company.companyNameEnglish || company.companyName || "").toLowerCase()
      const contactName = (company.customerName || company.contactPersonName || "").toLowerCase()
      const contactEmail = (company.contactPersonEmail || "").toLowerCase()
      const status = (company.status || "").toLowerCase()

      return companyName.includes(searchLower) ||
        contactName.includes(searchLower) ||
        contactEmail.includes(searchLower) ||
        status.includes(searchLower)
    })
    setFilteredCompanies(filtered)
  }, [searchQuery, companies])

  useEffect(() => {
    // Load companies data
    const loadCompanies = async () => {
      try {
        setLoading(true)

        // First try to load from database
        let databaseRegistrations = []
        try {
          databaseRegistrations = await LocalStorageService.getRegistrations()
          console.log('Loaded registrations from database:', databaseRegistrations.length)
        } catch (dbError) {
          console.warn('Database unavailable, using fallback:', dbError)
        }

        // Use database registrations if available, otherwise use props
        let allRegistrations = databaseRegistrations.length > 0 ? databaseRegistrations : registrations

        // Sort registrations by updatedAt date (newest first)
        const sortedRegistrations = [...allRegistrations].sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
          return dateB - dateA // Descending order (newest first)
        })

        setCompanies(sortedRegistrations)
        console.log('Admin dashboard loaded companies:', sortedRegistrations.length)
      } catch (error) {
        console.error('Error loading companies:', error)
        setCompanies([])
      } finally {
        setLoading(false)
      }
    }

    loadCompanies()

    // Listen for registration updates
    const handleRegistrationUpdate = () => {
      console.log('Registration update detected, refreshing companies...')
      loadCompanies()
    }

    window.addEventListener('registration-updated', handleRegistrationUpdate)

    return () => {
      window.removeEventListener('registration-updated', handleRegistrationUpdate)
    }
  }, [registrations])

  // Update default tab and enforce access control
  useEffect(() => {
    if (!userIsAdmin && (activeTab === "settings" || activeTab === "users")) {
      setActiveTab("companies")
    }
  }, [activeTab, userIsAdmin])

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "payment-processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5 h-5">
            Payment
          </Badge>
        )
      case "payment-rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs px-2 py-0.5 h-5">
            Rejected
          </Badge>
        )
      case "documentation-processing":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-2 py-0.5 h-5">
            Docs
          </Badge>
        )
      case "incorporation-processing":
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs px-2 py-0.5 h-5">
            Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5 h-5">
            Done
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5 h-5">
            Payment
          </Badge>
        )
    }
  }

  // Refresh companies data
  const refreshCompanies = async () => {
    try {
      setLoading(true)
      const databaseRegistrations = await LocalStorageService.getRegistrations()
      const sortedRegistrations = [...databaseRegistrations].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return dateB - dateA
      })
      setCompanies(sortedRegistrations)
      console.log('Refreshed companies:', sortedRegistrations.length)
    } catch (error) {
      console.error('Error refreshing companies:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get role badge for header
  const getRoleBadge = () => {
    if (user.role === "admin") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
          <ShieldAlert className="h-3 w-3" /> Admin
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Fixed Sidebar */}
        <div
          className={`w-64 border-r flex flex-col fixed left-0 h-full overflow-y-auto ${!sidebarColor ? 'bg-background text-foreground' : ''}`}
          style={{
            top: '0px',
            height: '100vh',
            background: sidebarColor || undefined,
            color: sidebarTextColor || undefined,
            transition: 'background 0.3s, color 0.3s',
          }}
        >
          {/* Logo Section - Separated */}
          {logo && (
            <div
              className="border-b px-6 py-4 flex justify-center"
              style={{
                background: sidebarColor || '#fff',
                transition: 'background 0.3s',
              }}
            >
              <img
                src={logo}
                alt="Application Logo"
                className="h-8 w-auto max-w-[200px] object-contain cursor-pointer"
                onClick={() => {
                  navigateTo('adminDashboard');
                  setActiveTab('companies');
                }}
              />
            </div>
          )}

          {/* Navigation Menu Section - Separated */}
          <div className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              <Button
                variant={activeTab === "companies" ? "secondary" : "ghost"}
                className={`w-full justify-start transition-colors ${activeTab === "companies" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                style={activeTab === "companies" ? undefined : { backgroundColor: undefined }}
                onClick={() => setActiveTab("companies")}
              >
                <Building className="h-4 w-4 mr-2" /> Companies
              </Button>

              {userIsAdmin && (
                <>
                  <Button
                    variant={activeTab === "users" ? "secondary" : "ghost"}
                    className={`w-full justify-start transition-colors ${activeTab === "users" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                    style={activeTab === "users" ? undefined : { backgroundColor: undefined }}
                    onClick={() => setActiveTab("users")}
                  >
                    <Users className="h-4 w-4 mr-2" /> User Management
                  </Button>

                  <Button
                    variant={activeTab === "account" ? "secondary" : "ghost"}
                    className={`w-full justify-start transition-colors ${activeTab === "account" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                    style={activeTab === "account" ? undefined : { backgroundColor: undefined }}
                    onClick={() => setActiveTab("account")}
                  >
                    <User className="h-4 w-4 mr-2" /> Account Settings
                  </Button>

                  <Button
                    variant={activeTab === "settings" ? "secondary" : "ghost"}
                    className={`w-full justify-start transition-colors ${activeTab === "settings" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                    style={activeTab === "settings" ? undefined : { backgroundColor: undefined }}
                    onClick={() => setActiveTab("settings")}
                  >
                    <SettingsIcon className="h-4 w-4 mr-2" /> Settings
                  </Button>

                  <Button
                    variant={activeTab === "payments" ? "secondary" : "ghost"}
                    className={`w-full justify-start transition-colors ${activeTab === "payments" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                    style={activeTab === "payments" ? undefined : { backgroundColor: undefined }}
                    onClick={() => setActiveTab("payments")}
                  >
                    <Briefcase className="h-4 w-4 mr-2" /> Payments
                  </Button>

                  <Button
                    variant={activeTab === "billing" ? "secondary" : "ghost"}
                    className={`w-full justify-start transition-colors ${activeTab === "billing" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                    style={activeTab === "billing" ? undefined : { backgroundColor: undefined }}
                    onClick={() => setActiveTab("billing")}
                  >
                    <FileText className="h-4 w-4 mr-2" /> Billing
                  </Button>
                </>
              )}
            </nav>
          </div>

          {/* Admin Profile Row - Minimized */}
          <div className={`border-t ${!sidebarColor ? 'border-gray-300 bg-gray-50' : ''} px-2 py-2 mt-auto flex items-center justify-between gap-2`}>
            {/* Profile Icon */}
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-base font-bold text-primary uppercase">
              {user?.name ? user.name[0] : 'A'}
            </div>
            {/* Name & Email */}
            <div className="flex flex-col flex-1 min-w-0 ml-2 overflow-hidden">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{user?.name || 'Admin'}</span>
              <span className="text-[10px] text-gray-400 truncate">{user?.email || ''}</span>
            </div>
            {/* Mini Logout Button */}
            <button
              title="Logout"
              onClick={onLogout}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors ml-2"
              style={sidebarColor ? { background: '#fff', color: '#e53e3e', border: '1.5px solid #e53e3e' } : {}}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto ml-64" style={{ height: '100vh' }}>
          <div className="container py-6">
            {/* Companies Tab */}
            {activeTab === "companies" && (
              <>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : companies.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">Company Registrations</CardTitle>
                          <CardDescription>Manage all company registrations</CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshCompanies}
                          disabled={loading}
                          className="gap-2"
                        >
                          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                      <div className="mt-4 flex items-center space-x-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-input rounded-md bg-background/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-input placeholder:text-muted-foreground/70 shadow-sm transition-colors"
                          />
                          {searchQuery && (
                            <div className="absolute inset-y-0 right-0 flex items-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setSearchQuery("")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {filteredCompanies.length > 0 && companies.length > filteredCompanies.length && (
                          <div className="flex items-center px-3 py-1.5 text-xs text-muted-foreground bg-muted rounded-md">
                            <span>Found </span>
                            <span className="font-medium px-1">{filteredCompanies.length}</span>
                            <span>of </span>
                            <span className="font-medium px-1">{companies.length}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredCompanies.map((company: any, index: number) => (
                          <Card key={company._id || `company-${index}`} className="group hover:shadow-md transition-all duration-300 border border-gray-200 shadow-sm bg-white hover:border-primary/20">
                            <CardContent className="p-4">
                              {/* Company Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                      <Building className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                                        {company.companyNameEnglish || company.companyName || "Unnamed Company"}
                                      </h3>
                                      <p className="text-xs text-gray-600 truncate">
                                        {company.customerName || company.contactPersonName || "Unknown Customer"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  {getStatusBadge(company.status || "payment-processing")}
                                </div>
                              </div>

                              {/* Company Details */}
                              <div className="space-y-2 mb-3 bg-gray-50 rounded-lg p-2">
                                <div className="flex items-center gap-2 text-xs text-gray-700">
                                  <User className="h-3 w-3 text-gray-500" />
                                  <span className="truncate">
                                    {company.customerName || company.contactPersonName || "Customer not specified"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-700">
                                  <Mail className="h-3 w-3 text-gray-500" />
                                  <span className="truncate">
                                    {company.contactPersonEmail || "Email not specified"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-700">
                                  <Clock className="h-3 w-3 text-gray-500" />
                                  <span>
                                    {company.updatedAt || company.createdAt ? formatTimeAgo(new Date(company.updatedAt || company.createdAt)) : "Recently"}
                                  </span>
                                </div>
                              </div>

                              {/* Registration Flow Indicator */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-gray-700">Registration Progress</span>
                                  <span className="text-xs text-gray-500">
                                    {(() => {
                                      const currentStep = company.currentStep || 'payment-processing';
                                      const stepMap: { [key: string]: number } = {
                                        'payment-processing': 1,
                                        'company-details': 2,
                                        'documentation': 3,
                                        'completed': 4
                                      };
                                      const currentStepNumber = stepMap[currentStep] || 1;
                                      const percentage = Math.round((currentStepNumber / 4) * 100);
                                      return `${percentage}%`;
                                    })()}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 relative">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${(() => {
                                        const currentStep = company.currentStep || 'payment-processing';
                                        const stepMap: { [key: string]: number } = {
                                          'payment-processing': 1,
                                          'company-details': 2,
                                          'documentation': 3,
                                          'completed': 4
                                        };
                                        const currentStepNumber = stepMap[currentStep] || 1;
                                        // Calculate width to align with numbered steps
                                        // Each step takes 25% of the width, but we want to fill to the center of the current step
                                        return ((currentStepNumber - 0.5) / 4) * 100;
                                      })()}%`
                                    }}
                                  ></div>
                                </div>
                                <div className="flex justify-between mt-1">
                                  {[1, 2, 3, 4].map((step) => {
                                    const currentStep = company.currentStep || 'payment-processing';
                                    const stepMap: { [key: string]: number } = {
                                      'payment-processing': 1,
                                      'company-details': 2,
                                      'documentation': 3,
                                      'completed': 4
                                    };
                                    const currentStepNumber = stepMap[currentStep] || 1;
                                    const isCompleted = step <= currentStepNumber;
                                    const isCurrent = step === currentStepNumber;

                                    const stepLabels = ['Payment', 'Details', 'Docs', 'Complete'];

                                    return (
                                      <div key={step} className="flex flex-col items-center">
                                        <div className="w-3 h-3 mb-1">
                                          <div className={`w-full h-full rounded-full flex items-center justify-center ${isCompleted
                                            ? 'bg-green-500'
                                            : isCurrent
                                              ? 'bg-primary'
                                              : 'bg-gray-400'
                                            }`}>
                                            <span className="text-[8px] text-white font-bold">{step}</span>
                                          </div>
                                        </div>
                                        <span className={`text-[10px] ${isCompleted
                                          ? 'text-green-600 font-medium'
                                          : isCurrent
                                            ? 'text-primary font-medium'
                                            : 'text-gray-500'
                                          }`}>
                                          {stepLabels[step - 1]}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="mt-2 text-center">
                                  <span className="text-xs font-medium text-primary">
                                    {(() => {
                                      const currentStep = company.currentStep || 'payment-processing';
                                      const stepNames: { [key: string]: string } = {
                                        'payment-processing': 'Payment Processing',
                                        'company-details': 'Company Details',
                                        'documentation': 'Documentation',
                                        'completed': 'Registration Complete'
                                      };
                                      return stepNames[currentStep] || 'Payment Processing';
                                    })()}
                                  </span>
                                </div>
                              </div>

                              {/* Action Button */}
                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigateTo("companyDetails", company._id || `company-${index}`)}
                                  className="gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200 text-xs px-3 py-1 h-8"
                                >
                                  <Eye className="h-3 w-3" />
                                  View
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Building className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Companies Registered</h3>
                      <p className="text-gray-500 text-center max-w-md mb-8">
                        There are no company registrations yet. Companies will appear here once they start the registration process.
                      </p>

                      {/* Search Component */}
                      <div className="w-full max-w-md">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                              onClick={() => setSearchQuery("")}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Search functionality will be available when companies are registered
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Users Tab */}
            {activeTab === "users" && userIsAdmin && (
              <UserManagement currentUser={user} />
            )}

            {/* Account Settings Tab with Sub-Tabs */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Account Settings</CardTitle>
                    <CardDescription>Manage your account information and security settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AccountSettingsTabs user={user} />
                  </CardContent>
                </Card>
              </div>
            )}


            {/* Settings Tab - Now shows Customization directly */}
            {activeTab === "settings" && userIsAdmin && (
              <CustomizationSettings />
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && userIsAdmin && (
              <BankDetailsSettings initialData={bankDetails} onSave={onUpdateBankDetails} />
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && userIsAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing</CardTitle>
                  <CardDescription>Manage your billing and invoices here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Billing features coming soon.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
