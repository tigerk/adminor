<template>
  <div class="owner-bill-detail">
    <el-skeleton v-if="loading" :rows="10" animated />
    <template v-else>
      <div class="detail-header">
        <div class="detail-header__main">
          <div class="detail-header__title">
            <span>{{ bill.billNo || "业主账单" }}</span>
            <el-tag size="small" effect="plain">{{ cooperationModeText }}</el-tag>
          </div>
          <div class="detail-header__meta">
            <span>业主：{{ bill.ownerName || "-" }}</span>
            <span>合同：{{ bill.contractNo || "-" }}</span>
            <span>账期：{{ bill.billStart || "-" }} 至 {{ bill.billEnd || "-" }}</span>
          </div>
        </div>
        <div class="detail-header__actions">
          <el-button v-if="showWithdrawAction" type="primary" plain @click="goWithdraw">去提现</el-button>
          <el-button v-if="showPaymentAction" type="primary" @click="openPaymentDialog">登记付款</el-button>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-card__label">应付金额</span>
          <strong class="summary-card__value">¥{{ moneyText(bill.payableAmount) }}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">已结金额</span>
          <strong class="summary-card__value summary-card__value--success">¥{{ moneyText(bill.settledAmount) }}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">未结金额</span>
          <strong class="summary-card__value summary-card__value--warning">¥{{ moneyText(bill.unpaidAmount) }}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">{{ isMasterLease ? "付款状态" : "可提现金额" }}</span>
          <strong class="summary-card__value" :class="isMasterLease ? '' : 'summary-card__value--primary'">
            {{ isMasterLease ? settlementStatusText(bill.settlementStatus) : `¥${moneyText(bill.withdrawableAmount)}` }}
          </strong>
        </div>
      </div>

      <el-descriptions :column="2" border class="detail-descriptions">
        <el-descriptions-item label="账单编号">{{ bill.billNo || "-" }}</el-descriptions-item>
        <el-descriptions-item label="合作模式">{{ cooperationModeText }}</el-descriptions-item>
        <el-descriptions-item label="业主">{{ bill.ownerName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ bill.ownerPhone || "-" }}</el-descriptions-item>
        <el-descriptions-item label="合同编号">{{ bill.contractNo || "-" }}</el-descriptions-item>
        <el-descriptions-item label="合同房源">{{ bill.subjectName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="收入金额">¥{{ moneyText(bill.incomeAmount) }}</el-descriptions-item>
        <el-descriptions-item label="费用金额">¥{{ moneyText(bill.expenseAmount) }}</el-descriptions-item>
        <el-descriptions-item label="减免金额">¥{{ moneyText(bill.reductionAmount) }}</el-descriptions-item>
        <el-descriptions-item label="调账金额">¥{{ moneyText(bill.adjustAmount) }}</el-descriptions-item>
        <el-descriptions-item label="审批状态">
          <el-tag :type="approvalStatusTagType(bill.approvalStatus)">{{ approvalStatusText(bill.approvalStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="结算状态">
          <el-tag :type="settlementStatusTagType(bill.settlementStatus)">{{ settlementStatusText(bill.settlementStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="生成时间">{{ bill.generatedAt || "-" }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ bill.updateTime || "-" }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ bill.remark || "-" }}</el-descriptions-item>
      </el-descriptions>

      <div class="section-block">
        <div class="section-block__header">
          <span class="section-block__title">账单明细</span>
          <span class="section-block__count">共 {{ bill.lineList?.length || 0 }} 项</span>
        </div>
        <el-table :data="bill.lineList || []" border>
          <el-table-column prop="itemName" label="项目" min-width="160" />
          <el-table-column prop="itemType" label="类型" min-width="130" />
          <el-table-column prop="direction" label="方向" min-width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.direction === 'OUT' ? 'danger' : 'success'">
                {{ row.direction === "OUT" ? "支出" : "收入" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额" min-width="120" align="right">
            <template #default="{ row }">¥{{ moneyText(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="bizDate" label="业务日期" min-width="120" />
          <el-table-column prop="formulaSnapshot" label="计算说明" min-width="240" show-overflow-tooltip />
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>
      </div>

      <div class="section-block">
        <div class="section-block__header">
          <span class="section-block__title">账单减免</span>
          <span class="section-block__count">共 {{ bill.reductionList?.length || 0 }} 项</span>
        </div>
        <el-table :data="bill.reductionList || []" border>
          <el-table-column prop="reductionName" label="减免项" min-width="180" />
          <el-table-column prop="reductionType" label="减免类型" min-width="140" />
          <el-table-column label="减免金额" min-width="120" align="right">
            <template #default="{ row }">¥{{ moneyText(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="bizDate" label="业务日期" min-width="120" />
          <el-table-column prop="ruleSnapshot" label="规则快照" min-width="240" show-overflow-tooltip />
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>
      </div>

      <div v-if="isMasterLease" class="section-block">
        <div class="section-block__header">
          <span class="section-block__title">付款记录</span>
          <span class="section-block__count">共 {{ bill.paymentList?.length || 0 }} 条</span>
        </div>
        <el-table :data="bill.paymentList || []" border>
          <el-table-column prop="paymentNo" label="付款单号" min-width="190" />
          <el-table-column label="付款金额" min-width="120" align="right">
            <template #default="{ row }">¥{{ moneyText(row.payAmount) }}</template>
          </el-table-column>
          <el-table-column label="付款渠道" min-width="120" align="center">
            <template #default="{ row }">{{ payChannelText(row.payChannel) }}</template>
          </el-table-column>
          <el-table-column prop="payTime" label="付款时间" min-width="160" />
          <el-table-column prop="thirdTradeNo" label="第三方流水号" min-width="180" show-overflow-tooltip />
          <el-table-column label="支付凭证" min-width="170">
            <template #default="{ row }">
              <div v-if="row.voucherUrls?.length" class="voucher-list">
                <el-image
                  v-for="(item, index) in row.voucherUrls"
                  :key="`${row.paymentId || row.paymentNo}-${index}`"
                  :src="item"
                  :preview-src-list="row.voucherUrls"
                  fit="cover"
                  class="voucher-list__item"
                  preview-teleported
                />
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, h, ref } from "vue";
  import { useRouter } from "vue-router";
  import { addDialog, closeAllDialog } from "@/components/ReDialog";
  import { getOwnerBillDetail, createOwnerBillPayment } from "@/api/owner/owner";
  import OwnerBillPaymentDialog from "@/views/finance/owner-bill/form/OwnerBillPaymentDialog.vue";
  import { message } from "@/utils/message";
  import { PaymentFlowChannelEnumMeta } from "@/types/generated/enum.meta";
  import type { OwnerBillDetailVo, OwnerBillPaymentVo, PaymentFlowChannelEnum } from "@/types/generated";

  defineOptions({ name: "OwnerBillDetailDialog" });

  type OwnerBillDetailView = OwnerBillDetailVo & {
    paymentList?: OwnerBillPaymentVo[];
  };

  const props = defineProps<{
    billId: string | number;
  }>();

  const router = useRouter();
  const loading = ref(false);
  const paymentFormRef = ref();
  const bill = ref<OwnerBillDetailView>({});

  const payChannelLabelMap = Object.values(PaymentFlowChannelEnumMeta).reduce<Record<string, string>>((acc, item) => {
    acc[item.value] = item.label || item.value;
    return acc;
  }, {});

  const approvalStatusMap: Record<number, string> = {
    1: "审批中",
    2: "已通过",
    3: "已驳回",
    4: "已撤回"
  };

  const settlementStatusMap: Record<number, string> = {
    0: "未结算",
    1: "部分结算",
    2: "已结算"
  };

  const cooperationModeText = computed(() => (bill.value.cooperationMode === "MASTER_LEASE" ? "包租" : "轻托管"));
  const isMasterLease = computed(() => bill.value.cooperationMode === "MASTER_LEASE");
  const showPaymentAction = computed(() => isMasterLease.value && Number(bill.value.unpaidAmount || 0) > 0);
  const showWithdrawAction = computed(() => !isMasterLease.value && Number(bill.value.withdrawableAmount || 0) > 0);

  const moneyText = (value?: number) => Number(value || 0).toFixed(2);
  const approvalStatusText = (value?: number) => approvalStatusMap[value ?? 0] || `状态${value ?? "-"}`;
  const settlementStatusText = (value?: number) => settlementStatusMap[value ?? 0] || `状态${value ?? "-"}`;
  const payChannelText = (value?: string) => (value ? payChannelLabelMap[value] || value : "-");

  const approvalStatusTagType = (value?: number) => {
    if (value === 2) return "success";
    if (value === 3) return "danger";
    if (value === 4) return "info";
    return "warning";
  };

  const settlementStatusTagType = (value?: number) => {
    if (value === 2) return "success";
    if (value === 1) return "warning";
    return "info";
  };

  async function fetchDetail() {
    loading.value = true;
    try {
      const resp = await getOwnerBillDetail({ billId: String(props.billId) });
      if (resp.code !== 0 || !resp.data) {
        message(resp.message || "获取业主账单详情失败", { type: "error" });
        return;
      }
      bill.value = resp.data as OwnerBillDetailView;
    } finally {
      loading.value = false;
    }
  }

  function goWithdraw() {
    router.push({
      path: "/finance/owner-withdraw",
      query: {
        ownerId: bill.value.ownerId,
        applyAmount: String(Number(bill.value.withdrawableAmount || 0))
      }
    });
    closeAllDialog();
  }

  function openPaymentDialog() {
    if (!bill.value.billId || Number(bill.value.unpaidAmount || 0) <= 0) {
      message("当前账单无可登记付款金额", { type: "warning" });
      return;
    }

    addDialog({
      title: "登记付款",
      props: {
        billId: String(bill.value.billId),
        unpaidAmount: Number(bill.value.unpaidAmount || 0)
      },
      width: "720px",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      closeOnClickModal: false,
      destroyOnClose: true,
      contentRenderer: () =>
        h(OwnerBillPaymentDialog, {
          ref: paymentFormRef,
          billId: String(bill.value.billId),
          unpaidAmount: Number(bill.value.unpaidAmount || 0)
        }),
      beforeSure: async done => {
        try {
          const payload = await paymentFormRef.value?.validateAndBuildPayload?.();
          if (!payload) return;
          const resp = await createOwnerBillPayment(payload);
          if (resp.code === 0) {
            message("付款登记成功", { type: "success" });
            await fetchDetail();
            done();
            return;
          }
          message(resp.message || "付款登记失败", { type: "error" });
        } catch (error: any) {
          message(error?.message || "付款登记失败，请检查表单后重试", { type: "warning" });
        }
      }
    });
  }

  fetchDetail();
</script>

<style scoped lang="scss">
  .owner-bill-detail {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .detail-header__main {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .detail-header__title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--el-text-color-primary);
    font-size: 20px;
    font-weight: 600;
  }

  .detail-header__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .detail-header__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .summary-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 14px;
    background: var(--el-fill-color-blank);
  }

  .summary-card__label {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .summary-card__value {
    color: var(--el-text-color-primary);
    font-size: 22px;
    font-weight: 600;
    line-height: 1.2;
  }

  .summary-card__value--success {
    color: var(--el-color-success);
  }

  .summary-card__value--warning {
    color: var(--el-color-warning);
  }

  .summary-card__value--primary {
    color: var(--el-color-primary);
  }

  .detail-descriptions,
  .section-block {
    width: 100%;
  }

  .section-block {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-block__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .section-block__title {
    color: var(--el-text-color-primary);
    font-size: 15px;
    font-weight: 600;
  }

  .section-block__count {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .voucher-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .voucher-list__item {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-light);
    overflow: hidden;
    background: var(--el-fill-color-light);
  }

  @media (max-width: 960px) {
    .detail-header,
    .detail-header__actions {
      flex-direction: column;
      align-items: stretch;
    }

    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
