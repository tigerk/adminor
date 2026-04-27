<template>
  <div class="collect-wrap">
    <!-- ① 账单概览条 -->
    <div class="bill-overview mb-3">
      <div class="bill-overview__left">
        <div class="bill-period-badge">第 {{ bill.sortOrder ?? "—" }} 期</div>
        <div class="bill-meta">
          <span class="bill-meta__item">
            <IconifyIconOnline icon="ri:calendar-2-line" />
            账期&nbsp;{{ formatDate(bill.billStart) }}&nbsp;—&nbsp;{{ formatDate(bill.billEnd) }}
          </span>
          <span class="bill-meta__dot">·</span>
          <span class="bill-meta__item">
            <IconifyIconOnline icon="ri:time-line" />
            应缴&nbsp;{{ formatDate(bill.dueDate) }}
          </span>
          <span v-if="isOverdue" class="bill-meta__overdue">逾期</span>
        </div>
      </div>

      <div class="bill-kpi-row">
        <div class="bill-kpi">
          <span class="bill-kpi__label">账单应收</span>
          <span class="bill-kpi__value">¥{{ moneyText(bill.totalAmount) }}</span>
        </div>
        <div class="bill-kpi-divider" />
        <div class="bill-kpi">
          <span class="bill-kpi__label">累计已收</span>
          <span class="bill-kpi__value bill-kpi__value--paid">¥{{ moneyText(bill.paidAmount) }}</span>
        </div>
        <div class="bill-kpi-divider" />
        <div class="bill-kpi">
          <span class="bill-kpi__label">当前待收</span>
          <span class="bill-kpi__value bill-kpi__value--unpaid">¥{{ moneyText(bill.unpaidAmount) }}</span>
        </div>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <!-- ② 支付信息 -->
      <div class="section-block mb-3">
        <!-- 标题行：左侧 icon+标题，右侧付款人信息 -->
        <div class="section-block__header">
          <div class="section-block__title">
            <IconifyIconOnline icon="ri:bank-card-line" class="section-icon" />
            支付信息
          </div>
          <div class="payer-inline">
            <span class="payer-inline__item">
              <IconifyIconOnline icon="ri:user-3-line" class="payer-icon" />
              {{ bill.payerName ?? "—" }}
            </span>
            <span class="payer-sep" />
            <span class="payer-inline__item">
              <IconifyIconOnline icon="ri:phone-line" class="payer-icon" />
              {{ bill.payerPhone ?? "—" }}
            </span>
            <span class="payer-sep" />
            <span class="payer-inline__item payer-inline__item--addr">
              <IconifyIconOnline icon="ri:map-pin-2-line" class="payer-icon" />
              {{ bill.roomAddress ?? "—" }}
            </span>
          </div>
        </div>

        <div class="pay-fields">
          <!-- 行一：支付方式 + 支付时间 -->
          <el-form-item label="支付方式" prop="payChannel" class="no-mb">
            <el-select v-model="form.payChannel" placeholder="请选择支付方式" class="w-full">
              <el-option v-for="item in payChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="支付时间" prop="payAt" class="no-mb">
            <el-date-picker v-model="form.payAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w-full" placeholder="请选择支付时间" />
          </el-form-item>

          <!-- 行二：交易流水号（独占全行） -->
          <el-form-item label="交易流水号" class="no-mb pay-field--full">
            <el-input v-model="form.thirdTradeNo" placeholder="选填，银行或第三方平台的交易流水号" clearable class="w-full">
              <template #prefix>
                <IconifyIconOnline icon="ri:barcode-line" class="input-icon" />
              </template>
            </el-input>
          </el-form-item>

          <!-- 行三：支付凭证 + 支付备注 并排 -->
          <div class="voucher-remark-row">
            <el-form-item class="no-mb">
              <template #label>
                支付凭证
                <span class="label-optional">选填</span>
              </template>
              <UploadImage v-model="paymentVoucherList" :limit="1" :width="96" :height="96">
                <template #tip="{ limit }">请上传支付凭证图片</template>
              </UploadImage>
            </el-form-item>

            <el-form-item class="no-mb remark-item">
              <template #label>
                支付备注
                <span class="label-optional">选填</span>
              </template>
              <el-input
                v-model="form.payRemark"
                type="textarea"
                :rows="4"
                maxlength="200"
                show-word-limit
                placeholder="记录本次收款的补充说明，如付款人、特殊情况等"
                class="remark-textarea"
              />
            </el-form-item>
          </div>
        </div>
      </div>

      <!-- ③ 费用项分配 -->
      <div class="section-block section-block--table mb-3">
        <div class="alloc-header">
          <div class="section-block__title" style="padding: 0">
            <IconifyIconOnline icon="ri:list-check-3" class="section-icon section-icon--indigo" />
            费用项分配
            <span class="section-sub">各项不可超过待收金额</span>
          </div>
          <div class="alloc-btns">
            <el-button size="small" text bg @click="clearAllocation">
              <IconifyIconOnline icon="ri:eraser-line" class="mr-1" />
              清空
            </el-button>
            <el-button size="small" type="primary" plain @click="fillAllUnpaid">
              <IconifyIconOnline icon="ri:check-double-line" class="mr-1" />
              全部收清
            </el-button>
          </div>
        </div>

        <div class="fee-thead">
          <div class="fc fc-name">费用项</div>
          <div class="fc fc-cycle">费用周期</div>
          <div class="fc fc-amt text-right">应收</div>
          <div class="fc fc-amt text-right">已收</div>
          <div class="fc fc-amt text-right">待收</div>
          <div class="fc fc-collect text-right">本次收款</div>
        </div>

        <div class="fee-tbody">
          <div v-for="item in allocationList" :key="item.leaseBillFeeId" class="fee-row">
            <div class="fc fc-name">
              <p class="fee-name">{{ item.feeName ?? "—" }}</p>
              <span class="fee-tag">{{ feeTypeText(item.feeType) }}</span>
            </div>
            <div class="fc fc-cycle">
              <span class="cycle-date">{{ formatDate(item.feeStartDate) }}</span>
              <span class="cycle-sep">～</span>
              <span class="cycle-date">{{ formatDate(item.feeEndDate) }}</span>
            </div>
            <div class="fc fc-amt text-right">
              <span class="n-default">¥{{ moneyText(item.amount) }}</span>
            </div>
            <div class="fc fc-amt text-right">
              <span class="n-muted">¥{{ moneyText(item.paidAmount) }}</span>
            </div>
            <div class="fc fc-amt text-right">
              <span class="n-warn">¥{{ moneyText(item.unpaidAmount) }}</span>
            </div>
            <div class="fc fc-collect">
              <el-input-number
                v-model="item.collectAmount"
                :min="collectAmountMin(item)"
                :max="collectAmountMax(item)"
                :precision="2"
                controls-position="right"
                class="collect-num"
              />
            </div>
          </div>

          <div v-if="!allocationList.length" class="fee-empty">
            <IconifyIconOnline icon="ri:inbox-line" class="fee-empty__icon" />
            <span>暂无费用项</span>
          </div>
        </div>

        <div class="alloc-footer">
          <div class="af-item">
            <span class="af-label">{{ isRefundBill ? "本次退款" : "本次合计" }}</span>
            <strong class="af-val">¥{{ moneyText(allocatedAmount) }}</strong>
          </div>
          <div class="af-sep" />
          <div class="af-item">
            <span class="af-label">{{ isRefundBill ? "退款后累计已退" : "收款后累计已收" }}</span>
            <strong class="af-val">¥{{ moneyText(nextPaidAmount) }}</strong>
          </div>
          <div class="af-sep" />
          <div class="af-item">
            <span class="af-label">{{ isRefundBill ? "退款后待退" : "收款后待收" }}</span>
            <strong class="af-val" :class="nextUnpaidAmount > 0 ? 'af-val--warn' : 'af-val--ok'">¥{{ moneyText(nextUnpaidAmount) }}</strong>
          </div>
        </div>
      </div>

      <!-- ④ 收款结果预览 -->
      <div class="section-block mb-2">
        <div class="section-block__title">
          <IconifyIconOnline icon="ri:pie-chart-2-line" class="section-icon section-icon--emerald" />
          收款结果预览
        </div>

        <div class="preview-body">
          <div class="prog-row">
            <div class="prog-badges">
              <span
                class="status-pill"
                :class="{
                  'pill--paid': resolvedPayStatus === 2,
                  'pill--partial': resolvedPayStatus === 1,
                  'pill--unpaid': resolvedPayStatus === 0
                }"
              >
                {{ displayStatusText }}
              </span>
              <span v-if="isOverdue && resolvedPayStatus !== 2" class="pill--overdue">逾期</span>
              <span class="prog-pct">{{ collectProgressText }}</span>
            </div>
            <div class="prog-track">
              <div class="prog-fill" :style="{ width: collectProgressPercent + '%', background: collectProgressColor }" />
            </div>
          </div>

          <div class="metrics-grid">
            <div v-for="m in previewMetrics" :key="m.label" class="metric-cell">
              <span class="metric-cell__label">{{ m.label }}</span>
              <strong class="metric-cell__val" :class="m.warn ? 'metric-val--warn' : ''">
                {{ m.value }}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from "vue";
  import { ElMessage } from "element-plus";
  import type { FormInstance, FormRules } from "element-plus";
  import type { LeaseBillCollectDto, LeaseBillCollectItemDto, LeaseBillFeeVo, LeaseBillListVo } from "@/types";
  import { PaymentFlowChannelEnumMeta } from "@/types";
  import UploadImage from "@/components/upload/UploadImage.vue";

  interface Props {
    bill: LeaseBillListVo;
  }
  interface AllocationItem extends LeaseBillFeeVo {
    leaseBillFeeId?: string;
    collectAmount: number;
  }

  const props = defineProps<Props>();
  const formRef = ref<FormInstance>();
  const allocationList = ref<AllocationItem[]>([]);
  const paymentVoucherList = ref<string[]>([]);

  function currentDateTime() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  const form = reactive<LeaseBillCollectDto>({
    id: props.bill.id,
    totalAmount: 0,
    payChannel: undefined,
    thirdTradeNo: undefined,
    paymentVoucherUrl: undefined,
    payRemark: undefined,
    payAt: currentDateTime(),
    items: []
  });

  const payChannelMap: Record<string, number> = {
    CASH: 1,
    TRANSFER: 2,
    ALIPAY: 3,
    WECHAT: 4,
    POS: 5,
    OTHER: 5
  };
  const payChannelOptions = Object.values(PaymentFlowChannelEnumMeta)
    .map(item => ({ label: item.label, value: payChannelMap[item.code] }))
    .filter((item, index, list) => item.value != null && list.findIndex(o => o.value === item.value) === index);

  const rules = reactive<FormRules>({
    totalAmount: [{ required: true, message: "请输入本次收款总额", trigger: "blur" }],
    payChannel: [{ required: true, message: "请选择支付方式", trigger: "change" }],
    payAt: [{ required: true, message: "请选择支付时间", trigger: "change" }]
  });

  const allocatedAmount = computed(() => allocationList.value.reduce((s, i) => s + Number(i.collectAmount ?? 0), 0));
  const nextPaidAmount = computed(() => Number(props.bill.paidAmount ?? 0) + allocatedAmount.value);
  const nextUnpaidAmount = computed(() => Number(props.bill.totalAmount ?? 0) - nextPaidAmount.value);
  const isRefundBill = computed(() => Number(props.bill.totalAmount ?? 0) < 0 || Number(props.bill.unpaidAmount ?? 0) < 0);
  const resolvedPayStatus = computed(() => {
    const total = Number(props.bill.totalAmount ?? 0);
    if (total < 0) {
      if (nextPaidAmount.value === 0) return 0;
      if (nextPaidAmount.value <= total) return 2;
      return 1;
    }
    if (nextPaidAmount.value <= 0) return 0;
    if (nextPaidAmount.value >= total) return 2;
    return 1;
  });
  const isOverdue = computed(() => {
    if (!props.bill.dueDate || resolvedPayStatus.value === 2) return false;
    return new Date(props.bill.dueDate).getTime() < Date.now();
  });
  const displayStatusText = computed(() => ["未支付", "部分支付", "已支付"][resolvedPayStatus.value]);
  const collectProgressPercent = computed(() => {
    const t = Math.abs(Number(props.bill.totalAmount ?? 0));
    return t <= 0 ? 0 : Number(Math.min((Math.abs(nextPaidAmount.value) / t) * 100, 100).toFixed(2));
  });
  const collectProgressText = computed(() => `${collectProgressPercent.value}%`);
  const collectProgressColor = computed(() => ["var(--collect-text-placeholder)", "var(--collect-warning)", "var(--collect-success)"][resolvedPayStatus.value]);
  const previewMetrics = computed(() => [
    { label: "本次分配合计", value: `¥${moneyText(allocatedAmount.value)}`, warn: false },
    { label: "收款后累计已收", value: `¥${moneyText(nextPaidAmount.value)}`, warn: false },
    { label: "收款后剩余待收", value: `¥${moneyText(nextUnpaidAmount.value)}`, warn: nextUnpaidAmount.value > 0 },
    {
      label: "逾期状态",
      value: isOverdue.value && resolvedPayStatus.value !== 2 ? "已逾期" : "正常",
      warn: isOverdue.value && resolvedPayStatus.value !== 2
    }
  ]);

  const syncItemsToForm = () => {
    form.items = allocationList.value
      .filter(i => Number(i.collectAmount ?? 0) !== 0)
      .map<LeaseBillCollectItemDto>(i => ({
        leaseBillFeeId: i.leaseBillFeeId,
        amount: Number(i.collectAmount ?? 0)
      }));
    form.totalAmount = Number(allocatedAmount.value.toFixed(2));
  };

  watch(
    () => props.bill,
    bill => {
      allocationList.value = (bill.feeList ?? []).map(i => ({
        ...i,
        leaseBillFeeId: i.id,
        collectAmount: Number(i.unpaidAmount ?? 0)
      }));
      paymentVoucherList.value = form.paymentVoucherUrl ? [form.paymentVoucherUrl] : [];
      if (!form.payAt) form.payAt = currentDateTime();
      syncItemsToForm();
    },
    { immediate: true, deep: true }
  );
  watch(allocationList, syncItemsToForm, { deep: true });
  watch(
    paymentVoucherList,
    list => {
      form.paymentVoucherUrl = list?.[0];
    },
    { deep: true }
  );

  const fillAllUnpaid = () =>
    allocationList.value.forEach(i => {
      i.collectAmount = Number(i.unpaidAmount ?? 0);
    });
  const clearAllocation = () =>
    allocationList.value.forEach(i => {
      i.collectAmount = 0;
    });
  const collectAmountMin = (item: AllocationItem) => {
    const unpaidAmount = Number(item.unpaidAmount ?? 0);
    return unpaidAmount < 0 ? unpaidAmount : 0;
  };
  const collectAmountMax = (item: AllocationItem) => {
    const unpaidAmount = Number(item.unpaidAmount ?? 0);
    return unpaidAmount < 0 ? 0 : unpaidAmount;
  };

  const feeTypeText = (t?: string) => (t === "RENTAL" ? "租金" : t === "DEPOSIT" ? "押金" : "其他");
  const moneyText = (v?: number) => Number(v ?? 0).toFixed(2);
  const formatDate = (v?: string) => (v ? v.substring(0, 10) : "—");

  const validate = async () => {
    if (!formRef.value) return false;
    const ok = await formRef.value.validate().catch(() => false);
    if (!ok) return false;
    if (!form.items?.length) {
      ElMessage.warning("请至少分配一条费用项收款金额");
      return false;
    }
    if (Math.abs((form.totalAmount ?? 0) - allocatedAmount.value) > 0.001) {
      ElMessage.warning("收款总额与费用项分配金额不一致");
      return false;
    }
    return true;
  };
  const getFormData = (): LeaseBillCollectDto => ({ ...form });

  defineExpose({ validate, getFormData });
