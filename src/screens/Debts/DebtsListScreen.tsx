import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import type { DebtsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { markDebtPaid, markDebtUnpaid, subscribeDebts } from '../../lib/debts';
import { formatCents } from '../../lib/money';
import type { Debt } from '../../types/models';
import { colors, EmptyState, LoadingView, Screen } from '../../components/ui';

type Props = NativeStackScreenProps<DebtsStackParamList, 'DebtsList'>;

export default function DebtsListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { categoriesById, accountsById, loading: dataLoading } = useData();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeDebts(
      user.uid,
      (list) => {
        setDebts(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user]);

  const sections = useMemo(() => {
    const pending = debts.filter((d) => d.status === 'pending');
    const paid = debts
      .filter((d) => d.status === 'paid')
      .sort((a, b) => (b.paidAt?.toMillis() ?? 0) - (a.paidAt?.toMillis() ?? 0));
    const result = [];
    if (pending.length > 0) result.push({ title: 'ยังไม่จ่าย', data: pending });
    if (paid.length > 0) result.push({ title: 'จ่ายแล้ว', data: paid });
    return result;
  }, [debts]);

  const pendingTotal = useMemo(
    () => debts.filter((d) => d.status === 'pending').reduce((sum, d) => sum + d.amountCents, 0),
    [debts]
  );

  const onTogglePaid = (debt: Debt) => {
    if (!user) return;
    if (debt.status === 'pending') {
      Alert.alert(
        'ยืนยันการจ่าย',
        `บันทึก "${debt.name}" จำนวน ${formatCents(debt.amountCents)} เป็นรายจ่ายจากบัญชี ${accountsById.get(debt.accountId)?.name ?? '-'}?`,
        [
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'ยืนยัน',
            onPress: async () => {
              setBusyId(debt.id);
              try {
                await markDebtPaid(user.uid, debt.id);
              } catch (e) {
                Alert.alert('ทำรายการไม่สำเร็จ', e instanceof Error ? e.message : String(e));
              } finally {
                setBusyId(null);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert('ยกเลิกการจ่าย', `ยกเลิกสถานะจ่ายแล้วของ "${debt.name}" และย้อนรายจ่ายที่บันทึกไว้?`, [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ยืนยัน',
          style: 'destructive',
          onPress: async () => {
            setBusyId(debt.id);
            try {
              await markDebtUnpaid(user.uid, debt.id);
            } catch (e) {
              Alert.alert('ทำรายการไม่สำเร็จ', e instanceof Error ? e.message : String(e));
            } finally {
              setBusyId(null);
            }
          },
        },
      ]);
    }
  };

  if (dataLoading || loading) return <LoadingView />;

  return (
    <Screen>
      {pendingTotal > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>ยอดรวมที่ยังไม่จ่าย</Text>
          <Text style={styles.summaryAmount}>{formatCents(pendingTotal)}</Text>
        </View>
      )}

      {sections.length === 0 ? (
        <EmptyState message="ยังไม่มีรายการหนี้ที่ต้องจ่าย" />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
          renderItem={({ item }) => (
            <DebtRow
              debt={item}
              categoryName={categoriesById.get(item.categoryId)?.name}
              categoryIcon={categoriesById.get(item.categoryId)?.icon}
              accountName={accountsById.get(item.accountId)?.name}
              busy={busyId === item.id}
              onTogglePaid={() => onTogglePaid(item)}
              onPress={() => navigation.navigate('DebtForm', { debtId: item.id })}
            />
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={() => navigation.navigate('DebtForm', undefined)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </Screen>
  );
}

function DebtRow({
  debt,
  categoryName,
  categoryIcon,
  accountName,
  busy,
  onTogglePaid,
  onPress,
}: {
  debt: Debt;
  categoryName?: string;
  categoryIcon?: string;
  accountName?: string;
  busy: boolean;
  onTogglePaid: () => void;
  onPress: () => void;
}) {
  const isPaid = debt.status === 'paid';
  const isOverdue = !isPaid && debt.dueDate.toDate() < dayjs().startOf('day').toDate();

  return (
    <View style={[styles.row, isPaid && styles.rowPaid]}>
      <Pressable onPress={onTogglePaid} disabled={busy} style={styles.checkbox} hitSlop={8}>
        <Text style={styles.checkboxText}>{isPaid ? '✅' : '⬜'}</Text>
      </Pressable>
      <Pressable onPress={onPress} style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, isPaid && styles.rowTitlePaid]}>
          {categoryIcon} {debt.name}
        </Text>
        <Text style={[styles.rowSubtitle, isOverdue && styles.overdueText]}>
          {isPaid
            ? `จ่ายจาก ${accountName ?? '-'}`
            : `กำหนด ${dayjs(debt.dueDate.toDate()).format('D MMM YYYY')} · ${categoryName ?? '-'}${isOverdue ? ' · เลยกำหนดแล้ว' : ''}`}
        </Text>
      </Pressable>
      <Text style={[styles.rowAmount, isPaid && styles.rowTitlePaid]}>{formatCents(debt.amountCents)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
  },
  summaryLabel: { color: '#e0f2f1', fontSize: 13, fontWeight: '600' },
  summaryAmount: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 6,
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
    gap: 10,
  },
  rowPaid: { opacity: 0.6 },
  checkbox: { padding: 4 },
  checkboxText: { fontSize: 22 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowTitlePaid: { textDecorationLine: 'line-through' },
  rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  overdueText: { color: colors.danger, fontWeight: '600' },
  rowAmount: { fontSize: 15, fontWeight: '700', color: colors.text },
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
