import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import type { BudgetsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getSpentAmountCents, subscribeBudgets } from '../../lib/budgets';
import { formatCents } from '../../lib/money';
import type { Budget } from '../../types/models';
import { Card, colors, EmptyState, LoadingView, ProgressBar, Screen } from '../../components/ui';

type Props = NativeStackScreenProps<BudgetsStackParamList, 'BudgetsList'>;

export default function BudgetsListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { categoriesById, loading: dataLoading } = useData();
  const [month, setMonth] = useState(() => dayjs());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [spentByBudget, setSpentByBudget] = useState<Map<string, number>>(new Map());

  const monthKey = month.format('YYYY-MM');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeBudgets(
      user.uid,
      monthKey,
      (list) => {
        setBudgets(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user, monthKey]);

  useEffect(() => {
    if (!user || budgets.length === 0) {
      setSpentByBudget(new Map());
      return;
    }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        budgets.map(async (b) => [b.id, await getSpentAmountCents(user.uid, monthKey, b.categoryId)] as const)
      );
      if (!cancelled) setSpentByBudget(new Map(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [user, budgets, monthKey]);

  if (dataLoading) return <LoadingView />;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.monthNav}>
          <Text style={styles.navArrow} onPress={() => setMonth((m) => m.subtract(1, 'month'))}>‹</Text>
          <Text style={styles.monthLabel}>{month.format('MMMM YYYY')}</Text>
          <Text style={styles.navArrow} onPress={() => setMonth((m) => m.add(1, 'month'))}>›</Text>
        </View>
      </View>

      {loading ? (
        <LoadingView />
      ) : budgets.length === 0 ? (
        <EmptyState message="ยังไม่มีงบประมาณสำหรับเดือนนี้" />
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const spent = spentByBudget.get(item.id) ?? 0;
            const category = item.categoryId ? categoriesById.get(item.categoryId) : undefined;
            const ratio = item.amountCents > 0 ? spent / item.amountCents : 0;
            const barColor = ratio >= 1 ? colors.danger : ratio >= 0.8 ? '#f59e0b' : colors.primary;
            return (
              <Pressable
                onPress={() => navigation.navigate('BudgetForm', { budgetId: item.id, categoryId: item.categoryId })}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {category ? `${category.icon} ${category.name}` : '💰 งบรวมทุกหมวดหมู่'}
                  </Text>
                  <Text style={[styles.cardAmount, ratio >= 1 && { color: colors.danger }]}>
                    {formatCents(spent)} / {formatCents(item.amountCents)}
                  </Text>
                </View>
                <ProgressBar ratio={ratio} color={barColor} />
                {ratio >= 1 ? (
                  <Text style={styles.warningText}>⚠️ ใช้เกินงบที่ตั้งไว้แล้ว</Text>
                ) : ratio >= 0.8 ? (
                  <Text style={styles.warningTextSoft}>ใกล้เต็มงบประมาณแล้ว ({Math.round(ratio * 100)}%)</Text>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('BudgetForm', { categoryId: null })}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 12, paddingBottom: 4 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  navArrow: { fontSize: 26, color: colors.primary, fontWeight: '700', paddingHorizontal: 12 },
  monthLabel: { fontSize: 17, fontWeight: '700', color: colors.text, minWidth: 140, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardAmount: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  warningText: { color: colors.danger, fontSize: 12, fontWeight: '600', marginTop: 8 },
  warningTextSoft: { color: '#b45309', fontSize: 12, fontWeight: '600', marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 32, marginTop: -2 },
});
