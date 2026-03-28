import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // 1. Check if this is a raw Meta Lead Gen Graph API webhook (requires another fetch)
    // 2. Or if this is a pre-parsed payload (e.g., from Zapier / Make.com / custom integration)
    // We will support a direct JSON ingest for the fields required:
    
    // Default values if direct ingest format is used (e.g., Zapier mapping)
    let leadName = body.name || body.customer_name || body.CustomerName || 'Meta Lead'
    let leadPhone = body.phone || body.phone_number || body.PhoneNumber || ''
    let leadGold = parseFloat(body.gold_weight) || 0
    let leadAmount = parseFloat(body.loan_amount) || 0
    let location = body.location || body.city || ''

    // If this is a direct Facebook Graph Event, the body structure looks like:
    // { "object": "page", "entry": [ { "changes": [ { "value": { "form_id": "...", "leadgen_id": "..." } } ] } ] }
    if (body.object === 'page' && body.entry) {
      // Normally, you would extract `leadgen_id` and query the Graph API to get the fields using an App Token.
      // For this CRM architecture, we assume a pre-parsed webhook forwarder is preferred unless a Graph Token is provided.
      // E.g. Using Zapier to catch the Meta Lead and format it correctly to hit this Webhook.
      console.log('Received raw Meta Graph event - expecting direct field mappings.')
    }

    if (!leadPhone) {
      return NextResponse.json({ error: 'Phone number is required to register lead' }, { status: 400 })
    }

    // Insert the lead into the PostgreSQL Database automatically
    const customer = await prisma.customer.create({
      data: {
        name: leadName,
        phone: leadPhone,
        goldWeight: leadGold > 0 ? leadGold : null,
        loanAmount: leadAmount > 0 ? leadAmount : null,
        branch: location,
        status: 'WAITING',
        notes: `Source: Meta Ads Lead Integration`,
      }
    })

    return NextResponse.json({ success: true, customerId: customer.id }, { status: 200 })

  } catch (error) {
    console.error('Meta Webhook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
