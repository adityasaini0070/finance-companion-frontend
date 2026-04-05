/* eslint-disable react-native/no-inline-styles */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Ionicons';

import { TransactionAPI } from '../api/axiosConfig';
import SummaryCard from '../components/SummaryCard';
import TransactionItem from '../components/TransactionItem';
import { LoadingSpinner, EmptyState, ErrorBanner } from '../components/UIHelpers';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function buildChart(transactions) {
  const today = new Date();
  const labels = [], incomeData = [], expenseData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));
    const day = transactions.filter(t => (t.date || '').startsWith(key));
    incomeData.push(day.filter(t => t.type === 'INCOME').reduce((s, t) => s + (t.amount || 0), 0));
    expenseData.push(day.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + (t.amount || 0), 0));
  }
  return { labels, incomeData, expenseData };
}

export default function HomeScreen({ navigation }) {
  const [summary, setSummary] = useState({ balance: 0, totalIncome: 0, totalExpenses: 0 });
  const [recent, setRecent] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    try {
      setError(null);
      const [sumRes, txRes] = await Promise.all([
        TransactionAPI.getSummary(),
        TransactionAPI.getAll(),
      ]);
      console.log('[DEBUG] Summary:', JSON.stringify(sumRes.data));
      const d = sumRes.data;
      setSummary({
        balance: d.currentBalance ?? d.balance ?? 0,
        totalIncome: d.totalIncome ?? 0,
        totalExpenses: d.totalExpenses ?? 0,
      });
      const sorted = [...(txRes.data || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecent(sorted.slice(0, 5));
      setChartData(buildChart(txRes.data || []));
    } catch (err) {
      console.log('[DEBUG] Error:', err.message, err.code);
      setError('Cannot reach server. Is your Spring Boot backend running?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchAll(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const goAddTx = () =>
    navigation.navigate('Transactions', { screen: 'AddEditTransaction', params: {} });

  if (loading) return <LoadingSpinner message="Loading your finances…" />;

  const balancePositive = summary.balance >= 0;

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()} 👋</Text>
          <Text style={styles.headerTitle}>Finance Overview</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={goAddTx}>
          <Icon name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Balance Hero ── */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Balance</Text>
        <Text style={[styles.heroAmount, { color: balancePositive ? '#A7F3D0' : '#FCA5A5' }]}>
          {balancePositive ? '' : '-'}₹{Math.abs(summary.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
        <View style={[styles.heroBadge, { backgroundColor: balancePositive ? colors.income + '30' : colors.expense + '30' }]}>
          <Icon name={balancePositive ? 'trending-up' : 'trending-down'} size={14} color={balancePositive ? '#A7F3D0' : '#FCA5A5'} />
          <Text style={[styles.heroBadgeText, { color: balancePositive ? '#A7F3D0' : '#FCA5A5' }]}>
            {balancePositive ? 'Positive balance' : 'Negative balance'}
          </Text>
        </View>
      </View>

      {/* ── Error Banner ── */}
      {error && <ErrorBanner message={error} onRetry={() => { setLoading(true); fetchAll(); }} />}

      {/* ── Summary Cards ── */}
      <View style={styles.summaryRow}>
        <SummaryCard title="Income" amount={summary.totalIncome} icon="arrow-down-circle" iconColor={colors.income} bgColor={colors.incomeLight} />
        <SummaryCard title="Expenses" amount={summary.totalExpenses} icon="arrow-up-circle" iconColor={colors.expense} bgColor={colors.expenseLight} />
      </View>

      {/* ── 7-Day Chart ── */}
      {chartData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 7 Days</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
                <Text style={styles.legendText}>Expenses</Text>
              </View>
            </View>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [
                  { data: chartData.incomeData.map(v => v || 0.01), color: () => colors.income, strokeWidth: 2.5 },
                  { data: chartData.expenseData.map(v => v || 0.01), color: () => colors.expense, strokeWidth: 2.5 },
                ],
              }}
              width={width - 72}
              height={160}
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: () => colors.primary,
                labelColor: () => colors.textSecondary,
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#fff' },
              }}
              bezier
              withShadow={false}
              style={{ borderRadius: 10, marginLeft: -10 }}
            />
          </View>
        </View>
      )}

      {/* ── Recent Transactions ── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No transactions yet"
            subtitle="Tap + to record your first income or expense"
            actionLabel="Add Transaction"
            onAction={goAddTx}
          />
        ) : (
          recent.map(item => (
            <TransactionItem
              key={item.id}
              item={item}
              onPress={tx =>
                navigation.navigate('Transactions', { screen: 'AddEditTransaction', params: { transaction: tx } })
              }
            />
          ))
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 0,
  },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 6 },
  heroAmount: { fontSize: 40, fontWeight: '900', letterSpacing: -1, marginBottom: 10 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginTop: -18,
    marginBottom: 6,
  },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  chartLegend: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
});