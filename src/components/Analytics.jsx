import React, { useMemo } from 'react'
import { formatMoney, formatMoney4 } from '../lib/format'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    Cell
} from 'recharts'

// Enterprise Design System Colors for Charts
const COLORS = ['#5B6DCD', '#4B6A88', '#2E7D32', '#D97706', '#B91C1C']

export default function Analytics({ inventory, sales }) {

    const stats = useMemo(() => {
        // 1. Inventory Value & Alerts
        let totalStockValue = 0
        let lowStockCount = 0
        let outOfStockCount = 0

        inventory.forEach(i => {
            const val = Number(i.total_items) * Number(i.cost_per_item)
            if (!isNaN(val)) totalStockValue += val
            if (Number(i.total_items) === 0) outOfStockCount++
            else if (Number(i.total_items) < 10) lowStockCount++
        })

        // 2. Sales Analysis
        let totalRevenue = 0
        let totalItemsSold = 0
        let totalProfit = 0

        const itemPerformance = {}
        const salesByDate = {} // { "Feb 05": 500 }

        sales.forEach(s => {
            const amount = Number(s.total_price)
            const qty = Number(s.quantity)

            totalRevenue += amount
            totalItemsSold += qty

            // Item Performance
            if (!itemPerformance[s.item_name]) {
                itemPerformance[s.item_name] = { name: s.item_name, qty: 0, revenue: 0 }
            }
            itemPerformance[s.item_name].qty += qty
            itemPerformance[s.item_name].revenue += amount

            // Profit Estimated
            const currentItem = inventory.find(i => i.item_name === s.item_name)
            if (currentItem) {
                const cost = Number(currentItem.cost_per_item) * qty
                totalProfit += (amount - cost)
            }

            // Trend Data
            const dateKey = new Date(s.sold_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            if (!salesByDate[dateKey]) salesByDate[dateKey] = 0
            salesByDate[dateKey] += amount
        })

        // Prepare Arrays
        const topByQty = Object.values(itemPerformance).sort((a, b) => b.qty - a.qty).slice(0, 5)
        const topByRev = Object.values(itemPerformance).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

        // Sort Dates correctly? (Ideally parsing timestamp, but for now simple reverse entry order usually works if SQL is desc)
        // Actually SQL is sold_at DESC. We want Trend to be ASC.
        // Let's rely on salesByDate keys order if sparse? No, better to flip.

        // Better Trend Builder:
        // Create map of last 7 days? Or just all available dates sorted.
        const trendData = Object.keys(salesByDate)
            .map(d => ({ date: d, amount: salesByDate[d] }))
            .reverse() // Assuming sales come new->old, we want graph old->new??
            // Wait, sales.forEach iterates 0..N. If sales is sorted DESC (Newest First), 
            // then salesByDate keys insertion order depends on browser.
            // Let's explicitly sort trendData by parsing date.
            .sort((a, b) => new Date(a.date + " " + new Date().getFullYear()) - new Date(b.date + " " + new Date().getFullYear()))

        // Stock Distribution (Value by Item - Top 10)
        const stockValueDistribution = inventory
            .map(i => ({
                name: i.item_name,
                value: Number(i.total_items) * Number(i.cost_per_item)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10)

        // Manual Sales Analysis
        let manualRevenue = 0
        const manualPerformance = {}
        sales.forEach(s => {
            if (!s.inventory_id) {
                const amount = Number(s.total_price) || 0
                manualRevenue += amount

                const rawName = (s.item_name || 'Unknown').trim()
                const key = rawName.toLowerCase()

                if (!manualPerformance[key]) {
                    const titleCase = rawName.charAt(0).toUpperCase() + rawName.slice(1)
                    manualPerformance[key] = { name: titleCase, value: 0 }
                }
                manualPerformance[key].value += amount
            }
        })
        const topManualByRev = Object.values(manualPerformance)
            .sort((a, b) => b.value - a.value)
            .slice(0, 10)

        return {
            totalStockValue,
            lowStockCount,
            outOfStockCount,
            totalRevenue,
            totalItemsSold,
            totalProfit,
            topByQty,
            topByRev,
            trendData,
            stockValueDistribution,
            manualRevenue,
            topManualByRev
        }
    }, [inventory, sales])

    return (
        <div className="analytics-dashboard">
            {/* STATS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 20 }}>
                <StatCard label="Total Inventory Value" value={formatMoney(stats.totalStockValue)} color="var(--accent)" />
                <StatCard label="Total Revenue" value={formatMoney(stats.totalRevenue)} color="var(--status-success)" />
                <StatCard label="Estimated Profit" value={formatMoney(stats.totalProfit)} color="var(--secondary)" />
                <StatCard label="Manual Sales" value={formatMoney(stats.manualRevenue)} color="var(--status-warning)" />
                <StatCard alert label="Alerts" value={`${stats.outOfStockCount} Out / ${stats.lowStockCount} Low`} color="var(--status-danger)" />
            </div>

            <div className="grid two text-white">
                {/* SALES TREND CHART */}
                <div className="card">
                    <h3>Sales Trend (Revenue)</h3>
                    <div style={{ width: '100%', height: 300, marginTop: 20 }}>
                        <ResponsiveContainer>
                            <LineChart data={stats.trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="date" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" tickFormatter={val => `$${val}`} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                    formatter={(value) => formatMoney(value)}
                                />
                                <Line type="monotone" dataKey="amount" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TOP ITEMS CHART */}
                <div className="card">
                    <h3>Top 5 Items (Revenue)</h3>
                    <div style={{ width: '100%', height: 300, marginTop: 20 }}>
                        <ResponsiveContainer>
                            <BarChart data={stats.topByRev} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                <XAxis type="number" stroke="var(--text-secondary)" />
                                <YAxis type="category" dataKey="name" width={100} stroke="var(--text-secondary)" />
                                <Tooltip
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value) => formatMoney(value)}
                                />
                                <Bar dataKey="revenue" fill="var(--accent)" radius={[0, 4, 4, 0]}>
                                    {stats.topByRev.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* MANUAL SALES BREAKDOWN */}
                {stats.manualRevenue > 0 && (
                    <div className="card">
                        <h3>Top Manual Items</h3>
                        <div style={{ width: '100%', height: 300, marginTop: 20 }}>
                            <ResponsiveContainer>
                                <BarChart data={stats.topManualByRev} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" stroke="var(--text-secondary)" />
                                    <YAxis type="category" dataKey="name" width={100} stroke="var(--text-secondary)" />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(value) => formatMoney(value)}
                                    />
                                    <Bar dataKey="value" fill="var(--status-warning)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* STOCK VALUE DISTRIBUTION */}
                <div className="card">
                    <h3>High Value Inventory</h3>
                    <div style={{ width: '100%', height: 300, marginTop: 20 }}>
                        <ResponsiveContainer>
                            <BarChart data={stats.stockValueDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" />
                                <Tooltip
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                    formatter={(value) => formatMoney(value)}
                                />
                                <Bar dataKey="value" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TOP 5 QTY TABLE */}
                <div className="card">
                    <h3>Most Sold Items (Qty)</h3>
                    <table className="compact" style={{ marginTop: 20 }}>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th className="right">Qty Sold</th>
                                <th className="right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.topByQty.map(i => (
                                <tr key={i.name}>
                                    <td>{i.name}</td>
                                    <td className="right" style={{ fontWeight: 'bold' }}>{Number(i.qty).toLocaleString()}</td>
                                    <td className="right">{formatMoney(i.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, color, alert }) {
    return (
        <div style={{
            background: alert ? 'rgba(185, 28, 28, 0.08)' : 'var(--surface)',
            padding: 20,
            borderRadius: 12,
            borderLeft: `4px solid ${color}`,
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: color }}>{value}</div>
        </div>
    )
}
