import { LoginForm } from '@/components/LoginForm';

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith('/admin') ? next : '/admin';

  return (
    <>
      <h1>เข้าสู่ระบบแอดมิน</h1>
      <p className="subtitle">กรอกรหัสสำหรับแอดมินเพื่อเพิ่มหรือแก้ไขผลงานวิจัย</p>
      <LoginForm nextPath={nextPath} />
    </>
  );
}
