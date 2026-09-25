import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash, pbkdf2Sync, randomBytes, randomUUID } from 'node:crypto'
import { createInterface } from 'node:readline/promises'

const execFile = promisify(execFileCallback)
const database = 'db-escuchando-mivoz'
const username = 'ministerio-alabanza'
const algorithm = 'PBKDF2-HMAC-SHA-256'
const iterations = 100_000

function encode(bytes: Buffer) {
  return bytes.toString('base64url')
}

function sql(value: string | number | null) {
  if (value === null) return 'NULL'
  if (typeof value === 'number') return String(value)
  return `'${value.replaceAll("'", "''")}'`
}

function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256')
  return {
    hash: encode(hash),
    salt: encode(salt),
    parameters: JSON.stringify({ iterations, lengthBits: 256 }),
  }
}

async function promptHidden(label: string) {
  process.stdout.write(label)
  const input = process.stdin
  if (!input.isTTY || !input.setRawMode)
    throw new Error('La contraseña debe introducirse desde una terminal interactiva.')
  input.setRawMode(true)
  input.resume()
  let value = ''
  return new Promise<string>((resolve, reject) => {
    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString()) {
        if (character === '\r' || character === '\n') {
          input.setRawMode?.(false)
          input.pause()
          input.off('data', onData)
          process.stdout.write('\n')
          resolve(value)
        } else if (character === '\u0003') {
          input.setRawMode?.(false)
          input.pause()
          input.off('data', onData)
          reject(new Error('Operación cancelada.'))
        } else if (character === '\u0008' || character === '\u007f') {
          value = value.slice(0, -1)
        } else {
          value += character
        }
      }
    }
    input.on('data', onData)
  })
}

async function wrangler(command: string) {
  const executable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  return execFile(
    executable,
    ['exec', 'wrangler', 'd1', 'execute', database, '--remote', '--json', '--command', command],
    {
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    },
  )
}

function rows(output: string): Record<string, unknown>[] {
  const parsed = JSON.parse(output) as unknown
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (item && typeof item === 'object' && 'results' in item && Array.isArray(item.results))
        return item.results
    }
  }
  return []
}

async function bootstrap() {
  const existing = rows(
    (
      await wrangler(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND status = 'active'",
      )
    ).stdout,
  )
  if (Number(existing[0]?.count ?? 0) > 0)
    throw new Error('Ya existe una cuenta admin activa. No se realizó ningún cambio.')

  const password = await promptHidden('Contraseña inicial del admin: ')
  if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.')
  const confirmation = await promptHidden('Repite la contraseña: ')
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.')
  const hashed = hashPassword(password)
  const now = Date.now()
  const id = randomUUID()
  const command = `INSERT INTO users (id, role, username_normalized, password_hash, password_salt, password_algorithm, password_parameters, status, created_at, updated_at, password_changed_at) VALUES (${sql(id)}, 'admin', ${sql(username)}, ${sql(hashed.hash)}, ${sql(hashed.salt)}, ${sql(algorithm)}, ${sql(hashed.parameters)}, 'active', ${now}, ${now}, ${now});`
  await wrangler(command)
  process.stdout.write('Cuenta admin creada correctamente.\n')
}

async function reset() {
  const adminRows = rows(
    (await wrangler("SELECT id FROM users WHERE role = 'admin' LIMIT 1")).stdout,
  )
  const adminId = String(adminRows[0]?.id ?? '')
  if (!adminId) throw new Error('No existe una cuenta admin para restablecer.')
  const password = await promptHidden('Nueva contraseña del admin: ')
  if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.')
  const confirmation = await promptHidden('Repite la contraseña: ')
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.')
  const hashed = hashPassword(password)
  const now = Date.now()
  const command = `UPDATE users SET password_hash = ${sql(hashed.hash)}, password_salt = ${sql(hashed.salt)}, password_algorithm = ${sql(algorithm)}, password_parameters = ${sql(hashed.parameters)}, updated_at = ${now}, password_changed_at = ${now} WHERE id = ${sql(adminId)}; UPDATE sessions SET revoked_at = ${now} WHERE user_id = ${sql(adminId)} AND revoked_at IS NULL; INSERT INTO auth_events (id, event_type, target_user_id, occurred_at, correlation_id) VALUES (${sql(randomUUID())}, 'restablecimiento_admin_local', ${sql(adminId)}, ${now}, ${sql(createHash('sha256').update(randomBytes(16)).digest('base64url'))});`
  await wrangler(command)
  process.stdout.write('Contraseña admin restablecida y sesiones invalidadas.\n')
}

const command = process.argv[2]
if (command !== 'bootstrap' && command !== 'reset') {
  const readline = createInterface({ input: process.stdin, output: process.stdout })
  await readline.close()
  throw new Error('Uso: pnpm auth:bootstrap-admin o pnpm auth:reset-admin')
}

await (command === 'bootstrap' ? bootstrap() : reset())
