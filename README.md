# คลังงานวิจัย (Research Archive)

เว็บไซต์เก็บและเผยแพร่งานวิจัย สร้างด้วย **Next.js (App Router) + TypeScript + Firestore (เก็บข้อมูล, แผนฟรี) + Vercel Blob (เก็บไฟล์ PDF, ไม่ต้องผูกบัตรเครดิต)**

## ฟีเจอร์หลัก

- **หน้าแรก** แสดงรายการงานวิจัยทั้งหมด กรองตาม "รุ่น" ได้
- **หน้าอ่านออนไลน์** แบบเปิดหน้าหนังสือ (page-flip / e-book) พร้อมลายน้ำทับบนหน้าจอ ป้องกันการคัดลอก
- **ดาวน์โหลดไฟล์** — ไฟล์ที่ดาวน์โหลดทุกครั้งจะถูกประทับลายน้ำ (ชื่อเว็บไซต์ + รุ่น + วันเวลาที่ดาวน์โหลด) ลงในทุกหน้าโดยอัตโนมัติ ไฟล์ต้นฉบับที่เก็บไว้จะไม่ถูกเปิดให้ดาวน์โหลดตรง ๆ
- **ระบบแอดมิน** — ต้องกรอก "รหัสสำหรับแอดมิน" (Access Code) ก่อนจึงจะเพิ่ม/แก้ไข/ลบผลงานได้ ผู้เข้าชมทั่วไปดูและดาวน์โหลดได้โดยไม่ต้องมีบัญชี
- แบบฟอร์มเพิ่ม/แก้ไขผลงานบังคับกรอก **ชื่อผลงาน** และ **รุ่น** ให้ชัดเจน (มีระบบแนะนำรุ่นเดิมที่เคยกรอกไว้ กันสะกดไม่ตรงกัน) พร้อมช่องผู้จัดทำและคำอธิบาย/บทคัดย่อ (ไม่บังคับ)
- **1 ผลงานแนบได้หลายไฟล์** พร้อมตั้งชื่อกำกับแต่ละไฟล์ (เช่น "รายงานฉบับเต็ม", "บทความ") — หน้าอ่านออนไลน์มีแท็บให้สลับดูแต่ละไฟล์ ดาวน์โหลดแยกไฟล์ได้ และแก้ไขผลงานภายหลังยังเพิ่ม/ลบไฟล์แต่ละไฟล์ได้อิสระ
- **ตั้งค่าธีมสี** (`/admin/theme`) — แอดมินเปลี่ยนโทนสีหลักของทั้งเว็บไซต์ได้เอง (สีหลัก/สีเน้น/พื้นหลัง/พื้นการ์ด/ตัวอักษร) มีผลทันทีทั่วทั้งเว็บโดยไม่ต้อง deploy ใหม่

## หลักการสำคัญด้านสถาปัตยกรรม

