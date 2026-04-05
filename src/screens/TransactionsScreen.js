/* eslint-disable react-native/no-inline-styles */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { TransactionAPI } from '../api/axiosConfig';
import TransactionItem from '../components/TransactionItem';
import { LoadingSpinner, EmptyState, ErrorBanner } from '../components/UIHelpers';
import { colors, CATEGORIES } from '../theme/colors';

const TYPE_FILTERS = ['ALL', 'INCOME', 'EXPENSE'];

export default function TransactionsScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [catFilter, setCatFilter] = useState('ALL');
  const [showCatMenu, setShowCatMenu] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const res = await TransactionAPI.getAll();
      const sorted = [...(res.data || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(sorted);
    } catch {
      setError('Failed to load transactions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); fetchAll(); }, [fetchAll]));

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (typeFilter !== 'ALL') {
      result = result.filter(t => t.type === typeFilter);
    }
    if (catFilter !== 'ALL') {
      result = result.filter(t => t.category === catFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(t =>
        (t.description || '').toLowerCase().includes(s) ||
        (t.category || '').toLowerCase().includes(s)
      );
    }
    return result;
  }, [transactions, search, typeFilter, catFilter]);

  const onSearchChange = (val) => setSearch(val);
  const onTypeChange = (val) => setTypeFilter(val);
  const onCatChange = (val) => {
    setCatFilter(val);
    setShowCatMenu(false);
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Transaction',
      `Delete "${item.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await TransactionAPI.delete(item.id);
              setTransactions(prev => prev.filter(t => t.id !== item.id));
            } catch {
              Alert.alert('Error', 'Could not delete transaction.');
            }
          },
        },
      ]
    );
  };

  const totalShown = filtered.reduce((s, t) =>
    s + (t.type === 'INCOME' ? t.amount : -t.amount), 0
  );

  if (loading) return <LoadingSpinner message="Loading transactions…" />;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddEditTransaction', {})}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {error && <ErrorBanner message={error} onRetry={() => { setLoading(true); fetchAll(); }} />}

      {/* Search */}
      <View style={styles.searchBox}>
        <Icon name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions…"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={onSearchChange}
        />
        {search ? (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Icon name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Type Filter Pills */}
      <View style={styles.filterRow}>
        {TYPE_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.pill, typeFilter === f && styles.pillActive]}
            onPress={() => onTypeChange(f)}
          >
            <Text style={[styles.pillText, typeFilter === f && styles.pillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}

        {/* Category dropdown trigger */}
        <TouchableOpacity
          style={[styles.pill, catFilter !== 'ALL' && styles.pillActive, { marginLeft: 'auto' }]}
          onPress={() => setShowCatMenu(v => !v)}
        >
          <Text style={[styles.pillText, catFilter !== 'ALL' && styles.pillTextActive]}>
            {catFilter === 'ALL' ? 'Category ▾' : catFilter + ' ▾'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category dropdown */}
      {showCatMenu && (
        <View style={styles.catMenu}>
          {['ALL', ...CATEGORIES].map(cat => (
            <TouchableOpacity key={cat} style={styles.catItem} onPress={() => onCatChange(cat)}>
              <Text style={[styles.catItemText, catFilter === cat && { color: colors.primary, fontWeight: '700' }]}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </Text>
              {catFilter === cat && <Icon name="checkmark" size={16} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <Text style={styles.countText}>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</Text>
        <Text style={[styles.totalText, { color: totalShown >= 0 ? colors.income : colors.expense }]}>
          Net: {totalShown >= 0 ? '+' : ''}₹{Math.abs(totalShown).toLocaleString('en-IN')}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No transactions found"
            subtitle={search || typeFilter !== 'ALL' || catFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Add your first transaction'}
            actionLabel={!search && typeFilter === 'ALL' ? 'Add Transaction' : undefined}
            onAction={() => navigation.navigate('AddEditTransaction', {})}
          />
        }
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            onPress={tx => navigation.navigate('AddEditTransaction', { transaction: tx })}
            onLongPress={handleDelete}
          />
        )}
      />
    </View>
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
    paddingBottom: 18,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  addBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  pillTextActive: { color: '#fff' },
  catMenu: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 99,
  },
  catItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  catItemText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  countText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  totalText: { fontSize: 13, fontWeight: '800' },
  list: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
});