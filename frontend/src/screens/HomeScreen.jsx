import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, RefreshControl, ScrollView, Image, TouchableWithoutFeedback } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Appbar, Button, Card, Dialog, Portal, Text, Menu, Divider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";
import Toast from "react-native-toast-message";
import { Calendar } from "react-native-calendars";
import { BACKEND_URL } from "../utils/constants";
import LinearGradient from "react-native-linear-gradient";
import { Circle, Svg } from "react-native-svg";

const HomeScreen = () => {
    const [userName, setUserName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [employeeStats, setEmployeeStats] = useState({
        total_count: 0,
        male_count: 0,
        female_count: 0,
    });
    const [attendanceStats, setAttendanceStats] = useState({
        Present: 0,
        Absent: 0,
        "Half-Day": 0,
        Leave: 0,
    });
    const [menuVisible, setMenuVisible] = useState(false);
    const [logoutVisible, setLogoutVisible] = useState(false);
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const fetchData = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            if (!token) {
                navigation.navigate("Login");
                return;
            }

            const [storedName, storedCompanyName] = await Promise.all([
                AsyncStorage.getItem("userName"),
                AsyncStorage.getItem("companyName"),
            ]);

            setUserName(storedName || "Admin");
            setCompanyName(storedCompanyName || "Company");

            const [empResponse, attResponse] = await Promise.all([
                axios.get(`${BACKEND_URL}/api/employees/count`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${BACKEND_URL}/api/attendance/stats?date=${selectedDate}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setEmployeeStats({
                total_count: empResponse.data.total_count,
                male_count: empResponse.data.male_count,
                female_count: empResponse.data.female_count,
            });
            setAttendanceStats(attResponse.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to fetch data",
                position: "top",
            });
        } finally {
            setRefreshing(false);
        }
    }, [selectedDate, navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const handleLogout = async () => {
        try {
            await AsyncStorage.multiRemove(["userToken", "adminId", "userName", "companyName"]);
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

    const onDayPress = (day) => {
        setSelectedDate(day.dateString);
        setCalendarVisible(false);
    };

    const calendarTheme = {
        backgroundColor: "#ffffff",
        calendarBackground: "#ffffff",
        textSectionTitleColor: "#007bff",
        selectedDayBackgroundColor: "#007bff",
        selectedDayTextColor: "#ffffff",
        todayTextColor: "#007bff",
        dayTextColor: "#2d4150",
        textDisabledColor: "#d9e1e8",
        dotColor: "#007bff",
        selectedDotColor: "#ffffff",
        arrowColor: "#007bff",
        monthTextColor: "#007bff",
        indicatorColor: "#007bff",
        textDayFontWeight: "300",
        textMonthFontWeight: "bold",
        textDayHeaderFontWeight: "300",
        textDayFontSize: 16,
        textMonthFontSize: 16,
        textDayHeaderFontSize: 16,
    };

    const radius = 40;
    const strokeWidth = 7;
    const circumference = 2 * Math.PI * radius;
    const progress = (employeeStats?.female_count / employeeStats?.total_count ) * circumference;

    return (
        <View style={styles.container}>
            {/* Header */}
            <Appbar.Header style={styles.header}>
                <Appbar.Action icon={() => <Image source={require("../../assets/icons/building.png")} style={styles.appbarIcon} />} color="#000" />
                <Appbar.Content title={companyName} color="#000" titleStyle={styles.companyName} mode="small" />
                <View style={styles.headerRight}>
                    <Menu
                        contentStyle={styles.menuContent}
                        style={styles.menu}
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={<Appbar.Action icon="account-circle-outline" color="#000" onPress={() => setMenuVisible(true)} />}
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

            {/* Logout Confirmation Dialog */}
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

            {/* Main Content */}
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#007bff"]}
                        tintColor="#007bff"
                    />
                }
            >
                {/* Date Picker */}
                <TouchableWithoutFeedback onPress={() => setCalendarVisible(!calendarVisible)}>
                    <LinearGradient style={styles.datePickerContainer} colors={['#A0C6B5', '#479170', '#A0C6B5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Icon name="chevron-left" size={24} color="#fff" />
                        <Text style={styles.dateText}>{selectedDate}</Text>
                        <Icon name="chevron-right" size={24} color="#fff" />
                    </LinearGradient>
                </TouchableWithoutFeedback>

                {calendarVisible && (
                    <Calendar
                        onDayPress={onDayPress}
                        markedDates={{
                            [selectedDate]: { selected: true, selectedColor: "#007bff" },
                        }}
                        theme={calendarTheme}
                        style={styles.calendar}
                    />
                )}

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statsSvgContainer}>
                        <Svg style={styles.statsSvg} width={180} height={189} viewBox="0 0 100 100" onPress={() => navigation.navigate("ViewEmployees")}>
                            <Circle
                                cx="50"
                                cy="50"
                                r={radius}
                                stroke="#F88256"
                                strokeWidth={strokeWidth}
                                fill="none"
                            />
                            <View style={styles.statsTextContainer}>
                                <Text style={styles.statsText}>{employeeStats?.total_count}</Text>
                                <Text style={styles.statsLabel}>Total Employees</Text>
                            </View>
                            <Circle
                                cx="50"
                                cy="50"
                                r={radius}
                                stroke="#4E3AD1"
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference - progress}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                            />
                        </Svg>
                        <View style={styles.genderContainer}>
                            <View style={[styles.genderSubContainer, styles.maleSubContainer]}>
                                <Icon name="circle" size={15} color="#F88256" />
                                <View style={styles.genderTextContainer}>
                                    <Text style={styles.maleText}>{employeeStats?.male_count}</Text>
                                    <Text style={styles.genderLabel}>Male Employees</Text>
                                </View>
                            </View>
                            <View style={styles.genderSubContainer}>
                                <Icon name="circle" size={15} color="#4E3AD1" />
                                <View style={styles.genderTextContainer}>
                                    <Text style={styles.maleText}>{employeeStats?.female_count}</Text>
                                    <Text style={styles.genderLabel}>Female Employees</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    {/* <Card style={styles.statsCard} onPress={() => navigation.navigate("ViewEmployees")}>
                        <Card.Content style={styles.cardContent}>
                            <Icon name="account-group" size={30} color="#007bff" />
                            <Text style={styles.cardTitle}>Total Employees</Text>
                            <Text style={styles.statCount}>{employeeStats.total_count}</Text>
                            <View style={styles.genderContainer}>
                                <Text style={styles.genderText}>
                                    <Icon name="human-male" size={16} color="#007bff" /> Male: {employeeStats.male_count}
                                </Text>
                                <Text style={styles.genderText}>
                                    <Icon name="human-female" size={16} color="#ff69b4" /> Female: {employeeStats.female_count}
                                </Text>
                            </View>
                        </Card.Content>
                    </Card> */}
                    <Card style={styles.statsCard}>
                        <Card.Content style={styles.cardContent}>
                            <View style={[styles.cardIconContainer, {backgroundColor: "#E5F2E5"}]}>
                                <Image source={require("../../assets/icons/present.png")} style={styles.cardIcon} />
                            </View>
                            <Text style={styles.cardTitle}>Present</Text>
                            <Text style={styles.statCount}>{attendanceStats.Present}</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.statsCard}>
                        <Card.Content style={styles.cardContent}>
                            <View style={[styles.cardIconContainer, {backgroundColor: "#F8E5E5"}]}>
                                <Image source={require("../../assets/icons/absent.png")} style={styles.cardIcon} />
                            </View>
                            <Text style={styles.cardTitle}>Absent</Text>
                            <Text style={styles.statCount}>{attendanceStats.Absent}</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.statsCard}>
                        <Card.Content style={styles.cardContent}>
                            <View style={[styles.cardIconContainer, {backgroundColor: "#FEF6E5"}]}>
                                <Image source={require("../../assets/icons/half-day.png")} style={styles.cardIcon} />
                            </View>
                            <Text style={styles.cardTitle}>Half-Day</Text>
                            <Text style={styles.statCount}>{attendanceStats["Half-Day"]}</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.statsCard}>
                        <Card.Content style={styles.cardContent}>
                            <View style={[styles.cardIconContainer, {backgroundColor: "#E5E5FE"}]}>
                                <Image source={require("../../assets/icons/leave.png")} style={styles.cardIcon} />
                            </View>
                            <Text style={styles.cardTitle}>Leave</Text>
                            <Text style={styles.statCount}>{attendanceStats.Leave}</Text>
                        </Card.Content>
                    </Card>
                </View>
            </ScrollView>

            <Toast />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F8FA",
    },
    appbarIcon: {
        height: 30,
        width: 30,
        tintColor: "#000",
        resizeMode: "contain",
        bottom: 5,
    },
    dialog: {
        backgroundColor: "#F7F8FA",
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    header: {
        backgroundColor: "#F7F8FA",
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 10,
    },
    companyName: {
        color: "#000",
        fontSize: 18,
        fontWeight: "bold",
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
    datePickerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 15,
        padding: 13,
        backgroundColor: "#479170",
        borderRadius: 15,
        elevation: 4,
    },
    dateText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
        marginLeft: 10,
    },
    calendar: {
        marginHorizontal: 20,
        borderRadius: 8,
        elevation: 4,
    },
    cardTitle: {
        color: "black",
        marginTop: 8,
        fontSize: 16,
        fontWeight: "bold",
        position: "absolute",
        left: "25%",
    },
    statsContainer: {
        flexWrap: "wrap",
        justifyContent: "space-around",
        paddingHorizontal: 10,
        marginHorizontal: 10,
    },
    statsSvgContainer: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        alignContent: "center",
        gap: 20,
    },
    statsSvg: {
        marginVertical: 10,
    },
    statsTextContainer: {
        flex: 1,
        justifyContent: "center",
        alignContent: "center",
        position: "absolute",
        top: 60,
        left: 37,
    },
    statsText: {
        fontSize: 30,
        fontWeight: "bold",
        textAlign: "center",
    },
    statsLabel: {
        textAlign: "center",
    },
    genderContainer: {
        flex: 1,
        justifyContent: "flex-start",
        alignContent: "flex-start",
    },
    genderSubContainer: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        alignContent: "center",
        marginRight: 10,
        marginTop: 10,
        right: 15,
    },
    maleSubContainer: {
        position: "relative",
        top: 30,
        right: 22,
    },
    genderTextContainer: {
        bottom: 6,
        left: 8,
        alignContent: "center",
    },
    maleText: {
        fontSize: 20,
        fontWeight: "bold",
    },
    genderLabel: {
        textAlign: "center",
    },
    statsCard: {
        width: "100%",
        marginBottom: 15,
        elevation: 4,
        backgroundColor: "#fff",
        borderRadius: 15,
    },
    cardContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardIconContainer: {
        borderRadius: 50,
        padding: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    cardIcon: {
        height: 25,
        width: 25,
        resizeMode: "contain",
    },
    statCount: {
        color: "black",
        fontSize: 25,
        fontWeight: "bold",
        marginTop: 5,
    },
    genderContainer: {
        marginTop: 8,
        alignItems: "center",
    },
    genderText: {
        fontSize: 12,
        color: "black",
        marginTop: 2,
    },
});

export default HomeScreen;