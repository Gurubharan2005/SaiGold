import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const session = token ? await decrypt(token) : null

    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only STAFF and MANAGER can send leads to follow-up
    if (!(['STAFF', 'MANAGER'] as string[]).includes(session.role as string)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { customerId } = await req.json()
    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
    }

    // Verify the customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true }
    })
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get all FOLLOW_UP_STAFF members
    // Using $queryRaw to handle the enum since Prisma client may not have regenerated yet
    const followUpStaffMembers = await prisma.user.findMany({
      where: { isActive: true, role: 'FOLLOW_UP_STAFF' as any },
      select: { id: true, name: true }
    })

    if (followUpStaffMembers.length === 0) {
      return NextResponse.json({ 
        error: 'No Follow-Up Staff available. Ask your Manager to add Follow-Up Staff members in User Management.' 
      }, { status: 503 })
    }

    // Count active FOLLOW_UP_ASSIGNED leads per staff member for load balancing
    const activeCounts = await prisma.customer.groupBy({
      by: ['followUpStaffId'],
      where: { status: 'FOLLOW_UP_ASSIGNED' as any, followUpStaffId: { not: null } },
      _count: { _all: true }
    })

    const countMap = new Map(activeCounts.map(c => [c.followUpStaffId, c._count._all]))

    // Pick the one with fewest
    const bestFollowUpStaff = followUpStaffMembers.sort((a, b) => {
      const aCount = countMap.get(a.id) ?? 0
      const bCount = countMap.get(b.id) ?? 0
      return aCount - bCount
    })[0]

    // Update the customer
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        status: 'FOLLOW_UP_ASSIGNED' as any,
        followUpStaffId: bestFollowUpStaff.id,
        updatedAt: new Date(),
      }
    })

    // Log the activity
    const { logActivity } = await import('@/lib/activity')
    await logActivity(
      customerId,
      'ASSIGNMENT',
      `Sent to Follow-Up Staff (${bestFollowUpStaff.name}) by Caller Staff`,
      String(session.id)
    )

    return NextResponse.json({
      success: true,
      assignedTo: bestFollowUpStaff.name,
    })

  } catch (error) {
    console.error('[SEND_TO_FOLLOWUP_ERROR]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
