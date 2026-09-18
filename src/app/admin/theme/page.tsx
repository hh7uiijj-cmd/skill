import { getTheme } from '@/lib/theme';
import { ThemeForm } from '@/components/ThemeForm';

export const dynamic = 'force-dynamic';

export default async function AdminThemePage() {
  const theme = await getTheme();

  return (
    <>
      <h1>ตั้งค่าธีมสี</h1>
      <p className="subtitle">เปลี่ยนโทนสีของทั้งเว็บไซต์ได้ตามต้องการ การเปลี่ยนแปลงจะมีผลทันทีหลังบันทึก</p>
      <ThemeForm theme={theme} />
    </>
  );
}
