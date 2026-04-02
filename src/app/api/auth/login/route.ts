import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encrypt } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // 1. Connection Check
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error('DATABASE CONNECTION FAILED:', dbError)
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid or revoked credentials' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate token
    const token = await encrypt({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })
    
    // Set a non-httpOnly cookie for the client UI to detect active session
    cookieStore.set('session-active', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return NextResponse.json({ success: true, role: user.role })
    
  } catch (error: unknown) {
    console.error('CRITICAL LOGIN ERROR:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: process.env.NODE_ENV === 'development' ? message : undefined 
    }, { status: 500 })
  }
}
