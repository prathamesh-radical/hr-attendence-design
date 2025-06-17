import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BACKEND_URL } from '../utils/constants';
import { Icon } from 'react-native-paper';

// Edit Salary Component
const EditSalaryModal = ({ state, setStateValue, salaryOptions, deductionOptions, calculateTotalAdditions, calculateTotalDeductions, calculateTotalSalary, submitSalaryData }) => {
  const addSalaryComponent = (itemValue) => {
    if (!itemValue) return;
    if (itemValue !== 'Others' && state.salaryComponents.some((c) => c.type === itemValue)) {
      Toast.show({ type: 'error', text1: 'Error', text2: `${itemValue} is already added.` });
      return;
    }
    setStateValue('salaryComponents', [
      ...state.salaryComponents,
      { id: `${itemValue}-${Date.now()}`, type: itemValue, name: itemValue === 'Others' ? '' : itemValue, value: '' },
    ]);
    setStateValue('selectedComponent', '');
  };

  const updateComponent = (index, key, value) => {
    const updated = [...state.salaryComponents];
    updated[index][key] = value;
    setStateValue('salaryComponents', updated);
  };

  const addDeductionComponent = (itemValue) => {
    if (!itemValue) return;
    if (itemValue !== 'Other Deductions' && state.otherDeductions.some((d) => d.type === itemValue)) {
      Toast.show({ type: 'error', text1: 'Error', text2: `${itemValue} is already added.` });
      return;
    }
    setStateValue('otherDeductions', [
      ...state.otherDeductions,
      { id: `${itemValue}-${Date.now()}`, type: itemValue, name: itemValue === 'Other Deductions' ? '' : itemValue, value: '' },
    ]);
    setStateValue('selectedDeduction', '');
  };

  const updateDeduction = (index, key, value) => {
    const updated = [...state.otherDeductions];
    updated[index][key] = value;
    setStateValue('otherDeductions', updated);
  };

  const getAvailableSalaryOptions = () => {
    const selectedTypes = state.salaryComponents.map((comp) => comp.type);
    return salaryOptions.filter((option) => option === 'Others' || !selectedTypes.includes(option));
  };

  const getAvailableDeductionOptions = () => {
    const selectedTypes = state.otherDeductions.map((ded) => ded.type);
    return deductionOptions.filter((option) => option === 'Other Deductions' || !selectedTypes.includes(option));
  };

  return (
    <Modal visible={state.isEditModalVisible} animationType="slide" style={styles.container}>
      <ScrollView contentContainerStyle={styles.modalScrollContainer}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.label}>Base Salary:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Base Salary"
              keyboardType="numeric"
              value={state.baseSalary}
              onChangeText={(val) => setStateValue('baseSalary', val)}
            />
          </View>
          <View style={styles.additionsContainer}>
            <Text style={styles.sectionHeader}>Additions</Text>
            <Picker
              selectedValue={state.selectedComponent}
              onValueChange={(itemValue) => {
                setStateValue('selectedComponent', itemValue);
                addSalaryComponent(itemValue);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select Component" value="" />
              {getAvailableSalaryOptions().map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
            <View style={styles.componentsContainer}>
              {state.salaryComponents.map((item, index) => (
                <View style={styles.componentRow} key={item.id}>
                  {item.type === 'Others' ? (
                    <>
                      <TextInput
                        style={[styles.input, styles.smallInput]}
                        placeholder="Component Name"
                        value={item.name}
                        onChangeText={(text) => updateComponent(index, 'name', text)}
                      />
                      <TextInput
                        style={[styles.input, styles.smallInput]}
                        placeholder="Value"
                        keyboardType="numeric"
                        value={item.value}
                        onChangeText={(text) => updateComponent(index, 'value', text)}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.componentLabel}>{item.type}:</Text>
                      <TextInput
                        style={[styles.input, styles.smallInput]}
                        placeholder="Enter Value"
                        keyboardType="numeric"
                        value={item.value}
                        onChangeText={(text) => updateComponent(index, 'value', text)}
                      />
                    </>
                  )}
                  <TouchableOpacity
                    onPress={() =>
                      setStateValue(
                        'salaryComponents',
                        state.salaryComponents.filter((_, i) => i !== index)
                      )
                    }
                    style={styles.removeButton}
                  >
                    <Icon source="delete" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.deductionsContainer}>
            <Text style={styles.sectionHeader}>Deductions</Text>
            <View style={styles.componentRow}>
              <Text style={styles.componentLabel}>PF:</Text>
              <TextInput
                style={[styles.input, styles.smallInput]}
                placeholder="Enter PF Amount"
                keyboardType="numeric"
                value={state.pf}
                onChangeText={(val) => setStateValue('pf', val)}
              />
            </View>
            <View style={styles.componentRow}>
              <Text style={styles.componentLabel}>PT:</Text>
              <TextInput
                style={[styles.input, styles.smallInput]}
                placeholder="Enter PT Amount"
                keyboardType="numeric"
                value={state.pt}
                onChangeText={(val) => setStateValue('pt', val)}
              />
            </View>
            <Picker
              selectedValue={state.selectedDeduction}
              onValueChange={(itemValue) => {
                setStateValue('selectedDeduction', itemValue);
                addDeductionComponent(itemValue);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select Deduction" value="" />
              {getAvailableDeductionOptions().map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
            <View style={styles.componentsContainer}>
              {state.otherDeductions.map((item, index) => (
                <View style={styles.componentRow} key={item.id}>
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="Deduction Name"
                    value={item.name}
                    onChangeText={(text) => updateDeduction(index, 'name', text)}
                  />
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="Amount"
                    keyboardType="numeric"
                    value={item.value}
                    onChangeText={(text) => updateDeduction(index, 'value', text)}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setStateValue(
                        'otherDeductions',
                        state.otherDeductions.filter((_, i) => i !== index)
                      )
                    }
                    style={styles.removeButton}
                  >
                      <Icon source="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <View style={styles.totalAdditions}>
              <Text style={[styles.label, {color: 'green'}]}>Total Additions:</Text>
              <Text style={[styles.value, {color: 'green'}]}>{calculateTotalAdditions().toFixed(2)}</Text>
            </View>
            <View style={styles.totalAdditions}>
              <Text style={[styles.label, {color: 'red'}]}>Total Deductions:</Text>
              <Text style={[styles.value, {color: 'red'}]}>{calculateTotalDeductions().toFixed(2)}</Text>
            </View>
            <View style={styles.totalAdditions}>
              <Text style={[styles.label, {color: 'green'}]}>Total Salary:</Text>
              <Text style={[styles.value, {color: 'green'}]}>{calculateTotalSalary()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={submitSalaryData}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setStateValue('isEditModalVisible', false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 10, marginVertical: 10 },
  picker: { paddingHorizontal: 20, backgroundColor: '#F0F0F0', borderRadius: 12 },
  addButton: { backgroundColor: '#007bff', padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  addButtonText: { color: '#fff', fontSize: 16 },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  smallInput: { flex: 1, marginHorizontal: 5 },
  removeButton: { backgroundColor: '#307A59', padding: 8, borderRadius: 5, marginLeft: 5 },
  removeButtonText: { color: '#fff', fontSize: 16 },
  totalSalary: { fontSize: 18, fontWeight: 'bold', marginTop: 20, color: '#000', textAlign: 'center' },
  totalAdditions: { fontSize: 16, marginTop: 0, color: 'green', flexDirection: 'row', justifyContent: 'space-between' },
  totalDeductions: { fontSize: 16, marginTop: 5, color: 'red', textAlign: 'center' },
  submitButton: { backgroundColor: '#307A59', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  editButton: { backgroundColor: '#ffa500', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  editButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  incrementButton: { backgroundColor: '#28a745', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  incrementButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  historyButton: { backgroundColor: '#17a2b8', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  historyButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalContainer: { flex: 1, padding: 20, backgroundColor: '#F0F0F0' },
  modalHeader: {backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 14 },
  modalScrollContainer: { flexGrow: 1 },
  cancelButton: { backgroundColor: '#1E1E1E', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  cancelButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  componentLabel: { fontSize: 16, fontWeight: 'bold' },
  componentValue: { fontSize: 16, width: 80, textAlign: 'right' },
  componentsContainer: { marginVertical: 0 },
  additionsContainer: {backgroundColor: '#fff', marginVertical: 20, paddingHorizontal: 20, borderRadius: 14 },
  deductionsContainer: {backgroundColor: '#fff', marginVertical: 20, paddingHorizontal: 20, paddingBottom: 20, borderRadius: 14 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#333' },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  dateButtonText: { fontSize: 16, color: '#333' },
  tableContainer: { marginVertical: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableHeaderText: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: { flex: 1, padding: 5, textAlign: 'center' },
  tableText: { fontSize: 14, color: '#555' },
  actionCell: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  editIncrementButton: {
    backgroundColor: '#ffa500',
    padding: 8,
    borderRadius: 5,
  },
  editIncrementButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {backgroundColor: "#fff", marginVertical: 20, paddingHorizontal: 20, paddingVertical: 20, borderRadius: 14 },
});

export default EditSalaryModal;