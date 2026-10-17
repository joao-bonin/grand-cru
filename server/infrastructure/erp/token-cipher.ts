import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import type { ErpTokens } from '../../application/erp/session-contracts'

type TokenPair = Pick<ErpTokens, 'accessToken' | 'refreshToken'>
export interface TokenCipher {
  encrypt: (tokens: TokenPair, identity: string) => string
  decrypt: (value: string, identity: string) => TokenPair
}

function validPair(value: unknown): value is TokenPair {
  if (!value || typeof value !== 'object') return false
  const pair = value as TokenPair
  return typeof pair.accessToken === 'string' && !!pair.accessToken.trim()
    && typeof pair.refreshToken === 'string' && !!pair.refreshToken.trim()
}

export function createTokenCipher(base64Key: string): TokenCipher {
  if (typeof base64Key !== 'string') throw new Error('ERP_TOKEN_KEY_INVALID')
  const key = Buffer.from(base64Key, 'base64')
  if (key.length !== 32 || key.toString('base64') !== base64Key) throw new Error('ERP_TOKEN_KEY_INVALID')
  return {
    encrypt(tokens, identity) {
      try {
        if (!validPair(tokens) || !identity) throw new Error()
        const nonce = randomBytes(12)
        const cipher = createCipheriv('aes-256-gcm', key, nonce)
        cipher.setAAD(Buffer.from(identity, 'utf8'))
        const ciphertext = Buffer.concat([cipher.update(JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }), 'utf8'), cipher.final()])
        return ['v1', nonce.toString('base64'), cipher.getAuthTag().toString('base64'), ciphertext.toString('base64')].join('.')
      } catch { throw new Error('ERP_TOKEN_ENCRYPTION_FAILED') }
    },
    decrypt(value, identity) {
      try {
        const [version, nonceText, tagText, ciphertextText, extra] = value.split('.')
        if (version !== 'v1' || !nonceText || !tagText || !ciphertextText || extra !== undefined || !identity) throw new Error()
        const parts = [nonceText, tagText, ciphertextText].map(text => {
          const bytes = Buffer.from(text, 'base64')
          if (bytes.toString('base64') !== text) throw new Error()
          return bytes
        })
        const [nonce, tag, ciphertext] = parts as [Buffer, Buffer, Buffer]
        if (nonce.length !== 12 || tag.length !== 16) throw new Error()
        const decipher = createDecipheriv('aes-256-gcm', key, nonce)
        decipher.setAAD(Buffer.from(identity, 'utf8'))
        decipher.setAuthTag(tag)
        const tokens: unknown = JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8'))
        if (!validPair(tokens)) throw new Error()
        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
      } catch { throw new Error('ERP_TOKEN_DECRYPTION_FAILED') }
    },
  }
}
