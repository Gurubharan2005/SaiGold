import { prisma } from './prisma'

/**
 * Automatically assigns a lead to an active staff member using a Fair Round-Robin algorithm.
 * Selects the staff member who hasn't received a lead for the longest period.
 */
export async function getRoundRobinStaffId(): Promise<string | null> {
  try {
    // 1. Find all active staff members
    // Ordering by lastLeadAssignedAt nulls first, then the oldest date.
    const candidates = await (prisma.user.findMany as any)({
      where: {
        role: 'STAFF',
        isActive: true,
      },
      orderBy: [
        { lastLeadAssignedAt: 'asc' }, 
        { createdAt: 'asc' },
      ],
      select: {
        id: true,
        name: true,
      },
      take: 1,
    })

    if (candidates.length === 0) {
      console.warn('AUTO-ASSIGNMENT: No active staff members available to receive leads.')
      return null
    }

    const assignee = candidates[0]

    // 2. Mark the timestamp to rotate the queue
    await (prisma.user.update as any)({
      where: { id: assignee.id },
      data: { lastLeadAssignedAt: new Date() },
    })

    console.log(`AUTO-ASSIGNMENT: Successfully allocated lead to ${assignee.name} (${assignee.id})`)
    return assignee.id
  } catch (error) {
    console.error('ROUND ROBIN ERROR:', error)
    return null
  }
}
