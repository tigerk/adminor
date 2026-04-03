<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
    <el-form-item label="业主ID" prop="ownerId">
      <el-input v-model="form.ownerId" placeholder="请输入业主ID" />
    </el-form-item>
    <el-form-item label="申请金额" prop="applyAmount">
      <el-input-number v-model="form.applyAmount" class="!w-full" :min="0" :precision="2" :step="100" />
    </el-form-item>
    <el-form-item label="手续费">
      <el-input-number v-model="form.feeAmount" class="!w-full" :min="0" :precision="2" :step="10" />
    </el-form-item>
    <el-form-item label="收款人" prop="payeeName">
      <el-input v-model="form.payeeName" placeholder="请输入收款人" />
    </el-form-item>
    <el-form-item label="银行卡号" prop="payeeAccountNo">
      <el-input v-model="form.payeeAccountNo" placeholder="请输入银行卡号" />
    </el-form-item>
    <el-form-item label="开户行" prop="payeeBankName">
      <el-input v-model="form.payeeBankName" placeholder="请输入开户行" />
    </el-form-item>
    <el-form-item label="备注">
      <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
  import { reactive, ref } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import type { OwnerWithdrawCreateDto } from "@/types/generated";

  defineOptions({ name: "OwnerWithdrawCreateDialog" });

  const props = defineProps<{ formInline?: OwnerWithdrawCreateDto | null }>();
  const formRef = ref<FormInstance>();
  const form = reactive<OwnerWithdrawCreateDto>({
    ownerId: props.formInline?.ownerId,
    applyAmount: props.formInline?.applyAmount,
    feeAmount: props.formInline?.feeAmount ?? 0,
    payeeName: props.formInline?.payeeName || "",
    payeeAccountNo: props.formInline?.payeeAccountNo || "",
    payeeBankName: props.formInline?.payeeBankName || "",
    remark: props.formInline?.remark || ""
  });

  const rules: FormRules<OwnerWithdrawCreateDto> = {
    ownerId: [{ required: true, message: "请输入业主ID", trigger: "blur" }],
    applyAmount: [{ required: true, message: "请输入申请金额", trigger: "change" }],
    payeeName: [{ required: true, message: "请输入收款人", trigger: "blur" }],
    payeeAccountNo: [{ required: true, message: "请输入银行卡号", trigger: "blur" }],
    payeeBankName: [{ required: true, message: "请输入开户行", trigger: "blur" }]
  };

  async function validateAndBuildPayload() {
    await formRef.value?.validate();
    return form;
  }

  defineExpose({
    validateAndBuildPayload,
    getRef: () => formRef.value,
    form
  });
</script>
