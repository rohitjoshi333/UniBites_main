import React, { useEffect, useState, useRef } from 'react';
import { Upload, ImageIcon, TrendingUp, DollarSign, Calendar } from 'lucide-react';
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
                const last7Days = [];

                try {
                    const ordersRes = await api.get('vendor/orders/');
                    const allOrders = ordersRes.data;
                    pendingOrders = allOrders.filter(o => ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)).length;

                    const completedOrders = allOrders.filter(o => o.status === 'COMPLETED');
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();
                    const currentDate = now.getDate();

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
                    });

                } catch (_) { }

                setSalesStats({
                    total: totalSales,
                    monthly: monthlySales,
                    today: todaysSales
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
                    <h1 className="page-title">Dashboard Overview</h1>
                    <p className="login-subtitle">Monitor and manage your canteen performance</p>
                </div>
            </header>

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
                    <span className="stat-value" style={{ color: 'var(--primary-color)' }}>
                        {stats.rating} <small style={{ fontSize: '1.25rem' }}>⭐</small>
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Pending Orders</span>
                    <span className="stat-value" style={{ color: '#D97706' }}>{stats.pendingOrders}</span>
                </div>
            </div>

            <h3 className="dashboard-section-heading">Sales Summary</h3>
            <div className="stats-grid st-col-3">
                <div className="stat-card">
                    <span className="stat-label">Today's Sales</span>
                    <span className="stat-value">Rs. {salesStats.today.toFixed(2)}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Monthly Sales</span>
                    <span className="stat-value">Rs. {salesStats.monthly.toFixed(2)}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Total Sales (All Time)</span>
                    <span className="stat-value">Rs. {salesStats.total.toFixed(2)}</span>
                </div>
            </div>

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

