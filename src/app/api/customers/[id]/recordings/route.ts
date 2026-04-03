import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { put } from '@vercel/blob'

// Use max duration for large recordings
export const maxDuration = 60

/**
 * DEEP INVESTIGATION RECORDINGS API
 * Includes retry logic and robust path/metadata handling.
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

// POST — Handle both JSON and FormData with Persistent Retry
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
    
    // Deep session validation to prevent Foreign Key violations (e.g., if user was deleted but session persists)
    const userExists = await prisma.user.findUnique({ where: { id: String(session.id) }, select: { id: true } })
    if (!userExists) {
      console.warn(`[Recordings-API] Security Abort: User ID '${session.id}' missing from DB. Re-login required.`)
      return NextResponse.json({ error: 'Session Inconsistency: User account not found. Please logout and login again.' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') || ''
    let audioUrl = ''
    let label = ''
    let durationSec = null

    // PATH A: JSON (From direct-upload component)
    if (contentType.includes('application/json')) {
      const body = await req.json()
      audioUrl = body.audioUrl
      label = body.label
      durationSec = body.durationSec
    } 
    // PATH B: FormData (Legacy components)
    else {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      label = (formData.get('label') as string) || ''
      durationSec = formData.get('durationSec') ? Number(formData.get('durationSec')) : null

      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

      // Server-side upload to Vercel Blob (KB files)
      const blob = await put(`recordings/customer_${id}/${Date.now()}_${file.name}`, file, {
        access: 'private',
        contentType: file.type || 'audio/mpeg'
      })
      audioUrl = blob.url
    }

    if (!audioUrl) return NextResponse.json({ error: 'Upload process failed' }, { status: 400 })

    // PERSISTENT RETRY: Try to save to DB (up to 3 attempts)
    let finalRecording = null
    let error = null
    
    for (let i = 0; i < 3; i++) {
       try {
         finalRecording = await prisma.callRecording.create({
           data: {
             customerId: id,
             uploadedById: String(session.id),
             audioUrl,
             label: label || null,
             durationSec,
           },
           include: { uploadedBy: { select: { name: true, role: true } } }
         })
          if (finalRecording) {
            console.log(`[Recordings-API] Success! DB entry created for ${id} by ${session.id}`)
            break
          }
       } catch (e: any) {
         console.warn(`[DB-Retry] Attempt ${i+1} failed:`, e.message)
         error = e
         await new Promise(resolve => setTimeout(resolve, 500))
       }
    }

    if (!finalRecording) {
       throw new Error(`Database Save Failed after 3 attempts: ${error?.message}`)
    }

    return NextResponse.json(finalRecording, { status: 201 })

  } catch (err: any) {
    console.error('[Deep-Investigate-API] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
