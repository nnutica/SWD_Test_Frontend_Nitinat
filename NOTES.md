# Notes: Feature Flag Editor

บันทึกการตัดสินใจทางเทคนิคระหว่างทำโจทย์ โค้ดทั้งหมดอยู่ใน `src/pages/code-challenge/feature-flag-form/your-codes/`

## โครงสร้างโค้ด

```
your-codes/
  schema/       Zod schema ของทั้งฟอร์ม และ type ทั้งหมดที่ infer มาจาก schema
  lib/          pure function: แปลงเป็น query string, แปลงเป็น output JSON, ค่าเริ่มต้น
  form/         การตั้งค่า TanStack Form (createFormHook, formOptions)
  components/   UI เท่านั้น ไม่มี business logic
```

- logic ทั้งหมด (validate, สร้าง query, แปลง output) อยู่ใน `schema/` และ `lib/` เป็น pure function จึงเทสได้โดยไม่ต้อง render
- type ของฟอร์มมาจาก `z.infer` ของ schema ตัวเดียว ไม่ต้องดูแล type กับ schema แยกกันสองที่

## Output format

- ครอบด้วย `"flags": { "<flag-name>": {...} }` ตาม `expected.json` ของโจทย์
- **percentage rollout** ใช้ format จริงของ GoFeatureFlag คือ `"percentage": { "on": 50, "off": 50 }` ไม่ใช้ `"percentage": 50, "variation": "on"` แบบใน `expected.json` เพราะโจทย์ให้ทำให้เหมือน GoFeatureFlag และ format จริงแบ่งเปอร์เซ็นต์ให้หลาย variation ได้ (รวมกันต้องเป็น 100)
- field ที่ค่าเท่ากับ default ของ GoFeatureFlag (`disable: false`, `trackEvents: true`, version หรือ description ที่ว่าง) จะไม่แสดงใน output เหมือนที่ editor ของ GoFeatureFlag ทำ

## Form state (TanStack Form)

- ใช้ `createFormHook` แล้วแยกแต่ละ section เป็น `withForm` ส่วน input (`TextField`, `SelectField` ฯลฯ) อ่านค่าจาก field context จึงไม่ต้องส่ง `value`/`onChange` ต่อกันหลายชั้น
- **re-render:** แต่ละ input subscribe แค่ค่าของตัวเอง list ที่ใช้ `mode="array"` re-render เฉพาะตอนเพิ่มหรือลบ item (ยืนยันจาก source ของ `useField`) และมีแค่ JSON preview ที่ subscribe ค่าทั้งฟอร์มผ่าน `form.Subscribe`
- **group ที่ซ้อนกัน (recursive):** `ConditionGroup` render ตัวเองซ้ำสำหรับ group ลูก โดยรับ `path` (เช่น `rules[0].query.children[1]`) แล้วอ่าน form จาก context (`form.AppForm` + `useTypedAppFormContext`) จึงไม่ต้องส่ง `form` ผ่าน props ไปทุกชั้น
- group อ่านรายการ children ด้วย `useStore` และฟังก์ชัน `compare` ที่ดูแค่ `id` และ `kind` จึง re-render เฉพาะตอนเพิ่ม ลบ หรือสลับลำดับ พิมพ์ใน condition ลึกๆ จะ re-render แค่ input ช่องนั้น
- type ของ path (`GroupPath`, `ConditionPath`) เขียนเป็น template literal จึงไม่ต้อง cast และ TS ยังกันไม่ให้วาง condition ไว้ที่ root ของ query ซึ่งต้องเป็น group เสมอ
- serve อ้าง variation ด้วย `id` แทนชื่อ เปลี่ยนชื่อ variation แล้วค่าที่เลือกไว้จึงไม่หลุด และค่อยแปลงกลับเป็นชื่อตอนสร้าง output

## Validation (Zod)

