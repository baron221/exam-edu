// POST /api/admin/seed — creates the first teacher account
// Call once: POST http://localhost:3000/api/admin/seed
// Body: { "name": "Teacher Name", "email": "teacher@npuu.uz", "password": "yourpassword" }

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'name, email and password are required.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists.' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'teacher' },
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
