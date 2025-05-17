import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet, Alert, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

import { BACKEND_URL } from '../../utils/constants';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const AddHolidays = () => {
    const navigation = useNavigation();
    const [state, setState] = useState({
        holidays: [],
        fetchedHolidays: [],
        showPickerIndex: null,
        token: null,
        selectedMonth: new Date()
    });

    const fetchHolidays = useCallback(async (token, month) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/holiday/holidays?year=${month.getFullYear()}&month=${String(month.getMonth() + 1).padStart(2, '0')}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to fetch holidays");
            setState(prev => ({ ...prev, fetchedHolidays: Object.entries(data.holidays || {}).map(([key, holidays]) => ({
                title: key,
                data: Array.isArray(holidays) ? holidays : []
            })) }));
        } catch (error) {
            Alert.alert("Error", error.message);
            setState(prev => ({ ...prev, fetchedHolidays: [] }));
        }
    }, []);

    useEffect(() => {
        AsyncStorage.getItem('userToken')
            .then(token => {
                if (!token) throw new Error("User token not found");
                setState(prev => ({ ...prev, token }));
                fetchHolidays(token, state.selectedMonth);
            })
            .catch(() => Alert.alert("Error", "Failed to retrieve token"));
    }, [fetchHolidays, state.selectedMonth]);

    const updateHoliday = (index, field, value) => setState(prev => {
        const updatedHolidays = [...prev.holidays];
        updatedHolidays[index][field] = value;
        return { ...prev, holidays: updatedHolidays };
    });

    const handleHolidayAction = useCallback(async (url, method, body, successMsg) => {
        if (!state.token) return Alert.alert("Error", "Authentication token missing");
        try {
            const response = await fetch(`${BACKEND_URL}${url}`, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || `Failed to ${method.toLowerCase()} holiday`);
            Alert.alert("Success", successMsg);
            fetchHolidays(state.token, state.selectedMonth);
            if (method === 'POST') setState(prev => ({ ...prev, holidays: [] }));
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    }, [state.token, state.selectedMonth, fetchHolidays]);

    const renderHolidayCard = (holiday, index, isFetched = false) => (
        <View key={isFetched ? index : holiday.id} style={styles.holidayCard}>
            {isFetched ? (
                <>
                    <Text style={styles.dateText}>Date: {holiday.date.split('T')[0]}</Text>
                    <Text style={styles.reasonText}>Reason: {holiday.reason}</Text>
                </>
            ) : (
                <>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setState(prev => ({ ...prev, showPickerIndex: index }))}>
                        <Text style={styles.dateText}>{holiday.date ? holiday.date.toDateString() : 'Select Date'}</Text>
                    </TouchableOpacity>
                    {state.showPickerIndex === index && (
                        <DateTimePicker
                            value={holiday.date || new Date()}
                            mode="date"
                            onChange={(e, date) => {
                                if (date) updateHoliday(index, 'date', date);
                                setState(prev => ({ ...prev, showPickerIndex: null }));
                            }}
                        />
                    )}
                    <TextInput
                        style={styles.input}
                        placeholder="Enter reason"
                        value={holiday.reason}
                        onChangeText={text => updateHoliday(index, 'reason', text)}
                    />
                </>
            )}
            <TouchableOpacity 
                style={styles.removeButton} 
                onPress={() => isFetched ? 
                    handleHolidayAction('/api/holiday/remove', 'DELETE', { holidayId: holiday.id }, "Holiday removed successfully!") :
                    setState(prev => ({ ...prev, holidays: prev.holidays.filter(h => h.id !== holiday.id) }))}
            >
                <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
        </View>
    );

    const renderItem = ({ item }) => (
        <View>
            {item.type === 'addHoliday' ? (
                <>
                    <TouchableOpacity style={styles.addButton} onPress={() => setState(prev => ({ ...prev, holidays: [...prev.holidays, { id: Date.now(), date: null, reason: '' }] }))}>
                        <Text style={styles.addButtonText}>+ Add Holiday</Text>
                    </TouchableOpacity>
                    {state.holidays.map((holiday, index) => renderHolidayCard(holiday, index))}
                    <TouchableOpacity 
                        style={styles.submitButton} 
                        onPress={() => handleHolidayAction('/api/holiday/add', 'POST', { 
                            holidays: state.holidays
                                .filter(h => h.date && h.reason.trim())
                                .map(h => ({ date: h.date.toISOString().split('T')[0], reason: h.reason }))
                        }, "Holidays added successfully!")}
                    >
                        <Text style={styles.submitButtonText}>Submit Holidays</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <View style={styles.monthFilter}>
                        <TouchableOpacity onPress={() => setState(prev => ({ ...prev, selectedMonth: new Date(prev.selectedMonth.setMonth(prev.selectedMonth.getMonth() - 1)) }))}>
                            <Text style={styles.arrow}>{'<'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.monthText}>
                            {state.selectedMonth.toLocaleString('default', { month: 'long' })} {state.selectedMonth.getFullYear()}
                        </Text>
                        <TouchableOpacity onPress={() => setState(prev => ({ ...prev, selectedMonth: new Date(prev.selectedMonth.setMonth(prev.selectedMonth.getMonth() + 1)) }))}>
                            <Text style={styles.arrow}>{'>'}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.holidaysListContainer}>
                        {state.fetchedHolidays.map((section, idx) => (
                            <View key={idx} style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                {section.data.map((holiday, idx) => renderHolidayCard(holiday, idx, true))}
                            </View>
                        ))}
                    </View>
                </>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Button onPress={() => navigation.goBack("Home")} style={styles.backButton}>
                <Text style={styles.BackButtonText}>⬅️</Text>
            </Button>
            <FlatList
                data={[{ type: 'addHoliday' }, { type: 'viewHolidays' }]}
                renderItem={renderItem}
                keyExtractor={(_, index) => index.toString()}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4', padding: 20 },
    addButton: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
    addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    holidayCard: { 
        backgroundColor: '#fff', 
        padding: 15, 
        borderRadius: 8, 
        marginBottom: 10, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
    },
    dateText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    reasonText: { fontSize: 14, color: '#555' },
    submitButton: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    monthFilter: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 15 
    },
    arrow: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#007bff', 
        marginHorizontal: 20 
    },
    monthText: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#333' 
    },
    sectionTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#007bff', 
        marginBottom: 10 
    },
    removeButton: { 
        backgroundColor: '#dc3545', 
        padding: 10, 
        borderRadius: 5, 
        width: 80, 
        alignItems: 'center' 
    },
    removeButtonText: { 
        color: '#fff', 
        fontSize: 14, 
        fontWeight: 'bold' 
    },
    holidaysListContainer: { 
        marginTop: 10, 
        padding: 10, 
        backgroundColor: '#fff', 
        borderRadius: 8 ,
    },
    sectionContainer: { 
        marginBottom: 30 ,
    },
    backButton: {
        backgroundColor: "#ccc",
        width: 20,
        marginBottom: 10
    },
    BackButtonText: {
        width: 50 
    }
});

export default AddHolidays;