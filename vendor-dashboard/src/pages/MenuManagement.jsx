import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const MenuManagement = () => {
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
            setImagePreview(item.image);
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
            alert("Failed to save item.");
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
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="page-title">Menu Management</h1>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} /> Add Item
                </button>
            </div>

            {loading ? (
                <div className="loading-spinner"></div>
            ) : (
                <div className="menu-grid">
                    {items.map(item => (
                        <div key={item.id} className="menu-item-card">
                            <img
                                src={item.image || 'https://via.placeholder.com/300x200?text=No+Image'}
                                alt={item.name}
                                className="menu-image"
                            />
                            <div className="menu-details">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <h3 className="menu-name">{item.name}</h3>
                                    <span className="menu-price">Rs. {item.price}</span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.5rem 0', height: '40px', overflow: 'hidden' }}>
                                    {item.description}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                    <span className={`badge ${item.is_available ? 'badge-success' : 'badge-gray'}`}>
                                        {item.is_available ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                <div className="menu-actions">
                                    <button className="btn btn-secondary" onClick={() => handleOpenModal(item)} style={{ padding: '0.4rem' }}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(item.id)} style={{ padding: '0.4rem' }}>
                                        <Trash2 size={16} />
                                    </button>
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
                            <span>{currentItem ? 'Edit Item' : 'Add New Item'}</span>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Item Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Price (Rs.)</label>
                                <input
                                    type="number"
                                    name="price"
                                    className="form-input"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    className="form-textarea"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Image</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                                        <Upload size={16} /> Upload
                                        <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                                    </label>
                                    {imagePreview && (
                                        <img src={imagePreview} alt="Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                    )}
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    name="is_available"
                                    id="is_available"
                                    checked={formData.is_available}
                                    onChange={handleInputChange}
                                    style={{ width: '1.25rem', height: '1.25rem' }}
                                />
                                <label htmlFor="is_available" style={{ marginBottom: 0 }}>Available for ordering</label>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManagement;
