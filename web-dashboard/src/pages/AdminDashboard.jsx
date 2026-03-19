import React, { useEffect, useState } from 'react';
import { Users, Store, UtensilsCrossed, Eye } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_users: 0,
        total_canteens: 0,
        total_food_items: 0,
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

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title admin-title">ADMIN</h1>
                </div>
            </header>

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
            </div>

            <div className="admin-activities-card">
                <h2 className="admin-activities-title">Recent Activities</h2>
                <div className="admin-activities-list">
                    {stats.recent_activities.length === 0 ? (
                        <p className="admin-empty-text">No recent activities.</p>
                    ) : (
                        stats.recent_activities.map((activity) => (
                            <div key={activity.id} className="admin-activity-row">
                                <span className="admin-activity-text">{activity.description}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
