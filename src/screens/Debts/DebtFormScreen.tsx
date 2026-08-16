import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getDoc } from 'firebase/firestore';
import type { DebtsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { debtDocRef } from '../../lib/paths';
import { createDebt, deleteDebt, updateDebt } from '../../lib/debts';
import { parseAmountToCents } from '../../lib/money';
import type { Debt } from '../../types/models';
import { DateTimeField } from '../../components/DateTimeField';
import { ChipRow, colors, ErrorText, FormInput, FormLabel, PrimaryButton, Screen } from '../../components/ui';

type Props = NativeStackScreenProps<DebtsStackParamList, 'DebtForm'>;

export default function DebtFormScreen({ route, navigation }: Props) {
  const { debtId } = route.params ?? {};
  const isEditing = !!debtId;
  const { user } = useAuth();
  const { accounts, categories } = useData();
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'pending' | 'paid'>('pending');
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
    if (!categoryId && expenseCategories.length > 0) setCategoryId(expenseCategories[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, categories]);

  useEffect(() => {
    if (!user || !debtId) return;
    (async () => {
      const snap = await getDoc(debtDocRef(user.uid, debtId));
      if (snap.exists()) {
        const d = snap.data() as Debt;
        setName(d.name);
        setAmountText((d.amountCents / 100).toFixed(2));
        setDueDate(d.dueDate.toDate());
        setCategoryId(d.categoryId);
        setAccountId(d.accountId);
        setNote(d.note ?? '');
        setStatus(d.status);
      }
      setLoadingExisting(false);
    })();
  }, [user, debtId]);

  const isPaid = status === 'paid';

  const onSave = async () => {
    if (!user) return;
    setError(null);
    const amountCents = parseAmountToCents(amountText);
    if (!amountCents) {
      setError('กรุณาระบุจำนวนเงินให้ถูกต้อง');
      return;
    }
    if (!categoryId || !accountId) {
      setError('กรุณาเลือกหมวดหมู่และบัญชี');
      return;
    }

    setLoading(true);
    try {
      const input = { name, amountCents, dueDate, categoryId, accountId, note };
      if (isEditing && debtId) {
        await updateDebt(user.uid, debtId, input);
      } else {
        await createDebt(user.uid, input);
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = () => {
    if (!user || !debtId) return;
    Alert.alert(
      'ลบรายการหนี้',
      isPaid ? 'รายการนี้จ่ายไปแล้ว การลบจะย้อนรายจ่ายที่บันทึกไว้และคืนยอดเงินเข้าบัญชีด้วย' : 'ต้องการลบรายการนี้หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteDebt(user.uid, debtId);
              navigation.goBack();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loadingExisting) return null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        {isPaid && (
          <Text style={styles.paidNotice}>
            รายการนี้จ่ายแล้ว แก้ไขจำนวนเงิน/หมวดหมู่/บัญชีไม่ได้ (ลบได้ถ้าต้องการย้อนกลับ)
          </Text>
        )}

        <FormLabel>ชื่อรายการ</FormLabel>
        <FormInput value={name} onChangeText={setName} placeholder="เช่น ค่าไฟ, ค่าบัตรเครดิต" editable={!isPaid} />

        <FormLabel>จำนวนเงิน (บาท)</FormLabel>
        <FormInput
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
          placeholder="0.00"
          editable={!isPaid}
        />

        <FormLabel>วันครบกำหนด</FormLabel>
        <DateTimeField value={dueDate} onChange={setDueDate} />

        <FormLabel>หมวดหมู่ (สำหรับตอนบันทึกเป็นรายจ่าย)</FormLabel>
        <ChipRow
          options={expenseCategories.map((c) => ({ label: `${c.icon} ${c.name}`, value: c.id, color: c.color }))}
          value={categoryId}
          onChange={isPaid ? () => {} : setCategoryId}
        />

        <FormLabel>บัญชีที่จะจ่าย</FormLabel>
        <ChipRow
          options={accounts.map((a) => ({ label: `${a.icon} ${a.name}`, value: a.id }))}
          value={accountId}
          onChange={isPaid ? () => {} : setAccountId}
        />

        <FormLabel>โน้ต</FormLabel>
        <FormInput value={note} onChangeText={setNote} placeholder="ไม่บังคับ" editable={!isPaid} />

        <ErrorText message={error} />

        <View style={{ marginTop: 24, gap: 12 }}>
          {!isPaid && (
            <PrimaryButton title={isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มรายการหนี้'} onPress={onSave} loading={loading} />
          )}
          {isEditing && <PrimaryButton title="ลบรายการ" onPress={onDelete} variant="danger" loading={loading && isPaid} />}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  paidNotice: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: 12,
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 8,
  },
});
