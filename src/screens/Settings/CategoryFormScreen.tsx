import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createCategory, deleteCategory, updateCategory } from '../../lib/categories';
import type { EntryType } from '../../types/models';
import { ChipRow, ErrorText, FormInput, FormLabel, PrimaryButton, Screen, SegmentedControl } from '../../components/ui';

type Props = NativeStackScreenProps<SettingsStackParamList, 'CategoryForm'>;

const ICONS = ['🍜', '🚗', '🏠', '💡', '🛍️', '💊', '🎬', '📚', '💳', '💰', '🎁', '💼', '📈', '➕', '📦'];
const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#eab308', '#ec4899', '#ef4444', '#22c55e', '#06b6d4', '#64748b', '#78716c'];

export default function CategoryFormScreen({ route, navigation }: Props) {
  const { categoryId, type: initialType } = route.params ?? {};
  const isEditing = !!categoryId;
  const { user } = useAuth();
  const { categories } = useData();
  const existing = categories.find((c) => c.id === categoryId);

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<EntryType>(existing?.type ?? initialType ?? 'expense');
  const [icon, setIcon] = useState(existing?.icon ?? ICONS[0]);
  const [color, setColor] = useState(existing?.color ?? COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    if (!user) return;
    setError(null);
    if (!name.trim()) {
      setError('กรุณาระบุชื่อหมวดหมู่');
      return;
    }
    setLoading(true);
    try {
      if (isEditing && categoryId) {
        await updateCategory(user.uid, categoryId, { name, icon, color });
      } else {
        await createCategory(user.uid, { name, type, icon, color }, categories.length);
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = () => {
    if (!user || !categoryId) return;
    Alert.alert(
      'ลบหมวดหมู่',
      'หากมีธุรกรรมเก่าที่ใช้หมวดหมู่นี้อยู่ จะยังคงอ้างอิงหมวดหมู่นี้ต่อไป ต้องการลบหรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(user.uid, categoryId);
              navigation.goBack();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        {!isEditing && (
          <>
            <FormLabel>ประเภท</FormLabel>
            <SegmentedControl
              options={[
                { label: 'รายจ่าย', value: 'expense' },
                { label: 'รายรับ', value: 'income' },
              ]}
              value={type}
              onChange={setType}
            />
          </>
        )}

        <FormLabel>ชื่อหมวดหมู่</FormLabel>
        <FormInput value={name} onChangeText={setName} placeholder="เช่น อาหาร" />

        <FormLabel>ไอคอน</FormLabel>
        <ChipRow options={ICONS.map((i) => ({ label: i, value: i }))} value={icon} onChange={setIcon} />

        <FormLabel>สี</FormLabel>
        <ChipRow options={COLORS.map((c) => ({ label: '●', value: c, color: c }))} value={color} onChange={setColor} />

        <ErrorText message={error} />

        <View style={{ marginTop: 24, gap: 12 }}>
          <PrimaryButton title={isEditing ? 'บันทึกการแก้ไข' : 'สร้างหมวดหมู่'} onPress={onSave} loading={loading} />
          {isEditing && <PrimaryButton title="ลบหมวดหมู่" onPress={onDelete} variant="danger" />}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
});
