import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

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

// POST — save a recording URL to the database (after client-side blob upload)
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
    let audioUrl: string | null = null
    let label: string | null = null
    let durationSec: number | null = null

    if (contentType.includes('application/json')) {
      // Client-side upload flow: receives { audioUrl, label, durationSec }
      const body = await req.json()
      audioUrl = body.audioUrl
      label = body.label || null
      durationSec = body.durationSec ? Number(body.durationSec) : null
    } else {
      // Legacy fallback: multipart FormData (small files only)
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      label = formData.get('label') as string | null
      durationSec = formData.get('durationSec') ? Number(formData.get('durationSec')) : null

      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

      const { put } = await import('@vercel/blob')
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const blob = await put(
        `recordings/customer_${id}/${Date.now()}_${safeFileName}`,
        file,
        { access: 'public' }
      )
      audioUrl = blob.url
    }

    if (!audioUrl) {
      return NextResponse.json({ error: 'No audio URL provided' }, { status: 400 })
    }

    console.log(`[Recording] Saving to DB: ${audioUrl} for customer ${id}`)

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

    console.log(`[Recording] Saved: ${recording.id}`)
    return NextResponse.json(recording, { status: 201 })

  } catch (err: any) {
    console.error('[Recording] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
