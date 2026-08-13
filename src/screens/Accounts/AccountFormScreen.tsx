import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { archiveAccount, createAccount, updateAccount } from '../../lib/accounts';
import { parseAmountToCents } from '../../lib/money';
import type { AccountType } from '../../types/models';
import { ChipRow, ErrorText, FormInput, FormLabel, PrimaryButton, Screen } from '../../components/ui';

type Props = NativeStackScreenProps<AccountsStackParamList, 'AccountForm'>;

const TYPE_OPTIONS: { label: string; value: AccountType }[] = [
  { label: 'เงินสด', value: 'cash' },
  { label: 'บัญชีธนาคาร', value: 'bank' },
  { label: 'บัตรเครดิต', value: 'credit_card' },
  { label: 'e-Wallet', value: 'e_wallet' },
];

const ICONS = ['💵', '🏦', '💳', '📱', '🐷', '👛', '💼'];
const COLORS = ['#0d9488', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#65a30d', '#0891b2'];

export default function AccountFormScreen({ route, navigation }: Props) {
  const { accountId } = route.params ?? {};
  const isEditing = !!accountId;
  const { user } = useAuth();
  const { accounts } = useData();
  const existing = accounts.find((a) => a.id === accountId);

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<AccountType>(existing?.type ?? 'bank');
  const [initialBalanceText, setInitialBalanceText] = useState(
    existing ? (existing.initialBalanceCents / 100).toFixed(2) : '0'
  );
  const [icon, setIcon] = useState(existing?.icon ?? ICONS[0]);
  const [color, setColor] = useState(existing?.color ?? COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    if (!user) return;
    setError(null);
    if (!name.trim()) {
      setError('กรุณาระบุชื่อบัญชี');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && accountId) {
        await updateAccount(user.uid, accountId, { name, type, icon, color });
      } else {
        const cents = parseAmountToCents(initialBalanceText || '0') ?? 0;
        const signedCents = initialBalanceText.trim().startsWith('-') ? -cents : cents;
        await createAccount(
          user.uid,
          { name, type, currency: 'THB', initialBalanceCents: signedCents, icon, color },
          accounts.length
        );
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const onArchive = () => {
    if (!user || !accountId) return;
    Alert.alert('ปิดการใช้งานบัญชี', 'ธุรกรรมเก่าจะยังอยู่ครบ แต่บัญชีนี้จะไม่แสดงในรายการอีก', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ปิดการใช้งาน',
        style: 'destructive',
        onPress: async () => {
          await archiveAccount(user.uid, accountId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <FormLabel>ชื่อบัญชี</FormLabel>
        <FormInput value={name} onChangeText={setName} placeholder="เช่น กระเป๋าเงินหลัก" />

        <FormLabel>ประเภทบัญชี</FormLabel>
        <ChipRow options={TYPE_OPTIONS} value={type} onChange={setType} />

        {!isEditing && (
          <>
            <FormLabel>ยอดเริ่มต้น (บาท)</FormLabel>
            <FormInput
              value={initialBalanceText}
              onChangeText={setInitialBalanceText}
              keyboardType="numbers-and-punctuation"
              placeholder="0.00"
            />
          </>
        )}

        <FormLabel>ไอคอน</FormLabel>
        <ChipRow options={ICONS.map((i) => ({ label: i, value: i }))} value={icon} onChange={setIcon} />

        <FormLabel>สี</FormLabel>
        <ChipRow
          options={COLORS.map((c) => ({ label: '●', value: c, color: c }))}
          value={color}
          onChange={setColor}
        />

        <ErrorText message={error} />

        <View style={{ marginTop: 24, gap: 12 }}>
          <PrimaryButton title={isEditing ? 'บันทึกการแก้ไข' : 'สร้างบัญชี'} onPress={onSave} loading={loading} />
          {isEditing && <PrimaryButton title="ปิดการใช้งานบัญชี" onPress={onArchive} variant="danger" />}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
});
