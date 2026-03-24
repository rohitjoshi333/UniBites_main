import React from 'react';
import { Download, FileText, Users, Store } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const AdminReports = () => {
    
    const downloadReport = async (type, filename) => {
        try {
            const response = await api.get(`admin/reports/export/?type=${type}`, {
                responseType: 'blob', // Important for handling file downloads
            });
            
            // Create a blob from the response data
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link to trigger download
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
                        {/* Orders Report Row */}
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '15px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={18} />
                                    <span>Platform Orders</span>
                                </div>
                            </td>
                            <td style={{ padding: '15px 10px', color: 'var(--text-color)' }}>Export all completed and pending orders across all canteens.</td>
                            <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                <button 
                                    className="filter-btn"
                                    onClick={() => downloadReport('orders', 'Admin_Orders_Report.csv')}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                >
                                    <Download size={14} /> Download File
                                </button>
                            </td>
                        </tr>

                        {/* Users Report Row */}
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '15px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users size={18} />
                                    <span>Registered Users</span>
                                </div>
                            </td>
                            <td style={{ padding: '15px 10px', color: 'var(--text-color)' }}>Export a list of all registered users, admins, and vendors.</td>
                            <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                <button 
                                    className="filter-btn"
                                    onClick={() => downloadReport('users', 'Admin_Users_Report.csv')}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                >
                                    <Download size={14} /> Download File
                                </button>
                            </td>
                        </tr>

                        {/* Canteens Report Row */}
                        <tr>
                            <td style={{ padding: '15px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Store size={18} />
                                    <span>Canteen Performance</span>
                                </div>
                            </td>
                            <td style={{ padding: '15px 10px', color: 'var(--text-color)' }}>Export total sales, pending orders, and completed orders per canteen.</td>
                            <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                <button 
                                    className="filter-btn"
                                    onClick={() => downloadReport('canteens', 'Admin_Canteens_Report.csv')}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
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
