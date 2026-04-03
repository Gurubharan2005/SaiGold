import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null
  if (!session?.id || session.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, any> = {}

  // Test 1: Blob token
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    results.blob_token = blobToken ? `set (${blobToken.substring(0, 20)}...)` : 'MISSING'
  } catch (e: any) {
    results.blob_token = `error: ${e.message}`
  }

  // Test 2: DB connection
  try {
    const count = await prisma.callRecording.count()
    results.db_connection = `ok, ${count} recordings`
  } catch (e: any) {
    results.db_connection = `error: ${e.message}`
  }

  // Test 3: Blob write test
  try {
    const testBlob = await put(
      `recordings/__test__/${Date.now()}.txt`,
      'hello world',
      { access: 'public', contentType: 'text/plain' }
    )
    results.blob_write = `ok: ${testBlob.url}`
    // Cleanup: we don't delete as del() requires a token 
  } catch (e: any) {
    results.blob_write = `error: ${e.message}`
  }

  return NextResponse.json(results)
}
