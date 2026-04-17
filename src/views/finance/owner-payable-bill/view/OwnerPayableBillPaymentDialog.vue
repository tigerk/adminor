<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <!-- 待付金额 -->
    <div class="amount-card">
      <div class="amount-card__left">
        <span class="amount-card__label">当前未付账单金额</span>
        <div class="amount-card__value-row">
          <span class="amount-card__unit">¥</span>
          <span class="amount-card__value">{{ moneyText(unpaidAmount) }}</span>
        </div>
      </div>
      <el-tag type="danger" size="small" round>待付款</el-tag>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="付款金额" prop="payAmount">
          <el-input-number v-model="form.payAmount" :min="0.01" :max="unpaidAmount" :precision="2" style="width: 90%" class="w-full">
            <template #prefix>
              <span>￥</span>
            </template>
            <template #suffix>
              <span>元</span>
            </template>
          </el-input-number>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="付款时间" prop="payAt">
          <el-date-picker v-model="form.payAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <div class="quick-fill">
          <span class="quick-fill__label">快捷填入</span>
          <button type="button" class="quick-btn" :class="{ 'is-active': activeQuick === 'full' }" @click="setAmount('full')">全额 ¥{{ moneyText(unpaidAmount) }}</button>
          <button v-if="unpaidAmount >= 2" type="button" class="quick-btn" :class="{ 'is-active': activeQuick === 'half' }" @click="setAmount('half')">
            50% ¥{{ moneyText(unpaidAmount / 2) }}
          </button>
          <button type="button" class="quick-btn" :class="{ 'is-active': activeQuick === 'quarter' }" @click="setAmount('quarter')">25% ¥{{ moneyText(unpaidAmount / 4) }}</button>
        </div>
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
  import { nextTick, reactive, ref } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import UploadImage from "@/components/upload/UploadImage.vue";
  import type { PayableBillPaymentCreateDto } from "@/api/owner/owner";
  import { PaymentFlowChannelEnumMeta } from "@/types/generated/enum.meta";

  defineOptions({ name: "OwnerPayableBillPaymentDialog" });

  const props = defineProps<{
    billId: string | number;
    unpaidAmount: number;
  }>();

  const formRef = ref<FormInstance>();
  const payChannelOptions = Object.values(PaymentFlowChannelEnumMeta).map(item => ({
    label: item.label || item.value,
    value: item.value
  }));

  const amountInputRef = ref();
  const activeQuick = ref<"full" | "half" | "quarter">("full");

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

  function setAmount(type: "full" | "half" | "quarter") {
    activeQuick.value = type;
    if (type === "full") {
      form.payAmount = Number(props.unpaidAmount || 0);
    } else if (type === "half") {
      form.payAmount = Number((props.unpaidAmount / 2).toFixed(2));
    } else {
      form.payAmount = Number((props.unpaidAmount / 4).toFixed(2));
    }
  }

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
  /* ===== 待付金额卡片 ===== */
  .amount-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    margin-bottom: 14px;
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);

    &__left {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    &__label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    &__value-row {
      display: flex;
      align-items: baseline;
      gap: 1px;
    }

    &__unit {
      font-size: 15px;
      font-weight: 500;
      color: var(--el-color-danger);
    }

    &__value {
      font-size: 24px;
      font-weight: 500;
      color: var(--el-color-danger);
      letter-spacing: -0.5px;
      line-height: 1;
    }
  }

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

  /* ===== 快捷填入 ===== */
  .quick-fill {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    flex-wrap: wrap;

    &__label {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      white-space: nowrap;
    }
  }

  .quick-btn {
    height: 26px;
    padding: 0 10px;
    border-radius: 13px;
    border: 1px solid var(--el-border-color);
    background: transparent;
    color: var(--el-text-color-regular);
    font-size: 12px;
    cursor: pointer;
    transition:
      border-color 0.15s,
      color 0.15s,
      background 0.15s;
    white-space: nowrap;
    font-family: inherit;
    outline: none;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      color: var(--el-color-primary);
    }

    &.is-active {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }
</style>
