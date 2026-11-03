import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';

export const FormBody = z.object({
  form: z.string().trim().min(1, 'Please say which form this is.').max(120),
  page: z.string().trim().max(200).default(''),
  fields: z
    .array(z.object({ label: z.string().trim().min(1).max(120), value: z.string().trim().max(5000) }))
    .min(1, 'Please fill in the form.')
    .max(30),
  // Hidden field: real people leave it empty, bots fill it.
  website: z.string().max(200).optional(),
});

/** Hash of IP + browser so we can rate-limit without storing either. */
export function clientKey(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || '';
  return createHash('sha256').update(`${ip}|${req.headers.get('user-agent') ?? ''}`).digest('hex').slice(0, 24);
}
