import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/config/env'
import { getProfileStatus } from '@/lib/api'


const apiBaseUrl = env.NEXT_PUBLIC_SHALLWE_API_BASE_URL_EXTERNAL
const skipMiddleware = env.NEXT_PUBLIC_SHALLWE_SKIP_MIDDLEWARE === 'true'


export async function middleware(request: NextRequest) {
  
  // --- Skip everything if set ---
  if (skipMiddleware) {
    return NextResponse.next()
  }

  // --- Admin redirect logic ---
  const url = request.nextUrl.clone() // Clone the URL for potential admin redirection

  if (url.pathname.startsWith('/admin')) {
    const apiUrl = new URL(apiBaseUrl)

    url.protocol = apiUrl.protocol
    url.hostname = apiUrl.hostname
    url.port = apiUrl.port

    // Remove the ?next=... query parameter if present (common for auth redirects)
    url.searchParams.delete('next')

    // Perform the redirect to the admin panel on the backend server
    console.log(`Redirecting admin request from ${request.nextUrl.href} to ${url.href}`)
    return NextResponse.redirect(url)
  }

  // --- Main site redirect logic ---

  const cookie = request.headers.get('cookie')

  // Check with access endpoint to determine correct page for this user
  try {
    const profileStatus = (await getProfileStatus(cookie || undefined)).status

    console.log(`Profile status check API call returned: ${profileStatus}`)

    // Determine the next action based on the API response status code
    if (profileStatus === 403 && request.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (profileStatus === 404 && request.nextUrl.pathname !== '/setup') {
      return NextResponse.redirect(new URL('/setup', request.url));
    }

    if (profileStatus === 200) {
      if (request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/settings', request.url));
      }
      if (request.nextUrl.pathname === '/setup') {
        return NextResponse.redirect(new URL('/settings', request.url));
      }
    }

    else {
      console.error(`Unexpected status ${profileStatus} from profile-status API`)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Handle unexpected errors
  catch (error) {
    console.error('Error calling profile-status API in middleware:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()  // No redirect triggered - just proceed
}


export const config = {
    matcher: ['/', '/setup', '/settings', '/contacts', '/search', '/admin/:path*'],
}
