
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Appearance, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import { NavigationContainer } from "@react-navigation/native";

import MainRoute from "./routes/MainRoute";
import Toast from "react-native-toast-message";

enableScreens(true);

export default function App() {
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        Appearance.setColorScheme('light');
    }, []);

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const token = await AsyncStorage.getItem("userToken");
                setIsLoggedIn(!!token);
            } catch (error) {
                console.error("Error retrieving token:", error);
            } finally {
                setLoading(false);
            }
        };

        checkLoginStatus();
    }, []);
    

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <PaperProvider>
                <MainRoute isLoggedIn={isLoggedIn} />
            </PaperProvider>
            <StatusBar
                animated={true}
                barStyle={"dark-content"}
                showHideTransition="slide"
                backgroundColor="#F7F8FA"
                networkActivityIndicatorVisible={true}
            />
            <Toast />
        </SafeAreaProvider>
    );
}