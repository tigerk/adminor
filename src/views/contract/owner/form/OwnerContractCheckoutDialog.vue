<template>
  <el-form ref="formRef" v-loading="loading" :model="form" :rules="rules" label-position="top" class="owner-checkout-form">
    <section class="checkout-section">
      <div class="checkout-section__title">业主与合同信息</div>
      <div class="info-grid">
        <div class="info-card">
          <span class="info-card__label">业主</span>
          <strong>{{ formInline?.ownerName || "-" }}</strong>
          <small>{{ formInline?.ownerPhone || "-" }}</small>
        </div>
        <div class="info-card">
          <span class="info-card__label">委托模式</span>
          <strong>{{ cooperationModeLabel }}</strong>
          <small>{{ formInline?.contractTemplateName || "未关联合同模板" }}</small>
        </div>
        <div class="info-card">
          <span class="info-card__label">合同编号</span>
          <strong>{{ formInline?.contractNo || "-" }}</strong>
          <small>{{ formatDate(formInline?.contractStart) }} 至 {{ formatDate(formInline?.contractEnd) }}</small>
        </div>
      </div>
    </section>

    <section class="checkout-section">
      <div class="checkout-section__title">房源情况</div>
      <div class="house-card">
        <div class="house-card__name">{{ formInline?.subjectNames || "未关联房源" }}</div>
        <div class="house-card__meta">
          <span>房源数量：{{ formInline?.subjectCount || 0 }} 套</span>
          <span>已配置：{{ formInline?.configuredSubjectCount || 0 }} 套</span>
          <span>总面积：{{ formatArea(formInline?.totalArea) }} m²</span>
        </div>
      </div>
    </section>

    <section class="checkout-section">
      <div class="checkout-section__title">在租房间</div>
      <div v-if="leasedRoomList.length" class="leased-room-list">
        <div v-for="room in leasedRoomList" :key="`${room.leaseId}-${room.roomId}`" class="leased-room-card">
          <div class="leased-room-card__main">
            <strong>{{ room.roomName || `房间 ${room.roomId || "-"}` }}</strong>
            <span>{{ formatDate(room.leaseStart) }} 至 {{ formatDate(room.leaseEnd) }}</span>
          </div>
          <div class="leased-room-card__tenant">
            <span class="leased-room-card__tenant-name">
              {{ room.tenantName || "-" }}
              <em v-if="leaseStatusText(room)" class="lease-status-pill">{{ leaseStatusText(room) }}</em>
            </span>
            <small>{{ room.tenantPhone || "-" }}</small>
          </div>
          <div class="leased-room-card__rent">{{ moneyText(room.rentPrice) }}/月</div>
        </div>
      </div>
      <div v-else class="leased-room-empty">当前业主房源暂无在租房间</div>
    </section>

    <section class="checkout-section">
      <div class="checkout-section__title">{{ isMasterLease ? "包租账单情况" : "轻托管账户情况" }}</div>
      <div v-if="isMasterLease" class="finance-grid">
        <div class="finance-card">
          <span>应付单数</span>
          <strong>{{ payableSummary.billCount || 0 }}</strong>
        </div>
        <div class="finance-card">
          <span>应付总额</span>
          <strong>{{ moneyText(payableSummary.totalPayableAmount) }}</strong>
        </div>
        <div class="finance-card">
          <span>已付总额</span>
          <strong>{{ moneyText(payableSummary.totalPaidAmount) }}</strong>
        </div>
        <div class="finance-card is-warning">
          <span>未付总额</span>
          <strong>{{ moneyText(payableSummary.totalUnpaidAmount) }}</strong>
        </div>
      </div>
      <div v-else class="finance-grid">
        <div class="finance-card">
          <span>可提现余额</span>
          <strong>{{ moneyText(withdrawSummary.availableAmount) }}</strong>
        </div>
        <div class="finance-card">
          <span>冻结金额</span>
          <strong>{{ moneyText(withdrawSummary.frozenAmount) }}</strong>
        </div>
        <div class="finance-card">
          <span>应结总额</span>
          <strong>{{ moneyText(settlementSummary.totalPayableAmount) }}</strong>
        </div>
        <div class="finance-card is-warning">
          <span>未结总额</span>
          <strong>{{ moneyText(settlementSummary.totalUnpaidAmount) }}</strong>
        </div>
      </div>
    </section>

    <section class="checkout-section checkout-action">
      <div class="checkout-section__title">退房操作</div>
      <el-alert class="checkout-action__alert" type="warning" :closable="false" show-icon>
        <template #title>业主退房会停用当前业主合同；已付款账单不会被直接修改。</template>
      </el-alert>

      <div class="checkout-action__fields">
        <el-form-item class="checkout-action__date" label="退房日期" prop="checkoutDate" required>
          <el-date-picker v-model="form.checkoutDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择退房日期" class="w-full!" />
        </el-form-item>

        <el-form-item class="checkout-action__date" label="违约金">
          <el-input-number v-model="form.breachPenaltyAmount" :min="0" :precision="2" :controls="false" placeholder="0.00" class="w-full!" />
          <div class="form-tip">{{ isMasterLease ? "提交后生成包租应付冲减单" : "提交后生成业主结算扣减单" }}</div>
        </el-form-item>
      </div>

      <div class="bill-policy-card" :class="{ 'is-active': form.voidUnpaidFutureBills }">
        <div class="bill-policy-card__main">
          <div class="bill-policy-card__title">未付账单处理</div>
          <div class="bill-policy-card__desc">
            {{ form.voidUnpaidFutureBills ? "作废退房日之后未付款账单" : "保留退房日之后未付款账单" }}
          </div>
        </div>
        <div class="bill-policy-card__switch">
          <span :class="{ 'is-muted': form.voidUnpaidFutureBills }">保留</span>
          <el-switch v-model="form.voidUnpaidFutureBills" />
          <span :class="{ 'is-active': form.voidUnpaidFutureBills }">作废</span>
        </div>
      </div>

      <div class="checkout-action__textarea-grid">
        <el-form-item label="退房原因" prop="checkoutReason" required>
          <el-input v-model="form.checkoutReason" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请输入业主退房原因" />
        </el-form-item>

        <el-form-item class="mb-0!" label="结算说明">
          <el-input v-model="form.settlementRemark" type="textarea" :rows="3" maxlength="1000" show-word-limit placeholder="可填写结算、交接或后续处理说明" />
        </el-form-item>
      </div>
    </section>
  </el-form>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import { getOwnerContractCheckoutInit } from "@/api/contract/owner";
  import { LEASE_STATUS_META } from "@/constants";
  import { getOwnerPayableBillSummary, getOwnerSettlementBillSummary, getOwnerWithdrawSummary, type PayableBillSummaryVo, type SettlementBillSummaryVo } from "@/api/owner/owner";
  import type { OwnerCheckoutLeaseRoomVo, OwnerContractCheckoutDto, OwnerListVo, OwnerWithdrawSummaryVo } from "@/types/generated";

  type OwnerCheckoutLeaseRoomWithStatus = OwnerCheckoutLeaseRoomVo & {
    leaseStatus?: number;
    leaseStatusName?: string;
  };

  const props = defineProps<{
    formInline?: (OwnerListVo & { contractId?: string | number }) | null;
  }>();

  const formRef = ref<FormInstance>();
  const loading = ref(false);
  const payableSummary = ref<PayableBillSummaryVo>({});
  const settlementSummary = ref<SettlementBillSummaryVo>({});
  const withdrawSummary = ref<OwnerWithdrawSummaryVo>({});
  const leasedRoomList = ref<OwnerCheckoutLeaseRoomVo[]>([]);
  const form = reactive<OwnerContractCheckoutDto>({
    contractId: props.formInline?.contractId,
    checkoutDate: "",
    checkoutReason: "",
    settlementRemark: "",
    breachPenaltyAmount: 0,
    releaseSubject: false,
    voidUnpaidFutureBills: true
  });
  const isMasterLease = computed(() => props.formInline?.cooperationMode === "MASTER_LEASE");
  const cooperationModeLabel = computed(() => (isMasterLease.value ? "包租" : "轻托管"));

  const rules: FormRules = {
    checkoutDate: [{ required: true, message: "请选择退房日期", trigger: "change" }],
    checkoutReason: [{ required: true, message: "请输入退房原因", trigger: "blur" }]
  };

  function formatDate(value?: string | number | Date) {
    if (!value) return "-";
    return String(value).slice(0, 10);
  }

  function formatArea(value?: string | number) {
    if (value === undefined || value === null || value === "") return "0.00";
    return Number(value || 0).toFixed(2);
  }

  function moneyText(value?: string | number) {
    return `¥${Number(value || 0).toFixed(2)}`;
  }

  function leaseStatusText(room: OwnerCheckoutLeaseRoomVo) {
    const current = room as OwnerCheckoutLeaseRoomWithStatus;
    if (current.leaseStatusName) return current.leaseStatusName;
    if (current.leaseStatus === undefined || current.leaseStatus === null) return "";
    return Object.values(LEASE_STATUS_META).find(item => item.code === current.leaseStatus)?.name || "";
  }

  async function loadFinanceSummary() {
    if (!props.formInline?.ownerId || !props.formInline?.contractId) return;
    const query = {
      ownerId: String(props.formInline.ownerId),
      contractId: String(props.formInline.contractId)
    };
    if (isMasterLease.value) {
      const resp = await getOwnerPayableBillSummary(query);
      payableSummary.value = resp.data || {};
    } else {
      const [settlementResp, withdrawResp] = await Promise.all([getOwnerSettlementBillSummary(query), getOwnerWithdrawSummary(query as any)]);
      settlementSummary.value = settlementResp.data || {};
      withdrawSummary.value = withdrawResp.data || {};
    }
  }

  async function loadCheckoutInit() {
    if (!props.formInline?.contractId) return;
    const resp = await getOwnerContractCheckoutInit({ contractId: String(props.formInline.contractId) });
    leasedRoomList.value = resp.data?.leasedRoomList || [];
  }

  async function loadDialogData() {
    loading.value = true;
    try {
      await Promise.all([loadFinanceSummary(), loadCheckoutInit()]);
    } finally {
      loading.value = false;
    }
  }

  async function validateAndBuildPayload() {
    await formRef.value?.validate();
    return { ...form };
  }

  onMounted(loadDialogData);

  defineExpose({ validateAndBuildPayload });
