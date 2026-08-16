# รายรับ–รายจ่าย (Income & Expense Tracker)

แอปมือถือสำหรับบันทึกรายรับ–รายจ่ายส่วนบุคคล สร้างด้วย **Expo (React Native) + TypeScript + Firebase**

ครอบคลุมฟีเจอร์ตามสเปก **Phase 1 (MVP) + Phase 2 (ครบเครื่อง)**:

- ระบบสมาชิก (สมัคร/เข้าสู่ระบบด้วยอีเมล-รหัสผ่าน ผ่าน Firebase Auth)
- บันทึก/แก้ไข/ลบ (soft delete + กู้คืนได้) รายรับ-รายจ่าย พร้อมค้นหาและกรองตามเดือน/หมวดหมู่/บัญชี/โน้ต
- หมวดหมู่ที่สร้าง/แก้ไข/จัดเรียงเองได้ พร้อมหมวดหมู่เริ่มต้นให้ตอนสมัคร
- หลายบัญชี (เงินสด/ธนาคาร/บัตรเครดิต/e-Wallet) พร้อมยอดคงเหลือต่อบัญชีและยอดรวม
- โอนเงินระหว่างบัญชี (ไม่นับเป็นรายรับ-รายจ่าย)
- ตั้งงบประมาณรายเดือน (รวม หรือรายหมวดหมู่) พร้อมแถบความคืบหน้าและคำเตือนเมื่อใกล้/เกินงบ
- Dashboard: สรุปรายรับ-รายจ่าย-คงเหลือ, กราฟวงกลมสัดส่วนรายจ่ายตามหมวดหมู่, กราฟเส้นแนวโน้มรายเดือน/รายปี
- แนบรูปใบเสร็จ (Firebase Storage)
- ส่งออกรายงานเป็น CSV/Excel และ PDF

> Phase 3 (ธุรกรรมประจำ/แจ้งเตือน/สำรองข้อมูลอัตโนมัติ) ยังไม่รวมอยู่ในรอบนี้

## หลักการสำคัญที่ยึดตามสเปก

- **เก็บเงินเป็นจำนวนเต็มหน่วยสตางค์เสมอ** (`amountCents`) ไม่ใช้ float เลย (`src/lib/money.ts`)
- **ข้อมูลทุกอย่างอยู่ใต้ `users/{uid}/...`** ทำให้ทุก query ถูกกรองด้วยเจ้าของข้อมูลโดยธรรมชาติ และ Firestore Security Rules ตรวจซ้ำด้วย `request.auth.uid` เสมอ (`firestore.rules`)
- **ยอดคงเหลือบัญชีคำนวณผ่าน Firestore `runTransaction`** ทุกครั้งที่สร้าง/แก้ไข/ลบ/กู้คืนธุรกรรม เพื่อกันยอดเพี้ยนเมื่อมีการเขียนพร้อมกัน (`src/lib/transactions.ts`)
- **Soft delete** ธุรกรรมด้วย `deletedAt` แทนการลบจริง เพื่อกู้คืนและเก็บประวัติได้
- **Validation ฝั่งเซิร์ฟเวอร์เสมอ** ผ่าน Firestore Security Rules (ไม่พึ่งพา validation ฝั่ง client อย่างเดียว)

## โครงสร้างโปรเจกต์

```
App.tsx                     entry point
src/
  config/firebase.ts         Firebase init (Auth + Firestore)
  types/models.ts             โครงสร้างข้อมูล (Account, Category, Transaction, Budget)
  lib/                        data access layer (Firestore CRUD, business logic, export)
  context/                    AuthContext, DataContext (accounts/categories แบบ real-time)
  navigation/                 React Navigation (auth stack + bottom tabs)
  screens/                    หน้าจอแยกตามฟีเจอร์
firestore.rules              Security Rules
firestore.indexes.json       Composite indexes ที่ query ในแอปต้องใช้
storage.rules                Security Rules สำหรับรูปใบเสร็จ
```

## เริ่มต้นใช้งาน

### 1. สร้างโปรเจกต์ Firebase

