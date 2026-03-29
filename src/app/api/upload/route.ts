import { put, del } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
  const customerId = searchParams.get('customerId')
  const documentType = searchParams.get('documentType')

  if (!filename || !customerId || !documentType) {
    return NextResponse.json({ error: 'Filename, customerId, and documentType are required' }, { status: 400 })
  }

  if (!request.body) {
    return NextResponse.json({ error: 'File body is missing' }, { status: 400 })
  }

  // Security Verification: Is the customer ACCEPTED?
  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer || customer.status !== 'ACCEPTED') {
    return NextResponse.json({ error: 'Documents can only be uploaded to explicitly ACCEPTED customers.' }, { status: 403 })
  }

  try {
    // 1. Upload to Vercel Blob into a Virtual Folder path
    const securePath = `customers/${customerId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const blob = await put(securePath, request.body, {
      access: 'public',
    })

    // 2. Save metadata to Prisma CustomerDocument
    const document = await prisma.customerDocument.create({
      data: {
        documentUrl: blob.url,
        documentName: filename,
        documentType: documentType,
        customerId: customerId,
        uploadedById: String(session.id)
      }
    })

    return NextResponse.json({ blob, document }, { status: 200 })
  } catch (error: any) {
    console.error('Failure saving document:', error)
    return NextResponse.json({ error: `Upload Crash: ${error.message || String(error)}` }, { status: 500 })
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get('documentId')

  if (!documentId) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
  }

  try {
    const document = await prisma.customerDocument.findUnique({ where: { id: documentId } })
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    // Delete from Vercel Blob
    await del(document.documentUrl)

    // Delete from DB
    await prisma.customerDocument.delete({ where: { id: documentId } })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete Document Error:', error)
    return NextResponse.json({ error: 'Failed to delete securely' }, { status: 500 })
  }
}
