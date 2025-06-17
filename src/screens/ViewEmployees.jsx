import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { BACKEND_URL } from "../utils/constants";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Appbar } from "react-native-paper";

const ViewEmployees = () => {
  const navigation = useNavigation();
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [deactivatedEmployees, setDeactivatedEmployees] = useState([]);
  const [filteredActive, setFilteredActive] = useState([]);
  const [filteredDeactivated, setFilteredDeactivated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("active");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees(searchQuery);
  }, [searchQuery, activeEmployees, deactivatedEmployees]);

  const fetchEmployees = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Authentication token missing.");
        setLoading(false);
        return;
      }

      const activeRes = await axios.get(`${BACKEND_URL}/api/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const deactivatedRes = await axios.get(
        `${BACKEND_URL}/api/employees/deactivated`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setActiveEmployees(activeRes.data || []);
      setDeactivatedEmployees(deactivatedRes.data || []);
      setFilteredActive(activeRes.data || []);
      setFilteredDeactivated(deactivatedRes.data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load employees. Please try again.");
      console.error("Fetch employees error:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = (query) => {
    if (!query) {
      setFilteredActive(activeEmployees);
      setFilteredDeactivated(deactivatedEmployees);
    } else {
      const lowerQuery = query.toLowerCase();
      setFilteredActive(
        activeEmployees.filter((emp) =>
          emp.name?.toLowerCase().includes(lowerQuery)
        )
      );
      setFilteredDeactivated(
        deactivatedEmployees.filter((emp) =>
          emp.name?.toLowerCase().includes(lowerQuery)
        )
      );
    }
  };

  const deactivateEmployee = async (emp_id, employeeName) => {
    Alert.alert(
      "Confirm Deactivation",
      `Are you sure you want to deactivate ${employeeName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("userToken");
              if (!token) {
                Alert.alert("Error", "Authentication token missing.");
                return;
              }

              await axios.put(
                `${BACKEND_URL}/api/employees/deactivate/${emp_id}`,
                {},
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              const updatedEmployee = activeEmployees.find(
                (emp) => emp.emp_id === emp_id
              );
              if (updatedEmployee) {
                setActiveEmployees(
                  activeEmployees.filter((emp) => emp.emp_id !== emp_id)
                );
                setDeactivatedEmployees([
                  ...deactivatedEmployees,
                  { ...updatedEmployee, status: "deactivated" },
                ]);
                filterEmployees(searchQuery);
                Alert.alert("Success", "Employee deactivated.");
              }
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.error || "Failed to deactivate employee."
              );
              console.error("Deactivate employee error:", error.response?.data || error.message);
            }
          },
        },
      ]
    );
  };

  const activateEmployee = async (emp_id) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Authentication token missing.");
        return;
      }

      await axios.put(
        `${BACKEND_URL}/api/employees/activate/${emp_id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedEmployee = deactivatedEmployees.find(
        (emp) => emp.emp_id === emp_id
      );
      if (updatedEmployee) {
        setDeactivatedEmployees(
          deactivatedEmployees.filter((emp) => emp.emp_id !== emp_id)
        );
        setActiveEmployees([
          ...activeEmployees,
          { ...updatedEmployee, status: "active" },
        ]);
        filterEmployees(searchQuery);
        Alert.alert("Success", "Employee activated.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to activate employee."
      );
      console.error("Activate employee error:", error.response?.data || error.message);
    }
  };

  const renderEmployeeList = (employees, isDeactivated = false) => (
    <FlatList
      showsVerticalScrollIndicator={false}
      style={styles.employeeList}
      data={employees}
      keyExtractor={(item) => item.emp_id?.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate("EmployeeDetails", {
              emp_id: item.emp_id,
              name: item.name,
              last_name: item.last_name,
            })
          }
        >
          <View style={styles.employeeRow}>
            {/* Gender Icon */}
            <View style={[styles.genderIconContainer, { backgroundColor: item.gender?.toLowerCase() === "female" ? "#FFF0F7" : "#E8F1FD"}]}>
              <Image
                style={styles.genderIcon}
                source={item.gender?.toLowerCase() === "female" ? require("../../assets/icons/female.png") : require("../../assets/icons/male.png")}
              />
            </View>
            <View style={styles.employeeInfo}>
              <Text style={styles.name}>
                {item.name} {item.last_name}
              </Text>
              <Text>Email: {item.email}</Text>
            </View>
            {/* Deactivate/Activate Icon */}
            <TouchableOpacity
              style={styles.deactivateButton}
              onPress={() =>
                isDeactivated
                  ? activateEmployee(item.emp_id)
                  : deactivateEmployee(item.emp_id, `${item.name} ${item.last_name}`)
              }
            >
              <Ionicons
                name={
                  isDeactivated
                    ? "checkmark-circle-outline"
                    : "close-circle"
                }
                size={28}
                color={isDeactivated ? "#4CAF50" : "#ff5252"}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.navigate("Tabs")} />
        <Appbar.Content title="All Employee List" />
      </Appbar.Header>

      <View style={styles.subContainer}>
      {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search employees..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Top Tab Buttons */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              currentTab === "active" && styles.tabButtonActive,
            ]}
            onPress={() => setCurrentTab("active")}
          >
            <Text
              style={[
                styles.tabButtonText,
                currentTab === "active" && styles.tabButtonTextActive,
              ]}
            >
              Active Employees
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              currentTab === "deactivated" && styles.tabButtonActive,
            ]}
            onPress={() => setCurrentTab("deactivated")}
          >
            <Text
              style={[
                styles.tabButtonText,
                currentTab === "deactivated" && styles.tabButtonTextActive,
              ]}
            >
              Deactivated
            </Text>
          </TouchableOpacity>
        </View>

        {/* Employee List */}
        <View style={{ flex: 1 }}>
          {currentTab === "active"
            ? renderEmployeeList(filteredActive)
            : renderEmployeeList(filteredDeactivated, true)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  appBar: {
    backgroundColor: "#F7F8FA",
  },
  subContainer: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  searchBar: {
    height: 45,
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#307A59",
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginVertical: 5,
    borderRadius: 50,
    width: "100%",
    borderWidth: 1,
    borderColor: "#307A59",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 15,
    flexDirection: "row",
    backgroundColor: "transparent",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 50,
  },
  tabButtonActive: {
    backgroundColor: "#307A59",
  },
  tabButtonText: {
    color: "#000",
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: "white",
  },
  employeeList: {
    marginTop: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 15,
    marginVertical: 15,
    marginHorizontal: 1,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employeeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  genderIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    padding: 10,
    borderRadius: 50,
  },
  genderIcon: {
    height: 20,
    width: 20,
  },
  employeeInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  deactivateButton: {
    position: "absolute",
    bottom: 45,
    right: -18,
  },
});

export default ViewEmployees;