import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/constants';
import { useNavigation } from '@react-navigation/native';

const AddLeaves = () => {
  const [adminId, setAdminId] = useState('');
  const [leaveDaysInput, setLeaveDaysInput] = useState('');
  const [currentLeaveDays, setCurrentLeaveDays] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchAdminId = async () => {
      const id = await AsyncStorage.getItem('adminId');
      if (id) {
        setAdminId(id);
        fetchLeaveDays(id);
      }
    };

    fetchAdminId();
  }, []);

  const fetchLeaveDays = async (id) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/leaves/leaves-get/${id}`);
      setCurrentLeaveDays(res.data.leaveDays);
    } catch (err) {
      setCurrentLeaveDays(null); // No record found
    }
  };

  const handleSubmit = async () => {
    if (!leaveDaysInput) {
      alert('Please enter leave days');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/leaves/leaves-add`, {
        adminId,
        leaveDays: parseInt(leaveDaysInput),
      });

      alert(res.data.message);
      setLeaveDaysInput('');
      fetchLeaveDays(adminId); // Refresh displayed days
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Leave Days</Text>
      </View>

      <View style={styles.centerContainer}>
        <Text style={styles.label}>Enter Leave Days</Text>
        <TextInput
          placeholder="Leave Days"
          keyboardType="numeric"
          value={leaveDaysInput}
          onChangeText={setLeaveDaysInput}
          style={styles.input}
        />

        <Button
          title={loading ? 'Saving...' : 'Save Leave Days'}
          onPress={handleSubmit}
          disabled={loading}
        />

        {currentLeaveDays !== null && (
          <Text style={styles.currentLeave}>
             Total Leave Days This Year: {currentLeaveDays}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdfdfd',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    alignSelf: 'center',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  currentLeave: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#555',
  },
});

export default AddLeaves;
