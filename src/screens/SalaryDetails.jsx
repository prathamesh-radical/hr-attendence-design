import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from "react-native";
import axios from "axios";
import { Appbar, Button, Card, Icon } from "react-native-paper";
import moment from "moment";
import { BACKEND_URL } from "../utils/constants";
import LinearGradient from "react-native-linear-gradient";

const SalaryDetails = ({ route, navigation }) => {
  const { empId, firstName, lastName } = route.params;
  const [salaryDetails, setSalaryDetails] = useState({
    base_salary: 0,
    total_salary: 0,
    increment_amount: 0,
    increment_month: null,
    increment_applied: false,
    presentDays: 0,
    leaveDays: 0,
    halfDayLeaves: 0,
    paidLeaveDays: 0,
    holidayDays: 0,
    weekendDays: 0,
    absentDays: 0,
    totalPaidDays: 0,
    netSalary: 0,
    totalLeavesTaken: 0,
    totalLeavesTakenInYear: 0,
    remainingLeaves: 0,
    totalAllowedLeaves: 0,
    leaveYearStart: null,
    leaveYearEnd: null,
    join_date: null,
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(moment().startOf("month"));
  const [daysInMonth, setDaysInMonth] = useState(0);

  useEffect(() => {
    setDaysInMonth(selectedMonth.daysInMonth());
    fetchSalaryDetails();
  }, [selectedMonth]);

  const fetchSalaryDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/${empId}?month=${selectedMonth.format("YYYY-MM")}`
      );
      if (response.status === 200) {
        setSalaryDetails(response.data);
      }
    } catch (error) {
      console.error("Error fetching salary details:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (direction) => {
    setSelectedMonth((prev) =>
      prev.clone().add(direction, "month").startOf("month")
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Salary Overview" color="#000" titleStyle={[styles.appbarText, {color: "#000"}]} />
      </Appbar.Header>
      <View style={styles.container}>
        <LinearGradient style={styles.monthSelector} colors={['#A0C6B5', '#479170', '#A0C6B5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Button icon={() => <Icon source="chevron-left" size={24} color="#fff" />} style={styles.monthButton} onPress={() => changeMonth(-1)} color="#007bff" />
          <Text style={styles.monthText}>
            {selectedMonth.format("MMMM YYYY")}
          </Text>
          <Button icon={() => <Icon source="chevron-right" size={24} color="#fff" />} style={styles.monthButton} onPress={() => changeMonth(1)} color="#007bff" />
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{firstName} {lastName}'s</Text>
          {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#007bff" />
              </View>
            ) : (
              <>
            <Card style={styles.card}>
              <Section title="Month Overview" data={[
                ["Days in Month", daysInMonth],
                ["Base Salary", salaryDetails.base_salary],
                ["Total Salary", salaryDetails.total_salary],
              ]}/>
            </Card>
            <Card style={styles.card}>
              <Section title="Attendance Summary" data={[
                ["Present Days", salaryDetails.presentDays],
                ["Full Leave Days", salaryDetails.leaveDays],
                ["Half-Day Leaves", salaryDetails.halfDayLeaves],
                ["Paid Leave Days", salaryDetails.paidLeaveDays],
                ["Total Leaves Taken (Month)", salaryDetails.totalLeavesTaken],
                ["Total Leaves Taken (Year)", salaryDetails.totalLeavesTakenInYear],
                ["Total Allowed Leaves", salaryDetails.totalAllowedLeaves],
                ["Remaining Leaves", salaryDetails.remainingLeaves],
                ["Holiday Days", salaryDetails.holidayDays],
                ["Weekend Days", salaryDetails.weekendDays],
                ["Absent Days", salaryDetails.absentDays],
                ["Total Paid Days", salaryDetails.totalPaidDays],
              ]} />
            </Card>
            <Card style={styles.card}>
              <Section title="Salary Calculation" data={[
                ["Per Day Salary", (salaryDetails.total_salary / daysInMonth).toFixed(2)],
                ["Net Salary", salaryDetails.netSalary],
              ]} highlightLast />
            </Card>
          </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const Section = ({ title, data, highlightLast }) => (
  <>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {data.map(([label, value], index) => (
      <View key={index} style={[
        styles.detailRow,
        {
          backgroundColor: label === "Net Salary" ? "#F4F9FE" : "",
          paddingHorizontal: label === "Net Salary" ? 15 : 0,
          paddingVertical: label === "Net Salary" ? 15 : 15,
          borderWidth: label === "Net Salary" ? 1 : 0,
          borderColor: label === "Net Salary" ? "#2680EB" : "",
          borderStyle: label === "Net Salary" ? "dashed" : "",
          borderRadius: label === "Net Salary" ? 10 : 0
        }
      ]}>
        <Text style={[
          styles.label, highlightLast && index === data.length - 1 ? { fontWeight: "bold" } : {},
          {color: label === "Total Salary" ? "#489271" : "", fontWeight: label === "Total Paid Days" ? "bold" : "normal"}]}>
          {label}:
        </Text>
        <Text style={[
          styles.value,
          highlightLast && index === data.length - 1 ? { fontWeight: "bold", color: label === "Total Salary" ? "#489271" : "" } : {},
        ]}>
          {value}
        </Text>
      </View>
    ))}
  </>
);

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  appBar: {
      backgroundColor: "#F7F8FA",
  },
  appbarText: {
      color: "#000",
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
    backgroundColor: "#F7F8FA",
  },
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  card: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    elevation: 2,
    marginVertical: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#333",
  },
  sectionHeader: {
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    fontSize: 15,
    color: "#555",
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
};

export default SalaryDetails;
