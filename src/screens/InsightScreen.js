/* eslint-disable react-native/no-inline-styles */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Ionicons';

import { TransactionAPI, InsightAPI } from '../api/axiosConfig';
import { LoadingSpinner, ErrorBanner } from '../components/UIHelpers';
import { colors, CATEGORY_COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

function AiTipCard({ tip, loading, error, onRetry }) {
  if (loading) {
    return (
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <Icon name="sparkles" size={18} color={colors.primary} />
          <Text style={styles.aiTitle}>Gemini AI Insight</Text>
        </View>
        <View style={styles.aiLoading}>
          <Icon name="hourglass-outline" size={20} color={colors.primary} />
          <Text style={styles.aiLoadingText}>Analysing your finances…</Text>
        </View>
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.aiCard, { borderColor: colors.expense + '44' }]}>
        <View style={styles.aiHeader}>
          <Icon name="sparkles" size={18} color={colors.expense} />
          <Text style={[styles.aiTitle, { color: colors.expense }]}>AI Insight Unavailable</Text>
        </View>
        <Text style={styles.aiError}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!tip) return null;
  return (
    <View style={styles.aiCard}>
      <View style={styles.aiHeader}>
        <Icon name="sparkles" size={18} color={colors.primary} />
        <Text style={styles.aiTitle}>Gemini AI Insight</Text>
        <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View>
      </View>
      <Text style={styles.aiTip}>{tip}</Text>
    </View>
  );
}

