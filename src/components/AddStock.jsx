import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

function parseNumber(value) {
    if (value === '' || value === null) return 0
    return Number(value)
}

export default function AddStock({ inventory, onChanged }) {
    const [selectedId, setSelectedId] = useState('')
    const [packets, setPackets] = useState('')
    const [loose, setLoose] = useState('')
    const [customPerPacket, setCustomPerPacket] = useState('')
    const [lastAction, setLastAction] = useState(null)
    const [busy, setBusy] = useState(false)

    const selectedItem = inventory.find(i => i.id === selectedId)

    const handleItemChange = (e) => {
        const newId = e.target.value
        setSelectedId(newId)
        const item = inventory.find(i => i.id === newId)
        if (item) {
            setCustomPerPacket(String(item.items_per_packet || 1))
        } else {
            setCustomPerPacket('')
        }
    }

    async function handleAddStock(e) {
        e.preventDefault()
        if (!selectedItem) return

        const numPackets = parseNumber(packets)
        const numLoose = parseNumber(loose)
        const perPacket = parseNumber(customPerPacket)

        if (numPackets === 0 && numLoose === 0) {
            alert('Please enter some stock to add')
            return
        }

        if (numPackets > 0 && perPacket <= 0) {
            alert('Items per packet must be greater than 0')
            return
        }

        const addedTotal = (numPackets * perPacket) + numLoose

        setBusy(true)
        try {
            const { error } = await supabase.rpc('add_stock', {
                p_item_id: selectedId,
                p_quantity: addedTotal
            })

            if (error && error.code === '42883') {
                // Fallback if RPC missing
                const { error: updateError } = await supabase
                    .from('inventory')
                    .update({
                        total_items: selectedItem.total_items + addedTotal,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', selectedId)
                if (updateError) throw updateError
            } else if (error) {
                throw error
            }

            // Success feedback
            const newTotal = selectedItem.total_items + addedTotal
            setLastAction({
                itemName: selectedItem.item_name,
                added: addedTotal,
                newTotal: newTotal,
                time: new Date().toLocaleTimeString()
            })

            // Clear inputs but keep selection
            setPackets('')
            setLoose('')
            await onChanged()
        } catch (err) {
            alert(err.message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="card">
            <h2>Add Stock (Received Shipment)</h2>
            <form onSubmit={handleAddStock}>
                <div className="row">
                    <div>
                        <label>Select Item</label>
                        <select
                            value={selectedId}
                            onChange={handleItemChange}
                            disabled={busy}
                        >
                            <option value="">-- Choose Item --</option>
                            {inventory.map(i => (
                                <option key={i.id} value={i.id}>
                                    {i.item_name} (Current: {i.total_items})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedItem && (
                    <div className="row cols3" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10, display: 'grid' }}>
                        <div>
                            <label>Add Packets</label>
                            <input
                                type="number"
                                value={packets}
                                onChange={e => setPackets(e.target.value)}
                                placeholder="0"
                                min="0"
                            />
                        </div>
                        <div>
                            <label>Items per Packet</label>
                            <input
                                type="number"
                                value={customPerPacket}
                                onChange={e => setCustomPerPacket(e.target.value)}
                                min="1"
                            />
                        </div>
                        <div>
                            <label>Add Loose Items</label>
                            <input
                                type="number"
                                value={loose}
                                onChange={e => setLoose(e.target.value)}
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>
                )}

                {selectedItem && (
                    <div className="small" style={{ marginBottom: 20, marginTop: 10 }}>
                        Will add <strong>{(parseNumber(packets) * parseNumber(customPerPacket)) + parseNumber(loose)}</strong> total items to inventory.
                    </div>
                )}

                <div className="actions">
                    <button className="primary" disabled={busy || !selectedId}>
                        {busy ? 'Adding...' : 'Add Stock'}
                    </button>
                </div>

                {lastAction && (
                    <div className="notice success" style={{ marginTop: 20, background: 'rgba(0, 255, 128, 0.1)', border: '1px solid rgba(0, 255, 128, 0.3)', padding: 12, borderRadius: 8 }}>
                        <strong style={{ color: '#4dffb5' }}>Success!</strong>
                        <div style={{ marginTop: 4 }}>
                            Added <strong>{lastAction.added}</strong> items to <strong>{lastAction.itemName}</strong>.
                        </div>
                        <div style={{ marginTop: 4 }}>
                            New Total Stock: <strong>{lastAction.newTotal} {lastAction.itemName}</strong>
                        </div>
                        <div className="small" style={{ marginTop: 4, opacity: 0.7 }}>
                            Update time: {lastAction.time}
                        </div>
                    </div>
                )}
            </form>
        </div>
    )
}
