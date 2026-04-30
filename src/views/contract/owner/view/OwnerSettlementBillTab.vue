<template>
  <div v-loading="loading" class="owner-detail-finance-tab">
    <div class="owner-detail-finance-toolbar">
      <div class="owner-detail-finance-toolbar__title">
        <span class="owner-detail-finance-toolbar__main">轻托管业主结算单</span>
        <span class="owner-detail-finance-toolbar__sub">按当前业主合同展示结算金额、费用来源、减免与提现口径。</span>
      </div>
      <el-button :disabled="!ownerIdText" @click="fetchData">刷新</el-button>
    </div>

    <div class="owner-detail-finance-summary">
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">结算单数</div>
        <div class="owner-detail-finance-summary__value">{{ summary.billCount || 0 }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">收入总额</div>
        <div class="owner-detail-finance-summary__value is-income">{{ moneyText(summary.totalIncomeAmount) }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">应结总额</div>
        <div class="owner-detail-finance-summary__value">{{ moneyText(summary.totalPayableAmount) }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">已结总额</div>
        <div class="owner-detail-finance-summary__value is-income">{{ moneyText(summary.totalSettledAmount) }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">未结总额</div>
        <div class="owner-detail-finance-summary__value is-warning">{{ moneyText(summary.totalUnpaidAmount) }}</div>
      </div>
      <div class="owner-detail-finance-summary__card">
        <div class="owner-detail-finance-summary__label">可提现总额</div>
        <div class="owner-detail-finance-summary__value is-income">{{ moneyText(summary.totalWithdrawableAmount) }}</div>
      </div>
    </div>

    <div v-if="detailList.length" class="owner-detail-finance-list">
      <div v-for="bill in detailList" :key="bill.billId || bill.billNo" class="owner-detail-finance-card">
        <div class="owner-detail-finance-card__header">
          <div>
            <div class="owner-detail-finance-card__title">
              <span class="owner-detail-finance-card__no">{{ bill.billNo || "未生成单号" }}</span>
              <el-tag :type="approvalStatusTagType(bill.approvalStatus)" effect="light">{{ approvalStatusText(bill.approvalStatus) }}</el-tag>
              <el-tag :type="settlementStatusTagType(bill.settlementStatus)" effect="light">{{ settlementStatusText(bill.settlementStatus) }}</el-tag>
            </div>
            <div class="owner-detail-finance-card__meta">
              <span>{{ bill.subjectName || "未关联房源" }}</span>
              <span>账期：{{ dateRangeText(bill.billStartDate, bill.billEndDate) }}</span>
              <span>生成：{{ datetimeText(bill.generatedAt) }}</span>
            </div>
          </div>
        </div>

        <div class="owner-detail-finance-card__body">
          <div class="owner-detail-finance-metrics">
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">收入金额</div>
              <div class="owner-detail-finance-metric__value is-income">{{ moneyText(bill.incomeAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">费用金额</div>
              <div class="owner-detail-finance-metric__value is-expense">{{ moneyText(bill.expenseAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">减免金额</div>
              <div class="owner-detail-finance-metric__value is-warning">{{ moneyText(bill.reductionAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">调整金额</div>
              <div class="owner-detail-finance-metric__value">{{ moneyText(bill.adjustAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">应结金额</div>
              <div class="owner-detail-finance-metric__value">{{ moneyText(bill.payableAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">已结金额</div>
              <div class="owner-detail-finance-metric__value is-income">{{ moneyText(bill.settledAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">未结金额</div>
              <div class="owner-detail-finance-metric__value is-warning">{{ moneyText(bill.unpaidAmount) }}</div>
            </div>
            <div class="owner-detail-finance-metric">
              <div class="owner-detail-finance-metric__label">可提现金额</div>
              <div class="owner-detail-finance-metric__value is-income">{{ moneyText(bill.withdrawableAmount) }}</div>
            </div>
          </div>

          <div class="owner-detail-finance-section">
            <div class="owner-detail-finance-section__title">
              <span>结算费用明细</span>
              <el-tag size="small" type="info" effect="plain">{{ bill.feeList?.length || 0 }} 项</el-tag>
            </div>
            <el-table :data="bill.feeList || []" border stripe empty-text="暂无费用明细">
              <el-table-column prop="feeName" label="费用名称" min-width="160" />
              <el-table-column label="收支" width="90">
                <template #default="{ row }">
                  <el-tag :type="directionTagType(row.direction)" effect="light">{{ directionText(row.direction) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="金额" width="130" align="right">
                <template #default="{ row }">{{ moneyText(row.amount) }}</template>
              </el-table-column>
              <el-table-column prop="bizDate" label="业务日期" width="120" />
              <el-table-column prop="formulaSnapshot" label="计算说明" min-width="220" show-overflow-tooltip />
              <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
            </el-table>
          </div>

          <div class="owner-detail-finance-section">
            <div class="owner-detail-finance-section__title">
              <span>减免明细</span>
              <el-tag size="small" type="info" effect="plain">{{ bill.reductionList?.length || 0 }} 项</el-tag>
            </div>
            <el-table :data="bill.reductionList || []" border stripe empty-text="暂无减免明细">
              <el-table-column prop="reductionName" label="减免名称" min-width="160" />
              <el-table-column label="金额" width="130" align="right">
                <template #default="{ row }">{{ moneyText(row.amount) }}</template>
              </el-table-column>
              <el-table-column prop="bizDate" label="业务日期" width="120" />
              <el-table-column prop="ruleSnapshot" label="规则说明" min-width="220" show-overflow-tooltip />
              <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="owner-detail-finance-empty">
      <el-empty description="当前业主合同暂无结算单" :image-size="90" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import { getOwnerSettlementBillDetail, getOwnerSettlementBillPage, getOwnerSettlementBillSummary } from "@/api/owner/owner";
  import { BizApprovalStatusEnumMeta, OwnerSettlementStatusEnumMeta } from "@/types/generated/enum.meta";
  import type { SettlementBillDetailVo, SettlementBillListVo, SettlementBillSummaryVo } from "@/api/owner/owner";
  import "./ownerDetailFinanceTab.scss";

  defineOptions({ name: "OwnerSettlementBillTab" });

  const props = defineProps<{ ownerId?: string | number; contractId?: string | number }>();

  const loading = ref(false);
  const summary = ref<SettlementBillSummaryVo>({});
  const detailList = ref<SettlementBillDetailVo[]>([]);
  const ownerIdText = computed(() => (props.ownerId ? String(props.ownerId) : ""));
  const contractIdText = computed(() => (props.contractId ? String(props.contractId) : ""));

  function buildQuery() {
    return {
      currentPage: "1",
      pageSize: "10",
      ownerId: ownerIdText.value,
      contractId: contractIdText.value || undefined
    };
  }

  async function fetchData() {
    if (!ownerIdText.value) {
      summary.value = {};
      detailList.value = [];
      return;
    }

    loading.value = true;
    try {
      const query = buildQuery();
      const [pageResp, summaryResp] = await Promise.all([getOwnerSettlementBillPage(query), getOwnerSettlementBillSummary(query)]);
      summary.value = summaryResp.data || {};
      const list = pageResp.data?.list || [];
      detailList.value = await fetchDetailList(list);
    } finally {
      loading.value = false;
    }
  }

  async function fetchDetailList(list: SettlementBillListVo[]) {
    return Promise.all(
      list.map(async item => {
        if (!item.billId) return item as SettlementBillDetailVo;
        const resp = await getOwnerSettlementBillDetail({ billId: item.billId });
        return resp.data || (item as SettlementBillDetailVo);
      })
    );
  }

  function moneyText(value?: number | string | null) {
    const amount = Number(value ?? 0);
    return `¥${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
  }

  function datetimeText(value?: string) {
    return value || "-";
  }

  function dateRangeText(start?: string, end?: string) {
    return `${start || "-"} 至 ${end || "-"}`;
  }

  function metaName(meta: Record<string, { code?: unknown; name?: string }>, code?: unknown) {
    return Object.values(meta).find(item => item.code === code)?.name || "-";
  }

  function approvalStatusText(code?: number) {
    return metaName(BizApprovalStatusEnumMeta, code);
  }

  function settlementStatusText(code?: number) {
    return metaName(OwnerSettlementStatusEnumMeta, code);
  }

  function approvalStatusTagType(code?: number) {
    if (code === BizApprovalStatusEnumMeta.APPROVED.code) return "success";
    if (code === BizApprovalStatusEnumMeta.REJECTED.code) return "danger";
    if (code === BizApprovalStatusEnumMeta.WITHDRAWN.code) return "info";
    return "warning";
  }

  function settlementStatusTagType(code?: number) {
    if (code === OwnerSettlementStatusEnumMeta.SETTLED.code) return "success";
    if (code === OwnerSettlementStatusEnumMeta.PART_SETTLED.code) return "warning";
    return "info";
  }

  function directionText(direction?: string) {
    if (direction === "IN") return "收入";
    if (direction === "OUT") return "支出";
    return direction || "-";
  }

  function directionTagType(direction?: string) {
    return direction === "IN" ? "success" : direction === "OUT" ? "danger" : "info";
  }

  watch(() => [props.ownerId, props.contractId], fetchData, { immediate: true });
</script>
