import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// POST login
export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // Find user with matching email and password
        const [rows] = await connection.execute(
            'SELECT id, name, email, role, created_at, updated_at FROM users WHERE email = ? AND password = ?',
            [email, password]
        );

        connection.release();

        if (Array.isArray(rows) && rows.length === 0) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const user = rows[0];

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
} 