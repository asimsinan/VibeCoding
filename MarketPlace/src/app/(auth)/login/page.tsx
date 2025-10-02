// Login Page Component
// User login page

'use client';

import { useRouter } from 'next/navigation';
import { LoginForm } from '../../../components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push('/dashboard');
  };

  const handleSwitchToRegister = () => {
    router.push('/register');
  };

  return (
    <div>
      <LoginForm 
        onSuccess={handleLoginSuccess}
        onSwitchToRegister={handleSwitchToRegister}
      />
    </div>
  );
}
