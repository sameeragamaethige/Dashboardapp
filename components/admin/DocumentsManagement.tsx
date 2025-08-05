"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Download, CheckCircle2, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type DocumentsManagementProps = {
  documents: {
    form1?: File | null
    letterOfEngagement?: File | null
    aoa?: File | null
    form18?: (File | null)[]
  }
  directors: any[]
  onUpdateDocuments: (documents: any) => void
}

export default function DocumentsManagement({ documents, directors, onUpdateDocuments }: DocumentsManagementProps) {
  const [uploadedFiles, setUploadedFiles] = useState({
    form1: documents.form1 || null,
    letterOfEngagement: documents.letterOfEngagement || null,
    aoa: documents.aoa || null,
    form18: Array.isArray(documents.form18)
      ? documents.form18.length === directors.length
        ? documents.form18
        : directors.map((_, i) => documents.form18?.[i] || null)
      : directors.map(() => null),
  })
  const [successMessage, setSuccessMessage] = useState("")

  const handleFileUpload = (documentType: string, file: File, index?: number) => {
    setUploadedFiles((prev) => {
      if (documentType === "form18" && typeof index === "number") {
        const arr = Array.isArray(prev.form18) ? [...prev.form18] : directors.map(() => null)
        arr[index] = file
        return { ...prev, form18: arr }
      }
      return { ...prev, [documentType]: file }
    })
  }

  const handleRemoveDocument = (documentType: string, index?: number) => {
    setUploadedFiles((prev) => {
      if (documentType === "form18" && typeof index === "number") {
        const arr = Array.isArray(prev.form18) ? [...prev.form18] : directors.map(() => null)
        arr[index] = null
        return { ...prev, form18: arr }
      }
      return { ...prev, [documentType]: null }
    })
  }

  const handleSaveDocuments = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onUpdateDocuments(uploadedFiles)
      setSuccessMessage("Document templates updated successfully")
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    } catch (error) {
      console.error("Error saving documents:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Templates</CardTitle>
        <CardDescription>Manage document templates for company registration</CardDescription>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Success</AlertTitle>
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Upload Document Templates</h3>
            <p className="text-sm text-muted-foreground">
              Upload document templates that customers will download, sign, and re-upload during the registration process.
            </p>
            <div className="space-y-4">
              {/* FORM 1 */}
              <div className="p-4 border rounded-md">
                <Label htmlFor="form1" className="font-medium">FORM 1</Label>
                <div className="mt-2">
                  <Input
                    id="form1"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload("form1", e.target.files[0])
                      }
                    }}
                  />
                </div>
                {uploadedFiles.form1 && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-green-600">Uploaded: {uploadedFiles.form1.name}</p>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument("form1")} className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
              {/* Letter Of Engagement */}
              <div className="p-4 border rounded-md">
                <Label htmlFor="letterOfEngagement" className="font-medium">Letter Of Engagement</Label>
                <div className="mt-2">
                  <Input
                    id="letterOfEngagement"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload("letterOfEngagement", e.target.files[0])
                      }
                    }}
                  />
                </div>
                {uploadedFiles.letterOfEngagement && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-green-600">Uploaded: {uploadedFiles.letterOfEngagement.name}</p>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument("letterOfEngagement")} className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
              {/* AOA */}
              <div className="p-4 border rounded-md">
                <Label htmlFor="aoa" className="font-medium">Articles of Association (AOA)</Label>
                <div className="mt-2">
                  <Input
                    id="aoa"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload("aoa", e.target.files[0])
                      }
                    }}
                  />
                </div>
                {uploadedFiles.aoa && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-green-600">Uploaded: {uploadedFiles.aoa.name}</p>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument("aoa")} className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
              {/* FORM 18 for each director */}
              {directors.map((director, idx) => (
                <div className="p-4 border rounded-md" key={idx}>
                  <Label htmlFor={`form18-${idx}`} className="font-medium">
                    FORM 18 - {director.name || director.fullName || `Director ${idx + 1}`}
                  </Label>
                  <div className="mt-2">
                    <Input
                      id={`form18-${idx}`}
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload("form18", e.target.files[0], idx)
                        }
                      }}
                    />
                  </div>
                  {uploadedFiles.form18 && uploadedFiles.form18[idx] && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-green-600">Uploaded: {uploadedFiles.form18[idx]?.name}</p>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument("form18", idx)} className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button onClick={handleSaveDocuments} className="mt-4">
              Save Document Templates
            </Button>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Templates</h3>
            <p className="text-sm text-muted-foreground">
              These are the current document templates that customers can download.
            </p>
            <div className="space-y-3">
              {/* FORM 1 */}
              <div className="p-3 border rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  <div>
                    <p className="font-medium">FORM 1</p>
                    <p className="text-xs text-muted-foreground">
                      {uploadedFiles.form1 ? "Template available" : "No template uploaded"}
                    </p>
                  </div>
                </div>
                {uploadedFiles.form1 && (
                  <Button variant="outline" size="sm" onClick={() => {
                    if (uploadedFiles.form1) {
                      const url = URL.createObjectURL(uploadedFiles.form1)
                      const link = document.createElement("a")
                      link.href = url
                      link.download = uploadedFiles.form1.name
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      URL.revokeObjectURL(url)
                    }
                  }}>
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                )}
              </div>
              {/* Letter Of Engagement */}
              <div className="p-3 border rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  <div>
                    <p className="font-medium">Letter Of Engagement</p>
                    <p className="text-xs text-muted-foreground">
                      {uploadedFiles.letterOfEngagement ? "Template available" : "No template uploaded"}
                    </p>
                  </div>
                </div>
                {uploadedFiles.letterOfEngagement && (
                  <Button variant="outline" size="sm" onClick={() => {
                    if (uploadedFiles.letterOfEngagement) {
                      const url = URL.createObjectURL(uploadedFiles.letterOfEngagement)
                      const link = document.createElement("a")
                      link.href = url
                      link.download = uploadedFiles.letterOfEngagement.name
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      URL.revokeObjectURL(url)
                    }
                  }}>
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                )}
              </div>
              {/* AOA */}
              <div className="p-3 border rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  <div>
                    <p className="font-medium">Articles of Association (AOA)</p>
                    <p className="text-xs text-muted-foreground">
                      {uploadedFiles.aoa ? "Template available" : "No template uploaded"}
                    </p>
                  </div>
                </div>
                {uploadedFiles.aoa && (
                  <Button variant="outline" size="sm" onClick={() => {
                    if (uploadedFiles.aoa) {
                      const url = URL.createObjectURL(uploadedFiles.aoa)
                      const link = document.createElement("a")
                      link.href = url
                      link.download = uploadedFiles.aoa.name
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      URL.revokeObjectURL(url)
                    }
                  }}>
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                )}
              </div>
              {/* FORM 18 for each director */}
              {directors.map((director, idx) => (
                <div className="p-3 border rounded-md flex items-center justify-between" key={idx}>
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">FORM 18 - {director.name || `Director ${idx + 1}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {uploadedFiles.form18[idx] ? "Template available" : "No template uploaded"}
                      </p>
                    </div>
                  </div>
                  {uploadedFiles.form18[idx] && (
                    <Button variant="outline" size="sm" onClick={() => {
                      const file = uploadedFiles.form18[idx]
                      if (file) {
                        const url = URL.createObjectURL(file)
                        const link = document.createElement("a")
                        link.href = url
                        link.download = file.name
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        URL.revokeObjectURL(url)
                      }
                    }}>
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
