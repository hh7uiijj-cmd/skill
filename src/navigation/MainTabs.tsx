import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  AccountsStackParamList,
  BudgetsStackParamList,
  DebtsStackParamList,
  MainTabParamList,
  SettingsStackParamList,
  TransactionsStackParamList,
} from './types';
import { colors } from '../components/ui';

import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import TransactionsListScreen from '../screens/Transactions/TransactionsListScreen';
import TransactionFormScreen from '../screens/Transactions/TransactionFormScreen';
import BudgetsListScreen from '../screens/Budgets/BudgetsListScreen';
import BudgetFormScreen from '../screens/Budgets/BudgetFormScreen';
import DebtsListScreen from '../screens/Debts/DebtsListScreen';
import DebtFormScreen from '../screens/Debts/DebtFormScreen';
import AccountsListScreen from '../screens/Accounts/AccountsListScreen';
import AccountFormScreen from '../screens/Accounts/AccountFormScreen';
import TransferFormScreen from '../screens/Accounts/TransferFormScreen';
import SettingsHomeScreen from '../screens/Settings/SettingsHomeScreen';
import CategoriesListScreen from '../screens/Settings/CategoriesListScreen';
import CategoryFormScreen from '../screens/Settings/CategoryFormScreen';
import ExportScreen from '../screens/Settings/ExportScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const TransactionsStack = createNativeStackNavigator<TransactionsStackParamList>();
const AccountsStack = createNativeStackNavigator<AccountsStackParamList>();
const BudgetsStack = createNativeStackNavigator<BudgetsStackParamList>();
const DebtsStack = createNativeStackNavigator<DebtsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function TransactionsNavigator() {
  return (
    <TransactionsStack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <TransactionsStack.Screen name="TransactionsList" component={TransactionsListScreen} options={{ title: 'ธุรกรรม' }} />
      <TransactionsStack.Screen name="TransactionForm" component={TransactionFormScreen} options={{ title: 'บันทึกธุรกรรม' }} />
    </TransactionsStack.Navigator>
  );
}

function AccountsNavigator() {
  return (
    <AccountsStack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <AccountsStack.Screen name="AccountsList" component={AccountsListScreen} options={{ title: 'บัญชี' }} />
      <AccountsStack.Screen name="AccountForm" component={AccountFormScreen} options={{ title: 'บัญชี' }} />
      <AccountsStack.Screen name="TransferForm" component={TransferFormScreen} options={{ title: 'โอนเงิน' }} />
    </AccountsStack.Navigator>
  );
}

function BudgetsNavigator() {
  return (
    <BudgetsStack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <BudgetsStack.Screen name="BudgetsList" component={BudgetsListScreen} options={{ title: 'งบประมาณ' }} />
      <BudgetsStack.Screen name="BudgetForm" component={BudgetFormScreen} options={{ title: 'ตั้งงบประมาณ' }} />
    </BudgetsStack.Navigator>
  );
}

function DebtsNavigator() {
  return (
    <DebtsStack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <DebtsStack.Screen name="DebtsList" component={DebtsListScreen} options={{ title: 'หนี้ที่ต้องจ่าย' }} />
      <DebtsStack.Screen name="DebtForm" component={DebtFormScreen} options={{ title: 'รายการหนี้' }} />
    </DebtsStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsHomeScreen} options={{ title: 'ตั้งค่า' }} />
      <SettingsStack.Screen name="CategoriesList" component={CategoriesListScreen} options={{ title: 'หมวดหมู่' }} />
      <SettingsStack.Screen name="CategoryForm" component={CategoryFormScreen} options={{ title: 'หมวดหมู่' }} />
      <SettingsStack.Screen name="ExportScreen" component={ExportScreen} options={{ title: 'ส่งออกรายงาน' }} />
    </SettingsStack.Navigator>
  );
}

const ICONS: Record<keyof MainTabParamList, string> = {
  DashboardTab: '📊',
  TransactionsTab: '📝',
  BudgetsTab: '🎯',
  DebtsTab: '📋',
  AccountsTab: '👛',
  SettingsTab: '⚙️',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONS[route.name as keyof MainTabParamList]}</Text>,
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ title: 'ภาพรวม' }} />
      <Tab.Screen name="TransactionsTab" component={TransactionsNavigator} options={{ title: 'ธุรกรรม' }} />
      <Tab.Screen name="BudgetsTab" component={BudgetsNavigator} options={{ title: 'งบประมาณ' }} />
      <Tab.Screen name="DebtsTab" component={DebtsNavigator} options={{ title: 'หนี้' }} />
      <Tab.Screen name="AccountsTab" component={AccountsNavigator} options={{ title: 'บัญชี' }} />
      <Tab.Screen name="SettingsTab" component={SettingsNavigator} options={{ title: 'ตั้งค่า' }} />
    </Tab.Navigator>
  );
}
