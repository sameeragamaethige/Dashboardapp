import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { FileStorageService } from '@/lib/file-storage';

// GET registration by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log('🚨 API CALL DETECTED - GET /api/registrations/[id] called at:', new Date().toISOString());
        console.log('🚨 Request headers:', Object.fromEntries(request.headers.entries()));
        console.log('🚨 Request method:', request.method);
        console.log('🚨 Request URL:', request.url);

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM registrations WHERE id = ?',
            [id]
        );
        connection.release();

        if (Array.isArray(rows) && rows.length === 0) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        // Convert snake_case to camelCase for frontend compatibility
        const row = rows[0];
        const convertedRow = {
            _id: row.id,
            id: row.id,
            companyName: row.company_name,
            contactPersonName: row.contact_person_name,
            contactPersonEmail: row.contact_person_email,
            contactPersonPhone: row.contact_person_phone,
            selectedPackage: row.selected_package,
            paymentMethod: row.payment_method,
            currentStep: row.current_step,
            status: row.status,
            paymentApproved: row.payment_approved,
            detailsApproved: row.details_approved,
            documentsApproved: row.documents_approved,
            documentsPublished: row.documents_published,
            paymentReceipt: row.payment_receipt ? JSON.parse(row.payment_receipt) : null,
            balancePaymentReceipt: row.balance_payment_receipt ? JSON.parse(row.balance_payment_receipt) : null,
            form1: row.form1 ? JSON.parse(row.form1) : null,
            letterOfEngagement: row.letter_of_engagement ? JSON.parse(row.letter_of_engagement) : null,
            aoa: row.aoa ? JSON.parse(row.aoa) : null,
            form18: row.form18 ? JSON.parse(row.form18) : null,
            addressProof: row.address_proof ? JSON.parse(row.address_proof) : null,
            customerDocuments: (() => {
                // Combine customer documents from separate columns
                const customerDocs: any = {};

                if (row.customer_form1) {
                    customerDocs.form1 = JSON.parse(row.customer_form1);
                }
                if (row.customer_letter_of_engagement) {
                    customerDocs.letterOfEngagement = JSON.parse(row.customer_letter_of_engagement);
                }
                if (row.customer_aoa) {
                    customerDocs.aoa = JSON.parse(row.customer_aoa);
                }
                if (row.customer_form18) {
                    customerDocs.form18 = JSON.parse(row.customer_form18);
                }
                if (row.customer_address_proof) {
                    customerDocs.addressProof = JSON.parse(row.customer_address_proof);
                }


                // Only return customer documents if we have any from the separate columns
                // Don't include the old customer_documents column
                return Object.keys(customerDocs).length > 0 ? customerDocs : null;
            })(),
            incorporationCertificate: row.incorporation_certificate ? JSON.parse(row.incorporation_certificate) : null,
            step3AdditionalDoc: row.step3_additional_doc ? JSON.parse(row.step3_additional_doc) : null,
            step3SignedAdditionalDoc: row.step3_signed_additional_doc ? JSON.parse(row.step3_signed_additional_doc) : null,
            step4FinalAdditionalDoc: row.step4_final_additional_doc ? JSON.parse(row.step4_final_additional_doc) : null,
            // Company Details Fields
            companyNameEnglish: row.company_name_english,
            companyNameSinhala: row.company_name_sinhala,
            isForeignOwned: row.is_foreign_owned,
            businessAddressNumber: row.business_address_number,
            businessAddressStreet: row.business_address_street,
            businessAddressCity: row.business_address_city,
            postalCode: row.postal_code,
            sharePrice: row.share_price,
            numberOfShareholders: row.number_of_shareholders,
            shareholders: row.shareholders ? JSON.parse(row.shareholders) : null,
            makeSimpleBooksSecretary: row.make_simple_books_secretary,
            numberOfDirectors: row.number_of_directors,
            directors: row.directors ? JSON.parse(row.directors) : null,
            importExportStatus: row.import_export_status,
            importsToAdd: row.imports_to_add,
            exportsToAdd: row.exports_to_add,
            otherBusinessActivities: row.other_business_activities,
            dramaSedakaDivision: row.drama_sedaka_division,
            businessEmail: row.business_email,
            businessContactNumber: row.business_contact_number,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        return NextResponse.json(convertedRow);
    } catch (error) {
        console.error('Error fetching registration:', error);
        return NextResponse.json({ error: 'Failed to fetch registration' }, { status: 500 });
    }
}

