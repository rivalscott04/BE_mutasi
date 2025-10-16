import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Helper function untuk generate IP key yang IPv6 compatible
const getIpKey = (req: Request): string => {
  // Cek IPv6 first, lalu IPv4, lalu fallback
  const ipv6 = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  
  let ip = ipv6;
  if (forwarded) {
    ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
  } else if (realIp) {
    ip = Array.isArray(realIp) ? realIp[0] : realIp;
  }
  
  // Normalize IPv6 untuk consistency
  if (ip && ip.includes('::')) {
    // IPv6 - normalize to /64 subnet untuk consistency
    const parts = ip.split('::');
    return parts[0] || 'unknown';
  }
  
  return ip || 'unknown';
};

// Login rate limiting - PROTEKSI UTAMA dari brute force
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // 5 percobaan per 15 menit
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Coba lagi dalam 30 menit.',
    retryAfter: 30 * 60 // 30 menit dalam detik
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests (hanya hitung yang gagal)
  skipSuccessfulRequests: true,
  // Skip failed requests setelah max tercapai
  skipFailedRequests: false,
  // Key generator - berdasarkan IP + email
  keyGenerator: (req: Request) => {
    const email = req.body?.email || 'unknown';
    const ip = getIpKey(req);
    return `${ip}:${email}`;
  },
  // Handler untuk rate limit exceeded
  handler: (req: Request, res: Response) => {
    const ip = getIpKey(req);
    const email = req.body?.email || 'unknown';
    
    console.log(`🚨 RATE LIMIT EXCEEDED: IP=${ip}, Email=${email}, UserAgent=${req.get('User-Agent')}`);
    
    // Log untuk security monitoring
    console.log(`🔒 Security Alert: Multiple failed login attempts from ${ip}`);
    
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login. Coba lagi dalam 30 menit.',
      retryAfter: 30 * 60,
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

// Global IP rate limiting - proteksi tambahan untuk distributed attacks
export const globalIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 20, // 20 percobaan login per IP per jam (total dari semua email)
  message: {
    success: false,
    message: 'IP address diblokir sementara karena aktivitas mencurigakan. Coba lagi dalam 1 jam.',
    retryAfter: 60 * 60
  },
  keyGenerator: (req: Request) => {
    return `global:${getIpKey(req)}`;
  },
  handler: (req: Request, res: Response) => {
    const ip = getIpKey(req);
    console.log(`🚨 GLOBAL RATE LIMIT EXCEEDED: IP=${ip} - Possible distributed attack`);
    
    res.status(429).json({
      success: false,
      message: 'IP address diblokir sementara karena aktivitas mencurigakan.',
      retryAfter: 60 * 60,
      error: 'IP_BLOCKED'
    });
  }
});

// Password reset rate limiting
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 3, // 3 percobaan per jam
  message: {
    success: false,
    message: 'Terlalu banyak percobaan reset password. Coba lagi dalam 1 jam.'
  },
  keyGenerator: (req: Request) => {
    const email = req.body?.email || 'unknown';
    const ip = getIpKey(req);
    return `reset:${ip}:${email}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan reset password. Coba lagi dalam 1 jam.',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

// General API rate limiting (untuk nanti)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 100, // 100 request per menit
  message: {
    success: false,
    message: 'Terlalu banyak request. Tunggu sebentar.'
  },
  keyGenerator: (req: Request) => {
    return getIpKey(req);
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Tunggu sebentar.',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }
});
