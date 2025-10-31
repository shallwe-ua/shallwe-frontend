/*
Since frontend has a specified step-by-step flow, middleware controls that user only accesses the pages they are
meant to access based on that logic. The frontend should hit middleware per each page load to assure this.
*/

import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/config/env'
import { getProfileStatus } from '@/lib/shallwe/access/api/calls'


const apiBaseUrl = env.NEXT_PUBLIC_SHALLWE_API_BASE_URL_EXTERNAL
const isMiddlewareSkipped = env.NEXT_PUBLIC_SHALLWE_SKIP_MIDDLEWARE

const MAX_RETRIES = 3
const ATTEMPT_TIMEOUT_MS = 2500
const BACKOFF_MS = 200


const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race<T>([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ])

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))


async function tryFetchProfileStatus(cookie?: string): Promise<number> {
  let lastErr: unknown
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const r = await withTimeout(getProfileStatus(cookie), ATTEMPT_TIMEOUT_MS)
      return r.status as number
    } catch (e) {
      lastErr = e
      if (i < MAX_RETRIES - 1) await sleep(BACKOFF_MS)
    }
  }
  throw lastErr ?? new Error('profile-status failed')
}


const redirectRules: Record<number, Record<string, string | null>> = {
  // Where to redirect based on access code and current page
  403: {
    '/': null,
    default: '/',
  },
  404: {
    '/setup': null,
    default: '/setup',
  },
  200: {
    '/': '/settings',
    '/setup': '/settings',
    default: null,
  },
}


const redirectAdmin = (request: NextRequest): NextResponse => {
    const newUrl = request.nextUrl.clone()
    const backendUrl = new URL(apiBaseUrl)

    newUrl.protocol = backendUrl.protocol
    newUrl.hostname = backendUrl.hostname
    newUrl.port = backendUrl.port
    newUrl.searchParams.delete('next')

    console.log(`Redirecting admin request from ${request.nextUrl.href} to ${newUrl.href}`)
    return NextResponse.redirect(newUrl)
}


const redirectPages = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const cookie = request.headers.get('cookie')
    const profileStatus = await tryFetchProfileStatus(cookie || undefined)

    console.log(`Profile status check API call returned: ${profileStatus}`)

    const statusRedirectRules = redirectRules[profileStatus]
    if (!statusRedirectRules) {
      console.error(`Unexpected status ${profileStatus} from profile-status API`)
      return NextResponse.redirect(new URL('/', request.url))
    }

    const supposedRedirect = statusRedirectRules[request.nextUrl.pathname]
    const redirectTo = (
      supposedRedirect === undefined ?
      statusRedirectRules.default : supposedRedirect
    ) ?? null

    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

    return NextResponse.next()  // No redirect needed, allow to proceed
  }
  catch (error) {
    console.error(`Error calling profile-status API in middleware:`, error)
    // If not on landing, go to landing; otherwise allow landing to render.
    if (request.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }
}


export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  if (
    pathname === '/' ||
    pathname === '/setup' ||
    pathname === '/settings' ||
    pathname.startsWith('/admin')
  ) {
    
    if (isMiddlewareSkipped) {
      console.log('Middleware is skipped based on environment variable.')
      return NextResponse.next()
    }

    if (pathname.startsWith('/admin')) return redirectAdmin(request)
    else return redirectPages(request)
  }
  
  return NextResponse.next()
}
