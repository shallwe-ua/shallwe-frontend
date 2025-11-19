'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Stack } from '@/components/ui/stack'
import { Section } from '@/components/ui/section'
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
      <Stack gap="lg" className="page-shell mx-auto max-w-xl items-center text-center">
        <Stack gap="xs">
          <h1 className="text-[2.35rem] font-semibold leading-tight text-foreground sm:text-[2.75rem]">
            Meet a flatmate who lives the way you do
          </h1>
          <p className="text-base text-muted">
            Share a quick profile and review photo-verified matches before you sign a lease.
          </p>
        </Stack>

        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Sign in to get started</CardTitle>
            <CardDescription>Use Google to launch your Shallwe profile in under a minute.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert variant="destructive">{error}</Alert>}

            <Button
              variant="outline"
              onClick={openGoogleLogin}
              disabled={isLoading}
              className="w-full gap-2"
              size="lg"
            >
              <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="h-5 w-5" />
              {isLoading ? 'Processing…' : 'Sign in with Google'}
            </Button>

            <p className="text-center text-xs text-muted">
              By continuing you agree to the Shallwe Terms and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </Stack>
    </Section>
  )
}
