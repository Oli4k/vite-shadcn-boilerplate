import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Delete existing data
  await prisma.member.deleteMany()
  await prisma.user.deleteMany()
  console.log('Deleted existing data')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })
  
  console.log('Created admin user:', admin)

  // Create test members
  const members = await Promise.all([
    prisma.member.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        membershipType: 'REGULAR',
        status: 'ACTIVE',
        managedById: admin.id
      }
    }),
    prisma.member.create({
      data: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1987654321',
        address: '456 Oak Ave',
        membershipType: 'PREMIUM',
        status: 'PENDING',
        managedById: admin.id
      }
    }),
    prisma.member.create({
      data: {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+1122334455',
        address: '789 Pine Rd',
        membershipType: 'VIP',
        status: 'ACTIVE',
        managedById: admin.id
      }
    })
  ])

  console.log('Created test members:', members)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 