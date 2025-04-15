import { Court, CreateCourtData, UpdateCourtData } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export async function getAllCourts(): Promise<Court[]> {
  try {
    const response = await fetch(`${API_URL}/courts`, {
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error('Failed to fetch courts')
    }
    return response.json()
  } catch (error) {
    console.error('Error fetching courts:', error)
    throw error
  }
}

export async function getCourtById(id: number): Promise<Court> {
  try {
    const response = await fetch(`${API_URL}/courts/${id}`, {
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error('Failed to fetch court')
    }
    return response.json()
  } catch (error) {
    console.error('Error fetching court:', error)
    throw error
  }
}

export async function createCourt(data: CreateCourtData): Promise<Court> {
  try {
    const response = await fetch(`${API_URL}/courts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create court')
    }
    return response.json()
  } catch (error) {
    console.error('Error creating court:', error)
    throw error
  }
}

export async function updateCourt(id: number, data: UpdateCourtData): Promise<Court> {
  try {
    const response = await fetch(`${API_URL}/courts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update court')
    }
    return response.json()
  } catch (error) {
    console.error('Error updating court:', error)
    throw error
  }
}

export async function deleteCourt(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/courts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete court')
    }
  } catch (error) {
    console.error('Error deleting court:', error)
    throw error
  }
}

export async function getCourtAvailability(date?: string): Promise<Court[]> {
  try {
    const url = new URL(`${API_URL}/courts/availability`)
    if (date) {
      url.searchParams.append('date', date)
    }
    const response = await fetch(url.toString(), {
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error('Failed to fetch court availability')
    }
    return response.json()
  } catch (error) {
    console.error('Error fetching court availability:', error)
    throw error
  }
} 