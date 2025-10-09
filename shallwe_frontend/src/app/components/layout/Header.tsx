'use client'


import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ApiError, logout } from '@/lib/api'


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
    const isApiError = (error: any): error is ApiError => {
      return error && typeof error === 'object' && 'message' in error
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
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href={isLoggedIn ? "/settings" : "/"} className="text-xl font-bold text-primary-blue-dark">
              Shallwe
            </Link>
          </div>
          <nav className="hidden md:block">
            {/* Add navigation links here later if needed, e.g., for logged-out state */}
            {/* Example: <Link href="/about" className="text-gray-700 hover:text-primary-blue mx-3">About</Link> */}
          </nav>
          <div>
            {/* Show logout button if user seems logged in */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-700 hover:text-red-600"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
