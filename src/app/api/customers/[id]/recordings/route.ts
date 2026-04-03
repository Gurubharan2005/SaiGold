import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { put } from '@vercel/blob'

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
    orderBy: { createdAt: 'desc' }, // newest first
    include: { uploadedBy: { select: { name: true, role: true } } }
  })

  return NextResponse.json(recordings)
}

// POST — upload a new call recording
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

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const label = formData.get('label') as string | null
    const durationSec = formData.get('durationSec') ? Number(formData.get('durationSec')) : null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Validate file extensions
    if (!file.name.match(/\.(mp3|mp4|wav|ogg|webm|m4a|aac)$/i)) {
      return NextResponse.json({ error: 'Invalid file type. Please use audio files like mp3, m4a, or wav.' }, { status: 400 })
    }

    console.log(`[Recording] Uploading ${file.name} (${file.size} bytes) for customer ${id}`)

    // Upload to Vercel Blob
    let blob;
    try {
      blob = await put(`recordings/${id}/${Date.now()}-${file.name}`, file, {
        access: 'public',
      })
    } catch (blobErr: any) {
      console.error('[Recording] Vercel Blob error:', blobErr)
      return NextResponse.json({ error: `Storage error: ${blobErr.message || 'Unknown'}` }, { status: 500 })
    }

    console.log(`[Recording] Blob uploaded: ${blob.url}`)

    try {
      const recording = await prisma.callRecording.create({
        data: {
          customerId: id,
          uploadedById: String(session.id),
          audioUrl: blob.url,
          label: label || null,
          durationSec: durationSec,
        },
        include: { uploadedBy: { select: { name: true, role: true } } }
      })
      console.log(`[Recording] Database record created: ${recording.id}`)
      return NextResponse.json(recording, { status: 201 })
    } catch (prismaErr: any) {
      console.error('[Recording] Prisma error:', prismaErr)
      return NextResponse.json({ error: `Database error: ${prismaErr.message || 'Unknown'}` }, { status: 500 })
    }
  } catch (err: any) {
    console.error('[Recording] General error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
