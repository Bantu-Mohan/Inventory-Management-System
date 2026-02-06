import React, { useMemo, useState } from 'react'
import { formatDateTime, formatMoney, formatMoney4 } from '../lib/format'

export default function SalesHistory({ sales, onRefresh, busy }) {
  const [expanded, setExpanded] = useState({})

  const groups = useMemo(() => {
    const map = new Map()

    // Process sales to group by transaction_id
    sales.forEach(s => {
      const txId = s.transaction_id || `legacy-${s.id}`
      if (!map.has(txId)) {
        map.set(txId, {
          id: txId,
          isLegacy: !s.transaction_id,
          date: s.sold_at || s.created_at || new Date().toISOString(),
          total: 0,
          items: []
        })
      }

      const group = map.get(txId)
      group.items.push(s)
      group.total += Number(s.total_price)
    })

    // Sort by date descending
    return Array.from(map.values()).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    )
  }, [sales])

  const stats = useMemo(() => {
    let total = 0
    let manualTotal = 0
    let inventoryTotal = 0
    let manualCount = 0
    const manualBreakdown = {}

    sales.forEach(s => {
      const p = Number(s.total_price) || 0
      const qty = Number(s.quantity) || 0
      total += p

      if (!s.inventory_id) {
        // Manual
        manualTotal += p
        manualCount += 1

        // Normalize name: lowercase and trim key, but keep original name if better
        const rawName = (s.item_name || 'Unknown').trim()
        const key = rawName.toLowerCase()

        if (!manualBreakdown[key]) {
          // Init with Title Case preference
          const titleCase = rawName.charAt(0).toUpperCase() + rawName.slice(1)
          manualBreakdown[key] = { name: titleCase, qty: 0, revenue: 0 }
        }
        manualBreakdown[key].qty += qty
        manualBreakdown[key].revenue += p
      } else {
        inventoryTotal += p
      }
    })

    const topManual = Object.values(manualBreakdown)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 20)

    return { total, manualTotal, inventoryTotal, manualCount, topManual }
  }, [sales])

  const toggle = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="grid">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Sales Overview</h2>
          <button onClick={onRefresh} disabled={busy}>
            Refresh
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 4 }}>Total Revenue</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{formatMoney(stats.total)}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 4 }}>Inventory Sales</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>{formatMoney(stats.inventoryTotal)}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 4 }}>Manual Sales</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{formatMoney(stats.manualTotal)}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{stats.manualCount} transactions</div>
          </div>
        </div>

        {/* Manual Breakdown */}
        {stats.topManual.length > 0 && (
          <div style={{ marginBottom: 24, padding: 16, background: 'rgba(251, 191, 36, 0.05)', borderRadius: 12, border: '1px solid rgba(251, 191, 36, 0.1)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#fbbf24', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Manual Items</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {stats.topManual.map((item, i) => (
                <div key={i} style={{ background: '#1e293b', padding: '6px 12px', borderRadius: 20, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #334155' }}>
                  <span style={{ color: '#fff' }}>{item.name}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.8em' }}>x{item.qty}</span>
                  <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{formatMoney(item.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History List */}
        <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Transaction History</h3>
        <div className="tableWrap">
          {groups.length === 0 ? (
            <div className="small" style={{ padding: 20, textAlign: 'center' }}>No sales recorded.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {groups.map(group => (
                <div key={group.id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {/* Header Row */}
                  <div
                    onClick={() => toggle(group.id)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      padding: '10px 15px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      userSelect: 'none'
                    }}
                  >
                    <div>
                      <strong>{formatDateTime(group.date)}</strong>
                      <span className="small" style={{ marginLeft: 10, opacity: 0.7 }}>
                        {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <strong>{formatMoney(group.total)}</strong>
                      <span style={{ transform: expanded[group.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expanded[group.id] && (
                    <div style={{ padding: 0 }}>
                      <table style={{ margin: 0 }}>
                        <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                          <tr>
                            <th style={{ paddingLeft: 20 }}>Item Name</th>
                            <th className="right">Cost/Item</th>
                            <th className="right">Qty</th>
                            <th className="right" style={{ paddingRight: 20 }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map(item => (
                            <tr key={item.id}>
                              <td style={{ paddingLeft: 20 }}>
                                {item.item_name}
                                {!item.inventory_id && <span style={{ fontSize: '0.7em', color: '#fbbf24', marginLeft: 6, border: '1px solid #fbbf24', borderRadius: 4, padding: '1px 3px' }}>MANUAL</span>}
                              </td>
                              <td className="right">
                                {item.quantity > 0
                                  ? formatMoney4(item.total_price / item.quantity)
                                  : '-'}
                              </td>
                              <td className="right">{Number(item.quantity).toLocaleString()}</td>
                              <td className="right" style={{ paddingRight: 20 }}>{formatMoney(item.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
