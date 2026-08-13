import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { signUp } from '../../lib/auth';
import { colors, ErrorText, FormInput, FormLabel, PrimaryButton } from '../../components/ui';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signUp(email, password, name);
    } catch (e) {
      setError(e instanceof Error ? mapAuthError(e.message) : 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>สมัครสมาชิก</Text>
        <Text style={styles.subtitle}>เริ่มบันทึกรายรับ–รายจ่ายของคุณวันนี้</Text>

        <FormLabel>ชื่อที่แสดง</FormLabel>
        <FormInput value={name} onChangeText={setName} placeholder="ชื่อของคุณ" />

        <FormLabel>อีเมล</FormLabel>
        <FormInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />

        <FormLabel>รหัสผ่าน</FormLabel>
        <FormInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="อย่างน้อย 6 ตัวอักษร"
        />

        <ErrorText message={error} />

        <View style={{ marginTop: 24 }}>
          <PrimaryButton title="สมัครสมาชิก" onPress={onSubmit} loading={loading} />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>มีบัญชีอยู่แล้ว?</Text>
          <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
            {' '}เข้าสู่ระบบ
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function mapAuthError(message: string): string {
  if (message.includes('auth/email-already-in-use')) return 'อีเมลนี้ถูกใช้งานแล้ว';
  if (message.includes('auth/weak-password')) return 'รหัสผ่านไม่ปลอดภัยเพียงพอ';
  return message;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: '600' },
});
