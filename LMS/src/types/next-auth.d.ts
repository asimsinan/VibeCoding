import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      organizationId: string;
      organization?: {
        id: string;
        name: string;
        domain?: string | null;
        settings?: any;
      };
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    organizationId: string;
    organization?: {
      id: string;
      name: string;
      domain?: string | null;
      settings?: any;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    organizationId: string;
    organization?: {
      id: string;
      name: string;
      domain?: string | null;
      settings?: any;
    };
  }
}
