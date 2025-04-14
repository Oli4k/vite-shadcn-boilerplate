import { useAuth } from '@/contexts/auth-context'
import { MemberForm } from '@/components/member-form'

export function CreateMember() {
  const { user } = useAuth()

  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create member')
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Create New Member</h1>
      <MemberForm onSubmit={handleSubmit} />
    </div>
  )
} 