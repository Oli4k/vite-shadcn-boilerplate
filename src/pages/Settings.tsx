import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"

export function Settings() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the appearance of the app. Choose between light and dark mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="theme" className="text-sm font-medium leading-none">
              Theme
            </label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            View and update your account settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none">
              Email
            </label>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none">
              Name
            </label>
            <p className="text-sm text-muted-foreground">{user?.name || 'Not set'}</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none">
              Role
            </label>
            <p className="text-sm text-muted-foreground capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full sm:w-auto">
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose what notifications you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">
              Notification settings coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 