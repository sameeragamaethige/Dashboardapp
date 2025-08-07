"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Download, CheckCircle2, Trash2, Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type DocumentTemplate = {
  id: number
  document_type: string
  name: string
  type: string
  size: number
  url: string
  file_path: string
  file_id: string
  director_index?: number
  uploaded_at: string
  created_at: string
  updated_at: string
}

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
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([])
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [uploading, setUploading] = useState<string | null>(null)

  // Load existing document templates on component mount
  useEffect(() => {
    loadDocumentTemplates()
  }, [])

  const loadDocumentTemplates = async () => {
    try {
      const response = await fetch('/api/document-templates')
      if (response.ok) {
        const templates = await response.json()
        setDocumentTemplates(templates)
        console.log('📋 Loaded document templates:', templates)
      } else {
        console.error('Failed to load document templates')
      }
    } catch (error) {
      console.error('Error loading document templates:', error)
    }
  }

  const handleFileUpload = async (documentType: string, file: File, index?: number) => {
    try {
      setUploading(`${documentType}${index !== undefined ? `-${index}` : ''}`)
      setErrorMessage("")

      console.log(`📁 Admin - Uploading document template: ${documentType}, file: ${file.name}`)

      // Create FormData for the API request
      const formData = new FormData()
      formData.append('documentType', documentType)
      formData.append('file', file)
      if (index !== undefined) {
        formData.append('directorIndex', index.toString())
      }

      // Upload immediately to file storage and database
      const response = await fetch('/api/document-templates', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Document template uploaded successfully:', result)

        // Update local state
        setUploadedFiles((prev) => {
          if (documentType === "form18" && typeof index === "number") {
            const arr = Array.isArray(prev.form18) ? [...prev.form18] : directors.map(() => null)
            arr[index] = file
            return { ...prev, form18: arr }
          }
          return { ...prev, [documentType]: file }
        })

        // Reload document templates
        await loadDocumentTemplates()

        setSuccessMessage(`${documentType.toUpperCase()} template uploaded successfully`)
        setTimeout(() => {
          setSuccessMessage("")
        }, 3000)

        // Call the parent callback
        onUpdateDocuments({
          ...uploadedFiles,
          [documentType]: file
        })

      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload document template')
      }

    } catch (error) {
      console.error('Error uploading document template:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload document template')
      setTimeout(() => {
        setErrorMessage("")
      }, 5000)
    } finally {
      setUploading(null)
    }
  }

  const handleRemoveDocument = async (documentType: string, index?: number) => {
    try {
      // Find the template to delete
      const templateToDelete = documentTemplates.find(template => {
        if (documentType === "form18" && index !== undefined) {
          return template.document_type === documentType && template.director_index === index
        }
        return template.document_type === documentType && template.director_index === null
      })

      if (templateToDelete) {
        // Delete from database
        const response = await fetch(`/api/document-templates?id=${templateToDelete.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          console.log('✅ Document template deleted successfully')

          // Update local state
          setUploadedFiles((prev) => {
            if (documentType === "form18" && typeof index === "number") {
              const arr = Array.isArray(prev.form18) ? [...prev.form18] : directors.map(() => null)
              arr[index] = null
              return { ...prev, form18: arr }
            }
            return { ...prev, [documentType]: null }
          })

          // Reload document templates
          await loadDocumentTemplates()

          setSuccessMessage(`${documentType.toUpperCase()} template removed successfully`)
          setTimeout(() => {
            setSuccessMessage("")
          }, 3000)
        } else {
          throw new Error('Failed to delete document template')
        }
      } else {
        // Just update local state if no template found
        setUploadedFiles((prev) => {
          if (documentType === "form18" && typeof index === "number") {
            const arr = Array.isArray(prev.form18) ? [...prev.prev.form18] : directors.map(() => null)
            arr[index] = null
            return { ...prev, form18: arr }
          }
          return { ...prev, [documentType]: null }
        })
      }
    } catch (error) {
      console.error('Error removing document template:', error)
      setErrorMessage('Failed to remove document template')
      setTimeout(() => {
        setErrorMessage("")
      }, 5000)
    }
  }

  const handleDownloadTemplate = (template: DocumentTemplate) => {
    const link = document.createElement('a')
    link.href = template.url
    link.download = template.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTemplateForDocument = (documentType: string, index?: number) => {
    return documentTemplates.find(template => {
      if (documentType === "form18" && index !== undefined) {
        return template.document_type === documentType && template.director_index === index
      }
      return template.document_type === documentType && template.director_index === null
    })
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
        {errorMessage && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-700">Error</AlertTitle>
            <AlertDescription className="text-red-700">{errorMessage}</AlertDescription>
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
                    disabled={uploading === 'form1'}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload("form1", e.target.files[0])
                      }
                    }}
                  />
                </div>
                {uploading === 'form1' && (
                  <div className="flex items-center mt-2">
                    <Upload className="h-4 w-4 animate-spin mr-2" />
                    <p className="text-sm text-blue-600">Uploading...</p>
                  </div>
                )}
                {(uploadedFiles.form1 || getTemplateForDocument("form1")) && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-green-600">
                      {uploadedFiles.form1 ? `Uploaded: ${uploadedFiles.form1.name}` :
                        getTemplateForDocument("form1") ? `Template: ${getTemplateForDocument("form1")?.name}` : ''}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument("form1")}
                      className="h-8 w-8 p-0"
                    >
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
                    disabled={uploading === 'letterOfEngagement'}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload("letterOfEngagement", e.target.files[0])
                      }
                    }}
                  />
                </div>
                {uploading === 'letterOfEngagement' && (
                  <div className="flex items-center mt-2">
                    <Upload className="h-4 w-4 animate-spin mr-2" />
                    <p className="text-sm text-blue-600">Uploading...</p>
                  </div>
                )}
                {(uploadedFiles.letterOfEngagement || getTemplateForDocument("letterOfEngagement")) && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-green-600">
                      {uploadedFiles.letterOfEngagement ? `Uploaded: ${uploadedFiles.letterOfEngagement.name}` :
                        getTemplateForDocument("letterOfEngagement") ? `Template: ${getTemplateForDocument("letterOfEngagement")?.name}` : ''}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument("letterOfEngagement")}
                      className="h-8 w-8 p-0"
                    >
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
                    disabled={uploading === 'aoa'}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload("aoa", e.target.files[0])
                      }
                    }}
                  />
                </div>
                {uploading === 'aoa' && (
                  <div className="flex items-center mt-2">
                    <Upload className="h-4 w-4 animate-spin mr-2" />
                    <p className="text-sm text-blue-600">Uploading...</p>
                  </div>
                )}
                {(uploadedFiles.aoa || getTemplateForDocument("aoa")) && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-green-600">
                      {uploadedFiles.aoa ? `Uploaded: ${uploadedFiles.aoa.name}` :
                        getTemplateForDocument("aoa") ? `Template: ${getTemplateForDocument("aoa")?.name}` : ''}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument("aoa")}
                      className="h-8 w-8 p-0"
                    >
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
                      disabled={uploading === `form18-${idx}`}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload("form18", e.target.files[0], idx)
                        }
                      }}
                    />
                  </div>
                  {uploading === `form18-${idx}` && (
                    <div className="flex items-center mt-2">
                      <Upload className="h-4 w-4 animate-spin mr-2" />
                      <p className="text-sm text-blue-600">Uploading...</p>
                    </div>
                  )}
                  {(uploadedFiles.form18?.[idx] || getTemplateForDocument("form18", idx)) && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-green-600">
                        {uploadedFiles.form18?.[idx] ? `Uploaded: ${uploadedFiles.form18[idx]?.name}` :
                          getTemplateForDocument("form18", idx) ? `Template: ${getTemplateForDocument("form18", idx)?.name}` : ''}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDocument("form18", idx)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
                      {getTemplateForDocument("form1") ? "Template available" : "No template uploaded"}
                    </p>
                  </div>
                </div>
                {getTemplateForDocument("form1") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadTemplate(getTemplateForDocument("form1")!)}
                  >
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
                      {getTemplateForDocument("letterOfEngagement") ? "Template available" : "No template uploaded"}
                    </p>
                  </div>
                </div>
                {getTemplateForDocument("letterOfEngagement") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadTemplate(getTemplateForDocument("letterOfEngagement")!)}
                  >
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
                      {getTemplateForDocument("aoa") ? "Template available" : "No template uploaded"}
                    </p>
                  </div>
                </div>
                {getTemplateForDocument("aoa") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadTemplate(getTemplateForDocument("aoa")!)}
                  >
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
                      <p className="font-medium">FORM 18 - {director.name || director.fullName || `Director ${idx + 1}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {getTemplateForDocument("form18", idx) ? "Template available" : "No template uploaded"}
                      </p>
                    </div>
                  </div>
                  {getTemplateForDocument("form18", idx) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate(getTemplateForDocument("form18", idx)!)}
                    >
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
