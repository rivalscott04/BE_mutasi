import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '8h';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refreshsecret';
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '7d';

export function generateToken(payload: string | object | Buffer): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

export function generateRefreshToken(payload: string | object | Buffer): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRE });
}

export function verifyRefreshToken(token: string): any {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
} 