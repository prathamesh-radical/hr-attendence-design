import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal, Image, StatusBar } from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useRoute } from "@react-navigation/native";

import {  BACKEND_URL } from "../utils/constants";

import AsyncStorage, { useAsyncStorage } from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Appbar, Button, Dialog, Divider, Menu, Portal } from "react-native-paper";

const EmployeeProfile = () => {
    const route = useRoute();
    const { emp_id, name, last_name } = route.params;
    const [menuVisible, setMenuVisible] = useState(false);
    const [logoutVisible, setLogoutVisible] = useState(false);

    const [state, setState] = useState({
        employee: null,
        loading: true,
        error: "",
        editableSections: { personal: false, work: false, bank: false },
        updatedFields: {},
        showDatePicker: { dob: false, join_date: false },
        modalVisible: false,
        currentSection: ""
    });

    const fetchEmployeeDetails = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const response = await axios.get(`${BACKEND_URL}/api/employees/data/${emp_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setState(prev => ({ ...prev, employee: response.data, loading: false }));
        } catch (err) {
            setState(prev => ({ ...prev, error: "Failed to load employee details", loading: false }));
            console.log(err);
        }
    }, [emp_id]);

    useEffect(() => {
        fetchEmployeeDetails();
    }, [fetchEmployeeDetails]);

    const toggleEdit = useCallback((section) => {
        setState(prev => ({ ...prev, currentSection: section, modalVisible: true }));
    }, []);

    const handleInputChange = useCallback((field, value) => {
        setState(prev => ({
            ...prev,
            updatedFields: { ...prev.updatedFields, [field]: value },
            employee: { ...prev.employee, [field]: value }
        }));
    }, []);

    const handleDateChange = useCallback((field, event, selectedDate) => {
        setState(prev => ({ ...prev, showDatePicker: { ...prev.showDatePicker, [field]: false } }));
        if (selectedDate) {
            handleInputChange(field, selectedDate.toISOString().split('T')[0]);
        }
    }, [handleInputChange]);

    const handleSave = useCallback(async () => {
        if (!Object.keys(state.updatedFields).length) {
            alert("No changes made.");
            return;
        }

        try {
            const token = await AsyncStorage.getItem("userToken");

            await axios.put(`${BACKEND_URL}/api/employees/update/${emp_id}`, state.updatedFields, {

                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Employee details updated successfully");
            setState(prev => ({ ...prev, modalVisible: false, updatedFields: {} }));
        } catch (error) {
            console.error("Update Error:", error);
            alert("Failed to update employee details");
        }
    }, [emp_id, state.updatedFields]);

    const handleLogout = async () => {
        try {
            await useAsyncStorage.multiRemove(["userToken", "adminId", "userName", "companyName"]);
            setLogoutVisible(false);
            navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
            });
        } catch (error) {
            console.error("Logout failed:", error);
            Toast.show({
                type: "error",
                text1: "Logout Failed",
                text2: "Something went wrong. Try again!",
            });
        }
    };

    const renderSection = (title, sectionKey, fields) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <TouchableOpacity style={styles.editButton} onPress={() => toggleEdit(sectionKey)}>
                    <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
            </View>
            {fields}
        </View>
    );

    const renderField = useCallback((type, label, field, section, isDisabled = false, key) => {
        switch (type) {
            case 'input':
                return renderInput(label, field, section, isDisabled, key);
            case 'gender':
                return renderGenderRadioButtons(label, field, section, isDisabled, key);
            case 'marital':
                return renderMaritalStatusDropdown(label, field, section, isDisabled, key);
            case 'date':
                return renderDatePicker(label, field, section, isDisabled, key);
            default:
                return null;
        }
    }, [state.employee, state.showDatePicker, handleInputChange, handleDateChange]);

    const renderInput = (label, field, section, isDisabled, key) => (
        <View style={styles.inputContainer} key={key}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.input}
                value={state.employee?.[field] || ""}
                onChangeText={(text) => handleInputChange(field, text)}
                editable={!isDisabled}
            />
        </View>
    );

    const renderGenderRadioButtons = (label, field, section, isDisabled, key) => {
        const genders = ["Male", "Female", "Other"];
        return (
            <View style={styles.inputContainer} key={key}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.radioButtonContainer}>
                    {genders.map(gender => (
                        <TouchableOpacity
                            key={`${key}-${gender}`}
                            style={styles.radioButton}
                            onPress={() => !isDisabled && handleInputChange(field, gender)}
                        >
                            <View style={styles.radioCircle}>
                                {state.employee?.[field] === gender && <View style={styles.selectedRb} />}
                            </View>
                            <Text style={styles.radioLabel}>{gender}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const renderMaritalStatusDropdown = (label, field, section, isDisabled, key) => {
        const maritalStatuses = ["Married", "Unmarried"];
        return (
            <View style={styles.inputContainer} key={key}>
                <Text style={styles.label}>{label}</Text>
                <Picker
                    selectedValue={state.employee?.[field] || ""}
                    style={styles.dropdown}
                    onValueChange={(itemValue) => !isDisabled && handleInputChange(field, itemValue)}
                    enabled={!isDisabled}
                >
                    {maritalStatuses.map(status => (
                        <Picker.Item key={`${key}-${status}`} label={status} value={status} />
                    ))}
                </Picker>
            </View>
        );
    };

    const renderDatePicker = (label, field, section, isDisabled, key) => {
        const dateValue = state.employee?.[field] ? new Date(state.employee[field]).toISOString().split('T')[0] : "";
        return (
            <View style={styles.inputContainer} key={key}>
                <Text style={styles.label}>{label}</Text>
                <TouchableOpacity onPress={() => !isDisabled && setState(prev => ({ ...prev, showDatePicker: { ...prev.showDatePicker, [field]: true } }))}>
                    <TextInput style={styles.input} value={dateValue} editable={false} />
                </TouchableOpacity>
                {state.showDatePicker[field] && (
                    <DateTimePicker
                        value={new Date(state.employee?.[field] || new Date())}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => handleDateChange(field, event, selectedDate)}
                    />
                )}
            </View>
        );
    };

    if (state.loading) return <ActivityIndicator size="large" color="#007bff" style={styles.loader} />;
    if (state.error) return <Text style={styles.error}>{state.error}</Text>;

    const personalFields = [
        { id: 'office_id', type: 'input', label: "ID", field: "office_id" },
        { id: 'name', type: 'input', label: "First Name", field: "name" },
        { id: 'father_name', type: 'input', label: "Father Name", field: "father_name" },
        { id: 'last_name', type: 'input', label: "Last Name", field: "last_name" },
        { id: 'designation', type: 'input', label: "Designation", field: "designation" },
        { id: 'phone', type: 'input', label: "Contact Number", field: "phone" },
        { id: 'email', type: 'input', label: "Email", field: "email" },
        { id: 'address', type: 'input', label: "Current Address", field: "address" },
        { id: 'city', type: 'input', label: "City", field: "city" },
        { id: 'state', type: 'input', label: "State", field: "state" },
        { id: 'postal_code', type: 'input', label: "Postal Code", field: "postal_code" },
        { id: 'country', type: 'input', label: "Country", field: "country" },
        { id: 'gender', type: 'gender', label: "Gender", field: "gender" },
        { id: 'dob', type: 'date', label: "Date of Birth", field: "dob" },
        { id: 'marital_status', type: 'marital', label: "Marital Status", field: "marital_status" },
        { id: 'blood_group', type: 'input', label: "Blood Group", field: "blood_group" },
    ];

    const workFields = [
        { id: 'join_date', type: 'date', label: "Date of Joining", field: "join_date" },
        { id: 'pan_number', type: 'input', label: "PAN Number", field: "pan_number" },
        { id: 'govt_registration_number', type: 'input', label: "Govt Registration Number", field: "govt_registration_number" },
        { id: 'pf_number', type: 'input', label: "PF Number", field: "pf_number" },
    ];

    const bankFields = [
        { id: 'bank_name', type: 'input', label: "Name of Bank", field: "bank_name" },
        { id: 'ifsc_code', type: 'input', label: "IFSC Code", field: "ifsc_code" },
        { id: 'account_number', type: 'input', label: "Account Number", field: "account_number" },
        { id: 'account_holder_name', type: 'input', label: "Name of Account Holder", field: "account_holder_name" },
        { id: 'upi_id', type: 'input', label: "UPI ID", field: "upi_id" },
    ];

    return (
        <View style={styles.container}>
            <StatusBar
                animated={true}
                backgroundColor="#307A59"
                barStyle="light-content"
            />
            <Appbar.Header style={styles.appBar}>
                <Appbar.Action
                    icon={() => <Image source={require("../../assets/icons/building.png")} style={styles.appbarIcon} />}
                    style={styles.appbarIconContainer}
                    color="#000"
                />
                <Appbar.Content title="Radical Global" color="#fff" titleStyle={styles.title} />
                <View style={styles.headerRight}>
                    <Menu
                        contentStyle={styles.menuContent}
                        style={styles.menu}
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={<Appbar.Action icon="account-circle-outline" color="#fff" style={styles.appbarMenuIcon} onPress={() => setMenuVisible(true)} />}
                    >
                        <Menu.Item
                            onPress={() => {
                                navigation.navigate("AdminProfile");
                                setMenuVisible(false);
                            }}
                            title="My Profile"
                            leadingIcon="account"
                        />
                        <Divider />
                        <Menu.Item
                            onPress={() => {
                                setMenuVisible(false);
                                setLogoutVisible(true);
                            }}
                            title="Logout"
                            leadingIcon="logout"
                        />
                    </Menu>
                </View>
            </Appbar.Header>
            <Portal>
                <Dialog style={styles.dialog} visible={logoutVisible} onDismiss={() => setLogoutVisible(false)}>
                    <Dialog.Title>Logout</Dialog.Title>
                    <Dialog.Content>
                        <Text>Are you sure you want to log out?</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setLogoutVisible(false)}>Cancel</Button>
                        <Button onPress={handleLogout}>Logout</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <View style={styles.headingContainer}>
                <Appbar.Header style={styles.headingAppBar}>
                    <Appbar.BackAction onPress={() => navigation.goBack()} />
                    <Appbar.Content title={`${name} ${last_name}`} color="#000" titleStyle={[styles.headingtText, {color: "#000"}]} />
                </Appbar.Header>
            </View>
            <ScrollView style={styles.subContainer}>
                {renderSection("Personal Info", "personal", personalFields.map(f => 
                    renderField(f.type, f.label, f.field, "personal", true, f.id)
                ))}
                {renderSection("Work Info", "work", workFields.map(f => 
                    renderField(f.type, f.label, f.field, "work", true, f.id)
                ))}
                {renderSection("Bank Details", "bank", bankFields.map(f => 
                    renderField(f.type, f.label, f.field, "bank", true, f.id)
                ))}

                <Modal visible={state.modalVisible} animationType="slide" transparent={false} onRequestClose={() => setState(prev => ({ ...prev, modalVisible: false }))}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity onPress={() => setState(prev => ({ ...prev, modalVisible: false }))} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>X</Text>
                            </TouchableOpacity>
                            <ScrollView>
                                <Text style={styles.modalHeader}>Edit {state.currentSection} Details</Text>
                                {state.currentSection === "personal" && personalFields.map(f => 
                                    renderField(f.type, f.label, f.field, "personal", false, f.id)
                                )}
                                {state.currentSection === "work" && workFields.map(f => 
                                    renderField(f.type, f.label, f.field, "work", false, f.id)
                                )}
                                {state.currentSection === "bank" && bankFields.map(f => 
                                    renderField(f.type, f.label, f.field, "bank", false, f.id)
                                )}
                                <View style={styles.buttonscontainer}>
                                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                        <Text style={styles.buttonText}>Save</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => setState(prev => ({ ...prev, modalVisible: false }))}>
                                        <Text style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F7F8FA"},
    subContainer: { flex: 1, backgroundColor: "#F7F8FA", paddingHorizontal: 20  },
    appBar: {
        backgroundColor: "#307A59",
        height: 100,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    title: {
        color: "#fff",
        bottom: 10,
    },
    appbarIconContainer: {
        bottom: 15,
    },
    appbarIcon: {
        height: 30,
        width: 30,
        tintColor: "#fff",
        resizeMode: "contain",
    },
    appbarMenuIcon: {
        bottom: 10,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 10,
    },
    menu: {
        position: "absolute",
        top: 45,
        right: 25,
    },
    menuContent: {
        backgroundColor: "#F7F8FA",
    },
    dialog: {
        backgroundColor: "#F7F8FA",
    },
    headingContainer: {
        paddingHorizontal: 20,
        elevation: 2,
        position: "relative",
        bottom: 30,
    },
    headingAppBar: {
        height: 50,
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 10,
        elevation: 2,
    },
    headingtText: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        right: 20,
    },
    section: { marginBottom: 20, padding: 15, backgroundColor: "#fff", borderRadius: 8, elevation: 2},
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: "bold" },
    editButton: { backgroundColor: "#307A59", paddingHorizontal: 25, paddingVertical: 10, borderRadius: 10 },
    buttonText: { color: "#fff", fontWeight: "bold" },
    saveButton: { backgroundColor: "#28a745", padding: 10, alignItems: "center", borderRadius: 5, marginTop: 10, width: 70 },
    cancelButton: { backgroundColor: "#dc3545", padding: 10, alignItems: "center", borderRadius: 5, marginTop: 10, width: 70 },
    inputContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, borderBottomWidth: 1, borderColor: "#ccc" },
    label: { fontWeight: "bold", color: "#333" },
    input: { padding: 8, bottom: 7 },
    radioButtonContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
    radioButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center",marginRight: 5, bottom: 5},
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#007bff",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 5,
    },
    selectedRb: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#007bff",
    },
    radioLabel: { fontSize: 16 },
    dropdown: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, marginTop: 5 },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        height: '75%',
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    closeButton: {
        position: 'absolute',
        bottom: 600,
        left: '55%',
        transform: [{ translateX: -10 }],
        zIndex: 10,
    },
    closeButtonText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#F6E6FA',
    },
    modalHeader: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
    buttonscontainer: { display: "flex", justifyContent: "space-between" },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
    error: { color: "red", textAlign: "center", marginTop: 20 }
});

export default EmployeeProfile;