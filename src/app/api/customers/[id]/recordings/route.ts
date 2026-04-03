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

  // Validate file type
  const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/x-m4a']
  if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|mp4|wav|ogg|webm|m4a)$/i)) {
    return NextResponse.json({ error: 'Invalid file type. Use mp3, mp4, wav, ogg, webm or m4a.' }, { status: 400 })
  }

  // Upload to Vercel Blob
  const blob = await put(`recordings/${id}/${Date.now()}-${file.name}`, file, {
    access: 'public',
  })

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

  return NextResponse.json(recording, { status: 201 })
}
