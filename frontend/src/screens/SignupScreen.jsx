import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { Appbar, Button } from 'react-native-paper';
import { BACKEND_URL } from '../utils/constants';
import Icon from "react-native-vector-icons/Ionicons";

const { width, height } = Dimensions.get('window');

const SignupScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [confirmSecureText, setConfirmSecureText] = useState(true);
  const [country, setCountry] = useState('');

  const handleSignup = async () => {
    if (!firstName || !lastName || !companyName || !email || !phone || !password || !confirmPassword || !country) {
      alert('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
  
    try {
      const response = await fetch(`${BACKEND_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          password,
          company_name: companyName,
          country,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        alert(data.message || 'Signup failed');
        return;
      }
  
      alert('Signup successful!');
      navigation.navigate('Login');
    } catch (error) {
      alert('Error connecting to the server');
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} style={styles.backButton} color="#000" />
        <Text style={styles.title}>Registration</Text>
        <Text style={styles.subtitle}>Welcome back ! please enter your details</Text>
      </View>
      <View style={styles.inputContainer}>
        <View style={styles.row}>
          <TextInput
            placeholder="Fast Name"
            placeholderTextColor="#737373"
            value={firstName}
            onChangeText={setFirstName}
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            placeholder="Last Name"
            placeholderTextColor="#737373"
            value={lastName}
            onChangeText={setLastName}
            style={[styles.input, styles.halfInput]}
          />
        </View>
        <TextInput
          placeholder="Company Name"
          placeholderTextColor="#737373"
          value={companyName}
          onChangeText={setCompanyName}
          style={styles.input}
        />
        <TextInput
          placeholder="Email"
          keyboardType="email-address"
          placeholderTextColor="#737373"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Phone"
          placeholderTextColor="#737373"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
        />
        <TextInput
          placeholder="Country"
          placeholderTextColor="#737373"
          value={country}
          onChangeText={setCountry}
          style={styles.input}
        />
        <View style={styles.passwordContainer}>
          <TextInput
              placeholder="Enter Your Password"
              placeholderTextColor="#737373"
              secureTextEntry={secureText}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
          />
          <TouchableOpacity
              style={styles.eyeIconContainer}
              onPress={() => setSecureText(!secureText)}
          >
              <Icon
                  name={secureText ? "eye-off-outline" : "eye-outline"}
                  size={width * 0.07} // Responsive icon size
                  color="#737373"
              />
          </TouchableOpacity>
        </View>
        <View style={styles.passwordContainer}>
            <TextInput
                placeholder="Enter Confirm Password"
                placeholderTextColor="#737373"
                secureTextEntry={confirmSecureText}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
            />
            <TouchableOpacity
                style={styles.eyeIconContainer}
                onPress={() => setConfirmSecureText(!confirmSecureText)}
            >
                <Icon
                    name={confirmSecureText ? "eye-off-outline" : "eye-outline"}
                    size={width * 0.07} // Responsive icon size
                    color="#737373"
                />
            </TouchableOpacity>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <Button mode="contained" style={styles.button} onPress={handleSignup}>
          Sign Up
        </Button>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an Account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignContent: 'center',
    backgroundColor: '#F9F9F9', // Light background to match the image
    // paddingVertical: height * 0.01,
  },
  header: {
    alignItems: 'flex-start',
    paddingHorizontal: width * 0.05, // 5% of screen width
    paddingVertical: height * 0.01, // 5% of screen height
  },
  backButton: {
    right: 20,
    marginBottom: height * 0.015, // Responsive margin
  },
  backIcon: {
    fontSize: width * 0.07, // Responsive font size (7% of screen width)
    color: '#000',
  },
  title: {
    fontSize: width * 0.06, // Responsive font size (6% of screen width)
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: width * 0.035, // Responsive font size (3.5% of screen width)
    color: '#666',
    marginVertical: height * 0.02, // Responsive margin
  },
  inputContainer: {
    paddingHorizontal: width * 0.05, // 5% of screen width
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.005, // Responsive margin
  },
  input: {
    marginBottom: height * 0.020, // Responsive margin
    backgroundColor: '#E6E6E6', // Light gray background for inputs
    borderRadius: 10,
    color: 'black',
    fontSize: width * 0.04, // Responsive font size for input text
    paddingVertical: height * 0.017, // Responsive padding
    paddingHorizontal: width * 0.05, // Responsive padding
  },
  halfInput: {
    width: '48%',
  },
  inputOutline: {
    borderWidth: 0,
    borderRadius: 10,
  },
  passwordContainer: {
    position: "relative",
    width: "100%",
  },
  eyeIconContainer: {
      position: "absolute",
      right: width * 0.035, // Responsive positioning
      top: "35%",
      transform: [{ translateY: -height * 0.015 }], // Responsive centering
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: height * 0.009, // Responsive margin
  },
  button: {
    backgroundColor: '#307A59', // Green color to match the image
    paddingVertical: height * 0.003, // Responsive padding
    paddingHorizontal: width * 0.05, // Responsive padding
    borderRadius: 10,
    width: '90%',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: height * 0.025, // Responsive padding
    marginVertical: height * 0.04, // Responsive margin
  },
  footerText: {
    fontSize: width * 0.035, // Responsive font size (3.5% of screen width)
    color: '#888',
  },
  loginText: {
    fontSize: width * 0.04, // Responsive font size (4% of screen width)
    color: '#307A59',
    fontWeight: 'bold',
  },
});

export default SignupScreen;