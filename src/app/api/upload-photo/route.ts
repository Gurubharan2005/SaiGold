import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let session
  try {
    session = await decrypt(token)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid Token' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
  }

  if (!request.body) {
    return NextResponse.json({ error: 'File body is missing' }, { status: 400 })
  }

  try {
    // Avatars can be public or private. We will use public to allow native <img> rendering easily
    const securePath = `avatars/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const blob = await put(securePath, request.body, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url }, { status: 200 })
  } catch (error: any) {
    console.error('Failure saving avatar:', error)
    return NextResponse.json({ error: `Upload Crash: ${error.message || String(error)}` }, { status: 500 })
  }
}
