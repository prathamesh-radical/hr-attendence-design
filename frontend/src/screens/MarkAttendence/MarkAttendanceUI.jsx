import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { Checkbox, Card, Button, Menu, Appbar, Icon } from "react-native-paper";
import { Calendar } from "react-native-calendars";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import LinearGradient from "react-native-linear-gradient";

const { height } = Dimensions.get("window");

const MarkAttendanceUI = ({
  employees,
  date,
  showCalendar,
  setShowCalendar,
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
  handleSaveEmployee,
  setEmployeeTime,
  getEmployeeDisplayData,
  onDayPress,
}) => {
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Error loading data: {error}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Mark Attendance" color="#000" titleStyle={[styles.title, {color: "#000"}]} />
      </Appbar.Header>

      <View style={styles.subContainer}>
      {/* Office Timings or Set Timings Button */}
      {officeTimings ? (
        <View style={styles.officeTimingsContainer}>
          <Text style={styles.officeTimingsText}>Office Time</Text>
          <Text style={styles.officeTimings}>{formatTime(officeTimings.punch_in)} -{" "}{formatTime(officeTimings.punch_out)}</Text>
          <View style={styles.officeButton}>
            <View style={styles.officeButtonIcon}>
              <Icon source="timer-outline" size={15} color="#479170" />
            </View>
            <Text style={styles.officeButtonText}>Set Time</Text>
          </View>
        </View>
      ) : (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>Office timings not set</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddofficeTime")}
          >
            <Text style={styles.setTimingsLink}>Set Office Timings</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Date Picker */}
      <TouchableWithoutFeedback onPress={() => setShowCalendar(true)}>
        <LinearGradient style={styles.dateButton} colors={['#A0C6B5', '#479170', '#A0C6B5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Icon source="chevron-left" size={24} color="#fff" />
          <Text style={styles.dateText}>{date}</Text>
          <Icon source="chevron-right" size={24} color="#fff" />
        </LinearGradient>
      </TouchableWithoutFeedback>

      {/* Select All & Apply All */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handleSelectAll}
          style={styles.selectAllButton}
        >
          {selectAll ? "Unselect All" : "Select All"}
        </Button>
        <Button
          mode="contained"
          onPress={handleApplyAll}
          style={styles.applyButton}
          disabled={Object.keys(selectedEmployees).length === 0}
        >
          Apply All
        </Button>
      </View>

      {/* Employee List */}
      {employees.length === 0 ? (
        <View style={styles.noEmployeesContainer}>
          <Text style={styles.noEmployeesText}>No employees found</Text>
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => String(item.emp_id)}
          renderItem={({ item }) => {
            const displayData = getEmployeeDisplayData(item.emp_id);
            return (
              <Card style={styles.card}>
                <View style={styles.row}>
                  <Checkbox
                    status={
                      selectedEmployees[item.emp_id] ? "checked" : "unchecked"
                    }
                    onPress={() => toggleCheckbox(item.emp_id)}
                  />
                  <Text style={styles.employeeName}>
                    {item.name} {item.last_name}
                  </Text>
                </View>

                {/* Status Dropdown */}
                <Menu
                  visible={selectedEmployees[item.emp_id]?.menuVisible || false}
                  onDismiss={() =>
                    setSelectedEmployees((prev) => ({
                      ...prev,
                      [item.emp_id]: {
                        ...prev[item.emp_id],
                        menuVisible: false,
                      },
                    }))
                  }
                  anchor={
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() =>
                        setSelectedEmployees((prev) => ({
                          ...prev,
                          [item.emp_id]: {
                            ...prev[item.emp_id],
                            menuVisible: true,
                          },
                        }))
                      }
                    >
                      <View style={styles.dropdownContainer}>
                        <Text style={styles.dropdownText}>{displayData.status}</Text>
                        <Icon source="check" size={18} color="#fff" />
                      </View>
                    </TouchableOpacity>
                  }
                >
                  {["Present", "Absent", "Half-Day", "Leave"].map((status) => (
                    <Menu.Item
                      key={status}
                      onPress={() =>
                        setSelectedEmployees((prev) => ({
                          ...prev,
                          [item.emp_id]: {
                            ...(prev[item.emp_id] ||
                              attendanceData[item.emp_id] ||
                              {}),
                            status,
                            menuVisible: false,
                          },
                        }))
                      }
                      title={status}
                    />
                  ))}
                </Menu>

                {/* Separate Entry and Exit Time Buttons */}
                <View style={styles.timeButtonsContainer}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => {
                      setSelectedTimeType("entry");
                      setTimePicker(item.emp_id);
                    }}
                  >
                    <Text style={styles.timeText}>
                      {displayData.entryTime
                        ? `Entry: ${displayData.entryTime}`
                        : "Select Entry Time"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.timeButton,
                      !displayData.entryTime && styles.disabledButton,
                    ]}
                    onPress={() => {
                      if (displayData.entryTime) {
                        setSelectedTimeType("exit");
                        setTimePicker(item.emp_id);
                      }
                    }}
                    disabled={!displayData.entryTime}
                  >
                    <Text style={styles.timeText}>
                      {displayData.exitTime
                        ? `Exit: ${displayData.exitTime}`
                        : "Select Exit Time"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Total Time Display */}
                {displayData.entryTime && displayData.exitTime && (
                  <View style={styles.totalTimeContainer}>
                    <Text style={styles.totalTimeText}>
                      Total:{" "}
                      {calculateTotalTime(
                        displayData.entryTime,
                        displayData.exitTime
                      )}
                    </Text>
                  </View>
                )}

                {/* Save Button */}
                <Button
                  mode="contained"
                  onPress={() => handleSaveEmployee(item.emp_id)}
                  style={styles.saveButton}
                  disabled={!selectedEmployees[item.emp_id]}
                >
                  Save
                </Button>
              </Card>
            );
          }}
        />
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <Modal transparent={true} animationType="slide">
          <View style={styles.modalView}>
            <Calendar
              onDayPress={onDayPress}
              markedDates={{
                [date]: { selected: true, marked: true, dotColor: "blue" },
              }}
            />
          </View>
        </Modal>
      )}

      {/* Time Options Popup */}
      {showTimeOptions && (
        <Modal transparent={true} animationType="fade">
          <View style={styles.modalView}>
            <View style={styles.timeOptionsContainer}>
              {/* Entry Time Button */}
              <TouchableOpacity
                style={styles.timeOptionButton}
                onPress={() => {
                  setSelectedTimeType("entry");
                  setTimePicker(showTimeOptions);
                  setShowTimeOptions(false);
                }}
              >
                <Text style={styles.timeOptionText}>Entry Time</Text>
              </TouchableOpacity>

              {/* Exit Time Button */}
              <TouchableOpacity
                style={[
                  styles.timeOptionButton,
                  !getEmployeeDisplayData(showTimeOptions).entryTime &&
                    styles.disabledButton,
                ]}
                onPress={() => {
                  if (getEmployeeDisplayData(showTimeOptions).entryTime) {
                    setSelectedTimeType("exit");
                    setTimePicker(showTimeOptions);
                    setShowTimeOptions(false);
                  }
                }}
                disabled={!getEmployeeDisplayData(showTimeOptions).entryTime}
              >
                <Text style={styles.timeOptionText}>Exit Time</Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTimeOptions(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker Modal */}
      {timePicker && (
        <Modal transparent={true} animationType="slide">
          <View style={styles.modalView}>
            <View style={styles.timePickerContainer}>
              {/* Header with Back and Set Time Buttons */}
              <View style={styles.timePickerHeader}>
                <TouchableOpacity onPress={() => setTimePicker(null)}>
                  <Ionicons name="arrow-back" size={24} color="#007bff" />
                </TouchableOpacity>
                <Text style={styles.timePickerTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setEmployeeTime(timePicker)}>
                  <Text style={styles.setTimeButton}>Set Time</Text>
                </TouchableOpacity>
              </View>

              {/* Time Picker Rows */}
              <View style={styles.timePickerRow}>
                <ScrollView
                  style={styles.timePickerColumn}
                  contentContainerStyle={styles.scrollContent}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timePickerItem,
                        selectedHour === String(hour) &&
                          styles.timePickerItemSelected,
                      ]}
                      onPress={() => setSelectedHour(String(hour))}
                    >
                      <Text>{hour}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView
                  style={styles.timePickerColumn}
                  contentContainerStyle={styles.scrollContent}
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timePickerItem,
                        selectedMinute === String(minute).padStart(2, "0") &&
                          styles.timePickerItemSelected,
                      ]}
                      onPress={() =>
                        setSelectedMinute(String(minute).padStart(2, "0"))
                      }
                    >
                      <Text>{String(minute).padStart(2, "0")}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView
                  style={styles.timePickerColumn}
                  contentContainerStyle={styles.scrollContent}
                >
                  {["AM", "PM"].map((ampm) => (
                    <TouchableOpacity
                      key={ampm}
                      style={[
                        styles.timePickerItem,
                        selectedAMPM === ampm && styles.timePickerItemSelected,
                      ]}
                      onPress={() => setSelectedAMPM(ampm)}
                    >
                      <Text>{ampm}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <Toast />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  subContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#F7F8FA",
  },
  appBar: {
    backgroundColor: "#F7F8FA",
  },
  title: {
    color: "#000",
    textAlign: "center",
    fontWeight: "bold",
    right: 25,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 20,
    textAlign: "center",
  },
  officeTimingsContainer: {
    backgroundColor: "#D3E1DD",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    gap: 10,
  },
  officeTimingsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976d2",
  },
  officeTimings: {
    fontSize: 24,
  },
  officeButton: {
    fontSize: 17,
    fontWeight: "bold",
    flexDirection: "row",
  },
  officeButtonIcon: {
    backgroundColor: "#fff",
    height: 27,
    paddingHorizontal: 7,
    borderRadius: 50,
    justifyContent: "center",
    alignContent: "center",
  },
  officeButtonText: {
    padding: 5,
    fontSize: 17,
    fontWeight: "bold",
    color: "#479170",
    bottom: 3,
    marginLeft: 5,
  },
  warningContainer: {
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  warningText: {
    fontSize: 16,
    color: "#856404",
  },
  setTimingsLink: {
    color: "#007bff",
    textDecorationLine: "underline",
    marginTop: 5,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#007bff",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  dateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  selectAllButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: "#479170",
  },
  applyButton: {
    flex: 1,
    marginLeft: 5,
    color: "#fff",
    backgroundColor: "#dc3545",
  },
  applyButtonDisabled: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: "#6c757d",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  employeeName: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
    color: "black",
  },
  dropdown: {
    padding: 10,
    backgroundColor: "#017CFE",
    borderRadius: 5,
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dropdownText: {
    justifyContent: "space-between",
    color: "#fff",
  },
  timeButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  timeButton: {
    flex: 1,
    padding: 11,
    borderColor: "#357D5D",
    borderWidth: 1,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  timeText: {
    color: "#357D5D",
    fontSize: 14,
  },
  totalTimeContainer: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  totalTimeText: {
    color: "#333",
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  timePickerContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: height * 0.5,
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  setTimeButton: {
    color: "#007bff",
    fontSize: 16,
    fontWeight: "bold",
  },
  timePickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  timePickerColumn: {
    flex: 1,
    marginHorizontal: 5,
    maxHeight: height * 0.3,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  timePickerItem: {
    padding: 10,
    alignItems: "center",
    borderRadius: 5,
    marginVertical: 5,
  },
  timePickerItemSelected: {
    backgroundColor: "#007bff",
  },
  saveButton: {
    marginTop: 10,
    borderRadius: 15,
    paddingVertical: 4,
    backgroundColor: "#479170",
  },
  backButton: {
    flexDirection: "row",
    marginTop: 35,
    borderWidth: 2,
    width: 100,
    backgroundColor: "#4d1b3b",
    borderRadius: 50,
  },
  backText: {
    fontSize: 16,
    marginLeft: 5,
    color: "white",
  },
  noEmployeesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noEmployeesText: {
    fontSize: 18,
    color: "#6c757d",
  },
});

export default MarkAttendanceUI;