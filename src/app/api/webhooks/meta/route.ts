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
