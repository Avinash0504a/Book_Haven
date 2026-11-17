import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { registerSchema } from '../../../lib/schemas.js';
import { authApi } from '../api/authApi.js';
import { useAuth } from '../../../providers/AuthProvider.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { getErrorMessage } from '../../../lib/errors.js';

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      const response = await authApi.register(data);
      if (response.token && response.member) {
        login(response.token, response.member);
        navigate('/', { replace: true });
      }
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-fg shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-text">Book Haven</span>
          </Link>
          <h1 className="text-2xl font-bold text-text tracking-tight">Create your account</h1>
          <p className="text-sm text-muted mt-1">Join Book Haven to explore books and earn gift points</p>
        </div>

        <Card className="border border-border shadow-md">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {serverError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger font-medium"
                >
                  {serverError}
                </div>
              )}

              <Input
                label="Full name"
                type="text"
                autoComplete="name"
                placeholder="Aarav Sharma"
                required
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="aarav@example.com"
                required
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                required
                helperText="Password must be between 6 and 72 characters."
                error={errors.password?.message}
                {...register('password')}
              />

              <Button type="submit" variant="primary" size="lg" className="w-full mt-2" loading={isSubmitting}>
                Register Account
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-muted">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