</script>

<style scoped>
  /* ── 外层 ── */
  .collect-wrap {
    --collect-bg: var(--el-bg-color);
    --collect-bg-overlay: var(--el-bg-color-overlay);
    --collect-bg-soft: var(--el-fill-color-light);
    --collect-bg-softer: var(--el-fill-color-lighter);
    --collect-bg-softest: var(--el-fill-color-extra-light);
    --collect-border: var(--el-border-color);
    --collect-border-light: var(--el-border-color-light);
    --collect-border-lighter: var(--el-border-color-lighter);
    --collect-border-extra: var(--el-border-color-extra-light);
    --collect-text-primary: var(--el-text-color-primary);
    --collect-text-regular: var(--el-text-color-regular);
    --collect-text-secondary: var(--el-text-color-secondary);
    --collect-text-placeholder: var(--el-text-color-placeholder);
    --collect-primary: var(--el-color-primary);
    --collect-primary-soft: var(--el-color-primary-light-9);
    --collect-primary-soft-border: var(--el-color-primary-light-7);
    --collect-success: var(--el-color-success);
    --collect-success-soft: var(--el-color-success-light-9);
    --collect-success-soft-border: var(--el-color-success-light-7);
    --collect-warning: var(--el-color-warning);
    --collect-warning-soft: var(--el-color-warning-light-9);
    --collect-warning-soft-border: var(--el-color-warning-light-7);
    --collect-danger: var(--el-color-danger);
    --collect-danger-soft: var(--el-color-danger-light-9);
    --collect-danger-soft-border: var(--el-color-danger-light-7);
    display: flex;
    flex-direction: column;
    padding-bottom: 4px;
  }

  /* ── ① 账单概览条 ── */
  .bill-overview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 16px;
    background: var(--collect-bg-softest);
    border: 1px solid var(--collect-border-light);
    border-radius: 10px;
  }
  .bill-overview__left {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .bill-period-badge {
    width: fit-content;
    padding: 2px 9px;
    border-radius: 5px;
    background: var(--collect-primary-soft);
    color: var(--collect-primary);
    font-size: 12px;
    font-weight: 700;
  }
  .bill-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    font-size: 12px;
    color: var(--collect-text-secondary);
  }
  .bill-meta__item {
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .bill-meta__dot {
    color: var(--collect-text-placeholder);
  }
  .bill-meta__overdue {
    padding: 1px 7px;
    border-radius: 20px;
    background: var(--collect-danger-soft);
    color: var(--collect-danger);
    font-size: 11px;
    font-weight: 700;
    border: 1px solid var(--collect-danger-soft-border);
  }
  .bill-kpi-row {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
    border: 1px solid var(--collect-border-light);
    border-radius: 8px;
    overflow: hidden;
    background: var(--collect-bg-overlay);
  }
  .bill-kpi {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 9px 16px;
  }
  .bill-kpi-divider {
    width: 1px;
    background: var(--collect-border-light);
    flex-shrink: 0;
  }
  .bill-kpi__label {
    font-size: 11px;
    color: var(--collect-text-placeholder);
    white-space: nowrap;
  }
  .bill-kpi__value {
    font-size: 15px;
    font-weight: 700;
    color: var(--collect-text-primary);
    font-variant-numeric: tabular-nums;
  }
  .bill-kpi__value--paid {
    color: var(--collect-success);
  }
  .bill-kpi__value--unpaid {
    color: var(--collect-warning);
  }

  /* ── 通用 Section ── */
  .section-block {
    border: 1px solid var(--collect-border-light);
    border-radius: 10px;
    background: var(--collect-bg-overlay);
    overflow: hidden;
  }

  /* 标题行容器：左标题 + 右付款人 */
  .section-block__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 11px 16px 0;
  }
  .section-block__title {
    display: flex;
    align-items: center;
    gap: 6px;
    /* 独立使用时保留原 padding */
    padding: 12px 16px 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--collect-text-primary);
  }
  /* 在 header 内时，由 header 控制 padding，title 自身不加 */
  .section-block__header > .section-block__title {
    padding: 0;
  }

  .section-icon {
    color: var(--collect-primary);
    font-size: 15px;
    flex-shrink: 0;
  }
  .section-icon--indigo {
    color: var(--collect-primary);
  }
  .section-icon--emerald {
    color: var(--collect-success);
  }
  .section-sub {
    font-size: 11px;
    color: var(--collect-text-placeholder);
    font-weight: 400;
    margin-left: 2px;
  }

  /* 付款人内联 */
  .payer-inline {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 12px;
  }
  .payer-inline__item {
    display: flex;
    align-items: center;
    gap: 3px;
    color: var(--collect-text-regular);
  }
  .payer-inline__item--addr {
    color: var(--collect-text-secondary);
  }
  .payer-icon {
    color: var(--collect-text-placeholder);
    font-size: 13px;
  }
  .payer-sep {
    width: 1px;
    height: 12px;
    background: var(--collect-border-light);
    flex-shrink: 0;
  }

  /* ── ② 支付信息字段区 ── */
  .pay-fields {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px 16px;
    padding: 10px 16px 14px;
    align-items: start;
  }
  .no-mb {
    margin-bottom: 0 !important;
  }

  /* 凭证 + 备注并排 */
  .voucher-remark-row {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    align-items: start;
  }

  /* input 前缀图标 */
  .input-icon {
    color: var(--collect-text-placeholder);
    font-size: 14px;
  }

  /* label 里的"选填"标注 */
  .label-optional {
    font-size: 11px;
    color: var(--collect-text-placeholder);
    font-weight: 400;
    margin-left: 3px;
  }

  /* 备注撑满、禁止手动 resize */
  .remark-item {
    width: 100%;
  }
  .remark-textarea :deep(.el-textarea__inner) {
    resize: none;
  }

  /* ── ③ 费用分配表 ── */
  .alloc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 16px 0;
  }
  .alloc-btns {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .fee-thead,
  .fee-row {
    display: grid;
    grid-template-columns: 1fr 150px 88px 88px 88px 148px;
    align-items: center;
    gap: 0;
    padding: 0 16px;
  }
  .fee-thead {
    margin-top: 8px;
    padding-top: 7px;
    padding-bottom: 7px;
    background: var(--collect-bg-softest);
    border-top: 1px solid var(--collect-border-extra);
    border-bottom: 1px solid var(--collect-border-lighter);
    font-size: 11px;
    font-weight: 600;
    color: var(--collect-text-placeholder);
    letter-spacing: 0.03em;
  }
  .fee-row {
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--collect-border-extra);
    transition: background 0.1s;
  }
  .fee-row:last-child {
    border-bottom: none;
  }
  .fee-row:hover {
    background: var(--collect-bg-softest);
  }

  .fc {
    display: flex;
    align-items: center;
    min-width: 0;
  }
  .fc-name {
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
  }
  .fc-cycle {
    flex-direction: row;
    align-items: center;
    gap: 3px;
    flex-wrap: nowrap;
    overflow: hidden;
  }
  .fc-amt {
    padding-left: 6px;
  }
  .fc-collect {
    justify-content: flex-end;
    padding-left: 8px;
  }
  .text-right {
    justify-content: flex-end;
  }

  .fee-name {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--collect-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    line-height: 1.4;
  }
  .fee-tag {
    display: inline-flex;
    align-items: center;
    height: 16px;
    padding: 0 5px;
    border-radius: 3px;
    background: var(--collect-bg-soft);
    color: var(--collect-text-secondary);
    font-size: 10px;
    font-weight: 500;
  }
  .cycle-date {
    font-size: 11px;
    color: var(--collect-text-secondary);
    white-space: nowrap;
  }
  .cycle-sep {
    font-size: 10px;
    color: var(--collect-text-placeholder);
    flex-shrink: 0;
  }
  .n-default {
    font-size: 13px;
    color: var(--collect-text-regular);
    font-variant-numeric: tabular-nums;
  }
  .n-muted {
    font-size: 13px;
    color: var(--collect-text-placeholder);
    font-variant-numeric: tabular-nums;
  }
  .n-warn {
    font-size: 13px;
    color: var(--collect-warning);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .collect-num {
    width: 132px !important;
  }

  .fee-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 28px 0;
    color: var(--collect-text-placeholder);
    font-size: 13px;
  }
  .fee-empty__icon {
    font-size: 20px;
  }

  .alloc-footer {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    background: var(--collect-bg-softest);
    border-top: 1px solid var(--collect-border-lighter);
  }
  .af-item {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
  }
  .af-sep {
    width: 1px;
    height: 18px;
    background: var(--collect-border-light);
    margin: 0 12px;
    flex-shrink: 0;
  }
  .af-label {
    font-size: 11px;
    color: var(--collect-text-placeholder);
  }
  .af-val {
    font-size: 13px;
    font-weight: 700;
    color: var(--collect-text-primary);
    font-variant-numeric: tabular-nums;
  }
  .af-val--warn {
    color: var(--collect-warning);
  }
  .af-val--ok {
    color: var(--collect-success);
  }

  /* ── ④ 结果预览 ── */
  .preview-body {
    padding: 12px 16px 14px;
  }
  .prog-row {
    margin-bottom: 12px;
  }
  .prog-badges {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .status-pill {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
  }
  .pill--paid {
    background: var(--collect-success-soft);
    color: var(--collect-success);
    border: 1px solid var(--collect-success-soft-border);
  }
  .pill--partial {
    background: var(--collect-warning-soft);
    color: var(--collect-warning);
    border: 1px solid var(--collect-warning-soft-border);
  }
  .pill--unpaid {
    background: var(--collect-bg-softest);
    color: var(--collect-text-secondary);
    border: 1px solid var(--collect-border-light);
  }
  .pill--overdue {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 7px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    background: var(--collect-danger-soft);
    color: var(--collect-danger);
    border: 1px solid var(--collect-danger-soft-border);
  }
  .prog-pct {
    margin-left: auto;
    font-size: 12px;
    font-weight: 700;
    color: var(--collect-text-primary);
    font-variant-numeric: tabular-nums;
  }
  .prog-track {
    height: 5px;
    background: var(--collect-border-light);
    border-radius: 999px;
    overflow: hidden;
  }
  .prog-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.5s ease;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .metric-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 10px;
    border-radius: 7px;
    background: var(--collect-bg-softest);
    border: 1px solid var(--collect-border-extra);
  }
  .metric-cell__label {
    font-size: 11px;
    color: var(--collect-text-placeholder);
  }
  .metric-cell__val {
    font-size: 13px;
    font-weight: 700;
    color: var(--collect-text-primary);
    font-variant-numeric: tabular-nums;
  }
  .metric-val--warn {
    color: var(--collect-warning);
  }

  /* ── Element Plus 覆盖 ── */
  :deep(.el-input-number) {
    width: 100%;
  }
  :deep(.el-input-number .el-input__wrapper) {
    border-radius: 6px;
  }
  :deep(.el-date-editor.el-input),
  :deep(.el-date-editor.el-input__wrapper) {
    width: 100% !important;
  }
  :deep(.el-form-item__label) {
    font-size: 12px;
    color: var(--collect-text-secondary);
    font-weight: 500;
    padding-bottom: 4px;
    line-height: 1.4;
  }
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  /* 辅助间距 */
  .mb-2 {
    margin-bottom: 8px;
  }
  .mb-3 {
    margin-bottom: 12px;
  }
</style>
