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

const COLORS = ['#4f8cff', '#4dffb5', '#ffd700', '#ff6b6b', '#a855f7']

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
                if (!manualPerformance[s.item_name]) manualPerformance[s.item_name] = 0
                manualPerformance[s.item_name] += amount
            }
        })
        const topManualByRev = Object.keys(manualPerformance)
            .map(k => ({ name: k, value: manualPerformance[k] }))
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
                <StatCard label="Total Inventory Value" value={formatMoney(stats.totalStockValue)} color="#4f8cff" />
                <StatCard label="Total Revenue" value={formatMoney(stats.totalRevenue)} color="#4dffb5" />
                <StatCard label="Estimated Profit" value={formatMoney(stats.totalProfit)} color="#ffd700" />
                <StatCard label="Manual Sales" value={formatMoney(stats.manualRevenue)} color="#fbbf24" />
                <StatCard alert label="Alerts" value={`${stats.outOfStockCount} Out / ${stats.lowStockCount} Low`} color="#ff6b6b" />
            </div>

            <div className="grid two text-white">
                {/* SALES TREND CHART */}
                <div className="card">
                    <h3>Sales Trend (Revenue)</h3>
                    <div style={{ width: '100%', height: 300, marginTop: 20 }}>
                        <ResponsiveContainer>
                            <LineChart data={stats.trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="date" stroke="#888" />
                                <YAxis stroke="#888" tickFormatter={val => `$${val}`} />
                                <Tooltip
                                    contentStyle={{ background: '#333', border: 'none' }}
                                    formatter={(value) => formatMoney(value)}
                                />
                                <Line type="monotone" dataKey="amount" stroke="#4dffb5" strokeWidth={3} dot={{ r: 4 }} />
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
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" horizontal={false} />
                                <XAxis type="number" stroke="#888" />
                                <YAxis type="category" dataKey="name" width={100} stroke="#888" />
                                <Tooltip
                                    contentStyle={{ background: '#333', border: 'none' }}
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value) => formatMoney(value)}
                                />
                                <Bar dataKey="revenue" fill="#4f8cff" radius={[0, 4, 4, 0]}>
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" horizontal={false} />
                                    <XAxis type="number" stroke="#888" />
                                    <YAxis type="category" dataKey="name" width={100} stroke="#888" />
                                    <Tooltip
                                        contentStyle={{ background: '#333', border: 'none' }}
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(value) => formatMoney(value)}
                                    />
                                    <Bar dataKey="value" fill="#fbbf24" radius={[0, 4, 4, 0]} />
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
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="name" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{ background: '#333', border: 'none' }}
                                    formatter={(value) => formatMoney(value)}
                                />
                                <Bar dataKey="value" fill="#ffd700" radius={[4, 4, 0, 0]} />
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
            background: alert ? 'rgba(255, 60, 60, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            padding: 20,
            borderRadius: 12,
            borderLeft: `4px solid ${color}`,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: color }}>{value}</div>
        </div>
    )
}
