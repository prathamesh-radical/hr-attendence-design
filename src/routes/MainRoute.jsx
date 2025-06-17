import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  View,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import{createNativeStackNavigator} from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import SignupScreen from "../screens/SignupScreen";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import MarkAttendenceScreen from "../screens/MarkAttendence/MarkAttendenceScreen";
import AdminProfile from "../screens/AdminProfile";
import EmployeeAttendanceDetails from "../screens/EmployeeAttendanceDetails";
import EmployeeDetails from "../screens/EmployeeDetails";
import Salary from "../screens/Salary";
import SalaryDetails from "../screens/SalaryDetails";

import RegisterEmployeeScreen from "../screens/RegisterEmployeeScreen";
import ViewEmployees from "../screens/ViewEmployees";
import AddWeekends from "../screens/Settings/AddWeekends";
import DeleteAccount from "../screens/DeleteAccount";
import Settings from "../screens/Settings/Settings";
import AddOfficeTime from "../screens/Settings/AddOfficeTime";
import AddHolidays from "../screens/Settings/AddHolidays";
import AddLeaves from "../screens/Settings/AddLeaves";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TABS = ['MarkAttendanceTab', 'SalaryTab', 'HomeTab', 'AddStaffTab', 'SettingsTab'];
const BOTTOM_APPBAR_HEIGHT = 55;

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { bottom } = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(0)).current;
  const [tabWidth, setTabWidth] = useState(Dimensions.get('window').width / TABS.length);

  // Update tab width on dimension change
  useEffect(() => {
    const updateTabWidth = () => {
      setTabWidth(Dimensions.get('window').width / TABS.length);
    };

    const subscription = Dimensions.addEventListener('change', updateTabWidth);
    updateTabWidth();

    return () => subscription?.remove();
  }, []);

  // Animate the indicator when the active tab changes
  useEffect(() => {
    const newIndex = state.index;
    Animated.timing(translateX, {
      toValue: newIndex * tabWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth]);

  // Get icon name based on route
  const getIconName = (routeName, isFocused) => {
    let iconName;
    if (routeName === 'MarkAttendanceTab') iconName = 'check-all';
    if (routeName === 'SalaryTab') iconName = 'wallet';
    if (routeName === 'HomeTab') iconName = 'home';
    if (routeName === 'AddStaffTab') iconName = 'account-plus';
    if (routeName === 'SettingsTab') iconName = 'cog';
    return iconName === "check-all" ? iconName : `${iconName}-outline`;
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        { height: BOTTOM_APPBAR_HEIGHT + bottom, paddingBottom: bottom },
      ]}
    >
      <View style={styles.bottomContainer}>
        {/* Animated indicator */}
        <Animated.View
          style={[
            styles.animatedView,
            { width: tabWidth, transform: [{ translateX }] },
          ]}
        >
          <View style={styles.bottomActiveTab}>
            <Icon
              name={getIconName(state.routes[state.index].name, true)}
              size={24}
              color="#fff"
            />
          </View>
        </Animated.View>

        {/* Tab buttons */}
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={[styles.tabButton, { width: tabWidth }]}
            >
              {!isFocused && (
                <Icon
                  name={getIconName(route.name, isFocused)}
                  size={24}
                  color={isFocused ? '#fff' : '#ccc'}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="HomeTab"
    screenOptions={{ headerShown: false }}
    tabBar={(props) => <CustomTabBar {...props} />}
  >
    <Tab.Screen name="MarkAttendanceTab" component={MarkAttendenceScreen} />
    <Tab.Screen name="SalaryTab" component={Salary} />
    <Tab.Screen name="HomeTab" component={HomeScreen} />
    <Tab.Screen name="AddStaffTab" component={RegisterEmployeeScreen} />
    <Tab.Screen name="SettingsTab" component={Settings} />
  </Tab.Navigator>
);

const MainRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem("userToken");
      setIsAuthenticated(!!token);
    };
    checkLoginStatus();
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="AdminProfile" component={AdminProfile} />
        <Stack.Screen name="ViewEmployees" component={ViewEmployees} />
        <Stack.Screen name="AddHolidays" component={AddHolidays} />
        <Stack.Screen name="EmployeeAttendanceDetails" component={EmployeeAttendanceDetails} />
        <Stack.Screen name="EmployeeDetails" component={EmployeeDetails} />
        <Stack.Screen name="SalaryDetails" component={SalaryDetails} />
        <Stack.Screen name="AddWeekends" component={AddWeekends} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccount} />
        <Stack.Screen name="AddofficeTime" component={AddOfficeTime} />
        <Stack.Screen name="AddLeaves" component={AddLeaves} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
    tabBarContainer: {
      flexDirection: 'row',
      backgroundColor: '#000',
      height: BOTTOM_APPBAR_HEIGHT,
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    bottomContainer: {
      flexDirection: 'row',
      position: 'absolute',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabButton: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    },
    animatedView: {
      position: 'absolute',
      height: '100%',
      left: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bottomActiveTab: {
      backgroundColor: '#000',
      borderColor: '#F7F8FA',
      borderWidth: 5,
      borderRadius: 35,
      padding: 10,
      bottom: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
  

export default MainRoute;
