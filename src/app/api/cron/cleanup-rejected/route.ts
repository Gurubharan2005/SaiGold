import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * AUTO-CLEANUP WORKER
 * Permanently deletes leads that have been in the 'REJECTED' status for more than 10 days.
 */
export async function GET(req: Request) {
  try {
    // 1. Authorization Check (Only Vercel Cron or authorized secret can trigger)
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')
    
    // In production, Vercel sets CRON_SECRET or you can use your own custom header
    if (process.env.NODE_ENV === 'production' && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized manual execution.' }, { status: 401 })
    }

    // 2. Define the 10-day cutoff point
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    // 3. Purge Leads
    // We target leads that are REJECTED AND have not been updated in 10 days
    const result = await prisma.customer.deleteMany({
      where: {
        status: 'REJECTED',
        updatedAt: {
          lt: tenDaysAgo
        }
      }
    })

    console.log(`[CLEANUP_CRON] Success: Purged ${result.count} stale rejected leads.`)

    return NextResponse.json({ 
      success: true, 
      purgedCount: result.count, 
      cutoffDate: tenDaysAgo.toISOString() 
    }, { status: 200 })

  } catch (error) {
    console.error('[CLEANUP_CRON] Error:', error)
    return NextResponse.json({ error: 'Failed to execute cleanup logic.' }, { status: 500 })
  }
}

// Support for POST triggers if needed
export const POST = GET
