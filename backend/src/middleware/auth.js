/**
 * middleware/auth.js
 * Supabase JWT verification middleware.
 * Extracts Bearer token, verifies via supabase.auth.getUser(), attaches req.user.
 * Does NOT use jsonwebtoken — Supabase handles all JWT signing/verification.
 * Key dependencies: @supabase/supabase-js, dotenv
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Use anon key here — getUser() call validates the JWT server-side
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Verifies the Supabase JWT from the Authorization header.
 * Attaches { id, email } to req.user on success.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
