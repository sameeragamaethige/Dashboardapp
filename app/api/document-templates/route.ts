import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { fileStorage } from '@/lib/file-storage';

// GET document templates
export async function GET() {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM document_templates ORDER BY created_at DESC');
        connection.release();

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching document templates:', error);
        return NextResponse.json({ error: 'Failed to fetch document templates' }, { status: 500 });
    }
}

// POST new document template
export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const formData = await request.formData();
        const documentType = formData.get('documentType') as string;
        const file = formData.get('file') as File;
        const directorIndex = formData.get('directorIndex') as string;

        if (!file || !documentType) {
            return NextResponse.json({ error: 'File and document type are required' }, { status: 400 });
        }

        console.log(`📁 Admin - Uploading document template: ${documentType}, file: ${file.name}`);

        // Convert File to Buffer and create mock multer file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const multerFile = {
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
        };

        // Upload file to file storage immediately
        const uploadResult = await fileStorage.saveFile(multerFile, 'document-templates');

        if (!uploadResult.success || !uploadResult.file) {
            console.error('❌ Failed to upload file to storage:', uploadResult.error);
            return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
        }

        console.log(`✅ File uploaded to storage successfully: ${file.name}`);

        // Save to MySQL database immediately
        const connection = await pool.getConnection();

        const documentData = {
            document_type: documentType,
            name: file.name,
            type: file.type,
            size: file.size,
            url: uploadResult.file.url,
            file_path: uploadResult.file.filePath,
            file_id: uploadResult.file.id,
            director_index: directorIndex ? parseInt(directorIndex) : null,
            uploaded_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };

        const [result] = await connection.execute(
            `INSERT INTO document_templates (
                document_type, name, type, size, url, file_path, file_id, director_index, 
                uploaded_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                documentData.document_type,
                documentData.name,
                documentData.type,
                documentData.size,
                documentData.url,
                documentData.file_path,
                documentData.file_id,
                documentData.director_index,
                documentData.uploaded_at,
                documentData.created_at,
                documentData.updated_at
            ]
        );

        connection.release();

        console.log(`✅ Document template saved to database successfully: ${file.name}`);

        return NextResponse.json({
            success: true,
            message: 'Document template uploaded successfully',
            document: documentData
        });

    } catch (error) {
        console.error('Error uploading document template:', error);
        return NextResponse.json({
            error: 'Failed to upload document template',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// PUT update document template
export async function PUT(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const formData = await request.formData();
        const id = formData.get('id') as string;
        const file = formData.get('file') as File;

        if (!id || !file) {
            return NextResponse.json({ error: 'ID and file are required' }, { status: 400 });
        }

        console.log(`📁 Admin - Updating document template: ${id}, file: ${file.name}`);

        // Convert File to Buffer and create mock multer file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const multerFile = {
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
        };

        // Upload new file to file storage immediately
        const uploadResult = await fileStorage.saveFile(multerFile, 'document-templates');

        if (!uploadResult.success || !uploadResult.file) {
            console.error('❌ Failed to upload file to storage:', uploadResult.error);
            return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
        }

        console.log(`✅ File uploaded to storage successfully: ${file.name}`);

        // Update MySQL database immediately
        const connection = await pool.getConnection();

        const [result] = await connection.execute(
            `UPDATE document_templates SET 
                name = ?, type = ?, size = ?, url = ?, file_path = ?, file_id = ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                file.name,
                file.type,
                file.size,
                uploadResult.file.url,
                uploadResult.file.filePath,
                uploadResult.file.id,
                id
            ]
        );

        connection.release();

        console.log(`✅ Document template updated in database successfully: ${file.name}`);

        return NextResponse.json({
            success: true,
            message: 'Document template updated successfully'
        });

    } catch (error) {
        console.error('Error updating document template:', error);
        return NextResponse.json({
            error: 'Failed to update document template',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// DELETE document template
export async function DELETE(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        console.log(`🗑️ Admin - Deleting document template: ${id}`);

        const connection = await pool.getConnection();

        // Get the document info before deleting
        const [documents] = await connection.execute(
            'SELECT * FROM document_templates WHERE id = ?',
            [id]
        );

        if (Array.isArray(documents) && documents.length === 0) {
            connection.release();
            return NextResponse.json({ error: 'Document template not found' }, { status: 404 });
        }

        // Delete from database
        await connection.execute('DELETE FROM document_templates WHERE id = ?', [id]);
        connection.release();

        console.log(`✅ Document template deleted from database successfully: ${id}`);

        return NextResponse.json({
            success: true,
            message: 'Document template deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting document template:', error);
        return NextResponse.json({ error: 'Failed to delete document template' }, { status: 500 });
    }
} 