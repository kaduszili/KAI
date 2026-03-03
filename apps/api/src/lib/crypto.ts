import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Encrypts a plaintext string with AES-256-GCM.
 * Returns a colon-separated hex string: iv:authTag:ciphertext
 */
export function encrypt(text: string): string {
  const key    = getKey()
  const iv     = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag   = cipher.getAuthTag()

  return [iv, authTag, encrypted].map(b => b.toString('hex')).join(':')
}

/**
 * Decrypts a value previously encrypted with `encrypt()`.
 */
export function decrypt(stored: string): string {
  const [ivHex, tagHex, dataHex] = stored.split(':')
  if (!ivHex || !tagHex || !dataHex) throw new Error('Invalid encrypted value format')

  const key      = getKey()
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))

  return (
    decipher.update(Buffer.from(dataHex, 'hex')).toString('utf8') +
    decipher.final('utf8')
  )
}
