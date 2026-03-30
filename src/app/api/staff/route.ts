import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    // 1. Verify MANAGER Identity securely backend-over-backend
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const session = await decrypt(token)
    if (session?.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Extract Data
    const { name, email, password, role } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, Email and Password are required' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
    }

    // 3. Create the user with specified role (defaulting to STAFF)
    const hashedPassword = await bcrypt.hash(password, 10)

    const staff = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'STAFF', 
      }
    })

    return NextResponse.json({ success: true, staff: { id: staff.id, name: staff.name, email: staff.email } }, { status: 201 })
  } catch (error) {
    console.error('Create Staff Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
