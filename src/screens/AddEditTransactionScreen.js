/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';

import { TransactionAPI } from '../api/axiosConfig';
import { colors, CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../theme/colors';

const TYPES = ['INCOME', 'EXPENSE'];

export default function AddEditTransactionScreen({ navigation, route }) {
  const existing = route.params?.transaction;
  const isEdit = !!existing;

  const [type, setType] = useState(existing?.type || 'EXPENSE');
  const [amount, setAmount] = useState(existing?.amount?.toString() || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [category, setCategory] = useState(existing?.category || 'Other');
  const [date, setDate] = useState(existing?.date ? new Date(existing.date) : new Date());
  const [showDate, setShowDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Transaction' : 'Add Transaction' });
  }, [isEdit, navigation]);

  const validate = () => {
    const e = {};
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
      e.amount = 'Enter a valid positive amount';
    if (!description.trim())
      e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      date: date.toISOString().split('T')[0],
    };
    try {
      if (isEdit) {
        await TransactionAPI.update(existing.id, payload);
      } else {
        await TransactionAPI.create(payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', `Failed to ${isEdit ? 'update' : 'create'} transaction. Check backend.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete', `Delete "${existing?.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await TransactionAPI.delete(existing.id);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Could not delete.');
          }
        },
      },
    ]);
  };

  const inputStyle = (field) => [styles.input, errors[field] && styles.inputError];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Transaction' : 'New Transaction'}</Text>
        {isEdit ? (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Icon name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        ) : <View style={{ width: 38 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>

        {/* Type Toggle */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeToggle}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeBtn,
                type === t && (t === 'INCOME' ? styles.typeBtnIncome : styles.typeBtnExpense),
              ]}
              onPress={() => setType(t)}
            >
              <Icon
                name={t === 'INCOME' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                size={18}
                color={type === t ? '#fff' : colors.textSecondary}
              />
              <Text style={[styles.typeBtnText, type === t && { color: '#fff' }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <Text style={styles.label}>Amount (₹)</Text>
        <View style={[styles.amountBox, errors.amount && styles.inputError]}>
          <Text style={styles.rupee}>₹</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={v => { setAmount(v); setErrors(e => ({ ...e, amount: null })); }}
          />
        </View>
        {errors.amount && <Text style={styles.errText}>{errors.amount}</Text>}

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={inputStyle('description')}
          placeholder="e.g. Grocery shopping"
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={v => { setDescription(v); setErrors(e => ({ ...e, description: null })); }}
          maxLength={100}
        />
        {errors.description && <Text style={styles.errText}>{errors.description}</Text>}

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map(cat => {
            const active = category === cat;
            const col = CATEGORY_COLORS[cat] || colors.primary;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, active && { backgroundColor: col, borderColor: col }]}
                onPress={() => setCategory(cat)}
              >
                <Icon name={CATEGORY_ICONS[cat] || 'ellipsis-horizontal-outline'} size={15} color={active ? '#fff' : col} />
                <Text style={[styles.catChipText, active && { color: '#fff' }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDate(true)}>
          <Icon name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.dateBtnText}>
            {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
          <Icon name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(_, selected) => {
              setShowDate(Platform.OS === 'ios');
              if (selected) setDate(selected);
            }}
          />
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: type === 'INCOME' ? colors.income : colors.expense }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <>
              <Icon name={isEdit ? 'checkmark-circle' : 'add-circle'} size={20} color="#fff" />
              <Text style={styles.saveBtnText}>{isEdit ? 'Update Transaction' : 'Add Transaction'}</Text>
            </>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  deleteBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.expense + '55',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  form: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    marginTop: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeToggle: { flexDirection: 'row', gap: 12 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeBtnIncome: { backgroundColor: colors.income, borderColor: colors.income },
  typeBtnExpense: { backgroundColor: colors.expense, borderColor: colors.expense },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  rupee: { fontSize: 22, fontWeight: '700', color: colors.textSecondary, marginRight: 6 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '800', color: colors.text, paddingVertical: 12 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
  },
  inputError: { borderColor: colors.expense },
  errText: { fontSize: 12, color: colors.expense, marginTop: 4, fontWeight: '500' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  catChipText: { fontSize: 12, fontWeight: '700', color: colors.text },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dateBtnText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600' },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
    borderRadius: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});