import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: {
    path: "./swagger.json"
  },
  output: {
    path: "./src/types/generated"
  },
  plugins: [
    {
      name: "@hey-api/typescript",
      enums: "typescript"
    }
  ]
});
