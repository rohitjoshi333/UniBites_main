import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, X, Key } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ role: '', status: '', search: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [canteens, setCanteens] = useState([]);
    const [formData, setFormData] = useState({
        full_name: '', email: '', password: '', phone: '', role: 'USER', canteen_id: '',
    });
    const [formError, setFormError] = useState('');

    const fetchUsers = async () => {
        try {
            const params = {};
            if (filters.role) params.role = filters.role;
            if (filters.status) params.status = filters.status;
            if (filters.search) params.search = filters.search;
            const res = await api.get('admin/users/', { params });
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCanteens = async () => {
        try {
            const res = await api.get('admin/canteens/');
            setCanteens(res.data);
        } catch (error) {
            console.error('Error fetching canteens', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchCanteens();
    }, [filters]);

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Add user
    const handleAdd = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            await api.post('admin/users/create/', formData);
            setShowAddModal(false);
            setFormData({ full_name: '', email: '', password: '', phone: '', role: 'USER', canteen_id: '' });
            fetchUsers();
            fetchCanteens();
        } catch (error) {
            setFormError(error.response?.data?.error || 'Failed to create user.');
        }
    };

    // Edit user
    const openEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            full_name: user.full_name,
            phone: user.phone || '',
            role: user.role,
            is_active: user.is_active,
            is_email_verified: user.is_email_verified,
            canteen_id: canteens.find(c => c.vendor_id === user.id)?.id || '',
        });
        setFormError('');
        setShowEditModal(true);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            await api.put(`admin/users/${selectedUser.id}/`, formData);
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
            fetchCanteens();
        } catch (error) {
            setFormError(error.response?.data?.error || 'Failed to update user.');
        }
    };

    // Password reset
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            await api.put(`admin/users/${selectedUser.id}/password/`, { password: formData.password });
            setShowPasswordModal(false);
            setSelectedUser(null);
            alert(`Password successfully updated for ${selectedUser.full_name}.`);
        } catch (error) {
            setFormError(error.response?.data?.error || 'Failed to reset password.');
        }
    };

    // Delete user
    const openDelete = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        try {
            await api.delete(`admin/users/${selectedUser.id}/`);
            setShowDeleteModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete user.');
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title admin-title">ADMIN</h1>
                    <h2 className="admin-page-subtitle">User Management</h2>
                    <p className="admin-page-desc">
                        Manage all users in one place. Control, assign roles, and monitor activity across your platform.
                    </p>
                </div>
            </header>

            {/* Filter bar */}
            <div className="admin-filter-bar">
                <div className="admin-filters">
                    <select
                        className="admin-filter-select"
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    >
                        <option value="">All Roles</option>
                        <option value="USER">User</option>
                        <option value="VENDOR">Vendor</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                    <select
                        className="admin-filter-select"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">All Status</option>
                        <option value="verified">Verified</option>
                        <option value="unverified">Unverified</option>
                    </select>
                    <input
                        type="text"
                        className="admin-filter-search"
                        placeholder="Search by name or email..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                <button className="btn admin-add-btn" onClick={() => {
                    setFormData({ full_name: '', email: '', password: '', phone: '', role: 'USER', canteen_id: '' });
                    setFormError('');
                    setShowAddModal(true);
                }}>
                    <Plus size={16} />
                    Add User
                </button>
            </div>

            {/* Users table */}
            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Role</th>
                            <th>Joined Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr><td colSpan="6" className="admin-empty-text">No users found.</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td className="admin-td-name">{user.full_name}</td>
                                    <td className="admin-td-email">{user.email}</td>
                                    <td className="admin-td-phone">{user.phone || '-'}</td>
                                    <td>
                                        <span className={`admin-status-badge ${user.is_email_verified ? 'admin-status-verified' : 'admin-status-unverified'}`}>
                                            {user.is_email_verified ? 'Verified' : 'Unverified'}
                                        </span>
                                    </td>
                                    <td className="admin-td-role">{user.role}</td>
                                    <td className="admin-td-date">{formatDate(user.date_joined)}</td>
                                    <td>
                                        <div className="admin-actions">
                                            <button className="admin-action-btn admin-reset-btn" onClick={() => {
                                                setSelectedUser(user);
                                                setFormData({ ...formData, password: '' });
                                                setShowPasswordModal(true);
                                            }} title="Reset Password">
                                                <Key size={14} /> Password
                                            </button>
                                            <button className="admin-action-btn admin-edit-btn" onClick={() => openEdit(user)} title="Edit">
                                                <Pencil size={14} /> Edit
                                            </button>
                                            <button className="admin-action-btn admin-delete-btn" onClick={() => openDelete(user)} title="Delete">
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New User</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        {formError && <div className="login-error">{formError}</div>}
                        <form onSubmit={handleAdd}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    className="form-input"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select
                                    className="form-input"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="USER">User</option>
                                    <option value="VENDOR">Vendor</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            {formData.role === 'VENDOR' && (
                                <div className="form-group">
                                    <label className="form-label">Assign Canteen</label>
                                    <select
                                        className="form-input"
                                        value={formData.canteen_id}
                                        onChange={(e) => setFormData({ ...formData, canteen_id: e.target.value })}
                                    >
                                        <option value="">No Canteen (None)</option>
                                        {canteens.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.vendor_name ? `(Current: ${c.vendor_name})` : '(Available)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {formData.role !== 'ADMIN' && (
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit User</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        {formError && <div className="login-error">{formError}</div>}
                        <form onSubmit={handleEdit}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    className="form-input"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" value={selectedUser.email} disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select
                                    className="form-input"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="USER">User</option>
                                    <option value="VENDOR">Vendor</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            {formData.role === 'VENDOR' && (
                                <div className="form-group">
                                    <label className="form-label">Assign Canteen</label>
                                    <select
                                        className="form-input"
                                        value={formData.canteen_id}
                                        onChange={(e) => setFormData({ ...formData, canteen_id: e.target.value })}
                                    >
                                        <option value="">No Canteen (None)</option>
                                        {canteens.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.vendor_name ? `(Current: ${c.vendor_name})` : '(Available)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {formData.role !== 'ADMIN' && (
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        style={{ marginRight: '0.5rem' }}
                                    />
                                    Active
                                </label>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_email_verified}
                                        onChange={(e) => setFormData({ ...formData, is_email_verified: e.target.checked })}
                                        style={{ marginRight: '0.5rem' }}
                                    />
                                    Email Verified
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Delete User</h3>
                            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>
                            Are you sure you want to delete <strong>{selectedUser.full_name}</strong> ({selectedUser.email})? This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showPasswordModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Reset Password</h3>
                            <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        {formError && <div className="login-error">{formError}</div>}
                        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)' }}>
                            Change the password for <strong>{selectedUser.full_name}</strong> ({selectedUser.email}).
                        </p>
                        <form onSubmit={handlePasswordReset}>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Update Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
