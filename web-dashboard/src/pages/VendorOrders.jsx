import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClipboardList, RefreshCw, Clock, ChevronDown, ChevronUp, Phone, Mail, User, AlertCircle, Calendar, Banknote, CreditCard } from 'lucide-react';
import api from '../services/api';
import notificationSound from '../assets/loud_notification.wav';
import '../styles/dashboard.css';

if ('Notification' in window && Notification.permission === 'default') {
    // Request permission for native system notifications
    Notification.requestPermission();
}

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', className: 'badge-pending', step: 0 },
    ACCEPTED: { label: 'Accepted', className: 'badge-accepted', step: 1 },
    PREPARING: { label: 'Preparing', className: 'badge-preparing', step: 2 },
    READY: { label: 'Ready for Pickup', className: 'badge-ready', step: 3 },
    COMPLETED: { label: 'Completed', className: 'badge-completed', step: 4 },
    REJECTED: { label: 'Rejected', className: 'badge-rejected', step: -1 },
    CANCELLED: { label: 'Cancelled', className: 'badge-cancelled', step: -1 },
};

const STEPS = [
    { key: 'PENDING', label: 'Received' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'READY', label: 'Ready' },
    { key: 'COMPLETED', label: 'Picked Up' },
];

const ACTION_MAP = {
    PENDING: [
        { label: 'Accept Order', next: 'ACCEPTED', variant: 'btn-accept' },
        { label: 'Reject Order', next: 'REJECTED', variant: 'btn-reject' },
    ],
    ACCEPTED: [{ label: 'Start Preparing', next: 'PREPARING', variant: 'btn-preparing' }],
    PREPARING: [{ label: 'Mark Ready for Pickup', next: 'READY', variant: 'btn-ready' }],
    READY: [{ label: 'Order Picked Up', next: 'COMPLETED', variant: 'btn-completed' }],
};

// play the alert brefore 15 min of pickup
const ALERT_BEFORE_MINUTES = 15;
const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'];

function minsUntilPickup(scheduledTime) {
    if (!scheduledTime) return null;
    return Math.floor((new Date(scheduledTime).getTime() - Date.now()) / 60000);
}

function playSound() {
    try {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('UniBites Order Update', {
                body: 'There is an order update requiring your attention.',
            });
        }
        const audio = new Audio(notificationSound);
        audio.play().catch(e => console.warn('Audio play failed', e));
    } catch (err) {
        console.warn('Notification/Audio failed', err);
    }
}

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

