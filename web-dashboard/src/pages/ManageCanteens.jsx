import React, { useEffect, useState } from 'react';
import { Store, UtensilsCrossed, X } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const ManageCanteens = () => {
    const [canteens, setCanteens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCanteen, setSelectedCanteen] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [menuLoading, setMenuLoading] = useState(false);

    useEffect(() => {
        const fetchCanteens = async () => {
            try {
                const res = await api.get('admin/canteens/');
                setCanteens(res.data);
            } catch (error) {
                console.error('Error fetching canteens:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCanteens();
    }, []);

    const handleSelectCanteen = async (canteen) => {
        setSelectedCanteen(canteen);
        setMenuLoading(true);
        setMenuItems([]);
        try {
            const res = await api.get(`vendor/public/menu/${canteen.id}/`);
            setMenuItems(res.data || []);
        } catch (error) {
            console.error('Error fetching menu items:', error);
        } finally {
            setMenuLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title admin-title">ADMIN</h1>
                    <h2 className="admin-page-subtitle">Manage Canteens and Menu Items</h2>
                    <p className="admin-page-desc">
                        View all canteens on the platform and check their respective menu items.
                    </p>
                </div>
            </header>

            <div className="menu-grid">
                {canteens.length === 0 ? (
                    <p className="admin-empty-text">No canteens available.</p>
                ) : (
                    canteens.map((canteen) => (
                        <div
                            key={canteen.id}
                            className="menu-item-card"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSelectCanteen(canteen)}
                        >
                            {/* Canteen Image */}
                            {canteen.image_url ? (
                                <img
                                    src={canteen.image_url}
                                    alt={canteen.name}
                                    className="menu-image"
                                />
                            ) : (
                                <div className="menu-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
                                    <Store size={36} />
                                </div>
                            )}

                            {/* Canteen Details */}
                            <div className="menu-details">
                                <h3 className="menu-name">{canteen.name}</h3>
                                <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                                    {canteen.vendor_email ? canteen.vendor_email : 'No Vendor Assigned'}
                                </p>
                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                                    onClick={(e) => { e.stopPropagation(); handleSelectCanteen(canteen); }}
                                >
                                    <UtensilsCrossed size={15} /> View Menu
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Canteen Menu Modal */}
            {selectedCanteen && (
                <div className="modal-overlay" onClick={() => setSelectedCanteen(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px', width: '92%' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>{selectedCanteen.name} — Menu</h3>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    {menuItems.length} item{menuItems.length !== 1 ? 's' : ''} in catalog
                                </p>
                            </div>
                            <button className="modal-close" onClick={() => setSelectedCanteen(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginTop: '1.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
                            {menuLoading ? (
                                <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading menu...</div>
                            ) : menuItems.length === 0 ? (
                                <p className="admin-empty-text">No menu items found for this canteen.</p>
                            ) : (
                                <div className="menu-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                                    {menuItems.map((item) => (
                                        <div key={item.id} className="menu-item-card">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="menu-image" style={{ height: '130px' }} />
                                            ) : (
                                                <div className="menu-image" style={{ height: '130px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                                    <UtensilsCrossed size={28} />
                                                </div>
                                            )}
                                            <div className="menu-details">
                                                <h4 className="menu-name" style={{ fontSize: '0.9375rem' }}>{item.name}</h4>
                                                {item.description && (
                                                    <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {item.description}
                                                    </p>
                                                )}
                                                <div className="menu-price">Rs {item.price}</div>
                                                <span className={`badge ${item.is_available ? 'badge-accepted' : 'badge-rejected'}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                                                    {item.is_available ? 'Available' : 'Unavailable'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCanteens;
