import React, { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalItems: 0,
        activeItems: 0,
        canteenName: '',
        rating: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Canteen Details
                const canteenRes = await api.get('vendor/canteen/');
                const canteen = canteenRes.data;

                // Fetch Menu Items for stats
                const menuRes = await api.get('vendor/menu/');
                const items = menuRes.data;
                const active = items.filter(i => i.is_available).length;

                setStats({
                    totalItems: items.length,
                    activeItems: active,
                    canteenName: canteen.name,
                    rating: canteen.rating,
                    vendorName: canteen.vendor_name,
                });
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard Overview</h1>
                    {stats.canteenName && <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{stats.canteenName}</p>}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Menu Items</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalItems}</div>
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Active Items</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{stats.activeItems}</div>
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Canteen Rating</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.rating} ⭐</div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Quick Actions</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/menu'}>Manage Menu</button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
