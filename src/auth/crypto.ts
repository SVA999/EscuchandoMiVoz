const PASSWORD_ALGORITHM = 'PBKDF2-HMAC-SHA-256'
const PASSWORD_ITERATIONS = 100_000
const PASSWORD_LENGTH_BITS = 256
const PASSWORD_SALT_BYTES = 16

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    PASSWORD_LENGTH_BITS,
  )
  return new Uint8Array(bits)
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_BYTES))
  const hash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS)
  return {
    hash: encodeBase64Url(hash),
    salt: encodeBase64Url(salt),
    algorithm: PASSWORD_ALGORITHM,
    parameters: JSON.stringify({
      iterations: PASSWORD_ITERATIONS,
      lengthBits: PASSWORD_LENGTH_BITS,
    }),
  }
}

export async function verifyPassword(
  password: string,
  stored: { hash: string; salt: string; algorithm: string; parameters: string },
): Promise<boolean> {
  if (stored.algorithm !== PASSWORD_ALGORITHM) return false
  const parameters = JSON.parse(stored.parameters) as { iterations: number; lengthBits: number }
  if (parameters.lengthBits !== PASSWORD_LENGTH_BITS) return false
  const derived = await derivePasswordHash(
    password,
    decodeBase64Url(stored.salt),
    parameters.iterations,
  )
  return constantTimeEqual(derived, decodeBase64Url(stored.hash))
}

export function randomToken(bytes = 32): string {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(bytes)))
}

export async function sha256(value: string): Promise<string> {
  return encodeBase64Url(
    await crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(value))
      .then((hash) => new Uint8Array(hash)),
  )
}

export const passwordPolicy = {
  minimumLength: 6,
  algorithm: PASSWORD_ALGORITHM,
  iterations: PASSWORD_ITERATIONS,
}
