'use client'

import Image from 'next/image'
import { CSSProperties, useEffect, useRef, useState } from 'react'

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

  const handleBackendAuth = async (code: string) => {
    try {
      await loginGoogle(code)
      handleAuthSuccess()
    } catch (error) {
      handleAuthError(error)
    }
  }

  const handleAuthSuccess = () => {
    setIsLoading(false)
    setError(null)
    window.location.reload() // Middleware will handle the redirect based on profile-status
  }

  const handleAuthError = (err: unknown) => {
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
  }

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
    <Section className="relative min-h-screen pt-20 pb-16 flex items-start" as="div" fullWidth bleed>
      <div className="bg-ornaments">
        <div className="bg-orb bg-orb--blue" style={{ top: '-120px', left: '-80px' }} />
        <div className="bg-orb bg-orb--peach" style={{ bottom: '-160px', right: '-60px' }} />
          <div className="pointer-events-none absolute inset-0">
            {houseRain.map((house, idx) => {
              const style: CSSProperties & { ['--house-duration']?: string } = {
                top: house.startY,
                left: house.startX,
                animationDelay: house.delay,
                '--house-duration': house.duration,
              }
              return (
                <div
                  key={idx}
                  className={`bg-house ${house.color === 'blue' ? 'bg-house--blue' : 'bg-house--peach'}`}
                  style={style}
                />
              )
            })}
          </div>
        </div>

      <Stack gap="lg" className="page-shell relative z-10 max-w-xl mx-auto items-center text-center">
        <Stack gap="sm" className="pt-4">
          <h1 className="text-[2.45rem] font-semibold leading-tight text-foreground sm:text-[2.75rem]">
            Find a flatmate who matches how you live.
          </h1>
          <p className="text-base text-muted max-w-xl mx-auto">
            Answer a few questions, build a detailed profile, and review photo-verified matches before
            you commit to a lease.
          </p>
        </Stack>

        <Card className="w-full max-w-xl card-shell border border-border/70">
          <CardHeader>
            <CardTitle>Continue with Google</CardTitle>
            <CardDescription>Sign in to start your profile in under 60 seconds.</CardDescription>
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
            By continuing you agree to our Terms and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </Stack>
    </Section>
  )
}

const houseRain = Array.from({ length: 36 }).map(() => {
  const color = Math.random() > 0.5 ? 'blue' : 'peach'
  const startX = `${Math.random() * 100}%`
  const startY = `${-Math.random() * 20}%`
  const delay = `${Math.random() * 4}s`
  const duration = `${7 + Math.random() * 4}s` // 7-11s fall
  return { color, startX, startY, delay, duration }
})
