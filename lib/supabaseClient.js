import { createClient } from '@supabase/supabase-js'

// 1. Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 2. Safety Check:
// If keys are missing (which happens during the build phase sometimes),
// we use dummy values so the build doesn't crash.
// The real app will still need the real keys to work.
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder'

export const supabase = createClient(url, key)