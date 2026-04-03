import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

/**
 * CUSTOMER RECORDINGS API
 * Simplified to handle DB metadata saving only. 
 * Real file storage is handled directly from browser to Vercel Blob.
 */

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

// POST — save a pre-uploaded recording URL to the database
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

    // We now expect JSON with the audioUrl from the successful direct upload
    const { audioUrl, label, durationSec } = await req.json()

    if (!audioUrl) {
      return NextResponse.json({ error: 'No audio URL provided' }, { status: 400 })
    }

    console.log(`[Recording] Saving metadata for customer ${id}: ${audioUrl}`)

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

  } catch (err: any) {
    console.error('[Recording] Metadata error:', err)
    return NextResponse.json({ error: 'Failed to save recording metadata' }, { status: 500 })
  }
}
