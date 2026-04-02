import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRoundRobinStaffId } from '@/lib/assignment'

/**
 * Make.com Webhook Endpoint
 * 
 * Configure in Make.com:
 *   Module: "Webhooks > Custom Webhook"
 *   URL: https://your-domain.com/api/webhooks/make
 *   Method: POST
 *   Headers: { "x-make-secret": "<MAKE_WEBHOOK_SECRET from .env>" }
 * 
 * Expected JSON body from Make.com (map Facebook Lead fields):
 * {
 *   "name": "{{full_name}}",
 *   "phone": "{{phone_number}}",
 *   "branch": "{{city}}",           (optional)
 *   "notes": "{{ad_name}}"          (optional - which ad the lead came from)
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Log raw body so we can see exactly what Make.com is sending
    console.log('Make.com raw payload:', JSON.stringify(body))

    // Accept multiple field name variants from Facebook Lead Ads
    const name: string = (
      body.name ||
      body.full_name ||
      body.fullName ||
      (body.first_name && body.last_name
        ? `${body.first_name} ${body.last_name}`
        : body.first_name || body.last_name) ||
      ''
    ).trim()

    const phone: string = (
      body.phone ||
      body.phone_number ||
      body.phoneNumber ||
      body.mobile ||
      body.contact ||
      ''
    ).toString().trim()

    const branch: string = (body.branch || body.city || body.location || '').trim()
    const notes: string = (body.notes || body.ad_name || body.adName || body.campaign_name || '').trim()

    // Validate required fields
    if (!name || !phone) {
      console.warn('Make.com: Missing name or phone. Body received:', JSON.stringify(body))
      return NextResponse.json(
        { error: 'Missing required fields: name and phone are required', received: Object.keys(body) },
        { status: 400 }
      )
    }

    // 3. Deduplicate — skip if we already have this phone number as an active lead
    const existing = await prisma.customer.findFirst({
      where: {
        phone: String(phone).trim(),
        status: { notIn: ['CLOSED', 'REJECTED'] }
      }
    })

    if (existing) {
      console.log(`Make.com: Duplicate lead skipped for phone ${phone}`)
      return NextResponse.json(
        { success: true, skipped: true, reason: 'Duplicate lead', existingId: existing.id },
        { status: 200 }
      )
    }

    // 4. Auto-assign to a staff member via Round-Robin
    const assignedToId = await getRoundRobinStaffId()

    // 5. Create the customer record
    const customer = await prisma.customer.create({
      data: {
        name: String(name).trim(),
        phone: String(phone).trim(),
        branch: branch ? String(branch).trim() : null,
        notes: notes ? `[Meta Ad Lead] ${String(notes).trim()}` : '[Meta Ad Lead]',
        status: 'WAITING',
        callStatus: 'NOT_CALLED',
        priority: 'MEDIUM',
        ...(assignedToId
          ? { assignedToId, assignedAt: new Date() }
          : {})
      }
    })

    console.log(`Make.com: New lead created — ${customer.name} (${customer.phone}), assigned to ${assignedToId ?? 'unassigned'}`)

    return NextResponse.json(
      { success: true, customerId: customer.id, assignedToId },
      { status: 201 }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Make.com Webhook Error:', error)
    return NextResponse.json({ error: `Internal Server Error: ${msg}` }, { status: 500 })
  }
}