export default function InsightsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [aiTip, setAiTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('month'); // 'week' | 'month' | 'all'

  const fetchTransactions = async () => {
    try {
      setError(null);
      const res = await TransactionAPI.getAll();
      setTransactions(res.data || []);
    } catch {
      setError('Could not load transaction data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAiTip = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await InsightAPI.getAI();
      setAiTip(typeof res.data === 'string' ? res.data : res.data?.tip || JSON.stringify(res.data));
    } catch {
      setAiError('Could not reach AI endpoint. Add the /api/insights/ai backend endpoint and Gemini API key.');
    } finally {
      setAiLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchTransactions();
    fetchAiTip();
  }, []));

  // ── Filter by period ──
  const filterByPeriod = (txs) => {
    const now = new Date();
    if (period === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return txs.filter(t => new Date(t.date) >= weekAgo);
    }
    if (period === 'month') {
      return txs.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
    return txs;
  };

  const filtered = filterByPeriod(transactions);
  const expenses = filtered.filter(t => t.type === 'EXPENSE');
  const incomes = filtered.filter(t => t.type === 'INCOME');
  const totalExp = expenses.reduce((s, t) => s + (t.amount || 0), 0);
  const totalInc = incomes.reduce((s, t) => s + (t.amount || 0), 0);
  const savings = totalInc - totalExp;
  const savingsRate = totalInc > 0 ? ((savings / totalInc) * 100).toFixed(1) : 0;

  // Category breakdown
  const catMap = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + (t.amount || 0); });
  const pieData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([cat, amt]) => ({
      name: cat,
      amount: amt,
      pct: totalExp > 0 ? ((amt / totalExp) * 100).toFixed(1) : 0,
      color: CATEGORY_COLORS[cat] || '#ccc',
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    }));

  // Weekly comparison (last 4 weeks)
  const weeklyData = (() => {
    const labels = [], incData = [], expData = [];
    for (let w = 3; w >= 0; w--) {
      const start = new Date(); start.setDate(start.getDate() - w * 7 - 6);
      const end = new Date(); end.setDate(end.getDate() - w * 7);
      labels.push(`W${4 - w}`);
      const wkTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
      incData.push(wkTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0));
      expData.push(wkTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0));
    }
    return { labels, incData, expData };
  })();

  if (loading) return <LoadingSpinner message="Crunching numbers…" />;

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchTransactions(); fetchAiTip(); }}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Insights</Text>
        <TouchableOpacity onPress={fetchAiTip} style={styles.aiRefreshBtn}>
          <Icon name="sparkles-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {error && <ErrorBanner message={error} onRetry={() => { setLoading(true); fetchTransactions(); }} />}

      {/* Period selector */}
      <View style={styles.periodRow}>
        {[['week', 'This Week'], ['month', 'This Month'], ['all', 'All Time']].map(([val, label]) => (
          <TouchableOpacity
            key={val}
            style={[styles.periodPill, period === val && styles.periodPillActive]}
            onPress={() => setPeriod(val)}
          >
            <Text style={[styles.periodText, period === val && styles.periodTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary row */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryTile, { backgroundColor: colors.incomeLight }]}>
          <Icon name="arrow-down-circle" size={20} color={colors.income} />
          <Text style={styles.tileLabel}>Income</Text>
          <Text style={[styles.tileValue, { color: colors.income }]}>₹{totalInc.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.summaryTile, { backgroundColor: colors.expenseLight }]}>
          <Icon name="arrow-up-circle" size={20} color={colors.expense} />
          <Text style={styles.tileLabel}>Spent</Text>
          <Text style={[styles.tileValue, { color: colors.expense }]}>₹{totalExp.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.summaryTile, { backgroundColor: savings >= 0 ? colors.primaryLight : colors.expenseLight }]}>
          <Icon name="wallet" size={20} color={savings >= 0 ? colors.primary : colors.expense} />
          <Text style={styles.tileLabel}>Savings</Text>
          <Text style={[styles.tileValue, { color: savings >= 0 ? colors.primary : colors.expense }]}>
            ₹{Math.abs(savings).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Savings rate */}
      <View style={styles.section}>
        <View style={styles.rateCard}>
          <View>
            <Text style={styles.rateLabel}>Savings Rate</Text>
            <Text style={styles.rateSubtitle}>% of income saved</Text>
          </View>
          <Text style={[styles.ratePct, { color: savingsRate >= 20 ? colors.income : savingsRate >= 10 ? colors.warning : colors.expense }]}>
            {savingsRate}%
          </Text>
        </View>
        <View style={styles.rateTrack}>
          <View style={[styles.rateFill, {
            width: `${Math.min(Math.max(+savingsRate, 0), 100)}%`,
            backgroundColor: savingsRate >= 20 ? colors.income : savingsRate >= 10 ? colors.warning : colors.expense,
          }]} />
        </View>
      </View>

      {/* AI Tip */}
      <View style={styles.section}>
        <AiTipCard tip={aiTip} loading={aiLoading} error={aiError} onRetry={fetchAiTip} />
      </View>

      {/* Category Pie */}
      {pieData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <View style={styles.chartCard}>
            <PieChart
              data={pieData}
              width={width - 40}
              height={180}
              chartConfig={{
                color: () => colors.primary,
                labelColor: () => colors.textSecondary,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute={false}
            />
            {/* Category list */}
            {pieData.map(item => (
              <View key={item.name} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: item.color }]} />
                <Text style={styles.catName}>{item.name}</Text>
                <Text style={styles.catPct}>{item.pct}%</Text>
                <Text style={styles.catAmt}>₹{item.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Weekly bar chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Comparison</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.income }]} /><Text style={styles.legendText}>Income</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.expense }]} /><Text style={styles.legendText}>Expenses</Text></View>
          </View>
          <BarChart
            data={{
              labels: weeklyData.labels,
              datasets: [
                { data: weeklyData.incData.map(v => v || 0), color: () => colors.income },
                { data: weeklyData.expData.map(v => v || 0), color: () => colors.expense },
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
            }}
            style={{ borderRadius: 10, marginLeft: -10 }}
            showValuesOnTopOfBars={false}
          />
        </View>
      </View>

      {/* Transactions count */}
      <View style={styles.section}>
        <View style={styles.txStatsRow}>
          <View style={styles.txStat}>
            <Text style={styles.txStatNum}>{incomes.length}</Text>
            <Text style={styles.txStatLabel}>Income entries</Text>
          </View>
          <View style={styles.txStat}>
            <Text style={styles.txStatNum}>{expenses.length}</Text>
            <Text style={styles.txStatLabel}>Expense entries</Text>
          </View>
          <View style={styles.txStat}>
            <Text style={styles.txStatNum}>{Object.keys(catMap).length}</Text>
            <Text style={styles.txStatLabel}>Categories used</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 18,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  aiRefreshBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  periodRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  periodPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
  },
  periodPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  periodTextActive: { color: '#fff' },
  summaryGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  summaryTile: {
    flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4,
  },
  tileLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  tileValue: { fontSize: 13, fontWeight: '800' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 12 },
  rateCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 8,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  rateLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  rateSubtitle: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', marginTop: 2 },
  ratePct: { fontSize: 28, fontWeight: '900' },
  rateTrack: { height: 8, backgroundColor: colors.borderLight, borderRadius: 8, overflow: 'hidden' },
  rateFill: { height: '100%', borderRadius: 8 },
  aiCard: {
    backgroundColor: colors.card, borderRadius: 18, padding: 18,
    borderWidth: 1.5, borderColor: colors.primaryLight,
    elevation: 3, shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiTitle: { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1 },
  aiBadge: { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  aiBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  aiTip: { fontSize: 14, color: colors.text, lineHeight: 22, fontWeight: '500' },
  aiLoading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiLoadingText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  aiError: { fontSize: 13, color: colors.expense, lineHeight: 20, marginBottom: 10 },
  retryBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start',
  },
  retryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  chartCard: {
    backgroundColor: colors.card, borderRadius: 18, padding: 16,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8,
  },
  catRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  catName: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '600' },
  catPct: { fontSize: 12, color: colors.textSecondary, fontWeight: '700', marginRight: 12 },
  catAmt: { fontSize: 13, fontWeight: '700', color: colors.text },
  chartLegend: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  txStatsRow: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16,
    padding: 16, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  txStat: { flex: 1, alignItems: 'center' },
  txStatNum: { fontSize: 22, fontWeight: '800', color: colors.primary },
  txStatLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginTop: 4, textAlign: 'center' },
});