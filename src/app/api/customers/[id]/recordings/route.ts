import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { put } from '@vercel/blob'

// Allow up to 60 seconds for large audio uploads
export const maxDuration = 60

// GET — list all recordings for a customer (newest first)
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

// POST — upload audio file and save to DB in one shot
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

    // ── Path A: JSON with pre-uploaded blob URL (from client-side upload) ──
    if (contentType.includes('application/json')) {
      const body = await req.json()
      const { audioUrl, label, durationSec } = body

      if (!audioUrl) return NextResponse.json({ error: 'No audio URL provided' }, { status: 400 })

      const recording = await prisma.callRecording.create({
        data: {
          customerId: id,
          uploadedById: String(session.id),
          audioUrl,
          label: label || null,
          durationSec: durationSec ? Number(durationSec) : null,
        },
        include: { uploadedBy: { select: { name: true, role: true } } }
      })
      return NextResponse.json(recording, { status: 201 })
    }

    // ── Path B: Direct file stream — fastest path ──
    // File streams directly from browser → this API → Vercel Blob
    // Then URL is saved to DB in the same request. One shot, no callbacks.
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const label = (formData.get('label') as string) || null
    const durationSec = formData.get('durationSec') ? Number(formData.get('durationSec')) : null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    console.log(`[Recording] Streaming upload: "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

    // Sanitize filename
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')

    // Stream to Vercel Blob — stored in customer-specific folder
    const blob = await put(
      `recordings/customer_${id}/${Date.now()}_${safeFileName}`,
      file,
      {
        access: 'public',
        contentType: file.type || 'audio/mpeg',
      }
    )

    console.log(`[Recording] Blob stored: ${blob.url}`)

    // Save to DB immediately after upload
    const recording = await prisma.callRecording.create({
      data: {
        customerId: id,
        uploadedById: String(session.id),
        audioUrl: blob.url,
        label: label || null,
        durationSec,
      },
      include: { uploadedBy: { select: { name: true, role: true } } }
    })

    console.log(`[Recording] Saved to DB: ${recording.id}`)
    return NextResponse.json(recording, { status: 201 })

  } catch (err: any) {
    console.error('[Recording] Error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