</script>

<style scoped lang="scss">
  .owner-checkout-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .checkout-section {
    padding: 12px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;

    &__title {
      margin-bottom: 10px;
      font-size: 14px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
  }

  .info-grid,
  .finance-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .finance-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .info-card,
  .finance-card {
    padding: 12px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    span,
    small {
      display: block;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    strong {
      display: block;
      margin-top: 4px;
      font-size: 13px;
      color: var(--el-text-color-primary);
    }
  }

  .finance-card {
    strong {
      font-size: 16px;
    }

    &.is-warning strong {
      color: var(--el-color-warning);
    }
  }

  .house-card {
    padding: 12px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    &__name {
      font-size: 13px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    &__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .leased-room-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .leased-room-card {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    &__main,
    &__tenant {
      min-width: 0;

      strong,
      span,
      small {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      strong,
      span {
        font-size: 13px;
        font-weight: 700;
        color: var(--el-text-color-primary);
      }

      small,
      > span + span {
        margin-top: 3px;
        font-size: 12px;
        font-weight: 400;
        color: var(--el-text-color-secondary);
      }
    }

    &__rent {
      font-size: 13px;
      font-weight: 800;
      color: var(--el-color-primary);
      white-space: nowrap;
    }

    &__tenant-name {
      display: inline-flex !important;
      align-items: center;
      gap: 6px;
      max-width: 100%;
    }
  }

  .lease-status-pill {
    display: inline-flex;
    flex: none;
    align-items: center;
    height: 20px;
    padding: 0 7px;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
    line-height: 20px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 999px;
  }

  .leased-room-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 10px 12px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-extra-light);
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
  }

  .checkout-action {
    &__alert {
      margin-bottom: 10px;

      :deep(.el-alert__title) {
        line-height: 18px;
      }
    }

    &__fields,
    &__textarea-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }

    &__date {
      margin-bottom: 0;

      :deep(.el-form-item__content) {
        align-items: stretch;
      }
    }

    &__textarea-grid {
      margin-bottom: 0;

      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }
  }

  .form-tip {
    margin-top: 6px;
    font-size: 12px;
    line-height: 18px;
    color: var(--el-text-color-secondary);
  }

  .bill-policy-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 58px;
    padding: 10px 12px;
    margin-bottom: 12px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease;

    &.is-active {
      background: var(--el-fill-color-extra-light);
      border-color: var(--el-color-primary);
    }

    &__main {
      min-width: 0;
    }

    &__title {
      font-size: 13px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    &__desc {
      margin-top: 2px;
      font-size: 12px;
      line-height: 18px;
      color: var(--el-text-color-secondary);
    }

    &__switch {
      display: inline-flex;
      flex: none;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: var(--el-text-color-secondary);

      .is-muted {
        color: var(--el-text-color-placeholder);
      }

      .is-active {
        color: var(--el-color-primary);
      }
    }
  }

  @media (width <= 760px) {
    .checkout-action__fields,
    .checkout-action__textarea-grid,
    .leased-room-list {
      grid-template-columns: 1fr;
    }
  }
</style>
