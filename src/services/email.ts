import nodemailer from 'nodemailer'

// Create a test account
const testAccount = await nodemailer.createTestAccount()

const APP_NAME = process.env.APP_NAME || 'Tennis Club'
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false
  }
})

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP Configuration Error:', error)
  } else {
    console.log('SMTP Server is ready to send emails')
  }
})

export async function sendMemberInvitation(email: string, name: string, token: string) {
  const invitationUrl = `${APP_URL}/accept-invitation?token=${token}`
  
  const info = await transporter.sendMail({
    from: `"${APP_NAME}" <${testAccount.user}>`,
    to: email,
    subject: `Invitation to join ${APP_NAME}`,
    html: `
      <h1>Welcome to ${APP_NAME}!</h1>
      <p>Hello ${name},</p>
      <p>You have been invited to join ${APP_NAME}. Click the link below to accept the invitation:</p>
      <p><a href="${invitationUrl}">Accept Invitation</a></p>
      <p>This invitation will expire in 7 days.</p>
      <p>If you did not request this invitation, please ignore this email.</p>
    `,
  })

  // Log the preview URL with more visibility
  const previewUrl = nodemailer.getTestMessageUrl(info)
  console.log('\n📧 Email sent successfully!')
  console.log('📧 To:', email)
  console.log('📧 Preview URL:', previewUrl)
  console.log('📧 You can view the email at:', previewUrl)
  console.log('📧 Or check your Ethereal inbox at: https://ethereal.email/\n')
}

export async function sendVerificationCode(email: string, code: string) {
  const info = await transporter.sendMail({
    from: `"${APP_NAME}" <${testAccount.user}>`,
    to: email,
    subject: `Your ${APP_NAME} Verification Code`,
    html: `
      <h1>Email Verification</h1>
      <p>Your verification code is:</p>
      <h2 style="font-size: 24px; letter-spacing: 5px; margin: 20px 0;">${code}</h2>
      <p>This code will expire in 15 minutes.</p>
      <p>If you did not request this verification code, please ignore this email.</p>
    `,
  })

  // Log the preview URL
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
}

export async function sendInvite(email: string, name: string, token: string) {
  const invitationUrl = `${APP_URL}/accept-invitation?token=${token}`
  
  const info = await transporter.sendMail({
    from: `"${APP_NAME}" <${testAccount.user}>`,
    to: email,
    subject: `You've been invited to ${APP_NAME}`,
    html: `
      <h1>Welcome to ${APP_NAME}!</h1>
      <p>Hello ${name},</p>
      <p>An administrator has invited you to join ${APP_NAME}. Click the link below to accept the invitation:</p>
      <p><a href="${invitationUrl}">Accept Invitation</a></p>
      <p>This invitation will expire in 7 days.</p>
      <p>If you did not request this invitation, please ignore this email.</p>
    `,
  })

  // Log the preview URL with more visibility
  const previewUrl = nodemailer.getTestMessageUrl(info)
  console.log('\n📧 Email sent successfully!')
  console.log('📧 To:', email)
  console.log('📧 Preview URL:', previewUrl)
  console.log('📧 You can view the email at:', previewUrl)
  console.log('📧 Or check your Ethereal inbox at: https://ethereal.email/\n')
}

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password. Please use the following 6-digit code to verify your identity:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
          ${token}
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          For security reasons, this code can only be used once and will expire after 15 minutes.
        </p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
} 