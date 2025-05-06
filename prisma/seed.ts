import { PrismaClient, MembershipType, MemberStatus } from '@prisma/client'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

const prisma = new PrismaClient()

const firstNames = [
  'Jan', 'Emma', 'Pieter', 'Sanne', 'Rick', 'Noa', 'Lisa', 'Tom', 'Fleur', 'Daan',
  'Bram', 'Sophie', 'Lars', 'Mila', 'Tess', 'Luuk', 'Julia', 'Finn', 'Lotte', 'Jens'
]
const lastNames = [
  'Jansen', 'de Vries', 'Bakker', 'Visser', 'Smit', 'Mulder', 'de Jong', 'Meijer', 'Koning', 'Bos',
  'de Boer', 'Hendriks', 'van Dijk', 'van den Berg', 'van Leeuwen', 'van der Meer', 'van Dam', 'de Groot', 'van Vliet', 'van der Linden'
]
const membershipTypes: MembershipType[] = ['REGULAR', 'PREMIUM', 'VIP']

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateUniqueEmail(first: string, last: string, usedEmails: Set<string>) {
  let base = `${first.toLowerCase()}.${last.replace(/\s+/g, '').toLowerCase()}`
  let email = `${base}@example.com`
  let counter = 1
  while (usedEmails.has(email)) {
    email = `${base}${counter}@example.com`
    counter++
  }
  usedEmails.add(email)
  return email
}

async function main() {
  const usedEmails = new Set<string>()
  const numToCreate = 20 // Change this to create more/less

  for (let i = 0; i < numToCreate; i++) {
    const first = getRandom(firstNames)
    const last = getRandom(lastNames)
    const name = `${first} ${last}`
    const email = generateUniqueEmail(first, last, usedEmails)
    const password = 'password123'
    const membershipType = getRandom(membershipTypes)
    const status: MemberStatus = 'ACTIVE'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      console.log(`User ${email} already exists, skipping.`)
      continue
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'MEMBER',
        createdAt: new Date(),
        updatedAt: new Date(),
        Member_Member_userIdToUser: {
          create: {
            id: crypto.randomUUID(),
            name,
            email,
            membershipType,
            status,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    })
  }

  console.log('Seeding complete!')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    return prisma.$disconnect()
  }) 