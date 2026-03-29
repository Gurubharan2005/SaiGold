import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const session = await decrypt(token)
    if (!session || session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Permission denied. Only managers can perform bulk delegation.' }, { status: 403 })
    }

    const { customerIds, assignedToId } = await req.json()

    if (!Array.isArray(customerIds) || customerIds.length === 0 || !assignedToId) {
      return NextResponse.json({ error: 'Invalid payload structure parameters.' }, { status: 400 })
    }

    // Execute bulk update query mapping assignedToId exactly natively and push into processing tier starting the response clock natively
    const result = await prisma.customer.updateMany({
      where: { id: { in: customerIds } },
      data: { assignedToId, status: 'PROCESSING', assignedAt: new Date() }
    })

    return NextResponse.json({ success: true, count: result.count }, { status: 200 })
  } catch (error) {
    console.error('[BULK_ASSIGN_ERROR]', error)
    return NextResponse.json({ error: 'Failed to process bulk allocation patch.' }, { status: 500 })
  }
}
