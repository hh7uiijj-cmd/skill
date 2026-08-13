import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { signIn } from '../../lib/auth';
import { colors, ErrorText, FormInput, FormLabel, PrimaryButton } from '../../components/ui';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? mapAuthError(e.message) : 'เข้าสู่ระบบไม่สำเร็จ');
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
        <Text style={styles.title}>รายรับ–รายจ่าย</Text>
        <Text style={styles.subtitle}>เข้าสู่ระบบเพื่อจัดการการเงินของคุณ</Text>

        <FormLabel>อีเมล</FormLabel>
        <FormInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />

        <FormLabel>รหัสผ่าน</FormLabel>
        <FormInput value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

        <ErrorText message={error} />

        <View style={{ marginTop: 24 }}>
          <PrimaryButton title="เข้าสู่ระบบ" onPress={onSubmit} loading={loading} />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>ยังไม่มีบัญชี?</Text>
          <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
            {' '}สมัครสมาชิก
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function mapAuthError(message: string): string {
  if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  }
  if (message.includes('auth/user-not-found')) return 'ไม่พบบัญชีผู้ใช้นี้';
  if (message.includes('auth/too-many-requests')) return 'พยายามเข้าสู่ระบบบ่อยเกินไป ลองใหม่ภายหลัง';
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
