'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Check against the PROFILES table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', formData.email)
        .eq('password', formData.password)
        .single()

      if (error || !data) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // 2. Success! Save user
      localStorage.setItem('iqol_user', JSON.stringify(data))
      
      // 3. Redirect to Dashboard
      router.push('/dashboard')

    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#113a3a]">IQOL Dashboard</h1>
          <p className="text-slate-400 text-sm mt-2">Please sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md text-white font-bold bg-[#113a3a] hover:bg-[#0d2e2e]"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}