import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

import { put } from '@vercel/blob'

// Allowed size for server-side buffering - 4.5MB is Vercel's limit
export const maxDuration = 60

// GET — list all recordings for a customer
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null
  if (!session?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const recordings = await prisma.callRecording.findMany({
    where: { customerId: id },
    orderBy: { createdAt: 'desc' },
    include: { uploadedBy: { select: { name: true, role: true } } }
  })

  return NextResponse.json(recordings)
}

// POST — handle metadata (JSON) OR direct file upload (FormData)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const session = token ? await decrypt(token) : null
    if (!session?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const contentType = req.headers.get('content-type') || ''
    let audioUrl = ''
    let label = ''
    let durationSec = null

    // ── Path A: Direct Metadata (JSON) — from new direct-upload component ──
    if (contentType.includes('application/json')) {
      const body = await req.json()
      audioUrl = body.audioUrl
      label = body.label
      durationSec = body.durationSec
    } 
    // ── Path B: Legacy File Upload (FormData) — for backwards compatibility ──
    else {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      label = (formData.get('label') as string) || ''
      durationSec = formData.get('durationSec') ? Number(formData.get('durationSec')) : null

      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

      // Small/Legacy files: upload to Vercel Blob from the server
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const blob = await put(`recordings/customer_${id}/${safeName}`, file, {
        access: 'public',
        contentType: file.type || 'audio/mpeg'
      })
      audioUrl = blob.url
    }

    if (!audioUrl) return NextResponse.json({ error: 'Upload failed' }, { status: 400 })

    console.log(`[Recording] Saving metadata for customer ${id}: ${audioUrl}`)

    const recording = await prisma.callRecording.create({
      data: {
        customerId: id,
        uploadedById: String(session.id),
        audioUrl,
        label: label || null,
        durationSec,
      },
      include: { uploadedBy: { select: { name: true, role: true } } }
    })

    return NextResponse.json(recording, { status: 201 })

  } catch (err: any) {
    console.error('[Recording] API Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to save recording' }, { status: 500 })
  }
}
