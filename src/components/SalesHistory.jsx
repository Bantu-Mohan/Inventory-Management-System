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

  const toggle = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="grid">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Sales History</h2>
          <button onClick={onRefresh} disabled={busy}>
            Refresh
          </button>
        </div>

        <div className="tableWrap" style={{ marginTop: 12 }}>
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
                              <td style={{ paddingLeft: 20 }}>{item.item_name}</td>
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
