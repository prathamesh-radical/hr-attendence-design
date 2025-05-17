import React, { useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { BACKEND_URL } from "../../utils/constants";
import MarkAttendanceUI from "./MarkAttendanceUI";

const MarkAttendanceScreen = () => {
  const [employees, setEmployees] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [timePicker, setTimePicker] = useState(null);
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedAMPM, setSelectedAMPM] = useState("AM");
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [selectedTimeType, setSelectedTimeType] = useState(null);
  const [officeTimings, setOfficeTimings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigation = useNavigation();

  // Fetch employees, office timings, and attendance data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const token = await AsyncStorage.getItem("userToken");
        if (!token) throw new Error("Token not found");

        // Fetch employees
        const empResponse = await axios.get(`${BACKEND_URL}/api/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployees(empResponse.data);

        // Fetch office timings - handle case where it doesn't exist
        try {
          const timingsResponse = await axios.get(
            `${BACKEND_URL}/api/timing/get`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (timingsResponse.data) {
            setOfficeTimings(timingsResponse.data);
          }
        } catch (timingsError) {
          console.log(
            "No office timings set or error fetching:",
            timingsError.message
          );
          setOfficeTimings(null);
        }

        // Fetch attendance data for current date - handle case where none exists
        try {
          const attendanceResponse = await axios.get(
            `${BACKEND_URL}/api/attendance?date=${date}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (attendanceResponse.data && attendanceResponse.data.length > 0) {
            const existingData = {};
            attendanceResponse.data.forEach((item) => {
              existingData[item.emp_id] = {
                status: item.status,
                entryTime: item.entry_time ? formatTime(item.entry_time) : null,
                exitTime: item.exit_time ? formatTime(item.exit_time) : null,
              };
            });
            setAttendanceData(existingData);
          } else {
            setAttendanceData({});
          }
        } catch (attendanceError) {
          console.log(
            "No attendance data or error fetching:",
            attendanceError.message
          );
          setAttendanceData({});
        }
      } catch (error) {
        console.error("Error fetching data:", error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [date]);

  // Format time from database (24-hour) to 12-hour format
  const formatTime = (timeString) => {
    if (!timeString) return null;

    const [hours, minutes] = timeString.split(":");
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? "PM" : "AM";
    const hour12 = hourNum % 12 || 12;

    return `${hour12}:${minutes} ${period}`;
  };

  // Function to calculate time difference
  const calculateTotalTime = (entry, exit) => {
    if (!entry || !exit) return null;

    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(" ");
      const [hours, minutes] = time.split(":");
      let hours24 = parseInt(hours, 10);

      if (period === "PM" && hours24 !== 12) {
        hours24 += 12;
      }
      if (period === "AM" && hours24 === 12) {
        hours24 = 0;
      }

      const date = new Date();
      date.setHours(hours24);
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(0);
      date.setMilliseconds(0);

      return date;
    };

    const entryDate = parseTime(entry);
    const exitDate = parseTime(exit);

    let diffMs = exitDate - entryDate;

    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  // Toggle individual employee selection
  const toggleCheckbox = (id) => {
    setSelectedEmployees((prev) => {
      const updated = { ...prev };
      if (updated[id]) {
        delete updated[id];
      } else {
        updated[id] = attendanceData[id] || {
          status: "Present",
          entryTime: officeTimings?.punch_in
            ? formatTime(officeTimings.punch_in)
            : new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
          exitTime: officeTimings?.punch_out
            ? formatTime(officeTimings.punch_out)
            : null,
        };
      }
      return updated;
    });
  };

  // Select all employees
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees({});
    } else {
      const allSelected = {};
      employees.forEach((emp) => {
        allSelected[emp.emp_id] = attendanceData[emp.emp_id] || {
          status: "Present",
          entryTime: officeTimings?.punch_in
            ? formatTime(officeTimings.punch_in)
            : new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
          exitTime: officeTimings?.punch_out
            ? formatTime(officeTimings.punch_out)
            : null,
        };
      });
      setSelectedEmployees(allSelected);
    }
    setSelectAll(!selectAll);
  };

  // Submit all selected employees
  const handleApplyAll = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) throw new Error("Token not found");

      const attendanceData = {};
      for (const emp_id in selectedEmployees) {
        const empData = selectedEmployees[emp_id];
        attendanceData[emp_id] = {
          status: empData.status || "Present",
          entryTime: empData.entryTime || null,
          exitTime: empData.exitTime || null,
        };
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/attendance/submit`,
        { date, selectedEmployees: attendanceData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({
        type: "success",
        text1: response.data.message || "Attendance saved successfully!",
        position: "top",
        visibilityTime: 3000,
      });

      fetchAttendanceData();
    } catch (error) {
      console.error("Error submitting attendance:", error);
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "Failed to save attendance",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  // Helper function to fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(
        `${BACKEND_URL}/api/attendance?date=${date}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        if (response.data.length > 0) {
          const existingAttendance = {};
          response.data.forEach((record) => {
            existingAttendance[record.emp_id] = {
              status: record.status,
              entryTime: record.entry_time
                ? formatTime(record.entry_time)
                : null,
              exitTime: record.exit_time ? formatTime(record.exit_time) : null,
            };
          });
          setAttendanceData(existingAttendance);
        } else {
          setAttendanceData({});
        }
      } else {
        console.error("Unexpected response format:", response.data);
        setAttendanceData({});
      }
    } catch (error) {
      console.error(
        "Error fetching attendance data:",
        error.message,
        error.response?.data
      );
      setAttendanceData({});
    }
  };

  // Save individual employee data
  const handleSaveEmployee = async (emp_id) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) throw new Error("Token not found");

      const employeeData = selectedEmployees[emp_id];
      if (!employeeData) {
        alert("No changes to save for this employee.");
        return;
      }

      const finalData = {
        date,
        status: employeeData.status || "Present",
        entry_time: employeeData.entryTime || null,
        exit_time: employeeData.exitTime || null,
      };

      const response = await axios.put(
        `${BACKEND_URL}/api/attendance/update/${emp_id}`,
        finalData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchAttendanceData();

      Toast.show({
        type: "success",
        text1: response.data.message || "Employee data updated successfully!",
        position: "top",
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error("Error updating employee data:", error);
      Toast.show({
        type: "error",
        text1:
          error.response?.data?.message || "Failed to update employee data",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  // Set manually selected time
  const setEmployeeTime = (id) => {
    const time = `${selectedHour}:${selectedMinute} ${selectedAMPM}`;
    setSelectedEmployees((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [selectedTimeType === "entry" ? "entryTime" : "exitTime"]: time,
      },
    }));
    setTimePicker(null);
    setSelectedTimeType(null);
  };

  // Get display data for an employee
  const getEmployeeDisplayData = (emp_id) => {
    return (
      selectedEmployees[emp_id] ||
      attendanceData[emp_id] || {
        status: "Present",
        entryTime: null,
        exitTime: null,
      }
    );
  };

  // Props to pass to the UI component
  const uiProps = {
    employees,
    date,
    showCalendar,
    setShowCalendar,
    attendanceData,
    selectedEmployees,
    setSelectedEmployees,
    selectAll,
    timePicker,
    setTimePicker,
    selectedHour,
    setSelectedHour,
    selectedMinute,
    setSelectedMinute,
    selectedAMPM,
    setSelectedAMPM,
    showTimeOptions,
    setShowTimeOptions,
    selectedTimeType,
    setSelectedTimeType,
    officeTimings,
    loading,
    error,
    navigation,
    formatTime,
    calculateTotalTime,
    toggleCheckbox,
    handleSelectAll,
    handleApplyAll,
    fetchAttendanceData,
    handleSaveEmployee,
    setEmployeeTime,
    getEmployeeDisplayData,
    onDayPress: (day) => {
      setDate(day.dateString);
      setShowCalendar(false);
    },
  };

  return <MarkAttendanceUI {...uiProps} />;
};

export default MarkAttendanceScreen;