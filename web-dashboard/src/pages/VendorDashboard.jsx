import React, { useEffect, useState, useRef } from 'react';
import { Upload, ImageIcon, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import '../styles/dashboard.css';

const VendorDashboard = () => {
    const [stats, setStats] = useState({
        totalItems: 0,
        activeItems: 0,
        canteenName: '',
        rating: 0,
        canteenImage: '',
        pendingOrders: 0,
    });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const [salesStats, setSalesStats] = useState({
        total: 0,
        monthly: 0,
        today: 0,
        avgOrder: 0,
    });
    const [orderStats, setOrderStats] = useState({
        total: 0,
        today: 0,
        pending: 0,
        completed: 0,
        rejected: 0,
    });
    const [paymentStats, setPaymentStats] = useState({
        esewaOrders: 0,
        esewaRevenue: 0,
        cashOrders: 0,
        cashRevenue: 0,
    });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const canteenRes = await api.get('vendor/canteen/');
                const canteen = canteenRes.data;

                const menuRes = await api.get('vendor/menu/');
                const items = menuRes.data;
                const active = items.filter(i => i.is_available).length;

                let pendingOrders = 0;
                let totalSales = 0;
                let monthlySales = 0;
                let todaysSales = 0;
                let completedCount = 0;
                let rejectedCount = 0;
                let ordersToday = 0;
                let totalOrders = 0;
                let esewaOrders = 0;
                let esewaRevenue = 0;
                let cashOrders = 0;
                let cashRevenue = 0;
                const last7Days = [];

                try {
                    const ordersRes = await api.get('vendor/orders/');
                    const allOrders = ordersRes.data;
                    totalOrders = allOrders.length;
                    pendingOrders = allOrders.filter(o => ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)).length;
                    rejectedCount = allOrders.filter(o => ['REJECTED', 'CANCELLED'].includes(o.status)).length;

                    const completedOrders = allOrders.filter(o => o.status === 'COMPLETED');
                    completedCount = completedOrders.length;
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();
                    const currentDate = now.getDate();

                    // Orders today
                    const todayStr = now.toDateString();
                    ordersToday = allOrders.filter(o => new Date(o.created_at).toDateString() === todayStr).length;

                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        last7Days.push({
                            name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            sales: 0
                        });
                    }

                    completedOrders.forEach(o => {
                        const d = new Date(o.created_at);
                        const amount = parseFloat(o.total_price);
                        totalSales += amount;
                        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                            monthlySales += amount;
                        }
                        if (d.getDate() === currentDate && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                            todaysSales += amount;
                        }
                        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const dayData = last7Days.find(item => item.name === dateStr);
                        if (dayData) dayData.sales += amount;

                        // Payment breakdown
                        if (o.payment_method === 'ESEWA') {
                            esewaOrders++;
                            esewaRevenue += amount;
                        } else {
                            cashOrders++;
                            cashRevenue += amount;
                        }
                    });

                } catch (_) { }

                setSalesStats({
                    total: totalSales,
                    monthly: monthlySales,
                    today: todaysSales,
                    avgOrder: completedCount > 0 ? totalSales / completedCount : 0,
                });
                setOrderStats({
                    total: totalOrders,
                    today: ordersToday,
                    pending: pendingOrders,
                    completed: completedCount,
                    rejected: rejectedCount,
                });
                setPaymentStats({
                    esewaOrders,
                    esewaRevenue,
                    cashOrders,
                    cashRevenue,
                });
                setChartData(last7Days);

                setStats({
                    totalItems: items.length,
                    activeItems: active,
                    canteenName: canteen.name,
                    rating: canteen.rating,
                    vendorName: canteen.vendor_name,
                    canteenImage: canteen.image_url || '',
                    pendingOrders,
                });
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            handleUpload(file);
        }
    };

    const handleUpload = async (file) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('vendor/canteen/upload-image/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setStats(prev => ({ ...prev, canteenImage: res.data.image_url }));
            setImagePreview(null);
            alert('Canteen image updated successfully!');
        } catch (error) {
            console.error('Upload failed', error);
            alert('Failed to upload canteen image.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">{stats.canteenName ? `${stats.canteenName} Dashboard` : 'Dashboard Overview'}</h1>
                    <p className="login-subtitle">Monitor and manage your canteen performance</p>
                </div>
            </header>

            {/* Top Stats */}
            <div className="stats-grid st-col-4">
                <div className="stat-card">
                    <span className="stat-label">Total Menu Items</span>
                    <span className="stat-value">{stats.totalItems}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Active Items</span>
                    <span className="stat-value" style={{ color: 'var(--success-color)' }}>{stats.activeItems}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Canteen Rating</span>
                    <span className="stat-value" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {stats.rating} <Star size={18} fill="#eab308" stroke="#eab308" />
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Pending Orders</span>
                    <span className="stat-value" style={{ color: '#D97706' }}>{stats.pendingOrders}</span>
                </div>
            </div>

            {/* Compact Panels — Sales + Orders side by side */}
            <div className="admin-panels-row">
                <div className="admin-compact-panel">
                    <h3 className="admin-compact-title">Sales Overview</h3>
                    <div className="admin-compact-grid">
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">Today</span>
                            <span className="admin-compact-value">Rs. {salesStats.today.toFixed(0)}</span>
                        </div>
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">This Month</span>
                            <span className="admin-compact-value">Rs. {salesStats.monthly.toFixed(0)}</span>
                        </div>
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">All Time</span>
                            <span className="admin-compact-value">Rs. {salesStats.total.toFixed(0)}</span>
                        </div>
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">Avg Order</span>
                            <span className="admin-compact-value">Rs. {salesStats.avgOrder.toFixed(0)}</span>
                        </div>
                    </div>
                </div>

                <div className="admin-compact-panel">
                    <h3 className="admin-compact-title">Orders</h3>
                    <div className="admin-compact-grid">
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">Today</span>
                            <span className="admin-compact-value">{orderStats.today}</span>
                        </div>
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">Pending</span>
                            <span className="admin-compact-value" style={{ color: '#D97706' }}>{orderStats.pending}</span>
                        </div>
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">Completed</span>
                            <span className="admin-compact-value" style={{ color: '#059669' }}>{orderStats.completed}</span>
                        </div>
                        <div className="admin-compact-item">
                            <span className="admin-compact-label">Rejected</span>
                            <span className="admin-compact-value" style={{ color: '#DC2626' }}>{orderStats.rejected}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Panel */}
            <div className="admin-compact-panel">
                <h3 className="admin-compact-title">Payments</h3>
                <div className="admin-compact-grid admin-compact-grid-wide">
                    <div className="admin-compact-item">
                        <span className="admin-compact-label">eSewa Orders</span>
                        <span className="admin-compact-value">{paymentStats.esewaOrders}</span>
                    </div>
                    <div className="admin-compact-item">
                        <span className="admin-compact-label">eSewa Revenue</span>
                        <span className="admin-compact-value">Rs. {paymentStats.esewaRevenue.toFixed(0)}</span>
                    </div>
                    <div className="admin-compact-item">
                        <span className="admin-compact-label">Cash Orders</span>
                        <span className="admin-compact-value">{paymentStats.cashOrders}</span>
                    </div>
                    <div className="admin-compact-item">
                        <span className="admin-compact-label">Cash Revenue</span>
                        <span className="admin-compact-value">Rs. {paymentStats.cashRevenue.toFixed(0)}</span>
                    </div>
                </div>
            </div>

            {/* Sales Chart */}
            <div className="card dashboard-main-card dashboard-chart-card">
                <h3 className="dashboard-section-heading">Sales Trend (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                        <Tooltip
                            contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: 'none' }}
                            formatter={(value) => [`Rs. ${value}`, 'Sales']}
                        />
                        <Area type="monotone" dataKey="sales" stroke="var(--primary-color)" strokeWidth={2} fillOpacity={0.1} fill="var(--primary-color)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Branding + Quick Actions */}
            <div className="card dashboard-main-card">
                <div className="dashboard-main-layout">

                    <div className="dashboard-branding">
                        <div className="dashboard-branding-header">
                            <h2>Canteen Branding</h2>
                            <button
                                className="btn btn-primary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                <Upload size={16} />
                                {uploading ? 'Updating...' : 'Change Image'}
                            </button>
                        </div>

                        <div className="dashboard-branding-image">
                            {imagePreview || stats.canteenImage ? (
                                <img
                                    src={imagePreview || stats.canteenImage}
                                    alt="Canteen"
                                />
                            ) : (
                                <div className="dashboard-branding-placeholder">
                                    <ImageIcon size={48} strokeWidth={1.5} />
                                    <p>No image set</p>
                                </div>
                            )}
                        </div>

                        <p className="dashboard-branding-helper">
                            This photo will be displayed as your canteen's banner on the UniBites mobile app. Make sure it looks professional.
                        </p>

                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            hidden
                        />
                    </div>


                    <div className="dashboard-quick">
                        <h2>Quick Actions</h2>
                        <div className="dashboard-quick-card">
                            <div>
                                <h4>Menu Management</h4>
                                <p>Add, edit, or remove canteen items.</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => window.location.href = '/menu'}>
                                View Menu
                            </button>
                        </div>
                        <div className="dashboard-quick-card">
                            <div>
                                <h4>Orders</h4>
                                <p>Accept or reject incoming orders.</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => window.location.href = '/orders'}>
                                View Orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorDashboard;
