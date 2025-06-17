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

const IncrementModal = ({ state, setStateValue, formatCurrency, submitIncrement, onDateChange,toNumber }) => (
  <Modal visible={state.isIncrementModalVisible} animationType="slide">
    <View style={styles.modalContainer}>
      <View style={styles.formContainer}>
        <Text style={styles.sectionHeader}>{state.isEditingIncrement ? 'Edit Salary Increment' : 'Add Salary Increment'}</Text>
        <Text style={styles.label}>
          Current Base Salary: {formatCurrency(
            state.isEditingIncrement
              ? state.originalBaseSalary || state.salaryDetails?.base_salary
              : state.salaryDetails?.base_salary || 0
          )}
        </Text>
        <Text style={styles.label}>Increment Amount:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Increment Amount"
          keyboardType="numeric"
          value={state.incrementAmount}
          onChangeText={(val) => setStateValue('incrementAmount', val)}
        />
        <Text style={styles.label}>Increment Date:</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setStateValue('showDatePicker', true)}
        >
          <Text style={styles.dateButtonText}>
            {state.incrementDate.toISOString().split('T')[0]}
          </Text>
        </TouchableOpacity>
        {state.showDatePicker && (
          <DateTimePicker
            value={state.incrementDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        <Text style={styles.totalSalary}>
          New Base Salary: {formatCurrency(
            (state.isEditingIncrement
              ? toNumber(state.originalBaseSalary || state.salaryDetails?.base_salary)
              : toNumber(state.salaryDetails?.base_salary || 0)) + toNumber(state.incrementAmount)
          )}
        </Text>
      </View>
      <TouchableOpacity style={styles.submitButton} onPress={submitIncrement}>
        <Text style={styles.submitButtonText}>{state.isEditingIncrement ? 'Update Increment' : 'Submit Increment'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => {
          setStateValue('isIncrementModalVisible', false);
          setStateValue('isEditingIncrement', false);
          setStateValue('editingIncrementId', null);
          setStateValue('incrementAmount', '');
          setStateValue('incrementDate', new Date());
          setStateValue('originalBaseSalary', null);
        }}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  formContainer: {backgroundColor: "#fff", padding: 20, borderRadius: 14, marginVertical: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 7, padding: 10, marginVertical: 10 },
  picker: { marginVertical: 10 },
  addButton: { backgroundColor: '#007bff', padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  addButtonText: { color: '#fff', fontSize: 16 },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  smallInput: { flex: 1, marginHorizontal: 5, minWidth: 100 },
  removeButton: { backgroundColor: 'red', padding: 8, borderRadius: 5, marginLeft: 10 },
  removeButtonText: { color: '#fff', fontSize: 16 },
  totalSalary: { fontSize: 18, fontWeight: 'bold', marginTop: 20, color: 'green', textAlign: 'center' },
  totalAdditions: { fontSize: 16, marginTop: 10, color: 'green', textAlign: 'center' },
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
  modalScrollContainer: { flexGrow: 1 },
  cancelButton: { backgroundColor: '#1E1E1E', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  cancelButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  componentLabel: { fontSize: 16, fontWeight: 'bold', marginRight: 10, width: 80 },
  componentValue: { fontSize: 16, width: 80, textAlign: 'right' },
  componentsContainer: { marginVertical: 10 },
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
});
export default IncrementModal;