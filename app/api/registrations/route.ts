import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET all registrations
export async function GET() {
    try {
        console.log('🚨 API CALL DETECTED - GET /api/registrations called at:', new Date().toISOString());

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM registrations ORDER BY created_at DESC');
        connection.release();

        // Convert snake_case to camelCase for frontend compatibility
        const convertedRows = rows.map((row: any) => ({
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
        }));

        return NextResponse.json(convertedRows);
    } catch (error) {
        console.error('Error fetching registrations:', error);
        return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }
}

// POST new registration
export async function POST(request: NextRequest) {
    try {
        console.log('🚨 API CALL DETECTED - POST /api/registrations called at:', new Date().toISOString());
        console.log('🚨 Request headers:', Object.fromEntries(request.headers.entries()));
        console.log('🚨 Request method:', request.method);
        console.log('🚨 Request URL:', request.url);

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        console.log('📝 Registration API - Received body:', JSON.stringify(body, null, 2));

        const connection = await pool.getConnection();

        // Validate required fields and handle undefined values
        if (!body || typeof body !== 'object') {
            console.error('❌ Registration API - Invalid body received:', body);
            connection.release();
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        if (!body.id) {
            console.error('❌ Registration API - Missing ID in body:', body);
            connection.release();
            return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
        }

        console.log('✅ Registration API - Valid body received with ID:', body.id);

        // Check if registration already exists
        const [existingRows] = await connection.execute(
            'SELECT id FROM registrations WHERE id = ?',
            [body.id]
        );

        if (existingRows.length > 0) {
            connection.release();
            return NextResponse.json({
                success: true,
                id: body.id,
                message: 'Registration already exists'
            });
        }

        const [result] = await connection.execute(
            `INSERT INTO registrations (
        id, company_name, contact_person_name, contact_person_email, 
        contact_person_phone, selected_package, payment_method, current_step, 
        status, payment_receipt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                body.id,
                body.companyName || null,
                body.contactPersonName || null,
                body.contactPersonEmail || null,
                body.contactPersonPhone || null,
                body.selectedPackage || null,
                body.paymentMethod || null,
                body.currentStep || null,
                body.status || null,
                body.paymentReceipt ? JSON.stringify(body.paymentReceipt) : null
            ]
        );

        connection.release();
        return NextResponse.json({ success: true, id: body.id });
    } catch (error) {
        console.error('Error creating registration:', error);
        return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 });
    }
} 