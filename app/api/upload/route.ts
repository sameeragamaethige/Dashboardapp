import { NextRequest, NextResponse } from 'next/server'
import { fileStorage, FileMetadata } from '@/lib/file-storage'

export async function POST(request: NextRequest) {
    try {
        // Parse the request as form data
        const formData = await request.formData()
        const file = formData.get('file') as File
        const uploadedBy = formData.get('uploadedBy') as string

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Convert File to Buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Create a mock multer file object
        const multerFile: Express.Multer.File = {
            fieldname: 'file',
            originalname: file.name,
            encoding: '7bit',
            mimetype: file.type,
            size: file.size,
            buffer: buffer,
            destination: '',
            filename: '',
            path: '',
            stream: {} as any
        }

        // Save file using our file storage service
        const result = await fileStorage.saveFile(multerFile, uploadedBy)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            file: result.file
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const filePath = searchParams.get('path')

        if (!filePath) {
            return NextResponse.json(
                { error: 'File path is required' },
                { status: 400 }
            )
        }

        const fileInfo = await fileStorage.getFileInfo(filePath)

        if (!fileInfo) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            file: fileInfo
        })

    } catch (error) {
        console.error('File info error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const filePath = searchParams.get('path')

        if (!filePath) {
            return NextResponse.json(
                { error: 'File path is required' },
                { status: 400 }
            )
        }

        const deleted = await fileStorage.deleteFile(filePath)

        if (!deleted) {
            return NextResponse.json(
                { error: 'File not found or could not be deleted' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully'
        })

    } catch (error) {
        console.error('Delete error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 