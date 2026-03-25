import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Edit, X, Save } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const ManageBanners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Banner Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [bannerForm, setBannerForm] = useState({
        title: '',
        description: '',
        serial_number: 0,
        is_active: true,
        image: null,
        imagePreview: null,
        image_url: ''
    });

    const fetchBanners = async () => {
        try {
            const res = await api.get('admin/banners/');
            setBanners(res.data);
        } catch (error) {
            console.error('Error fetching banners:', error);
        }
    };

    useEffect(() => {
        const initData = async () => {
            await fetchBanners();
            setLoading(false);
        };
        initData();
    }, []);

    const openModal = (banner = null) => {
        setEditingBanner(banner);
        if (banner) {
            setBannerForm({
                title: banner.title || '',
                description: banner.description || '',
                serial_number: banner.serial_number || 0,
                is_active: banner.is_active,
                image: null,
                imagePreview: banner.image_url,
                image_url: banner.image_url
            });
        } else {
            setBannerForm({
                title: '',
                description: '',
                serial_number: 0,
                is_active: true,
                image: null,
                imagePreview: null,
                image_url: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleImageUpload = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post('admin/banners/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data.image_url;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    };

    const saveBanner = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            let finalImageUrl = bannerForm.image_url;
            if (bannerForm.image) {
                finalImageUrl = await handleImageUpload(bannerForm.image);
            }

            const bannerData = {
                title: bannerForm.title,
                description: bannerForm.description,
                serial_number: bannerForm.serial_number,
                is_active: bannerForm.is_active,
                image_url: finalImageUrl
            };

            if (editingBanner) {
                await api.put(`admin/banners/${editingBanner.id}/`, bannerData);
            } else {
                if (!finalImageUrl) {
                    alert('Please upload an image for the new banner.');
                    setActionLoading(false);
                    return;
                }
                await api.post('admin/banners/', bannerData);
            }

            await fetchBanners();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving banner:', error);
            alert(error.response?.data?.error || 'Failed to save banner.');
        } finally {
            setActionLoading(false);
        }
    };

    const deleteBanner = async (id) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;
        try {
            await api.delete(`admin/banners/${id}/`);
            await fetchBanners();
        } catch (error) {
            console.error('Error deleting banner:', error);
            alert('Failed to delete banner.');
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="dashboard-page">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title admin-title">ADMIN</h1>
                    <h2 className="admin-page-subtitle">Manage Banners</h2>
                    <p className="admin-page-desc">
                        Manage dynamic banners for the mobile application home screen.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} /> Add Banner
                </button>
            </header>

            <div className="menu-grid">
                {banners.length === 0 ? (
                    <p className="admin-empty-text">No banners available.</p>
                ) : (
                    banners.map((banner) => (
                        <div key={banner.id} className="menu-item-card">
                            {banner.image_url ? (
                                <img src={banner.image_url} alt={banner.title} className="menu-image" style={{ height: '160px' }} />
                            ) : (
                                <div className="menu-image" style={{ height: '160px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                    <ImageIcon size={36} />
                                </div>
                            )}
                            <div className="menu-details">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 className="menu-name">{banner.title || 'No Title'}</h3>
                                    <span className={`badge ${banner.is_active ? 'badge-accepted' : 'badge-rejected'}`}>
                                        {banner.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    {banner.description || 'No description'}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <span style={{ fontSize: '0.8125rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                        Order: {banner.serial_number}
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="action-btn edit-btn" onClick={() => openModal(banner)}>
                                            <Edit size={16} />
                                        </button>
                                        <button className="action-btn delete-btn" onClick={() => deleteBanner(banner.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Banner Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h3>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={saveBanner} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Title</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={bannerForm.title}
                                    onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})}
                                    placeholder="e.g. Special Offer!"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3"
                                    value={bannerForm.description}
                                    onChange={(e) => setBannerForm({...bannerForm, description: e.target.value})}
                                    placeholder="Brief description of the banner..."
                                ></textarea>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Serial Number (Order) *</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        required 
                                        value={bannerForm.serial_number}
                                        onChange={(e) => setBannerForm({...bannerForm, serial_number: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                                    <input 
                                        type="checkbox" 
                                        id="isActive"
                                        checked={bannerForm.is_active}
                                        onChange={(e) => setBannerForm({...bannerForm, is_active: e.target.checked})}
                                    />
                                    <label htmlFor="isActive" style={{ margin: 0 }}>Is Active</label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Banner Image *</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                                    {bannerForm.imagePreview && (
                                        <div style={{ position: 'relative' }}>
                                            <img src={bannerForm.imagePreview} alt="Preview" style={{ width: '100%', height: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                {bannerForm.image ? 'New file selected' : 'Current image'}
                                            </div>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setBannerForm({...bannerForm, image: file, imagePreview: URL.createObjectURL(file)});
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                                    {actionLoading ? 'Saving...' : 'Save Banner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageBanners;
