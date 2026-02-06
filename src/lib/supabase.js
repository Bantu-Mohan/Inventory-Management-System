import { createClient } from '@supabase/supabase-js'

// 1. Get Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

// 2. Decide which key to use (Prefer Service Key for local dev if available)
const activeKey = supabaseServiceKey || supabaseAnonKey

// 3. Log Configuration State (Safety check)
console.log('🔌 Supabase init:', {
  url: supabaseUrl ? 'Set ✅' : 'Missing ❌',
  key: activeKey ? (supabaseServiceKey ? 'Service Key (Admin)' : 'Anon Key') : 'Missing ❌',
})

// 4. Create Client
// Note: We use PersistSession: false for the service key to avoid browser storage conflicts
export const supabase = (supabaseUrl && activeKey)
  ? createClient(supabaseUrl, activeKey, {
    auth: {
      persistSession: !supabaseServiceKey,
      autoRefreshToken: !supabaseServiceKey,
    }
  })
  : null

export const isConfigured = !!supabase

export const LOW_STOCK_THRESHOLD = Number(import.meta.env.VITE_LOW_STOCK_THRESHOLD || 10)
