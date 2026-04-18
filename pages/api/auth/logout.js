import { deleteCookie } from 'cookies-next';
export default function handler(req, res) {
  deleteCookie('lv_token', { req, res, path: '/' });
  return res.status(200).json({ ok: true });
}
