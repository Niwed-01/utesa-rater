interface RateLimitEntry {
  count: number
  resetAt: number
}

const ipStore = new Map<string, RateLimitEntry>()
const userStore = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL = 60_000

let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  Array.from(ipStore.entries()).forEach(([key, entry]) => {
    if (now > entry.resetAt) ipStore.delete(key)
  })
  Array.from(userStore.entries()).forEach(([key, entry]) => {
    if (now > entry.resetAt) userStore.delete(key)
  })
}

function checkLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

export function rateLimitByIp(
  ip: string,
  limit: number = 20,
  windowMs: number = 60_000,
): boolean {
  cleanup()
  return checkLimit(ipStore, ip, limit, windowMs)
}

export function rateLimitByUser(
  userId: string,
  limit: number = 30,
  windowMs: number = 60_000,
): boolean {
  cleanup()
  return checkLimit(userStore, userId, limit, windowMs)
}

export function getRateLimitKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}
