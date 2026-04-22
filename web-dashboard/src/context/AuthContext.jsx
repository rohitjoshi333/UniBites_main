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

            if (token && (role === "VENDOR" || role === "ADMIN")) {
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

            if (role !== "VENDOR" && role !== "ADMIN") {
                return { success: false, message: "Access denied. Only vendors and admins can log in." };
            }

            localStorage.setItem("access_token", access);
            localStorage.setItem("refresh_token", refresh);
            localStorage.setItem("user_role", role);
            localStorage.setItem("user_full_name", full_name);

            setUser({ role, full_name });
            return { success: true, role };
        } catch (error) {
            console.log("Login failed:", error.userMessage);
            return { success: false, message: error.userMessage || "Invalid email or password." };
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
