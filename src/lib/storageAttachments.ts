import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import type { WarrantyFileAttachment } from '../types'
import { isStorageEnabled, storage } from './firebase'

export type RequestAttachmentSlot =
  | 'company-ko'
  | 'company-en'
  | 'supplier-ko'
  | 'supplier-en'

export const REQUEST_MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024

function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim() || 'file'
  return trimmed.replace(/[^\w.\-()가-힣]/g, '_')
}

export function buildRequestAttachmentPath(
  recordId: string,
  slot: RequestAttachmentSlot,
  fileId: string,
  fileName: string
): string {
  return `warranty-attachments/requests/${recordId}/${slot}/${fileId}-${sanitizeFileName(fileName)}`
}

function assertStorageReady(): void {
  if (!isStorageEnabled || !storage) {
    throw new Error('Firebase Storage가 설정되지 않았습니다.')
  }
}

export async function uploadRequestAttachmentFile(
  file: File,
  recordId: string,
  slot: RequestAttachmentSlot,
  options?: { fileId?: string }
): Promise<WarrantyFileAttachment> {
  assertStorageReady()

  const id = options?.fileId ?? crypto.randomUUID()
  const storagePath = buildRequestAttachmentPath(recordId, slot, id, file.name)
  const storageRef = ref(storage!, storagePath)

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
  })

  return {
    id,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    storagePath,
  }
}

export async function getAttachmentDownloadUrl(storagePath: string): Promise<string> {
  assertStorageReady()
  return getDownloadURL(ref(storage!, storagePath))
}

export async function deleteStorageAttachment(storagePath: string | undefined): Promise<void> {
  if (!storagePath || !isStorageEnabled || !storage) return

  try {
    await deleteObject(ref(storage, storagePath))
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code !== 'storage/object-not-found') {
      console.warn('[Storage] 첨부 파일 삭제 실패', storagePath, error)
    }
  }
}

export async function migrateDataUrlToStorage(
  file: WarrantyFileAttachment,
  recordId: string,
  slot: RequestAttachmentSlot
): Promise<WarrantyFileAttachment> {
  if (file.storagePath) {
    const { dataUrl: _removed, ...rest } = file
    return rest
  }

  if (!file.dataUrl?.startsWith('data:')) {
    return file
  }

  const response = await fetch(file.dataUrl)
  const blob = await response.blob()
  const uploadFile = new File([blob], file.name, {
    type: file.type || blob.type || 'application/octet-stream',
  })

  return uploadRequestAttachmentFile(uploadFile, recordId, slot, { fileId: file.id })
}

export async function uploadRequestAttachmentFiles(
  fileList: FileList | File[],
  recordId: string,
  slot: RequestAttachmentSlot,
  maxSizeBytes = REQUEST_MAX_ATTACHMENT_BYTES
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
      const attachment = await uploadRequestAttachmentFile(file, recordId, slot)
      attachments.push(attachment)
    } catch {
      errors.push(`${file.name}: 파일 업로드에 실패했습니다.`)
    }
  }

  return { attachments, errors }
}
