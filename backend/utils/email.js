import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

export async function sendDeletionRequestEmail({ name, email, reason, additionalInfo }) {
  const supportEmail = process.env.SUPPORT_EMAIL || 'no.reply.echobit@gmail.com';
  const submittedAt = new Date().toUTCString();

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `Echobit <${process.env.EMAIL_USER}>`,
    to: supportEmail,
    replyTo: email,
    subject: `[Echobit] Account Deletion Request — ${email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #dc2626; margin: 0 0 4px;">Account Deletion Request</h2>
        <p style="color: #6b7280; margin: 0 0 24px; font-size: 14px;">A user has requested their Echobit account and all associated data to be deleted.</p>

        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280; width: 140px;">Full Name</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280;">Email (Google)</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #6b7280;">Reason</td>
              <td style="padding: 10px 0; color: #111827;">${reason}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Submitted At</td>
              <td style="padding: 10px 0; color: #111827;">${submittedAt}</td>
            </tr>
          </table>
        </div>

        ${additionalInfo ? `
        <div style="background: #fff7ed; border-radius: 12px; padding: 16px; border: 1px solid #fed7aa; margin-bottom: 16px;">
          <p style="color: #9a3412; font-size: 13px; font-weight: 600; margin: 0 0 6px;">Additional Information</p>
          <p style="color: #431407; font-size: 14px; margin: 0;">${additionalInfo}</p>
        </div>` : ''}

        <div style="background: #fef2f2; border-radius: 12px; padding: 16px; border: 1px solid #fecaca;">
          <p style="color: #991b1b; font-size: 13px; margin: 0;">
            <strong>Action required:</strong> Please delete this user's account, all recordings, transcripts, and associated data from the Echobit platform.
            Reply to this email to confirm deletion with the user.
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0; text-align: center;">
          Echobit — AI Meeting Companion &nbsp;·&nbsp; Developed by Devmorphix
        </p>
      </div>
    `,
  });

  // Confirmation email to the user
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `Echobit <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'We received your account deletion request — Echobit',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #059669; margin: 0 0 8px;">Request Received</h2>
        <p style="color: #374151; margin: 0 0 16px;">Hi ${name},</p>
        <p style="color: #374151; margin: 0 0 16px;">
          We've received your request to delete your Echobit account and all associated data.
          Our support team will process it within <strong>7 business days</strong> and send you a confirmation once done.
        </p>
        <p style="color: #374151; margin: 0 0 16px;">
          If you have any questions, reply to this email or contact us at
          <a href="mailto:no.reply.echobit@gmail.com" style="color: #059669;">no.reply.echobit@gmail.com</a>.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0; text-align: center;">
          Echobit — AI Meeting Companion &nbsp;·&nbsp; Developed by Devmorphix
        </p>
      </div>
    `,
  });
}

export async function sendOTPEmail(to, otp, purpose) {
  const isReset = purpose === 'reset';
  const subject = isReset ? 'Reset your Echobit password' : 'Verify your Echobit email';
  const heading = isReset ? 'Password Reset Code' : 'Email Verification Code';
  const body = isReset
    ? 'You requested to reset your password. Use the code below:'
    : 'Thanks for signing up! Use the code below to verify your email:';

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `Echobit <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #059669; margin: 0 0 8px;">${heading}</h2>
        <p style="color: #6b7280; margin: 0 0 24px;">${body}</p>
        <div style="background: white; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #e5e7eb;">
          <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #111827;">${otp}</span>
        </div>
        <p style="color: #9ca3af; font-size: 13px; margin: 20px 0 0; text-align: center;">
          This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
      </div>
    `,
  });
}
