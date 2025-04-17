import { ReactNode } from 'react'
import { usePageHeader } from '@/contexts/page-header-context'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const { actions: contextActions } = usePageHeader()
  const finalActions = actions || contextActions

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {finalActions && <div className="flex items-center gap-2">{finalActions}</div>}
    </div>
  )
} 