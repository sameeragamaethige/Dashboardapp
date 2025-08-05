import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET settings
export async function GET() {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM settings LIMIT 1');
        connection.release();

        if (Array.isArray(rows) && rows.length === 0) {
            // Return default settings if none exist
            return NextResponse.json({
                id: 'default',
                title: 'Dashboard V3',
                description: 'Company Registration Dashboard',
                logoUrl: '',
                faviconUrl: '',
                primaryColor: '#000000',
                secondaryColor: '#ffffff'
            });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// PUT update settings
export async function PUT(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const connection = await pool.getConnection();

        // Check if settings exist
        const [existing] = await connection.execute('SELECT id FROM settings LIMIT 1');

        if (Array.isArray(existing) && existing.length === 0) {
            // Create new settings
            await connection.execute(
                `INSERT INTO settings (
          id, title, description, logo_url, favicon_url, primary_color, secondary_color
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    'default',
                    body.title || 'Dashboard V3',
                    body.description || 'Company Registration Dashboard',
                    body.logo_url || null,
                    body.favicon_url || null,
                    body.primary_color || '#000000',
                    body.secondary_color || '#ffffff'
                ]
            );
        } else {
            // Update existing settings
            await connection.execute(
                `UPDATE settings SET 
          title = ?, description = ?, logo_url = ?, favicon_url = ?,
          primary_color = ?, secondary_color = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
                [
                    body.title || 'Dashboard V3',
                    body.description || 'Company Registration Dashboard',
                    body.logo_url || null,
                    body.favicon_url || null,
                    body.primary_color || '#000000',
                    body.secondary_color || '#ffffff',
                    'default'
                ]
            );
        }

        connection.release();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
} 