const OrderCard = ({ order, onStatusUpdate, minsLeft }) => {
    const [expanded, setExpanded] = useState(true);
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

    const scheduledStr = order.scheduled_time
        ? new Date(order.scheduled_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : null;

    // minsLeft is passed from parent (computed every 30s)
    const isUrgent = minsLeft !== null && minsLeft !== undefined && minsLeft >= 0 && minsLeft <= ALERT_BEFORE_MINUTES;
    const isOverdue = minsLeft !== null && minsLeft !== undefined && minsLeft < 0;

    return (
        <div className={`order-card-compact ${order.status === 'PENDING' ? 'pulse-pending' : ''} ${isUrgent ? 'urgent-scheduled' : ''}`}>

            {/* this is for the urgent pickup banner */}
            {scheduledStr && (isUrgent || isOverdue) && (
                <div className={`urgent-scheduled-banner ${isOverdue ? 'overdue' : ''}`}>
                    <AlertCircle size={16} />
                    <span className="urgent-text">
                        {isOverdue
                            ? `Scheduled pickup was at ${scheduledStr} — please serve immediately`
                            : `Pickup in ${minsLeft} min (Scheduled: ${scheduledStr})`
                        }
                    </span>
                </div>
            )}

            <div className="occ-top">
                <div className="occ-top-left">
                    <span className="occ-id">#{order.id}</span>
                    <span className="occ-date">{dateStr} · {timeStr}</span>
                    <span className={`badge ${cfg.className}`}>{cfg.label}</span>
                    {scheduledStr && (
                        <span className={`badge-scheduled ${isUrgent ? 'badge-scheduled-urgent' : ''}`}>
                            <Calendar size={14} />
                            <span>Pickup {scheduledStr}</span>
                        </span>
                    )}
                </div>
                <div className="occ-top-right">
                    {order.payment_method === 'ESEWA' ? (
                        <div className={`occ-payment esewa ${order.payment_status === 'PAID' ? 'paid' : 'failed'}`}>
                            <CreditCard size={14} />
                            <span>{order.payment_status === 'PAID' ? 'eSewa Paid' : 'eSewa Failed'}</span>
                        </div>
                    ) : (
                        <div className="occ-payment cash">
                            <Banknote size={14} />
                            <span>Collect Cash</span>
                        </div>
                    )}
                    <span className="occ-total">NPR {order.total_price}</span>
                </div>
            </div>

            <div className="occ-middle">
                <div className="occ-customer">
                    <div className="occ-customer-item"><User size={14} /> <span>{order.user_info?.name}</span></div>
                    <div className="occ-customer-item"><Phone size={14} /> <span>{order.user_info?.phone}</span></div>
                    <div className="occ-customer-item"><Mail size={14} /> <span>{order.user_info?.email}</span></div>
                </div>

                {order.status !== 'REJECTED' && order.status !== 'CANCELLED' && (
                    <div className="occ-stepper-container">
                        <StatusStepper status={order.status} />
                    </div>
                )}
            </div>

            {expanded && (
                <div className="occ-items">
                    <div className="occ-items-header">Order Items</div>
                    {order.items.map((item) => (
                        <div key={item.id} className="occ-item-row">
                            <span className="occ-item-qty">{item.quantity}&times;</span>
                            <span className="occ-item-name">{item.menu_item_name}</span>
                            <span className="occ-item-price">NPR {item.subtotal}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="occ-bottom">
                <button className="occ-expand" onClick={() => setExpanded(!expanded)}>
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {expanded ? 'Hide items' : `${order.items.length} item(s)`}
                </button>

                {actions.length > 0 && (
                    <div className="occ-actions">
                        {actions.map(a => (
                            <button
                                key={a.next}
                                className={`btn ${a.variant} occ-action-btn`}
                                onClick={() => handleAction(a.next)}
                                disabled={updating}
                            >
                                {updating ? 'Updating...' : a.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const VendorOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('ALL');

    const alertedRef = useRef(new Set());
    const [minsLeftMap, setMinsLeftMap] = useState({});

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

    // Scheduled order reminder interval
    useEffect(() => {
        const checkScheduled = () => {
            setOrders(currentOrders => {
                const newMap = {};
                let playedSound = false;
                let newlyAlerted = false;

                currentOrders.forEach(order => {
                    if (!order.scheduled_time) return;
                    if (!ACTIVE_STATUSES.includes(order.status)) return;

                    const mins = minsUntilPickup(order.scheduled_time);
                    newMap[order.id] = mins;

                    if (mins !== null && mins >= -5 && mins <= ALERT_BEFORE_MINUTES && !alertedRef.current.has(order.id)) {
                        alertedRef.current.add(order.id);
                        newlyAlerted = true;
                        if (!playedSound) {
                            playSound();
                            playedSound = true;
                        }
                    }
                });

                setMinsLeftMap(newMap);

                if (newlyAlerted) {
                    document.title = 'Pickup Soon! — UniBites';
                    setTimeout(() => { document.title = 'Vendor Orders — UniBites'; }, 5000);
                }

                return currentOrders;
            });
        };

        checkScheduled();
        const timer = setInterval(checkScheduled, 30000); // every 30 seconds
        return () => clearInterval(timer);
    }, []);

    // WebSocket real-time new order alerts
    const wsRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const wsBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
            .replace(/^http/, 'ws');
        const ws = new WebSocket(`${wsBase}/ws/orders/?token=${token}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'new_order') {
                    setOrders(prev => [msg.order, ...prev]);

                    playSound();

                    document.title = 'New Order! — UniBites';
                    setTimeout(() => { document.title = 'Vendor Orders — UniBites'; }, 3000);
                }
            } catch (e) {
                console.warn('WS message parse error', e);
            }
        };

        ws.onerror = (e) => console.warn('WS error', e);

        return () => ws.close();
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // Re-compute minsLeftMap whenever orders change
    useEffect(() => {
        const map = {};
        orders.forEach(order => {
            if (order.scheduled_time && ACTIVE_STATUSES.includes(order.status)) {
                map[order.id] = minsUntilPickup(order.scheduled_time);
            }
        });
        setMinsLeftMap(map);
    }, [orders]);

    const handleRefresh = () => { setRefreshing(true); fetchOrders(); };

    const FILTER_TABS = [
        { key: 'ALL', label: 'All' },
        { key: 'PENDING_GROUP', label: 'Pending' },
        { key: 'COMPLETED', label: 'Completed' },
        { key: 'REJECTED_GROUP', label: 'Rejected / Cancelled' }
    ];

    const filteredOrders = orders.filter(o => {
        if (filter === 'ALL') return true;
        if (filter === 'PENDING_GROUP') return ACTIVE_STATUSES.includes(o.status);
        if (filter === 'COMPLETED') return o.status === 'COMPLETED';
        if (filter === 'REJECTED_GROUP') return ['REJECTED', 'CANCELLED'].includes(o.status);
        return false;
    });

    // Sort: urgent scheduled orders bubble to TOP, then by created_at desc
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        const aUrgent = minsLeftMap[a.id] !== undefined && minsLeftMap[a.id] >= 0 && minsLeftMap[a.id] <= ALERT_BEFORE_MINUTES;
        const bUrgent = minsLeftMap[b.id] !== undefined && minsLeftMap[b.id] >= 0 && minsLeftMap[b.id] <= ALERT_BEFORE_MINUTES;
        if (aUrgent && !bUrgent) return -1;
        if (!aUrgent && bUrgent) return 1;
        return 0;
    });

    const pendingCount = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;
    const urgentScheduledCount = Object.values(minsLeftMap).filter(m => m >= 0 && m <= ALERT_BEFORE_MINUTES).length;

    if (loading) return <div className="loading-spinner" />;

    const isToday = (dateString) => {
        const d = new Date(dateString);
        const now = new Date();
        return d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
    };

    const todaysSales = orders
        .filter(o => o.status === 'COMPLETED' && isToday(o.created_at))
        .reduce((sum, o) => sum + parseFloat(o.total_price), 0);

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

            {/* Urgent scheduled orders header or global alert bar */}
            {urgentScheduledCount > 0 && (
                <div className="urgent-alert-bar">
                    <AlertCircle size={18} />
                    <strong>
                        {urgentScheduledCount} scheduled order{urgentScheduledCount > 1 ? 's' : ''} with pickup within {ALERT_BEFORE_MINUTES} minutes!
                    </strong>
                    <span>Scroll down for details</span>
                </div>
            )}

            <div className="stats-grid st-col-5" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Orders', value: orders.length, color: 'var(--text-color)' },
                    { label: 'Pending', value: pendingCount, color: '#D97706' },
                    { label: 'Completed', value: orders.filter(o => o.status === 'COMPLETED').length, color: '#10B981' },
                    { label: 'Rejected', value: orders.filter(o => o.status === 'REJECTED' || o.status === 'CANCELLED').length, color: '#DC2626' },
                    { label: "Today's Sales", value: `NPR ${todaysSales.toFixed(2)}`, color: '#0F172A' },
                ].map((s, idx) => (
                    <div key={`${s.label}-${idx}`} className="stat-card">
                        <span className="stat-label">{s.label}</span>
                        <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                    </div>
                ))}
            </div>

            <div className="order-filters">
                {FILTER_TABS.map(f => (
                    <button
                        key={f.key}
                        className={`order-filter-btn ${filter === f.key ? 'active' : ''}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                        {f.key === 'PENDING_GROUP' && pendingCount > 0 && (
                            <span className="filter-badge">{pendingCount}</span>
                        )}
                    </button>
                ))}
            </div>

            {sortedOrders.length === 0 ? (
                <div className="orders-empty">
                    <ClipboardList size={56} strokeWidth={1.2} />
                    <p>No orders found for this tab.</p>
                </div>
            ) : (
                <div className="orders-list">
                    {sortedOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onStatusUpdate={fetchOrders}
                            minsLeft={minsLeftMap[order.id]}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default VendorOrders;
