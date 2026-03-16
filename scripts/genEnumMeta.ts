// scripts/genEnumMeta.ts
import fs from "fs";
import path from "path";

const swagger = JSON.parse(fs.readFileSync("./swagger.json", "utf-8"));
const schemas = swagger?.components?.schemas ?? {};

const enumEntries: string[] = [];

for (const [enumName, schema] of Object.entries(schemas) as any) {
  // 只处理有 enum 字段的 schema
  if (!schema.enum) continue;

  const varnames: string[] = schema["x-enum-varnames"] ?? schema.enum;
  const enumValues: (string | number)[] = schema.enum;

  // 收集所有 x-enum-* 扩展字段（排除 x-enum-varnames）
  const extensions: Record<string, any[]> = {};
  for (const [key, val] of Object.entries(schema)) {
    if (key.startsWith("x-enum-") && key !== "x-enum-varnames" && Array.isArray(val)) {
      // "x-enum-code" → "code"
      extensions[key.replace("x-enum-", "")] = val as any[];
    }
  }

  // 生成 meta 对象：{ OR_SIGN: { value: 'OR_SIGN', code: 1, name: '或签' }, ... }
  const metaEntries = varnames.map((varname: string, i: number) => {
    const fields: Record<string, any> = { value: enumValues[i] };
    for (const [extKey, extVals] of Object.entries(extensions)) {
      fields[extKey] = extVals[i];
    }
    return `  ${varname}: ${JSON.stringify(fields)}`;
  });

  enumEntries.push(`export const ${enumName}Meta = {\n${metaEntries.join(",\n")}\n} as const;\n`);
}

const output = `// AUTO GENERATED - DO NOT EDIT\n\n${enumEntries.join("\n")}`;
const outPath = path.resolve("./src/types/generated/enum.meta.ts");
fs.writeFileSync(outPath, output, "utf-8");
console.log(`✅ enum.meta.ts generated with ${enumEntries.length} enums`);
