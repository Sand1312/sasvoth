'use client';

import { useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/schemas/auth';
import { loginAction } from '@/app/(auth)/signin/actions';
import { Input } from '@sasvoth/ui/input';
import { Button } from '@sasvoth/ui/button';
import { useFeedback } from '@/contexts/FeedbackContext';
import { SocialLoginButtons } from '@/components/SocialLoginButtons';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';

const initialState = {
  success: false,
  message: '',
};

export function LoginForm() {
  const { showSuccess, showError } = useFeedback();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  // React 19: useActionState handles pending state & form result
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  // Redirect if already logged in (Client Side)
  useEffect(() => {
    if (user || state.success) {
      router.push(callbackUrl);
    }
  }, [user, state.success, router, callbackUrl]);

  const {
    register,
    setError,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Sync Server Errors to React Hook Form
  useEffect(() => {
    if (state.success) {
       // Optional: Trigger manual useAuth refresh if needed, but router.push usually suffices
       // refreshAuth(); 
    }
    if (!state.success && state.errors) {
      Object.entries(state.errors).forEach(([key, msgs]) => {
        if (msgs) setError(key as keyof LoginFormData, { message: msgs[0] });
      });
    }
    if (!state.success && state.message) {
      showError('Login Failed', state.message);
    }
  }, [state, setError, showError]);

  return (
    <form action={formAction} className="space-y-4">
      {/* Identifier */}
      <div>
        <Input 
          {...register('identifier')} 
          placeholder="Username / Email" 
          disabled={isPending}
        />
        {errors.identifier && (
          <p className="text-red-500 text-sm mt-1">{errors.identifier.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <Input 
          {...register('password')} 
          type="password" 
          placeholder="Password" 
          disabled={isPending}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Authenticating..." : "Login"}
      </Button>

      <div className="my-6 flex items-center">
        <div className="flex-grow h-px bg-gray-200" />
        <span className="mx-2 text-xs text-gray-400">or</span>
        <div className="flex-grow h-px bg-gray-200" />
      </div>

      <SocialLoginButtons error={null} />
    </form>
  );
}
