<template>
  <div class="flex flex-col gap-4 pb-5">
    <!-- ───────────────── Hero Banner ───────────────── -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-6 text-white shadow-lg shadow-blue-200">
      <!-- decorative circles -->
      <div class="pointer-events-none absolute -right-12 -top-12 size-52 rounded-full bg-white/5" />
      <div class="pointer-events-none absolute -bottom-8 right-24 size-32 rounded-full bg-white/5" />
      <div class="pointer-events-none absolute left-1/3 top-0 h-px w-1/3 bg-white/20" />

      <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <!-- Left: title + meta -->
        <div class="flex flex-col gap-3">
          <span class="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-widest backdrop-blur-sm">账单收款</span>
          <h1 class="text-3xl font-black tracking-tight">
            第
            <span class="opacity-90">{{ bill.sortOrder ?? "—" }}</span>
            期账单
          </h1>
          <div class="flex flex-wrap gap-2">
            <span class="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur-sm">
              <IconifyIconOnline icon="ri:calendar-line" class="text-sm" />
              账期 {{ formatDate(bill.billStart) }} — {{ formatDate(bill.billEnd) }}
            </span>
            <span class="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur-sm">
              <IconifyIconOnline icon="ri:time-line" class="text-sm" />
              应缴日 {{ formatDate(bill.dueDate) }}
            </span>
          </div>
        </div>

        <!-- Right: KPI row -->
        <div class="flex shrink-0 divide-x divide-white/20 overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
          <div class="flex flex-col gap-1 px-5 py-4">
            <span class="text-[11px] font-medium tracking-wider text-white/65">账单应收</span>
            <span class="text-xl font-bold tabular-nums">¥{{ moneyText(bill.totalAmount) }}</span>
          </div>
          <div class="flex flex-col gap-1 px-5 py-4 opacity-80">
            <span class="text-[11px] font-medium tracking-wider text-white/65">累计已收</span>
            <span class="text-xl font-bold tabular-nums">¥{{ moneyText(bill.paidAmount) }}</span>
          </div>
          <div class="flex flex-col gap-1 px-5 py-4 opacity-80">
            <span class="text-[11px] font-medium tracking-wider text-white/65">当前待收</span>
            <span class="text-xl font-bold tabular-nums text-amber-300">¥{{ moneyText(bill.unpaidAmount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ───────────────── Body ───────────────── -->
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_308px]">
        <!-- ── Left column ── -->
        <div class="flex flex-col gap-4">
          <!-- Payment Info Card -->
          <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-center gap-2.5">
              <span class="inline-block size-2 rounded-full bg-blue-500 ring-[3px] ring-blue-100" />
              <span class="text-sm font-bold text-slate-800">支付信息</span>
            </div>

            <!-- Amount + Fields -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-[192px_1fr]">
              <!-- Total amount display -->
              <div class="flex flex-col justify-center gap-1.5 rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50 to-slate-50 p-4">
                <span class="text-[11px] font-semibold uppercase tracking-widest text-blue-600">本次收款总额</span>
                <span class="text-[28px] font-black leading-none tabular-nums text-blue-700">¥{{ moneyText(form.totalAmount) }}</span>
                <span class="text-xs leading-relaxed text-slate-400">由下方费用项汇总自动计算</span>
              </div>

              <!-- Selectors -->
              <div class="grid grid-cols-2 gap-x-4">
                <el-form-item label="支付方式" prop="payChannel">
                  <el-select v-model="form.payChannel" class="w-full" placeholder="请选择支付方式">
                    <el-option v-for="item in payChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="支付时间" prop="payTime">
                  <el-date-picker v-model="form.payTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w-full" placeholder="请选择支付时间" />
                </el-form-item>
              </div>
            </div>

            <!-- Summary strip -->
            <div class="mt-4 flex divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 py-3">
              <div class="flex flex-1 flex-col gap-1 px-5">
                <span class="text-[11px] text-slate-400">分摊笔数</span>
                <strong class="text-sm font-bold text-slate-800">{{ form.items?.length ?? 0 }} 笔</strong>
              </div>
              <div class="flex flex-1 flex-col gap-1 px-5">
                <span class="text-[11px] text-slate-400">收款后累计已收</span>
                <strong class="text-sm font-bold tabular-nums text-slate-800">¥{{ moneyText(nextPaidAmount) }}</strong>
              </div>
              <div class="flex flex-1 flex-col gap-1 px-5">
                <span class="text-[11px] text-slate-400">收款后待收</span>
                <strong class="text-sm font-bold tabular-nums" :class="nextUnpaidAmount > 0 ? 'text-amber-600' : 'text-slate-800'">¥{{ moneyText(nextUnpaidAmount) }}</strong>
              </div>
            </div>
          </div>

          <!-- Allocation Card -->
          <div class="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <!-- Card header -->
            <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div class="flex items-start gap-2.5">
                <span class="mt-1 inline-block size-2 rounded-full bg-indigo-500 ring-[3px] ring-indigo-100" />
                <div>
                  <p class="text-sm font-bold text-slate-800">费用项分配</p>
                  <p class="mt-0.5 text-xs text-slate-400">逐项录入本次实收金额，不可超过该费用项待收金额</p>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <el-button size="small" plain @click="clearAllocation">清空分配</el-button>
                <el-button size="small" type="primary" @click="fillAllUnpaid">全部收清</el-button>
              </div>
            </div>

            <!-- Table head -->
            <div
              class="grid items-center gap-3 bg-slate-50/80 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              style="grid-template-columns: 1.4fr 1.2fr 0.85fr 0.85fr 0.85fr 1.1fr"
            >
              <div>费用项</div>
              <div>费用周期</div>
              <div class="text-right">应收</div>
              <div class="text-right">已收</div>
              <div class="text-right">待收</div>
              <div class="text-right">本次收款</div>
            </div>

            <!-- Table rows -->
            <div>
              <div
                v-for="item in allocationList"
                :key="item.leaseBillFeeId"
                class="grid items-center gap-3 border-t border-slate-100 px-5 py-3 text-sm transition-colors hover:bg-slate-50/60"
                style="grid-template-columns: 1.4fr 1.2fr 0.85fr 0.85fr 0.85fr 1.1fr"
              >
                <div class="flex min-w-0 flex-col gap-1">
                  <span class="truncate font-semibold text-slate-800">{{ item.feeName ?? "—" }}</span>
                  <span class="w-fit rounded-full bg-slate-100 px-2 py-px text-[11px] text-slate-500">
                    {{ feeTypeText(item.feeType) }}
                  </span>
                </div>
                <div class="text-xs text-slate-400">
                  {{ formatDate(item.feeStart) }}
                  <br />
                  {{ formatDate(item.feeEnd) }}
                </div>
                <div class="text-right tabular-nums text-slate-700">¥{{ moneyText(item.amount) }}</div>
                <div class="text-right tabular-nums text-slate-400">¥{{ moneyText(item.paidAmount) }}</div>
                <div class="text-right font-semibold tabular-nums text-amber-600">¥{{ moneyText(item.unpaidAmount) }}</div>
                <div>
                  <el-input-number v-model="item.collectAmount" :min="0" :max="Number(item.unpaidAmount ?? 0)" :precision="2" controls-position="right" class="w-full" />
                </div>
              </div>
            </div>

            <!-- Table footer -->
            <div class="flex items-center gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-sm">
              <span class="font-semibold text-slate-500">分配合计</span>
              <span class="font-bold tabular-nums text-slate-800">¥{{ moneyText(allocatedAmount) }}</span>
              <span class="mx-1 text-slate-300">·</span>
              <span class="font-semibold text-slate-500">剩余待收</span>
              <span class="font-bold tabular-nums" :class="nextUnpaidAmount > 0 ? 'text-amber-600' : 'text-slate-800'">¥{{ moneyText(nextUnpaidAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- ── Right column ── -->
        <div class="flex flex-col gap-4">
          <!-- Status Preview -->
          <div class="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-blue-50/30 p-5 shadow-sm">
            <div class="mb-4 flex items-center gap-2.5">
              <span class="inline-block size-2 rounded-full bg-emerald-500 ring-[3px] ring-emerald-100" />
              <span class="text-sm font-bold text-slate-800">结果预览</span>
            </div>

            <!-- Status pills -->
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <span
                class="rounded-full px-4 py-1.5 text-sm font-bold"
                :class="{
                  'bg-emerald-100 text-emerald-700': resolvedPayStatus === 2,
                  'bg-amber-100 text-amber-700': resolvedPayStatus === 1,
                  'bg-red-100 text-red-700': resolvedPayStatus === 0
                }"
              >
                {{ displayStatusText }}
              </span>
              <span v-if="isOverdue && resolvedPayStatus !== 2" class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600">已逾期</span>
            </div>

            <p class="mb-4 text-xs leading-relaxed text-slate-400">账单支付状态根据累计已收金额自动计算，逾期作为独立标记展示，不与支付状态混用。</p>

            <!-- Progress -->
            <div class="mb-4 rounded-xl border border-slate-200 bg-white p-3.5">
              <div class="mb-2.5 flex items-center justify-between text-xs">
                <span class="text-slate-500">收款进度</span>
                <strong class="text-sm font-bold text-slate-800">{{ collectProgressText }}</strong>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full transition-all duration-500" :style="{ width: collectProgressPercent + '%', background: collectProgressColor }" />
              </div>
            </div>

            <!-- Metrics -->
            <ul class="flex flex-col gap-2">
              <li v-for="m in previewMetrics" :key="m.label" class="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3.5 py-2.5">
                <span class="text-xs text-slate-500">{{ m.label }}</span>
                <strong class="text-sm tabular-nums" :class="m.warn ? 'text-amber-600' : 'text-slate-800'">
                  {{ m.value }}
                </strong>
              </li>
            </ul>
          </div>

          <!-- Payer Info -->
          <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-center gap-2.5">
              <span class="inline-block size-2 rounded-full bg-slate-400 ring-[3px] ring-slate-100" />
              <span class="text-sm font-bold text-slate-800">租客信息</span>
            </div>
            <div class="flex flex-col divide-y divide-slate-100">
              <div class="flex items-baseline justify-between gap-3 py-2.5 first:pt-0">
                <span class="shrink-0 text-xs text-slate-400">付款人</span>
                <span class="text-sm font-semibold text-slate-800">{{ bill.payerName ?? "—" }}</span>
              </div>
              <div class="flex items-baseline justify-between gap-3 py-2.5">
                <span class="shrink-0 text-xs text-slate-400">联系电话</span>
                <span class="text-sm font-semibold text-slate-800">{{ bill.payerPhone ?? "—" }}</span>
              </div>
              <div class="flex flex-col gap-1 py-2.5 last:pb-0">
                <span class="text-xs text-slate-400">房源地址</span>
                <span class="text-sm font-semibold leading-relaxed text-slate-800 break-all">{{ bill.roomAddress ?? "—" }}</span>
              </div>
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
  const collectProgressColor = computed(() => ["#ef4444", "#f59e0b", "#16a34a"][resolvedPayStatus.value]);

  // Preview metrics list – keeps template clean
  const previewMetrics = computed(() => [
    {
      label: "本次分配合计",
      value: `¥${moneyText(allocatedAmount.value)}`,
      warn: false
    },
    {
      label: "收款后累计已收",
      value: `¥${moneyText(nextPaidAmount.value)}`,
      warn: false
    },
    {
      label: "收款后剩余待收",
      value: `¥${moneyText(nextUnpaidAmount.value)}`,
      warn: nextUnpaidAmount.value > 0
    },
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
  const feeTypeText = (t?: string) => (t === "RENTAL" ? "租金" : t === "DEPOSIT" ? "押金" : "其他费用");

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
  /*
  只在 Tailwind 无法覆盖 Element Plus 内部样式时使用少量 scoped CSS。
  其余全部用 Tailwind 工具类完成，与 vue-pure-admin 保持一致。
*/

  /* 让 el-input-number 宽度填满单元格 */
  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-input-number .el-input__wrapper) {
    border-radius: 8px;
  }

  /* el-date-picker 宽度 */
  :deep(.el-date-editor.el-input) {
    width: 100%;
  }
</style>
