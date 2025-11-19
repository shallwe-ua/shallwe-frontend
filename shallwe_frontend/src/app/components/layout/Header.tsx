'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ApiError } from '@/lib/shallwe/common/api/calls'
import { logout, deleteUser } from '@/lib/shallwe/auth/api/calls'
import { Button } from '@/components/ui/button'



const Header = () => {

  const pathname = usePathname() // Get current path
  const [isCancellingSetup, setIsCancellingSetup] = useState(false)
  const isSetupPage = pathname === '/setup'
  const isLoggedIn = pathname && !['/', '/setup'].includes(pathname) // TODO: USE AUTH CONTEXT LATER !!!!


  const handleLogout = async () => {
    try {
      await logout()
      console.log("Logout successful via API call.")
      handleLogoutSuccess()
    }
    catch (error) {
      handleLogoutError(error)
    }
  }


  const handleLogoutSuccess = () => {
    window.location.href = '/'  // Redirect to home page after logout
  }


  const logApiError = (label: string, err: unknown) => {
    const isApiError = (error: unknown): error is ApiError => {
      return typeof error === 'object' && error !== null && 'message' in error
    }

    console.error(`${label} failed:`, err)

    if (isApiError(err)) {
      console.error(err.message || "An error occurred during logout.")
    }
    else if (err instanceof Error) {
      console.error(err.message)
    }
    else {
      console.warn("Unexpected error type received in handleLogoutError:", typeof err, err)
    }
  }

  const handleLogoutError = (err: unknown) => logApiError('Logout', err)

  const handleCancelSetup = async () => {
    if (isCancellingSetup) return

    setIsCancellingSetup(true)
    try {
      await deleteUser()
      window.location.href = '/'
    } catch (error) {
      logApiError('Cancel setup', error)
      setIsCancellingSetup(false)
    }
  }


  // --- RENDER ---
  const isLanding = pathname === '/'

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background shadow-[var(--shadow-soft)]">
      <div className="page-shell">
        <div className="flex h-14 items-center justify-between">
          <Link
            href={isLoggedIn ? '/settings' : '/'}
            className="text-base font-semibold text-foreground tracking-tight"
            aria-label="Shallwe home"
          >
            Shallwe
          </Link>

          {!isLanding && (
            <div>
              {isLoggedIn ? (
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              ) : isSetupPage ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancelSetup}
                  disabled={isCancellingSetup}
                >
                  {isCancellingSetup ? 'Cancelling…' : 'Cancel setup'}
                </Button>
              ) : (
                <Link
                  href="/"
                  className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm text-foreground hover:bg-surface-muted"
                >
                  Home
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
