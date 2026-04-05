/* eslint-disable react-native/no-inline-styles */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { GoalAPI } from '../api/axiosConfig';
import { LoadingSpinner, EmptyState, ErrorBanner } from '../components/UIHelpers';
import { colors } from '../theme/colors';

const STATUS_CONFIG = {
  ACHIEVED: { color: colors.achieved, icon: 'checkmark-circle', label: 'Achieved' },
  ON_TRACK: { color: colors.onTrack, icon: 'time-outline', label: 'On Track' },
  AT_RISK: { color: colors.atRisk, icon: 'warning-outline', label: 'At Risk' },
};

function GoalCard({ goal, onDelete, onRefresh }) {
  const pct = Math.min((goal.progressPercentage || 0), 100);
  const cfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.ON_TRACK;
  const [busy, setBusy] = useState(false);

  const doRefresh = async () => {
    setBusy(true);
    try { await onRefresh(goal.id); } finally { setBusy(false); }
  };

  return (
    <View style={styles.goalCard}>
      {/* Title row */}
      <View style={styles.goalHeader}>
        <View style={styles.goalTitleRow}>
          <Text style={styles.goalTitle} numberOfLines={1}>{goal.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22' }]}>
            <Icon name={cfg.icon} size={12} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <View style={styles.goalActions}>
          <TouchableOpacity onPress={doRefresh} style={styles.iconBtn} disabled={busy}>
            {busy
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Icon name="refresh-outline" size={18} color={colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(goal)} style={styles.iconBtn}>
            <Icon name="trash-outline" size={18} color={colors.expense} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Meta */}
      <Text style={styles.goalMeta}>
        {new Date(0, goal.month - 1).toLocaleString('en-IN', { month: 'long' })} {goal.year}
      </Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.progressPct}>{pct.toFixed(1)}% saved</Text>
        <Text style={styles.progressSaved}>
          ₹{(goal.currentSaved || 0).toLocaleString('en-IN')} / ₹{(goal.targetAmount || 0).toLocaleString('en-IN')}
        </Text>
      </View>

      {/* Remaining */}
      {pct < 100 && (
        <Text style={styles.remaining}>
          ₹{Math.max(0, (goal.targetAmount || 0) - (goal.currentSaved || 0)).toLocaleString('en-IN')} remaining
        </Text>
      )}
    </View>
  );
}

export default function GoalScreen() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [fErr, setFErr] = useState({});

  const fetchGoals = async () => {
    try {
      setError(null);
      const res = await GoalAPI.getAll();
      setGoals(res.data || []);
    } catch {
      setError('Failed to load goals.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchGoals(); }, []));

  const handleRefreshGoal = async (id) => {
    await GoalAPI.refresh(id);
    fetchGoals();
  };

  const handleDelete = (goal) => {
    Alert.alert('Delete Goal', `Delete "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await GoalAPI.delete(goal.id); setGoals(g => g.filter(x => x.id !== goal.id)); }
          catch { Alert.alert('Error', 'Could not delete.'); }
        },
      },
    ]);
  };

  const validateForm = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!target || isNaN(+target) || +target <= 0) e.target = 'Enter valid amount';
    const m = parseInt(month, 10);
    if (isNaN(m) || m < 1 || m > 12) e.month = '1–12';
    const y = parseInt(year, 10);
    if (isNaN(y) || y < 2020 || y > 2100) e.year = 'Valid year';
    setFErr(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await GoalAPI.create({
        name: name.trim(),
        targetAmount: parseFloat(target),
        month: parseInt(month, 10),
        year: parseInt(year, 10),
      });
      setShowModal(false);
      setName(''); setTarget(''); setFErr({});
      fetchGoals();
    } catch {
      Alert.alert('Error', 'Could not create goal.');
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const achieved = goals.filter(g => g.status === 'ACHIEVED').length;
  const onTrack = goals.filter(g => g.status === 'ON_TRACK').length;
  const atRisk = goals.filter(g => g.status === 'AT_RISK').length;

  if (loading) return <LoadingSpinner message="Loading goals…" />;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Goals</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      {goals.length > 0 && (
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.achieved }]}>{achieved}</Text>
            <Text style={styles.statLabel}>Achieved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.onTrack }]}>{onTrack}</Text>
            <Text style={styles.statLabel}>On Track</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.atRisk }]}>{atRisk}</Text>
            <Text style={styles.statLabel}>At Risk</Text>
          </View>
        </View>
      )}

      {error && <ErrorBanner message={error} onRetry={() => { setLoading(true); fetchGoals(); }} />}

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGoals(); }} colors={[colors.primary]} />
        }
      >
        {goals.length === 0 ? (
          <EmptyState
            icon="trophy-outline"
            title="No goals yet"
            subtitle="Set a monthly savings goal and track your progress"
            actionLabel="Create Goal"
            onAction={() => setShowModal(true)}
          />
        ) : (
          goals.map(g => (
            <GoalCard key={g.id} goal={g} onDelete={handleDelete} onRefresh={handleRefreshGoal} />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModal(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>New Savings Goal</Text>

          <Text style={styles.fieldLabel}>Goal Name</Text>
          <TextInput
            style={[styles.sheetInput, fErr.name && styles.inputErr]}
            placeholder="e.g. Emergency Fund"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={v => { setName(v); setFErr(e => ({ ...e, name: null })); }}
          />
          {fErr.name && <Text style={styles.fErrText}>{fErr.name}</Text>}

          <Text style={styles.fieldLabel}>Target Amount (₹)</Text>
          <TextInput
            style={[styles.sheetInput, fErr.target && styles.inputErr]}
            placeholder="e.g. 10000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={target}
            onChangeText={v => { setTarget(v); setFErr(e => ({ ...e, target: null })); }}
          />
          {fErr.target && <Text style={styles.fErrText}>{fErr.target}</Text>}

          <View style={styles.monthYearRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Month (1–12)</Text>
              <TextInput
                style={[styles.sheetInput, fErr.month && styles.inputErr]}
                placeholder="Month"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={month}
                onChangeText={v => { setMonth(v); setFErr(e => ({ ...e, month: null })); }}
                maxLength={2}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Year</Text>
              <TextInput
                style={[styles.sheetInput, fErr.year && styles.inputErr]}
                placeholder="Year"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={year}
                onChangeText={v => { setYear(v); setFErr(e => ({ ...e, year: null })); }}
                maxLength={4}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.sheetSave} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.sheetSaveText}>Create Goal</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 18,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  addBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  statsStrip: {
    flexDirection: 'row', backgroundColor: colors.card,
    marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 14,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  list: { padding: 16 },
  goalCard: {
    backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 14,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 7,
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  goalTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  goalTitle: { fontSize: 16, fontWeight: '800', color: colors.text, maxWidth: '60%' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  goalActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  goalMeta: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginBottom: 12 },
  progressTrack: { height: 10, backgroundColor: colors.borderLight, borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 10 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressPct: { fontSize: 12, fontWeight: '700', color: colors.text },
  progressSaved: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  remaining: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  sheetInput: {
    backgroundColor: colors.background, borderRadius: 12, borderWidth: 1.5,
    borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.text,
  },
  inputErr: { borderColor: colors.expense },
  fErrText: { fontSize: 12, color: colors.expense, marginTop: 3, fontWeight: '500' },
  monthYearRow: { flexDirection: 'row', marginTop: 0 },
  sheetSave: {
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 24,
  },
  sheetSaveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});