import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = await decrypt(token)
    if (!session || session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Permission denied. Only managers can revoke credentials.' }, { status: 403 })
    }

    const { id } = await params

    if (id === session.id) {
       return NextResponse.json({ error: 'Self-deletion is structurally blocked.' }, { status: 400 })
    }

    // Soft delete executing constraint protection preserving historical document uploads
    await prisma.user.update({
      where: { id },
      data: { isActive: false, password: '' } // Password wipe reinforces local lockdown
    })

    return NextResponse.json({ success: true, message: 'Staff Access Revoked' })
  } catch (error) {
    console.error('[STAFF_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error while executing revocation' }, { status: 500 })
  }
}
