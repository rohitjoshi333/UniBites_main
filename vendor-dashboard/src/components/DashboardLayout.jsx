import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, LogOut, ChefHat } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import '../styles/dashboard.css';

const Sidebar = () => {
    const { logout } = React.useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <ChefHat size={32} />
                <span>UniBites Vendor</span>
            </div>
            <nav style={{ flex: 1 }}>
                <NavLink
                    to="/"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    end
                >
                    <LayoutDashboard size={20} />
                    <span>Overview</span>
                </NavLink>
                <NavLink
                    to="/menu"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <UtensilsCrossed size={20} />
                    <span>Menu Management</span>
                </NavLink>
            </nav>
            <button onClick={handleLogout} className="nav-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </div>
    );
};

const DashboardLayout = () => {
    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
