export interface Booking {
  id: number
  court: string
  member: string
  date: string
  time: string
  status: 'Confirmed' | 'Pending'
  type: 'Tennis' | 'Padel'
}

export async function getAllBookings(): Promise<Booking[]> {
  const response = await fetch('/api/bookings', {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch bookings')
  }
  return response.json()
}

export async function createBooking(data: Omit<Booking, 'id'>): Promise<Booking> {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create booking')
  }
  return response.json()
}

export async function updateBooking(id: number, data: Partial<Booking>): Promise<Booking> {
  const response = await fetch(`/api/bookings/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update booking')
  }
  return response.json()
}

export async function deleteBooking(id: number): Promise<void> {
  const response = await fetch(`/api/bookings/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to delete booking')
  }
}

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const response = await fetch(`/api/bookings?date=${date}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch bookings')
  }
  return response.json()
} 