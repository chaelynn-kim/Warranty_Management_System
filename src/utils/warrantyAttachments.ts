import type { WarrantyFileAttachment } from '../types'

export const MAX_ATTACHMENT_COUNT = 10
export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024

function isValidAttachment(value: unknown): value is WarrantyFileAttachment {
  if (!value || typeof value !== 'object') return false
  const file = value as WarrantyFileAttachment
  return (
    typeof file.id === 'string' &&
    typeof file.name === 'string' &&
    typeof file.size === 'number' &&
    typeof file.type === 'string' &&
    typeof file.dataUrl === 'string' &&
    file.dataUrl.startsWith('data:')
  )
}

export function parseFileAttachments(raw: string): WarrantyFileAttachment[] {
  const trimmed = raw.trim()
  if (!trimmed) return []

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter(isValidAttachment)
      }
    } catch {
      return []
    }
  }

  return []
}

export function serializeFileAttachments(files: WarrantyFileAttachment[]): string {
  if (files.length === 0) return ''
  return JSON.stringify(files)
}

export function formatAttachmentNames(raw: string): string {
  const files = parseFileAttachments(raw)
  if (files.length === 0) {
    const legacy = raw.trim()
    return legacy.startsWith('[') ? '' : legacy
  }
  return files.map((file) => file.name).join(', ')
}

export function matchesAttachmentFilter(query: string, raw: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return formatAttachmentNames(raw).toLowerCase().includes(q)
}

export function removeFileAttachment(raw: string, fileId: string): string {
  const next = parseFileAttachments(raw).filter((file) => file.id !== fileId)
  return serializeFileAttachments(next)
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('파일을 읽을 수 없습니다.'))
    reader.readAsDataURL(file)
  })
}

export async function filesToAttachments(
  fileList: FileList | File[],
  maxSizeBytes = MAX_ATTACHMENT_SIZE_BYTES
): Promise<{ attachments: WarrantyFileAttachment[]; errors: string[] }> {
  const files = Array.from(fileList)
  const attachments: WarrantyFileAttachment[] = []
  const errors: string[] = []
  const maxLabel =
    maxSizeBytes >= 1024 * 1024
      ? `${Math.round(maxSizeBytes / (1024 * 1024))}MB`
      : `${Math.round(maxSizeBytes / 1024)}KB`

  for (const file of files) {
    if (file.size > maxSizeBytes) {
      errors.push(`${file.name}: 파일 크기는 ${maxLabel} 이하여야 합니다.`)
      continue
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      attachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl,
      })
    } catch {
      errors.push(`${file.name}: 파일을 읽을 수 없습니다.`)
    }
  }

  return { attachments, errors }
}

export function mergeFileAttachments(
  raw: string,
  incoming: WarrantyFileAttachment[]
): { value: string; errors: string[] } {
  const existing = parseFileAttachments(raw)
  const errors: string[] = []
  const room = MAX_ATTACHMENT_COUNT - existing.length

  if (room <= 0) {
    return {
      value: raw,
      errors: [`파일은 최대 ${MAX_ATTACHMENT_COUNT}개까지 첨부할 수 있습니다.`],
    }
  }

  const accepted = incoming.slice(0, room)
  if (incoming.length > room) {
    errors.push(`파일은 최대 ${MAX_ATTACHMENT_COUNT}개까지 첨부할 수 있습니다.`)
  }

  return {
    value: serializeFileAttachments([...existing, ...accepted]),
    errors,
  }
}

export function downloadFileAttachment(file: WarrantyFileAttachment): void {
  const link = document.createElement('a')
  link.href = file.dataUrl
  link.download = file.name
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
