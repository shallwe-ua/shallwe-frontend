'use client'


import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ApiError } from '@/lib/shallwe/common/api/calls'
import { logout } from '@/lib/shallwe/auth/api/calls'
import { Button } from '@/components/ui/button'



const Header = () => {

  const pathname = usePathname() // Get current path
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


  const handleLogoutError = (err: unknown) => {
    const isApiError = (error: unknown): error is ApiError => {
      return typeof error === 'object' && error !== null && 'message' in error
    }

    console.error("Logout failed:", err)

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


  // --- RENDER ---
  const isLanding = pathname === '/'

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
      <div className="page-shell">
        <div className="flex h-16 items-center justify-between">
          <Link
            href={isLoggedIn ? '/settings' : '/'}
            className="text-lg font-semibold text-foreground tracking-tight"
            aria-label="Shallwe home"
          >
            Shallwe
          </Link>

          {!isLanding && (
            <>
              <nav className="hidden items-center gap-6 text-sm text-muted sm:flex">
                <Link href="/settings" className="hover:text-foreground">
                  Settings
                </Link>
                <Link href="/setup" className="hover:text-foreground">
                  Profile
                </Link>
              </nav>

              <div>
                {isLoggedIn ? (
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                ) : (
                  <Link
                    href="/"
                    className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-surface-elevated"
                  >
                    Home
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
