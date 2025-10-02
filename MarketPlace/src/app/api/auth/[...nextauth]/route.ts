// NextAuth API Route
// Authentication API route for NextAuth.js

import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
