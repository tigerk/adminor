<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <div class="payment-overview">
      <div class="payment-overview__item">
        <span class="payment-overview__label">当前未付</span>
        <strong class="payment-overview__value">¥{{ moneyText(unpaidAmount) }}</strong>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="付款金额" prop="payAmount">
          <el-input-number v-model="form.payAmount" :min="0.01" :max="unpaidAmount" :precision="2" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="付款时间" prop="payAt">
          <el-date-picker v-model="form.payAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="付款渠道" prop="payChannel">
          <el-select v-model="form.payChannel" class="w-full" placeholder="请选择付款渠道">
            <el-option v-for="item in payChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="第三方流水号">
          <el-input v-model="form.thirdTradeNo" placeholder="选填" clearable />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="支付凭证">
          <UploadImage v-model="form.voucherUrls" :limit="3" :width="96" :height="96">
            <template #tip>请上传付款凭证图片</template>
          </UploadImage>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="4" maxlength="200" show-word-limit placeholder="选填" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
  import { reactive, ref } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import UploadImage from "@/components/upload/UploadImage.vue";
  import type { PayableBillPaymentCreateDto } from "@/api/owner/owner";
  import { PaymentFlowChannelEnumMeta } from "@/types/generated/enum.meta";

  defineOptions({ name: "OwnerBillPaymentDialog" });

  const props = defineProps<{
    billId: string | number;
    unpaidAmount: number;
  }>();

  const formRef = ref<FormInstance>();
  const payChannelOptions = Object.values(PaymentFlowChannelEnumMeta).map(item => ({
    label: item.label || item.value,
    value: item.value
  }));

  const form = reactive<PayableBillPaymentCreateDto>({
    billId: String(props.billId),
    payAmount: Number(props.unpaidAmount || 0),
    payAt: "",
    payChannel: undefined,
    thirdTradeNo: "",
    remark: "",
    voucherUrls: []
  });

  const rules: FormRules = {
    payAmount: [
      { required: true, message: "请输入付款金额", trigger: "blur" },
      {
        validator: (_, value, callback) => {
          if (Number(value || 0) <= 0) {
            callback(new Error("付款金额必须大于0"));
            return;
          }
          if (Number(value || 0) > Number(props.unpaidAmount || 0)) {
            callback(new Error("付款金额不能超过当前未付金额"));
            return;
          }
          callback();
        },
        trigger: "blur"
      }
    ],
    payAt: [{ required: true, message: "请选择付款时间", trigger: "change" }],
    payChannel: [{ required: true, message: "请选择付款渠道", trigger: "change" }]
  };

  const moneyText = (value?: number) => Number(value || 0).toFixed(2);

  async function validateAndBuildPayload() {
    await formRef.value?.validate();
    return {
      ...form,
      billId: String(props.billId)
    };
  }

  defineExpose({
    validateAndBuildPayload
  });
</script>

<style scoped lang="scss">
  .payment-overview {
    margin-bottom: 16px;
    padding: 12px 14px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    background: var(--el-fill-color-lighter);
  }

  .payment-overview__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .payment-overview__label {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .payment-overview__value {
    color: var(--el-color-danger);
    font-size: 18px;
    font-weight: 600;
  }
</style>
