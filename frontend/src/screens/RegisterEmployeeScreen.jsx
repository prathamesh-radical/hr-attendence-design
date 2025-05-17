import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  TextInput,
  ScrollView,
} from "react-native";
import { Appbar, Button, Portal, Provider } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { BACKEND_URL } from "../utils/constants";

const RegisterEmployeeScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [last_name, setLast_Name] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [joinDate, setJoinDate] = useState(null);
  const [gender, setGender] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const handleRegisterEmployee = async () => {
    if (!name || !email || !phone || !designation || !joinDate || !gender) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "All fields, including gender, are required!",
        position: "top",
      });
      return;
    }

    try {
      const token = await AsyncStorage.getItem("userToken");
      const adminId = await AsyncStorage.getItem("adminId");
      const companyName = await AsyncStorage.getItem("companyName");

      if (!token || !adminId || !companyName) {
        Toast.show({
          type: "error",
          text1: "Unauthorized",
          text2: "Please login again.",
          position: "top",
        });
        return;
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/employees/register`,
        {
          name,
          email,
          phone,
          designation,
          join_date: joinDate,
          admin_id: adminId,
          company_name: companyName,
          last_name,
          gender,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({
        type: "success",
        text1: "Employee Registered",
        text2: `ID: ${response.data.emp_id}, Office ID: ${response.data.office_id}`,
        position: "top",
      });

      setName("");
      setLast_Name("");
      setEmail("");
      setPhone("");
      setDesignation("");
      setJoinDate(null);
      setGender("");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2: error.response?.data?.message || "Something went wrong",
        position: "top",
      });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowCalendar(false);
    }
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      setJoinDate(formattedDate);
    }
  };

  const closeModal = () => {
    setShowCalendar(false);
  };

  return (
    <Provider>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Appbar.BackAction onPress={() => navigation.goBack()} style={styles.backArrow} color="#000" />
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Register Employee</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="First Name"
            placeholderTextColor="#737373"
            value={name}
            onChangeText={setName}
            style={[styles.input, styles.inputHalf]}
            theme={{ colors: { onSurfaceVariant: "#999" } }}
          />
          <TextInput
            placeholder="Last Name"
            placeholderTextColor="#737373"
            value={last_name}
            onChangeText={setLast_Name}
            style={[styles.input, styles.inputHalf]}
            theme={{ colors: { onSurfaceVariant: "#999" } }}
          />
        </View>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#737373"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          theme={{ colors: { onSurfaceVariant: "#999" } }}
        />

        <TextInput
          placeholder="Phone"
          placeholderTextColor="#737373"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          theme={{ colors: { onSurfaceVariant: "#999" } }}
        />

        <TextInput
          placeholder="Designation"
          placeholderTextColor="#737373"
          value={designation}
          onChangeText={setDesignation}
          style={styles.input}
          theme={{ colors: { onSurfaceVariant: "#999" } }}
        />

        <View style={styles.genderContainer}>
          <Text style={styles.genderLabel}>Gender :</Text>
          <TouchableOpacity
            style={styles.radioContainer}
            onPress={() => setGender("Male")}
          >
            <View style={styles.radio}>
              {gender === "Male" && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.radioText}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioContainer}
            onPress={() => setGender("Female")}
          >
            <View style={styles.radio}>
              {gender === "Female" && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.radioText}>Female</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowCalendar(true)}
        >
          <Text style={styles.dateText}>
            {joinDate ? `Join Date: ${joinDate}` : "Select Join Date"}
          </Text>
        </TouchableOpacity>

        <Portal>
          {showCalendar && Platform.OS === "ios" && (
            <Modal visible={showCalendar} transparent animationType="slide">
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <DateTimePicker
                    value={joinDate ? new Date(joinDate) : new Date()}
                    mode="date"
                    display="inline"
                    onChange={handleDateChange}
                    style={styles.dateTimePicker}
                  />
                  <Button
                    onPress={closeModal}
                    style={styles.cancelDateButton}
                  >
                    Cancel
                  </Button>
                </View>
              </View>
            </Modal>
          )}
        </Portal>

        {showCalendar && Platform.OS === "android" && (
          <DateTimePicker
            value={joinDate ? new Date(joinDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <Button
          mode="contained"
          onPress={handleRegisterEmployee}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Register Employee
        </Button>

        <Button
          onPress={() => navigation.navigate("HomeTab")}
          style={styles.cancelButton}
          labelStyle={styles.cancelButtonLabel}
        >
          Cancel
        </Button>
        <Toast />
      </ScrollView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 0,
    padding: 20,
    backgroundColor: "#F7F8FA",
    justifyContent:"center"
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backArrow: {
    fontSize: 24,
    color: "#000",
    right: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    marginBottom: 20, // Responsive margin
    backgroundColor: "#E6E6E6",
    borderRadius: 10,
    height: 45,
    width: "100%",
    paddingVertical: 0, // Responsive padding
    paddingHorizontal: 20, // Responsive padding
  },
  inputHalf: {
    width: "48%",
  },
  inputOutline: {
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 12,
  },
  genderContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 20,
    paddingVertical: 12, // Responsive padding
    paddingHorizontal: 20, // Responsive padding
    backgroundColor: "#E6E6E6",
  },
  genderLabel: {
    fontSize: 16,
    color: "#000",
    marginRight: 10,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 40,
  },
  radio: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  radioSelected: {
    height: 12,
    width: 12,
    borderRadius: 6,
    borderColor: "#2e7d32",
    backgroundColor: "#2e7d32",
  },
  radioText: {
    fontSize: 16,
    color: "#000",
  },
  datePicker: {
    paddingVertical: 12, // Responsive padding
    paddingHorizontal: 20, // Responsive padding
    borderRadius: 12,
    backgroundColor: "#E6E6E6",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
    color: "#000000",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "80%",
    maxWidth: 400,
  },
  dateTimePicker: {
    width: "100%",
  },
  cancelDateButton: {
    marginTop: 10,
    borderColor: "#2e7d32",
  },
  button: {
    marginTop: 18,
    backgroundColor: "#307A59",
    borderRadius: 12,
    paddingVertical: 5,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color:"#FFFFFF"
  },
  cancelButton: {
    marginTop: 18,
    borderColor: "#307A59",
    borderWidth:1 ,
    borderRadius: 12,
    paddingVertical: 5,
  },
  cancelButtonLabel: {
    fontSize: 16,
    color: "#307A59",
  },
});

export default RegisterEmployeeScreen;