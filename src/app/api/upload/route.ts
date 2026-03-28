import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let session
  try {
    session = await decrypt(token)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid Token' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  const customerId = searchParams.get('customerId')

  if (!filename || !customerId) {
    return NextResponse.json({ error: 'Filename and customerId are required' }, { status: 400 })
  }

  if (!request.body) {
    return NextResponse.json({ error: 'File body is missing' }, { status: 400 })
  }

  try {
    // 1. Upload to Vercel Blob
    const blob = await put(filename, request.body, {
      access: 'public', // CRM files generally require secure signed URLs but for MVP public unguessable hashes are used by Vercel by default
    })

    // 2. Save metadata to Prisma Database
    const document = await prisma.document.create({
      data: {
        fileUrl: blob.url,
        fileName: filename,
        customerId: customerId,
        uploadedById: String(session.id)
      }
    })

    return NextResponse.json({ blob, document }, { status: 200 })
  } catch (error) {
    console.error('Failure saving document:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
