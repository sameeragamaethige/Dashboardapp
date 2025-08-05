import { FileMetadata } from './file-storage'

export interface UploadResult {
    success: boolean
    file?: FileMetadata
    error?: string
}

export class FileUploadClient {
    private baseUrl: string

    constructor(baseUrl: string = '/api/upload') {
        this.baseUrl = baseUrl
    }

    async uploadFile(file: File, uploadedBy?: string): Promise<UploadResult> {
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (uploadedBy) {
                formData.append('uploadedBy', uploadedBy)
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Upload failed'
                }
            }

            return {
                success: true,
                file: result.file
            }
        } catch (error) {
            console.error('Upload error:', error)
            return {
                success: false,
                error: 'Network error during upload'
            }
        }
    }

    async uploadBase64File(base64Data: string, originalName: string, uploadedBy?: string): Promise<UploadResult> {
        try {
            // Convert base64 to file
            const response = await fetch(base64Data)
            const blob = await response.blob()
            const file = new File([blob], originalName, { type: blob.type })

            return await this.uploadFile(file, uploadedBy)
        } catch (error) {
            console.error('Base64 upload error:', error)
            return {
                success: false,
                error: 'Failed to convert base64 to file'
            }
        }
    }

    async getFileInfo(filePath: string): Promise<UploadResult> {
        try {
            const response = await fetch(`${this.baseUrl}?path=${encodeURIComponent(filePath)}`)
            const result = await response.json()

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Failed to get file info'
                }
            }

            return {
                success: true,
                file: result.file
            }
        } catch (error) {
            console.error('Get file info error:', error)
            return {
                success: false,
                error: 'Network error while getting file info'
            }
        }
    }

    async deleteFile(filePath: string): Promise<UploadResult> {
        try {
            const response = await fetch(`${this.baseUrl}?path=${encodeURIComponent(filePath)}`, {
                method: 'DELETE',
            })

            const result = await response.json()

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Failed to delete file'
                }
            }

            return {
                success: true
            }
        } catch (error) {
            console.error('Delete file error:', error)
            return {
                success: false,
                error: 'Network error while deleting file'
            }
        }
    }

    async getFileById(fileId: string): Promise<UploadResult> {
        try {
            const response = await fetch(`/api/files/${fileId}`)
            const result = await response.json()

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Failed to get file info'
                }
            }

            return {
                success: true,
                file: result.file
            }
        } catch (error) {
            console.error('Get file by ID error:', error)
            return {
                success: false,
                error: 'Network error while getting file info'
            }
        }
    }

    async deleteFileById(fileId: string): Promise<UploadResult> {
        try {
            const response = await fetch(`/api/files/${fileId}`, {
                method: 'DELETE',
            })

            const result = await response.json()

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Failed to delete file'
                }
            }

            return {
                success: true
            }
        } catch (error) {
            console.error('Delete file by ID error:', error)
            return {
                success: false,
                error: 'Network error while deleting file'
            }
        }
    }

    // Helper method to convert File to base64 (for backward compatibility)
    static fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = error => reject(error)
        })
    }

    // Helper method to create object URL (for backward compatibility)
    static createObjectURL(file: File): string {
        return URL.createObjectURL(file)
    }

    // Helper method to revoke object URL (for cleanup)
    static revokeObjectURL(url: string): void {
        URL.revokeObjectURL(url)
    }
}

// Export singleton instance
export const fileUploadClient = new FileUploadClient() 