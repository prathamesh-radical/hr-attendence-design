import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../utils/constants';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Appbar } from 'react-native-paper';

const Salary = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          console.error('Token missing');
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/employees`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (response.ok) {
          setEmployees(data);
        } else {
          console.error('Error fetching employees:', data.error);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const getAvatarColor = (gender) => {
    return gender?.toLowerCase() === 'female' ? '#fde2f3' : '#e2ecff';
  };

  const getAvatarIconColor = (gender) => {
    return gender?.toLowerCase() === 'female' ? '#e91e63' : '#1e88e5';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA', height: "100%" }}>
        {/* Back Arrow */}
        <Appbar.Header style={{ backgroundColor: '#F7F8FA' }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Active Employee List" />
        </Appbar.Header>
        <View style={{ paddingHorizontal: 20, marginBottom: 70 }}>
        {/* Employee List */}
        {loading ? (
          <ActivityIndicator size="large" color="blue" style={{ marginTop: 20 }} />
        ) : employees.length === 0 ? (
          <Text style={{ textAlign: 'center', fontSize: 16, color: '#555' }}>
            No active employees found
          </Text>
        ) : (
          <FlatList
            data={employees}
            style={{height: "100%"}}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.emp_id.toString()}
            renderItem={({ item }) => {
              const bgColor = getAvatarColor(item.gender);
              const iconColor = getAvatarIconColor(item.gender);
              return (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('SalaryDetails', {
                      empId: item.emp_id,
                      firstName: item.name,
                      lastName: item.last_name,
                    })
                  }
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 15,
                    padding: 15,
                    marginBottom: 15,
                    marginHorizontal: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {/* Avatar */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 15,
                      padding: 10,
                      borderRadius: 100,
                      backgroundColor: item.gender === "Female" ? "#FFF0F7" : "#E8F1FD"
                    }}
                  >
                    <Image
                      style={{
                        height: 20,
                        width: 20,
                      }}
                      source={item.gender === "Female" ? require("../../assets/icons/female.png") : require("../../assets/icons/male.png")}
                    />
                  </View>

                  {/* Employee Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#000' }}>
                      {item.name} {item.last_name}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#444' }}>{item.email}</Text>
                    <Text style={{ fontSize: 13, color: '#444' }}>{item.designation}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default Salary;
