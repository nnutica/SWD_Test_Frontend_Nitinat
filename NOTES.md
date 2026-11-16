# Notes: Feature Flag Editor

บันทึกการตัดสินใจทางเทคนิคระหว่างทำโจทย์ โค้ดทั้งหมดอยู่ใน `src/pages/code-challenge/feature-flag-form/your-codes/`

## ข้อกำหนดของโจทย์ และจุดที่ทำ

| ข้อกำหนด (หน้าโจทย์ / README)                    | ทำไว้ที่                                                                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Flag Metadata: ชื่อ Flag, คำอธิบาย, สถานะ        | `FlagDetails`: Flag name, **Description**, สวิตช์ Disable (รวมถึง Type, Version, Track events แบบ GoFeatureFlag)  |
| Flag Variations                                  | `VariationsField`: เพิ่ม/ลบได้ ตรวจ value ตาม type                                                                |
| Targeting Rules: Group เป็น array และ recursive  | `ConditionGroup` ซ้อนได้ไม่จำกัด AND/OR ได้ทุกชั้น                                                                |
| Targeting Rules: Rule เป็น array (+ Drag & Drop) | `TargetingRulesField` + `SortableList` ลากสลับ rule และ condition/group ได้                                       |
| Group & Role Management                          | condition กำหนด role/group ได้ เช่น `role eq "admin"` และช่อง Field มีรายการแนะนำ (`role`, `group`, `email`, ...) |
| Validation Logic ผ่าน Zod                        | `schema/flag-schema.ts` ตรวจทุกชั้น error ขึ้นใต้ช่องที่ผิด                                                       |
| JSON Preview ด้วย Monaco + `form.Subscribe`      | `JsonPreview` อัปเดตแบบ real-time                                                                                 |

**ช่อง Description:** editor ของ GoFeatureFlag ไม่มีช่องนี้ แต่หน้าโจทย์ (`assignment.tsx`) ขอ "คำอธิบาย" ไว้ จึงเพิ่มให้ และเขียนลง `metadata.description` เพราะ config ของ GoFeatureFlag ไม่มี field description ที่ระดับบนสุดของ flag

## โครงสร้างโค้ด

