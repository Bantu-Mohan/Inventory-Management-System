import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Helper to read .env manually since we aren't using Vite here
function getEnv() {
    try {
        const __dirname = path.dirname(fileURLToPath(import.meta.url))
        const envPath = path.join(__dirname, '.env')
        const content = fs.readFileSync(envPath, 'utf8')
        const env = {}
        content.split('\n').forEach(line => {
            const parts = line.split('=')
            if (parts.length >= 2) {
                const key = parts[0].trim()
                const val = parts.slice(1).join('=').trim()
                env[key] = val
            }
        })
        return env
    } catch (e) {
        console.error('Failed to read .env file:', e.message)
        return {}
    }
}

async function verifyConnection() {
    console.log('🔍 Diagnostics Starting...')

    const env = getEnv()
    const url = env.VITE_SUPABASE_URL
    const anonKey = env.VITE_SUPABASE_ANON_KEY
    const serviceKey = env.VITE_SUPABASE_SERVICE_KEY

    const activeKey = serviceKey || anonKey

    console.log('----------------------------------------')
    console.log('1. Configuration Check:')
    console.log('   URL:', url)
    console.log('   Anon Key:', anonKey ? `Present (${anonKey.slice(0, 10)}...)` : 'MISSING')
    console.log('   Service Key:', serviceKey ? `Present (${serviceKey.slice(0, 10)}...)` : 'MISSING')
    console.log('   -> Using:', serviceKey ? 'SERVICE KEY (Admin Mode)' : 'ANON KEY (Public Mode)')
    console.log('----------------------------------------')

    if (!url || !activeKey) {
        console.error('❌ CRITICAL: Missing configuration in .env')
        return
    }

    const supabase = createClient(url, activeKey)

    console.log('2. Testing Database Connection...')
    try {
        const { data, error } = await supabase.from('inventory').select('count', { count: 'exact', head: true })

        if (error) {
            console.error('❌ Database Request Failed!')
            console.error('   Code:', error.code)
            console.error('   Message:', error.message)
            console.error('   Details:', error.details)
            console.error('   Hint:', error.hint)
        } else {
            console.log('✅ Connection Successful!')
            console.log('   Inventory Table Accessible. Status: OK')
        }

    } catch (err) {
        console.error('❌ Network/Client Error:', err.message)
    }

    console.log('----------------------------------------')
}

verifyConnection()
