<template>
  <div class="mb-5">
    <el-select v-model="selectedTemplate" placeholder="请选择合同模板">
      <el-option v-for="template in contractTemplates" :key="template.id" :label="template.templateName" :value="template.id" />
    </el-select>
  </div>
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