```
your-codes/
  schema/       Zod schema ของทั้งฟอร์ม และ type ทั้งหมดที่ infer มาจาก schema
  lib/          pure function: แปลงเป็น query string, แปลงเป็น output JSON, ค่าเริ่มต้น, ข้อความ error
  form/         การตั้งค่า TanStack Form (createFormHook, formOptions) และ type ของ path
  hooks/        useDragReorder (logic ของ drag & drop)
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

## Drag & Drop

- ใช้ HTML5 Drag and Drop API ที่มีใน browser ไม่ได้เพิ่ม package โดย logic อยู่ใน hook `useDragReorder` ส่วน UI อยู่ใน `SortableList` ใช้ร่วมกันทั้ง list ของ rule และ children ใน group แล้วเรียก `moveValue` ของ TanStack
- ลากได้จาก handle ⠿ เท่านั้น ระหว่างลากใช้ `setDragImage` แสดงทั้งแถว input ในแถวจึงไม่ถูกลากไปโดยไม่ตั้งใจ handle เป็น `div role="button"` เพราะ Firefox ไม่ยอมเริ่มลากจาก `<button>`
- ลากได้เฉพาะภายใน list เดียวกัน: ตอนเริ่มลากจะจำ `listId` (ชื่อ array field) ไว้ เพราะระหว่าง `dragover` browser ไม่ให้อ่านข้อมูลใน `dataTransfer` ถ้าเป็นของ list อื่นจะไม่เรียก `preventDefault` จึง drop ไม่ได้ และใช้ `stopPropagation` ไม่ให้ group ชั้นนอกรับ event ซ้ำ มีเทสที่ fail ถ้าไม่มีตัวกันนี้
- ใช้คีย์บอร์ดได้: โฟกัสที่ handle แล้วกด ↑/↓ เพื่อย้าย หลังย้ายโฟกัสจะตามไปที่ item นั้น

## Validation (Zod)

- ใช้ schema ตัวเดียวสำหรับทั้งฟอร์ม group ที่ซ้อนกันได้ไม่จำกัดใช้ getter ของ Zod v4 ให้ schema อ้างถึงตัวเองได้
- การเช็กข้าม field (ชื่อ flag/variation ซ้ำ, value ไม่ตรงกับ type, serve อ้าง variation ที่ถูกลบไปแล้ว, percentage รวมไม่ถึง 100, key ของ metadata) อยู่ใน `superRefine`
- error ไปขึ้นใต้ช่องที่ผิดโดยตรง เพราะ TanStack นำ path จาก Zod (เช่น `flags[0].variations[1].name`) ไปจับคู่กับชื่อ field ให้
- id ของ input ตั้งตามชื่อ field ใต้ JSON preview จึงมีรายการ error ทั้งหมด และกดแต่ละรายการเพื่อกระโดดไปที่ช่องนั้นได้

## UI/UX

- JSON preview อัปเดตทุกครั้งที่พิมพ์ มีป้าย **Valid / N errors** และปุ่ม **Copy** สำหรับคัดลอก config
- ใต้ preview มีรายการ error ที่เขียนเป็นภาษาคน เช่น `my-first-flag › Rule 1 › Condition 2 › Field` แทน path ดิบ กดแล้วจะเลื่อนไปและโฟกัสที่ช่องนั้น ถ้า error ไม่มีช่องให้กรอก (เช่น group ว่าง) จะเลื่อนไปที่ข้อความ error แทน
- error ขึ้นใต้ช่องที่ผิด และผูกกับ input ด้วย `aria-invalid` / `aria-describedby` screen reader จึงอ่านได้
- ช่อง Field ของ condition มีรายการแนะนำ attribute ที่ใช้บ่อย (`<datalist>`) แต่ยังพิมพ์ชื่ออื่นเองได้
- variation แต่ละตัวมีจุดสีของตัวเอง ใช้สีเดียวกันในรายการ Variations และใน dropdown ของ Serve
- group ที่ซ้อนกันมีพื้นหลังสลับสี และ group ว่างจะมีขอบสีแดง
- dropdown ทุกตัวเปิดขึ้นด้านบน (Radix popper `side="top"`)

## สิ่งที่ตั้งใจไม่ทำ

- **Progressive rollout** (ตัวเลือกที่ 3 ใน Serve ของ GoFeatureFlag): โจทย์ เกณฑ์ให้คะแนน และ `expected.json` ไม่ได้ขอ และไม่ได้โชว์ทักษะใหม่ เพราะแพทเทิร์น nested form, cross-field validation และ serve ที่สลับประเภทได้ มีอยู่แล้วใน percentage rollout จึงเลือกใช้เวลากับข้อที่อยู่ในเกณฑ์แทน ถ้าจะเพิ่มภายหลัง แค่เพิ่ม `type: 'progressive'` ใน `serveSchema` แล้วเพิ่ม case ใน `serveToOutput` และ `ServeField`
- **ลากข้าม list** (เช่น ย้าย condition จาก group หนึ่งไปอีก group): ลากได้เฉพาะภายใน list เดียวกัน เพื่อให้ logic ง่าย และไม่ต้องย้าย field ข้าม path

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
- **error ของ scaffold:** แก้ import 2 บรรทัดที่ทำให้ `pnpm lint` และ `tsc` ไม่ผ่าน คือ `src/lib/utils.ts` (แยก `type ClassValue` ออกมาเป็น `import type` ตามกฎ eslint ของโปรเจกต์) และ `src/components/app-sidebar.tsx` (ลบ import ที่ไม่ได้ใช้) ตอนนี้ lint, `tsc`, test และ build ผ่านทั้งโปรเจกต์
- **`vitest.config.ts`:** config นี้ใช้เฉพาะตอนเทส ไม่ได้ใส่ plugin ของ TanStack Start เพราะ plugin นั้นทำให้ React ถูก load เป็นสอง instance ใน jsdom จนเทส component ที่ใช้ hook ไม่ได้เลย ส่วน `vite.config.ts` ไม่ได้แก้
- **`.vscode/settings.json`:** ตั้ง `css.lint.unknownAtRules: ignore` เพราะตัวตรวจ CSS ของ VS Code ไม่รู้จัก at-rule ของ Tailwind v4 (`@theme`, `@apply` ฯลฯ) และขึ้น warning ทั้งที่ build ได้ปกติ

## เทส

- **unit test:** query builder, output mapping, schema (รวม recursive group, metadata และชื่อ flag ซ้ำ) และข้อความ error ภาษาคน
- **component test (jsdom):** พิมพ์แล้ว preview เปลี่ยนตาม, error ขึ้นใต้ช่องที่ถูกต้อง, group ซ้อนกันหลายชั้น, serve/percentage, หลาย flag, metadata, drag & drop และคีย์บอร์ด, รายการ error ที่กดแล้วกระโดดไปที่ช่อง และปุ่ม Copy
- mock Monaco ให้แสดงเป็น `<pre>` เพราะ Monaco โหลดจาก CDN ใน jsdom ไม่ได้ และเติม API ที่ jsdom ไม่มี (`hasPointerCapture`, `scrollIntoView`) ให้ Radix Select ทำงานได้
