import React, { useEffect, useState } from 'react';
import { Users, Store, UtensilsCrossed, ShoppingCart, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import '../styles/dashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_users: 0,
        total_canteens: 0,
        total_food_items: 0,
        total_orders: 0,
        orders_today: 0,
        total_sales: 0,
        monthly_sales: 0,
        today_sales: 0,
        avg_order_value: 0,
        pending_orders: 0,
        completed_orders: 0,
        rejected_orders: 0,
        esewa_orders: 0,
        cash_orders: 0,
        esewa_revenue: 0,
        cash_revenue: 0,
        daily_sales: [],
        canteen_sales: [],
        recent_activities: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('admin/dashboard/');
                setStats(res.data);
            } catch (error) {
                console.error('Error fetching admin dashboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="loading-spinner"></div>;

    const chartData = stats.daily_sales.map(d => ({
        name: d.date,
        sales: d.amount,
    }));

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title admin-title">Admin Dashboard</h1>
                    <p className="login-subtitle">Overview of all canteen operations</p>
                </div>
            </header>

            {/* Top Overview Cards */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card admin-stat-green">
                    <div className="admin-stat-info">
                        <span className="admin-stat-number">{stats.total_users}</span>
                        <span className="admin-stat-label">Total Users</span>
                    </div>
                    <Users size={36} strokeWidth={1.5} />
                </div>
                <div className="admin-stat-card admin-stat-blue">
                    <div className="admin-stat-info">
                        <span className="admin-stat-number">{stats.total_canteens}</span>
                        <span className="admin-stat-label">Total Canteens</span>
                    </div>
                    <Store size={36} strokeWidth={1.5} />
                </div>
                <div className="admin-stat-card admin-stat-yellow">
                    <div className="admin-stat-info">
                        <span className="admin-stat-number">{stats.total_food_items}</span>
                        <span className="admin-stat-label">Total Food Items</span>
                    </div>
                    <UtensilsCrossed size={36} strokeWidth={1.5} />
                </div>
                <div className="admin-stat-card admin-stat-purple">
                    <div className="admin-stat-info">
                        <span className="admin-stat-number">{stats.total_orders}</span>
                        <span className="admin-stat-label">Total Orders</span>
                    </div>
                    <ShoppingCart size={36} strokeWidth={1.5} />
                </div>
            </div>

            {/* Compact Summary Panels — 2 columns */}
            <div className="admin-panels-row">
                {/* Sales Panel */}
                <div className="admin-compact-panel">
                    <h3 className="admin-compact-title">Sales Overview</h3>
                    <div className="admin-compact-grid">
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">Today</span>
                            <span className="admin-compact-value">Rs. {stats.today_sales.toFixed(0)}</span>
                        </div>
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">This Month</span>
                            <span className="admin-compact-value">Rs. {stats.monthly_sales.toFixed(0)}</span>
                        </div>
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">All Time</span>
                            <span className="admin-compact-value">Rs. {stats.total_sales.toFixed(0)}</span>
                        </div>
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">Avg Order</span>
                            <span className="admin-compact-value">Rs. {stats.avg_order_value.toFixed(0)}</span>
                        </div>
                    </div>
                </div>

                {/* Orders Panel */}
                <div className="admin-compact-panel">
                    <h3 className="admin-compact-title">Orders</h3>
                    <div className="admin-compact-grid">
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">Today</span>
                            <span className="admin-compact-value">{stats.orders_today}</span>
                        </div>
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">Pending</span>
                            <span className="admin-compact-value" style={{ color: '#D97706' }}>{stats.pending_orders}</span>
                        </div>
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">Completed</span>
                            <span className="admin-compact-value" style={{ color: '#059669' }}>{stats.completed_orders}</span>
                        </div>
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">Rejected</span>
                            <span className="admin-compact-value" style={{ color: '#DC2626' }}>{stats.rejected_orders}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Panel — single row */}
            <div className="admin-compact-panel">
                <h3 className="admin-compact-title">Payments</h3>
                <div className="admin-compact-grid admin-compact-grid-wide">
                    <div className="admin-compact-item">
                        <span className="admin-compact-label">eSewa Orders</span>
                        <span className="admin-compact-value">{stats.esewa_orders}</span>
                    </div>
                    <div className="admin-compact-item">
                        <span className="admin-compact-label">eSewa Revenue</span>
                        <span className="admin-compact-value">Rs. {stats.esewa_revenue.toFixed(0)}</span>
                    </div>
                    <div className="admin-compact-item">
                        <span className="admin-compact-label">Cash Orders</span>
                        <span className="admin-compact-value">{stats.cash_orders}</span>
                    </div>
                    <div className="admin-compact-item">
                        <span className="admin-compact-label">Cash Revenue</span>
                        <span className="admin-compact-value">Rs. {stats.cash_revenue.toFixed(0)}</span>
                    </div>
                </div>
            </div>

            {/* 7-Day Sales Chart */}
            <div className="card dashboard-main-card dashboard-chart-card">
                <h3 className="dashboard-section-heading">Sales Trend (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                        <Tooltip
                            contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: 'none' }}
                            formatter={(value) => [`Rs. ${value}`, 'Revenue']}
                        />
                        <Area type="monotone" dataKey="sales" stroke="var(--primary-color)" strokeWidth={2} fillOpacity={0.1} fill="var(--primary-color)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Per-Canteen Table */}
            <div className="admin-activities-card">
                <h2 className="admin-activities-title">Canteen Performance</h2>
                {stats.canteen_sales.length === 0 ? (
                    <p className="admin-empty-text">No canteen data available.</p>
                ) : (
                    <table className="admin-canteen-table">
                        <thead>
                            <tr>
                                <th>Canteen</th>
                                <th>Rating</th>
                                <th>Items</th>
                                <th>Pending</th>
                                <th>Completed</th>
                                <th>Today</th>
                                <th>Month</th>
                                <th>All Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.canteen_sales.map((c, idx) => (
                                <tr key={idx}>
                                    <td><strong>{c.canteen_name}</strong></td>
                                    <td className="admin-rating-cell"><Star size={13} fill="#eab308" stroke="#eab308" /> {c.rating}</td>
                                    <td>{c.menu_items}</td>
                                    <td>{c.pending_orders}</td>
                                    <td>{c.total_orders}</td>
                                    <td>Rs. {c.today_sales.toFixed(0)}</td>
                                    <td>Rs. {c.monthly_sales.toFixed(0)}</td>
                                    <td>Rs. {c.total_sales.toFixed(0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    );
};

export default AdminDashboard;
