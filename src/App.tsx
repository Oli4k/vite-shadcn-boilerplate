import { AppRoutes } from './routes'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <AppRoutes />
      <Toaster />
    </ThemeProvider>
  )
}
