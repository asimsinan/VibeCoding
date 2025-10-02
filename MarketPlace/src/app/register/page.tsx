// Register Page
// User registration page

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/hooks/useAuth';
import { RegisterForm } from '../../components/forms/RegisterForm/RegisterForm';
import { ErrorMessage } from '../../components/ui/ErrorMessage';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const handleRegister = async (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      await register({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      router.push('/dashboard');
    } catch (error) {
      // Error is handled by the hook
      console.error('Registration failed:', error);
    }
  };

  const handleSwitchToLogin = () => {
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="container-main py-8">
          <div className="text-center">
            <h1 className="text-responsive-2xl font-bold text-gray-900 mb-4">
              Create Account
            </h1>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Join MarketPlace and start buying and selling today
            </p>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-16">
        <div className="container-main">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <ErrorMessage error={error} onDismiss={clearError} />
              
              <RegisterForm
                onSubmit={handleRegister}
                loading={isLoading}
                error={error}
              />
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={handleSwitchToLogin}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
