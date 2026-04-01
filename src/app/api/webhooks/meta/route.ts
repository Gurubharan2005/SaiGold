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

    // Ensure it's a Page event
    if (body.object === 'page') {
      let leadCount = 0

      // Iterate through Facebook's deeply nested Webhook arrays
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const leadgenId = change.value.leadgen_id

            if (!leadgenId) continue

            // Fetch the actual decrypted Lead Information from Facebook Graph API
            const accessToken = process.env.META_ACCESS_TOKEN

            if (!accessToken) {
              console.error('CRITICAL ERROR: META_ACCESS_TOKEN is missing in the environment variables, cannot decrypt leadgen_id:', leadgenId)
              return NextResponse.json({ error: 'System Access Token missing' }, { status: 500 })
            }

            const graphResponse = await fetch(`https://graph.facebook.com/v20.0/${leadgenId}?access_token=${accessToken}`)
            if (!graphResponse.ok) {
              const errData = await graphResponse.json()
              console.error('Meta Graph API Error:', errData)
              continue
            }

            const graphData = await graphResponse.json()
            
            // Map the mysterious field_data array back into a usable JS object
            const fields: Record<string, string> = {}
            if (graphData.field_data) {
              for (const field of graphData.field_data) {
                // Combine array values into a single string just in case
                fields[field.name.toLowerCase()] = field.values.join(', ')
              }
            }

            // Attempt to smartly guess the standard and custom Facebook Ad Form fields
            const leadName = fields['full_name'] || fields['first_name'] || fields['name'] || 'Meta Lead'
            const leadPhone = fields['phone_number'] || fields['phone'] || ''
            
            // Check for custom gold/loan questions in your Meta Form
            // E.g. "gold_weight", "grams", "loan_amount", "amount_needed"
            const rawGold = fields['gold_weight'] || fields['gold_grams'] || fields['weight'] || '0'
            const rawAmount = fields['loan_amount'] || fields['amount'] || fields['desired_loan'] || '0'
            const location = fields['location'] || fields['city'] || fields['branch'] || ''

            const parsedGold = parseFloat(rawGold.replace(/[^0-9.]/g, '')) || 0
            const parsedAmount = parseFloat(rawAmount.replace(/[^0-9.]/g, '')) || 0

            if (!leadPhone) {
              console.warn('Facebook Lead missing phone number:', graphData)
              continue
            }

            // 4. Fair Round-Robin Lead Distribution
            const autoAssigneeId = await getRoundRobinStaffId()

            // 5. Safely push into PostgreSQL
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
                notes: `Source: Native Facebook Graph (${leadgenId})${!autoAssigneeId ? ' (Awaiting Manual Assignment)' : ''}`,
              }
            })

            // 6. Trigger Autoreply Greeting (Non-Blocking)
            triggerWelcomeWhatsApp(leadPhone, leadName).catch(e => console.error("Auto-WA Failed:", e))

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

/**
 * Enterprise Feature (Phase 5): Automated WhatsApp Welcome
 * NOTE: This is an isolated skeleton ready for production execution.
 * To activate, simply supply your official Twilio or Meta WhatsApp Business API credentials.
 */
async function triggerWelcomeWhatsApp(phone: string, name: string) {
  // TODO: Add your Twilio Account SID, Auth Token, and exact Twilio Phone Number here.
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER // e.g. "whatsapp:+14155238886"

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.log(`[Auto-WA Skipped] API Keys missing. Would have messaged: ${phone}`)
    return
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const message = `Hi ${name}, welcome to Sai Gold Loans! We received your request. One of our executives will reach out to you shortly to assist with the best appraisal rates.`
  
  // Clean phone string to international E164 format if required
  const cleanPhone = phone.includes('+') ? phone : `+91${phone.replace(/[^0-9]/g, '')}`

  const params = new URLSearchParams({
    To: `whatsapp:${cleanPhone}`,
    From: TWILIO_PHONE_NUMBER || '',
    Body: message
  })

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })

    if (!res.ok) {
      console.error('[Auto-WA Error] Fetch failed:', await res.text())
    } else {
      console.log(`[Auto-WA Success] Dispatched automated greeting to ${cleanPhone}`)
    }
  } catch (err) {
    console.error('[Auto-WA Error] Network failure:', err)
  }
}
