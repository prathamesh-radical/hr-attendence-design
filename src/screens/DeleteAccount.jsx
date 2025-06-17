import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { Text, Button, TextInput, IconButton, Dialog, Portal, Paragraph } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BACKEND_URL } from "../utils/constants";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const DeleteAccount = () => {
    const navigation = useNavigation();
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);

    const verifyPassword = async () => {
        if (!password) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter your password', visibilityTime: 3000, position: 'top' });
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("userToken");
            const response = await axios.post(
                `${BACKEND_URL}/api/admins/verify-password`,
                { password },
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );

            if (response.data?.success) {
                setDialogVisible(false);
                setConfirmDialogVisible(true);
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: response.data?.message || "Verification failed", visibilityTime: 3000, position: 'top' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || "Password verification failed", visibilityTime: 3000, position: 'top' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivateAccount = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("userToken");
            const response = await axios.post(
                `${BACKEND_URL}/api/admins/deactivate-account`,
                {},
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );

            if (response.data?.success) {
                await AsyncStorage.clear();
                navigation.replace("Login");
                Toast.show({ type: 'success', text1: 'Account Deactivated', text2: response.data.message || 'Your account has been deactivated', visibilityTime: 3000, position: 'top' });
            } else {
                throw new Error(response.data?.message || "Deactivation failed");
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || error.message || "Failed to deactivate account", visibilityTime: 3000, position: 'top' });
        } finally {
            setLoading(false);
            setConfirmDialogVisible(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <IconButton
                    icon="arrow-left"
                    size={24}
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                />
                <Text variant="headlineSmall" style={styles.title}>Deactivate Account</Text>
            </View>

            <View style={styles.card}>
                <Text variant="titleLarge" style={styles.warningTitle}>Warning!</Text>
                <Text style={styles.warningText}>Deactivating your account will:</Text>
                <Text style={styles.warningText}>• Remove your access to all services immediately</Text>
                <Text style={styles.warningText}>• Preserve your data for potential recovery</Text>
                <Text style={[styles.warningText, { fontStyle: 'italic' }]}>Contact support to reactivate your account</Text>

                <Button
                    mode="contained"
                    onPress={() => setDialogVisible(true)}
                    style={styles.deleteButton}
                    labelStyle={styles.deleteButtonLabel}
                    icon="alert-octagon"
                    contentStyle={styles.buttonContent} // Added for better text alignment
                >
                    Deactivate My Account
                </Button>
            </View>

            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => { setDialogVisible(false); setPassword(""); }}>
                    <Dialog.Title style={styles.dialogTitle}>Verify Password</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph style={styles.dialogText}>To deactivate your account, please enter your password:</Paragraph>
                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry={!showPassword}
                            style={styles.dialogInput}
                            left={<TextInput.Icon icon="lock-alert" />}
                            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                            autoFocus
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => { setDialogVisible(false); setPassword(""); }} textColor="#666">Cancel</Button>
                        <Button onPress={verifyPassword} loading={loading} disabled={loading || !password} textColor="#FF3D00">Verify</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={confirmDialogVisible} onDismiss={() => setConfirmDialogVisible(false)}>
                    <Dialog.Title style={styles.dialogTitle}>Confirm Account Deactivation</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph style={styles.dialogWarningText}>This will:</Paragraph>
                        <Paragraph style={styles.dialogText}>• Deactivate your account immediately</Paragraph>
                        <Paragraph style={styles.dialogText}>• Restrict all access to the system</Paragraph>
                        <Paragraph style={styles.dialogText}>• Preserve your data for future recovery</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setConfirmDialogVisible(false)} textColor="#666">Cancel</Button>
                        <Button
                            onPress={handleDeactivateAccount}
                            loading={loading}
                            disabled={loading}
                            style={styles.confirmDeleteButton}
                            labelStyle={styles.confirmDeleteButtonLabel}
                            contentStyle={styles.buttonContent} // Added for better text alignment
                        >
                            Confirm Deactivation
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <Toast />
        </ScrollView>
    );
};

const styles = {
    container: {
        flexGrow: 1,
        padding: 16,
        backgroundColor: "#f5f5f5",
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        marginRight: 8,
    },
    title: {
        fontWeight: "bold",
        color: "#333",
        marginLeft: 8,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    warningTitle: {
        color: "#FF3D00",
        fontWeight: 'bold',
        marginBottom: 12,
    },
    warningText: {
        color: "#555",
        marginBottom: 16,
        lineHeight: 22,
    },
    deleteButton: {
        marginTop: 16,
        backgroundColor: "#FF3D00",
        borderRadius: 8,
        paddingVertical: 4, // Added for better button height
    },
    deleteButtonLabel: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    dialogTitle: {
        color: "#333",
        fontWeight: 'bold',
    },
    dialogText: {
        color: "#555",
    },
    dialogWarningText: {
        color: "#FF3D00",
        fontWeight: 'bold',
    },
    dialogInput: {
        marginTop: 10,
        backgroundColor: "transparent",
    },
    confirmDeleteButton: {
        backgroundColor: "#FF3D00",
        marginLeft: 8,
        borderRadius: 8,
        paddingVertical: 4, // Added for better button height
    },
    confirmDeleteButtonLabel: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    buttonContent: {
        paddingVertical: 4, // Ensures proper padding for text
        paddingHorizontal: 8, // Adds horizontal padding for better text display
    },
};

export default DeleteAccount;