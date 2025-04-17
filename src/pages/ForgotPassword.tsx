import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset code')
      }

      toast.success('If an account exists with this email, you will receive a reset code')
      navigate(`/reset-password?email=${encodeURIComponent(values.email)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 h-full flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="p-3">
          <CardTitle className="text-base">Reset your password</CardTitle>
          <CardDescription className="text-xs">
            Enter your email address and we'll send you a code to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john@example.com"
                        {...field}
                        autoComplete="email"
                        className="text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-sm" disabled={loading}>
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="p-3 flex justify-center">
          <p className="text-xs text-gray-600">
            Remember your password?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 