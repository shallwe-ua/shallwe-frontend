import '@/app/globals.css'
import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'

import Header from '@/app/components/layout/Header'
import Footer from '@/app/components/layout/Footer'

import { MSWInitializer } from '@/app/components/mock/MSWInit'
import { env } from '@/config/env'


const rubik = Rubik({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '700', '900'] })


export const metadata: Metadata = {
  title: 'Shallwe - Find Your Flatmate',
  description: 'Connect with compatible flatmates.',
}


export default function RootLayout({children,}: {children: React.ReactNode}) {
  const useMocks = env.NEXT_PUBLIC_SHALLWE_MOCK_API

  return (
    <html lang="en">
      <body className={rubik.className}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            {useMocks ? <MSWInitializer>{children}</MSWInitializer> : children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
