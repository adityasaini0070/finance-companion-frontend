import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AddEditTransactionScreen from '../screens/AddEditTransactionScreen';
import GoalScreen from '../screens/GoalScreen';
import InsightsScreen from '../screens/InsightScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const TxStack = createNativeStackNavigator();

function TransactionStack() {
  return (
    <TxStack.Navigator screenOptions={{ headerShown: false }}>
      <TxStack.Screen name="TransactionsList" component={TransactionsScreen} />
      <TxStack.Screen name="AddEditTransaction" component={AddEditTransactionScreen} />
    </TxStack.Navigator>
  );
}

const TAB_ICONS = {
  Home:         ['home',        'home-outline'],
  Transactions: ['wallet',      'wallet-outline'],
  Goals:        ['trophy',      'trophy-outline'],
  Insights:     ['bulb',        'bulb-outline'],
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 66,
          elevation: 12,
          shadowColor: '#5B4FE9',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 0 },
        tabBarIcon: ({ focused, color }) => {
          const [active, inactive] = TAB_ICONS[route.name] || ['apps', 'apps-outline'];
          return <Icon name={focused ? active : inactive} size={23} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Transactions" component={TransactionStack} />
      <Tab.Screen name="Goals" component={GoalScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
    </Tab.Navigator>
  );
}