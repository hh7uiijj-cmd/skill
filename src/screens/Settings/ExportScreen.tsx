import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { fetchTransactionsOnce } from '../../lib/transactions';
import { exportTransactionsToCsv, exportTransactionsToPdf } from '../../lib/exportReport';
import { colors, ErrorText, PrimaryButton, Screen } from '../../components/ui';

export default function ExportScreen() {
  const { user } = useAuth();
  const { categoriesById, accountsById } = useData();
  const [month, setMonth] = useState(() => dayjs());
  const [loading, setLoading] = useState<'csv' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onExport = async (kind: 'csv' | 'pdf') => {
    if (!user) return;
    setError(null);
    setLoading(kind);
    try {
      const transactions = await fetchTransactionsOnce(user.uid, {
        startDate: month.startOf('month').toDate(),
        endDate: month.endOf('month').toDate(),
      });
      if (kind === 'csv') {
        await exportTransactionsToCsv(transactions, categoriesById, accountsById);
      } else {
        await exportTransactionsToPdf(
          transactions,
          categoriesById,
          accountsById,
          `รายงานธุรกรรม ${month.format('MMMM YYYY')}`
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ส่งออกไม่สำเร็จ');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>เลือกเดือนที่ต้องการส่งออก</Text>
        <View style={styles.monthNav}>
          <Text style={styles.navArrow} onPress={() => setMonth((m) => m.subtract(1, 'month'))}>‹</Text>
          <Text style={styles.monthLabel}>{month.format('MMMM YYYY')}</Text>
          <Text style={styles.navArrow} onPress={() => setMonth((m) => m.add(1, 'month'))}>›</Text>
        </View>

        <ErrorText message={error} />

        <View style={{ marginTop: 24, gap: 12 }}>
          <PrimaryButton title="ส่งออกเป็น CSV / Excel" onPress={() => onExport('csv')} loading={loading === 'csv'} />
          <PrimaryButton title="ส่งออกเป็น PDF" onPress={() => onExport('pdf')} loading={loading === 'pdf'} variant="secondary" />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 12 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  navArrow: { fontSize: 26, color: colors.primary, fontWeight: '700', paddingHorizontal: 12 },
  monthLabel: { fontSize: 17, fontWeight: '700', color: colors.text, minWidth: 140, textAlign: 'center' },
});
