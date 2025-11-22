'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // If user is already logged in, send to dashboard
    if (localStorage.getItem('iqol_user')) {
      router.push('/dashboard')
    } else {
      // Otherwise send to login
      router.push('/login')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">
      Loading IQOL...
    </div>
  )
}