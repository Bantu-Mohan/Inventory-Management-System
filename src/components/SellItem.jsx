import React, { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatMoney, formatMoney4 } from '../lib/format'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function SellItem({ inventory, onChanged, lowStockThreshold }) {
  const [mode, setMode] = useState('inventory') // 'inventory' | 'manual'
  const [inventoryId, setInventoryId] = useState('')
  const [quantity, setQuantity] = useState('')

  // Manual State
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')

  const [cart, setCart] = useState([])
  const [busy, setBusy] = useState(false)
  const [previewPdf, setPreviewPdf] = useState(null)
  const [customerMobile, setCustomerMobile] = useState('')

  // Current selection logic
  const selected = useMemo(() => inventory.find((i) => i.id === inventoryId) ?? null, [inventory, inventoryId])

  const computed = useMemo(() => {
    const q = Number(quantity)
    let cpi = NaN

    if (mode === 'inventory') {
      cpi = selected ? Number(selected.cost_per_item) : NaN
    } else {
      cpi = Number(customPrice)
    }

    const total = Number.isFinite(q) && Number.isFinite(cpi) ? q * cpi : NaN
    return { quantity: q, costPerItem: cpi, totalPrice: total }
  }, [quantity, selected, customPrice, mode])

  // Add to Cart Logic
  function addToCart(e) {
    e.preventDefault()
    const q = Number(quantity)
    if (q <= 0) return alert('Quantity must be > 0')

    let newItem = {}

    if (mode === 'inventory') {
      if (!selected) return alert('Select an item')

      // Check Stock
      const inCart = cart.find(c => c.id === selected.id && !c.is_manual)
      const currentCartQty = inCart ? inCart.quantity : 0

      if (q + currentCartQty > selected.total_items) {
        return alert(`Insufficient stock! Combine: ${q + currentCartQty} > Stock: ${selected.total_items}`)
      }

      newItem = {
        id: selected.id,
        item_name: selected.item_name,
        quantity: q,
        cost_per_item: computed.costPerItem,
        total_price: computed.totalPrice,
        is_manual: false
      }
    } else {
      // Manual Mode
      if (!customName.trim()) return alert('Enter Item Name')
      if (!customPrice || Number(customPrice) < 0) return alert('Enter Valid Price')

      newItem = {
        id: `manual-${Date.now()}`,
        item_name: customName,
        quantity: q,
        cost_per_item: computed.costPerItem,
        total_price: computed.totalPrice,
        is_manual: true
      }
    }

    // Merge logic
    const existingIndex = cart.findIndex(c => c.id === newItem.id)
    if (existingIndex >= 0 && !newItem.is_manual) {
      const updatedCart = [...cart]
      const exist = updatedCart[existingIndex]
      updatedCart[existingIndex] = {
        ...exist,
        quantity: exist.quantity + newItem.quantity,
        total_price: (exist.quantity + newItem.quantity) * exist.cost_per_item
      }
      setCart(updatedCart)
    } else {
      setCart([...cart, newItem])
    }

    // Reset Fields
    setQuantity('')
    if (mode === 'inventory') setInventoryId('')
    else {
      setCustomName('')
      setCustomPrice('')
    }
  }

  // Remove from Cart
  function removeFromCart(id) {
    setCart(cart.filter(c => c.id !== id))
  }

  // Generate Mobile-Optimized PDF
  function generatePdfBlob(items, totalAmount, date) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text('Inventory Shop', pageWidth / 2, 28, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Date: ${date.toLocaleString()}`, pageWidth / 2, 34, { align: 'center' })
    doc.text(`Invoice #: ${Date.now().toString().slice(-6)}`, pageWidth / 2, 39, { align: 'center' })
    doc.setTextColor(0)

    const tableColumn = ["Item", "Qty", "Price", "Total"]
    const tableRows = items.map(item => [
      item.item_name + (item.is_manual ? '*' : ''),
      item.quantity.toString(),
      formatMoney(item.cost_per_item),
      formatMoney(item.total_price)
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'plain',
      styles: { fontSize: 12, cellPadding: 4, textColor: [0, 0, 0], valign: 'middle' },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [200, 200, 200] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' }
      },
      didParseCell: function (data) {
        data.cell.styles.lineWidth = { bottom: 0.1 };
        data.cell.styles.lineColor = [220, 220, 220];
      }
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Total Amount:', 14, finalY)
    doc.text(formatMoney(totalAmount), pageWidth - 14, finalY, { align: 'right' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100)
    doc.text('Thank you for your business!', pageWidth / 2, finalY + 15, { align: 'center' })

    return doc.output('blob')
  }

  // Upload to Supabase Storage
  async function uploadReceipt(blob) {
    try {
      const fileName = `receipt_${Date.now()}.pdf`
      const { data, error } = await supabase.storage.from('receipts').upload(fileName, blob, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName)
      return publicUrl
    } catch (err) {
      console.error('Upload failed:', err)
      return null
    }
  }

  // Smart Share Logic
  async function handleSmartShare() {
    if (!previewPdf) return
    const blob = await fetch(previewPdf).then(r => r.blob())

    let rawNumber = customerMobile
    if (!rawNumber) {
      const input = prompt("Enter Customer Mobile Number for Direct WhatsApp:\n(Click Cancel to use Device Share Options)")
      if (input) {
        setCustomerMobile(input)
        rawNumber = input
      }
    }

    let number = rawNumber ? rawNumber.replace(/\D/g, '') : ''

    if (rawNumber && number.length < 10) {
      alert("Please enter a valid 10-digit mobile number to send via WhatsApp.")
      return
    }

    if (number.length === 10) number = '91' + number

    if (number && number.length >= 10) {
      setBusy(true)
      const publicUrl = await uploadReceipt(blob)
      setBusy(false)

      if (publicUrl) {
        const text = encodeURIComponent(`Hello! Here is your receipt from Inventory Shop: ${publicUrl}`)
        const url = `https://wa.me/${number}?text=${text}`
        window.open(url, '_blank')
      } else {
        alert('⚠️ Cloud Upload Failed. Downloading PDF instead.')
        handleWhatsAppManual()
      }
      return
    }

    const file = new File([blob], "receipt_inv_shop.pdf", { type: "application/pdf" })
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Receipt', text: 'Here is your receipt from Inventory Shop.' }) } catch (e) { }
    } else {
      alert('Please enter a mobile number to share via WhatsApp directly.')
    }
  }

  async function handleWhatsAppManual() {
    if (!previewPdf) return
    let number = customerMobile.replace(/\D/g, '')
    if (number.length === 10) number = '91' + number
    const a = document.createElement('a')
    a.href = previewPdf
    a.download = `receipt_${new Date().toISOString().slice(0, 10)}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    const text = encodeURIComponent('Hello! Here is your bill. (Attached manually)')
    const url = number.length > 5 ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`
    setTimeout(() => {
      alert('⚠️ PDF Downloaded!\n\nPlease attach it manually.')
      window.open(url, '_blank')
    }, 800)
  }

  // Checkout
  async function handleCheckout() {
    if (cart.length === 0) return
    const totalAmount = cart.reduce((a, c) => a + c.total_price, 0)

    if (!confirm(`Confirm sale of ${cart.length} items for ${formatMoney(totalAmount)}?`)) return

    setBusy(true)
    try {
      const transactionId = crypto.randomUUID()

      // Process Sale
      for (const item of cart) {
        if (item.is_manual) {
          // Manual Item: Insert Direct (No RPC)
          // Note: We omit inventory_id so it defaults to NULL.
          // This prevents errors if the column is temporarily missing in schema cache.
          const { error } = await supabase.from('sales').insert({
            item_name: item.item_name,
            quantity: item.quantity,
            cost_per_item: item.cost_per_item,
            total_price: item.total_price,
            sold_at: new Date(),
            transaction_id: transactionId
          })
          if (error) throw new Error(`Failed to log manual item ${item.item_name}: ${error.message}`)
        } else {
          // Inventory Item: Use RPC
          // Note: RPC doesn't accept transaction_id yet, so we don't pass it to avoid error.
          const { error } = await supabase.rpc('sell_item', {
            p_inventory_id: item.id,
            p_quantity: Math.trunc(item.quantity)
          })
          if (error) throw new Error(`Failed to sell ${item.item_name}: ${error.message}`)
        }
      }

      // Generate Receipt Blob
      const blob = generatePdfBlob(cart, totalAmount, new Date())
      const url = URL.createObjectURL(blob)
      setPreviewPdf(url)
      setCart([])
      await onChanged()
    } catch (err) {
      console.error(err)
      alert(`Error: ${err.message}\n\n(Tip: You MUST run the SQL script 'supabase/fix_database.sql' in your Supabase Dashboard to enable Manual Sales.)`)
      await onChanged()
    } finally {
      setBusy(false)
    }
  }

  const grandTotal = cart.reduce((acc, item) => acc + item.total_price, 0)

  const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
  const modalContentStyle = { backgroundColor: '#1e293b', padding: 24, borderRadius: 16, width: '100%', height: '90%', maxWidth: 500, display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }

  return (
    <div className="grid two">
      {/* LEFT: Add to Cart Form */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <h2 style={{ margin: 0 }}>Add to Cart</h2>
          <div className="toggle" style={{ display: 'flex', background: '#334155', borderRadius: 8, padding: 4 }}>
            <button
              className={mode === 'inventory' ? 'active' : ''}
              onClick={() => setMode('inventory')}
              style={{ padding: '6px 12px', background: mode === 'inventory' ? '#64748b' : 'transparent', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontWeight: mode === 'inventory' ? 'bold' : 'normal' }}
            >Inventory</button>
            <button
              className={mode === 'manual' ? 'active' : ''}
              onClick={() => setMode('manual')}
              style={{ padding: '6px 12px', background: mode === 'manual' ? '#64748b' : 'transparent', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontWeight: mode === 'manual' ? 'bold' : 'normal' }}
            >Manual Item</button>
          </div>
        </div>

        <form onSubmit={addToCart}>
          {mode === 'inventory' ? (
            <div className="row">
              <div>
                <label>Select Item</label>
                <select value={inventoryId} onChange={(e) => setInventoryId(e.target.value)} disabled={busy}>
                  <option value="">-- Select --</option>
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.item_name} (Stock: {i.total_items})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="row">
              <div>
                <label>Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Samosa, Special Tea"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  disabled={busy}
                  autoFocus
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <label>Price per Item</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>
          )}

          <div className="row cols2" style={{ marginTop: 12 }}>
            <div>
              <label>Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                disabled={busy}
              />
            </div>
            <div>
              <label>Total</label>
              <input value={formatMoney(computed.totalPrice)} disabled readOnly />
            </div>
          </div>

          {mode === 'inventory' && selected && (
            <div style={{ marginTop: 10, marginBottom: 15 }} className="small">
              Avail: {selected.total_items} | Cost: {formatMoney4(selected.cost_per_item)}
            </div>
          )}

          <div className="actions" style={{ marginTop: 20 }}>
            <button className="primary" disabled={busy || (mode === 'inventory' && !selected) || !quantity}>
              {mode === 'inventory' ? 'Add Inventory Item' : 'Add Manual Item'}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT: Cart Summary */}
      <div className="card">
        <h2>Current Bill</h2>
        {cart.length === 0 ? (
          <p className="small" style={{ fontStyle: 'italic', padding: 20, textAlign: 'center' }}>
            No items in bill yet.
          </p>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="right">Cost</th>
                  <th className="right">Qty</th>
                  <th className="right">Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id}>
                    <td>
                      {item.item_name}
                      {item.is_manual && <span style={{ fontSize: '0.7em', color: '#fbbf24', marginLeft: 6 }}>MANUAL</span>}
                    </td>
                    <td className="right">{formatMoney4(item.cost_per_item)}</td>
                    <td className="right">{item.quantity}</td>
                    <td className="right">{formatMoney(item.total_price)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="danger small"
                        style={{ padding: '4px 8px' }}
                        disabled={busy}
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
            <span>Total Amount:</span>
            <span>{formatMoney(grandTotal)}</span>
          </div>

          <button
            onClick={handleCheckout}
            className="primary"
            style={{ width: '100%', marginTop: 15, padding: 15, fontSize: '1.1rem', background: '#4f8cff' }}
            disabled={cart.length === 0 || busy}
          >
            {busy ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>

      {/* PDF PREVIEW MODAL */}
      {previewPdf && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Receipt Generated</h3>
              <button
                onClick={() => { setPreviewPdf(null); URL.revokeObjectURL(previewPdf); setCustomerMobile(''); }}
                className="small"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                Close
              </button>
            </div>

            <iframe
              src={previewPdf}
              style={{ flex: 1, border: 'none', background: '#fff', borderRadius: 8, marginBottom: 16 }}
              title="Receipt Preview"
            />

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#ccc', marginBottom: 8, display: 'block', fontSize: '14px' }}>Customer Mobile Number</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="tel"
                  placeholder="Enter number (e.g. 9876543210)"
                  value={customerMobile}
                  onChange={e => setCustomerMobile(e.target.value)}
                  style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #444', background: '#0f172a', color: '#fff', fontSize: '16px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              <button
                onClick={handleSmartShare}
                className="primary"
                style={{
                  background: '#25D366',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px 20px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 16px -4px rgba(37, 211, 102, 0.4)',
                  border: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>📱</span>
                <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                  {customerMobile ? 'Send PDF via WhatsApp (Direct)' : 'Send PDF Bill via WhatsApp'}
                </span>
              </button>

              <p style={{ fontSize: '11px', color: '#999', textAlign: 'center', margin: 0 }}>
                {customerMobile ? '* Instant Link Send' : '* Enter number above for direct send'}
              </p>

              <button
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = previewPdf
                  a.download = `invoice_${Date.now()}.pdf`
                  a.click()
                }}
                className="small"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: 40 }}
              >
                Download Only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
