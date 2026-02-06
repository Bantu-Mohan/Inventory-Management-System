import { createClient } from '@supabase/supabase-js'

const url = 'https://bpzpefonhzolyzqfhagn.supabase.co'
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwenBlZm9uaHpvbHl6cWZoYWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwODkwMywiZXhwIjoyMDg1MDg0OTAzfQ.Gia9NNKtNDWUONfhz4VRCXIOZHAWjIUNDYGW4iPSnXo"

console.log('Testing connection with:')
console.log('URL:', url)
console.log('Key:', key.substring(0, 20) + '...')

const supabase = createClient(url, key)

async function test() {
    console.log('Attempting to fetch inventory...')
    const { data, error } = await supabase.from('inventory').select('*').limit(1)

    if (error) {
        console.error('❌ Connection Failed:', error.message)
        console.error('Full Error:', error)
    } else {
        console.log('✅ Connection Successful!')
        console.log('Data found:', data)
    }
}

test()
