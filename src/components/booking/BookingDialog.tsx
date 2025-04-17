import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User, Mail, Plus, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'

interface Member {
  id: string
  name: string
  email: string
}

const bookingFormSchema = z.object({
  participants: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    email: z.string().email().optional(),
    isMember: z.boolean(),
  })).min(1, "At least one participant is required").max(4, "Maximum 4 participants allowed"),
  participantType: z.enum(["single", "double"]),
})

type BookingFormValues = z.infer<typeof bookingFormSchema>

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courtId: string
  courtName: string
  startTime: string
  endTime: string
  date: Date
  price: number
  onBookingComplete: () => void
}

export function BookingDialog({
  open,
  onOpenChange,
  courtId,
  courtName,
  startTime,
  endTime,
  date,
  price,
  onBookingComplete,
}: BookingDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      participants: [],
      participantType: "single",
    },
  })

  // Track form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      setHasUnsavedChanges(true)
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Handle dialog close with unsaved changes
  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close the form?')) {
        onOpenChange(false)
        setHasUnsavedChanges(false)
      }
    } else {
      onOpenChange(open)
    }
  }

  useEffect(() => {
    const searchMembers = async () => {
      if (searchQuery.length < 2) {
        setMembers([])
        setShowResults(false)
        return
      }

      setIsSearching(true)
      setShowResults(true)
      
      try {
        const response = await api.get('/members/search', {
          params: { query: searchQuery }
        })
        setMembers(response.data)
      } catch (error) {
        console.error('Failed to search members:', error)
        toast({
          title: 'Error',
          description: 'Failed to search members. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchMembers, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, toast])

  const onSubmit = async (data: BookingFormValues) => {
    try {
      setIsSubmitting(true)
      await api.post('/bookings', {
        courtId,
        startTime,
        endTime,
        date: format(date, 'yyyy-MM-dd'),
        participants: data.participants,
        participantType: data.participantType,
      })
      
      toast({
        title: 'Booking Confirmed',
        description: `Your booking for ${courtName} has been confirmed.`,
      })
      
      onBookingComplete()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create booking. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addParticipant = (participant: { id?: string; name: string; email?: string; isMember: boolean }) => {
    const currentParticipants = form.getValues('participants')
    if (currentParticipants.length >= 4) {
      toast({
        title: 'Maximum participants reached',
        description: 'You can only add up to 4 participants.',
        variant: 'destructive',
      })
      return
    }

    form.setValue('participants', [...currentParticipants, {
      ...participant,
      isMember: Boolean(participant.id)
    }])
    
    // Switch to doubles if 3 or more participants
    if (currentParticipants.length >= 2) {
      form.setValue('participantType', 'double')
    }

    setSearchQuery('')
    setNewEmail('')
    setShowEmailInput(false)
  }

  const removeParticipant = (index: number) => {
    const currentParticipants = form.getValues('participants')
    form.setValue('participants', currentParticipants.filter((_, i) => i !== index))
    
    // Switch back to singles if less than 3 participants
    if (currentParticipants.length <= 2) {
      form.setValue('participantType', 'single')
    }
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newEmail.trim()) {
      addParticipant({
        name: newEmail.split('@')[0],
        email: newEmail.trim(),
        isMember: false,
      })
      setNewEmail('')
    }
  }

  const isFormValid = form.getValues('participants').length > 0

  // Debug form state
  useEffect(() => {
    console.log('Form state:', {
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      values: form.getValues(),
      participants: form.getValues('participants'),
      participantType: form.getValues('participantType')
    })
  }, [form.formState, form.getValues()])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Booking</DialogTitle>
          <DialogDescription>
            Review your booking details and add participants.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Booking Details</h4>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <div className="text-muted-foreground">Court:</div>
              <div className="font-medium text-right">{courtName}</div>
              <div className="text-muted-foreground">Date:</div>
              <div className="font-medium text-right">{format(date, 'PPP')}</div>
              <div className="text-muted-foreground">Time:</div>
              <div className="font-medium text-right">{startTime} - {endTime}</div>
              <div className="text-muted-foreground">Price:</div>
              <div className="font-medium text-right">${price}</div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="participantType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={form.getValues('participants').length >= 3}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select game type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">Singles</SelectItem>
                        <SelectItem value="double">Doubles</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participants</FormLabel>
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Add Club Member</span>
                          </div>
                          <div className="relative">
                            <div className="rounded-lg border">
                              <Input
                                placeholder="Search members by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 border-none shadow-none"
                              />
                              {showResults && (
                                <div className="absolute top-[2.25rem] w-full rounded-md border bg-popover shadow-md">
                                  {isSearching ? (
                                    <div className="p-2 text-sm text-muted-foreground">Searching...</div>
                                  ) : members.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground">No members found.</div>
                                  ) : (
                                    <div className="py-1">
                                      <div className="px-2 py-1.5 text-xs text-muted-foreground">Members</div>
                                      {members.map((member) => (
                                        <button
                                          key={member.id}
                                          onClick={() => {
                                            addParticipant({
                                              id: member.id,
                                              name: member.name,
                                              email: member.email,
                                              isMember: true,
                                            })
                                            setSearchQuery('')
                                            setShowResults(false)
                                          }}
                                          className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                        >
                                          <User className="h-4 w-4" />
                                          <div className="flex flex-col">
                                            <span className="font-medium">{member.name}</span>
                                            <span className="text-xs text-muted-foreground">{member.email}</span>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>Invite Guest Player</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 space-y-1">
                              <Input
                                type="email"
                                placeholder="Enter guest's email address"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="h-9"
                              />
                              <p className="text-xs text-muted-foreground">
                                The guest will receive a confirmation email with booking details
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="h-9"
                              disabled={!newEmail.trim()}
                              onClick={handleEmailSubmit}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Selected Participants</span>
                            <Badge variant="outline" className="ml-auto">
                              {form.getValues('participants').length}/4
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {field.value.map((participant, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between rounded-md border p-2"
                              >
                                <div className="flex items-center gap-2">
                                  {participant.isMember ? (
                                    <User className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium">{participant.name}</p>
                                    {participant.email && (
                                      <p className="text-xs text-muted-foreground">{participant.email}</p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 hover:bg-transparent"
                                  onClick={() => removeParticipant(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 