import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - LMS',
  description: 'Sign in or create an account to access the Learning Management System',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-secondary-50">
      {children}
    </div>
  );
}


