<template>
  <div class="collect-dialog flex flex-col gap-4 pb-2">
    <!-- ═══════════════ Header Strip ═══════════════ -->
    <div class="header-strip relative overflow-hidden rounded-xl px-5 py-4 text-white">
      <!-- Background layers -->
      <div class="header-bg" />
      <div class="header-noise" />

      <div class="relative flex flex-wrap items-center justify-between gap-4">
        <!-- Left: Bill Identity -->
        <div class="flex items-center gap-3.5">
          <div class="bill-icon-wrap flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm">
            <IconifyIconOnline icon="ri:file-text-line" class="text-lg" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="bill-badge rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">账单收款</span>
              <span class="text-[10px] text-white/50">·</span>
              <span class="text-xs text-white/60">第 {{ bill.sortOrder ?? "—" }} 期</span>
            </div>
            <div class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span class="flex items-center gap-1 text-xs text-white/70">
                <IconifyIconOnline icon="ri:calendar-2-line" class="text-[11px]" />
                {{ formatDate(bill.billStart) }} — {{ formatDate(bill.billEnd) }}
              </span>
              <span class="flex items-center gap-1 text-xs text-white/70">
                <IconifyIconOnline icon="ri:alarm-line" class="text-[11px]" />
                应缴 {{ formatDate(bill.dueDate) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right: KPI Trio -->
        <div class="flex items-stretch gap-px overflow-hidden rounded-lg border border-white/15 bg-white/10 backdrop-blur-sm">
          <div class="kpi-cell flex flex-col justify-center gap-0.5 px-4 py-2.5">
            <span class="text-[10px] text-white/55">账单应收</span>
            <span class="text-base font-bold tabular-nums leading-tight">¥{{ moneyText(bill.totalAmount) }}</span>
          </div>
          <div class="kpi-divider w-px self-stretch bg-white/15" />
          <div class="kpi-cell flex flex-col justify-center gap-0.5 px-4 py-2.5">
            <span class="text-[10px] text-white/55">累计已收</span>
            <span class="text-base font-bold tabular-nums leading-tight text-emerald-300">¥{{ moneyText(bill.paidAmount) }}</span>
          </div>
          <div class="kpi-divider w-px self-stretch bg-white/15" />
          <div class="kpi-cell flex flex-col justify-center gap-0.5 px-4 py-2.5">
            <span class="text-[10px] text-white/55">当前待收</span>
            <span class="text-base font-bold tabular-nums leading-tight text-amber-300">¥{{ moneyText(bill.unpaidAmount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════ Body ═══════════════ -->
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="form-body">
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_292px]">
        <!-- ── Left Column ── -->
        <div class="flex flex-col gap-4">
          <!-- Payment Info -->
          <section class="section-card p-5">
            <div class="section-header mb-4 flex items-center gap-2">
              <IconifyIconOnline icon="ri:bank-card-line" class="section-icon text-base text-blue-500" />
              <span class="text-sm font-semibold text-slate-700">支付信息</span>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <el-form-item label="支付方式" prop="payChannel" class="mb-0">
                <el-select v-model="form.payChannel" class="w-full" placeholder="请选择支付方式">
                  <el-option v-for="item in payChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="支付时间" prop="payTime" class="mb-0">
                <el-date-picker v-model="form.payTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w-full" placeholder="请选择支付时间" />
              </el-form-item>
            </div>

            <!-- Summary strip -->
            <div class="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/60">
              <div class="flex flex-col gap-0.5 px-4 py-3">
                <span class="text-[11px] text-slate-400">本次收款合计</span>
                <strong class="text-sm font-bold tabular-nums text-blue-600">¥{{ moneyText(form.totalAmount) }}</strong>
              </div>
              <div class="flex flex-col gap-0.5 px-4 py-3">
                <span class="text-[11px] text-slate-400">收款后累计已收</span>
                <strong class="text-sm font-bold tabular-nums text-slate-700">¥{{ moneyText(nextPaidAmount) }}</strong>
              </div>
              <div class="flex flex-col gap-0.5 px-4 py-3">
                <span class="text-[11px] text-slate-400">收款后待收</span>
                <strong class="text-sm font-bold tabular-nums" :class="nextUnpaidAmount > 0 ? 'text-amber-600' : 'text-emerald-600'">¥{{ moneyText(nextUnpaidAmount) }}</strong>
              </div>
            </div>
          </section>

          <!-- Allocation Table -->
          <section class="section-card overflow-hidden">
            <!-- Card header -->
            <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
              <div class="flex items-center gap-2">
                <IconifyIconOnline icon="ri:list-check-3" class="section-icon text-base text-indigo-500" />
                <div>
                  <p class="text-sm font-semibold text-slate-700">费用项分配</p>
                  <p class="text-[11px] text-slate-400">填写各费用项本次实收金额，不可超过待收金额</p>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-1.5">
                <el-button size="small" text bg @click="clearAllocation">
                  <IconifyIconOnline icon="ri:eraser-line" class="mr-1" />
                  清空
                </el-button>
                <el-button size="small" type="primary" @click="fillAllUnpaid">
                  <IconifyIconOnline icon="ri:check-double-line" class="mr-1" />
                  全部收清
                </el-button>
              </div>
            </div>

            <!-- Table head -->
            <div class="alloc-grid items-center bg-slate-50/80 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <div>费用项</div>
              <div>周期</div>
              <div class="text-right">应收</div>
              <div class="text-right">已收</div>
              <div class="text-right">待收</div>
              <div class="text-right">本次收款</div>
            </div>

            <!-- Table rows -->
            <div class="alloc-rows">
              <div
                v-for="item in allocationList"
                :key="item.leaseBillFeeId"
                class="alloc-grid alloc-row items-center border-t border-slate-100 px-5 py-3 text-sm transition-colors hover:bg-slate-50/70"
              >
                <div class="flex min-w-0 flex-col gap-1">
                  <span class="truncate font-medium text-slate-800">{{ item.feeName ?? "—" }}</span>
                  <span class="fee-type-tag w-fit rounded px-1.5 py-px text-[10px]">{{ feeTypeText(item.feeType) }}</span>
                </div>
                <div class="text-[11px] leading-relaxed text-slate-400">
                  <div>{{ formatDate(item.feeStart) }}</div>
                  <div>{{ formatDate(item.feeEnd) }}</div>
                </div>
                <div class="text-right tabular-nums text-slate-600">¥{{ moneyText(item.amount) }}</div>
                <div class="text-right tabular-nums text-slate-400">¥{{ moneyText(item.paidAmount) }}</div>
                <div class="text-right font-medium tabular-nums text-amber-600">¥{{ moneyText(item.unpaidAmount) }}</div>
                <div>
                  <el-input-number v-model="item.collectAmount" :min="0" :max="Number(item.unpaidAmount ?? 0)" :precision="2" controls-position="right" class="w-full" />
                </div>
              </div>
            </div>

            <!-- Table footer -->
            <div class="flex items-center gap-1.5 border-t border-slate-200 bg-slate-50 px-5 py-2.5 text-xs">
              <span class="text-slate-400">分配合计</span>
              <span class="font-bold tabular-nums text-slate-700">¥{{ moneyText(allocatedAmount) }}</span>
              <span class="mx-1.5 text-slate-300">|</span>
              <span class="text-slate-400">剩余待收</span>
              <span class="font-bold tabular-nums" :class="nextUnpaidAmount > 0 ? 'text-amber-600' : 'text-emerald-600'">¥{{ moneyText(nextUnpaidAmount) }}</span>
            </div>
          </section>
        </div>

        <!-- ── Right Column ── -->
        <div class="flex flex-col gap-4">
          <!-- Result Preview -->
          <section class="section-card p-5">
            <div class="section-header mb-3 flex items-center gap-2">
              <IconifyIconOnline icon="ri:eye-line" class="section-icon text-base text-indigo-500" />
              <span class="text-sm font-semibold text-slate-700">结果预览</span>
            </div>

            <!-- Status + Overdue -->
            <div class="mb-3 flex flex-wrap items-center gap-1.5">
              <span
                class="status-pill rounded-full px-3 py-1 text-xs font-bold"
                :class="{
                  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200': resolvedPayStatus === 2,
                  'bg-amber-50 text-amber-700 ring-1 ring-amber-200': resolvedPayStatus === 1,
                  'bg-slate-100 text-slate-600 ring-1 ring-slate-200': resolvedPayStatus === 0
                }"
              >
                {{ displayStatusText }}
              </span>
              <span v-if="isOverdue && resolvedPayStatus !== 2" class="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-500 ring-1 ring-red-200">逾期</span>
            </div>

            <!-- Progress bar -->
            <div class="mb-4 rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-[11px] text-slate-400">收款进度</span>
                <span class="text-xs font-bold text-slate-700">{{ collectProgressText }}</span>
              </div>
              <div class="progress-track h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div class="progress-bar h-full rounded-full transition-all duration-500" :style="{ width: collectProgressPercent + '%', background: collectProgressColor }" />
              </div>
            </div>

            <!-- Metrics list -->
            <ul class="flex flex-col gap-1.5">
              <li v-for="m in previewMetrics" :key="m.label" class="metric-row flex items-center justify-between rounded-lg px-3.5 py-2.5">
                <span class="text-[11px] text-slate-400">{{ m.label }}</span>
                <strong class="text-xs font-bold tabular-nums" :class="m.warn ? 'text-amber-600' : 'text-slate-700'">
                  {{ m.value }}
                </strong>
              </li>
            </ul>
          </section>

          <!-- Payer Info -->
          <section class="section-card p-5">
            <div class="section-header mb-3 flex items-center gap-2">
              <IconifyIconOnline icon="ri:user-line" class="section-icon text-base text-slate-400" />
              <span class="text-sm font-semibold text-slate-700">租客信息</span>
            </div>
            <dl class="flex flex-col divide-y divide-slate-100">
              <div class="flex items-baseline justify-between gap-3 py-2.5 first:pt-0">
                <dt class="shrink-0 text-[11px] text-slate-400">付款人</dt>
                <dd class="text-sm font-medium text-slate-700">{{ bill.payerName ?? "—" }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-3 py-2.5">
                <dt class="shrink-0 text-[11px] text-slate-400">联系电话</dt>
                <dd class="text-sm font-medium tabular-nums text-slate-700">{{ bill.payerPhone ?? "—" }}</dd>
              </div>
              <div class="flex flex-col gap-1 py-2.5 pb-0">
                <dt class="text-[11px] text-slate-400">房源地址</dt>
                <dd class="break-all text-xs leading-relaxed text-slate-600">{{ bill.roomAddress ?? "—" }}</dd>
              </div>
            </dl>
          </section>
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

  // ── vue-pure-admin 全局注册了 IconifyIconOnline，直接使用即可

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

  // ── Computed ──
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

  // ── Sync form items ──
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
        collectAmount: 0
      }));
      syncItemsToForm();
    },
    { immediate: true, deep: true }
  );

  watch(allocationList, syncItemsToForm, { deep: true });

  // ── Actions ──
  const fillAllUnpaid = () =>
    allocationList.value.forEach(i => {
      i.collectAmount = Number(i.unpaidAmount ?? 0);
    });
  const clearAllocation = () =>
    allocationList.value.forEach(i => {
      i.collectAmount = 0;
    });

  // ── Helpers ──
  const feeTypeText = (t?: string) => (t === "RENTAL" ? "租金" : t === "DEPOSIT" ? "押金" : "其他");
  const moneyText = (v?: number) => Number(v ?? 0).toFixed(2);
  const formatDate = (v?: string) => (v ? v.substring(0, 10) : "—");

  // ── Expose ──
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
  /* ─── Header Strip ─── */
  .header-strip {
    background: #1e40af;
  }
  .header-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%);
  }
  .header-noise {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.3;
    pointer-events: none;
  }
  .bill-badge {
    background: rgba(255 255 255 / 0.18);
    color: rgba(255 255 255 / 0.95);
    letter-spacing: 0.08em;
  }
  .bill-icon-wrap {
    background: rgba(255 255 255 / 0.15);
  }

  /* ─── Section Cards ─── */
  .section-card {
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    box-shadow:
      0 1px 3px 0 rgba(15, 23, 42, 0.04),
      0 1px 2px -1px rgba(15, 23, 42, 0.04);
  }

  /* ─── Section icon accent ─── */
  .section-icon {
    flex-shrink: 0;
  }

  /* ─── Allocation table grid ─── */
  .alloc-grid {
    display: grid;
    grid-template-columns: 1.5fr 1.1fr 0.9fr 0.9fr 0.9fr 1.15fr;
    gap: 0.75rem;
  }
  .alloc-row {
    transition: background 0.12s ease;
  }

  /* ─── Fee type tag ─── */
  .fee-type-tag {
    background: #f1f5f9;
    color: #64748b;
    font-weight: 500;
  }

  /* ─── Metric rows ─── */
  .metric-row {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
  }
  .metric-row:hover {
    background: #f1f5f9;
  }

  /* ─── Progress ─── */
  .progress-track {
    background: #e2e8f0;
  }

  /* ─── Element Plus overrides ─── */
  :deep(.el-input-number) {
    width: 100%;
  }
  :deep(.el-input-number .el-input__wrapper) {
    border-radius: 7px;
  }
  :deep(.el-date-editor.el-input) {
    width: 100%;
  }
  :deep(.el-form-item__label) {
    font-size: 12px;
    color: #64748b;
    padding-bottom: 4px;
  }
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
</style>
