/**
 * 보증연한 등 민감 저장 데이터용 AES-GCM 암호화 (Web Crypto).
 * 키는 환경변수 또는 임베디드 시크릿에서 PBKDF2로 유도합니다.
 */

import { EMBEDDED_WARRANTY_PERIOD_ENCRYPTION_SECRET } from '../lib/warrantyPeriodCrypto.embedded'

export const ENCRYPTED_BLOB_MARKER = 'aes-gcm-v1' as const

export interface EncryptedBlob {
  __enc: typeof ENCRYPTED_BLOB_MARKER
  iv: string
  ciphertext: string
}

const PBKDF2_ITERATIONS = 120_000
const PBKDF2_SALT = new TextEncoder().encode('seah-warranty-period-aes-gcm-v1')

let cachedCryptoKey: CryptoKey | null = null

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function resolvePassphrase(): string {
  const fromEnv = (import.meta.env.VITE_WARRANTY_PERIOD_ENCRYPTION_KEY as string | undefined)?.trim()
  if (fromEnv) return fromEnv
  return EMBEDDED_WARRANTY_PERIOD_ENCRYPTION_SECRET
}

async function getAesKey(): Promise<CryptoKey> {
  if (cachedCryptoKey) return cachedCryptoKey

  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(resolvePassphrase()),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  cachedCryptoKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: PBKDF2_SALT,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )

  return cachedCryptoKey
}

export function isEncryptedBlob(value: unknown): value is EncryptedBlob {
  if (!value || typeof value !== 'object') return false
  const blob = value as EncryptedBlob
  return (
    blob.__enc === ENCRYPTED_BLOB_MARKER &&
    typeof blob.iv === 'string' &&
    typeof blob.ciphertext === 'string' &&
    blob.iv.length > 0 &&
    blob.ciphertext.length > 0
  )
}

export async function encryptJsonPayload(payload: unknown): Promise<EncryptedBlob> {
  const key = await getAesKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(payload))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return {
    __enc: ENCRYPTED_BLOB_MARKER,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  }
}

export async function decryptJsonPayload<T = unknown>(blob: EncryptedBlob): Promise<T> {
  const key = await getAesKey()
  const iv = base64ToBytes(blob.iv)
  const ciphertext = base64ToBytes(blob.ciphertext)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  )
  return JSON.parse(new TextDecoder().decode(decrypted)) as T
}
