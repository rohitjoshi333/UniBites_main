import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const VendorMenuManagement = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        is_available: true,
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await api.get('vendor/menu/');
            setItems(response.data);
        } catch (error) {
            console.error("Failed to fetch menu items", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleOpenModal = (item = null) => {
        if (item) {
            setCurrentItem(item);
            setFormData({
                name: item.name,
                description: item.description,
                price: item.price,
                is_available: item.is_available,
                image: null
            });
            setImagePreview(item.image_url);
        } else {
            setCurrentItem(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                is_available: true,
                image: null
            });
            setImagePreview(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('price', formData.price);
        data.append('is_available', formData.is_available);
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            if (currentItem) {
                await api.put(`vendor/menu/${currentItem.id}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('vendor/menu/', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            fetchItems();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving item", error);
            if (error.response?.data) {
                const data = error.response.data;
                const firstKey = Object.keys(data)[0];
                const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
                alert(`Cannot use invalid value: ${msg}`);
            } else {
                alert("Failed to save item.");
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                await api.delete(`vendor/menu/${id}/`);
                setItems(prev => prev.filter(item => item.id !== id));
            } catch (error) {
                console.error("Error deleting item", error);
                alert("Failed to delete item.");
            }
        }
    };

    return (
        <div className="menu-page">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Menu Management</h1>
                    <p className="login-subtitle">Control your available dishes and pricing</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} />
                    <span>Add New Item</span>
                </button>
            </header>

            {loading ? (
                <div className="loading-spinner"></div>
            ) : (
                <div className="menu-grid">
                    {items.map(item => (
                        <div key={item.id} className="menu-item-card">
                            <img
                                src={item.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                                alt={item.name}
                                className="menu-image"
                            />
                            <div className="menu-details">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <h3 className="menu-name">{item.name}</h3>
                                    <span className="menu-price">Rs. {item.price}</span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 1rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '40px' }}>
                                    {item.description}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className={`badge ${item.is_available ? 'badge-success' : 'badge-gray'}`} style={{ backgroundColor: item.is_available ? '#dcfce7' : '#f1f5f9', color: item.is_available ? '#166534' : '#64748b' }}>
                                        {item.is_available ? 'Available' : 'Hidden'}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-secondary" onClick={() => handleOpenModal(item)} style={{ padding: '0.5rem' }}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn btn-danger" onClick={() => handleDelete(item.id)} style={{ padding: '0.5rem' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{currentItem ? 'Update Item' : 'New Dish'}</h2>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Dish Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    placeholder="e.g. Special Chicken Curry"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="form-label">Price (Rs.)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        className="form-input"
                                        placeholder="0.00"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="form-label">Status</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', height: '42px' }}>
                                        <input
                                            type="checkbox"
                                            name="is_available"
                                            id="is_available"
                                            checked={formData.is_available}
                                            onChange={handleInputChange}
                                            style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="is_available" style={{ marginBottom: 0, fontWeight: '500', cursor: 'pointer' }}>Available</label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    className="form-textarea"
                                    placeholder="Write a tasty description..."
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Food Photo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <label className="btn btn-secondary" style={{ cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                                        <Upload size={16} /> {imagePreview ? 'Change Photo' : 'Upload Photo'}
                                        <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                                    </label>
                                    {imagePreview && (
                                        <img src={imagePreview} alt="Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }} />
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem', marginTop: '2.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }}>
                                    {currentItem ? 'Save Changes' : 'Add to Menu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorMenuManagement;
