/**
 * Security headers utility for API responses
 * Prevents common web vulnerabilities (XSS, clickjacking, MIME sniffing, etc)
 */

export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff', // Prevent MIME sniffing
    'X-Frame-Options': 'DENY', // Prevent clickjacking
    'X-XSS-Protection': '1; mode=block', // Legacy XSS protection
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload', // Force HTTPS
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'", // CSP
    'Referrer-Policy': 'strict-origin-when-cross-origin', // Control referrer info
  };
}
