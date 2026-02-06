import React, { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatMoney4 } from '../lib/format'

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) return 0
  const n = Number(value)
  return isNaN(n) ? 0 : n
}

export default function Inventory({ inventory, onChanged, lowStockThreshold }) {
  const [mode, setMode] = useState('create')
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    item_name: '',
    number_of_packets: '',
    items_per_packet: '',
    cost_per_item: '', // Changed from cost_per_packet
  })

  const lowStockItems = useMemo(() => {
    return inventory.filter((i) => Number(i.total_items) <= lowStockThreshold)
  }, [inventory, lowStockThreshold])

  async function upsertItem(e) {
    e.preventDefault()

    const item_name = form.item_name.trim()
    const number_of_packets = parseNumber(form.number_of_packets)
    const items_per_packet = parseNumber(form.items_per_packet)
    const loose_items = parseNumber(form.loose_items) // New field
    const cost_per_item = parseNumber(form.cost_per_item)

    if (!item_name) {
      alert('Item name is required')
      return
    }

    // ... validations

    const total_items = Math.round((number_of_packets * items_per_packet) + loose_items)

    if (cost_per_item <= 0) {
      if (!confirm("Warning: Cost/Price per item is 0. This item will be sold for FREE (Revenue = 0). Are you sure?")) {
        return
      }
    }

    setBusy(true)
    try {
      // We don't need to store loose_items column, just total_items
      const payload = {
        item_name,
        number_of_packets: Math.trunc(number_of_packets),
        items_per_packet: Math.trunc(items_per_packet),
        cost_per_item,
        total_items,
      }

      if (mode === 'create') {
        const { error } = await supabase.from('inventory').insert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('inventory')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingId)
        if (error) throw error
      }

      setForm({ item_name: '', number_of_packets: '', items_per_packet: '', loose_items: '', cost_per_item: '' })
      setMode('create')
      setEditingId(null)
      await onChanged()
    } catch (err) {
      if (err.code === '23505') {
        alert('Error: Item name already exists. Please choose a different name.')
      } else {
        alert(err?.message ?? 'Failed to save inventory item')
      }
    } finally {
      setBusy(false)
    }
  }

  function startEdit(item) {
    setMode('edit')
    setEditingId(item.id)

    // User Update Request: Show ALL stock in "Loose Items" initially
    const total = item.total_items || 0

    setForm({
      item_name: item.item_name ?? '',
      number_of_packets: '0', // Reset packets to 0 visually
      items_per_packet: String(item.items_per_packet ?? ''),
      loose_items: String(total), // Put EVERYTHING here
      cost_per_item: String(item.cost_per_item ?? ''),
    })
  }

  function cancelEdit() {
    setMode('create')
    setEditingId(null)
    setForm({ item_name: '', number_of_packets: '', items_per_packet: '', loose_items: '', cost_per_item: '' })
  }

  async function deleteItem(item) {
    const ok = confirm(`Delete "${item.item_name}"? This will NOT delete existing sales history.`)
    if (!ok) return

    setBusy(true)
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', item.id)
      if (error) throw error
      await onChanged()
    } catch (err) {
      alert(err?.message ?? 'Failed to delete inventory item')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid two">
      <div className="card">
        <h2>{mode === 'create' ? 'Add Inventory Item' : 'Edit Inventory Item'}</h2>
        <form onSubmit={upsertItem}>
          <div className="row">
            <div>
              <label>Item Name</label>
              <input
                value={form.item_name}
                onChange={(e) => setForm((s) => ({ ...s, item_name: e.target.value }))}
                placeholder="e.g. Soap"
                disabled={busy}
              />
            </div>
          </div>

          <div className="row cols2">
            <div>
              <label>Number of Packets</label>
              <input
                type="number"
                value={form.number_of_packets}
                onChange={(e) => setForm((s) => ({ ...s, number_of_packets: e.target.value }))}
                placeholder="0"
                disabled={busy}
                min={0}
                step={1}
              />
            </div>
            <div>
              <label>Items per Packet</label>
              <input
                type="number"
                value={form.items_per_packet}
                onChange={(e) => setForm((s) => ({ ...s, items_per_packet: e.target.value }))}
                placeholder="1"
                disabled={busy}
                min={1}
                step={1}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label>Loose Items (Open Packet)</label>
              <input
                type="number"
                value={form.loose_items}
                onChange={(e) => setForm((s) => ({ ...s, loose_items: e.target.value }))}
                placeholder="0"
                disabled={busy}
                min={0}
                step={1}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label>Cost per Item</label> {/* Label Change */}
              <input
                type="number"
                value={form.cost_per_item}
                onChange={(e) => setForm((s) => ({ ...s, cost_per_item: e.target.value }))}
                placeholder="0"
                disabled={busy}
                min={0}
                step="0.01"
              />
            </div>
          </div>

          <div className="small" style={{ marginTop: 10 }}>
            Total items =
            <span style={{ color: 'var(--text)' }}> (Packets * Items/Pack) + Loose Items</span>
          </div>


          <div className="actions">
            <button className="primary" disabled={busy} type="submit">
              {busy ? 'Saving…' : mode === 'create' ? 'Add Item' : 'Save Changes'}
            </button>
            {mode === 'edit' ? (
              <button type="button" disabled={busy} onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Inventory</h2>

        {lowStockItems.length > 0 ? (
          <div className="notice warn">
            <div>
              <strong>Low stock alert</strong>
              <div className="small">
                {lowStockItems
                  .slice(0, 3)
                  .map((i) => `${i.item_name} (${i.total_items})`)
                  .join(', ')}
                {lowStockItems.length > 3 ? ` +${lowStockItems.length - 3} more` : ''}
              </div>
            </div>
            <span className="pill low">threshold: {lowStockThreshold}</span>
          </div>
        ) : null}

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th className="right">Total Items Available</th>
                <th className="right">Cost Per Item</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="small">
                    No inventory items yet.
                  </td>
                </tr>
              ) : (
                inventory.map((i) => {
                  const isLow = Number(i.total_items) <= lowStockThreshold
                  return (
                    <tr key={i.id}>
                      <td>
                        {i.item_name}{' '}
                        {isLow ? <span className="pill low" style={{ marginLeft: 8 }}>low</span> : null}
                      </td>
                      <td className="right">{Number(i.total_items).toLocaleString()}</td>
                      <td className="right">{formatMoney4(i.cost_per_item)}</td>
                      <td>
                        <div className="actions" style={{ marginTop: 0 }}>
                          <button disabled={busy} onClick={() => startEdit(i)}>
                            Edit
                          </button>
                          <button className="danger" disabled={busy} onClick={() => deleteItem(i)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="small" style={{ marginTop: 12 }}>
          Costs displayed as per-item cost. Sales use the stored cost per item automatically.
        </div>
      </div>
    </div>
  )
}
