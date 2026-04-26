<template>
  <div class="checkout-tab">
    <el-skeleton v-if="loading" animated :rows="10" class="p-6" />
    <el-empty v-else-if="!checkoutDetail" description="暂无退租信息" :image-size="160" />

    <template v-else>
      <!-- ══ 顶部：标题 + 操作 ══ -->
      <div class="page-header">
        <div class="page-header__left">
          <div class="page-header__badge">退租单</div>
          <span class="page-header__code">{{ checkoutDetail.checkoutCode || "—" }}</span>
          <div class="page-header__tags">
            <el-tag :type="getStatusTagType(checkoutDetail.statusName)" round size="small" effect="dark">
              {{ checkoutDetail.statusName || "—" }}
            </el-tag>
            <el-tag :type="getApprovalTagType(checkoutDetail.approvalStatusName)" round size="small" effect="light">
              {{ checkoutDetail.approvalStatusName || "—" }}
            </el-tag>
          </div>
        </div>
        <el-button type="primary" :disabled="!canEdit" @click="handleEditCheckout" class="edit-btn">
          <el-icon><Edit /></el-icon>
          修改退租单
        </el-button>
      </div>

      <!-- ══ 核心指标卡 ══ -->
      <div class="metric-strip">
        <div class="metric-card metric-card--primary">
          <div class="metric-card__label">押金金额</div>
          <div class="metric-card__value">
            {{ checkoutDetail.depositAmount == null ? "—" : `¥${checkoutDetail.depositAmount}` }}
          </div>
          <div class="metric-card__sub">待结算</div>
        </div>
        <div class="metric-card metric-card--success">
          <div class="metric-card__label">结算金额</div>
          <div class="metric-card__value">
            {{ checkoutDetail.finalAmount == null ? "—" : `¥${checkoutDetail.finalAmount}` }}
          </div>
          <div class="metric-card__sub">最终结算</div>
        </div>
        <div class="metric-card" :class="checkoutDetail.addCleaningFee ? 'metric-card--warning' : 'metric-card--muted'">
          <div class="metric-card__label">房屋清洁费</div>
          <div class="metric-card__value">{{ cleaningFeeText }}</div>
          <div class="metric-card__sub">{{ checkoutDetail.addCleaningFee ? "已加收" : "未加收" }}</div>
        </div>
        <div class="metric-card metric-card--info">
          <div class="metric-card__label">支付状态</div>
          <div class="metric-card__value metric-card__value--tag">
            <el-tag :type="getPaymentTagType(checkoutDetail.paymentStatusName)" size="large" round effect="light">
              {{ checkoutDetail.paymentStatusName || "—" }}
            </el-tag>
          </div>
          <div class="metric-card__sub">{{ checkoutDetail.payAt || "暂未支付" }}</div>
        </div>
      </div>

      <!-- ══ 基本信息 ══ -->
      <div class="detail-section">
        <div class="section-title">
          <span class="section-title__bar" />
          基本信息
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-item__label">退租类型</span>
            <span class="info-item__value">{{ checkoutDetail.checkoutTypeName || "—" }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">实际退租日</span>
            <span class="info-item__value info-item__value--date">{{ checkoutDetail.actualCheckoutDate || "—" }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">合同到期日</span>
            <span class="info-item__value info-item__value--date">{{ checkoutDetail.leaseEnd || "—" }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">结算方式</span>
            <span class="info-item__value">{{ checkoutDetail.settlementMethodName || "—" }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">结算截止日</span>
            <span class="info-item__value info-item__value--date">{{ checkoutDetail.dueDate || "—" }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">创建人</span>
            <span class="info-item__value">{{ checkoutDetail.createByName || checkoutDetail.createBy || "—" }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">创建时间</span>
            <span class="info-item__value info-item__value--date">{{ checkoutDetail.createAt || "—" }}</span>
          </div>
          <div class="info-item info-item--placeholder" />
          <div v-if="checkoutDetail.breachReason" class="info-item info-item--full">
            <span class="info-item__label info-item__label--danger">解约原因</span>
            <span class="info-item__value info-item__value--danger">{{ checkoutDetail.breachReason }}</span>
          </div>
          <div class="info-item info-item--full info-item--last">
            <span class="info-item__label">退租备注</span>
            <span class="info-item__value info-item__value--muted">{{ checkoutDetail.remark }}</span>
          </div>
        </div>
      </div>

      <!-- ══ 费用明细 ══ -->
      <div class="detail-section">
        <div class="section-title">
          <span class="section-title__bar" />
          退租费用明细
          <span v-if="checkoutDetail.feeList?.length" class="section-title__count">{{ checkoutDetail.feeList.length }} 项</span>
        </div>

        <template v-if="checkoutDetail.feeList && checkoutDetail.feeList.length > 0">
          <div class="fee-summary">
            <div class="fee-summary__item">
              <span class="fee-summary__label">收入合计</span>
              <span class="fee-summary__val fee-summary__val--income">¥{{ incomeTotalAmount }}</span>
            </div>
            <div class="fee-summary__divider" />
            <div class="fee-summary__item">
              <span class="fee-summary__label">支出合计</span>
              <span class="fee-summary__val fee-summary__val--expense">¥{{ expenseTotalAmount }}</span>
            </div>
            <div class="fee-summary__divider" />
            <div class="fee-summary__item">
              <span class="fee-summary__label">净结算</span>
              <span class="fee-summary__val fee-summary__val--net" :class="netAmount >= 0 ? 'fee-summary__val--income' : 'fee-summary__val--expense'">
                {{ netAmount >= 0 ? "+" : "" }}¥{{ netAmount }}
              </span>
            </div>
          </div>

          <el-table :data="checkoutDetail.feeList" class="fees-table" :row-class-name="feeRowClass">
            <el-table-column type="index" label="#" width="52" align="center">
              <template #default="{ $index }">
                <span class="row-index">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="收支" width="92" align="center">
              <template #default="{ row }">
                <span class="direction-pill" :class="isIncomeDirection(row.feeDirection) ? 'direction-pill--in' : 'direction-pill--out'">
                  {{ isIncomeDirection(row.feeDirection) ? "↑ 收入" : "↓ 支出" }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="feeName" label="费用名称" min-width="130" align="left">
              <template #default="{ row }">
                <span class="fee-name">{{ row.feeName || "—" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="金额" min-width="110" align="right">
              <template #default="{ row }">
                <span class="fee-amount" :class="isIncomeDirection(row.feeDirection) ? 'fee-amount--in' : 'fee-amount--out'">
                  {{ row.feeAmount == null ? "—" : `¥${row.feeAmount}` }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="计费周期" min-width="210" align="center">
              <template #default="{ row }">
                <div class="date-range">
                  <span class="date-range__date">{{ row.feeStartDate || "—" }}</span>
                  <span class="date-range__arrow">→</span>
                  <span class="date-range__date">{{ row.feeEndDate || "—" }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="remark-text">{{ row.remark || "—" }}</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <el-empty v-else description="暂无费用明细" :image-size="100" />
      </div>

      <!-- ══ 附件 ══ -->
      <div class="detail-section">
        <div class="section-title">
          <span class="section-title__bar" />
          附件
          <span v-if="checkoutDetail.attachmentUrls?.length" class="section-title__count">{{ checkoutDetail.attachmentUrls.length }} 张</span>
        </div>

        <div v-if="checkoutDetail.attachmentUrls?.length" class="photo-wall">
          <div v-for="(url, index) in checkoutDetail.attachmentUrls" :key="url + index" class="photo-item">
            <el-image
              :src="url"
              :zoom-rate="1.2"
              :max-scale="7"
              :min-scale="0.2"
              :preview-src-list="checkoutDetail.attachmentUrls"
              :initial-index="index"
              fit="cover"
              loading="lazy"
              preview-teleported
            />
            <div class="photo-item__overlay">
              <el-icon><ZoomIn /></el-icon>
            </div>
          </div>
        </div>
        <div v-else class="attachment-empty">
          <el-icon><Picture /></el-icon>
          <span>暂无附件</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import { Edit, Picture, ZoomIn } from "@element-plus/icons-vue";
  import type { LeaseCheckoutVo } from "@/types";
  import { useCheckoutDialog } from "@/views/contract/checkout/form/checkoutCreateForm/useCheckoutDialog";
  import { FEE_DIRECTION_ENUM } from "@/constants";

  const props = defineProps<{
    loading: boolean;
    checkoutDetail: LeaseCheckoutVo | null;
  }>();

  const emit = defineEmits<{ updated: [] }>();

  const { openLeaseCheckoutDialogByLeaseId } = useCheckoutDialog();

  const canEdit = computed(() => !!props.checkoutDetail);

  const cleaningFeeText = computed(() => {
    if (!props.checkoutDetail) return "—";
    return props.checkoutDetail.addCleaningFee ? `¥${props.checkoutDetail.cleaningFeeAmount || 0}` : "未加收";
  });

  const incomeTotalAmount = computed(() => props.checkoutDetail?.feeList?.filter(f => isIncomeDirection(f.feeDirection)).reduce((s, f) => s + (f.feeAmount || 0), 0) ?? 0);

  const expenseTotalAmount = computed(() => props.checkoutDetail?.feeList?.filter(f => !isIncomeDirection(f.feeDirection)).reduce((s, f) => s + (f.feeAmount || 0), 0) ?? 0);

  const netAmount = computed(() => incomeTotalAmount.value - expenseTotalAmount.value);

  function isIncomeDirection(direction?: string | null) {
    return direction === FEE_DIRECTION_ENUM.IN.value;
  }

  function feeRowClass({ row }: { row: any }) {
    return isIncomeDirection(row.feeDirection) ? "fee-row--income" : "fee-row--expense";
  }

  function getStatusTagType(s?: string | null) {
    if (!s) return "info";
    if (s.includes("完成") || s.includes("已退")) return "success";
    if (s.includes("取消") || s.includes("拒绝")) return "danger";
    if (s.includes("待") || s.includes("中")) return "warning";
    return "info";
  }

  function getApprovalTagType(s?: string | null) {
    if (!s) return "info";
    if (s.includes("通过") || s.includes("批准")) return "success";
    if (s.includes("拒绝") || s.includes("驳回")) return "danger";
    if (s.includes("待") || s.includes("中")) return "warning";
    return "info";
  }

  function getPaymentTagType(s?: string | null) {
    if (!s) return "info";
    if (s.includes("已支付") || s.includes("完成")) return "success";
    if (s.includes("逾期") || s.includes("失败")) return "danger";
    if (s.includes("待") || s.includes("部分")) return "warning";
    return "info";
  }

  function handleEditCheckout() {
    if (!props.checkoutDetail?.leaseId) return;
    openLeaseCheckoutDialogByLeaseId(props.checkoutDetail.leaseId, () => emit("updated"));
  }
</script>

<style scoped lang="scss">
  .checkout-tab {
    --c-primary: var(--el-color-primary);
    --c-primary-soft: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    --c-success: var(--el-color-success);
    --c-success-soft: color-mix(in srgb, var(--el-color-success) 12%, transparent);
    --c-warning: var(--el-color-warning);
    --c-warning-soft: color-mix(in srgb, var(--el-color-warning) 12%, transparent);
    --c-danger: var(--el-color-danger);
    --c-danger-soft: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
    --c-info-soft: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
    --c-border: var(--el-border-color);
    --c-surface: transparent;
    --c-surface-soft: var(--el-fill-color-light);
    --c-bg: transparent;
    --c-text-1: var(--el-text-color-primary);
    --c-text-2: var(--el-text-color-regular);
    --c-text-3: var(--el-text-color-secondary);
    --radius-lg: 12px;
    --radius-md: 8px;
    --radius-sm: 5px;
    --shadow-card: none;
    --shadow-hover: none;

    min-height: 300px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 0 14px;
    border-bottom: 1px solid var(--c-border);

    &__left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    &__badge {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: var(--c-primary);
      background: var(--c-primary-soft);
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--el-border-color));
    }

    &__code {
      font-family: "JetBrains Mono", "Fira Code", "Courier New", monospace;
      font-size: 28px;
      font-weight: 600;
      color: var(--c-text-1);
      line-height: 1;
    }

    &__tags {
      display: flex;
      gap: 6px;
      align-items: center;
    }
  }

  .edit-btn {
    gap: 4px;
    box-shadow: none;
  }

  .metric-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }

  .metric-card {
    padding: 14px 16px;
    border-radius: var(--radius-lg);
    background: var(--c-surface-soft);
    border: 1px solid var(--c-border);
    border-top: 2px solid var(--c-border);

    &--primary {
      border-top-color: var(--c-primary);
    }
    &--success {
      border-top-color: var(--c-success);
    }
    &--warning {
      border-top-color: var(--c-warning);
    }
    &--info {
      border-top-color: #64b5f6;
    }
    &--muted {
      border-top-color: var(--c-border);
    }

    &__label {
      font-size: 12px;
      font-weight: 500;
      color: var(--c-text-3);
      margin-bottom: 10px;
    }

    &__value {
      font-size: 18px;
      font-weight: 700;
      color: var(--c-text-1);
      line-height: 1.15;
      margin-bottom: 6px;
      &--tag {
        font-size: unset;
        font-weight: unset;
      }
    }

    &__sub {
      font-size: 12px;
      color: var(--c-text-3);
    }

    &--primary .metric-card__value {
      color: var(--c-primary);
    }
    &--success .metric-card__value {
      color: var(--c-success);
    }
    &--warning .metric-card__value {
      color: var(--c-warning);
    }
  }

  .detail-section {
    background: transparent;
    padding: 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--c-text-1);
    margin-bottom: 14px;

    &__bar {
      display: inline-block;
      width: 3px;
      height: 14px;
      border-radius: 2px;
      background: var(--c-primary);
      flex-shrink: 0;
    }

    &__count {
      font-size: 12px;
      font-weight: 500;
      color: var(--c-text-3);
      background: var(--c-bg);
      padding: 1px 8px;
      border-radius: 20px;
      border: 1px solid var(--c-border);
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid var(--c-border);
    background: var(--c-surface-soft);
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 16px;
    border-right: 1px solid var(--c-border);
    border-bottom: 1px solid var(--c-border);

    &:nth-child(4n),
    &--placeholder {
      border-right: none;
    }

    &--placeholder {
      background: var(--c-bg);
    }

    &--full {
      grid-column: 1 / -1;
      flex-direction: row;
      align-items: center;
      border-right: none;
      gap: 12px;

      .info-item__label {
        width: 80px;
        min-width: 80px;
        display: inline-flex;
        align-items: center;
      }

      .info-item__value {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
      }
    }

    &--last {
      border-bottom: none;
    }

    &__label {
      font-size: 14px;
      font-weight: 600;
      color: var(--c-text-3);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      &--danger {
        color: var(--c-danger);
      }
    }

    &__value {
      font-size: 13.5px;
      color: var(--c-text-1);
      line-height: 1.55;
      &--date {
        color: var(--c-text-2);
        font-variant-numeric: tabular-nums;
      }
      &--muted {
        color: var(--c-text-2);
      }
      &--danger {
        color: var(--c-danger);
        background: var(--c-danger-soft);
        padding: 3px 8px;
        border-radius: var(--radius-sm);
        font-size: 13px;
      }
    }
  }

  /* ── Fee summary ── */
  .fee-summary {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 10px 16px;
    background: var(--c-surface-soft);
    border-radius: var(--radius-md);
    margin-bottom: 12px;
    border: 1px solid var(--c-border);

    &__item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    &__label {
      font-size: 12.5px;
      color: var(--c-text-2);
    }
    &__val {
      font-size: 16px;
      font-weight: 700;
      &--income {
        color: var(--c-success);
      }
      &--expense {
        color: var(--c-danger);
      }
      &--net {
        font-size: 18px;
      }
    }
    &__divider {
      width: 1px;
      height: 22px;
      background: var(--c-border);
    }
  }

  .fees-table {
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid var(--c-border) !important;

    :deep(.el-table__header-wrapper th) {
      background: var(--c-surface-soft) !important;
      color: var(--c-text-2);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
      border-bottom: 1px solid var(--c-border) !important;
    }

    :deep(.el-table__row td) {
      border-color: var(--c-border) !important;
      background: transparent !important;
    }
    :deep(.el-table__row:hover > td) {
      background: var(--c-info-soft) !important;
    }

    :deep(.fee-row--income td:first-child) {
      border-left: 3px solid var(--c-success);
    }
    :deep(.fee-row--expense td:first-child) {
      border-left: 3px solid var(--c-danger);
    }
  }

  .row-index {
    font-size: 12px;
    font-weight: 600;
    color: var(--c-text-3);
  }

  .direction-pill {
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
    &--in {
      color: var(--c-success);
      background: var(--c-success-soft);
    }
    &--out {
      color: var(--c-danger);
      background: var(--c-danger-soft);
    }
  }

  .fee-name {
    font-size: 13.5px;
    font-weight: 500;
    color: var(--c-text-1);
  }
  .fee-amount {
    font-size: 15px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    &--in {
      color: var(--c-success);
    }
    &--out {
      color: var(--c-danger);
    }
  }

  .date-range {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12.5px;
    &__date {
      color: var(--c-text-2);
    }
    &__arrow {
      color: var(--c-text-3);
      font-size: 11px;
    }
  }

  .remark-text {
    font-size: 12.5px;
    color: var(--c-text-2);
  }

  .photo-wall {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 2px 0 0;
  }

  .photo-item {
    position: relative;
    width: 124px;
    height: 124px;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid var(--c-border);
    cursor: pointer;
    transition: transform 0.2s ease;

    :deep(.el-image) {
      width: 100%;
      height: 100%;
      display: block;
    }

    &__overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 20, 40, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.18s;
      color: #fff;
      font-size: 22px;
    }

    &:hover {
      transform: translateY(-2px);
      .photo-item__overlay {
        opacity: 1;
      }
    }
  }

  .attachment-empty {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--c-text-3);
    font-size: 13px;
    padding: 4px 0;
    .el-icon {
      font-size: 15px;
    }
  }

  @media (max-width: 1440px) {
    .metric-strip {
      grid-template-columns: repeat(2, 1fr);
    }

    .info-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .info-item {
      &:nth-child(4n) {
        border-right: 1px solid var(--c-border);
      }

      &:nth-child(2n) {
        border-right: none;
      }
    }
  }

  @media (max-width: 900px) {
    .page-header {
      align-items: flex-start;
      flex-direction: column;

      &__code {
        font-size: 20px;
      }
    }

    .metric-strip,
    .info-grid {
      grid-template-columns: 1fr;
    }

    .info-item {
      border-right: none !important;
    }

    .info-item--placeholder {
      display: none;
    }
  }
</style>
