// ─────────────────────────────────────────────────────────────────
// Notification service for Deshmukh Travels
// Handles: Email (Nodemailer) + WhatsApp (Twilio)
//
// WhatsApp STATUS: Production-ready, disabled on trial accounts
// To enable WhatsApp:
//   1. Upgrade Twilio account OR use AiSensy/Wati (free, India-friendly)
//   2. Create a Content Template in Twilio Console → Messaging → Templates
//   3. Add TWILIO_CONTENT_SID=HXxxxxxxxx to server/.env
//   4. Uncomment the sendWhatsAppNotification call in routes/bookings.js
// ─────────────────────────────────────────────────────────────────

const nodemailer = require('nodemailer');
const twilio = require('twilio');

// ── Create transporter — reused across all email calls ────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── Twilio client — WhatsApp Business API ────────────────────────
// Requires in server/.env:
//   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
//   TWILIO_CONTENT_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ← needed for outbound messages
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ── Send booking notification to cab owner ────────────────────
const sendBookingNotification = async ({ ownerEmail, ownerName, customerName, booking, cabName }) => {
  const mailOptions = {
    from:    `"Deshmukh Travels" <${process.env.GMAIL_USER}>`,
    to:      ownerEmail,
    subject: `New Booking Request — ${cabName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1D9E75;">New Booking Request</h2>
        <p>Hi ${ownerName},</p>
        <p>You have a new booking request for your cab <strong>${cabName}</strong>.</p>

        <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #888; padding: 6px 0;">Customer</td>
              <td><strong>${customerName}</strong></td>
            </tr>
            <tr>
              <td style="color: #888; padding: 6px 0;">From</td>
              <td>${booking.fromLocation}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 6px 0;">To</td>
              <td>${booking.toLocation}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 6px 0;">Journey Date</td>
              <td>${new Date(booking.journeyDate).toDateString()}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 6px 0;">Return Date</td>
              <td>${new Date(booking.returnDate).toDateString()}</td>
            </tr>
            ${booking.totalPrice ? `
            <tr>
              <td style="color: #888; padding: 6px 0;">Total Price</td>
              <td><strong>₹${booking.totalPrice}</strong></td>
            </tr>` : ''}
          </table>
        </div>

        <p style="color: #555; font-size: 14px;">
          Log in to your dashboard to confirm or reject this booking.
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 32px;">
          — Deshmukh Travels
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ── sendWhatsAppNotification — WhatsApp to cab owner ─────────────
// STATUS: Disabled on Twilio trial accounts
//         Trial accounts block outbound WhatsApp notifications (Twilio policy, 2024)
//
// PRODUCTION SETUP:
//   Option A — Upgrade Twilio:
//     1. Add funds to Twilio account ($20 minimum)
//     2. Go to Console → Messaging → Content Template Builder
//     3. Create template with variables:
//        {{1}} = cabName, {{2}} = customerName,
//        {{3}} = fromLocation, {{4}} = toLocation,
//        {{5}} = journeyDate, {{6}} = returnDate
//     4. Copy the Content SID (HXxxxxxxxxx)
//     5. Add TWILIO_CONTENT_SID to server/.env
//
//   Option B — AiSensy or Wati (free, India-friendly alternative):
//     1. Sign up at aisensy.com or wati.io
//     2. Connect WhatsApp Business account (2-3 day verification)
//     3. Replace twilioClient.messages.create with their SDK
//     4. Same function signature — only internals change
//
// To activate: uncomment the sendWhatsAppNotification call in routes/bookings.js

const sendWhatsAppNotification = async ({
  ownerPhone,
  customerName,
  booking,
  cabName,
}) => {
  // Guard — skip silently if Content SID not configured
  // Remove this guard once TWILIO_CONTENT_SID is set in .env
  if (!process.env.TWILIO_CONTENT_SID) {
    console.log('[WhatsApp] Skipped — TWILIO_CONTENT_SID not set in .env');
    console.log('[WhatsApp] See mailer.js comments for production setup instructions');
    return;
  }

  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to:   `whatsapp:${ownerPhone}`,

    // Content Template SID — created in Twilio Console → Messaging → Templates
    // Required for outbound WhatsApp messages (Twilio policy)
    contentSid: process.env.TWILIO_CONTENT_SID,

    // Variables map to {{1}}, {{2}} etc in your template
    contentVariables: JSON.stringify({
      '1': cabName,
      '2': customerName,
      '3': booking.fromLocation,
      '4': booking.toLocation,
      '5': new Date(booking.journeyDate).toDateString(),
      '6': new Date(booking.returnDate).toDateString(),
    }),
  });
};

module.exports = { sendBookingNotification, sendWhatsAppNotification };