import React, { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatMoney, formatMoney4 } from '../lib/format'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function SellItem({ inventory, onChanged, lowStockThreshold }) {
  const [inventoryId, setInventoryId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [cart, setCart] = useState([]) // [{ id, item_name, quantity, cost_per_item, total_price }]
  const [busy, setBusy] = useState(false)
  const [previewPdf, setPreviewPdf] = useState(null) // Blob URL for preview
  const [customerMobile, setCustomerMobile] = useState('')

  // Current selection logic
  const selected = useMemo(() => inventory.find((i) => i.id === inventoryId) ?? null, [inventory, inventoryId])

  const computed = useMemo(() => {
    const q = Number(quantity)
    const cpi = selected ? Number(selected.cost_per_item) : NaN
    const total = Number.isFinite(q) && Number.isFinite(cpi) ? q * cpi : NaN
    return { quantity: q, costPerItem: cpi, totalPrice: total }
  }, [quantity, selected])

  // Add to Cart Logic
  function addToCart(e) {
    e.preventDefault()
    if (!selected) return alert('Select an item')
    const q = Number(quantity)
    if (q <= 0) return alert('Quantity must be > 0')

    const inCart = cart.find(c => c.id === selected.id)
    const currentCartQty = inCart ? inCart.quantity : 0

    if (q + currentCartQty > selected.total_items) {
      return alert(`Insufficient stock! You have ${selected.total_items}, cart has ${currentCartQty}, trying to add ${q}.`)
    }

    if (inCart) {
      setCart(cart.map(c => c.id === selected.id ? {
        ...c,
        quantity: c.quantity + q,
        total_price: (c.quantity + q) * c.cost_per_item
      } : c))
    } else {
      setCart([...cart, {
        id: selected.id,
        item_name: selected.item_name,
        quantity: q,
        cost_per_item: computed.costPerItem,
        total_price: computed.totalPrice
      }])
    }

    setQuantity('')
    setInventoryId('')
  }

  // Remove from Cart
  function removeFromCart(id) {
    setCart(cart.filter(c => c.id !== id))
  }

  // Generate PDF Blob
  function generatePdfBlob(items, totalAmount, date) {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(22)
    doc.text('Inventory Shop', 105, 15, { align: 'center' })

    doc.setFontSize(12)
    doc.text('Sales Receipt', 105, 22, { align: 'center' })

    doc.setFontSize(10)
    doc.text(`Date: ${date.toLocaleString()}`, 14, 30)

    // Table
    const tableColumn = ["Item", "Qty", "Price", "Total"]
    const tableRows = items.map(item => [
      item.item_name,
      item.quantity.toString(),
      formatMoney(item.cost_per_item),
      formatMoney(item.total_price)
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      styles: { fontSize: 10, cellPadding: 3 },
    })

    // Total
    const finalY = doc.lastAutoTable.finalY || 40
    doc.setFontSize(14)
    doc.text(`Grand Total: ${formatMoney(totalAmount)}`, 14, finalY + 10)

    doc.setFontSize(10)
    doc.text('Thank you for your business!', 105, finalY + 20, { align: 'center' })

    return doc.output('blob')
  }

  // Upload to Supabase Storage
  async function uploadReceipt(blob) {
    try {
      const fileName = `receipt_${Date.now()}.pdf`
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err) {
      console.error('Upload failed:', err)
      return null
    }
  }

  // Smart Share Logic (now with Link Support)
  async function handleSmartShare() {
    if (!previewPdf) return

    const blob = await fetch(previewPdf).then(r => r.blob())
    const file = new File([blob], "receipt_inv_shop.pdf", { type: "application/pdf" })

    // 1. Try Native Share First (Mobile App - Best Experience)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Receipt',
          text: 'Here is your receipt from Inventory Shop.'
        })
        return
      } catch (e) {
        console.warn('Native share cancelled/failed', e)
      }
    }

    // 2. Fallback: Upload & Send Link (Works on Desktop & Mobile Web)
    // Check if we have a number to make it "Direct"
    let number = customerMobile.replace(/\D/g, '')
    if (number.length === 10) number = '91' + number

    const proceed = confirm(`Native sharing unavailable.\n\nDo you want to upload the receipt and send a LINK via WhatsApp?\n\n(This sends directly without manual attachment)`)

    if (proceed) {
      setBusy(true) // Reuse busy state or local
      const publicUrl = await uploadReceipt(blob)
      setBusy(false)

      if (publicUrl) {
        // Success: Send Link
        const text = encodeURIComponent(`Hello! Here is your receipt from Inventory Shop: ${publicUrl}`)
        const url = number.length > 5
          ? `https://wa.me/${number}?text=${text}`
          : `https://wa.me/?text=${text}`

        window.open(url, '_blank')
      } else {
        // Fail: Fallback to Manual logic
        alert('⚠️ Cloud Upload Failed (Bucket might be missing). Switch to manual mode.')
        handleWhatsAppManual()
      }
    } else {
      handleWhatsAppManual()
    }
  }

  // Manual Fallback (Old Logic)
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
    const url = number.length > 5
      ? `https://wa.me/${number}?text=${text}`
      : `https://wa.me/?text=${text}`

    setTimeout(() => {
      alert('⚠️ PDF Downloaded!\n\nWhatsApp Web cannot attach files automatically.\n\nPlease drag/attach the downloaded receipt into the chat manually.')
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
      // Process Sale
      for (const item of cart) {
        const { error } = await supabase.rpc('sell_item', {
          p_inventory_id: item.id,
          p_quantity: Math.trunc(item.quantity)
        })
        if (error) throw new Error(`Failed to sell ${item.item_name}: ${error.message}`)
      }

      // Generate Receipt Blob
      const blob = generatePdfBlob(cart, totalAmount, new Date())
      const url = URL.createObjectURL(blob)
      setPreviewPdf(url)

      setCart([])
      await onChanged()
      // Don't auto download, show modal
    } catch (err) {
      alert(err.message)
      await onChanged()
    } finally {
      setBusy(false)
    }
  }

  const grandTotal = cart.reduce((acc, item) => acc + item.total_price, 0)

  // Modal Style
  const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20
  }
  const modalContentStyle = {
    backgroundColor: '#1e293b', padding: 24, borderRadius: 16,
    width: '100%', height: '90%', maxWidth: 500, display: 'flex', flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  }

  return (
    <div className="grid two">
      {/* LEFT: Add to Cart Form */}
      <div className="card">
        <h2>Add to Cart</h2>
        <form onSubmit={addToCart}>
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

          <div className="row cols2">
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
              <label>Price</label>
              <input value={formatMoney(computed.totalPrice)} disabled readOnly />
            </div>
          </div>

          {selected && (
            <div style={{ marginTop: 10, marginBottom: 15 }} className="small">
              Avail: {selected.total_items} | Cost: {formatMoney4(selected.cost_per_item)}
            </div>
          )}

          <div className="actions">
            <button className="primary" disabled={busy || !selected || !quantity}>
              Add to Bill
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
                    <td>{item.item_name}</td>
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
              {/* Primary Action Button */}
              <button
                onClick={handleSmartShare}
                className="primary"
                style={{ background: '#25D366', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, padding: 16 }}
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📱</span>
                <span style={{ fontWeight: 'bold' }}>
                  {customerMobile ? 'Send via WhatsApp' : 'Share Receipt'}
                </span>
              </button>

              <p style={{ fontSize: '11px', color: '#999', textAlign: 'center', margin: 0 }}>
                * On Mobile: File attaches automatically.<br />
                * On Desktop: File downloads, attach manually.
              </p>

              <a
                href={previewPdf}
                download={`receipt_${new Date().toISOString().slice(0, 10)}.pdf`}
                style={{ textDecoration: 'none' }}
              >
                <button style={{ width: '100%', background: 'rgba(255,255,255,0.1)' }}>Download PDF Only</button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
