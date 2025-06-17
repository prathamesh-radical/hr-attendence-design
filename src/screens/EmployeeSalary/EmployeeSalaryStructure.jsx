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
import { BACKEND_URL } from '../../utils/constants';
import EditSalaryModal from './EditSalaryModal';
import IncrementModal from './IncrementModal';
import IncrementHistoryModal from './IncrementHistoryModal';
import { Divider } from 'react-native-paper';
const EmployeeSalaryStructure = () => {
  const { emp_id } = useRoute().params || {};
  const [state, setState] = useState({
    baseSalary: '',
    showDropdown: false,
    salaryComponents: [],
    selectedComponent: '',
    salaryDetails: null,
    salaryHistory: [],
    isEditModalVisible: false,
    isLoading: true,
    pf: '',
    pt: '',
    otherDeductions: [],
    showDeductionDropdown: false,
    selectedDeduction: '',
    isIncrementModalVisible: false,
    incrementAmount: '',
    incrementDate: new Date(),
    showDatePicker: false,
    isEditingIncrement: false,
    editingIncrementId: null,
    originalBaseSalary: null,
    isHistoryModalVisible: false,
  });

  const salaryOptions = ['DA', 'PA', 'MA', 'HRA', 'TA', 'Others'];
  const deductionOptions = ['PF', 'PT', 'Other Deductions'];

  const setStateValue = (key, value) => setState((prev) => ({ ...prev, [key]: value }));

  const toNumber = (value) => (typeof value === 'number' ? value : parseFloat(value) || 0);
  const formatCurrency = (value) => toNumber(value).toFixed(2);

  useEffect(() => {
    const fetchSalaryDetails = async () => {
      setStateValue('isLoading', true);
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/salary/${emp_id}`);
        if (data) {
          setStateValue('salaryDetails', {
            base_salary: toNumber(data.base_salary),
            da: toNumber(data.da),
            hra: toNumber(data.hra),
            ta: toNumber(data.ta),
            ma: toNumber(data.ma),
            pa: toNumber(data.pa),
            others: Array.isArray(data.others)
              ? data.others.map((o) => ({
                  name: o.name || 'Other',
                  value: toNumber(o.value),
                }))
              : [],
            pf: toNumber(data.pf),
            pt: toNumber(data.pt),
            other_deductions: Array.isArray(data.other_deductions)
              ? data.other_deductions.map((d) => ({
                  name: d.name || 'Deduction',
                  value: toNumber(d.value),
                }))
              : [],
            total_salary: toNumber(data.total_salary),
            increment_amount: toNumber(data.increment_amount),
            increment_date: data.increment_date,
          });
          setStateValue('salaryHistory', data.salary_history.reverse().map((entry) => ({
            id: entry.id,
            base_salary: toNumber(entry.base_salary),
            total_salary: toNumber(entry.total_salary),
            increment_amount: toNumber(entry.increment_amount),
            increment_date: entry.increment_date,
          })));
        }
      } catch (error) {
        console.error('Error fetching salary:', error);
        setStateValue('salaryDetails', null);
        setStateValue('salaryHistory', []);
      } finally {
        setStateValue('isLoading', false);
      }
    };
    fetchSalaryDetails();

  }, [emp_id]);

  const calculateTotalAdditions = () =>
    toNumber(state.baseSalary) + state.salaryComponents.reduce((sum, comp) => sum + toNumber(comp.value), 0);

  const calculateTotalDeductions = () =>
    toNumber(state.pf) +
    toNumber(state.pt) +
    state.otherDeductions.reduce((sum, d) => sum + toNumber(d.value), 0);

  const calculateTotalSalary = () => (calculateTotalAdditions() - calculateTotalDeductions()).toFixed(2);

  const submitSalaryData = async () => {
    if (!state.baseSalary || !emp_id) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter base salary and ensure employee ID is provided.' });
      return;
    }

    const salaryData = {
      emp_id,
      base_salary: toNumber(state.baseSalary),
      da: toNumber(state.salaryComponents.find((c) => c.type === 'DA')?.value || 0),
      hra: toNumber(state.salaryComponents.find((c) => c.type === 'HRA')?.value || 0),
      ta: toNumber(state.salaryComponents.find((c) => c.type === 'TA')?.value || 0),
      ma: toNumber(state.salaryComponents.find((c) => c.type === 'MA')?.value || 0),
      pa: toNumber(state.salaryComponents.find((c) => c.type === 'PA')?.value || 0),
      others: state.salaryComponents
        .filter((c) => c.type === 'Others')
        .map((c) => ({ name: c.name || 'Other', value: toNumber(c.value) })),
      pf: toNumber(state.pf),
      pt: toNumber(state.pt),
      other_deductions: state.otherDeductions.map((d) => ({
        name: d.name || d.type,
        value: toNumber(d.value),
      })),
      total_salary: toNumber(calculateTotalSalary()),
    };

    try {
      await axios.post(`${BACKEND_URL}/api/salary`, salaryData);
      const { data } = await axios.get(`${BACKEND_URL}/api/salary/${emp_id}`);
      setStateValue('salaryDetails', {
        base_salary: toNumber(data.base_salary),
        da: toNumber(data.da),
        hra: toNumber(data.hra),
        ta: toNumber(data.ta),
        ma: toNumber(data.ma),
        pa: toNumber(data.pa),
        others: Array.isArray(data.others) ? data.others : [],
        pf: toNumber(data.pf),
        pt: toNumber(data.pt),
        other_deductions: Array.isArray(data.other_deductions) ? data.other_deductions : [],
        total_salary: toNumber(data.total_salary),
        increment_amount: toNumber(data.increment_amount),
        increment_date: data.increment_date,
      });
      setStateValue('salaryHistory', data.salary_history.reverse().map((entry) => ({
        id: entry.id,
        base_salary: toNumber(entry.base_salary),
        total_salary: toNumber(entry.total_salary),
        increment_amount: toNumber(entry.increment_amount),
        increment_date: entry.increment_date,
      })));
      setStateValue('isEditModalVisible', false);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Salary updated successfully' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to submit salary data',
      });
    }
  };

  const submitIncrement = async () => {
    if (!state.incrementAmount) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter increment amount' });
      return;
    }

    let newBaseSalary;
    if (state.isEditingIncrement) {
      newBaseSalary = toNumber(state.originalBaseSalary || state.salaryDetails?.base_salary) + toNumber(state.incrementAmount);
    } else {
      newBaseSalary = toNumber(state.salaryDetails?.base_salary || 0) + toNumber(state.incrementAmount);
    }

    const formattedDate = state.incrementDate.toISOString().split('T')[0];
    const salaryData = {
      emp_id,
      base_salary: newBaseSalary,
      da: toNumber(state.salaryDetails?.da || 0),
      hra: toNumber(state.salaryDetails?.hra || 0),
      ta: toNumber(state.salaryDetails?.ta || 0),
      ma: toNumber(state.salaryDetails?.ma || 0),
      pa: toNumber(state.salaryDetails?.pa || 0),
      others: state.salaryDetails?.others || [],
      pf: toNumber(state.salaryDetails?.pf || 0),
      pt: toNumber(state.salaryDetails?.pt || 0),
      other_deductions: state.salaryDetails?.other_deductions || [],
      total_salary:
        newBaseSalary +
        toNumber(state.salaryDetails?.da || 0) +
        toNumber(state.salaryDetails?.hra || 0) +
        toNumber(state.salaryDetails?.ta || 0) +
        toNumber(state.salaryDetails?.ma || 0) +
        toNumber(state.salaryDetails?.pa || 0) +
        state.salaryDetails?.others.reduce((sum, o) => sum + toNumber(o.value), 0) -
        toNumber(state.salaryDetails?.pf || 0) -
        toNumber(state.salaryDetails?.pt || 0) -
        state.salaryDetails?.other_deductions.reduce((sum, d) => sum + toNumber(d.value), 0),
      increment_amount: toNumber(state.incrementAmount),
      increment_date: formattedDate,
      original_base_salary: state.isEditingIncrement ? toNumber(state.originalBaseSalary) : undefined,
    };

    try {
      if (state.isEditingIncrement) {
        await axios.put(`${BACKEND_URL}/api/increment/${state.editingIncrementId}`, salaryData);
      } else {
        await axios.post(`${BACKEND_URL}/api/increment`, salaryData);
      }
      const { data } = await axios.get(`${BACKEND_URL}/api/salary/${emp_id}`);
      setStateValue('salaryDetails', {
        base_salary: toNumber(data.base_salary),
        da: toNumber(data.da),
        hra: toNumber(data.hra),
        ta: toNumber(data.ta),
        ma: toNumber(data.ma),
        pa: toNumber(data.pa),
        others: Array.isArray(data.others) ? data.others : [],
        pf: toNumber(data.pf),
        pt: toNumber(data.pt),
        other_deductions: Array.isArray(data.other_deductions) ? data.other_deductions : [],
        total_salary: toNumber(data.total_salary),
        increment_amount: toNumber(data.increment_amount),
        increment_date: data.increment_date,
      });
      setStateValue('salaryHistory', data.salary_history.reverse().map((entry) => ({
        id: entry.id,
        base_salary: toNumber(entry.base_salary),
        total_salary: toNumber(entry.total_salary),
        increment_amount: toNumber(entry.increment_amount),
        increment_date: entry.increment_date,
      })));
      setStateValue('isIncrementModalVisible', false);
      setStateValue('incrementAmount', '');
      setStateValue('incrementDate', new Date());
      setStateValue('isEditingIncrement', false);
      setStateValue('editingIncrementId', null);
      setStateValue('originalBaseSalary', null);
      Toast.show({ type: 'success', text1: 'Success', text2: `Increment ${state.isEditingIncrement ? 'updated' : 'added'} successfully` });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || `Failed to ${state.isEditingIncrement ? 'update' : 'add'} increment`,
      });
    }
  };

  const openSalaryPopup = () => {
    if (state.salaryDetails) {
      const components = [];
      if (state.salaryDetails.da > 0) {
        components.push({ id: 'DA', type: 'DA', name: 'DA', value: state.salaryDetails.da.toString() });
      }
      if (state.salaryDetails.hra > 0) {
        components.push({ id: 'HRA', type: 'HRA', name: 'HRA', value: state.salaryDetails.hra.toString() });
      }
      if (state.salaryDetails.ta > 0) {
        components.push({ id: 'TA', type: 'TA', name: 'TA', value: state.salaryDetails.ta.toString() });
      }
      if (state.salaryDetails.ma > 0) {
        components.push({ id: 'MA', type: 'MA', name: 'MA', value: state.salaryDetails.ma.toString() });
      }
      if (state.salaryDetails.pa > 0) {
        components.push({ id: 'PA', type: 'PA', name: 'PA', value: state.salaryDetails.pa.toString() });
      }
      components.push(
        ...state.salaryDetails.others
          .filter((other) => other.value > 0)
          .map((other, index) => ({
            id: `Others-${index}-${Date.now()}`,
            type: 'Others',
            name: other.name,
            value: other.value.toString(),
          }))
      );

      const deductions = state.salaryDetails.other_deductions
        .filter((deduction) => deduction.value > 0)
        .map((deduction, index) => ({
          id: `Deduction-${index}-${Date.now()}`,
          type: deduction.name === 'PF' ? 'PF' : deduction.name === 'PT' ? 'PT' : 'Other Deductions',
          name: ['PF', 'PT'].includes(deduction.name) ? '' : deduction.name,
          value: deduction.value.toString(),
        }));

      setState((prev) => ({
        ...prev,
        baseSalary: state.salaryDetails.base_salary.toString(),
        salaryComponents: components,
        pf: state.salaryDetails.pf > 0 ? state.salaryDetails.pf.toString() : '',
        pt: state.salaryDetails.pt > 0 ? state.salaryDetails.pt.toString() : '',
        otherDeductions: deductions,
        isEditModalVisible: true,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        baseSalary: '',
        salaryComponents: [],
        pf: '',
        pt: '',
        otherDeductions: [],
        isEditModalVisible: true,
      }));
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || state.incrementDate;
    setStateValue('showDatePicker', Platform.OS === 'ios');
    setStateValue('incrementDate', currentDate);
  };

  const openEditIncrement = (increment) => {
    const originalBaseSalary = toNumber(increment.base_salary);
    setStateValue('incrementAmount', increment.increment_amount.toString());
    setStateValue('incrementDate', new Date(increment.increment_date));
    setStateValue('isIncrementModalVisible', true);
    setStateValue('isEditingIncrement', true);
    setStateValue('editingIncrementId', increment.id);
    setStateValue('originalBaseSalary', originalBaseSalary);
  };

  const openAddIncrement = () => {
    setStateValue('incrementAmount', '');
    setStateValue('incrementDate', new Date());
    setStateValue('isIncrementModalVisible', true);
    setStateValue('isEditingIncrement', false);
    setStateValue('editingIncrementId', null);
    setStateValue('originalBaseSalary', null);
  };

  const openHistoryModal = () => {
    setStateValue('isHistoryModalVisible', true);
  };

  if (state.isLoading) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      {state.salaryDetails ? (
        <>
        <View style={styles.salaryDetailsContainer}>
          <Text style={styles.label}>Base Salary: {formatCurrency(state.salaryDetails.base_salary)}</Text>
          <Divider style={styles.divider} />
          <FlatList
            data={[
              ...['DA', 'HRA', 'TA', 'MA', 'PA']
                .filter((type) => state.salaryDetails[type.toLowerCase()] > 0)
                .map((type) => ({
                  type,
                  value: state.salaryDetails[type.toLowerCase()],
                  id: type,
                })),
              ...state.salaryDetails.others
                .filter((other) => other.value > 0)
                .map((other, index) => ({
                  type: 'Others',
                  name: other.name,
                  value: other.value,
                  id: `Others-${index}`,
                })),
            ]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.componentRow}>
                <Text style={styles.componentLabel}>
                  {item.type === 'Others' ? item.name : item.type}:
                </Text>
                <Text style={styles.componentValue}>{formatCurrency(item.value)}</Text>
              </View>
            )}
          />
          </View>
          <View style={styles.deductionsContainer}>
            {state.salaryDetails.pf > 0 || state.salaryDetails.pt > 0 || state.salaryDetails.other_deductions.some((d) => d.value > 0) ? (
              <>
                <Text style={styles.sectionHeader}>Deductions</Text>
                {state.salaryDetails.pf > 0 && (
                  <View style={styles.componentRow}>
                    <Text style={styles.componentLabel}>PF:</Text>
                    <Text style={styles.componentValue}>{formatCurrency(state.salaryDetails.pf)}</Text>
                  </View>
                )}
                <Divider style={styles.divider} />
                {state.salaryDetails.pt > 0 && (
                  <View style={styles.componentRow}>
                    <Text style={styles.componentLabel}>PT:</Text>
                    <Text style={styles.componentValue}>{formatCurrency(state.salaryDetails.pt)}</Text>
                  </View>
                )}
                <Divider style={styles.divider} />
                {state.salaryDetails.other_deductions
                  .filter((deduction) => deduction.value > 0)
                  .map((deduction, index) => (
                    <View style={styles.componentRow} key={`ded-${index}`}>
                      <Text style={styles.componentLabel}>{deduction.name}:</Text>
                      <Text style={styles.componentValue}>{formatCurrency(deduction.value)}</Text>
                    </View>
                  ))}
              </>
            ) : null}
          <Text style={styles.totalSalary}>
            Total Salary: {formatCurrency(state.salaryDetails.total_salary)}
          </Text>
        </View>
          <TouchableOpacity style={styles.historyButton} onPress={openHistoryModal}>
            <Text style={styles.historyButtonText}>View Increment History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editButton} onPress={openSalaryPopup}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.incrementButton} onPress={openAddIncrement}>
            <Text style={styles.incrementButtonText}>Add Increment</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>No salary details found</Text>
          <TouchableOpacity style={styles.addButton} onPress={openSalaryPopup}>
            <Text style={styles.addButtonText}>Add Salary</Text>
          </TouchableOpacity>
        </>
      )}

      <EditSalaryModal
        state={state}
        setStateValue={setStateValue}
        salaryOptions={salaryOptions}
        deductionOptions={deductionOptions}
        calculateTotalAdditions={calculateTotalAdditions}
        calculateTotalDeductions={calculateTotalDeductions}
        calculateTotalSalary={calculateTotalSalary}
        submitSalaryData={submitSalaryData}
      />
      <IncrementModal
        state={state}
        setStateValue={setStateValue}
        formatCurrency={formatCurrency}
        submitIncrement={submitIncrement}
        onDateChange={onDateChange}
        toNumber={toNumber}
      />
      <IncrementHistoryModal
        state={state}
        setStateValue={setStateValue}
        openEditIncrement={openEditIncrement}
        formatCurrency={formatCurrency}
      />

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
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
    paddingVertical: 10,
  },
  smallInput: { flex: 1, marginHorizontal: 5, minWidth: 100 },
  removeButton: { backgroundColor: 'red', padding: 8, borderRadius: 5, marginLeft: 10 },
  removeButtonText: { color: '#fff', fontSize: 16 },
  totalSalary: { fontSize: 18, fontWeight: 'bold', marginTop: 20, color: '#000', textAlign: 'center' },
  totalAdditions: { fontSize: 16, marginTop: 10, color: 'green', textAlign: 'center' },
  totalDeductions: { fontSize: 16, marginTop: 5, color: 'red', textAlign: 'center' },
  submitButton: { backgroundColor: 'green', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  editButton: { backgroundColor: 'transparent', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#307A59', alignItems: 'center', marginTop: 20 },
  editButtonText: { color: '#307A59', fontSize: 18, fontWeight: 'bold' },
  incrementButton: { backgroundColor: '#307A59', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  incrementButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  historyButton: { backgroundColor: '#307A59', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  historyButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalContainer: { flex: 1, padding: 20, backgroundColor: '#F7F8FA' },
  modalScrollContainer: { flexGrow: 1 },
  salaryDetailsContainer: {backgroundColor: '#fff', padding: 10, paddingHorizontal: 20},
  deductionsContainer: {backgroundColor: '#fff', marginVertical: 20, paddingHorizontal: 20, paddingBottom: 20, borderRadius: 14},
  divider: {height: 1},
  cancelButton: { backgroundColor: 'gray', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 20 },
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

export default EmployeeSalaryStructure;