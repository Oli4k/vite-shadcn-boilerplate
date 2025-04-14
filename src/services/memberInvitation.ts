import { prisma } from '../lib/prisma'
import { sendMemberInvitation } from './email'
import { v4 as uuidv4 } from 'uuid'

export async function createMemberInvitation(email: string, name: string) {
  // Generate a unique invitation token
  const invitationToken = uuidv4()
  
  // Create the invitation record
  const invitation = await prisma.memberInvitation.create({
    data: {
      email,
      name,
      token: invitationToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  })

  // Send the invitation email
  await sendMemberInvitation(email, name, invitationToken)

  return invitation
}

export async function validateInvitationToken(token: string) {
  const invitation = await prisma.memberInvitation.findFirst({
    where: {
      token,
      expiresAt: {
        gt: new Date(),
      },
      used: false,
    },
  })

  if (!invitation) {
    throw new Error('Invalid or expired invitation token')
  }

  return invitation
}

export async function markInvitationAsUsed(token: string) {
  await prisma.memberInvitation.update({
    where: { token },
    data: { used: true },
  })
} 