- **ไม่มีการเข้าถึง Firestore จากฝั่ง client โดยตรง** ทุกการอ่าน-เขียนข้อมูลผ่าน Next.js API routes (`src/app/api/**`) ที่ใช้ Firebase **Admin SDK** เท่านั้น จึงกำหนด `firestore.rules` เป็น deny-all ไว้เป็นชั้นป้องกันซ้อน (defense in depth)
- **ไฟล์ PDF เก็บใน Vercel Blob แบบ private access** (`src/lib/blobStorage.ts`) ไม่มี URL สาธารณะให้เข้าถึงตรง ๆ ต้องผ่าน token ฝั่งเซิร์ฟเวอร์เท่านั้น การอ่านไฟล์ (ทั้งหน้าอ่านออนไลน์และดาวน์โหลด) จึงยังคงถูกควบคุมผ่าน API routes เหมือนเดิม — Firestore เก็บแค่ข้อมูล (ชื่อ/รุ่น/ผู้แต่ง ฯลฯ) จึงใช้แผนฟรี **Spark** ได้ ไม่ต้องอัปเกรดเป็น **Blaze**
- **สิทธิ์แอดมินแบบรหัสลับตัวเดียว (Access Code)** ไม่ใช่ระบบสมาชิก — ตรวจสอบด้วย `timingSafeEqual` กันการโจมตีแบบ timing attack และมีการจำกัดจำนวนครั้งที่ลองผิดต่อ IP (`src/lib/rateLimit.ts`) หลังยืนยันตัวตนสำเร็จจะได้รับ **session cookie** ที่เซ็นด้วย JWT (HttpOnly, `src/lib/auth.ts`) อายุ 12 ชั่วโมง ป้องกันเส้นทาง `/admin/*` ด้วย `src/middleware.ts`
- **ลายน้ำ**: ใช้รูปตราสัญลักษณ์ (`public/watermark-logo.jpg`) เรียงซ้ำแบบโปร่งแสงทั้งในไฟล์ดาวน์โหลด (ฝังด้วย `pdf-lib` ผ่าน `src/lib/watermark.ts`, `src/app/api/works/[id]/files/[index]/download/route.ts` — พร้อมบรรทัดท้ายหน้าระบุวันเวลาที่ดาวน์โหลดและรุ่น เพื่อสืบย้อนได้) และในหน้าอ่านออนไลน์ (ซ้อนด้วย CSS overlay ใน `src/components/Flipbook.tsx`) — เปลี่ยนรูปโลโก้ได้โดยแทนที่ไฟล์ `public/watermark-logo.jpg` ด้วยรูปใหม่ (ไม่ต้องแก้โค้ด) ส่วนตัวอักษรไทยในบรรทัดท้ายหน้ายังใช้ฟอนต์ที่ฝังไว้ (`assets/fonts/NotoSansThai-Regular.ttf`, Noto Sans Thai ภายใต้ SIL OFL) หน้าอ่านออนไลน์ยัง render หน้ากระดาษเป็น canvas ผ่าน `react-pdf` + `react-pageflip` โดยไม่มี text layer ให้คัดลอกเหมือนเดิม
- **ธีมสีที่แก้ไขได้**: สีของเว็บถูกกำหนดเป็น CSS variables (`--color-primary`, `--color-accent`, `--color-bg`, `--color-surface`, `--color-ink`) ค่าเริ่มต้นและค่าที่แอดมินตั้งเองถูกเก็บใน Firestore (`settings/theme`, `src/lib/theme.ts`) แล้ว inject เป็น `<style>` ใน root layout (`src/app/layout.tsx`) ทุกครั้งที่โหลดหน้า ค่าสีถูกตรวจสอบรูปแบบ `#rrggbb` อย่างเข้มงวดทั้งตอนบันทึกและตอนอ่าน ก่อนฝังลง HTML โดยตรง เพื่อป้องกัน CSS/HTML injection

## โครงสร้างโปรเจกต์

```
src/
  app/
    page.tsx                      หน้าแรก (รายการผลงาน + กรองตามรุ่น)
    works/[id]/page.tsx           หน้าอ่านออนไลน์ (flipbook + ดาวน์โหลด)
    admin/
      login/page.tsx              เข้าสู่ระบบด้วยรหัสแอดมิน
      page.tsx                    แผงควบคุม (ตารางผลงาน + แก้ไข/ลบ)
      upload/page.tsx             ฟอร์มเพิ่มผลงานใหม่
      works/[id]/edit/page.tsx    ฟอร์มแก้ไขผลงาน
    api/
      auth/{login,logout,session}/route.ts
      works/route.ts              GET รายการ / POST เพิ่มผลงาน (แอดมิน, แนบได้หลายไฟล์)
      works/batches/route.ts      GET รายชื่อรุ่นที่มีอยู่ (สำหรับ autocomplete)
      works/[id]/route.ts         GET / PATCH (แก้ข้อมูล) / DELETE รายชิ้น
      works/[id]/files/route.ts   POST เพิ่มไฟล์ให้ผลงานที่มีอยู่ (แอดมิน)
      works/[id]/files/[index]/route.ts          DELETE ลบไฟล์รายการที่ index (แอดมิน)
      works/[id]/files/[index]/view/route.ts     สตรีมไฟล์ต้นฉบับ (ตาม index) สำหรับหน้าอ่านออนไลน์
      works/[id]/files/[index]/download/route.ts สตรีมไฟล์ (ตาม index) ที่ประทับลายน้ำแล้วให้ดาวน์โหลด
  components/                     Flipbook, WorkForm, WorkFilesViewer, WorkFilesManager, ปุ่มต่าง ๆ
  lib/                            firebaseAdmin, blobStorage, auth, accessCode, watermark, works, validation
  middleware.ts                   ป้องกันเส้นทาง /admin/*
assets/fonts/                     ฟอนต์ไทยที่ฝังลงลายน้ำ PDF
firestore.rules                   deny-all (เข้าถึงผ่าน Admin SDK เท่านั้น)
```

## เริ่มต้นใช้งาน

