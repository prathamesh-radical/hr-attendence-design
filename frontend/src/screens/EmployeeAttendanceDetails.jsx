import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { BACKEND_URL } from "../utils/constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Appbar } from "react-native-paper";

// Utility to normalize date to YYYY-MM-DD (UTC-based)
const normalizeDate = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0]; // Return YYYY-MM-DD in UTC
};

// Utility to normalize date to UTC YYYY-MM-DD for backend communication
const normalizeDateToUTC = (dateString) => {
  return normalizeDate(dateString); // Already in UTC YYYY-MM-DD
};

const EmployeeAttendanceDetails = ({ route }) => {
  const { emp_id, name, last_name } = route.params;
  const navigation = useNavigation();

  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeMode, setTimeMode] = useState(null); // null | "entry" | "exit"
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  useEffect(() => {
    fetchAttendance(selectedMonth);
  }, [selectedMonth]);

  const fetchAttendance = async (month) => {
    setLoading(true);
    try {
      const [year, selectedMonth] = month.split("-"); // Extract year and month
      const response = await axios.get(`${BACKEND_URL}/api/attendance/${emp_id}?month=${selectedMonth}&year=${year}`);
      
      // If response is an array (old backend), group it by date
      if (Array.isArray(response.data)) {
        const groupedData = response.data.reduce((acc, record) => {
          const date = normalizeDate(record.date); // Normalize to YYYY-MM-DD
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push({
            id: record.id,
            date: record.date, // Keep original date for backend communication
            status: record.status,
            entry_time: record.entry_time,
            exit_time: record.exit_time,
          });
          return acc;
        }, {});
        setAttendance(groupedData);
      } else {
        // If response is already grouped (new backend), use it directly
        setAttendance(response.data || {});
      }
      // console.log("Fetched attendance:", JSON.stringify(response.data, null, 2));
      // console.log("Grouped attendance state:", JSON.stringify(attendance, null, 2));
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendance({});
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (direction) => {
    const currentDate = new Date(`${selectedMonth}-01`);
    if (direction === "prev") {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else if (direction === "next") {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const newMonth = currentDate.toISOString().slice(0, 7);
    setSelectedMonth(newMonth);
    fetchAttendance(newMonth);
  };

  const updateAttendance = async (updatedData) => {
    try {
      // Normalize the date to YYYY-MM-DD in UTC for backend
      const normalizedData = {
        ...updatedData,
        date: normalizeDateToUTC(updatedData.date),
      };
      // console.log(`Sending update for date: ${normalizedData.date}`);

      await axios.put(`${BACKEND_URL}/api/attendance/update/${emp_id}`, normalizedData);
      // Wait for fetchAttendance to complete and update the state
      await fetchAttendance(selectedMonth);
      // console.log("State after update:", JSON.stringify(attendance, null, 2));
      Alert.alert("Success", "Attendance updated successfully.");
    } catch (error) {
      console.error("Error updating attendance:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to update attendance.");
    }
  };

  const calculateWorkingTime = (entry, exit) => {
    if (!entry || !exit) return "N/A";
    try {
      const [entryHours, entryMinutes] = entry.split(":").map(Number);
      const [exitHours, exitMinutes] = exit.split(":").map(Number);

      const entryTime = new Date(1970, 0, 1, entryHours, entryMinutes);
      const exitTime = new Date(1970, 0, 1, exitHours, exitMinutes);

      let diffMs = exitTime - entryTime;
      if (diffMs < 0) {
        exitTime.setDate(exitTime.getDate() + 1);
        diffMs = exitTime - entryTime;
      }

      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return "Invalid Time";
    }
  };

  const handleTimeSelection = (event, selectedTime) => {
    if (!selectedTime || !selectedAttendance) {
      setShowTimePicker(false);
      return;
    }

    // Format the selected time to 12-hour format with AM/PM to match backend's expected input
    const hours = selectedTime.getHours();
    const minutes = selectedTime.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12; // Convert to 12-hour format
    const formattedTime = `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;

    let updatedData = { ...selectedAttendance };

    if (timeMode === "entry") {
      updatedData.entry_time = formattedTime;
    } else if (timeMode === "exit") {
      updatedData.exit_time = formattedTime;
    }

    // Update the attendance state
    setAttendance((prevAttendance) => {
      const updatedAttendance = { ...prevAttendance };
      const dateKey = normalizeDate(updatedData.date); // Normalize to YYYY-MM-DD
      // console.log(`Updating state for dateKey: ${dateKey}`);
      if (!updatedAttendance[dateKey]) {
        updatedAttendance[dateKey] = [];
      }
      updatedAttendance[dateKey] = updatedAttendance[dateKey].map((att) =>
        att.id === updatedData.id ? updatedData : att
      );
      return updatedAttendance;
    });

    setShowTimePicker(false);
    setTimeMode(null);
    setSelectedAttendance(null);

    // Send the updated data to the backend
    updateAttendance(updatedData);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={`${name} ${last_name}'s Panel`} color="#000" titleStyle={[styles.title, {color: "#000"}]} />
      </Appbar.Header>
      <View style={styles.subContainer}>
      <LinearGradient style={styles.monthNavigation} colors={['#A0C6B5', '#479170', '#A0C6B5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity onPress={() => handleMonthChange("prev")}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{selectedMonth}</Text>
        <TouchableOpacity onPress={() => handleMonthChange("next")}>
          <Icon name="chevron-right" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
      <Text style={styles.header}>
        {name} {last_name}'s Attendance
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      ) : Object.keys(attendance).length > 0 ? (
        <FlatList
          data={Object.entries(attendance).flatMap(([date, records]) => records.map(record => ({
            ...record,
            displayDate: date, // Use the normalized date key for rendering
          })))}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            // console.log(`Rendering date for ID ${item.id}: ${item.displayDate}`);
            return (
              <View style={styles.card}>
                <Text style={styles.date}>Date: {item.displayDate}</Text>
                <Text>Status: {item.status}</Text>

                {/* Show Entry & Exit Time Only If Status is Present */}
                {item.status === "Present" && (
                  <View style={styles.timeSelectionContainer}>
                    <TouchableOpacity
                      style={styles.selectTimeButton}
                      onPress={() => {
                        setSelectedAttendance(item);
                        setTimeMode("entry");
                        setShowTimePicker(true);
                      }}
                    >
                      <Text>Entry Time: {item.entry_time || "Select Entry Time"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.selectTimeButton}
                      onPress={() => {
                        setSelectedAttendance(item);
                        setTimeMode("exit");
                        setShowTimePicker(true);
                      }}
                    >
                      <Text>Exit Time: {item.exit_time || "Select Exit Time"}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Show Total Time Only If Status is Present */}
                {item.status === "Present" && (
                  <Text>
                    Total Time: {calculateWorkingTime(item.entry_time, item.exit_time)}
                  </Text>
                )}

                <View style={styles.buttonContainer}>
                  {["Present", "Absent", "Half-Day"].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusButton,
                        {
                          borderWidth: status === "Half-Day" ? 0: 1,
                          borderColor: status === "Present" ? "#1F76EB" : status === "Absent" ? "#BE0000" : "transparent",
                          backgroundColor: status === "Half-Day" ? "#307A59" : "transparent",
                        },
                      ]}
                      onPress={() => updateAttendance({ ...item, status })}
                    >
                      <Text style={[styles.buttonText, {color: status === "Present" ? "#1F76EB" : status === "Absent" ? "#BE0000" : "#fff"}]}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          }}
        />
      ) : (
        <Text style={styles.noData}>No data available for the selected month.</Text>
      )}

      {showTimePicker && (
        <DateTimePicker
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          value={new Date()}
          is24Hour={true}
          onChange={(event, selectedTime) => handleTimeSelection(event, selectedTime)}
        />
      )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 0,
  },
  subContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
    paddingTop: 0,
  },
  appBar: {
      backgroundColor: "#F7F8FA",
  },
  title: {
      fontSize: 20,
      color: "#000",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  monthNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 13,
  },
  arrow: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007bff",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  date: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  timeSelectionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  selectTimeButton: {
    backgroundColor: "#e0e0e0",
    padding: 8,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statusButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  noData: {
    textAlign: "center",
    fontSize: 16,
    color: "#6c757d",
    marginTop: 20,
  },
});

export default EmployeeAttendanceDetails;