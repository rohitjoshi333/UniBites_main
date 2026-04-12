import React, { useEffect, useState } from 'react';
import { ShoppingCart, UserPlus, UtensilsCrossed } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const AdminActivities = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 12;

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await api.get('admin/activities/');
                setActivities(res.data);
            } catch (error) {
                console.error('Error fetching activities', error);
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, []);

    if (loading) return <div>Loading...</div>;

    const filtered = filter === 'all' ? activities : activities.filter(a => a.type === filter);

    // Pagination
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="dashboard-page">
            <header className="page-header" style={{ marginBottom: '20px' }}>
                <h1 className="page-title">Activity Log</h1>
                <p style={{ color: '#666', fontSize: '14px' }}>All platform activities</p>
            </header>

            <div style={{ marginBottom: '20px' }}>
                {['all', 'order', 'user', 'menu'].map(f => (
                    <button
                        key={f}
                        onClick={() => {
                            setFilter(f);
                            setCurrentPage(1);
                        }}
                        style={{
                            marginRight: '10px',
                            padding: '5px 10px',
                            background: filter === f ? '#e2e8f0' : '#fff',
                            border: '1px solid #cbd5e1',
                            cursor: 'pointer',
                            color: '#0f172a'
                        }}
                    >
                        {f.toUpperCase()} ({f === 'all' ? activities.length : activities.filter(a => a.type === f).length})
                    </button>
                ))}
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px' }}>
                {filtered.length === 0 ? (
                    <p>No activities found.</p>
                ) : (
                    <>
                        <table className="admin-canteen-table">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Details</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((a, idx) => (
                                    <tr key={idx}>
                                        <td style={{ color: '#64748b' }}>{formatDate(a.timestamp)}</td>
                                        <td style={{ textTransform: 'uppercase', fontSize: '12px', color: '#475569' }}>{a.type}</td>
                                        <td style={{ fontWeight: '500' }}>{a.description}</td>
                                        <td style={{ color: '#64748b' }}>{a.detail}</td>
                                        <td>{a.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
                                <div>
                                    <span style={{ fontSize: '14px', color: '#64748b' }}>
                                        Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        style={{ padding: '5px 15px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#94a3b8' : '#0f172a' }}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        style={{ padding: '5px 15px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f1f5f9' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#94a3b8' : '#0f172a' }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminActivities;
