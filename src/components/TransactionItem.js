import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, CATEGORY_ICONS, CATEGORY_COLORS } from '../theme/colors';

export default function TransactionItem({ item, onPress, onLongPress }) {
  const isIncome = item.type === 'INCOME';
  const icon = CATEGORY_ICONS[item.category] || 'cash-outline';
  const catColor = CATEGORY_COLORS[item.category] || colors.textSecondary;
  const dateStr = item.date
    ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : '';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(item)}
      onLongPress={() => onLongPress?.(item)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: catColor + '18' }]}>
        <Icon name={icon} size={20} color={catColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>{item.description || 'No description'}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.catBadge, { backgroundColor: catColor + '18' }]}>
            <Text style={[styles.catText, { color: catColor }]}>{item.category}</Text>
          </View>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>
        {isIncome ? '+' : '-'}₹{(item.amount ?? 0).toLocaleString('en-IN')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1, marginRight: 8 },
  description: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 5,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  catText: { fontSize: 11, fontWeight: '700' },
  dateText: { fontSize: 11, color: colors.textSecondary },
  amount: { fontSize: 15, fontWeight: '800' },
});