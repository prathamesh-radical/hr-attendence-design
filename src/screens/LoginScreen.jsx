import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Dimensions, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { Button } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import { BACKEND_URL } from "../utils/constants";

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(true);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Email and password are required",
                position: "top",
                visibilityTime: 3000
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${BACKEND_URL}/api/auth/login`, { 
                email, 
                password 
            });

            if (response.status === 403) {
                Toast.show({
                    type: "error",
                    text1: "Account Deactivated",
                    text2: response.data?.message || "Please contact support to reactivate",
                    position: "top",
                    visibilityTime: 4000
                });
                console.log("not ok", response);
                return;
            }

            const { token, adminId, name, company } = response.data;

            if (!token || !adminId) {
                throw new Error("Invalid response from server");
            }

            await AsyncStorage.multiSet([
                ["userToken", token],
                ["adminId", String(adminId)],
                ["userName", name || ""],
                ["companyName", company || ""]
            ]);

            Toast.show({
                type: "success",
                text1: "Login Successful",
                text2: `Welcome back, ${name}!`,
                position: "top",
                visibilityTime: 2000
            });

            setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: "Tabs" }], 
                }); 
            }, 500);
            
        } catch (error) {
            console.log("error", error);
            let errorMessage = "Login failed. Please try again.";
            
            if (error.response) {
                // Handle specific error cases
                if (error.response.status === 403) {
                    errorMessage = error.response.data?.message || "Account deactivated. Contact support.";
                } else if (error.response.status === 401) {
                    errorMessage = "Invalid email or password";
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            }

            Toast.show({
                type: "error",
                text1: "Login Failed",
                text2: errorMessage,
                position: "top",
                visibilityTime: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
                <Text style={styles.title}>Welcome Back 👋</Text>
                <Text></Text>
            </View>
          
            <Text style={styles.subtitle}>Sign In Your Account</Text>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
                placeholder="Your Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                placeholderTextColor="#737373"
            />
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
                <TextInput
                    placeholder="Your Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={passwordVisible}
                    style={[styles.input, styles.passwordInput]}
                    placeholderTextColor="#737373"
                />
                <TouchableOpacity
                    style={styles.eyeIconContainer}
                    onPress={() => setPasswordVisible(!passwordVisible)}
                >
                    <Icon
                        name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                        size={width * 0.07} // Responsive icon size
                        color="#737373"
                    />
                </TouchableOpacity>
            </View>
            {/* <Button 
                mode="text" 
                onPress={() => navigation.navigate("ForgetPassword")} 
                style={styles.forgetPasswordButton}
                labelStyle={styles.forgetPasswordButtonLabel}
            >
                Forget Password ?
            </Button> */}
            <Button 
                mode="contained" 
                onPress={handleLogin} 
                loading={loading} 
                disabled={loading}
                style={styles.button} 
                labelStyle={styles.buttonLabel}
            >
                Login
            </Button>
            <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                    Don't have an account?{" "}
                    <Text 
                        style={styles.signupLink}
                        onPress={() => navigation.navigate("Signup")}
                    >
                        Sign Up
                    </Text>
                </Text>
            </View>
            <Toast />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: "center",
        backgroundColor: "#F7F8FA",
        paddingHorizontal: width * 0.05, // 5% of screen width
    },
    header: {
        marginTop: height * 0.12, // Responsive margin (12% of screen height)
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginBottom: height * 0.015, // Responsive margin
    },
    title: {
        fontSize: width * 0.07, // Responsive font size (7% of screen width)
        fontWeight: "700",
        color: "#000",
        marginRight: width * 0.25, // Responsive margin
    },
    subtitle: {
        fontSize: width * 0.035, // Responsive font size (3.5% of screen width)
        color: "#757575",
        marginBottom: height * 0.04, // Responsive margin
        alignSelf: "flex-start",
    },
    inputLabel: {
        fontSize: width * 0.045, // Responsive font size (4.5% of screen width)
        color: "black",
        alignSelf: "flex-start",
        marginBottom: height * 0.01, // Responsive margin
        fontWeight: "bold",
    },
    input: {
        marginBottom: height * 0.030, // Responsive margin
        borderRadius: 10,
        height: height * 0.06, // Responsive height (6% of screen height)
        width: "100%",
        paddingVertical: height * 0.002, // Responsive padding
        paddingHorizontal: width * 0.05, // Responsive padding
        backgroundColor: "#E6E6E6",
    },
    inputContent: {
        fontSize: width * 0.04, // Responsive font size (4% of screen width)
        paddingHorizontal: width * 0.025, // Responsive padding
    },
    inputOutline: {
        borderWidth: 0,
        borderRadius: 10,
    },
    passwordContainer: {
        position: "relative",
        width: "100%",
        marginBottom: height * 0.025, // Responsive margin
    },
    passwordInput: {
        paddingRight: width * 0.1, // Responsive padding for eye icon
    },
    eyeIconContainer: {
        position: "absolute",
        right: width * 0.025, // Responsive positioning
        top: "32%",
        transform: [{ translateY: -height * 0.015 }], // Responsive centering
    },
    forgetPasswordButton: {
        alignSelf: "flex-start",
        marginBottom: height * 0.04, // Responsive margin
        marginTop: -height * 0.025, // Responsive margin
    },
    forgetPasswordButtonLabel: {
        color: "#000",
        fontSize: width * 0.035, // Responsive font size (3.5% of screen width)
        fontWeight: "500",
    },
    button: {
        backgroundColor: "#307A59",
        paddingVertical: height * 0.005, // Responsive padding
        borderRadius: 10,
        width: "100%",
        marginTop: height * 0.025, // Responsive margin
    },
    buttonLabel: {
        fontSize: width * 0.04, // Responsive font size (4% of screen width)
        fontWeight: "600",
        color: "#fff",
    },
    signupContainer: {
        marginTop: height * 0.12, // Responsive margin (12% of screen height)
        alignItems: "center",
    },
    signupText: {
        fontSize: width * 0.045, // Responsive font size (4.5% of screen width)
        color: "#757575",
    },
    signupLink: {
        color: "#2e7d32",
        textDecorationLine: "none",
        fontWeight: "800",
    },
});

export default LoginScreen;