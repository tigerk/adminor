<template>
  <div class="owner-bill-detail">
    <el-skeleton v-if="loading" :rows="10" animated />
    <template v-else>
      <div class="detail-header">
        <div class="detail-header__main">
          <div class="detail-header__title">
            <span>{{ bill.billNo || "业主结算单" }}</span>
            <el-tag size="small" effect="plain" type="success">{{ billBizTypeText }}</el-tag>
          </div>
          <div class="detail-header__meta">
            <span>业主：{{ bill.ownerName || "-" }}</span>
            <span>合同：{{ bill.contractNo || "-" }}</span>
            <span>账期：{{ bill.billStartDate || "-" }} 至 {{ bill.billEndDate || "-" }}</span>
          </div>
        </div>
        <div class="detail-header__actions">
          <el-button v-if="showWithdrawAction" type="primary" plain @click="goWithdraw">去提现</el-button>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-card__label">收入金额</span>
          <strong class="summary-card__value">¥{{ moneyText(bill.incomeAmount) }}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">费用金额</span>
          <strong class="summary-card__value summary-card__value--warning">¥{{ moneyText(bill.expenseAmount) }}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">结算金额</span>
          <strong class="summary-card__value summary-card__value--success">¥{{ moneyText(bill.payableAmount) }}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">可提现金额</span>
          <strong class="summary-card__value summary-card__value--primary">¥{{ moneyText(bill.withdrawableAmount) }}</strong>
        </div>
      </div>

      <el-descriptions :column="2" border class="detail-descriptions">
        <el-descriptions-item label="结算单号">{{ bill.billNo || "-" }}</el-descriptions-item>
        <el-descriptions-item label="账单类型">{{ billBizTypeText }}</el-descriptions-item>
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
        <el-descriptions-item label="更新时间">{{ bill.updateAt || "-" }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ bill.remark || "-" }}</el-descriptions-item>
      </el-descriptions>

      <div class="section-block">
        <div class="section-block__header">
          <span class="section-block__title">结算明细</span>
          <span class="section-block__count">共 {{ bill.feeList?.length || 0 }} 项</span>
        </div>
        <el-table :data="bill.feeList || []" border>
          <el-table-column prop="feeName" label="项目" min-width="160" />
          <el-table-column prop="feeType" label="类型" min-width="130" />
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
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from "vue";
  import { useRouter } from "vue-router";
  import { closeAllDialog } from "@/components/ReDialog";
  import { getOwnerSettlementBillDetail, type SettlementBillDetailVo } from "@/api/owner/owner";
  import { message } from "@/utils/message";

  defineOptions({ name: "OwnerSettlementBillDetailDialog" });

  const props = defineProps<{
    billId: string | number;
  }>();

  const router = useRouter();
  const loading = ref(false);
  const bill = ref<SettlementBillDetailVo>({});

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

  const showWithdrawAction = computed(() => Number(bill.value.withdrawableAmount || 0) > 0);
  const billBizTypeText = computed(() => "轻托管结算单");
  const moneyText = (value?: number) => Number(value || 0).toFixed(2);
  const approvalStatusText = (value?: number) => approvalStatusMap[value ?? 0] || `状态${value ?? "-"}`;
  const settlementStatusText = (value?: number) => settlementStatusMap[value ?? 0] || `状态${value ?? "-"}`;

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
      const resp = await getOwnerSettlementBillDetail({ billId: String(props.billId) });
      if (resp.code !== 0 || !resp.data) {
        message(resp.message || "获取业主结算单详情失败", { type: "error" });
        return;
      }
      bill.value = resp.data;
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
    margin-top: 0;
  }

  .section-block {
    border: 1px solid var(--el-border-color-light);
    border-radius: 14px;
    padding: 16px;
    background: var(--el-fill-color-blank);
  }

  .section-block__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .section-block__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .section-block__count {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
</style>
