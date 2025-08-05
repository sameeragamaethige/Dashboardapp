"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { PackagePlan } from "../../admin/PackagesManager"
import BankTransferDetails from "../BankTransferDetails"
import { LocalStorageService, DatabaseService } from "@/lib/database-service"

const formSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  contactPersonName: z.string().min(2, { message: "Contact person's name must be at least 2 characters." }),
  contactPersonEmail: z.string().email({ message: "Please enter a valid email address." }),
  contactPersonPhone: z.string().min(10, { message: "Please enter a valid phone number." }),
  selectedPackage: z.string({ required_error: "Please select a package." }),
  paymentMethod: z.string({ required_error: "Please select a payment method." }),
})


type Package = PackagePlan;


type ContactDetailsProps = {
  companyData: any;
  bankDetails: Array<any>;
  packages?: Record<string, Package>;
  onComplete: (data: any) => void;
};

export default function ContactDetailsStep({ companyData, bankDetails, packages = {}, onComplete }: ContactDetailsProps) {

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBankDetails, setShowBankDetails] = useState(false)
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [selectedBankId, setSelectedBankId] = useState<string>("");

  const [availablePackages, setAvailablePackages] = useState<Record<string, Package>>({});

  // Set selectedBankId when bankDetails change
  useEffect(() => {
    if (Array.isArray(bankDetails) && bankDetails.length > 0) {
      setSelectedBankId(bankDetails[0].id);
    }
  }, [bankDetails]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: companyData.companyName || "",
      contactPersonName: companyData.contactPersonName || "",
      contactPersonEmail: companyData.contactPersonEmail || "",
      contactPersonPhone: companyData.contactPersonPhone || "",
      selectedPackage: companyData.selectedPackage || "",
      paymentMethod: companyData.paymentMethod || "bankTransfer",
    },
  })

  // Always load all admin packages from database and listen for real-time updates
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const pkgsArr: PackagePlan[] = await LocalStorageService.getPackages();
        const pkgsObj: Record<string, Package> = {};
        pkgsArr.forEach(pkg => {
          pkgsObj[pkg.id] = pkg;
        });
        setAvailablePackages(pkgsObj);

        // Set the first package as default if no package is selected
        if (pkgsArr.length > 0 && !form.getValues("selectedPackage")) {
          form.setValue("selectedPackage", pkgsArr[0].id);
        }
      } catch (error) {
        console.error('Error loading packages:', error);
        setAvailablePackages({});
      }
    };

    const handleCustomUpdate = (e: CustomEvent) => {
      if (e.detail?.packages) {
        const pkgsArr: PackagePlan[] = e.detail.packages;
        const pkgsObj: Record<string, Package> = {};
        pkgsArr.forEach(pkg => {
          pkgsObj[pkg.id] = pkg;
        });
        setAvailablePackages(pkgsObj);

        // Set the first package as default if no package is selected
        if (pkgsArr.length > 0 && !form.getValues("selectedPackage")) {
          form.setValue("selectedPackage", pkgsArr[0].id);
        }
      }
    };

    window.addEventListener('packages-updated', handleCustomUpdate as EventListener);
    loadPackages();

    return () => {
      window.removeEventListener('packages-updated', handleCustomUpdate as EventListener);
    };
  }, [form]);

  const getPackagePrice = (packageId: string): number => {
    if (availablePackages && availablePackages[packageId]) {
      return availablePackages[packageId].price;
    }
    return 0;
  }

  const getPackageTitle = (packageId: string): string => {
    if (availablePackages && availablePackages[packageId]) {
      return availablePackages[packageId].name;
    }
    return "";
  }

  const handleFileUpload = (file: File) => {
    setPaymentReceipt(file)
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null)

    if (values.paymentMethod === "bankTransfer" && !showBankDetails) {
      setShowBankDetails(true)
      return
    }

    if (values.paymentMethod === "bankTransfer" && showBankDetails && !paymentReceipt) {
      setError("Please upload your payment receipt before proceeding")
      return
    }

    setIsSubmitting(true)
    try {
      // Generate unique ID for the registration with better uniqueness
      const timestamp = Date.now()
      const randomPart = Math.random().toString(36).substr(2, 9)
      const registrationId = `reg_${timestamp}_${randomPart}_${Math.random().toString(36).substr(2, 5)}`

      // Handle payment receipt upload if present
      let paymentReceiptData = null
      if (paymentReceipt) {
        try {
          // Upload payment receipt to server using file storage
          const { fileUploadClient } = await import('@/lib/file-upload-client')
          const uploadResult = await fileUploadClient.uploadFile(paymentReceipt, registrationId)

          if (uploadResult.success && uploadResult.file) {
            paymentReceiptData = {
              name: paymentReceipt.name,
              type: paymentReceipt.type,
              size: paymentReceipt.size,
              url: uploadResult.file.url,
              id: uploadResult.file.id,
              uploadedAt: uploadResult.file.uploadedAt
            }
          }
        } catch (uploadError) {
          console.error('Error uploading payment receipt:', uploadError)
          // Continue without payment receipt if upload fails
        }
      }

      // Get the selected package name from the package ID
      const selectedPackageName = availablePackages[values.selectedPackage]?.name || values.selectedPackage
      console.log('📦 Package Selection:', {
        packageId: values.selectedPackage,
        packageName: selectedPackageName,
        availablePackages: Object.keys(availablePackages)
      })

      // Create registration data for MySQL database
      const registrationData = {
        id: registrationId,
        companyName: values.companyName,
        contactPersonName: values.contactPersonName,
        contactPersonEmail: values.contactPersonEmail,
        contactPersonPhone: values.contactPersonPhone,
        selectedPackage: values.selectedPackage, // Save package ID
        paymentMethod: values.paymentMethod,
        currentStep: 'company-details', // Next step
        status: 'payment-processing',
        paymentReceipt: paymentReceiptData
      }

      // Save to MySQL database
      try {
        console.log('📝 ContactDetailsStep - Sending registration data to database:', JSON.stringify(registrationData, null, 2))
        await DatabaseService.createRegistration(registrationData)
        console.log('✅ Registration saved to MySQL database:', registrationId)
      } catch (dbError) {
        console.error('❌ Error saving to MySQL database:', dbError)
        // Fallback to localStorage if database fails
        await LocalStorageService.saveRegistration(registrationData)
        console.log('📦 Registration saved to localStorage as fallback')
      }

      // Also save to localStorage for immediate access
      await LocalStorageService.saveRegistration(registrationData)

      // Show success message
      setPaymentSuccess(true)

      // Dispatch registration update event for admin dashboard
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "registration-saved",
            registrationId: registrationId,
            registration: registrationData
          },
        })
      )

      // Wait 2 seconds to show success message before proceeding
      setTimeout(() => {
        onComplete({
          ...values,
          selectedPackage: values.selectedPackage, // Use package ID
          _id: registrationId, // Add the generated ID
          paymentReceipt: paymentReceiptData,
          currentStep: 'company-details', // Explicitly set next step
        })
      }, 2000)
    } catch (error) {
      console.error("Error submitting form:", error)
      setError("An error occurred while submitting the form. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
            <CardDescription>Please provide the contact details for your company registration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {paymentSuccess && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-700">Payment Received</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your payment has been received. Proceeding to the next step...
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPersonName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact person's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPersonEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person's Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPersonPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person's Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="selectedPackage"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-xl font-bold text-center block">Choose Your Package</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {Object.entries(availablePackages).length > 0 ? (
                          Object.entries(availablePackages).map(([packageId, packageData]: [string, Package]) => (
                            <div
                              key={packageId}
                              className={`relative cursor-pointer transition-all duration-300
                                ${field.value === packageId
                                  ? "shadow-lg"
                                  : ""}`}
                              onClick={() => field.onChange(packageId)}
                            >
                              <div className={`relative overflow-hidden rounded-xl border-2 p-6 text-center bg-gradient-to-br
                                ${field.value === packageId
                                  ? "border-primary from-primary/5 to-primary/10 bg-white shadow-primary/10"
                                  : "border-gray-200 from-white to-gray-50/50"}`}>

                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-5">
                                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary rounded-full transform translate-x-8 -translate-y-8"></div>
                                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/60 rounded-full transform -translate-x-6 translate-y-6"></div>
                                </div>

                                <div className="relative z-10 space-y-4">
                                  {/* Package Title */}
                                  <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-gray-900">{packageData.name}</h3>
                                    <div className="w-12 h-1 bg-primary mx-auto rounded-full"></div>
                                  </div>

                                  {/* Price/Type */}
                                  <div className="space-y-1">
                                    {packageData.type === "one-time" ? (
                                      <>
                                        <div className="flex items-center justify-center space-x-1">
                                          <span className="text-sm font-medium text-gray-500">Rs.</span>
                                          <span className="text-3xl font-bold text-primary">{packageData.price?.toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">One-time payment</p>
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex items-center justify-center gap-2">
                                          <span className="text-sm font-medium text-gray-500">Advance:</span>
                                          <span className="text-lg font-bold text-primary">Rs. {packageData.advanceAmount?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-2">
                                          <span className="text-sm font-medium text-gray-500">Balance:</span>
                                          <span className="text-lg font-bold text-primary">Rs. {packageData.balanceAmount?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 mt-1">
                                          <span className="text-xs text-gray-500">Total:</span>
                                          <span className="text-base font-semibold text-primary">Rs. {((packageData.advanceAmount || 0) + (packageData.balanceAmount || 0)).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Advance + Balance payment</p>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Selection Indicator */}
                                {field.value === packageId && (
                                  <div className="absolute top-3 right-3">
                                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full">
                            <Alert className="w-full max-w-md mx-auto">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>No Packages Available</AlertTitle>
                              <AlertDescription>
                                Please contact support for assistance with registration packages.
                              </AlertDescription>
                            </Alert>
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
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="bankTransfer" id="bankTransfer" />
                          <Label htmlFor="bankTransfer">Bank Transfer</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>Bank transfer details will be provided after submission.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showBankDetails && (
              <div className="mt-8">
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="text-blue-700">Payment Information</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    {(() => {
                      const pkg = availablePackages[form.watch("selectedPackage")];
                      if (!pkg) return null;
                      if (pkg.type === "advance-balance") {
                        return (
                          <>
                            Please transfer <b>Rs. {pkg.advanceAmount?.toLocaleString()}</b> as the advance payment for the <b>{pkg.name}</b> package to the bank account below.<br />
                            The balance payment of <b>Rs. {pkg.balanceAmount?.toLocaleString()}</b> will be due later.
                          </>
                        );
                      } else {
                        return (
                          <>
                            Please transfer <b>Rs. {pkg.price?.toLocaleString()}</b> for the <b>{pkg.name}</b> package to the bank account below.
                          </>
                        );
                      }
                    })()}
                  </AlertDescription>
                </Alert>
                {/* Show all available banks as selectable cards */}
                {Array.isArray(bankDetails) && bankDetails.length > 1 && (
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bankDetails.map((bank: any) => (
                      <Card
                        key={bank.id}
                        className={`cursor-pointer border-2 ${selectedBankId === bank.id ? "border-primary" : "border-gray-200"}`}
                        onClick={() => setSelectedBankId(bank.id)}
                      >
                        <CardHeader>
                          <CardTitle className="text-base">{bank.bankName}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
                <BankTransferDetails
                  bankDetails={Array.isArray(bankDetails) && bankDetails.length > 1 ? bankDetails.find((b: any) => b.id === selectedBankId) : bankDetails[0]}
                  onFileUpload={handleFileUpload}
                  uploadedFile={paymentReceipt}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            {showBankDetails && !paymentReceipt && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-700">Payment Receipt Required</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Please upload your payment receipt to continue to the next step.
                </AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                paymentSuccess ||
                (showBankDetails && !paymentReceipt)
              }
            >
              {isSubmitting
                ? "Submitting..."
                : paymentSuccess
                  ? "Proceeding..."
                  : showBankDetails
                    ? "Continue to Next Step"
                    : "Proceed to Payment"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
