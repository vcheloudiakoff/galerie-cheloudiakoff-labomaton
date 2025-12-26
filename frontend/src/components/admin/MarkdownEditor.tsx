import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  label?: string
}

export function MarkdownEditor({
  value,
  onChange,
  rows = 8,
  placeholder,
  label,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b bg-muted/50">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              mode === 'edit'
                ? 'bg-background text-foreground border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Editer
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              mode === 'preview'
                ? 'bg-background text-foreground border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Apercu
          </button>
        </div>

        {mode === 'edit' ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        ) : (
          <div
            className="p-4 min-h-[200px] prose prose-sm max-w-none dark:prose-invert"
            style={{ minHeight: `${rows * 1.5 + 2}rem` }}
          >
            {value ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">Aucun contenu</p>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Supporte le format Markdown: **gras**, *italique*, [lien](url), # titre, etc.
      </p>
    </div>
  )
}
