import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Button, Alert, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native'; // Import navigation hook
import { BACKEND_URL } from '../../utils/constants';


const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const AddWeekends = () => {
  const [selectedDays, setSelectedDays] = useState([]);
  const [weekendList, setWeekendList] = useState([]);
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentDay, setCurrentDay] = useState("");
  const navigation = useNavigation(); // Initialize navigation

  // Fetch user token from AsyncStorage
  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setUserToken(token);
          fetchWeekends(token);
        } else {
          alert("User token not found. Please log in again.");
          navigation.navigate("Login");
        }
      } catch (error) {
        console.error("Error fetching token:", error);
      }
    };
    getToken();
  }, []);

  // Fetch existing weekends
  const fetchWeekends = (token) => {
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/api/weekends/get`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setWeekendList(res.data.weekends || []);
        setSelectedDays(res.data.weekends.map(item => item.day));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err.response?.data || err);
        alert("Failed to fetch weekends.");
        setLoading(false);
      });
  };

  // Handle Picker Value Change
  const handleDayChange = (day) => {
    if (day === "") return; // Ignore if no selection
    if (selectedDays.includes(day)) {
      alert(`${day} is already selected.`);
    } else if (weekendList.some((item) => item.day === day)) {
      alert(`${day} is already added.`);
    } else {
      setSelectedDays([...selectedDays, day]);
    }
    setCurrentDay(""); // Reset picker after selection
  };

  // Submit weekends to backend
  const submitWeekends = () => {
    if (selectedDays.length === 0) {
      alert("Please select at least one weekend day.");
      return;
    }
    axios
      .post(
        `${BACKEND_URL}/api/weekends/add`,
        { weekends: selectedDays },
        { headers: { Authorization: `Bearer ${userToken}` } }
      )
      .then((res) => {
        alert("Weekends added successfully!");
        setSelectedDays([]);
        fetchWeekends(userToken); // Refresh data after submission
      })
      .catch((err) => {
        console.error(err.response?.data || err);
        alert("Failed to add weekends.");
      });
  };

  // Delete weekend from database
  const deleteWeekend = (id, day) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to remove ${day} as a weekend?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            axios
              .delete(`${BACKEND_URL}/api/weekends/delete/${id}`, {
                headers: { Authorization: `Bearer ${userToken}` },
              })
              .then((res) => {
                alert(`${day} removed successfully.`);
                fetchWeekends(userToken); // Refresh data
              })
              .catch((err) => {
                console.error(err.response?.data || err);
                alert("Failed to remove weekend.");
              });
          },
        },
      ]
    );
  };

  // Render current weekends with delete button
  const renderWeekend = ({ item }) => (
    <View style={styles.weekendItem}>
      <Text style={styles.weekendText}>
        • {item.day} (ID: {item.id})
      </Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteWeekend(item.id, item.day)}
      >
        <Text style={styles.deleteText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView>
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Select Weekend Days</Text>
      {loading && <Text style={styles.loadingText}>Loading...</Text>}

      {/* Dropdown Picker for Days */}
      <Picker
        selectedValue={currentDay}
        onValueChange={(itemValue) => handleDayChange(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select a day" value="" />
        {daysOfWeek.map((day) => (
          <Picker.Item key={day} label={day} value={day} />
        ))}
      </Picker>

      <Text style={styles.selectedTitle}>Selected Days:</Text>
      <FlatList
        data={selectedDays}
        keyExtractor={(item) => item}
        renderItem={({ item }) => <Text style={styles.selectedDay}>• {item}</Text>}
        ListEmptyComponent={<Text style={styles.noWeekendText}>No days selected yet.</Text>}
      />

      <Button title="Submit" onPress={submitWeekends} />

      <Text style={styles.subtitle}>Current Weekend Days:</Text>
      <FlatList
        data={weekendList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderWeekend}
        ListEmptyComponent={<Text style={styles.noWeekendText}>No weekends added yet.</Text>}
      />
  
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    marginTop:20
  }, backButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  }, backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }, title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  }, picker: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginBottom: 20,}, selectedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,},
  selectedDay: {
    fontSize: 16,
    paddingVertical: 5,
  }, subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  }, weekendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  }, weekendText: {
    fontSize: 18,
  }, noWeekendText: {
    fontSize: 16,
    color: 'gray',
    fontStyle: 'italic',
  },loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },deleteButton: {
    backgroundColor: '#ff4d4d',
    padding: 8,
    borderRadius: 8,
  },  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
export default AddWeekends;
