'use client'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/app/components/ui/primitives/button'
import { Card, CardContent } from '@/app/components/ui/primitives/card'
import { Alert } from '@/app/components/ui/primitives/alert'
import { Stack } from '@/app/components/ui/primitives/stack'
import { Section } from '@/app/components/ui/primitives/section'
import { env } from '@/config/env'
import { loginGoogle } from '@/lib/shallwe/auth/api/calls'
import { ApiError } from '@/lib/shallwe/common/api/calls'
export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authRequestSent = useRef(false)
  const openGoogleLogin = () => {
    const clientId = env.NEXT_PUBLIC_SHALLWE_OAUTH_CLIENT_ID
    if (!clientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in environment variables.')
      setError('Authentication configuration error. Please contact support.')
      return
    }
    const redirectUri =
      typeof window !== 'undefined'
        ? env.NEXT_PUBLIC_SHALLWE_OAUTH_REDIRECT_URI
        : 'http://localhost:3000'
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${encodeURIComponent(
      redirectUri
    )}&prompt=consent&response_type=code&client_id=${clientId}&scope=openid%20email%20profile`
    window.location.href = googleAuthUrl
  }
  const handleAuthSuccess = useCallback(() => {
    setIsLoading(false)
    setError(null)
    window.location.reload() // Middleware will handle the redirect based on profile-status
  }, [])
  const handleAuthError = useCallback((err: unknown) => {
    const isApiError = (error: unknown): error is ApiError => {
      return typeof error === 'object' && error !== null && 'message' in error
    }
    setIsLoading(false)
    console.error('Login error:', err)
    if (isApiError(err)) {
      setError(err.message || 'An error occurred during login.')
    } else if (err instanceof Error) {
      setError(err.message)
    } else {
      console.warn('Unexpected error type received in handleLoginError:', typeof err, err)
      setError('An unexpected error occurred.')
    }
  }, [])
  const handleBackendAuth = useCallback(
    async (code: string) => {
      try {
        await loginGoogle(code)
        handleAuthSuccess()
      } catch (error) {
        handleAuthError(error)
      }
    },
    [handleAuthError, handleAuthSuccess]
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleHomeLoad = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const errorParam = urlParams.get('error')
      if (errorParam) {
        console.error(`Google OAuth error: ${errorParam}`)
        setError(`Google OAuth error: ${errorParam}`)
        return
      }
      if (code && !authRequestSent.current) {
        const decodedCode = decodeURIComponent(code)
        setIsLoading(true)
        setError(null)
        const newUrl = window.location.origin + window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
        authRequestSent.current = true
        await handleBackendAuth(decodedCode)
      }
    }
    handleHomeLoad()
  }, [handleBackendAuth])
  return (
    <Section
      className="relative flex min-h-[calc(100vh-9rem)] items-center justify-center pt-12 pb-8 sm:pt-16"
      as="div"
      fullWidth
      bleed
    >
      <div className="page-shell w-full">
        <div className="grid gap-8 rounded-[var(--radius-lg)] bg-brand-weak p-8 shadow-[var(--shadow-card)] sm:p-10 lg:grid-cols-[1.05fr_1fr]">
          <Stack gap="sm" className="text-left">
            <p className="text-sm font-medium text-foreground">3 простих кроки</p>
            <Stack gap="xs">
              <h2 className="text-base font-semibold text-foreground">Як це працює</h2>
              <Stack gap="xs" className="text-base text-foreground">
                <p>1. Шукаємо сусіда, використовуючи фільтри</p>
                <p>2. Списуємось</p>
                <p>3. Знімаємо житло разом</p>
              </Stack>
            </Stack>
          </Stack>
          <Stack gap="sm" className="items-start">
            <h1 className="text-base font-black leading-tight text-foreground">Shallwe</h1>
            <p className="text-base font-semibold text-foreground">
              Місце, де можна легко знайти сусіда для аренди житла
            </p>
            <Card className="w-full bg-card shadow-[var(--shadow-soft)]">
              <CardContent className="space-y-4 pt-6">
                {error && <Alert variant="destructive">{error}</Alert>}
                <Button
                  variant="secondary"
                  onClick={openGoogleLogin}
                  disabled={isLoading}
                  className="w-full gap-2 bg-card text-foreground shadow-[var(--shadow-card)]"
                  size="lg"
                >
                  <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="h-5 w-5" />
                  {isLoading ? 'Обробляємо…' : 'Увійти з Google'}
                </Button>
                <p className="text-center text-sm text-muted">
                  Продовжуючи, ви погоджуєтесь з умовами Shallwe та політикою конфіденційності.
                </p>
              </CardContent>
            </Card>
          </Stack>
        </div>
      </div>
    </Section>
  )
}
