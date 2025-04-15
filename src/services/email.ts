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

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset Request</h1>
      <p>You have requested to reset your password for ${APP_NAME}. Use the following token to reset your password:</p>
      <h2 style="font-size: 24px; letter-spacing: 5px; margin: 20px 0;">${token}</h2>
      <p>Or click this link to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This token will expire in 15 minutes.</p>
      <p>If you did not request this password reset, please ignore this email.</p>
    `,
  }

  try {
    console.log('Attempting to send email to:', email)
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: email,
      response: info.response
    })
  } catch (error) {
    console.error('Error sending password reset email:', error)
    if (error instanceof Error) {
      console.error('Email error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    throw new Error('Failed to send password reset email')
  }
} 