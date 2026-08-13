import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import type { BudgetsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createBudget, deleteBudget, updateBudget } from '../../lib/budgets';
import { parseAmountToCents } from '../../lib/money';
import { ChipRow, ErrorText, FormInput, FormLabel, PrimaryButton, Screen } from '../../components/ui';

type Props = NativeStackScreenProps<BudgetsStackParamList, 'BudgetForm'>;

export default function BudgetFormScreen({ route, navigation }: Props) {
  const { budgetId, categoryId: initialCategoryId } = route.params ?? {};
  const isEditing = !!budgetId;
  const { user } = useAuth();
  const { categories } = useData();
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId ?? null);
  const [amountText, setAmountText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const monthKey = dayjs().format('YYYY-MM');

  useEffect(() => {
    setCategoryId(initialCategoryId ?? null);
  }, [initialCategoryId]);

  const onSave = async () => {
    if (!user) return;
    setError(null);
    const amountCents = parseAmountToCents(amountText);
    if (!amountCents) {
      setError('กรุณาระบุจำนวนงบประมาณให้ถูกต้อง');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && budgetId) {
        await updateBudget(user.uid, budgetId, amountCents);
      } else {
        await createBudget(user.uid, { categoryId, amountCents, monthKey });
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = () => {
    if (!user || !budgetId) return;
    Alert.alert('ลบงบประมาณ', 'ต้องการลบงบประมาณนี้หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          await deleteBudget(user.uid, budgetId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        {!isEditing && (
          <>
            <FormLabel>หมวดหมู่</FormLabel>
            <ChipRow
              options={[
                { label: '💰 งบรวมทุกหมวดหมู่', value: '' },
                ...expenseCategories.map((c) => ({ label: `${c.icon} ${c.name}`, value: c.id })),
              ]}
              value={categoryId ?? ''}
              onChange={(v) => setCategoryId(v || null)}
            />
          </>
        )}

        <FormLabel>งบประมาณต่อเดือน (บาท)</FormLabel>
        <FormInput value={amountText} onChangeText={setAmountText} keyboardType="decimal-pad" placeholder="0.00" />

        <ErrorText message={error} />

        <View style={{ marginTop: 24, gap: 12 }}>
          <PrimaryButton title={isEditing ? 'บันทึกการแก้ไข' : 'ตั้งงบประมาณ'} onPress={onSave} loading={loading} />
          {isEditing && <PrimaryButton title="ลบงบประมาณ" onPress={onDelete} variant="danger" />}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
});
