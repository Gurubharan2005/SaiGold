import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (!session?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Allow audio files only
        return {
          allowedContentTypes: [
            'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg',
            'audio/webm', 'audio/m4a', 'audio/x-m4a', 'audio/aac',
            'audio/flac', 'audio/3gpp', 'video/mp4', 'application/octet-stream'
          ],
          maximumSizeInBytes: 52_428_800, // 50MB
          tokenPayload: JSON.stringify({ customerId: id, userId: session.id }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This callback is called after successful upload to Vercel Blob
        // We save the URL to our database here
        console.log('[Blob] Upload completed:', blob.url)
        try {
          const { PrismaClient } = await import('@prisma/client')
          const prisma = new PrismaClient()
          const payload = tokenPayload ? JSON.parse(tokenPayload) : {}
          await prisma.callRecording.create({
            data: {
              customerId: payload.customerId || id,
              uploadedById: String(payload.userId || session.id),
              audioUrl: blob.url,
              label: null,
              durationSec: null,
            }
          })
          console.log('[Blob] DB record saved for', blob.url)
          await prisma.$disconnect()
        } catch (err) {
          console.error('[Blob] DB save error:', err)
          // Don't throw — the file is already uploaded, we'll handle DB separately
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error: any) {
    console.error('[Blob] handleUpload error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
