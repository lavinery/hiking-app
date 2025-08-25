/**
 * In-memory rate limiting implementation
 * TODO: Replace with Redis in production for horizontal scaling
 */

interface RateLimitConfig {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string    // Custom error message
}

interface ClientRecord {
  count: number
  resetTime: number
}

class InMemoryRateLimit {
  private clients = new Map<string, ClientRecord>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Check if client is rate limited
   */
  isRateLimited(clientId: string): boolean {
    const now = Date.now()
    const client = this.clients.get(clientId)

    // First request or window expired
    if (!client || now > client.resetTime) {
      this.clients.set(clientId, {
        count: 1,
        resetTime: now + this.config.windowMs
      })
      return false
    }

    // Increment request count
    client.count++

    // Check if limit exceeded
    if (client.count > this.config.maxRequests) {
      return true
    }

    return false
  }

  /**
   * Get current rate limit status for client
   */
  getStatus(clientId: string): {
    remaining: number
    resetTime: number
    total: number
  } {
    const client = this.clients.get(clientId)
    const now = Date.now()

    if (!client || now > client.resetTime) {
      return {
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
        total: this.config.maxRequests
      }
    }

    return {
      remaining: Math.max(0, this.config.maxRequests - client.count),
      resetTime: client.resetTime,
      total: this.config.maxRequests
    }
  }

  /**
   * Get error message for rate limit exceeded
   */
  getErrorMessage(): string {
    return this.config.message || 'Too many requests. Please try again later.'
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [clientId, client] of this.clients.entries()) {
      if (now > client.resetTime) {
        this.clients.delete(clientId)
      }
    }
  }

  /**
   * Get current cache size (for monitoring)
   */
  getCacheSize(): number {
    return this.clients.size
  }
}

// Rate limit instances for different endpoints
export const recommendationsRateLimit = new InMemoryRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,          // 10 recommendations per 15 minutes
  message: 'Too many recommendation requests. Please wait before creating another recommendation.'
})

export const generalApiRateLimit = new InMemoryRateLimit({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 100,         // 100 requests per minute
  message: 'Too many API requests. Please slow down.'
})

export const authRateLimit = new InMemoryRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,           // 5 login attempts per 15 minutes
  message: 'Too many login attempts. Please try again later.'
})

/**
 * Get client identifier from request
 */
export function getClientId(request: Request): string {
  // Try to get real IP from headers (for proxy/CDN setups)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('x-remote-addr')
  
  // Use the first IP if there are multiple in x-forwarded-for
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp.trim()
  }
  
  if (remoteAddr) {
    return remoteAddr.trim()
  }
  
  // Fallback to connection IP (not available in Edge Runtime)
  return 'unknown'
}

/**
 * Rate limit middleware factory
 */
export function createRateLimitMiddleware(rateLimiter: InMemoryRateLimit) {
  return (request: Request) => {
    const clientId = getClientId(request)
    
    if (rateLimiter.isRateLimited(clientId)) {
      const status = rateLimiter.getStatus(clientId)
      const resetTimeSeconds = Math.ceil((status.resetTime - Date.now()) / 1000)
      
      return new Response(
        JSON.stringify({
          error: rateLimiter.getErrorMessage(),
          retryAfter: resetTimeSeconds
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': status.total.toString(),
            'X-RateLimit-Remaining': status.remaining.toString(),
            'X-RateLimit-Reset': status.resetTime.toString(),
            'Retry-After': resetTimeSeconds.toString(),
          }
        }
      )
    }

    const status = rateLimiter.getStatus(clientId)
    
    return {
      headers: {
        'X-RateLimit-Limit': status.total.toString(),
        'X-RateLimit-Remaining': status.remaining.toString(),
        'X-RateLimit-Reset': status.resetTime.toString(),
      }
    }
  }
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(response: Response): Response {
  // Clone response to avoid modifying the original
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  })

  // Add security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff')
  newResponse.headers.set('X-Frame-Options', 'DENY')
  newResponse.headers.set('X-XSS-Protection', '1; mode=block')
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Remove server information
  newResponse.headers.delete('Server')
  newResponse.headers.delete('X-Powered-By')

  return newResponse
}