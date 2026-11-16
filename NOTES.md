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

- ครอบด้วย `"flags": { "<flag-name>": {...} }` ตาม `expected.json` ของโจทย์ และกด **Add another flag** เพิ่มได้หลาย flag ใน config เดียวเหมือน GoFeatureFlag ชื่อ flag ห้ามซ้ำกัน
- **percentage rollout** ใช้ format จริงของ GoFeatureFlag คือ `"percentage": { "on": 50, "off": 50 }` ไม่ใช้ `"percentage": 50, "variation": "on"` แบบใน `expected.json` เพราะโจทย์ให้ทำให้เหมือน GoFeatureFlag และ format จริงแบ่งเปอร์เซ็นต์ให้หลาย variation ได้ (รวมกันต้องเป็น 100)
- field ที่ค่าเท่ากับ default ของ GoFeatureFlag (`disable: false`, `trackEvents: true`, version หรือ description ที่ว่าง) จะไม่แสดงใน output เหมือนที่ editor ของ GoFeatureFlag ทำ
- **metadata** รวม description กับ key/value ที่ผู้ใช้เพิ่มเองไว้ใน object เดียว เช่น `{ "description": "...", "Age": "22" }` value เป็น string เสมอเหมือน GoFeatureFlag และ key ห้ามว่าง ห้ามซ้ำ ห้ามใช้คำว่า `description` เพราะช่อง Description ใช้ key นี้อยู่แล้ว
- **validate เข้มกว่า GoFeatureFlag:** editor ของ GoFeatureFlag ยอมให้ key ว่าง, ชื่อที่มีช่องว่าง (`"V3 "`) และ value ของ boolean ที่ไม่ใช่ true/false (เช่น `any`) ผ่านไปได้ ซึ่งจะได้ config ที่ใช้งานจริงไม่ได้ ของเราจึงแสดง error แทน

## Form state (TanStack Form)

- ใช้ `createFormHook` สร้าง form ตัวเดียวใน `YourCode` แล้วส่งให้ทุก section ผ่าน `form.AppForm` จากนั้นทุก component อ่าน form ด้วย `useFlagForm()` (`useTypedAppFormContext`) ซึ่งได้ type ครบ และไม่ต้องส่ง `form` ผ่าน props หลายชั้น ส่วน input (`TextField`, `SelectField` ฯลฯ) อ่านค่าจาก field context
- ทุก section รับ `flagPath` (เช่น `flags[1]`) แล้วต่อ path เอง component ชุดเดียวจึงใช้กับ flag ไหนก็ได้
- **re-render:** แต่ละ input subscribe แค่ค่าของตัวเอง list ที่ใช้ `mode="array"` re-render เฉพาะตอนเพิ่มหรือลบ item (ยืนยันจาก source ของ `useField`) และมีแค่ JSON preview ที่ subscribe ค่าทั้งฟอร์มผ่าน `form.Subscribe`
- **group ที่ซ้อนกัน (recursive):** `ConditionGroup` render ตัวเองซ้ำสำหรับ group ลูก โดยรับ `path` เช่น `flags[0].rules[0].query.children[1]`
- group อ่านรายการ children ด้วย `useStore` และฟังก์ชัน `compare` ที่ดูแค่ `id` และ `kind` จึง re-render เฉพาะตอนเพิ่ม ลบ หรือสลับลำดับ พิมพ์ใน condition ลึกๆ จะ re-render แค่ input ช่องนั้น
- type ของ path (`GroupPath`, `ConditionPath`) เขียนเป็น template literal จึงไม่ต้อง cast และ TS ยังกันไม่ให้วาง condition ไว้ที่ root ของ query ซึ่งต้องเป็น group เสมอ
- serve อ้าง variation ด้วย `id` แทนชื่อ เปลี่ยนชื่อ variation แล้วค่าที่เลือกไว้จึงไม่หลุด และค่อยแปลงกลับเป็นชื่อตอนสร้าง output
- **Serve:** ใช้ dropdown ตัวเดียวที่มีทั้ง variation และ "a percentage rollout" เหมือน GoFeatureFlag เก็บทั้ง `variationId` และ `percentage` ไว้คู่กัน สลับไปมาแล้วค่าเดิมจึงไม่หาย และตอนสร้าง output จะใช้แค่ค่าตาม `type` ที่เลือก
- พอเปลี่ยนเป็น percentage ครั้งแรก จะแบ่งเท่าๆ กันให้อัตโนมัติ (50/50, 34/33/33) แทนที่จะขึ้น error "now 0%" ทันที ช่อง % จำกัดค่าไว้ที่ 0-100 ส่วนยอดรวมที่ไม่ถึง 100 แสดงเป็น error

## Validation (Zod)

- ใช้ schema ตัวเดียวสำหรับทั้งฟอร์ม group ที่ซ้อนกันได้ไม่จำกัดใช้ getter ของ Zod v4 ให้ schema อ้างถึงตัวเองได้
- การเช็กข้าม field (ชื่อ variation ซ้ำ, value ไม่ตรงกับ type, serve อ้าง variation ที่ถูกลบไปแล้ว, percentage รวมไม่ถึง 100) อยู่ใน `superRefine`
- error ไปขึ้นใต้ช่องที่ผิดโดยตรง เพราะ TanStack นำ path จาก Zod (เช่น `variations[1].name`) ไปจับคู่กับชื่อ field ให้
- id ของ input ตั้งตามชื่อ field ใต้ JSON preview จึงมีรายการ error ทั้งหมด และกดแต่ละรายการเพื่อกระโดดไปที่ช่องนั้นได้

