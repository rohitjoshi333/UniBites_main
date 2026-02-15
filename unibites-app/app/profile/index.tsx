import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, updateProfile, changePassword } from '../../services/profileService';

export default function ProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
    const [saving, setSaving] = useState(false);

    // Password Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [pwdLoading, setPwdLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await getProfile();
            setProfile(data);
            setEditForm({ full_name: data.full_name, phone: data.phone || '' });
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await SecureStore.deleteItemAsync('accessToken');
                    await SecureStore.deleteItemAsync('refreshToken');
                    router.replace('/');
                }
            }
        ]);
    };

    const handleSaveProfile = async () => {
        // Basic Client Validation
        if (!editForm.full_name.trim()) {
            Alert.alert("Validation Error", "Name cannot be empty.");
            return;
        }
        if (editForm.phone && !/^\d{10}$/.test(editForm.phone)) {
            Alert.alert("Validation Error", "Phone number must be 10 digits.");
            return;
        }

        setSaving(true);
        try {
            const updated = await updateProfile(editForm);
            setProfile(updated);
            setIsEditing(false);
            Alert.alert("Success", "Profile updated successfully.");
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.phone?.[0] || error.response?.data?.full_name?.[0] || "Failed to update profile.";
            Alert.alert("Error", msg);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (pwdForm.new_password.length < 8) {
            Alert.alert("Error", "New password must be at least 8 characters.");
            return;
        }
        if (pwdForm.new_password !== pwdForm.confirm_password) {
            Alert.alert("Error", "New passwords do not match.");
            return;
        }

        setPwdLoading(true);
        try {
            await changePassword({
                old_password: pwdForm.old_password,
                new_password: pwdForm.new_password,
                confirm_password: pwdForm.confirm_password
            });
            Alert.alert("Success", "Password changed successfully.");
            setModalVisible(false);
            setPwdForm({ old_password: '', new_password: '', confirm_password: '' });
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.old_password?.[0] ||
                error.response?.data?.non_field_errors?.[0] ||
                "Failed to change password.";
            Alert.alert("Error", msg);
        } finally {
            setPwdLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2E3566" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                    </Text>
                </View>
                <Text style={styles.name}>{profile?.full_name}</Text>
                <Text style={styles.email}>{profile?.email}</Text>
                <View style={[styles.badge, profile?.is_email_verified ? styles.verified : styles.unverified]}>
                    <Text style={styles.badgeText}>
                        {profile?.is_email_verified ? "Verified Student" : "Unverified"}
                    </Text>
                </View>
            </View>

            {/* Profile Details Card */}
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.label}>Full Name</Text>
                    {isEditing ? (
                        <TextInput
                            style={styles.input}
                            value={editForm.full_name}
                            onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
                        />
                    ) : (
                        <Text style={styles.value}>{profile?.full_name}</Text>
                    )}
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={styles.label}>Phone</Text>
                    {isEditing ? (
                        <TextInput
                            style={styles.input}
                            value={editForm.phone}
                            onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                    ) : (
                        <Text style={styles.value}>{profile?.phone || "Not set"}</Text>
                    )}
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={styles.label}>Role</Text>
                    <Text style={styles.value}>{profile?.role}</Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                {isEditing ? (
                    <View style={styles.editActions}>
                        <TouchableOpacity
                            style={[styles.btn, styles.cancelBtn]}
                            onPress={() => {
                                setIsEditing(false);
                                setEditForm({ full_name: profile.full_name, phone: profile.phone || '' });
                            }}
                            disabled={saving}
                        >
                            <Text style={styles.btnTextBlack}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btn, styles.saveBtn]}
                            onPress={handleSaveProfile}
                            disabled={saving}
                        >
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextWhite}>Save Changes</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.outlineBtn} onPress={() => setIsEditing(true)}>
                        <Ionicons name="create-outline" size={20} color="#2E3566" />
                        <Text style={styles.outlineBtnText}>Edit Profile</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.outlineBtn, { marginTop: 12 }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="key-outline" size={20} color="#2E3566" />
                    <Text style={styles.outlineBtnText}>Change Password</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#FF4545" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Change Password Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Change Password</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Current Password"
                            secureTextEntry
                            value={pwdForm.old_password}
                            onChangeText={(t) => setPwdForm({ ...pwdForm, old_password: t })}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="New Password (min 8 chars)"
                            secureTextEntry
                            value={pwdForm.new_password}
                            onChangeText={(t) => setPwdForm({ ...pwdForm, new_password: t })}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Confirm New Password"
                            secureTextEntry
                            value={pwdForm.confirm_password}
                            onChangeText={(t) => setPwdForm({ ...pwdForm, confirm_password: t })}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.btn, styles.cancelBtn, { flex: 1, marginRight: 8 }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.btnTextBlack}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btn, styles.saveBtn, { flex: 1, marginLeft: 8 }]}
                                onPress={handleChangePassword}
                                disabled={pwdLoading}
                            >
                                {pwdLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextWhite}>Update</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    header: {
        backgroundColor: '#fff',
        paddingVertical: 30,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E0E2E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2E3566',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    verified: {
        backgroundColor: '#DEF7EC',
    },
    unverified: {
        backgroundColor: '#FDE8E8',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#03543F', // Green for verified
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    label: {
        fontSize: 14,
        color: '#888',
        flex: 1,
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        flex: 2,
        textAlign: 'right',
    },
    input: {
        flex: 2,
        textAlign: 'right',
        fontSize: 16,
        color: '#2E3566',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
    },
    actions: {
        padding: 16,
        marginTop: 10,
    },
    btn: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtn: {
        backgroundColor: '#2E3566',
    },
    cancelBtn: {
        backgroundColor: '#F0F0F0',
    },
    btnTextWhite: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    btnTextBlack: {
        color: '#333',
        fontWeight: '600',
        fontSize: 16,
    },
    outlineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2E3566',
        backgroundColor: '#fff',
    },
    outlineBtnText: {
        marginLeft: 8,
        color: '#2E3566',
        fontWeight: '600',
        fontSize: 16,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        marginTop: 24,
    },
    logoutText: {
        marginLeft: 8,
        color: '#FF4545',
        fontWeight: '600',
        fontSize: 16,
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#2E3566',
    },
    modalInput: {
        backgroundColor: '#F7F7F7',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: 12,
    }
});
