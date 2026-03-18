<template>
  <div class="collect-wrap">
    <!-- ① 账单概览条：无大色块，信息清晰可读 -->
    <div class="bill-overview mb-2">
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
      <div class="section-block mb-2">
        <div class="section-block__title">
          <IconifyIconOnline icon="ri:bank-card-line" class="section-icon" />
          支付信息
        </div>
        <div class="pay-fields">
          <el-form-item label="支付方式" prop="payChannel" class="no-mb">
            <el-select v-model="form.payChannel" placeholder="请选择支付方式" class="w-full">
              <el-option v-for="item in payChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="支付时间" prop="payTime" class="no-mb">
            <el-date-picker v-model="form.payTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w-full" placeholder="请选择支付时间" />
          </el-form-item>
          <!-- 付款人信息小条 -->
          <div class="tenant-strip">
            <span class="tenant-strip__k">付款人</span>
            <span class="tenant-strip__v">{{ bill.payerName ?? "—" }}</span>
            <span class="tenant-strip__sep" />
            <span class="tenant-strip__k">联系电话</span>
            <span class="tenant-strip__v">{{ bill.payerPhone ?? "—" }}</span>
            <span class="tenant-strip__sep" />
            <span class="tenant-strip__k">地址</span>
            <span class="tenant-strip__v tenant-strip__v--addr">{{ bill.roomAddress ?? "—" }}</span>
          </div>
        </div>
      </div>

      <!-- ③ 费用项分配 ─ 核心区域，充分利用宽度 -->
      <div class="section-block section-block--table mb-2">
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

        <!-- 表头 -->
        <div class="fee-thead">
          <div class="fc fc-name">费用项</div>
          <div class="fc fc-cycle">费用周期</div>
          <div class="fc fc-amt text-right">应收</div>
          <div class="fc fc-amt text-right">已收</div>
          <div class="fc fc-amt text-right">待收</div>
          <div class="fc fc-collect text-right">本次收款</div>
        </div>

        <!-- 数据行 -->
        <div class="fee-tbody">
          <div v-for="item in allocationList" :key="item.leaseBillFeeId" class="fee-row">
            <div class="fc fc-name">
              <p class="fee-name">{{ item.feeName ?? "—" }}</p>
              <span class="fee-tag">{{ feeTypeText(item.feeType) }}</span>
            </div>
            <div class="fc fc-cycle">
              <span class="cycle-date">{{ formatDate(item.feeStart) }}</span>
              <span class="cycle-sep">～</span>
              <span class="cycle-date">{{ formatDate(item.feeEnd) }}</span>
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
              <el-input-number v-model="item.collectAmount" :min="0" :max="Number(item.unpaidAmount ?? 0)" :precision="2" controls-position="right" class="collect-num" />
            </div>
          </div>

          <div v-if="!allocationList.length" class="fee-empty">
            <IconifyIconOnline icon="ri:inbox-line" class="fee-empty__icon" />
            <span>暂无费用项</span>
          </div>
        </div>

        <!-- 汇总栏 -->
        <div class="alloc-footer">
          <div class="af-item">
            <span class="af-label">本次合计</span>
            <strong class="af-val">¥{{ moneyText(allocatedAmount) }}</strong>
          </div>
          <div class="af-sep" />
          <div class="af-item">
            <span class="af-label">收款后累计已收</span>
            <strong class="af-val">¥{{ moneyText(nextPaidAmount) }}</strong>
          </div>
          <div class="af-sep" />
          <div class="af-item">
            <span class="af-label">收款后待收</span>
            <strong class="af-val" :class="nextUnpaidAmount > 0 ? 'af-val--warn' : 'af-val--ok'">¥{{ moneyText(nextUnpaidAmount) }}</strong>
          </div>
        </div>
      </div>

      <!-- ④ 结果预览 ─ 进度条 + 四格指标 -->
      <div class="section-block mb-2">
        <div class="section-block__title">
          <IconifyIconOnline icon="ri:pie-chart-2-line" class="section-icon section-icon--emerald" />
          收款结果预览
        </div>

        <div class="preview-body">
          <!-- 状态 + 进度 -->
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

          <!-- 四格指标 -->
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
  import { PaymentFlowChannelEnumMeta } from "@/types/generated/enum.meta";

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

  const form = reactive<LeaseBillCollectDto>({
    id: props.bill.id,
    totalAmount: 0,
    payChannel: undefined,
    payTime: undefined,
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
    payTime: [{ required: true, message: "请选择支付时间", trigger: "change" }]
  });

  const allocatedAmount = computed(() => allocationList.value.reduce((s, i) => s + Number(i.collectAmount ?? 0), 0));
  const nextPaidAmount = computed(() => Number(props.bill.paidAmount ?? 0) + allocatedAmount.value);
  const nextUnpaidAmount = computed(() => Math.max(Number(props.bill.totalAmount ?? 0) - nextPaidAmount.value, 0));
  const resolvedPayStatus = computed(() => {
    if (nextPaidAmount.value <= 0) return 0;
    if (nextPaidAmount.value >= Number(props.bill.totalAmount ?? 0)) return 2;
    return 1;
  });
  const isOverdue = computed(() => {
    if (!props.bill.dueDate || resolvedPayStatus.value === 2) return false;
    return new Date(props.bill.dueDate).getTime() < Date.now();
  });
  const displayStatusText = computed(() => ["未支付", "部分支付", "已支付"][resolvedPayStatus.value]);
  const collectProgressPercent = computed(() => {
    const t = Number(props.bill.totalAmount ?? 0);
    return t <= 0 ? 0 : Number(Math.min((nextPaidAmount.value / t) * 100, 100).toFixed(2));
  });
  const collectProgressText = computed(() => `${collectProgressPercent.value}%`);
  const collectProgressColor = computed(() => ["#94a3b8", "#f59e0b", "#10b981"][resolvedPayStatus.value]);

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
      .filter(i => Number(i.collectAmount ?? 0) > 0)
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
      syncItemsToForm();
    },
    { immediate: true, deep: true }
  );

  watch(allocationList, syncItemsToForm, { deep: true });

  const fillAllUnpaid = () =>
    allocationList.value.forEach(i => {
      i.collectAmount = Number(i.unpaidAmount ?? 0);
    });
  const clearAllocation = () =>
    allocationList.value.forEach(i => {
      i.collectAmount = 0;
    });

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

  const getFormData = (): LeaseBillCollectDto => ({
    id: form.id,
    totalAmount: form.totalAmount,
    payChannel: form.payChannel,
    payTime: form.payTime,
    items: form.items
  });

  defineExpose({ validate, getFormData });
