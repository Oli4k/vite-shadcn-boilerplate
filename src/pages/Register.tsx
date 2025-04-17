import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export function Register() {
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)

    try {
      await register(values.email, values.password, values.name)
      toast.success('Account created successfully')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 h-full flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="p-3">
          <CardTitle className="text-base">Create an account</CardTitle>
          <CardDescription className="text-xs">Enter your details to register</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        autoComplete="name"
                        className="text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        autoComplete="new-password"
                        className="text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-sm" disabled={loading}>
                {loading ? 'Creating Account...' : 'Register'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="p-3 flex justify-center">
          <p className="text-xs text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 