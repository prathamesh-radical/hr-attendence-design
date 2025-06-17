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


const IncrementHistoryModal = ({ state, setStateValue, openEditIncrement, formatCurrency }) => (
  <Modal visible={state.isHistoryModalVisible} animationType="slide">
    <View style={styles.modalContainer}>
      <Text style={styles.sectionHeader}>Increment History</Text>
      {state.salaryHistory.length > 0 ? (
        <ScrollView>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.tableCell]}>Date</Text>
              <Text style={[styles.tableHeaderText, styles.tableCell]}>Increment</Text>
              <Text style={[styles.tableHeaderText, styles.tableCell, {paddingHorizontal: 5}]}>Prev.Base Salary</Text>
              <Text style={[styles.tableHeaderText, styles.tableCell]}>Prev. Total Salary</Text>
              <Text style={[styles.tableHeaderText, styles.tableCell]}>Action</Text>
            </View>
            {state.salaryHistory.map((item, index) => (
              <View style={styles.tableRow} key={`history-${item.id}`}>
                <Text style={[styles.tableCell, styles.tableText]}>
                  {item.increment_date || 'Initial'}
                </Text>
                <Text style={[styles.tableCell, styles.tableText]}>
                  {formatCurrency(item.increment_amount)}
                </Text>
                <Text style={[styles.tableCell, styles.tableText]}>
                  {formatCurrency(item.base_salary)}
                </Text>
                <Text style={[styles.tableCell, styles.tableText]}>
                  {formatCurrency(item.total_salary)}
                </Text>
                <View style={[styles.tableCell, styles.actionCell]}>
                  {index === 0 && (
                    <TouchableOpacity
                      style={styles.editIncrementButton}
                      onPress={() => {
                        openEditIncrement(item);
                        setStateValue('isHistoryModalVisible', false);
                      }}
                    >
                      <Icon source="pencil" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.label}>No increment history available</Text>
      )}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setStateValue('isHistoryModalVisible', false)}
      >
        <Text style={styles.cancelButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
 </Modal>);
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginVertical: 10 },
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
  totalSalary: { fontSize: 18, fontWeight: 'bold', marginTop: 20, color: '#000', textAlign: 'center' },
  totalAdditions: { fontSize: 16, marginTop: 10, color: 'green', textAlign: 'center' },
  totalDeductions: { fontSize: 16, marginTop: 5, color: 'red', textAlign: 'center' },
  submitButton: { backgroundColor: 'green', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  editButton: { backgroundColor: '#ffa500', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  editButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  incrementButton: { backgroundColor: '#28a745', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  incrementButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  historyButton: { backgroundColor: '#17a2b8', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  historyButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalContainer: { flex: 1, padding: 10, backgroundColor: '#F0F0F0' },
  modalScrollContainer: { flexGrow: 1 },
  cancelButton: { backgroundColor: '#1E1E1E', padding: 12, borderRadius: 5, alignItems: 'center', position: "relative", bottom: 230 },
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
  tableContainer: { marginVertical: 10 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#D3E1DD',
    borderRadius: 12,
    marginVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableHeaderText: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#D3E1DD',
    padding: 10,
    marginVertical: 5,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: { flex: 1, textAlign: 'center' },
  tableText: { fontSize: 13, color: '#555' },
  actionCell: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  editIncrementButton: {
    backgroundColor: '#307A59',
    padding: 5,
    borderRadius: 5,
  },
  editIncrementButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default IncrementHistoryModal;
