import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  
  // Clear the auth-token cookie
  cookieStore.set('auth-token', '', { 
    expires: new Date(0),
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })

  // Clear the session-active UI cookie
  cookieStore.set('session-active', '', { 
    expires: new Date(0),
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })

  return NextResponse.json({ message: 'Auth session purged successfully' })
}
