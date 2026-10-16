import { hash, verify } from '@node-rs/argon2'
import { randomBytes } from 'node:crypto'

export const hashPassword = (password: string) => hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 })
export const verifyPassword = (encoded: string, password: string) => verify(encoded, password)
let dummyHash: Promise<string> | undefined
export const dummyPasswordHash = () => dummyHash ??= hashPassword(randomBytes(32).toString('hex'))
