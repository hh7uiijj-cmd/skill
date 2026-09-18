# คลังงานวิจัย (Research Archive)

เว็บไซต์เก็บและเผยแพร่งานวิจัย สร้างด้วย **Next.js (App Router) + TypeScript + Firebase (Firestore + Storage ผ่าน Admin SDK)**

## ฟีเจอร์หลัก

- **หน้าแรก** แสดงรายการงานวิจัยทั้งหมด กรองตาม "รุ่น" ได้
- **หน้าอ่านออนไลน์** แบบเปิดหน้าหนังสือ (page-flip / e-book) พร้อมลายน้ำทับบนหน้าจอ ป้องกันการคัดลอก
- **ดาวน์โหลดไฟล์** — ไฟล์ที่ดาวน์โหลดทุกครั้งจะถูกประทับลายน้ำ (ชื่อเว็บไซต์ + รุ่น + วันเวลาที่ดาวน์โหลด) ลงในทุกหน้าโดยอัตโนมัติ ไฟล์ต้นฉบับที่เก็บไว้จะไม่ถูกเปิดให้ดาวน์โหลดตรง ๆ
- **ระบบแอดมิน** — ต้องกรอก "รหัสสำหรับแอดมิน" (Access Code) ก่อนจึงจะเพิ่ม/แก้ไข/ลบผลงานได้ ผู้เข้าชมทั่วไปดูและดาวน์โหลดได้โดยไม่ต้องมีบัญชี
- แบบฟอร์มเพิ่ม/แก้ไขผลงานบังคับกรอก **ชื่อผลงาน** และ **รุ่น** ให้ชัดเจน (มีระบบแนะนำรุ่นเดิมที่เคยกรอกไว้ กันสะกดไม่ตรงกัน) พร้อมช่องผู้จัดทำและคำอธิบาย/บทคัดย่อ (ไม่บังคับ)

## หลักการสำคัญด้านสถาปัตยกรรม

- **ไม่มีการเข้าถึง Firestore/Storage จากฝั่ง client โดยตรง** ทุกการอ่าน-เขียนข้อมูลผ่าน Next.js API routes (`src/app/api/**`) ที่ใช้ Firebase **Admin SDK** เท่านั้น จึงกำหนด `firestore.rules` และ `storage.rules` เป็น deny-all ไว้เป็นชั้นป้องกันซ้อน (defense in depth)
- **สิทธิ์แอดมินแบบรหัสลับตัวเดียว (Access Code)** ไม่ใช่ระบบสมาชิก — ตรวจสอบด้วย `timingSafeEqual` กันการโจมตีแบบ timing attack และมีการจำกัดจำนวนครั้งที่ลองผิดต่อ IP (`src/lib/rateLimit.ts`) หลังยืนยันตัวตนสำเร็จจะได้รับ **session cookie** ที่เซ็นด้วย JWT (HttpOnly, `src/lib/auth.ts`) อายุ 12 ชั่วโมง ป้องกันเส้นทาง `/admin/*` ด้วย `src/middleware.ts`
- **ลายน้ำ**: ไฟล์ดาวน์โหลดถูกประทับลายน้ำแบบไดนามิกด้วย `pdf-lib` + `@pdf-lib/fontkit` โดยฝังฟอนต์ไทย (`assets/fonts/NotoSansThai-Regular.ttf`, Noto Sans Thai ภายใต้ SIL OFL) ทุกครั้งที่กดดาวน์โหลด (`src/lib/watermark.ts`, `src/app/api/works/[id]/download/route.ts`) ส่วนหน้าอ่านออนไลน์ใช้ `react-pdf` render หน้ากระดาษเป็น canvas (ไม่มี text layer ให้คัดลอก) ผ่าน `react-pageflip` แล้วซ้อนลายน้ำด้วย CSS overlay ทับอีกชั้น (`src/components/Flipbook.tsx`)

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
      works/route.ts              GET รายการ / POST เพิ่มผลงาน (แอดมิน)
      works/batches/route.ts      GET รายชื่อรุ่นที่มีอยู่ (สำหรับ autocomplete)
      works/[id]/route.ts         GET / PATCH / DELETE รายชิ้น
      works/[id]/view/route.ts    สตรีมไฟล์ต้นฉบับสำหรับหน้าอ่านออนไลน์
      works/[id]/download/route.ts สตรีมไฟล์ที่ประทับลายน้ำแล้วให้ดาวน์โหลด
  components/                     Flipbook, WorkForm, ปุ่มต่าง ๆ
  lib/                            firebaseAdmin, auth, accessCode, watermark, works, validation
  middleware.ts                   ป้องกันเส้นทาง /admin/*
assets/fonts/                     ฟอนต์ไทยที่ฝังลงลายน้ำ PDF
firestore.rules / storage.rules   deny-all (เข้าถึงผ่าน Admin SDK เท่านั้น)
```

## เริ่มต้นใช้งาน

### 1. สร้างโปรเจกต์ Firebase

1. ไปที่ [Firebase Console](https://console.firebase.google.com/) สร้างโปรเจกต์ใหม่
2. เปิดใช้งาน **Firestore Database** (โหมด production)
3. เปิดใช้งาน **Storage** (ต้องอัปเกรดเป็นแผน Blaze)
4. ไปที่ **Project settings > Service accounts** กด **Generate new private key** จะได้ไฟล์ JSON ที่มี `project_id`, `client_email`, `private_key`

### 2. ตั้งค่า environment variables

```
cp .env.example .env.local
```

กรอกค่าจากไฟล์ service account JSON ลงใน `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (คง `\n` ไว้ในบรรทัดเดียว) และ `FIREBASE_STORAGE_BUCKET`

ตั้ง `ADMIN_ACCESS_CODE` เป็นรหัสที่แอดมินจะใช้เข้าสู่ระบบ และสุ่ม `SESSION_SECRET` ด้วยคำสั่ง:

```
openssl rand -base64 32
```

### 3. ติดตั้งและรัน

```
npm install
npm run dev
```

เปิด http://localhost:3000 — ไปที่ `/admin/login` เพื่อเข้าสู่ระบบแอดมินด้วยรหัสที่ตั้งไว้

### 4. Deploy Security Rules

```
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,storage
```

### 5. Deploy เว็บไซต์

รองรับการ deploy บนแพลตฟอร์มที่รัน Next.js ได้ตามปกติ (เช่น Vercel หรือ Node server ของตัวเอง) — ตั้งค่า environment variables ชุดเดียวกับข้อ 2 บนแพลตฟอร์มที่ deploy ด้วย

```
npm run build
npm run start
```

## หมายเหตุด้านความปลอดภัย/ข้อจำกัด

- Access Code เป็นรหัสลับตัวเดียวใช้ร่วมกันของทีมแอดมิน ไม่ใช่ระบบสมาชิกรายบุคคล หากต้องการแยกสิทธิ์รายคนหรือดูประวัติว่าใครแก้ไข ควรอัปเกรดเป็นระบบ Firebase Auth ในอนาคต
- การป้องกันด้วยลายน้ำช่วยระบุแหล่งที่มาและกันการคัดลอกทั่วไป แต่ไม่ใช่ DRM ที่ป้องกันการแคปหน้าจอได้ 100%
- ไฟล์ PDF จำกัดขนาดไม่เกิน 50MB ต่อไฟล์ (ปรับได้ที่ `src/lib/validation.ts`)
