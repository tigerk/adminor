<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <el-alert type="warning" :closable="false" show-icon>
      <div>将作废当前包租应付单{{ billNo ? `：${billNo}` : "" }}。作废后不可继续登记付款。</div>
    </el-alert>
    <el-form-item label="作废原因" prop="voidReason" class="mt-4">
      <el-input v-model="form.voidReason" type="textarea" :rows="4" maxlength="200" show-word-limit />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
  import { reactive, ref } from "vue";
  import type { FormInstance, FormRules } from "element-plus";

  defineOptions({ name: "OwnerPayableBillVoidDialog" });

  defineProps<{ billNo?: string }>();

  const formRef = ref<FormInstance>();
  const form = reactive({ voidReason: "" });
  const rules: FormRules = {
    voidReason: [{ required: true, message: "请输入作废原因", trigger: "blur" }]
  };

  async function validateAndBuildPayload() {
    await formRef.value?.validate();
    return { ...form };
  }

  defineExpose({ validateAndBuildPayload });
</script>
