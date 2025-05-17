import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { Appbar } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons'; 


const Settings = ({ navigation }) => {
  // Navigate Back
  const handleBack = () => {
    navigation.navigate('Tabs');
  };

  // Navigate to Add Weekends
  const handleAddWeekend = () => {
    navigation.navigate('AddWeekends');
  };

  const handleAddTiming = () => {
    navigation.navigate('AddofficeTime');
  };

  const handleAddHoliday = () => {
    navigation.navigate('AddHolidays');
  };

  const handleAddLeaves = () => {
    navigation.navigate('AddLeaves');
  };

  // Placeholder for General Settings
  const handleGeneralSettings = () => {
    // console.log("General Settings Clicked");
  };

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        {/* Header with Back Button */}
        <View style={styles.headerContainer}>
          <Appbar.BackAction onPress={() => navigation.goBack()} style={styles.backArrow} color="#000" />
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Settings</Text>
          </View>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsList}>
  <TouchableOpacity
    style={styles.settingItem}
    onPress={handleGeneralSettings}
  >
    <View style={[styles.settingIcon, {backgroundColor: '#E5F3FF'}]}>
      <Image source={require("../../../assets/icons/general.png")} style={styles.cardIcon} />
    </View>
    <Text style={styles.settingText}>General Settings</Text>
    <Ionicons name="chevron-forward" size={24} color="#000" />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.settingItem}
    onPress={handleAddWeekend}
  >
    <View style={[styles.settingIcon, {backgroundColor: '#F8E5E5', borderRadius: 50}]}>
      <Image source={require("../../../assets/icons/weekend.png")} style={styles.cardIcon} />
    </View>
    <Text style={styles.settingText}>Add Weekend</Text>
    <Ionicons name="chevron-forward" size={24} color="#000" />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.settingItem}
    onPress={handleAddTiming}
  >
    <View style={[styles.settingIcon, {backgroundColor: '#FEF6E5', borderRadius: 50}]}>
      <Image source={require("../../../assets/icons/office-time.png")} style={styles.cardIcon} />
    </View>
    <Text style={styles.settingText}>Set Office Time</Text>
    <Ionicons name="chevron-forward" size={24} color="#000" />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.settingItem}
    onPress={handleAddHoliday}
  >
    <View style={[styles.settingIcon, {backgroundColor: '#E9F5F7', borderRadius: 50}]}>
      <Image source={require("../../../assets/icons/holiday.png")} style={styles.cardIcon} />
    </View>
    <Text style={styles.settingText}>Add Holidays</Text>
    <Ionicons name="chevron-forward" size={24} color="#000" />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.settingItem}
    onPress={handleAddLeaves}
  >
    <View style={[styles.settingIcon, {backgroundColor: '#E5E5FE', borderRadius: 50}]}>
      <Image source={require("../../../assets/icons/leave.png")} style={styles.cardIcon} />
    </View>
    <Text style={styles.settingText}>Add Leaves</Text>
    <Ionicons name="chevron-forward" size={24} color="#000" />
  </TouchableOpacity>
</View>

      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  // Header Container
  headerContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  backArrow: {
    right: 5,
  },

  // Settings List Container
  settingsList: {
    padding: 20,
  },

  // Individual Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 4,
  },
  settingIcon: {
    padding: 13,
    borderRadius: 50,
    marginRight: 15,
  },
  cardIcon: {
    height: 25,
    width: 25,
    resizeMode: "contain",
  },
  settingText: {
    fontSize: 18,
    flex: 1,
    fontWeight: '500',
    color: '#333',
  },
});

export default Settings;