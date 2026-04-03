import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { del } from '@vercel/blob'

// DELETE a specific recording
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ rid: string }> }
) {
  const { rid } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null
  if (!session?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const recording = await prisma.callRecording.findUnique({ where: { id: rid } })
  if (!recording) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only manager or the uploader can delete
  const isManager = session.role === 'MANAGER'
  const isUploader = recording.uploadedById === String(session.id)
  if (!isManager && !isUploader) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete from Vercel Blob
  try { await del(recording.audioUrl) } catch { /* blob may not exist */ }

  await prisma.callRecording.delete({ where: { id: rid } })
  return NextResponse.json({ success: true })
}
