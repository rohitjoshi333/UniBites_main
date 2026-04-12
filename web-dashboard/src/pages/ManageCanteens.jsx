import React, { useEffect, useState } from 'react';
import { Store, UtensilsCrossed, X, Edit, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const ManageCanteens = () => {
    const [canteens, setCanteens] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Canteen Modal State
    const [isCanteenModalOpen, setIsCanteenModalOpen] = useState(false);
    const [editingCanteen, setEditingCanteen] = useState(null);
    const [canteenForm, setCanteenForm] = useState({ name: '', vendor_id: '', location: '', opening_time: '', closing_time: '', image: null, imagePreview: null });
    const [canteenFormError, setCanteenFormError] = useState('');

    // Menu Item Modal State
    const [selectedCanteen, setSelectedCanteen] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [menuLoading, setMenuLoading] = useState(false);

    const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
    const [editingMenuItem, setEditingMenuItem] = useState(null);
    const [menuItemForm, setMenuItemForm] = useState({
        name: '', description: '', price: '', is_available: true, image: null, imagePreview: null
    });

    const fetchCanteens = async () => {
        try {
            const res = await api.get('admin/canteens/');
            setCanteens(res.data);
        } catch (error) {
            console.error('Error fetching canteens:', error);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await api.get('admin/users/?role=VENDOR');
            setVendors(res.data);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    useEffect(() => {
        const initData = async () => {
            await Promise.all([fetchCanteens(), fetchVendors()]);
            setLoading(false);
        };
        initData();
    }, []);

    const handleSelectCanteen = async (canteen) => {
        setSelectedCanteen(canteen);
        setMenuLoading(true);
        setMenuItems([]);
        try {
            // Wait, PublicMenuView is available but for admin CRUD we want all items (even unavailable ones)
            // Using the new admin endpoint if possible.
            const res = await api.get(`admin/canteens/${canteen.id}/menu/`);
            setMenuItems(res.data || []);
        } catch (error) {
            console.error('Error fetching menu items:', error);
        } finally {
            setMenuLoading(false);
        }
    };

    const refreshMenu = async (canteenId) => {
        try {
            const res = await api.get(`admin/canteens/${canteenId}/menu/`);
            setMenuItems(res.data || []);
        } catch (error) {
            console.error('Error refreshing menu items:', error);
        }
    };

    // --- Canteen Actions ---
    const openCanteenModal = (canteen = null) => {
        setEditingCanteen(canteen);
        setCanteenFormError('');
        if (canteen) {
            setCanteenForm({ name: canteen.name, vendor_id: canteen.vendor_id || '', location: canteen.location || '', opening_time: canteen.opening_time || '', closing_time: canteen.closing_time || '', image: null, imagePreview: canteen.image_url });
        } else {
            setCanteenForm({ name: '', vendor_id: '', location: '', opening_time: '', closing_time: '', image: null, imagePreview: null });
        }
        setIsCanteenModalOpen(true);
    };

    const saveCanteen = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        const formData = new FormData();
        formData.append('name', canteenForm.name);
        if (canteenForm.vendor_id) formData.append('vendor_id', canteenForm.vendor_id);
        formData.append('location', canteenForm.location);
        formData.append('opening_time', canteenForm.opening_time);
        formData.append('closing_time', canteenForm.closing_time);
        if (canteenForm.image) formData.append('image', canteenForm.image);

        try {
            setCanteenFormError('');
            if (editingCanteen) {
                await api.put(`admin/canteens/${editingCanteen.id}/`, formData);
            } else {
                await api.post('admin/canteens/', formData);
            }
            await fetchCanteens();
            setIsCanteenModalOpen(false);
        } catch (error) {
            console.error('Error saving canteen:', error);
            setCanteenFormError(error.response?.data?.error || 'Failed to save canteen.');
        } finally {
            setActionLoading(false);
        }
    };

    const deleteCanteen = async (canteenId, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this canteen? All its menu items and orders will be deleted.')) return;

        try {
            await api.delete(`admin/canteens/${canteenId}/`);
            await fetchCanteens();
        } catch (error) {
            console.error('Error deleting canteen:', error);
            alert('Failed to delete canteen.');
        }
    };

    // --- Menu Item Actions ---
    const openMenuItemModal = (item = null) => {
        setEditingMenuItem(item);
        if (item) {
            setMenuItemForm({
                name: item.name,
                description: item.description || '',
                price: item.price,
                is_available: item.is_available,
                image: null,
                imagePreview: item.image_url
            });
        } else {
            setMenuItemForm({
                name: '', description: '', price: '', is_available: true, image: null, imagePreview: null
            });
        }
        setIsMenuItemModalOpen(true);
    };

    const saveMenuItem = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        const formData = new FormData();
        formData.append('name', menuItemForm.name);
        formData.append('description', menuItemForm.description);
        formData.append('price', menuItemForm.price);
        formData.append('is_available', menuItemForm.is_available);
        if (menuItemForm.image) formData.append('image', menuItemForm.image);

        try {
            if (editingMenuItem) {
                await api.put(`admin/menu/${editingMenuItem.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post(`admin/canteens/${selectedCanteen.id}/menu/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            await refreshMenu(selectedCanteen.id);
            setIsMenuItemModalOpen(false);
        } catch (error) {
            console.error('Error saving menu item:', error);
            alert(error.response?.data?.error || 'Failed to save menu item.');
        } finally {
            setActionLoading(false);
        }
    };

    const deleteMenuItem = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this menu item?')) return;
        try {
            await api.delete(`admin/menu/${itemId}/`);
            await refreshMenu(selectedCanteen.id);
        } catch (error) {
            console.error('Error deleting menu item:', error);
            alert('Failed to delete menu item.');
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="dashboard-page">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title admin-title">ADMIN</h1>
                    <h2 className="admin-page-subtitle">Manage Canteens and Menu Items</h2>
                    <p className="admin-page-desc">
                        View all canteens on the platform and check their respective menu items.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => openCanteenModal()}>
                    <Plus size={18} /> Add Canteen
                </button>
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
                            <div className="menu-details" style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '8px' }}>
                                    <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); openCanteenModal(canteen); }} title="Edit Canteen">
                                        <Edit size={16} />
                                    </button>
                                    <button className="action-btn delete-btn" onClick={(e) => deleteCanteen(canteen.id, e)} title="Delete Canteen">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <h3 className="menu-name">{canteen.name}</h3>
                                <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                                    {canteen.vendor_email ? `Vendor: ${canteen.vendor_name || canteen.vendor_email}` : 'No Vendor Assigned'}
                                </p>
                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                                    onClick={(e) => { e.stopPropagation(); handleSelectCanteen(canteen); }}
                                >
                                    <UtensilsCrossed size={15} /> Manage Menu
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
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>{selectedCanteen.name} — Menu</h3>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    {menuItems.length} item{menuItems.length !== 1 ? 's' : ''} in catalog
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <button className="btn btn-primary btn-sm" onClick={() => openMenuItemModal()}>
                                    <Plus size={16} /> Add Item
                                </button>
                                <button className="modal-close" onClick={() => setSelectedCanteen(null)}>
                                    <X size={20} />
                                </button>
                            </div>
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

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                                    <span className={`badge ${item.is_available ? 'badge-accepted' : 'badge-rejected'}`}>
                                                        {item.is_available ? 'Available' : 'Unavailable'}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button className="action-btn edit-btn" style={{ padding: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', color: '#64748b' }} onClick={() => openMenuItemModal(item)}>
                                                            <Edit size={14} />
                                                        </button>
                                                        <button className="action-btn delete-btn" style={{ padding: '4px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }} onClick={() => deleteMenuItem(item.id)}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Canteen Modal Form */}
            {isCanteenModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCanteenModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{editingCanteen ? 'Edit Canteen' : 'Add New Canteen'}</h3>
                            <button className="modal-close" onClick={() => setIsCanteenModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        {canteenFormError && <div className="login-error" style={{ marginTop: '1rem', padding: '0.75rem' }}>{canteenFormError}</div>}
                        <form onSubmit={saveCanteen} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Canteen Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={canteenForm.name}
                                    onChange={(e) => setCanteenForm({ ...canteenForm, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Assign Vendor</label>
                                <select
                                    className="form-input"
                                    value={canteenForm.vendor_id}
                                    onChange={(e) => setCanteenForm({ ...canteenForm, vendor_id: e.target.value })}
                                >
                                    <option value="">-- No Vendor Assigned --</option>
                                    {vendors.map(v => (
                                        <option key={v.id} value={v.id}>{v.full_name} ({v.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Location *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    placeholder="e.g., Building A, Ground Floor"
                                    value={canteenForm.location}
                                    onChange={(e) => setCanteenForm({ ...canteenForm, location: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Opening Time *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        placeholder="08:00 AM"
                                        value={canteenForm.opening_time}
                                        onChange={(e) => setCanteenForm({ ...canteenForm, opening_time: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Closing Time *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        placeholder="06:00 PM"
                                        value={canteenForm.closing_time}
                                        onChange={(e) => setCanteenForm({ ...canteenForm, closing_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Canteen Image</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {canteenForm.imagePreview && (
                                        <img src={canteenForm.imagePreview} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setCanteenForm({ ...canteenForm, image: file, imagePreview: URL.createObjectURL(file) });
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsCanteenModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                                    {actionLoading ? 'Saving...' : 'Save Canteen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Menu Item Modal Form */}
            {isMenuItemModalOpen && (
                <div className="modal-overlay" onClick={() => setIsMenuItemModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
                            <button className="modal-close" onClick={() => setIsMenuItemModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={saveMenuItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Item Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={menuItemForm.name}
                                    onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-textarea"
                                    rows="3"
                                    value={menuItemForm.description}
                                    onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Price (Rs) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        required
                                        value={menuItemForm.price}
                                        onChange={(e) => setMenuItemForm({ ...menuItemForm, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '42px' }}>
                                <input
                                    type="checkbox"
                                    id="isAvailable"
                                    checked={menuItemForm.is_available}
                                    onChange={(e) => setMenuItemForm({ ...menuItemForm, is_available: e.target.checked })}
                                    style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                                />
                                <label htmlFor="isAvailable" style={{ margin: 0, fontWeight: '500', cursor: 'pointer' }}>Item is Available</label>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Item Image</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {menuItemForm.imagePreview && (
                                        <img src={menuItemForm.imagePreview} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setMenuItemForm({ ...menuItemForm, image: file, imagePreview: URL.createObjectURL(file) });
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsMenuItemModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                                    {actionLoading ? 'Saving...' : 'Save Menu Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCanteens;