1. ไปที่ [Firebase Console](https://console.firebase.google.com/) สร้างโปรเจกต์ใหม่
2. เปิดใช้งาน **Authentication → Sign-in method → Email/Password**
3. สร้าง **Firestore Database** (โหมด production)
4. เพิ่มแอป (Web app ก็พอ ใช้ config เดียวกันได้กับ Expo) แล้วคัดลอกค่า config

> **Storage (สำหรับรูปใบเสร็จ)** เป็น optional — Firebase กำหนดให้ต้องอัปเกรดโปรเจกต์เป็นแผน **Blaze** (ผูกบัตรเครดิต แต่ยังมี free quota ให้อยู่) ก่อนถึงจะเปิดใช้ Storage ได้ ถ้ายังไม่พร้อมอัปเกรด ข้ามขั้นตอนนี้ไปก่อนได้เลย ฟีเจอร์อื่นทั้งหมดใช้งานได้ปกติ ส่วนการแนบรูปใบเสร็จจะแจ้งเตือนแบบไม่บล็อกการบันทึกธุรกรรม (บันทึกรายการได้ตามปกติ แค่ไม่มีรูปแนบ) เมื่อพร้อมค่อยเปิด Storage แล้ว deploy `storage.rules` เพิ่มทีหลังได้

### 2. ตั้งค่า environment variables

```
cp .env.example .env
```

กรอกค่าจาก Firebase Console ลงใน `.env`

### 3. ติดตั้งและรันแอป

```
npm install
npm run start      # แล้วเปิดด้วย Expo Go หรือกด i/a สำหรับ simulator
```

### 4. Deploy Security Rules และ Indexes

ต้องติดตั้ง [Firebase CLI](https://firebase.google.com/docs/cli) ก่อน:

```
npm install -g firebase-tools
firebase login
firebase use --add        # เลือกโปรเจกต์ที่สร้างไว้
firebase deploy --only firestore:rules,firestore:indexes
```

ถ้าเปิดใช้งาน Storage แล้ว (อัปเกรดเป็น Blaze) ให้ deploy storage rules เพิ่มด้วย:

```
firebase deploy --only storage
```

> หากรันแอปแล้วเจอ error ลิงก์ "The query requires an index" ให้กด/เปิดลิงก์นั้นเพื่อสร้าง index เพิ่มเติมได้ทันที หรือเพิ่มลงใน `firestore.indexes.json` แล้ว deploy ใหม่

### 5. (ทางเลือก) Deploy เป็นเว็บแอป (PWA) ขึ้น Firebase Hosting

ใช้เมื่ออยากได้แอปที่ติดตั้งถาวรบนมือถือ (โดยเฉพาะ iPhone ที่ไม่มี Mac/ไม่จ่าย Apple Developer Program) โดยไม่ต้องรัน `npm run start` ค้างไว้อีกต่อไป:

```
npm run deploy:web
```

คำสั่งนี้จะ build เว็บเวอร์ชันของแอป (`expo export --platform web`) แล้ว deploy ขึ้น Firebase Hosting ให้อัตโนมัติ เมื่อเสร็จจะได้ URL แบบ `https://<project-id>.web.app`

**วิธีติดตั้งเป็นไอคอนแอปบน iPhone:**
1. เปิด URL ที่ได้ด้วย **Safari** บน iPhone (ต้องเป็น Safari เท่านั้น เบราว์เซอร์อื่นไม่รองรับ)
2. กดปุ่ม Share (สี่เหลี่ยมมีลูกศรชี้ขึ้น)
3. เลื่อนหา **"Add to Home Screen" / "เพิ่มไปที่หน้าจอโฮม"**
4. จะได้ไอคอนแอปบนหน้าจอโฮม เปิดแล้วเต็มจอเหมือนแอปจริง ใช้งานได้โดยไม่ต้องพึ่งคอมพิวเตอร์หรือ Expo Go อีก

หลังแก้โค้ดแล้วอยากอัปเดตเว็บที่ deploy ไว้ ก็แค่รัน `npm run deploy:web` ซ้ำอีกครั้ง

## หมายเหตุด้านสถาปัตยกรรม

โปรเจกต์นี้เลือกใช้ Firebase (Firestore + Auth + Storage) แทนการเขียน backend server เอง ตามที่สเปกเสนอเป็นทางเลือก ดังนั้น "การ validate ฝั่ง backend" และ "การกันข้อมูลข้ามผู้ใช้" ถูกบังคับใช้ผ่าน **Firestore/Storage Security Rules** (เทียบเท่าเลเยอร์ backend) แทนโค้ด server แยกต่างหาก ส่วน "DB transaction กันยอดเพี้ยน" ใช้ Firestore's `runTransaction` ซึ่งเป็นกลไก atomic cross-document transaction ของ Firestore เอง
