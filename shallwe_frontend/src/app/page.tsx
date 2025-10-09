'use client'


import { useState, useEffect, useRef } from 'react'

import { env } from '@/config/env'
import { loginGoogle, ApiError } from '@/lib/api'


export default function LandingPage() {

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authRequestSent = useRef(false)


  const openGoogleLogin = () => {
    const clientId = env.NEXT_PUBLIC_SHALLWE_OAUTH_CLIENT_ID
    if (!clientId) {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in environment variables.")
      setError("Authentication configuration error. Please contact support.")
      return
    }

    const redirectUri = typeof window !== 'undefined' ? env.NEXT_PUBLIC_SHALLWE_OAUTH_REDIRECT_URI : 'http://localhost:3000' // Fallback for SSR
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${encodeURIComponent(redirectUri)}&prompt=consent&response_type=code&client_id=${clientId}&scope=openid%20email%20profile`

    window.location.href = googleAuthUrl
  }


  const handleBackendAuth = async (code: string) => {
    try {
      await loginGoogle(code)
      console.log("Login successful via API call.")
      handleAuthSuccess()
    }
    catch (error) {
      handleAuthError(error)
    }
  } 


  const handleAuthSuccess = () => {
    setIsLoading(false)
    setError(null)
    window.location.reload()  // Middleware will handle the redirect based on profile-status
  }


  const handleAuthError = (err: unknown) => {
    const isApiError = (error: any): error is ApiError => {
      return error && typeof error === 'object' && 'message' in error
    }

    setIsLoading(false)
    console.error("Login error:", err)

    if (isApiError(err)) {
      setError(err.message || "An error occurred during login.")
    }
    else if (err instanceof Error) {
      setError(err.message)
    }
    else {
      console.warn("Unexpected error type received in handleLoginError:", typeof err, err)
      setError("An unexpected error occurred.")
    }
  }


  useEffect(() => {  // Effect to check for code and finish auth flow
    if (typeof window === 'undefined') return

    const handleHomeLoad = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const errorParam = urlParams.get('error')

      if (errorParam) {
        console.error(`Google OAuth error: ${errorParam}`)
        setError(`Google OAuth error: ${errorParam}`)
        return // Stop further processing
      }

      if (code && !authRequestSent.current) {
        const decodedCode = decodeURIComponent(code)
        console.log("Received authorization code from Google:", decodedCode)

        setIsLoading(true)
        setError(null) // Clear any previous errors

        // Remove code from urlparams and prevent subsequent requests
        const newUrl = window.location.origin + window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
        authRequestSent.current = true 

        await handleBackendAuth(decodedCode)  // Authenticate with backend
      }
    }

    handleHomeLoad()
  }, []) // Empty dependency array means this effect runs once on mount


  // ==== RENDER ====
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-white to-primary-blue flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-brand-red">Find Your Perfect Flatmate</h1>
        <p className="text-center text-text-black">
          Connect with people who share your lifestyle and values.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={openGoogleLogin}
            disabled={isLoading}
            className={`w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white cursor-pointer ${
              isLoading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>

        {isLoading && (
          <div className="mt-4 text-center text-text-black">
            Processing login...
          </div>
        )}

        <div className="mt-8 text-center text-sm text-text-black">
          <p>By signing in, you agree to our Terms and Privacy Policy.</p>
        </div>
      </div>
    </div>
  )
}
