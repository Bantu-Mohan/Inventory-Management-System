import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    async function handleLogin(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error
            // Session is handled automatically by onAuthStateChange in App.jsx
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container" style={{ paddingTop: '10vh', maxWidth: 400 }}>
            <header className="header" style={{ justifyContent: 'center', marginBottom: 30 }}>
                <h1 style={{ fontSize: '2rem' }}>🔐 Inventory Login</h1>
            </header>

            <div className="panel" style={{ padding: 30 }}>
                <form onSubmit={handleLogin}>
                    {error && (
                        <div className="notice danger" style={{ marginBottom: 20 }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 8 }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div style={{ marginBottom: 30 }}>
                        <label style={{ display: 'block', marginBottom: 8 }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button className="primary" style={{ width: '100%', fontSize: '1.1rem' }} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, color: '#666', fontSize: 13 }}>
                Protected System
            </div>
        </div>
    )
}
