import React, { useState } from 'react';
import { Download, ShoppingBag, List } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const VendorReports = () => {

    const [ordersFilter, setOrdersFilter] = useState({
        startDate: '',
        endDate: '',
        status: '',
    });

    const downloadReport = async (type, filename, extraParams = {}) => {
        try {
            // Build clean params object and only include non-empty values
            const queryParams = { type };
            Object.entries(extraParams).forEach(([k, v]) => {
                if (v) queryParams[k] = v;
            });

            const response = await api.get('vendor/reports/export/', {
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

                        {/* Canteen Orders */}
                        <tr>
                            <td style={{ padding: '15px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ShoppingBag size={18} />
                                    <span>Canteen Orders</span>
                                </div>
                            </td>
                            <td style={{ padding: '15px 10px', color: 'var(--text-color)' }}>
                                Export a list of all orders exclusively placed at your canteen.
                            </td>
                            <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                <button
                                    className="report-filter-download-btn"
                                    onClick={() => downloadReport('orders', 'Vendor_Orders_Report.csv', {
                                        start_date: ordersFilter.startDate,
                                        end_date: ordersFilter.endDate,
                                        status: ordersFilter.status,
                                    })}
                                >
                                    <Download size={14} /> Download File
                                </button>
                            </td>
                        </tr>

                        {/* Canteen Orders — filter row */}
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

                        {/* Menu Catalog */}
                        <tr>
                            <td style={{ padding: '15px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <List size={18} />
                                    <span>Menu Catalog</span>
                                </div>
                            </td>
                            <td style={{ padding: '15px 10px', color: 'var(--text-color)' }}>
                                Export your entire menu including pricing and availability status.
                            </td>
                            <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                <button
                                    className="report-filter-download-btn"
                                    onClick={() => downloadReport('menu', 'Vendor_Menu_Report.csv')}
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
