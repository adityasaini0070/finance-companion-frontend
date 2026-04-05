import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme/colors';

export default function SummaryCard({ title, amount, icon, iconColor, bgColor, small }) {
  const formatted = `₹${Math.abs(amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  return (
    <View style={[styles.card, small && styles.cardSmall, { backgroundColor: bgColor || colors.card }]}>
      <View style={[styles.iconBox, { backgroundColor: iconColor + '25' }]}>
        <Icon name={icon} size={small ? 16 : 20} color={iconColor} />
      </View>
      <Text style={[styles.title, small && styles.titleSmall]}>{title}</Text>
      <Text style={[styles.amount, small && styles.amountSmall, { color: iconColor }]}>{formatted}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 5,
    elevation: 4,
    shadowColor: '#5B4FE9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardSmall: { borderRadius: 14, padding: 12 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  titleSmall: { fontSize: 10 },
  amount: { fontSize: 17, fontWeight: '800' },
  amountSmall: { fontSize: 14 },
});