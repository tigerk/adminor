<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <div class="info-panel">
      <div class="info-panel__title">付款信息</div>
      <div class="info-panel__grid info-panel__grid--amount">
        <div class="info-item">
          <div class="info-item__label">应付金额</div>
          <div class="info-item__value">¥{{ moneyText(props.bill.payableAmount) }}</div>
        </div>
        <div class="info-item">
          <div class="info-item__label">已付金额</div>
          <div class="info-item__value">¥{{ moneyText(props.bill.paidAmount) }}</div>
        </div>
        <div class="info-item">
          <div class="info-item__label">未付金额</div>
          <div class="info-item__value info-item__value--danger">
            <span class="amount-card__unit">¥</span>
            <span class="amount-card__value">{{ moneyText(unpaidAmount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="info-panel">
      <div class="info-panel__title">账单信息</div>
      <div class="info-panel__grid">
        <div class="info-item">
          <div class="info-item__label">合同编号</div>
          <div class="info-item__value">{{ props.bill.contractNo || "-" }}</div>
        </div>
        <div class="info-item">
          <div class="info-item__label">应付单号</div>
          <div class="info-item__value">{{ props.bill.billNo || "-" }}</div>
        </div>
        <div class="info-item">
          <div class="info-item__label">单据状态</div>
          <div class="info-item__value">{{ billStatusText(props.bill.billStatus) }}</div>
        </div>
        <div class="info-item">
          <div class="info-item__label">业主</div>
          <div class="info-item__value">{{ props.bill.ownerName || "-" }}</div>
        </div>
        <div class="info-item">
          <div class="info-item__label">合同房源</div>
          <div class="info-item__value">{{ props.bill.subjectName || "-" }}</div>
        </div>
        <div class="info-item">
          <div class="info-item__label">应付日期</div>
          <div class="info-item__value">{{ props.bill.dueDate || "-" }}</div>
        </div>
      </div>
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
  import type { PayableBillListVo, PayableBillPaymentCreateDto } from "@/api/owner/owner";
  import { PaymentFlowChannelEnumMeta } from "@/types/generated/enum.meta";

  defineOptions({ name: "OwnerPayableBillPaymentDialog" });

  const props = defineProps<{
    billId: string | number;
    unpaidAmount: number;
    bill: PayableBillListVo;
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

  function billStatusText(value?: number) {
    return value === 2 ? "已作废" : "正常";
  }

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

  .info-panel {
    margin-bottom: 14px;
    padding: 14px 16px;
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
  }

  .info-panel__title {
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .info-panel__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px 16px;
  }

  .info-item {
    min-width: 0;
  }

  .info-item__label {
    margin-bottom: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .info-item__value {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    word-break: break-all;
  }

  .info-item__value--danger {
    color: var(--el-color-danger);
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
