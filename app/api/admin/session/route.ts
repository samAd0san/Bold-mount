import { isAdmin, pinLength } from '@/lib/server/admin-auth';
import { handle, ok } from '@/lib/server/http';

// Lets the admin page ask "am I signed in?" (pages are served by a host that can't reach the database).
export const GET = handle(async () => ok({ admin: await isAdmin(), pinLength: await pinLength() }));
