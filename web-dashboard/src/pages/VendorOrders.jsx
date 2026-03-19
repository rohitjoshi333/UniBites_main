import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp, Phone, Mail, User } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', className: 'badge-pending', step: 0 },
    ACCEPTED: { label: 'Accepted', className: 'badge-accepted', step: 1 },
    PREPARING: { label: 'Preparing', className: 'badge-preparing', step: 2 },
    READY: { label: 'Ready for Pickup', className: 'badge-ready', step: 3 },
    REJECTED: { label: 'Rejected', className: 'badge-rejected', step: -1 },
    CANCELLED: { label: 'Cancelled', className: 'badge-cancelled', step: -1 },
};

const STEPS = [
    { key: 'PENDING', label: 'Received' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'READY', label: 'Ready' },
];

const ACTION_MAP = {
    PENDING: [
        { label: 'Accept Order', next: 'ACCEPTED', variant: 'btn-accept' },
        { label: 'Reject Order', next: 'REJECTED', variant: 'btn-reject' },
    ],
    ACCEPTED: [{ label: 'Start Preparing', next: 'PREPARING', variant: 'btn-preparing' }],
    PREPARING: [{ label: 'Mark Ready for Pickup', next: 'READY', variant: 'btn-ready' }],
};

const StatusStepper = ({ status }) => {
    if (status === 'REJECTED') return (
        <div className="status-rejected-pill">✕ Order Rejected</div>
    );
    const currentStep = STATUS_CONFIG[status]?.step ?? 0;
    return (
        <div className="order-stepper">
            {STEPS.map((s, i) => (
                <React.Fragment key={s.key}>
                    <div className={`stepper-step ${i <= currentStep ? 'done' : ''} ${i === currentStep ? 'active' : ''}`}>
                        <div className="stepper-dot">{i < currentStep ? '✓' : i + 1}</div>
                        <span className="stepper-label">{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`stepper-line ${i < currentStep ? 'done' : ''}`} />}
                </React.Fragment>
            ))}
        </div>
    );
};

const OrderCard = ({ order, onStatusUpdate }) => {
    const [expanded, setExpanded] = useState(false);
    const [updating, setUpdating] = useState(false);
    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
    const actions = ACTION_MAP[order.status] || [];

    const handleAction = async (next) => {
        if (next === 'REJECTED') {
            if (!window.confirm(`Reject order #${order.id}?`)) return;
        }
        setUpdating(true);
        try {
            await api.patch(`vendor/orders/${order.id}/status/`, { status: next });
            onStatusUpdate();
        } catch {
            alert('Failed to update order status. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const date = new Date(order.created_at);
    const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`order-card ${order.status === 'PENDING' ? 'order-card-pending' : ''}`}>

            <div className="order-card-header">
                <div className="order-card-info">
                    <div className="order-id">Order #{order.id}</div>
                    <div className="order-customer">
                        <span className="customer-detail"><User size={12} /> {order.user_info?.name}</span>
                        <span className="customer-detail"><Mail size={12} /> {order.user_info?.email}</span>
                        <span className="customer-detail"><Phone size={12} /> {order.user_info?.phone}</span>
                    </div>
                </div>
                <div className="order-card-right">
                    <span className={`badge ${cfg.className}`}>{cfg.label}</span>
                    <div className="order-total">Rs. {order.total_price}</div>
                    <div className="order-date">{dateStr} · {timeStr}</div>
                </div>
            </div>


            <StatusStepper status={order.status} />


            <button className="order-expand-btn" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {expanded ? 'Hide items' : `View ${order.items.length} item(s)`}
            </button>

            {expanded && (
                <div className="order-items-list">
                    {order.items.map((item) => (
                        <div key={item.id} className="order-item-row">
                            <span className="order-item-qty">{item.quantity}×</span>
                            <span className="order-item-name">{item.menu_item_name}</span>
                            <span className="order-item-price">Rs. {item.subtotal}</span>
                        </div>
                    ))}
                </div>
            )}


            {actions.length > 0 && (
                <div className="order-actions">
                    {actions.map(a => (
                        <button
                            key={a.next}
                            className={`btn ${a.variant}`}
                            onClick={() => handleAction(a.next)}
                            disabled={updating}
                        >
                            {updating ? 'Updating...' : a.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const VendorOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('ALL');

    const fetchOrders = useCallback(async () => {
        try {
            const res = await api.get('vendor/orders/');
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleRefresh = () => { setRefreshing(true); fetchOrders(); };

    const filteredOrders = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);
    const pendingCount = orders.filter(o => o.status === 'PENDING').length;

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Orders</h1>
                    <p className="login-subtitle">Manage incoming orders from your canteen</p>
                </div>
                <button className="btn btn-primary" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </header>


            <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(6, 1fr)' }}>
                {[
                    { label: 'Total', value: orders.length, color: 'var(--text-color)' },
                    { label: 'Pending', value: orders.filter(o => o.status === 'PENDING').length, color: '#D97706' },
                    { label: 'Preparing', value: orders.filter(o => o.status === 'PREPARING').length, color: '#7C3AED' },
                    { label: 'Accepted', value: orders.filter(o => o.status === 'ACCEPTED').length, color: '#059669' },
                    { label: 'Ready', value: orders.filter(o => o.status === 'READY').length, color: '#0284C7' },
                    { label: 'Rejected', value: orders.filter(o => o.status === 'REJECTED').length, color: '#DC2626' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <span className="stat-label">{s.label}</span>
                        <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                    </div>
                ))}
            </div>


            <div className="order-filters">
                {['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'REJECTED', 'CANCELLED'].map(f => (
                    <button
                        key={f}
                        className={`order-filter-btn ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.label || f}
                        {f === 'PENDING' && pendingCount > 0 && (
                            <span className="filter-badge">{pendingCount}</span>
                        )}
                    </button>
                ))}
            </div>


            {filteredOrders.length === 0 ? (
                <div className="orders-empty">
                    <ClipboardList size={56} strokeWidth={1.2} />
                    <p>No {filter !== 'ALL' ? STATUS_CONFIG[filter]?.label.toLowerCase() : ''} orders yet.</p>
                </div>
            ) : (
                <div className="orders-list">
                    {filteredOrders.map(order => (
                        <OrderCard key={order.id} order={order} onStatusUpdate={fetchOrders} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default VendorOrders;
