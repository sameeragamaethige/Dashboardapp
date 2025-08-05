import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// POST register
export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const { name, email, password, role = 'customer' } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // Check if email already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
            connection.release();
            return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
        }

        // Create new user
        const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const [result] = await connection.execute(
            `INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
            [userId, name, email, password, role]
        );

        connection.release();

        return NextResponse.json({
            success: true,
            user: {
                id: userId,
                name,
                email,
                role
            }
        });
    } catch (error) {
        console.error('Error during registration:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
} 