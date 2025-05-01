import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User, Check, X, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import apiClient from '@/lib/api'

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  gameType: z.enum(["single", "double"]),
  participants: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email().optional(),
    isMember: z.boolean(),
    memberId: z.string().optional(),
  }))
  .min(1, "At least one participant is required")
  .max(4, "Maximum 4 participants allowed"),
  memberSearch: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Member {
  id: string
  name: string
  email: string
}

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
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [guestName, setGuestName] = useState("")
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameType: "single",
      participants: [],
      memberSearch: "",
    },
  })

  const { participants, gameType } = form.watch()

  useEffect(() => {
    if (open && user && participants.length === 0) {
      form.setValue('participants', [{
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        isMember: true,
        memberId: user.memberId,
      }])
    }
  }, [open, user, form, participants.length])

  const searchMembers = async (searchQuery: string) => {
    setIsSearching(true)
    try {
      const response = await apiClient.get('/api/members/search', {
        params: { query: searchQuery }
      })
      setSearchResults(response.data.filter((m: Member) => !participants.map(p => p.memberId).includes(m.id)))
    } catch (error) {
      console.error('Error searching members:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleBooking = async () => {
    if (!selectedMember || !startTime || !date || !courtId) return

    setIsLoading(true)
    try {
      const bookingDate = format(date, 'yyyy-MM-dd')
      await apiClient.post('/api/bookings', {
        courtId,
        startTime: `${bookingDate}T${startTime}`,
        endTime: `${bookingDate}T${endTime}`,
        type: gameType,
        participants: [
          ...participants,
          {
            id: selectedMember.id,
            name: selectedMember.name,
            email: selectedMember.email,
            isMember: true,
            memberId: selectedMember.id,
          }
        ]
      })
      onBookingComplete()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating booking:', error)
      toast({
        title: 'Error',
        description: 'Failed to create booking',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book {courtName}</DialogTitle>
          <DialogDescription>
            {format(date, 'EEEE, MMMM d, yyyy')} • {startTime} - {endTime}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleBooking)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Game Type</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="gameType"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        value={field.value}
                        onValueChange={(value: "single" | "double") => {
                          field.onChange(value)
                          if (value === "single" && participants.length > 2) {
                            form.setValue('participants', [participants[0]])
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
                <CardDescription>
                  {gameType === 'single' ? 'Add up to 2 players' : 'Add up to 4 players'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        {participant.email && (
                          <p className="text-sm text-muted-foreground">{participant.email}</p>
                        )}
                      </div>
                      <Badge variant={participant.isMember ? "default" : "secondary"}>
                        {participant.isMember ? "Member" : "Guest"}
                      </Badge>
                    </div>
                    {index !== 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          form.setValue(
                            'participants',
                            participants.filter((_, i) => i !== index)
                          )
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {((gameType === 'single' && participants.length < 2) ||
                  (gameType === 'double' && participants.length < 4)) && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="memberSearch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Add Member</FormLabel>
                          <Command className="rounded-md border">
                            <CommandInput
                              placeholder="Search members..."
                              value={field.value}
                              onValueChange={field.onChange}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {isSearching ? "Searching..." : "No members found"}
                              </CommandEmpty>
                              <CommandGroup>
                                {searchResults.map((member) => (
                                  <CommandItem
                                    key={member.id}
                                    onSelect={() => {
                                      form.setValue('participants', [
                                        ...participants,
                                        {
                                          id: member.id,
                                          name: member.name,
                                          email: member.email,
                                          isMember: true,
                                          memberId: member.id,
                                        }
                                      ])
                                      field.onChange("")
                                      setSelectedMember(member)
                                    }}
                                  >
                                    {member.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter guest name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          if (guestName.trim()) {
                            form.setValue('participants', [
                              ...participants,
                              {
                                name: guestName.trim(),
                                isMember: false,
                              }
                            ])
                            setGuestName("")
                          }
                        }}
                        disabled={!guestName}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Guest
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedMember || isLoading}>
                {isLoading ? "Booking..." : "Book Court"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 