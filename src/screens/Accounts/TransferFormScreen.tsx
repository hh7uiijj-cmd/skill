import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createTransaction } from '../../lib/transactions';
import { parseAmountToCents } from '../../lib/money';
import { ChipRow, ErrorText, FormInput, FormLabel, PrimaryButton, Screen } from '../../components/ui';

type Props = NativeStackScreenProps<AccountsStackParamList, 'TransferForm'>;

export default function TransferFormScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { accounts } = useData();

  const [fromId, setFromId] = useState<string | null>(accounts[0]?.id ?? null);
  const [toId, setToId] = useState<string | null>(accounts[1]?.id ?? null);
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    if (!user) return;
    setError(null);
    const amountCents = parseAmountToCents(amountText);
    if (!amountCents) {
      setError('กรุณาระบุจำนวนเงินให้ถูกต้อง');
      return;
    }
    if (!fromId || !toId) {
      setError('กรุณาเลือกบัญชีต้นทางและปลายทาง');
      return;
    }
    if (fromId === toId) {
      setError('บัญชีต้นทางและปลายทางต้องไม่ใช่บัญชีเดียวกัน');
      return;
    }

    setLoading(true);
    try {
      const fromAccount = accounts.find((a) => a.id === fromId)!;
      await createTransaction(user.uid, {
        type: 'transfer',
        amountCents,
        currency: fromAccount.currency,
        date: new Date(),
        accountId: fromId,
        toAccountId: toId,
        note,
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โอนเงินไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <FormLabel>จำนวนเงิน (บาท)</FormLabel>
        <FormInput value={amountText} onChangeText={setAmountText} keyboardType="decimal-pad" placeholder="0.00" />

        <FormLabel>จากบัญชี</FormLabel>
        <ChipRow options={accounts.map((a) => ({ label: `${a.icon} ${a.name}`, value: a.id }))} value={fromId} onChange={setFromId} />

        <FormLabel>ไปยังบัญชี</FormLabel>
        <ChipRow
          options={accounts.filter((a) => a.id !== fromId).map((a) => ({ label: `${a.icon} ${a.name}`, value: a.id }))}
          value={toId}
          onChange={setToId}
        />

        <FormLabel>โน้ต</FormLabel>
        <FormInput value={note} onChangeText={setNote} placeholder="ไม่บังคับ" />

        <ErrorText message={error} />

        <View style={{ marginTop: 24 }}>
          <PrimaryButton title="โอนเงิน" onPress={onSave} loading={loading} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
});
