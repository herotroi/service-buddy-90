// Rate limiter for Edge Functions using in-memory storage with IP-based tracking
// This provides protection against brute-force attacks on API key authentication

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blocked: boolean;
  blockedUntil: number;
}

// In-memory storage (resets on function cold start, but provides protection during active use)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const MAX_ATTEMPTS = 5; // Max failed attempts before blocking
const WINDOW_MS = 60 * 1000; // 1 minute window
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes block after exceeding limit
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean up old entries every 5 minutes

let lastCleanup = Date.now();

function cleanupOldEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  
  lastCleanup = now;
  const cutoff = now - WINDOW_MS - BLOCK_DURATION_MS;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.firstAttempt < cutoff && (!entry.blocked || entry.blockedUntil < now)) {
      rateLimitStore.delete(key);
    }
  }
}

export function getClientIP(req: Request): string {
  // Try various headers that might contain the real IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the list (original client)
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;
  
  // Fallback - use a hash of user-agent and other headers as identifier
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return `ua-${hashString(userAgent)}`;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  blocked: boolean;
}

export function checkRateLimit(clientIP: string, functionName: string): RateLimitResult {
  cleanupOldEntries();
  
  const key = `${functionName}:${clientIP}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // Check if blocked
  if (entry?.blocked && entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.blockedUntil - now) / 1000),
      blocked: true
    };
  }
  
  // Reset if window expired or was previously blocked but block expired
  if (!entry || entry.firstAttempt < now - WINDOW_MS || (entry.blocked && entry.blockedUntil <= now)) {
    entry = {
      attempts: 0,
      firstAttempt: now,
      blocked: false,
      blockedUntil: 0
    };
    rateLimitStore.set(key, entry);
  }
  
  const remaining = Math.max(0, MAX_ATTEMPTS - entry.attempts);
  const resetIn = Math.ceil((entry.firstAttempt + WINDOW_MS - now) / 1000);
  
  return {
    allowed: remaining > 0,
    remaining,
    resetIn: Math.max(0, resetIn),
    blocked: false
  };
}

export function recordFailedAttempt(clientIP: string, functionName: string): void {
  const key = `${functionName}:${clientIP}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  if (!entry || entry.firstAttempt < now - WINDOW_MS) {
    entry = {
      attempts: 1,
      firstAttempt: now,
      blocked: false,
      blockedUntil: 0
    };
  } else {
    entry.attempts++;
    
    // Block if exceeded max attempts
    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.blocked = true;
      entry.blockedUntil = now + BLOCK_DURATION_MS;
      console.warn(`Rate limit exceeded for ${key}. Blocked until ${new Date(entry.blockedUntil).toISOString()}`);
    }
  }
  
  rateLimitStore.set(key, entry);
}

export function resetRateLimit(clientIP: string, functionName: string): void {
  const key = `${functionName}:${clientIP}`;
  rateLimitStore.delete(key);
}

// CORS headers for rate limit responses
export const rateLimitHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Content-Type': 'application/json'
};

export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: result.blocked 
        ? 'Too many failed attempts. Please try again later.' 
        : 'Rate limit exceeded. Please slow down.',
      retry_after: result.resetIn
    }),
    {
      status: 429,
      headers: {
        ...rateLimitHeaders,
        'Retry-After': result.resetIn.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetIn.toString()
      }
    }
  );
}
