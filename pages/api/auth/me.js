import { getUserFromRequest } from '../../../lib/auth';

export default function handler(req, res) {
  const user = getUserFromRequest(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ id: user.id, email: user.email, username: user.username });
}
