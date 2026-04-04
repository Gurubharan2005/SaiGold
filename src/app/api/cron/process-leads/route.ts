import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRoundRobinStaffId } from '@/lib/assignment'
import { triggerWelcomeWhatsApp } from '@/lib/notifications'

/**
 * Fallback Retrieval Worker (CRON Job)
 * Purpose: Decrypts and processes leads from the MetaLeadQueue that were 
 * stored quickly during the high-speed webhook ingestion phase.
 */
export async function GET(req: Request) {
  try {
    // 1. Simple Security Layer (Prevent unauthorized triggers)
    const { searchParams } = new URL(req.url)
    const clientSecret = req.headers.get('Authorization')?.replace('Bearer ', '') || searchParams.get('token')
    const systemSecret = process.env.CRON_SECRET || 'saigold-cron-token-2026'

    if (clientSecret !== systemSecret) {
      return NextResponse.json({ error: 'Unauthorized Action' }, { status: 401 })
    }

    // 2. Fetch Unprocessed Metadata from Queue
    const queuedLeads = await prisma.metaLeadQueue.findMany({
      where: { isProcessed: false },
      take: 20, // Process in batches to prevent timeouts
      orderBy: { createdAt: 'asc' }
    })

    if (queuedLeads.length === 0) {
      return NextResponse.json({ success: true, message: 'Queue is empty' })
    }

    const accessToken = process.env.META_ACCESS_TOKEN
    if (!accessToken) {
      console.error('[CRON Worker] Error: META_ACCESS_TOKEN is missing')
      return NextResponse.json({ error: 'System config error' }, { status: 500 })
    }

    let processedCount = 0

    // 3. Process Batch
    for (const item of queuedLeads) {
      try {
        console.log(`[CRON Worker] Processing Lead ID: ${item.leadgenId}`)

        // A. Fetch decrypted details from Facebook Graph
        const graphResponse = await fetch(`https://graph.facebook.com/v20.0/${item.leadgenId}?access_token=${accessToken}`)
        if (!graphResponse.ok) {
          console.error(`[CRON Worker] Graph Error for ${item.leadgenId}:`, await graphResponse.text())
          continue
        }

        const graphData = await graphResponse.json()
        const fields: Record<string, string> = {}
        if (graphData.field_data) {
          for (const f of graphData.field_data) {
            fields[f.name.toLowerCase()] = f.values.join(', ')
          }
        }

        const leadName = fields['full_name'] || fields['first_name'] || fields['name'] || 'Meta Lead'
        const leadPhone = fields['phone_number'] || fields['phone'] || ''
        const rawGold = fields['gold_weight'] || fields['gold_grams'] || '0'
        const rawAmount = fields['loan_amount'] || fields['amount'] || '0'
        const location = fields['location'] || fields['city'] || ''

        const parsedGold = parseFloat(rawGold.replace(/[^0-9.]/g, '')) || 0
        const parsedAmount = parseFloat(rawAmount.replace(/[^0-9.]/g, '')) || 0

        if (!leadPhone) {
          console.warn(`[CRON Worker] Lead ${item.leadgenId} missing phone number. Marking as failed.`)
          // We mark it processed to avoid infinite loops on bad data
          await prisma.metaLeadQueue.update({ where: { id: item.id }, data: { isProcessed: true } })
          continue
        }

        // B. Fair Distribution (Round-Robin)
        const autoAssigneeId = await getRoundRobinStaffId()

        // C. Create Official Customer Record
        await prisma.customer.create({
          data: {
            name: leadName,
            phone: leadPhone,
            goldWeight: parsedGold > 0 ? parsedGold : null,
            loanAmount: parsedAmount > 0 ? parsedAmount : null,
            branch: location,
            status: autoAssigneeId ? 'ACCEPTED' : 'WAITING',
            assignedToId: autoAssigneeId,
            assignedAt: autoAssigneeId ? new Date() : null,
            notes: `Source: Meta Ad Queue Retrieval (${item.leadgenId})`,
          }
        })

        // D. Trigger Automated WhatsApp Welcome and Staff Push Alert
        const { triggerPushNotification } = await import('@/lib/push')
        
        triggerWelcomeWhatsApp(leadPhone, leadName).catch(e => console.error("[CRON Worker] WhatsApp Failed:", e))
        
        if (autoAssigneeId) {
          triggerPushNotification(
            autoAssigneeId,
            'New Lead Assigned! 🚀',
            `Lead: ${leadName}\nPhone: ${leadPhone}`,
            `/dashboard/customers/${item.id}` // Link directly to the lead
          ).catch(e => console.error("[CRON Worker] Push Alert Failed:", e))
        }

        // E. Finish Queue Item
        await prisma.metaLeadQueue.update({
          where: { id: item.id },
          data: { isProcessed: true }
        })

        processedCount++
      } catch (innerError) {
        console.error(`[CRON Worker] Failed to process unit ${item.leadgenId}:`, innerError)
      }
    }

    return NextResponse.json({ success: true, processed: processedCount })
  } catch (error) {
    console.error('[CRON Worker] Global Error:', error)
    return NextResponse.json({ error: 'Internal Worker Failure' }, { status: 500 })
  }
}
