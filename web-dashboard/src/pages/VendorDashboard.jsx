import React, { useEffect, useState, useRef } from 'react';
import { Upload, ImageIcon } from 'lucide-react';
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

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const canteenRes = await api.get('vendor/canteen/');
                const canteen = canteenRes.data;

                const menuRes = await api.get('vendor/menu/');
                const items = menuRes.data;
                const active = items.filter(i => i.is_available).length;

                let pendingOrders = 0;
                try {
                    const ordersRes = await api.get('vendor/orders/');
                    pendingOrders = ordersRes.data.filter(o => o.status === 'PENDING').length;
                } catch (_) { }

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

            <div className="stats-grid">
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

