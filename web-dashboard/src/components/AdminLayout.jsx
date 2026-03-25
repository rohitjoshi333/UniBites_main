import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Store, LogOut, FileText, ClipboardList, Settings, Activity, Image } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import '../styles/dashboard.css';

const AdminSidebar = () => {
    const { logout } = React.useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="sidebar admin-sidebar">
            <div className="sidebar-header">
                <img src="/logo.png" alt="UniBites Logo" className="sidebar-logo" />
            </div>
            <nav style={{ flex: 1 }}>
                <NavLink
                    to="/admin"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    end
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink
                    to="/admin/activities"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Activity size={20} />
                    <span>Activity Log</span>
                </NavLink>
                <NavLink
                    to="/admin/users"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Users size={20} />
                    <span>Manage User</span>
                </NavLink>
                <NavLink
                    to="/admin/canteens"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Store size={20} />
                    <span>Manage Canteens</span>
                </NavLink>
                <NavLink
                    to="/admin/banners"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Image size={20} />
                    <span>Manage Banners</span>
                </NavLink>
                <NavLink
                    to="/admin/reports"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <FileText size={20} />
                    <span>Reports</span>
                </NavLink>
            </nav>
            <div className="logout-btn">
                <button onClick={handleLogout} className="nav-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

const AdminLayout = () => {
    return (
        <div className="dashboard-container">
            <AdminSidebar />
            <main className="main-content admin-main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
