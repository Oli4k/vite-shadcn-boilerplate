import { useState } from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'

const bookingFormSchema = z.object({
  notes: z.string().optional(),
  // Add more fields here as needed for future features
  // paymentMethod: z.string(),
  // specialRequests: z.string(),
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

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      notes: '',
    },
  })

  const onSubmit = async (data: BookingFormValues) => {
    try {
      setIsSubmitting(true)
      await api.post('/bookings', {
        courtId,
        startTime,
        endTime,
        date: format(date, 'yyyy-MM-dd'),
        notes: data.notes,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Booking</DialogTitle>
          <DialogDescription>
            Review your booking details before confirming.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Booking Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>Court:</div>
              <div className="font-medium">{courtName}</div>
              <div>Date:</div>
              <div className="font-medium">{format(date, 'PPP')}</div>
              <div>Time:</div>
              <div className="font-medium">{startTime} - {endTime}</div>
              <div>Price:</div>
              <div className="font-medium">${price}</div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any special requests or notes..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
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