// PUT update registration
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        const body = await request.json();

        console.log('📝 PUT /api/registrations/[id] - Updating registration:', {
            id,
            currentStep: body.currentStep,
            status: body.status,
            documentsAcknowledged: body.documentsAcknowledged,
            balancePaymentReceipt: body.balancePaymentReceipt,
            customerDocuments: body.customerDocuments
        });
        console.log('🚨 API CALL DETECTED - PUT /api/registrations/[id] called at:', new Date().toISOString());
        console.log('🚨 Request headers:', Object.fromEntries(request.headers.entries()));
        console.log('🚨 Request method:', request.method);
        console.log('🚨 Request URL:', request.url);

        const connection = await pool.getConnection();


        const [result] = await connection.execute(
            `UPDATE registrations SET 
        company_name = ?, contact_person_name = ?, contact_person_email = ?,
        contact_person_phone = ?, selected_package = ?, payment_method = ?,
        current_step = ?, status = ?, payment_approved = ?, details_approved = ?,
        documents_approved = ?, documents_published = ?, documents_acknowledged = ?, payment_receipt = ?,
        balance_payment_receipt = ?, form1 = ?, letter_of_engagement = ?,
        aoa = ?, form18 = ?, address_proof = ?, 
        customer_form1 = ?, customer_letter_of_engagement = ?, customer_aoa = ?, 
        customer_form18 = ?, customer_address_proof = ?,
        incorporation_certificate = ?, step3_additional_doc = ?, step3_signed_additional_doc = ?, step4_final_additional_doc = ?,
        company_name_english = ?, company_name_sinhala = ?, is_foreign_owned = ?,
        business_address_number = ?, business_address_street = ?, business_address_city = ?,
        postal_code = ?, share_price = ?, number_of_shareholders = ?, shareholders = ?,
        make_simple_books_secretary = ?, number_of_directors = ?, directors = ?,
        import_export_status = ?, imports_to_add = ?, exports_to_add = ?,
        other_business_activities = ?, drama_sedaka_division = ?, business_email = ?,
        business_contact_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
            [
                body.companyName || null,
                body.contactPersonName || null,
                body.contactPersonEmail || null,
                body.contactPersonPhone || null,
                body.selectedPackage || null,
                body.paymentMethod || null,
                body.currentStep || null,
                body.status || null,
                body.paymentApproved || false,
                body.detailsApproved || false,
                body.documentsApproved || false,
                body.documentsPublished || false,
                body.documentsAcknowledged || false,
                body.paymentReceipt ? JSON.stringify(body.paymentReceipt) : null,
                body.balancePaymentReceipt ? (() => {
                    try {
                        const result = JSON.stringify(body.balancePaymentReceipt);
                        console.log('✅ Successfully stringified balancePaymentReceipt:', result);
                        return result;
                    } catch (error) {
                        console.error('❌ Error stringifying balancePaymentReceipt:', error);
                        return null;
                    }
                })() : null,
                body.form1 ? JSON.stringify(body.form1) : null,
                body.letterOfEngagement ? JSON.stringify(body.letterOfEngagement) : null,
                body.aoa ? JSON.stringify(body.aoa) : null,
                body.form18 ? JSON.stringify(body.form18) : null,
                body.addressProof ? JSON.stringify(body.addressProof) : null,
                body.customerDocuments?.form1 ? JSON.stringify(body.customerDocuments.form1) : null,
                body.customerDocuments?.letterOfEngagement ? JSON.stringify(body.customerDocuments.letterOfEngagement) : null,
                body.customerDocuments?.aoa ? JSON.stringify(body.customerDocuments.aoa) : null,
                body.customerDocuments?.form18 ? JSON.stringify(body.customerDocuments.form18) : null,
                body.customerDocuments?.addressProof ? JSON.stringify(body.customerDocuments.addressProof) : null,
                body.incorporationCertificate ? JSON.stringify(body.incorporationCertificate) : null,
                body.step3AdditionalDoc ? JSON.stringify(body.step3AdditionalDoc) : null,
                body.step3SignedAdditionalDoc ? JSON.stringify(body.step3SignedAdditionalDoc) : null,
                body.step4FinalAdditionalDoc ? JSON.stringify(body.step4FinalAdditionalDoc) : null,
                body.companyNameEnglish || null,
                body.companyNameSinhala || null,
                body.isForeignOwned || null,
                body.businessAddressNumber || null,
                body.businessAddressStreet || null,
                body.businessAddressCity || null,
                body.postalCode || null,
                body.sharePrice || null,
                body.numberOfShareholders || null,
                body.shareholders ? JSON.stringify(body.shareholders) : null,
                body.makeSimpleBooksSecretary || null,
                body.numberOfDirectors || null,
                body.directors ? JSON.stringify(body.directors) : null,
                body.importExportStatus || null,
                body.importsToAdd || null,
                body.exportsToAdd || null,
                body.otherBusinessActivities || null,
                body.dramaSedakaDivision || null,
                body.businessEmail || null,
                body.businessContactNumber || null,
                id
            ]
        );

        connection.release();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Error updating registration:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        return NextResponse.json({
            error: 'Failed to update registration',
            details: error.message,
            code: error.code
        }, { status: 500 });
    }
}

// DELETE registration
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        const connection = await pool.getConnection();

        // First, get the registration data to identify files to delete
        const [rows] = await connection.execute(
            'SELECT * FROM registrations WHERE id = ?',
            [id]
        );

        if (Array.isArray(rows) && rows.length === 0) {
            connection.release();
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        const registration = rows[0];

        // Delete associated files from file storage
        try {
            const fileStorage = new FileStorageService();

            // List of file fields to check and delete
            const fileFields = [
                'payment_receipt',
                'balance_payment_receipt',
                'form1',
                'letter_of_engagement',
                'aoa',
                'form18',
                'address_proof',
                'customer_documents',
                'customer_form1',
                'customer_letter_of_engagement',
                'customer_aoa',
                'customer_form18',
                'customer_address_proof',
                'incorporation_certificate',
                'step3_additional_doc'
            ];

            for (const field of fileFields) {
                const fileData = registration[field];
                if (fileData) {
                    try {
                        const parsedFileData = JSON.parse(fileData);
                        if (parsedFileData.id) {
                            console.log(`🗑️ Deleting file ${field}:`, parsedFileData.id);
                            const fileInfo = await fileStorage.getFileById(parsedFileData.id);
                            if (fileInfo) {
                                await fileStorage.deleteFile(fileInfo.filePath);
                                console.log(`✅ File deleted: ${fileInfo.fileName}`);
                            }
                        }
                    } catch (parseError) {
                        console.warn(`Could not parse file data for ${field}:`, parseError);
                    }
                }
            }

            console.log(`✅ All files deleted for registration: ${id}`);
        } catch (fileError) {
            console.error('Error deleting files:', fileError);
            // Continue with database deletion even if file deletion fails
        }

        // Delete the registration from database
        const [result] = await connection.execute(
            'DELETE FROM registrations WHERE id = ?',
            [id]
        );
        connection.release();

        console.log(`✅ Registration deleted from database: ${id}`);
        return NextResponse.json({ success: true, message: 'Registration and all associated files deleted successfully' });
    } catch (error) {
        console.error('Error deleting registration:', error);
        return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
    }
} 