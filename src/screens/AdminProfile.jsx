import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";
import { TextInput, Button, Text, IconButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BACKEND_URL } from "../utils/constants";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const AdminProfileScreen = () => {
    const navigation = useNavigation();
    const [editing, setEditing] = useState(false);
    const [admin, setAdmin] = useState({
        first_name: "", last_name: "", email: "", 
        phone: "", company_name: "", country: ""
    });
    const [passwords, setPasswords] = useState({
        old: "", new: "", confirm: "",
        showOld: false, showNew: false, showConfirm: false
    });
    const [loading, setLoading] = useState({ profile: false, password: false });

    const fetchProfile = async () => {
        try {
            setLoading(prev => ({...prev, profile: true}));
            const token = await AsyncStorage.getItem("userToken");
            const { data } = await axios.get(`${BACKEND_URL}/api/admins/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdmin(data);
            Toast.show({ type: 'success', text1: 'Profile loaded' });
        } catch (error) {
            console.error("Fetch error:", error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load profile' });
        } finally {
            setLoading(prev => ({...prev, profile: false}));
        }
    };

    const handleUpdate = async () => {
        if (!admin.first_name || !admin.last_name || !admin.email) {
            return Toast.show({ type: 'error', text1: 'Error', text2: 'Required fields missing' });
        }

        try {
            setLoading(prev => ({...prev, profile: true}));
            const token = await AsyncStorage.getItem("userToken");
            const { data } = await axios.put(
                `${BACKEND_URL}/api/admins/update-profile`,
                admin,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Toast.show({ type: 'success', text1: 'Success', text2: data.message || 'Profile updated' });
            setEditing(false);
        } catch (error) {
            Toast.show({ 
                type: 'error', 
                text1: 'Error', 
                text2: error.response?.data?.message || "Update failed" 
            });
        } finally {
            setLoading(prev => ({...prev, profile: false}));
        }
    };

    const handlePasswordChange = async () => {
        const { old, new: newPass, confirm } = passwords;
        
        // Validation checks
        if (!old || !newPass || !confirm) {
          showToast('error', 'Error', 'All fields are required');
          return;
        }
        
        if (newPass !== confirm) {
          showToast('error', 'Error', 'Passwords do not match');
          return;
        }
        
        if (newPass.length < 6) {
          showToast('error', 'Error', 'Password must be at least 6 characters');
          return;
        }
      
        try {
          setLoading(prev => ({...prev, password: true}));
          const token = await AsyncStorage.getItem("userToken");
          
          const response = await axios.put(
            `${BACKEND_URL}/api/admins/change-password`,
            { oldPassword: old, newPassword: newPass },
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          showToast('success', 'Success', response.data?.message || 'Password changed successfully');
          
          // Clear password fields
          setPasswords({
            old: "",
            new: "",
            confirm: "",
            showOld: false,
            showNew: false,
            showConfirm: false
          });
          
        } catch (error) {
          const errorMessage = error.response?.data?.message || 
                              error.response?.data?.error || 
                              error.message || 
                              "Failed to update password";
          
          showToast('error', 'Error', errorMessage);
        } finally {
          setLoading(prev => ({...prev, password: false}));
        }
      };
    useEffect(() => { fetchProfile(); }, []);

    const togglePasswordVisibility = (field) => {
        setPasswords(prev => ({...prev, [`show${field}`]: !prev[`show${field}`]}));
    };

    const renderInput = (label, value, onChange, options = {}) => (
        <TextInput
            label={label}
            value={value}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            editable={editing}
            {...options}
        />
    );

    const renderPasswordInput = (label, field, icon) => (
        <TextInput
            label={`${label} *`}
            value={passwords[field]}
            onChangeText={text => setPasswords(prev => ({...prev, [field]: text}))}
            mode="outlined"
            secureTextEntry={!passwords[`show${field}`]}
            style={styles.input}
            left={<TextInput.Icon icon={icon} />}
            right={<TextInput.Icon
                icon={passwords[`show${field}`] ? "eye-off" : "eye"}
                onPress={() => togglePasswordVisibility(field)}
            />}
        />
    );

    return (
        <SafeAreaView>
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
                <Text variant="headlineSmall" style={styles.title}>Admin Profile</Text>
            </View>

            {/* Profile Fields */}
            <View style={styles.card}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Personal Information</Text>
                
                {renderInput("First Name *", admin.first_name, 
                    text => setAdmin(prev => ({...prev, first_name: text})), 
                    { left: <TextInput.Icon icon="account" /> }
                )}
                
                {renderInput("Last Name *", admin.last_name, 
                    text => setAdmin(prev => ({...prev, last_name: text})), 
                    { left: <TextInput.Icon icon="account" /> }
                )}
                
                {renderInput("Email *", admin.email, 
                    text => setAdmin(prev => ({...prev, email: text})), 
                    { 
                        left: <TextInput.Icon icon="email" />,
                        keyboardType: "email-address",
                        autoCapitalize: "none"
                    }
                )}
                
                {renderInput("Phone", admin.phone, 
                    text => setAdmin(prev => ({...prev, phone: text})), 
                    { 
                        left: <TextInput.Icon icon="phone" />,
                        keyboardType: "phone-pad"
                    }
                )}
                
                {renderInput("Company Name", admin.company_name, 
                    text => setAdmin(prev => ({...prev, company_name: text})), 
                    { left: <TextInput.Icon icon="office-building" /> }
                )}
                
                {renderInput("Country", admin.country, 
                    text => setAdmin(prev => ({...prev, country: text})), 
                    { left: <TextInput.Icon icon="earth" /> }
                )}

                {editing ? (
                    <View style={styles.buttonGroup}>
                        <Button
                            mode="contained-tonal"
                            onPress={() => {
                                setEditing(false);
                                Toast.show({ type: 'info', text1: 'Edit cancelled' });
                            }}
                            style={styles.cancelButton}
                            labelStyle={styles.buttonLabel}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleUpdate}
                            loading={loading.profile}
                            style={styles.saveButton}
                            labelStyle={styles.buttonLabel}
                        >
                            Save Changes
                        </Button>
                    </View>
                ) : (
                    <Button
                        mode="contained"
                        onPress={() => {
                            setEditing(true);
                            Toast.show({ type: 'info', text1: 'Editing mode enabled' });
                        }}
                        style={styles.button}
                        labelStyle={styles.buttonLabel}
                        icon="pencil"
                    >
                        Edit Profile
                    </Button>
                )}
            </View>

            {/* Change Password Section */}
            <View style={styles.card}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Change Password</Text>
                
                {renderPasswordInput("Current Password", "old", "lock")}
                {renderPasswordInput("New Password", "new", "lock-plus")}
                {renderPasswordInput("Confirm New Password", "confirm", "lock-check")}

                <Button
                    mode="contained"
                    onPress={handlePasswordChange}
                    loading={loading.password}
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                    icon="key-change"
                >
                    Update Password
                </Button>
            </View>

            {/* Delete Account Section */}
            <View style={[styles.card, styles.deleteCard]}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Account Actions</Text>
                <Button
                    mode="outlined"
                    onPress={() => navigation.navigate("DeleteAccount")}
                    style={styles.deleteButton}
                    labelStyle={styles.deleteButtonLabel}
                    icon="account-remove"
                >
                    Delete Account
                </Button>
                <Text style={styles.deleteWarningText}>
                    Warning: This action is irreversible. All data will be permanently deleted.
                </Text>
            </View>

            <Toast />
        </ScrollView>
        </SafeAreaView>
    );
};

const styles = {
    container: { flexGrow: 1, padding: 16, backgroundColor: "#f5f5f5" },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    title: { fontWeight: "bold", color: "#333", marginLeft: 8 },
    card: {
        backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16,
        elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 3
    },
    deleteCard: { borderLeftWidth: 4, borderLeftColor: "#FF3D00" },
    sectionTitle: { marginBottom: 16, color: "#333" },
    input: { marginBottom: 16, backgroundColor: "transparent" },
    buttonGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    button: { marginTop: 8, borderRadius: 8, paddingVertical: 6 },
    saveButton: { backgroundColor: "#6200ee", flex: 1, marginLeft: 8 },
    cancelButton: { flex: 1, marginRight: 8 },
    buttonLabel: { fontSize: 15, fontWeight: '500' },
    deleteButton: { borderColor: "#FF3D00", borderWidth: 1 },
    deleteButtonLabel: { color: "#FF3D00" },
    deleteWarningText: { color: "#FF3D00", fontSize: 13, marginTop: 12 }
};

export default AdminProfileScreen;