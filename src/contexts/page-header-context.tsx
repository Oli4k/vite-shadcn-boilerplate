import { createContext, useContext, ReactNode, useState } from 'react'

interface PageHeaderContextValue {
  actions: ReactNode | null
  setActions: (actions: ReactNode | null) => void
}

const PageHeaderContext = createContext<PageHeaderContextValue | undefined>(undefined)

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode | null>(null)

  return (
    <PageHeaderContext.Provider value={{ actions, setActions }}>
      {children}
    </PageHeaderContext.Provider>
  )
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext)
  if (context === undefined) {
    throw new Error('usePageHeader must be used within a PageHeaderProvider')
  }
  return context
} 