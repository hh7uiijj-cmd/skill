import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, getDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import type { TransactionsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { transactionDocRef } from '../../lib/paths';
import { createTransaction, softDeleteTransaction, updateTransaction } from '../../lib/transactions';
import { uploadReceipt } from '../../lib/storage';
import { parseAmountToCents } from '../../lib/money';
import type { Transaction, TransactionType } from '../../types/models';
import {
  ChipRow,
  colors,
  ErrorText,
  FormInput,
  FormLabel,
  PrimaryButton,
  SegmentedControl,
} from '../../components/ui';

type Props = NativeStackScreenProps<TransactionsStackParamList, 'TransactionForm'>;

const TYPE_OPTIONS: { label: string; value: TransactionType }[] = [
  { label: 'รายจ่าย', value: 'expense' },
  { label: 'รายรับ', value: 'income' },
  { label: 'โอนเงิน', value: 'transfer' },
];

export default function TransactionFormScreen({ route, navigation }: Props) {
  const { transactionId } = route.params ?? {};
  const isEditing = !!transactionId;
  const { user } = useAuth();
  const { accounts, categories } = useData();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountText, setAmountText] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  const visibleCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));
  useEffect(() => {
    if (type === 'transfer') return;
    if (!visibleCategories.find((c) => c.id === categoryId)) {
      setCategoryId(visibleCategories[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, categories]);

  useEffect(() => {
    if (!user || !transactionId) return;
    (async () => {
      const snap = await getDoc(transactionDocRef(user.uid, transactionId));
      if (snap.exists()) {
        const t = snap.data() as Transaction;
        setType(t.type);
        setAmountText((t.amountCents / 100).toFixed(2));
        setDate(t.date.toDate());
        setAccountId(t.accountId);
        setToAccountId(t.toAccountId ?? null);
        setCategoryId(t.categoryId ?? null);
        setNote(t.note ?? '');
        setExistingReceiptUrl(t.receiptUrl ?? null);
      }
      setLoadingExisting(false);
    })();
  }, [user, transactionId]);

  const pickReceiptImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('ต้องการสิทธิ์เข้าถึงรูปภาพ', 'กรุณาอนุญาตการเข้าถึงคลังภาพเพื่อแนบใบเสร็จ');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const onSave = async () => {
    if (!user) return;
    setError(null);

    const amountCents = parseAmountToCents(amountText);
    if (!amountCents) {
      setError('กรุณาระบุจำนวนเงินให้ถูกต้อง (มากกว่า 0)');
      return;
    }
    if (!accountId) {
      setError('กรุณาเลือกบัญชี');
      return;
    }
    if (type === 'transfer' && !toAccountId) {
      setError('กรุณาเลือกบัญชีปลายทาง');
      return;
    }
    if (type !== 'transfer' && !categoryId) {
      setError('กรุณาเลือกหมวดหมู่');
      return;
    }

    setLoading(true);
    try {
      let receiptUrl = existingReceiptUrl;
      if (receiptUri) {
        receiptUrl = await uploadReceipt(user.uid, receiptUri);
      }

      const account = accounts.find((a) => a.id === accountId)!;
      const input = {
        type,
        amountCents,
        currency: account.currency,
        date,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : null,
        categoryId: type === 'transfer' ? null : categoryId,
        note,
        receiptUrl,
      };

      if (isEditing && transactionId) {
        await updateTransaction(user.uid, transactionId, input);
      } else {
        await createTransaction(user.uid, input);
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = () => {
    if (!user || !transactionId) return;
    Alert.alert('ลบธุรกรรม', 'ต้องการลบรายการนี้หรือไม่? สามารถกู้คืนได้ภายหลัง', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await softDeleteTransaction(user.uid, transactionId);
            navigation.goBack();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ');
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (loadingExisting) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={setType} />

        <FormLabel>จำนวนเงิน (บาท)</FormLabel>
        <FormInput
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        <FormLabel>วันที่ - เวลา</FormLabel>
        <Text style={styles.dateText} onPress={() => setShowDatePicker(true)}>
          {date.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
        </Text>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            onChange={(_, selected) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selected) setDate(selected);
            }}
          />
        )}

        {type !== 'transfer' && (
          <>
            <FormLabel>หมวดหมู่</FormLabel>
            <ChipRow
              options={visibleCategories.map((c) => ({
                label: `${c.icon} ${c.name}`,
                value: c.id,
                color: c.color,
              }))}
              value={categoryId}
              onChange={setCategoryId}
            />
          </>
        )}

        <FormLabel>{type === 'transfer' ? 'บัญชีต้นทาง' : 'บัญชี'}</FormLabel>
        <ChipRow
          options={accounts.map((a) => ({ label: `${a.icon} ${a.name}`, value: a.id }))}
          value={accountId}
          onChange={setAccountId}
        />

        {type === 'transfer' && (
          <>
            <FormLabel>บัญชีปลายทาง</FormLabel>
            <ChipRow
              options={accounts
                .filter((a) => a.id !== accountId)
                .map((a) => ({ label: `${a.icon} ${a.name}`, value: a.id }))}
              value={toAccountId}
              onChange={setToAccountId}
            />
          </>
        )}

        <FormLabel>โน้ต</FormLabel>
        <FormInput value={note} onChangeText={setNote} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)" />

        <FormLabel>ใบเสร็จ</FormLabel>
        <Text style={styles.linkButton} onPress={pickReceiptImage}>
          📎 {receiptUri || existingReceiptUrl ? 'เปลี่ยนรูปใบเสร็จ' : 'แนบรูปใบเสร็จ'}
        </Text>
        {(receiptUri || existingReceiptUrl) && (
          <Image source={{ uri: receiptUri ?? existingReceiptUrl! }} style={styles.receiptPreview} />
        )}

        <ErrorText message={error} />

        <View style={{ marginTop: 24, gap: 12 }}>
          <PrimaryButton title={isEditing ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'} onPress={onSave} loading={loading} />
          {isEditing && <PrimaryButton title="ลบรายการ" onPress={onDelete} variant="danger" />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  dateText: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#fff',
  },
  linkButton: { color: colors.primary, fontWeight: '600', paddingVertical: 8 },
  receiptPreview: { width: '100%', height: 180, borderRadius: 12, marginTop: 8 },
});