## ปัญหาที่เจอและวิธีแก้

- **TS2589 "Type instantiation is excessively deep":** TanStack สร้างรายชื่อ field ทุกตัวที่เป็นไปได้จาก type ของฟอร์ม แต่ type ที่อ้างถึงตัวเองทำให้รายชื่อนี้ไม่มีวันจบ ผมแก้โดยใช้ `FlagFormState` ซึ่งให้ `children` ของ group เป็น `unknown[]` field ชั้นบนยังถูกเช็ก type ครบ ส่วน path ที่ซ้อนกันสร้างตอน runtime อยู่แล้ว และ Zod ยังตรวจทั้ง tree เหมือนเดิม
- **dev server crash:** devtools ของ TanStack ใช้ `JSON.stringify` กับ option ของฟอร์ม ซึ่งพังเมื่อเจอ schema ที่อ้างถึงตัวเอง ผมแก้โดยห่อ schema ด้วย function validator ผ่าน `standardSchemaValidators.validate` ซึ่ง error ยังไปขึ้นตาม field เหมือนเดิม
- **ลบ flag ตัวแรกแล้ว crash:** เดิมใช้ `key={id}` แต่ชื่อ field อิงตาม index พอลบ item ตัวหน้า component เดิมจะถูกเปลี่ยนชื่อ field ไปเป็นตัวถัดไป และ `useField` render อีกหนึ่งรอบด้วย FieldApi ตัวเก่า (ซึ่งชี้ไปที่ item ที่ถูกลบแล้ว) ก่อนจะสลับเป็นตัวใหม่ ค่าจึงเป็น `undefined` ผมแก้โดยให้ list ที่สร้าง field ใช้ `key={index}` ตามตัวอย่าง array field ใน docs ของ TanStack ชื่อ field ของแต่ละ component จึงไม่เปลี่ยนเลย และมีเทสครอบไว้แล้ว
- **Monaco ตอน server render:** `@monaco-editor/react` เป็น CommonJS ตอนรันบน server default import จึงได้ object ของทั้ง module แทน component ผมแก้เป็น named import `{ Editor }`

## การตั้งค่าโปรเจกต์ที่แก้

- **`src/styles.css` (theme ของ shadcn):** ไฟล์ที่ได้มาประกาศ `--color-*` ไว้ใน `:root` ซึ่ง Tailwind v4 สร้าง utility ให้เฉพาะตัวแปรที่อยู่ใน `@theme` utility อย่าง `bg-card`, `bg-popover`, `text-destructive` และ `border-border` จึงไม่ถูกสร้างเลย (ตรวจจาก CSS ที่ build ออกมา) ผลคือ dropdown โปร่งใสและข้อความ error ไม่เป็นสีแดง นอกจากนี้ธีม light กับโหมด auto ไม่มีค่าสี และไม่มี `--radius` ผมแก้โดยย้ายตัวแปรไปไว้ใน `@theme inline`, เติมค่าสีของธีม light (neutral palette ของ shadcn), ให้ธีม dark ผูกกับ class `.dark` ที่ script ใน `__root.tsx` ใส่ให้อยู่แล้ว และกำหนด `--radius` ส่วน font ใช้ค่าเดิม

- **pnpm 11:** ไม่อ่าน `pnpm.onlyBuiltDependencies` ใน `package.json` แล้ว ผมจึงตั้ง `allowBuilds` ใน `pnpm-workspace.yaml` แทน (อนุญาตแค่ `esbuild`) ได้ทดสอบแล้วว่าติดตั้งด้วย pnpm 10 ก็ยังผ่าน
- **`tsconfig.json`:** ลบ `baseUrl` ออก เพราะ TypeScript 6 แจ้งว่า deprecated แล้ว `paths` ใช้งานได้โดยไม่ต้องมีมันตั้งแต่ TS 4.1
- **shadcn components (switch, select, label, textarea):** สร้างจาก `radix-ui` ที่โจทย์ติดตั้งไว้แล้ว ไม่ได้เพิ่ม dependency ตอนรัน CLI บน Windows มันพยายามเพิ่ม package `cn` ที่ไม่เกี่ยวข้อง ผมจึงคืน `package.json` กับ lockfile เป็นของเดิม แล้วแก้ import ให้ชี้ไปที่ `#/lib/utils`
- **`vitest.config.ts`:** config นี้ใช้เฉพาะตอนเทส ไม่ได้ใส่ plugin ของ TanStack Start เพราะ plugin นั้นทำให้ React ถูก load เป็นสอง instance ใน jsdom จนเทส component ที่ใช้ hook ไม่ได้เลย ส่วน `vite.config.ts` ไม่ได้แก้

## เทส

- unit test ของ query builder, output mapping และ schema
- component test (jsdom) ยืนยันว่าพิมพ์แล้ว preview เปลี่ยนตาม และ error ขึ้นใต้ช่องที่ถูกต้อง โดย mock Monaco ให้แสดงเป็น `<pre>` เพราะ Monaco โหลดจาก CDN ใน jsdom ไม่ได้
