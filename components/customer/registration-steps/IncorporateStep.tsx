"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Download, FileText } from "lucide-react"

type IncorporateProps = {
  companyData: any
  onComplete: (updatedCompanyData: any) => void
}

export default function IncorporateStep({ companyData, onComplete }: IncorporateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update the handleComplete function to set the status to "completed"
  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      // In a real app, you would mark the company registration as complete
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update the company data with the completed status
      const updatedCompanyData = {
        ...companyData,
        status: "completed",
      }

      onComplete(updatedCompanyData)
    } catch (error) {
      console.error("Error completing registration:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incorporate</CardTitle>
        <CardDescription>Final step of your company registration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <AlertTitle className="text-green-700">Registration Completed!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your company has been successfully incorporated in Sri Lanka.
          </AlertDescription>
        </Alert>

        <div className="p-6 border rounded-md">
          <h3 className="text-lg font-medium mb-4">Next Steps</h3>

          <ul className="list-disc pl-5 space-y-2">
            <li>You will receive an email with all your company registration documents</li>
            <li>Set up your company bank account</li>
            <li>Register for taxes with the Inland Revenue Department</li>
            <li>Apply for any necessary business licenses</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full text-center">
          <p className="text-sm text-muted-foreground">
            Your registration has been completed by the administrator.
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}
