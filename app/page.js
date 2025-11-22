'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">
      Redirecting to Dashboard...
    </div>
  )
}