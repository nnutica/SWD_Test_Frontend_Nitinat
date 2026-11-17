# Notes: Feature Flag Editor

โค้ดอยู่ใน `src/pages/code-challenge/feature-flag-form/your-codes/` ผมเขียนบันทึกนี้เพื่อเล่าว่าเลือกอะไร และทำไม

## โครงสร้าง

แยกเป็น 5 โฟลเดอร์ ผมแยกแบบนี้เพราะอยากเทส logic ได้โดยไม่ต้อง render

- `schema/` Zod schema ของทั้งฟอร์ม type ทั้งหมดมาจาก `z.infer` ของ schema ตัวนี้
- `lib/` pure function เช่น สร้าง query string และแปลงเป็น output JSON
- `form/` ตั้งค่า TanStack Form
- `hooks/` มี `useDragReorder` ตัวเดียว
- `components/` มีแต่ UI

## Output format

ผมไม่ได้ทำตาม `expected.json` ตรงๆ ในเรื่อง percentage ตัวอย่างใช้ `"percentage": 50, "variation": "on"` แต่ผมใช้ `"percentage": { "on": 50, "off": 50 }` แบบที่ GoFeatureFlag ใช้จริง เพราะโจทย์ให้อ้างอิง GoFeatureFlag และ format นี้แบ่งได้หลาย variation ส่วน query ผมเขียนตาม syntax ของ GoFeatureFlag เช่น `group eq "beta"` แทน `group == 'beta'`

ช่อง Description ผมเพิ่มเองเพราะหน้าโจทย์ขอ "คำอธิบาย" ไว้ และเขียนลง `metadata.description` เพราะ GoFeatureFlag ไม่มี field นี้ที่ระดับบน

## Form state

ใช้ form ตัวเดียว (`createFormHook`) แต่ละ input subscribe แค่ค่าของตัวเอง ส่วนเดียวที่ subscribe ทั้งฟอร์มคือ JSON preview ผ่าน `form.Subscribe`

กลุ่มเงื่อนไขซ้อนกันได้ไม่จำกัด เพราะ `ConditionGroup` render ตัวเองซ้ำ และรับ `path` เช่น `flags[0].rules[0].query.children[1]`

serve อ้าง variation ด้วย id ไม่ใช่ชื่อ พอเปลี่ยนชื่อ variation ค่าที่เลือกไว้จึงไม่หลุด

## Validation

ใช้ Zod schema ตัวเดียวทั้งฟอร์ม ส่วน group ที่ซ้อนกัน ผมใช้ getter ของ Zod v4 ให้ schema อ้างถึงตัวเองได้

การเช็กข้าม field อยู่ใน `superRefine` เช่น ชื่อซ้ำ, value ไม่ตรงกับ type, percentage รวมไม่ถึง 100

error ขึ้นใต้ช่องที่ผิด และใต้ JSON preview มีรายการ error ที่กดแล้วกระโดดไปที่ช่องนั้นได้

## Drag & Drop

ผมใช้ HTML5 Drag and Drop ของ browser ไม่เพิ่ม package ส่วน logic อยู่ใน hook `useDragReorder` ลากสลับได้ทั้ง rule และเงื่อนไขภายใน group เดียวกัน ใช้คีย์บอร์ดได้ด้วย โฟกัสที่ handle แล้วกด ↑/↓

ลากข้าม group ผมไม่ทำ ลากใน list เดียวกันเรียก `moveValue` ครั้งเดียวจบ แต่ลากข้าม group ต้องลบจาก array หนึ่งไปใส่อีก array ต้องคิดเรื่อง index ที่เลื่อน และต้องกันไม่ให้วาง group ลงในลูกของตัวเอง โจทย์ไม่ได้ขอ ผมเลยเลือกให้ logic ง่ายไว้ก่อน

## ที่ตั้งใจไม่ทำ

Progressive rollout ตัวเลือกที่ 3 ของ Serve ผมข้าม เพราะโจทย์และเกณฑ์ไม่ได้กำหนด และ pattern ที่ต้องใช้ (nested form, validation ข้าม field, serve ที่สลับประเภทได้) มีใน percentage อยู่แล้ว 

## ปัญหาที่เจอ

- **TS2589 "Type instantiation is excessively deep":** type ของ group ที่อ้างถึงตัวเองทำให้ TanStack สร้างรายชื่อ field ไม่จบ ผมแก้โดยให้ `children` ใน type ของฟอร์มเป็น `unknown[]` field ชั้นบนยังถูกเช็ก type ส่วน Zod ยังตรวจทั้ง tree
- **ลบ flag ตัวแรกแล้วค่าหาย:** เดิมใช้ `key={id}` แต่ชื่อ field อิงตาม index ผมเปลี่ยนเป็น `key={index}` ตามตัวอย่าง array field ใน docs ของ TanStack และเพิ่มเทสครอบ
- **Monaco ตอน render ฝั่ง server:** default import ได้ object ของทั้ง module แทน component ผมเปลี่ยนเป็น named import `{ Editor }`
- **theme ของ shadcn:** `styles.css` ประกาศสีไว้ใน `:root` แต่ Tailwind v4 สร้าง utility เฉพาะตัวแปรใน `@theme` ผลคือ dropdown โปร่งใส ผมย้ายไปไว้ใน `@theme inline`

## ไฟล์นอก `your-codes/` ที่แก้

- `src/lib/utils.ts` และ `src/components/app-sidebar.tsx`: แก้ import 2 บรรทัดที่ทำให้ `pnpm lint` กับ `tsc` ไม่ผ่านตั้งแต่ scaffold
- `src/components/ui/`: เพิ่ม switch, select, label, textarea ของ shadcn สร้างจาก `radix-ui` ที่โจทย์ติดตั้งไว้แล้ว ไม่ได้เพิ่ม dependency
- `pnpm-workspace.yaml`: pnpm 11 ไม่อ่าน `onlyBuiltDependencies` ใน `package.json` แล้ว ผมเลยตั้ง `allowBuilds` ไว้ที่นี่
- `.vscode/settings.json`: ปิด warning ของ at-rule ที่ VS Code ไม่รู้จัก เช่น `@theme`

## เทส

มี unit test ของ query builder, output mapping และ schema และ component test ที่พิมพ์แล้วเช็กว่า preview กับ error เปลี่ยนตาม