</script>

<style scoped>
  /* ────────── 外层 ────────── */
  .collect-wrap {
    display: flex;
    flex-direction: column;
    padding-bottom: 4px;
  }

  /* ────────── ① 账单概览条 ────────── */
  .bill-overview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 12px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
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
    background: #eff6ff;
    color: #2563eb;
    font-size: 12px;
    font-weight: 700;
  }

  .bill-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    font-size: 12px;
    color: #64748b;
  }
  .bill-meta__item {
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .bill-meta__dot {
    color: #cbd5e1;
  }
  .bill-meta__overdue {
    padding: 1px 7px;
    border-radius: 20px;
    background: #fef2f2;
    color: #dc2626;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid #fecaca;
  }

  /* KPI 三格 */
  .bill-kpi-row {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }
  .bill-kpi {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 9px 16px;
  }
  .bill-kpi-divider {
    width: 1px;
    background: #e2e8f0;
    flex-shrink: 0;
  }
  .bill-kpi__label {
    font-size: 11px;
    color: #94a3b8;
    white-space: nowrap;
  }
  .bill-kpi__value {
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
    font-variant-numeric: tabular-nums;
  }
  .bill-kpi__value--paid {
    color: #059669;
  }
  .bill-kpi__value--unpaid {
    color: #d97706;
  }

  /* ────────── 通用 Section Block ────────── */
  .section-block {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
    overflow: hidden;
  }

  .section-block__title {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 16px 0;
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }

  .section-icon {
    color: #3b82f6;
    font-size: 15px;
    flex-shrink: 0;
  }
  .section-icon--indigo {
    color: #6366f1;
  }
  .section-icon--emerald {
    color: #059669;
  }

  .section-sub {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 400;
    margin-left: 2px;
  }

  /* ────────── ② 支付信息 ────────── */
  .pay-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 16px;
    padding: 10px 16px 14px;
    align-items: end;
  }

  .no-mb {
    margin-bottom: 0 !important;
  }

  .tenant-strip {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 7px 12px;
    background: #f8fafc;
    border-radius: 6px;
    font-size: 12px;
  }
  .tenant-strip__k {
    color: #94a3b8;
  }
  .tenant-strip__v {
    color: #334155;
    font-weight: 500;
  }
  .tenant-strip__v--addr {
    color: #475569;
  }
  .tenant-strip__sep {
    width: 1px;
    height: 12px;
    background: #e2e8f0;
  }

  /* ────────── ③ 费用分配表 ────────── */
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

  /* 列宽定义 — 6列布局，确保本次收款列足够宽 */
  .fee-thead,
  .fee-row {
    display: grid;
    /* 费用名 | 周期 | 应收 | 已收 | 待收 | 本次收款 */
    grid-template-columns: 1fr 150px 88px 88px 88px 148px;
    align-items: center;
    text-align: center;
    gap: 0;
    padding: 0 16px;
  }

  .fee-thead {
    margin-top: 8px;
    padding-top: 7px;
    padding-bottom: 7px;
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #e8edf4;
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    letter-spacing: 0.03em;
  }

  .fee-row {
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.1s;
  }
  .fee-row:last-child {
    border-bottom: none;
  }
  .fee-row:hover {
    background: #fafbff;
  }

  /* 列 */
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
    color: #1e293b;
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
    background: #f1f5f9;
    color: #64748b;
    font-size: 10px;
    font-weight: 500;
  }

  .cycle-date {
    font-size: 11px;
    color: #64748b;
    white-space: nowrap;
  }
  .cycle-sep {
    font-size: 10px;
    color: #cbd5e1;
    flex-shrink: 0;
  }

  .n-default {
    font-size: 13px;
    color: #475569;
    font-variant-numeric: tabular-nums;
  }
  .n-muted {
    font-size: 13px;
    color: #94a3b8;
    font-variant-numeric: tabular-nums;
  }
  .n-warn {
    font-size: 13px;
    color: #d97706;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  /* 本次收款输入框：填满列宽 */
  .collect-num {
    width: 132px !important;
  }

  /* 空状态 */
  .fee-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 28px 0;
    color: #94a3b8;
    font-size: 13px;
  }
  .fee-empty__icon {
    font-size: 20px;
  }

  /* 汇总栏 */
  .alloc-footer {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    background: #f8fafc;
    border-top: 1px solid #e8edf4;
    gap: 0;
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
    background: #e2e8f0;
    margin: 0 12px;
    flex-shrink: 0;
  }
  .af-label {
    font-size: 11px;
    color: #94a3b8;
  }
  .af-val {
    font-size: 13px;
    font-weight: 700;
    color: #334155;
    font-variant-numeric: tabular-nums;
  }
  .af-val--warn {
    color: #d97706;
  }
  .af-val--ok {
    color: #059669;
  }

  /* ────────── ④ 结果预览 ────────── */
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
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }
  .pill--partial {
    background: #fffbeb;
    color: #d97706;
    border: 1px solid #fde68a;
  }
  .pill--unpaid {
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }
  .pill--overdue {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 7px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .prog-pct {
    margin-left: auto;
    font-size: 12px;
    font-weight: 700;
    color: #334155;
    font-variant-numeric: tabular-nums;
  }

  .prog-track {
    height: 5px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
  }
  .prog-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.5s ease;
  }

  /* 四格指标 */
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
    background: #f8fafc;
    border: 1px solid #f1f5f9;
  }
  .metric-cell__label {
    font-size: 11px;
    color: #94a3b8;
  }
  .metric-cell__val {
    font-size: 13px;
    font-weight: 700;
    color: #334155;
    font-variant-numeric: tabular-nums;
  }
  .metric-val--warn {
    color: #d97706;
  }

  /* ────────── Element Plus 覆盖 ────────── */
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
    color: #64748b;
    font-weight: 500;
    padding-bottom: 4px;
    line-height: 1.4;
  }
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
</style>
