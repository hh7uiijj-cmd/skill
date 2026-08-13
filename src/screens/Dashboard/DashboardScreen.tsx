import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getCategoryBreakdown, getPeriodSummary, getTrend, type PeriodSummary, type TrendPoint } from '../../lib/reports';
import { formatCents } from '../../lib/money';
import { Card, colors, LoadingView, Screen, SegmentedControl } from '../../components/ui';

type Period = 'month' | 'year';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { user } = useAuth();
  const { categoriesById, loading: dataLoading } = useData();
  const [period, setPeriod] = useState<Period>('month');
  const [summary, setSummary] = useState<PeriodSummary>({ incomeCents: 0, expenseCents: 0, netCents: 0 });
  const [breakdown, setBreakdown] = useState<{ categoryId: string; totalCents: number }[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    const now = dayjs();
    if (period === 'month') {
      return { start: now.startOf('month').toDate(), end: now.endOf('month').toDate(), granularity: 'day' as const };
    }
    return { start: now.startOf('year').toDate(), end: now.endOf('year').toDate(), granularity: 'month' as const };
  }, [period]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [s, b, t] = await Promise.all([
        getPeriodSummary(user.uid, range.start, range.end),
        getCategoryBreakdown(user.uid, range.start, range.end, 'expense'),
        getTrend(user.uid, range.start, range.end, range.granularity),
      ]);
      if (cancelled) return;
      setSummary(s);
      setBreakdown(b);
      setTrend(t);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, range]);

  if (dataLoading) return <LoadingView />;

  const pieData = breakdown.slice(0, 6).map((item) => {
    const category = categoriesById.get(item.categoryId);
    return {
      name: category?.name ?? 'อื่นๆ',
      amount: item.totalCents / 100,
      color: category?.color ?? '#94a3b8',
      legendFontColor: colors.text,
      legendFontSize: 12,
    };
  });

  const lineLabels = trend.map((p) =>
    range.granularity === 'day' ? dayjs(p.label).format('D') : dayjs(p.label).format('MMM')
  );
  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
    labelColor: () => colors.textMuted,
    decimalPlaces: 0,
    propsForDots: { r: '3' },
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <SegmentedControl
          options={[
            { label: 'รายเดือน', value: 'month' },
            { label: 'รายปี', value: 'year' },
          ]}
          value={period}
          onChange={setPeriod}
        />

        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>รายรับ</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>{formatCents(summary.incomeCents)}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>รายจ่าย</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>{formatCents(summary.expenseCents)}</Text>
          </Card>
        </View>
        <Card style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={styles.summaryLabel}>คงเหลือสุทธิ</Text>
          <Text style={[styles.netValue, { color: summary.netCents >= 0 ? colors.income : colors.expense }]}>
            {formatCents(summary.netCents)}
          </Text>
        </Card>

        {loading ? (
          <LoadingView />
        ) : (
          <>
            <Text style={styles.sectionTitle}>สัดส่วนรายจ่ายตามหมวดหมู่</Text>
            {pieData.length === 0 ? (
              <Card>
                <Text style={{ color: colors.textMuted, textAlign: 'center' }}>ยังไม่มีรายจ่ายในช่วงนี้</Text>
              </Card>
            ) : (
              <PieChart
                data={pieData}
                width={screenWidth - 32}
                height={200}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="8"
              />
            )}

            <Text style={styles.sectionTitle}>แนวโน้มรายรับ–รายจ่าย</Text>
            {trend.length === 0 ? (
              <Card>
                <Text style={{ color: colors.textMuted, textAlign: 'center' }}>ยังไม่มีข้อมูล</Text>
              </Card>
            ) : (
              <LineChart
                data={{
                  labels: lineLabels,
                  datasets: [
                    { data: trend.map((p) => p.incomeCents / 100), color: () => colors.income },
                    { data: trend.map((p) => p.expenseCents / 100), color: () => colors.expense },
                  ],
                  legend: ['รายรับ', 'รายจ่าย'],
                }}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 12 }}
              />
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  summaryCard: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  summaryValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  netValue: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 10 },
});
