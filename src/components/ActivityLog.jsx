import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ActivityLog({ busy }) {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    // Fetch logs on mount and when busy changes (refresh signal)
    useEffect(() => {
        fetchLogs()
    }, [busy])

    async function fetchLogs() {
        setLoading(true)
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100)

        if (error) {
            console.error('Error fetching logs:', error)
        } else {
            setLogs(data || [])
        }
        setLoading(false)
    }

    const typeClasses = {
        'CREATE': 'success',
        'ADD_STOCK': 'info',
        'STOCK_REMOVED': 'warning',
        'UPDATE': 'info',
        'DELETE': 'danger'
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>Inventory Activity Log</h2>
                <button onClick={fetchLogs} className="small" disabled={loading}>
                    Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>Loading activity...</div>
            ) : (
                <div className="tableWrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Action</th>
                                <th>Item</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="small" style={{ textAlign: 'center' }}>
                                        No activity recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="small" style={{ whiteSpace: 'nowrap' }}>
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`pill ${typeClasses[log.action_type] || ''}`}>
                                                {log.action_type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{log.item_name}</td>
                                        <td className="small">{log.details}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
