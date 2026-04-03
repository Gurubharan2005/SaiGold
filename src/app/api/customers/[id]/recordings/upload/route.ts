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
      onBeforeGenerateToken: async () => {
        // Generate a token allowing audio uploads up to 50MB
        return {
          allowedContentTypes: [
            'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg',
            'audio/webm', 'audio/m4a', 'audio/x-m4a', 'audio/aac',
            'audio/flac', 'audio/3gpp', 'video/mp4', 'application/octet-stream'
          ],
          maximumSizeInBytes: 52_428_800, // 50MB
          tokenPayload: JSON.stringify({ customerId: id, userId: String(session.id) }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // NOTE: DB save is handled by the client after upload — this is just a log
        console.log('[Blob] Upload completed to Vercel Blob:', blob.url, 'payload:', tokenPayload)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error: any) {
    console.error('[Blob] handleUpload error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
