import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountsStackParamList } from '../../navigation/types';
import { useData } from '../../context/DataContext';
import { formatCents } from '../../lib/money';
import type { Account, AccountType } from '../../types/models';
import { Card, colors, EmptyState, LoadingView, PrimaryButton, Screen } from '../../components/ui';

type Props = NativeStackScreenProps<AccountsStackParamList, 'AccountsList'>;

const TYPE_LABEL: Record<AccountType, string> = {
  cash: 'เงินสด',
  bank: 'บัญชีธนาคาร',
  credit_card: 'บัตรเครดิต',
  e_wallet: 'e-Wallet',
};

export default function AccountsListScreen({ navigation }: Props) {
  const { accounts, totalBalanceCents, loading } = useData();

  if (loading) return <LoadingView />;

  return (
    <Screen>
      <View style={{ padding: 16, gap: 12 }}>
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>ยอดรวมทุกบัญชี</Text>
          <Text style={styles.totalAmount}>{formatCents(totalBalanceCents)}</Text>
        </Card>
        <PrimaryButton title="🔁 โอนเงินระหว่างบัญชี" variant="secondary" onPress={() => navigation.navigate('TransferForm')} />
      </View>

      {accounts.length === 0 ? (
        <EmptyState message="ยังไม่มีบัญชี" />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <AccountRow account={item} onPress={() => navigation.navigate('AccountForm', { accountId: item.id })} />
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={() => navigation.navigate('AccountForm', undefined)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </Screen>
  );
}

function AccountRow({ account, onPress }: { account: Account; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: account.color + '22' }]}>
        <Text style={{ fontSize: 20 }}>{account.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{account.name}</Text>
        <Text style={styles.rowSubtitle}>{TYPE_LABEL[account.type]}</Text>
      </View>
      <Text style={styles.rowAmount}>{formatCents(account.currentBalanceCents, account.currency)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  totalCard: { alignItems: 'center', backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  totalLabel: { color: '#e0f2f1', fontSize: 13, fontWeight: '600' },
  totalAmount: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
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
