/**
 * Enterprise Feature (Phase 5): Automated WhatsApp Welcome
 * NOTE: This is an isolated skeleton ready for production execution.
 * To activate, simply supply your official Twilio or Meta WhatsApp Business API credentials.
 */
export async function triggerWelcomeWhatsApp(phone: string, name: string) {
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
