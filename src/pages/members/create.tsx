import { useAuth } from '@/contexts/auth-context'
import { MemberForm } from '@/components/member-form'

export function CreateMember() {
  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create member')
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Member</h1>
        <p className="text-muted-foreground">
          Fill in the details below to add a new member to the system.
        </p>
      </div>

      <div className="max-w-2xl">
        <MemberForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
} 