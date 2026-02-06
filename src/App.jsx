import { useState, useEffect } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import Login from './components/Login'
import Inventory from './components/Inventory'
import AddStock from './components/AddStock'
import SellItem from './components/SellItem'
import SalesHistory from './components/SalesHistory'
import Analytics from './components/Analytics'
import ActivityLog from './components/ActivityLog'

const VIEWS = [
    { id: 0, label: 'Inventory', icon: '📦', type: 'primary', color: 'inventory' },
    { id: 1, label: 'Add Stock', icon: '➕', type: 'primary', color: 'green' },
    { id: 2, label: 'Sell Item', icon: '💰', type: 'primary', color: 'blue' },
    { id: 3, label: 'Sales History', icon: '🧾', type: 'secondary' },
    { id: 4, label: 'Analytics', icon: '📊', type: 'secondary' },
    { id: 5, label: 'Activity Log', icon: '🕒', type: 'secondary' },
]

const LOW_STOCK_THRESHOLD = parseInt(import.meta.env.VITE_LOW_STOCK_THRESHOLD || '10', 10)

export default function App() {
    if (!isConfigured) {
        return (
            <div className="container" style={{ paddingTop: 60, textAlign: 'center' }}>
                <header className="header" style={{ justifyContent: 'center' }}>
                    <h1>📦 Inventory Management</h1>
                </header>
                <div className="panel" style={{ padding: 40, maxWidth: 600, margin: '0 auto' }}>
                    <h2>⚠️ Setup Required</h2>
                    <p>The app cannot connect to the database because the API keys are missing.</p>
                    {/* ... */}
                    <button onClick={() => window.location.reload()} className="primary">
                        I've added the file, Reload
                    </button>
                </div>
            </div>
        )
    }

    const [session, setSession] = useState(null)
    const [tab, setTab] = useState(0)
    const [inventory, setInventory] = useState([])
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)


    // Auth Listener
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Fetch inventory data
    const fetchInventory = async () => {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('item_name')
        if (error) {
            console.error('Error fetching inventory:', error)
            setError(error.message)
        } else {
            setInventory(data || [])
            setError(null)
        }
    }

    // Fetch sales data
    const fetchSales = async () => {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('sold_at', { ascending: false })
        if (error) {
            console.error('Error fetching sales:', error)
        } else {
            setSales(data || [])
        }
    }

    // Initial data load (Only if session exists)
    useEffect(() => {
        if (!session) return

        const loadData = async () => {
            setLoading(true)
            await Promise.all([fetchInventory(), fetchSales()])
            setLoading(false)
        }
        loadData()
    }, [session])

    // Refresh data after actions
    const refreshData = async () => {
        setBusy(true)
        await Promise.all([fetchInventory(), fetchSales()])
        setBusy(false)
    }

    if (!session) {
        return <Login />
    }

    return (
        <div className="container">
            <header className="header">
                <div className="brand">
                    <h1>📦 Inventory Management</h1>
                    <p>Track stock, sell items, view sales history</p>
                </div>
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="small"
                    style={{ background: 'transparent', border: '1px solid var(--border)' }}
                >
                    Sign Out
                </button>
            </header>

            <main className="panel">
                <nav className="nav-container">
                    {/* Primary Actions (Cards) */}
                    <div className="nav-primary">
                        {VIEWS.filter(v => v.type === 'primary').map(view => (
                            <button
                                key={view.id}
                                className={`nav-btn primary-action ${view.color} ${tab === view.id ? 'active' : ''}`}
                                onClick={() => setTab(view.id)}
                            >
                                <span style={{ fontSize: '24px' }}>{view.icon}</span>
                                <span>{view.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Secondary Actions (List/Pills) */}
                    <div className="nav-secondary">
                        {VIEWS.filter(v => v.type === 'secondary').map(view => (
                            <button
                                key={view.id}
                                className={`nav-btn secondary-action ${tab === view.id ? 'active' : ''}`}
                                onClick={() => setTab(view.id)}
                            >
                                <span>{view.icon}</span>
                                <span>{view.label}</span>
                            </button>
                        ))}
                    </div>
                </nav>

                {/* DEBUG INFO */}
                <div style={{ padding: 10, fontSize: 10, color: '#666', textAlign: 'center' }}>
                    User: {session.user.email}
                </div>

                <div className="content">
                    {error && (
                        <div className="notice danger" style={{ marginBottom: 20 }}>
                            <strong>Database Error:</strong> {error}
                        </div>
                    )}

                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '40px' }}>Loading Data...</p>
                    ) : (
                        <>
                            {tab === 0 && (
                                <Inventory
                                    inventory={inventory}
                                    onChanged={refreshData}
                                    lowStockThreshold={LOW_STOCK_THRESHOLD}
                                />
                            )}
                            {tab === 1 && (
                                <AddStock
                                    inventory={inventory}
                                    onChanged={refreshData}
                                />
                            )}
                            {tab === 2 && (
                                <SellItem
                                    inventory={inventory}
                                    onChanged={refreshData}
                                    lowStockThreshold={LOW_STOCK_THRESHOLD}
                                />
                            )}
                            {tab === 3 && (
                                <SalesHistory
                                    sales={sales}
                                    onRefresh={refreshData}
                                    busy={busy}
                                />
                            )}
                            {tab === 4 && (
                                <Analytics
                                    inventory={inventory}
                                    sales={sales}
                                />
                            )}
                            {tab === 5 && (
                                <ActivityLog busy={busy} />
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
