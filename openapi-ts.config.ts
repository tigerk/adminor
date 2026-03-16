import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./swagger.json",
  output: {
    path: "./src/types/generated",
    // 强制清理目录，确保没有旧的残留文件
    clean: true
  },
  plugins: [
    {
      // 核心类型生成插件
      name: "@hey-api/typescript",
      enums: false
      // 如果你不需要导出接口的元数据（比如每个字段的描述、默认值等），保持默认即可
    }
  ]
});
