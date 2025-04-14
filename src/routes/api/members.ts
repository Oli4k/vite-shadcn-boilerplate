import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '@/middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Get all members
router.get('/', authenticateToken, async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      include: {
        managedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    res.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    res.status(500).json({ error: 'Failed to fetch members' })
  }
})

// Create a new member
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, membershipType, status, notes } = req.body

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' })
    }

    const member = await prisma.member.create({
      data: {
        name,
        email,
        phone,
        address,
        membershipType,
        status,
        notes,
        managedById: req.user?.id, // Set the current user as the manager
      },
      include: {
        managedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    res.status(201).json(member)
  } catch (error) {
    console.error('Error creating member:', error)
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' })
    } else {
      res.status(500).json({ error: 'Failed to create member' })
    }
  }
})

export default router 