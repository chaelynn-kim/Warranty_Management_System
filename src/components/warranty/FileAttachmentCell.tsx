import { useRef, useState } from 'react'
import { Paperclip, X } from 'lucide-react'
import {
  downloadFileAttachment,
  filesToAttachments,
  formatFileSize,
  mergeFileAttachments,
  parseFileAttachments,
  removeFileAttachment,
} from '../../utils/warrantyAttachments'

interface FileAttachmentCellProps {
  value: string
  editing: boolean
  onChange: (value: string) => void
}

export function FileAttachmentCell({ value, editing, onChange }: FileAttachmentCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const files = parseFileAttachments(value)

  const handlePickFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    setError('')
    const { attachments, errors: readErrors } = await filesToAttachments(fileList)
    const { value: nextValue, errors: mergeErrors } = mergeFileAttachments(value, attachments)
    const errors = [...readErrors, ...mergeErrors]

    if (nextValue !== value) {
      onChange(nextValue)
    }
    if (errors.length > 0) {
      setError(errors[0])
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleRemove = (fileId: string) => {
    setError('')
    onChange(removeFileAttachment(value, fileId))
  }

  if (!editing) {
    if (files.length === 0) {
      return <div className="px-2 py-2 text-xs text-text-muted sm:text-sm">-</div>
    }

    return (
      <ul className="space-y-1 px-1 py-1">
        {files.map((file) => (
          <li key={file.id}>
            <button
              type="button"
              onClick={() => downloadFileAttachment(file)}
              className="flex w-full items-start gap-1 rounded px-1 py-0.5 text-left text-xs text-accent transition-colors hover:bg-accent/10 hover:underline sm:text-sm"
              title={`${file.name} (${formatFileSize(file.size)})`}
            >
              <Paperclip className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="break-all">{file.name}</span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="min-w-[140px] space-y-1 px-1 py-1">
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-start gap-1 rounded border border-border/60 bg-bg-primary/40 px-1.5 py-1"
            >
              <Paperclip className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
              <div className="min-w-0 flex-1">
                <p className="break-all text-xs leading-snug text-text-primary" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[10px] text-text-muted">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(file.id)}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-red-500/15 hover:text-red-400"
                aria-label={`${file.name} 삭제`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => void handlePickFiles(e.target.files)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-7 w-full items-center justify-center gap-1 rounded border border-dashed border-border bg-bg-primary/50 px-2 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
      >
        <Paperclip className="h-3.5 w-3.5" />
        파일 추가
      </button>

      {error && <p className="text-[10px] leading-snug text-red-400">{error}</p>}
    </div>
  )
}