- ใช้ schema ตัวเดียวสำหรับทั้งฟอร์ม group ที่ซ้อนกันได้ไม่จำกัดใช้ getter ของ Zod v4 ให้ schema อ้างถึงตัวเองได้
- การเช็กข้าม field (ชื่อ variation ซ้ำ, value ไม่ตรงกับ type, serve อ้าง variation ที่ถูกลบไปแล้ว, percentage รวมไม่ถึง 100) อยู่ใน `superRefine`
- error ไปขึ้นใต้ช่องที่ผิดโดยตรง เพราะ TanStack นำ path จาก Zod (เช่น `variations[1].name`) ไปจับคู่กับชื่อ field ให้
- id ของ input ตั้งตามชื่อ field ใต้ JSON preview จึงมีรายการ error ทั้งหมด และกดแต่ละรายการเพื่อกระโดดไปที่ช่องนั้นได้

## ปัญหาที่เจอและวิธีแก้

- **TS2589 "Type instantiation is excessively deep":** TanStack สร้างรายชื่อ field ทุกตัวที่เป็นไปได้จาก type ของฟอร์ม แต่ type ที่อ้างถึงตัวเองทำให้รายชื่อนี้ไม่มีวันจบ ผมแก้โดยใช้ `FlagFormState` ซึ่งให้ `children` ของ group เป็น `unknown[]` field ชั้นบนยังถูกเช็ก type ครบ ส่วน path ที่ซ้อนกันสร้างตอน runtime อยู่แล้ว และ Zod ยังตรวจทั้ง tree เหมือนเดิม
- **dev server crash:** devtools ของ TanStack ใช้ `JSON.stringify` กับ option ของฟอร์ม ซึ่งพังเมื่อเจอ schema ที่อ้างถึงตัวเอง ผมแก้โดยห่อ schema ด้วย function validator ผ่าน `standardSchemaValidators.validate` ซึ่ง error ยังไปขึ้นตาม field เหมือนเดิม
- **Monaco ตอน server render:** `@monaco-editor/react` เป็น CommonJS ตอนรันบน server default import จึงได้ object ของทั้ง module แทน component ผมแก้เป็น named import `{ Editor }`

## การตั้งค่าโปรเจกต์ที่แก้

- **pnpm 11:** ไม่อ่าน `pnpm.onlyBuiltDependencies` ใน `package.json` แล้ว ผมจึงตั้ง `allowBuilds` ใน `pnpm-workspace.yaml` แทน (อนุญาตแค่ `esbuild`) ได้ทดสอบแล้วว่าติดตั้งด้วย pnpm 10 ก็ยังผ่าน
- **`tsconfig.json`:** ลบ `baseUrl` ออก เพราะ TypeScript 6 แจ้งว่า deprecated แล้ว `paths` ใช้งานได้โดยไม่ต้องมีมันตั้งแต่ TS 4.1
- **shadcn components (switch, select, label, textarea):** สร้างจาก `radix-ui` ที่โจทย์ติดตั้งไว้แล้ว ไม่ได้เพิ่ม dependency ตอนรัน CLI บน Windows มันพยายามเพิ่ม package `cn` ที่ไม่เกี่ยวข้อง ผมจึงคืน `package.json` กับ lockfile เป็นของเดิม แล้วแก้ import ให้ชี้ไปที่ `#/lib/utils`
- **`vitest.config.ts`:** config นี้ใช้เฉพาะตอนเทส ไม่ได้ใส่ plugin ของ TanStack Start เพราะ plugin นั้นทำให้ React ถูก load เป็นสอง instance ใน jsdom จนเทส component ที่ใช้ hook ไม่ได้เลย ส่วน `vite.config.ts` ไม่ได้แก้

## เทส

- unit test ของ query builder, output mapping และ schema
- component test (jsdom) ยืนยันว่าพิมพ์แล้ว preview เปลี่ยนตาม และ error ขึ้นใต้ช่องที่ถูกต้อง โดย mock Monaco ให้แสดงเป็น `<pre>` เพราะ Monaco โหลดจาก CDN ใน jsdom ไม่ได้
