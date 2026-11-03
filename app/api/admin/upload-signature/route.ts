import { createHash } from 'node:crypto';
import { adminOnly } from '@/lib/server/admin-auth';
import { fail, handle, ok } from '@/lib/server/http';

const FOLDER = 'bold-mount/products';

// Signed Cloudinary upload: the browser sends the photo straight to Cloudinary with this signature, so our server never handles the file.
export const POST = handle(async (req: Request) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return fail(503, 'Photo upload isn’t set up yet.');
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash('sha1').update(`folder=${FOLDER}&timestamp=${timestamp}${apiSecret}`).digest('hex');
  return ok({ cloudName, apiKey, timestamp, folder: FOLDER, signature });
});
