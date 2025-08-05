import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// PUT update customer documents
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

        console.log('📝 PUT /api/registrations/[id]/customer-documents - Updating customer documents:', {
            id,
            customerDocuments: body.customerDocuments
        });

        const connection = await pool.getConnection();

        // Update customer documents in separate columns
        const customerDocuments = body.customerDocuments || {};



        const [result] = await connection.execute(
            `UPDATE registrations SET 
                customer_form1 = ?,
                customer_letter_of_engagement = ?,
                customer_aoa = ?,
                customer_form18 = ?,
                customer_address_proof = ?,
                documents_acknowledged = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                customerDocuments.form1 ? JSON.stringify(customerDocuments.form1) : null,
                customerDocuments.letterOfEngagement ? JSON.stringify(customerDocuments.letterOfEngagement) : null,
                customerDocuments.aoa ? JSON.stringify(customerDocuments.aoa) : null,
                customerDocuments.form18 ? JSON.stringify(customerDocuments.form18) : null,
                customerDocuments.addressProof ? JSON.stringify(customerDocuments.addressProof) : null,
                body.documentsAcknowledged || false,
                id
            ]
        );

        connection.release();

        console.log('✅ Customer documents updated successfully:', result);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Error updating customer documents:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack
        });
        return NextResponse.json({ error: 'Failed to update customer documents' }, { status: 500 });
    }
} 