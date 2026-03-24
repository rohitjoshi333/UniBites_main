import React from 'react';
import { Download, ShoppingBag, List } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const VendorReports = () => {
    
    const downloadReport = async (type, filename) => {
        try {
            const response = await api.get(`vendor/reports/export/?type=${type}`, {
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

    return (
        <div className="dashboard-page">
            <header className="page-header" style={{ marginBottom: '20px' }}>
                <div>
                    <h1 className="page-title">Reports</h1>
                    <p style={{ color: 'var(--text-color)', marginTop: '5px' }}>Download CSV reports for your canteen.</p>
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
                                    <ShoppingBag size={18} />
                                    <span>Canteen Orders</span>
                                </div>
                            </td>
                            <td style={{ padding: '15px 10px', color: 'var(--text-color)' }}>Export a list of all orders exclusively placed at your canteen.</td>
                            <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                <button 
                                    className="filter-btn"
                                    onClick={() => downloadReport('orders', 'Vendor_Orders_Report.csv')}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                >
                                    <Download size={14} /> Download File
                                </button>
                            </td>
                        </tr>

                        {/* Menu Report Row */}
                        <tr>
                            <td style={{ padding: '15px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <List size={18} />
                                    <span>Menu Catalog</span>
                                </div>
                            </td>
                            <td style={{ padding: '15px 10px', color: 'var(--text-color)' }}>Export your entire menu including pricing and availability status.</td>
                            <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                <button 
                                    className="filter-btn"
                                    onClick={() => downloadReport('menu', 'Vendor_Menu_Report.csv')}
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

export default VendorReports;
