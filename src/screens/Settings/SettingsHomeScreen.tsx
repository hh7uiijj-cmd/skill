import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { signOutUser } from '../../lib/auth';
import { Card, colors, PrimaryButton, Screen } from '../../components/ui';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

export default function SettingsHomeScreen({ navigation }: Props) {
  const { user } = useAuth();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <Text style={styles.name}>{user?.displayName || 'ผู้ใช้'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </Card>

        <MenuItem label="📁 จัดการหมวดหมู่" onPress={() => navigation.navigate('CategoriesList')} />
        <MenuItem label="📤 ส่งออกรายงาน (CSV / PDF)" onPress={() => navigation.navigate('ExportScreen')} />

        <View style={{ marginTop: 24 }}>
          <PrimaryButton title="ออกจากระบบ" variant="danger" onPress={signOutUser} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 60, gap: 12 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
  menuArrow: { fontSize: 20, color: colors.textMuted },
});