### 1. สร้างโปรเจกต์ Firebase (สำหรับเก็บข้อมูล — แผนฟรีพอ ไม่ต้องผูกบัตร)

1. ไปที่ [Firebase Console](https://console.firebase.google.com/) สร้างโปรเจกต์ใหม่
2. เปิดใช้งาน **Firestore Database** (โหมด production) — ไม่ต้องเปิด Storage
3. ไปที่ **Project settings > Service accounts** กด **Generate new private key** จะได้ไฟล์ JSON ที่มี `project_id`, `client_email`, `private_key`

### 2. สร้าง Vercel Blob store (สำหรับเก็บไฟล์ PDF — ไม่ต้องผูกบัตร บนแผน Hobby)

1. สร้างโปรเจกต์บน [Vercel](https://vercel.com) จาก repo นี้ (หรือสร้างโปรเจกต์เปล่าไว้ก่อนก็ได้)
2. ไปที่แท็บ **Storage** ของโปรเจกต์ > **Create Database** > เลือก **Blob**
3. คัดลอกค่า **`BLOB_READ_WRITE_TOKEN`** จากหน้านั้นมาไว้ใช้ในขั้นตอนถัดไป (เมื่อ deploy จริงบน Vercel และผูก store กับโปรเจกต์แล้ว ค่านี้จะถูกใส่ให้อัตโนมัติทุกครั้งที่ deploy)

> หมายเหตุ: แผน Hobby (ฟรี) ของ Vercel ให้ใช้ได้ 1GB Blob storage/เดือน แต่จำกัดไว้สำหรับโปรเจกต์ส่วนตัว/ไม่แสวงหารายได้ ถ้าเป็นเว็บเชิงพาณิชย์ต้องใช้แผน Pro

### 3. ตั้งค่า environment variables

```
cp .env.example .env.local
```

กรอกค่าจากไฟล์ service account JSON ลงใน `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (คง `\n` ไว้ในบรรทัดเดียว) และใส่ `BLOB_READ_WRITE_TOKEN` จากขั้นตอนที่ 2

ตั้ง `ADMIN_ACCESS_CODE` เป็นรหัสที่แอดมินจะใช้เข้าสู่ระบบ และสุ่ม `SESSION_SECRET` ด้วยคำสั่ง:

```
openssl rand -base64 32
```

### 4. ติดตั้งและรัน

```
npm install
npm run dev
```

เปิด http://localhost:3000 — ไปที่ `/admin/login` เพื่อเข้าสู่ระบบแอดมินด้วยรหัสที่ตั้งไว้

### 5. Deploy Security Rules ของ Firestore

```
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

### 6. Deploy เว็บไซต์

แนะนำ [Vercel](https://vercel.com) เพราะเชื่อมกับ Blob store ที่สร้างไว้ในขั้นตอนที่ 2 ได้อัตโนมัติ — เชื่อม repo นี้ในหน้า Vercel แล้วตั้งค่า environment variables ชุดเดียวกับข้อ 3 ในหน้า Project Settings > Environment Variables จากนั้นกด deploy (ถ้า deploy บนแพลตฟอร์มอื่นที่ไม่ใช่ Vercel ต้องหาบริการเก็บไฟล์อื่นมาแทน Vercel Blob เอง เช่น Supabase Storage)

รันเองในเครื่อง server ก็ได้เช่นกัน:

```
npm run build
npm run start
```

## หมายเหตุด้านความปลอดภัย/ข้อจำกัด

- Access Code เป็นรหัสลับตัวเดียวใช้ร่วมกันของทีมแอดมิน ไม่ใช่ระบบสมาชิกรายบุคคล หากต้องการแยกสิทธิ์รายคนหรือดูประวัติว่าใครแก้ไข ควรอัปเกรดเป็นระบบ Firebase Auth ในอนาคต
- การป้องกันด้วยลายน้ำช่วยระบุแหล่งที่มาและกันการคัดลอกทั่วไป แต่ไม่ใช่ DRM ที่ป้องกันการแคปหน้าจอได้ 100%
- ไฟล์ PDF จำกัดขนาดไม่เกิน 50MB ต่อไฟล์ (ปรับได้ที่ `src/lib/validation.ts`)
- Vercel Blob แผนฟรี (Hobby) กำหนดให้ใช้กับโปรเจกต์ส่วนตัว/ไม่แสวงหารายได้เท่านั้น — ดูรายละเอียดที่ [เอกสารราคา Vercel Blob](https://vercel.com/docs/vercel-blob/usage-and-pricing)
