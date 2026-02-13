import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("access_token");
            const role = localStorage.getItem("user_role");
            const fullName = localStorage.getItem("user_full_name");

            if (token && role === "VENDOR") {
                setUser({ role, full_name: fullName });
            } else {
                localStorage.clear();
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post("auth/login/", { email, password });
            const { access, refresh, role, full_name } = response.data;

            if (role !== "VENDOR") {
                alert("Access denied. Only vendors can log in.");
                return false;
            }

            localStorage.setItem("access_token", access);
            localStorage.setItem("refresh_token", refresh);
            localStorage.setItem("user_role", role);
            localStorage.setItem("user_full_name", full_name);

            setUser({ role, full_name });
            return true;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
