import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../../utils/constants';

const AddOfficeTime = ({ navigation }) => {
  const [punchIn, setPunchIn] = useState('');
  const [punchOut, setPunchOut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentField, setCurrentField] = useState('');
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [fetchedPunchIn, setFetchedPunchIn] = useState('');
  const [fetchedPunchOut, setFetchedPunchOut] = useState('');

  useEffect(() => {
    fetchOfficeTime();
  }, );

  const fetchOfficeTime = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/timing/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data) {
        setFetchedPunchIn(response.data.punch_in || '');
        setFetchedPunchOut(response.data.punch_out || '');
      }
    } catch (error) {
      console.log('Error fetching time: ', error);
    }
  };

  const showTimePicker = (field) => {
    setCurrentField(field);
    setShowModal(true);
  };

  // Convert 12-hour time to 24-hour format
  const convertTo24HourFormat = (hours, minutes, ampm) => {
    let hourNum = parseInt(hours);
    let minuteNum = minutes.padStart(2, '0');

    if (ampm === 'PM' && hourNum !== 12) {
      hourNum += 12;
    }
    if (ampm === 'AM' && hourNum === 12) {
      hourNum = 0;
    }
    return `${hourNum.toString().padStart(2, '0')}:${minuteNum}`;
  };

  const handleTimeChange = () => {
    const formattedTime = convertTo24HourFormat(hours, minutes, ampm);
    if (currentField === 'punchIn') {
      setPunchIn(formattedTime);
    } else {
      setPunchOut(formattedTime);
    }
    setShowModal(false);
  };

  const handleSubmit = async () => {
    if (!punchIn || !punchOut) {
      Alert.alert('Error', 'Please select both Punch In and Punch Out times.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.post(
        `${BACKEND_URL}/api/timing/add-time`,
        { punch_in: punchIn, punch_out: punchOut },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', response.data.message);
    } catch (error) {
      console.log(error.response.data);
      Alert.alert('Error', 'Failed to submit office timing.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Set Office Timing</Text>

      <View style={styles.timeContainer}>
        <Text style={styles.label}>Punch In:</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => showTimePicker('punchIn')}
        >
          <Text style={styles.timeText}>{punchIn || 'Select Time'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.label}>Punch Out:</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => showTimePicker('punchOut')}
        >
          <Text style={styles.timeText}>{punchOut || 'Select Time'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fetchedTimesContainer}>
        <Text style={styles.fetchedLabel}>Current Punch In: {fetchedPunchIn || 'Not set'}</Text>
        <Text style={styles.fetchedLabel}>Current Punch Out: {fetchedPunchOut || 'Not set'}</Text>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent={true} animationType='slide'>
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={hours}
              onValueChange={(itemValue) => setHours(itemValue)}>
              {Array.from({ length: 12 }, (_, i) => `${i + 1}`.padStart(2, '0')).map((hour) => (
                <Picker.Item key={hour} label={hour} value={hour} />
              ))}
            </Picker>
            <Picker
              selectedValue={minutes}
              onValueChange={(itemValue) => setMinutes(itemValue)}>
              {Array.from({ length: 60 }, (_, i) => `${i}`.padStart(2, '0')).map((minute) => (
                <Picker.Item key={minute} label={minute} value={minute} />
              ))}
            </Picker>
            <Picker selectedValue={ampm} onValueChange={(itemValue) => setAmpm(itemValue)}>
              <Picker.Item label='AM' value='AM' />
              <Picker.Item label='PM' value='PM' />
            </Picker>
            <TouchableOpacity onPress={handleTimeChange} style={styles.saveButton}>
              <Text style={styles.saveText}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  backButton: { 
    backgroundColor: '#ddd', 
    padding: 10, 
    borderRadius: 5, 
    width: 80,
    marginBottom: 20 
  },
  backText: { 
    fontSize: 16, 
    color: '#000',
    textAlign: 'center'
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  timeContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  label: { fontSize: 18, flex: 1 },
  timeButton: { backgroundColor: '#ddd', padding: 10, borderRadius: 5, flex: 1, alignItems: 'center' },
  timeText: { fontSize: 16, color: '#000' },
  fetchedTimesContainer: { marginVertical: 20 },
  fetchedLabel: { fontSize: 16, color: '#666', marginVertical: 5 },
  submitButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, marginTop: 20 },
  submitText: { color: '#fff', textAlign: 'center', fontSize: 18 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  pickerContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: 300 },
  saveButton: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 5, marginTop: 10 },
  saveText: { color: '#fff', textAlign: 'center' },
});

export default AddOfficeTime;