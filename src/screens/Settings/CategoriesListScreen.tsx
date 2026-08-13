import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { updateCategory } from '../../lib/categories';
import type { Category, EntryType } from '../../types/models';
import { colors, EmptyState, LoadingView, Screen, SegmentedControl } from '../../components/ui';

type Props = NativeStackScreenProps<SettingsStackParamList, 'CategoriesList'>;

export default function CategoriesListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { categories, loading } = useData();
  const [type, setType] = useState<EntryType>('expense');
  const filtered = categories.filter((c) => c.type === type).sort((a, b) => a.sortOrder - b.sortOrder);

  const move = async (item: Category, direction: -1 | 1) => {
    if (!user) return;
    const index = filtered.findIndex((c) => c.id === item.id);
    const swapWith = filtered[index + direction];
    if (!swapWith) return;
    await Promise.all([
      updateCategory(user.uid, item.id, { sortOrder: swapWith.sortOrder }),
      updateCategory(user.uid, swapWith.id, { sortOrder: item.sortOrder }),
    ]);
  };

  if (loading) return <LoadingView />;

  return (
    <Screen>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <SegmentedControl
          options={[
            { label: 'รายจ่าย', value: 'expense' },
            { label: 'รายรับ', value: 'income' },
          ]}
          value={type}
          onChange={setType}
        />
      </View>

      {filtered.length === 0 ? (
        <EmptyState message="ยังไม่มีหมวดหมู่" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Pressable
                onPress={() => navigation.navigate('CategoryForm', { categoryId: item.id, type: item.type })}
                style={styles.rowMain}
              >
                <View style={[styles.iconWrap, { backgroundColor: item.color + '22' }]}>
                  <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                </View>
                <Text style={styles.name}>{item.name}</Text>
                {item.isDefault && <Text style={styles.badge}>ค่าเริ่มต้น</Text>}
              </Pressable>
              <View style={styles.reorderCol}>
                <Pressable disabled={index === 0} onPress={() => move(item, -1)} hitSlop={8}>
                  <Text style={[styles.reorderArrow, index === 0 && styles.reorderArrowDisabled]}>▲</Text>
                </Pressable>
                <Pressable disabled={index === filtered.length - 1} onPress={() => move(item, 1)} hitSlop={8}>
                  <Text style={[styles.reorderArrow, index === filtered.length - 1 && styles.reorderArrowDisabled]}>▼</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('CategoryForm', { type })}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  badge: { fontSize: 11, color: colors.textMuted, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  reorderCol: { gap: 2 },
  reorderArrow: { fontSize: 14, color: colors.primary, padding: 4 },
  reorderArrowDisabled: { color: '#cbd5e1' },
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
