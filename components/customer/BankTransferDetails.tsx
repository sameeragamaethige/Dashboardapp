"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Copy, AlertCircle, CheckCircle2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type BankTransferDetailsProps = {
  bankDetails: {
    bankName: string
    accountName: string
    accountNumber: string
    branchName: string
    swiftCode?: string
    additionalInstructions?: string
  }
  onFileUpload: (file: File) => void
  uploadedFile: File | null
}

export default function BankTransferDetails({ bankDetails, onFileUpload, uploadedFile }: BankTransferDetailsProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Check file type
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
      if (!validTypes.includes(file.type)) {
        setFileError("Please upload a valid file (JPEG, PNG, or PDF)")
        return
      }

      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setFileError("File size should be less than 5MB")
        return
      }

      onFileUpload(file)
    }
  }

  // Check if bank details are empty or not set
  const isBankDetailsEmpty =
    !bankDetails ||
    !bankDetails.bankName ||
    !bankDetails.accountNumber ||
    !bankDetails.branchName ||
    !bankDetails.accountName

  if (isBankDetailsEmpty) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Bank Details Not Set</AlertTitle>
        <AlertDescription>
          The administrator has not set up bank transfer details yet. Please contact support or choose another payment
          method.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border border-[#130252]/20 shadow-sm">
      <CardHeader className="bg-[#130252]/5 py-3 px-4">
        <CardTitle className="text-base sm:text-lg">Bank Transfer Details</CardTitle>
        <CardDescription className="text-xs">Use these details for your bank transfer payment</CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 space-y-3">
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-2 text-sm">
          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground">Bank Name</p>
            <div className="flex items-center p-2 bg-muted/30 rounded-md">
              <p className="font-medium truncate mr-1 flex-1">{bankDetails.bankName}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankDetails.bankName, "bankName")}
                className="h-6 w-6 p-0 absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="Copy bank name"
              >
                {copied === "bankName" ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground">Branch</p>
            <div className="flex items-center p-2 bg-muted/30 rounded-md">
              <p className="font-medium truncate mr-1 flex-1">{bankDetails.branchName}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankDetails.branchName, "branchName")}
                className="h-6 w-6 p-0 absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="Copy branch name"
              >
                {copied === "branchName" ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground">Account Name</p>
            <div className="flex items-center p-2 bg-muted/30 rounded-md">
              <p className="font-medium truncate mr-1 flex-1">{bankDetails.accountName}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankDetails.accountName, "accountName")}
                className="h-6 w-6 p-0 absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="Copy account name"
              >
                {copied === "accountName" ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground">Account Number</p>
            <div className="flex items-center p-2 bg-muted/30 rounded-md">
              <p className="font-medium truncate mr-1 flex-1">{bankDetails.accountNumber}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankDetails.accountNumber, "accountNumber")}
                className="h-6 w-6 p-0 absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="Copy account number"
              >
                {copied === "accountNumber" ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {bankDetails.swiftCode && (
            <div className="relative sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">SWIFT Code</p>
              <div className="flex items-center p-2 bg-muted/30 rounded-md">
                <p className="font-medium truncate mr-1 flex-1">{bankDetails.swiftCode}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.swiftCode || "", "swiftCode")}
                  className="h-6 w-6 p-0 absolute right-2 top-1/2 -translate-y-1/2"
                  aria-label="Copy swift code"
                >
                  {copied === "swiftCode" ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {bankDetails.additionalInstructions && (
          <div className="text-sm">
            <p className="text-xs font-medium text-muted-foreground">Additional Instructions</p>
            <div className="p-2 bg-muted/30 rounded-md text-xs">
              <p>{bankDetails.additionalInstructions}</p>
            </div>
          </div>
        )}

        <Alert className="py-2 px-3 bg-yellow-50 border-yellow-200 text-xs">
          <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5" />
          <div>
            <AlertTitle className="text-yellow-700 text-xs font-medium">Important</AlertTitle>
            <AlertDescription className="text-yellow-700 text-xs">
              Include your company name as payment reference. Upload receipt below.
            </AlertDescription>
          </div>
        </Alert>
      </CardContent>
      <CardFooter className="pt-0 pb-3 px-2 sm:px-4">
        <div className="w-full">
          <div className="space-y-2">
            <Label htmlFor="payment-receipt" className="text-xs font-medium">
              Upload Payment Receipt
            </Label>
            <div className="border border-dashed rounded-md p-2 text-center">
              <Input
                type="file"
                className="hidden"
                id="payment-receipt"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
              />
              <Label
                htmlFor="payment-receipt"
                className="flex flex-col items-center justify-center gap-1 py-2 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <p className="text-xs text-muted-foreground">
                  {uploadedFile ? uploadedFile.name : "Upload receipt (JPEG, PNG, PDF)"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs mt-1"
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById("payment-receipt")?.click()
                  }}
                >
                  Select File
                </Button>
              </Label>
            </div>
            {fileError && <p className="text-xs font-medium text-destructive mt-1">{fileError}</p>}
            {uploadedFile && (
              <div className="mt-1 flex items-center text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Receipt uploaded successfully
              </div>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
