import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import type { TransactionsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { subscribeTransactions } from '../../lib/transactions';
import { formatCents } from '../../lib/money';
import type { Transaction } from '../../types/models';
import { ChipRow, colors, EmptyState, FormInput, LoadingView, Screen } from '../../components/ui';

type Props = NativeStackScreenProps<TransactionsStackParamList, 'TransactionsList'>;

export default function TransactionsListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { accounts, categories, accountsById, categoriesById, loading: dataLoading } = useData();

  const [month, setMonth] = useState(() => dayjs());
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeTransactions(
      user.uid,
      {
        startDate: month.startOf('month').toDate(),
        endDate: month.endOf('month').toDate(),
        categoryId: categoryFilter ?? undefined,
        accountId: accountFilter ?? undefined,
      },
      (list) => {
        setTransactions(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user, month, categoryFilter, accountFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) => (t.note ?? '').toLowerCase().includes(q));
  }, [transactions, search]);

  const sections = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    filtered.forEach((t) => {
      const key = dayjs(t.date.toDate()).format('YYYY-MM-DD');
      groups.set(key, [...(groups.get(key) ?? []), t]);
    });
    return [...groups.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({ title: date, data }));
  }, [filtered]);

  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((t) => {
      if (t.type === 'income') income += t.amountCents;
      else if (t.type === 'expense') expense += t.amountCents;
    });
    return { income, expense };
  }, [filtered]);

  if (dataLoading) return <LoadingView />;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.monthNav}>
          <Pressable onPress={() => setMonth((m) => m.subtract(1, 'month'))} hitSlop={12}>
            <Text style={styles.navArrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{month.format('MMMM YYYY')}</Text>
          <Pressable onPress={() => setMonth((m) => m.add(1, 'month'))} hitSlop={12}>
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: colors.income }]}>รับ {formatCents(monthSummary.income)}</Text>
          <Text style={[styles.summaryText, { color: colors.expense }]}>จ่าย {formatCents(monthSummary.expense)}</Text>
        </View>

        <FormInput placeholder="ค้นหาโน้ต..." value={search} onChangeText={setSearch} style={{ marginTop: 12 }} />

        <ChipRow
          options={[{ label: 'ทุกบัญชี', value: '' }, ...accounts.map((a) => ({ label: a.name, value: a.id }))]}
          value={accountFilter ?? ''}
          onChange={(v) => setAccountFilter(v || null)}
        />
        <ChipRow
          options={[{ label: 'ทุกหมวดหมู่', value: '' }, ...categories.map((c) => ({ label: `${c.icon} ${c.name}`, value: c.id }))]}
          value={categoryFilter ?? ''}
          onChange={(v) => setCategoryFilter(v || null)}
        />
      </View>

      {loading ? (
        <LoadingView />
      ) : sections.length === 0 ? (
        <EmptyState message="ยังไม่มีธุรกรรมในเดือนนี้" />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{dayjs(section.title).format('ddd D MMM YYYY')}</Text>
          )}
          renderItem={({ item }) => (
            <TransactionRow
              transaction={item}
              categoryName={item.categoryId ? categoriesById.get(item.categoryId)?.name : undefined}
              categoryIcon={item.categoryId ? categoriesById.get(item.categoryId)?.icon : undefined}
              accountName={accountsById.get(item.accountId)?.name}
              toAccountName={item.toAccountId ? accountsById.get(item.toAccountId)?.name : undefined}
              onPress={() => navigation.navigate('TransactionForm', { transactionId: item.id })}
            />
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={() => navigation.navigate('TransactionForm', undefined)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </Screen>
  );
}

function TransactionRow({
  transaction,
  categoryName,
  categoryIcon,
  accountName,
  toAccountName,
  onPress,
}: {
  transaction: Transaction;
  categoryName?: string;
  categoryIcon?: string;
  accountName?: string;
  toAccountName?: string;
  onPress: () => void;
}) {
  const isTransfer = transaction.type === 'transfer';
  const amountColor = isTransfer ? colors.text : transaction.type === 'income' ? colors.income : colors.expense;
  const sign = transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '';
  const title = isTransfer ? `โอนเงิน: ${accountName} → ${toAccountName}` : categoryName ?? 'ไม่มีหมวดหมู่';

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowIcon}>
        <Text style={{ fontSize: 20 }}>{isTransfer ? '🔁' : categoryIcon ?? '📦'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>
          {isTransfer ? '' : accountName}
          {transaction.note ? `${isTransfer ? '' : ' · '}${transaction.note}` : ''}
        </Text>
      </View>
      <Text style={[styles.rowAmount, { color: amountColor }]}>
        {sign}
        {formatCents(transaction.amountCents, transaction.currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  navArrow: { fontSize: 26, color: colors.primary, fontWeight: '700', paddingHorizontal: 12 },
  monthLabel: { fontSize: 17, fontWeight: '700', color: colors.text, minWidth: 140, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 4 },
  summaryText: { fontSize: 13, fontWeight: '600' },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: '700' },
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 32, marginTop: -2 },
});
