import { Resend } from 'resend'

export async function sendBookingConfirmationEmail(params: {
  to: string
  studentName: string
  hostelName: string
  roomLabel: string
  amountNaira: number
  reference: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email')
    return
  }

  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    from: process.env.BOOKING_EMAIL_FROM || 'HostelHub <onboarding@resend.dev>',
    to: params.to,
    subject: 'Your HostelHub booking is confirmed 🎉',
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>Booking Confirmed</h2>
        <p>Hi ${params.studentName},</p>
        <p>Your payment was successful and your booking is now <strong>CONFIRMED</strong>.</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 12px 4px 0;">Hostel</td><td>${params.hostelName}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;">Room</td><td>${params.roomLabel}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;">Amount Paid</td><td>₦${params.amountNaira.toLocaleString()}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;">Reference</td><td>${params.reference}</td></tr>
        </table>
        <p>See you soon!</p>
      </div>
    `,
  })

  if (error) {
    console.error('Failed to send confirmation email:', error)
  } else {
    console.log('Confirmation email sent:', data?.id)
  }
}