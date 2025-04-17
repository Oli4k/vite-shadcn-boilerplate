import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, parse } from 'date-fns'

export async function POST(req: Request) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the token
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { courtId, startTime, endTime, date, participants, participantType } = body

    // Validate required fields
    if (!courtId || !startTime || !endTime || !date || !participants || !participantType) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse dates
    const bookingDate = parse(date, 'yyyy-MM-dd', new Date())
    const startDateTime = new Date(`${date}T${startTime}`)
    const endDateTime = new Date(`${date}T${endTime}`)

    // Check if the court exists and is available
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        bookings: {
          where: {
            startTime: {
              lte: endDateTime,
            },
            endTime: {
              gte: startDateTime,
            },
            status: 'confirmed',
          },
        },
      },
    })

    if (!court) {
      return NextResponse.json(
        { message: 'Court not found' },
        { status: 404 }
      )
    }

    if (court.bookings.length > 0) {
      return NextResponse.json(
        { message: 'Court is already booked for this time slot' },
        { status: 409 }
      )
    }

    // Get the member making the booking
    const member = await prisma.member.findUnique({
      where: { userId: decoded.userId },
    })

    if (!member) {
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      )
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        courtId,
        memberId: member.id,
        startTime: startDateTime,
        endTime: endDateTime,
        status: 'confirmed',
      },
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Failed to create booking:', error)
    return NextResponse.json(
      { message: 'Failed to create booking' },
      { status: 500 }
    )
  }
} 