import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
 
import EmployeeAttendanceDetails from "./EmployeeAttendanceDetails";
import EmployeeProfile from "./EmployeeProfile";
import EmployeeSalaryStructure from "./EmployeeSalaryStructure";
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Icons

const Tab = createBottomTabNavigator();

const EmployeeDetails = ({ route }) => {
    const { emp_id, name, last_name } = route.params;
    const navigation = useNavigation(); // Get navigation object

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Tab Navigation */}
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarStyle: styles.tabBar,
                    headerShown:false,
                    tabBarLabelStyle: styles.tabLabel,
                    tabBarIcon: ({ color, size }) => {
                        let iconName;

                        if (route.name === "Profile") {
                            iconName = "person-circle-outline";
                        } else if (route.name === "Attendance") {
                            iconName = "calendar-outline";
                        } else if (route.name === "Salary") {
                            iconName = "cash-outline";
                        }

                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                })}
            >
                <Tab.Screen 
                    name="Profile" 
                    component={EmployeeProfile} 
                    initialParams={{ emp_id, name, last_name }} 
                    options={{ tabBarLabel: "Profile" }}
                />
                <Tab.Screen 
                    name="Attendance" 
                    component={EmployeeAttendanceDetails} 
                    initialParams={{ emp_id, name, last_name }} 
                    options={{ tabBarLabel: "Attendance" }}
                />
                <Tab.Screen 
                    name="Salary" 
                    component={EmployeeSalaryStructure} 
                    initialParams={{ emp_id, name, last_name }} 
                    options={{ tabBarLabel: "Salary" }}
                />
            </Tab.Navigator>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#007bff", // Match panel color
    },
    panel: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 15, // Space below the notch
        paddingHorizontal: 15,
        paddingBottom: 10,
        backgroundColor: "#007bff",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    backButton: {
        marginRight: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
    },
    tabBar: {
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#ddd",
        
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: "bold",
    
    },
});

export default EmployeeDetails;
