import React, { useState } from 'react';
import { Download, FileText, Users, Store } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const AdminReports = () => {

    const [ordersFilter, setOrdersFilter] = useState({
        startDate: '',
        endDate: '',
        status: '',
    });

    const [usersFilter, setUsersFilter] = useState({
        startDate: '',
        endDate: '',
        role: '',
    });

    const downloadReport = async (type, filename, extraParams = {}) => {
        try {
            const queryParams = { type };
            Object.entries(extraParams).forEach(([k, v]) => {
                if (v) queryParams[k] = v;
            });

            const response = await api.get('admin/reports/export/', {
                params: queryParams,
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report. Please try again.');
        }
    };

    const hasOrdersFilter = ordersFilter.startDate || ordersFilter.endDate || ordersFilter.status;
    const hasUsersFilter = usersFilter.startDate || usersFilter.endDate || usersFilter.role;

    return (
        <div className="dashboard-page">
            <header className="page-header" style={{ marginBottom: '20px' }}>
                <div>
                    <h1 className="page-title">Reports</h1>
                    <p style={{ color: 'var(--text-color)', marginTop: '5px' }}>Download CSV reports for different types of platform data.</p>
                </div>
            </header>

            <div className="admin-activities-card" style={{ padding: '20px' }}>
                <table className="admin-canteen-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>Report Name</th>
                            <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>Description</th>
                            <th style={{ padding: '15px 10px', fontWeight: 'bold', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Platform Orders */}
                        <tr>
                            <td style={{ padding: '15px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={18} />
                                    <span>Platform Orders</span>
                                </div>
                            </td>
                            <td style={{ padding: '15px 10px', color: 'var(--text-color)' }}>
                                Export all orders across all canteens on the platform.
                            </td>
                            <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                <button
                                    className="report-filter-download-btn"
                                    onClick={() => downloadReport('orders', 'Admin_Orders_Report.csv', {
                                        start_date: ordersFilter.startDate,
                                        end_date: ordersFilter.endDate,
                                        status: ordersFilter.status,
                                    })}
                                >
                                    <Download size={14} /> Download File
                                </button>
                            </td>
                        </tr>

                        {/* Platform Orders — filter row */}
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td colSpan={3} className="report-filter-row-cell">
                                <div className="report-filter-row">
                                    <div className="report-filter-group">
                                        <label className="report-filter-label">Start Date</label>
                                        <input
                                            type="date"
                                            className="report-filter-input"
                                            value={ordersFilter.startDate}
                                            onClick={(e) => e.target.showPicker?.()}
                                            onChange={e => setOrdersFilter(f => ({ ...f, startDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className="report-filter-group">
                                        <label className="report-filter-label">End Date</label>
                                        <input
                                            type="date"
                                            className="report-filter-input"
                                            value={ordersFilter.endDate}
                                            onClick={(e) => e.target.showPicker?.()}
                                            onChange={e => setOrdersFilter(f => ({ ...f, endDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className="report-filter-group">
                                        <label className="report-filter-label">Order Status</label>
                                        <select
                                            className="report-filter-input"
                                            value={ordersFilter.status}
                                            onChange={e => setOrdersFilter(f => ({ ...f, status: e.target.value }))}
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="CANCELLED">Cancelled</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </div>
                                    {hasOrdersFilter && (
                                        <button
                                            className="report-filter-clear"
                                            onClick={() => setOrdersFilter({ startDate: '', endDate: '', status: '' })}
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>

                        {/* Registered Users */}
                        <tr>
                            <td style={{ padding: '15px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users size={18} />
                                    <span>Registered Users</span>
                                </div>
                            </td>
                            <td style={{ padding: '15px 10px', color: 'var(--text-color)' }}>
                                Export a list of all registered users, admins, and vendors.
                            </td>
                            <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                <button
                                    className="report-filter-download-btn"
                                    onClick={() => downloadReport('users', 'Admin_Users_Report.csv', {
                                        start_date: usersFilter.startDate,
                                        end_date: usersFilter.endDate,
                                        role: usersFilter.role,
                                    })}
                                >
                                    <Download size={14} /> Download File
                                </button>
                            </td>
                        </tr>

                        {/* Registered Users — filter row */}
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td colSpan={3} className="report-filter-row-cell">
                                <div className="report-filter-row">
                                    <div className="report-filter-group">
                                        <label className="report-filter-label">Start Date</label>
                                        <input
                                            type="date"
                                            className="report-filter-input"
                                            value={usersFilter.startDate}
                                            onClick={(e) => e.target.showPicker?.()}
                                            onChange={e => setUsersFilter(f => ({ ...f, startDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className="report-filter-group">
                                        <label className="report-filter-label">End Date</label>
                                        <input
                                            type="date"
                                            className="report-filter-input"
                                            value={usersFilter.endDate}
                                            onClick={(e) => e.target.showPicker?.()}
                                            onChange={e => setUsersFilter(f => ({ ...f, endDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className="report-filter-group">
                                        <label className="report-filter-label">Role</label>
                                        <select
                                            className="report-filter-input"
                                            value={usersFilter.role}
                                            onChange={e => setUsersFilter(f => ({ ...f, role: e.target.value }))}
                                        >
                                            <option value="">All Roles</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="VENDOR">Vendor</option>
                                            <option value="USER">User</option>
                                        </select>
                                    </div>
                                    {hasUsersFilter && (
                                        <button
                                            className="report-filter-clear"
                                            onClick={() => setUsersFilter({ startDate: '', endDate: '', role: '' })}
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>

                        {/* Canteen Performance */}
                        <tr>
                            <td style={{ padding: '15px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Store size={18} />
                                    <span>Canteen Performance</span>
                                </div>
                            </td>
                            <td style={{ padding: '15px 10px', color: 'var(--text-color)' }}>
                                Export total sales, pending orders, and completed orders per canteen.
                            </td>
                            <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                <button
                                    className="report-filter-download-btn"
                                    onClick={() => downloadReport('canteens', 'Admin_Canteens_Report.csv')}
                                >
                                    <Download size={14} /> Download File
                                </button>
                            </td>
                        </tr>



                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminReports;
