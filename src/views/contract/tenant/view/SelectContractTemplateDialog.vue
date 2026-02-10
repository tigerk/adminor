<template>
  <div class="mb-5">
    <el-select v-model="selectedTemplate" placeholder="请选择合同模板">
      <el-option v-for="template in contractTemplates" :key="template.id" :label="template.templateName" :value="template.id" />
    </el-select>
  </div>
  <el-text type="danger" class="mt-2">注意：选择合同模板后，合同将根据模板重新生成，并且会重置合同签约状态。</el-text>
</template>

<script setup lang="ts">
  import { onMounted, ref } from "vue";
  import { getMyAvailableContractTemplates } from "@/api/contract/template";
  import { message } from "@/utils/message";

  const selectedTemplate = ref<number | null>(null);
  const contractTemplates = ref<any[]>([]);

  onMounted(() => {
    getMyAvailableContractTemplates({ contractType: 1 })
      .then(resp => {
        contractTemplates.value = resp.data;
      })
      .catch(err => {
        message("获取合同模板失败", { type: "error" });
        console.error("获取合同模板失败:", err);
      });
  });

  defineExpose({
    getSelectedTemplate: () => selectedTemplate.value
  });
</script>
