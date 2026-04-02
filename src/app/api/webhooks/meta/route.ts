import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRoundRobinStaffId } from '@/lib/assignment'

// GET handler to verify the webhook from Meta Graph API Settings
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'saigoldloans-verify-token'

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 })
  } else {
    return new NextResponse('Forbidden', { status: 403 })
  }
}

// POST handler to receive the actual Lead data
export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("Raw Meta Payload Received:", JSON.stringify(body))

    // Ensure it's a Page event
    if (body.object === 'page' && body.entry) {
      let leadCount = 0

      // Iterate through Facebook's deeply nested Webhook arrays
      for (const entry of body.entry) {
        if (!entry.changes) continue;
        
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const lead = change.value

            if (!lead || !lead.leadgen_id) continue

            // ⚡ ULTRA-FAST STORE AND FORWARD ⚡ 
            // We use Prisma "upsert" so that if Meta retries the identical webhook, we don't crash
            await prisma.metaLeadQueue.upsert({
              where: { leadgenId: String(lead.leadgen_id) },
              update: {},
              create: {
                leadgenId: String(lead.leadgen_id),
                formId: lead.form_id ? String(lead.form_id) : null,
                pageId: lead.page_id ? String(lead.page_id) : null,
                isProcessed: false
              }
            })

            leadCount++;
          }
        }
      }

      return NextResponse.json({ success: true, processed: leadCount }, { status: 200 })
    }

    return NextResponse.json({ error: 'Ignoring non-page event' }, { status: 400 })
  } catch (error) {
    console.error('Meta Webhook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

