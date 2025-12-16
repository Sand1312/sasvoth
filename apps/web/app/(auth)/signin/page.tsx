// Server Component
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Welcome Back</h1>
        <LoginForm />
      </div>
    </div>
  );
}
