import jwt from 'jsonwebtoken';
import { getCookie } from 'cookies-next';

const SECRET = process.env.JWT_SECRET || 'dev-fallback-change-in-prod';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}
export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}
export function getUserFromRequest(req, res) {
  const token = getCookie('lv_token', { req, res });
  if (!token) return null;
  return verifyToken(token);
}
export function sanitize(str, max = 2000) {
  if (typeof str !== 'string') return '';
  return str.slice(0, max).trim();
}
export function validateEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
export function getIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
}
