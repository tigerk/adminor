<template>
  <div class="owner-bill-detail">
    <el-skeleton v-if="loading" class="detail-skeleton" :rows="12" animated />

    <template v-else>
      <section class="bill-hero">
        <div class="hero-main">
          <div class="hero-title-row">
            <h2>{{ displayText(bill.billNo) }}</h2>
            <el-tag effect="plain" type="success">{{ billBizTypeText }}</el-tag>
            <el-tag :type="approvalTagType(bill.approvalStatus)" effect="plain">
              {{ approvalStatusText(bill.approvalStatus) }}
            </el-tag>
            <el-tag :type="settlementTagType(bill.settlementStatus)" effect="plain">
              {{ settlementStatusText(bill.settlementStatus) }}
            </el-tag>
          </div>
          <div class="hero-meta">
            <span>业主：{{ displayText(bill.ownerName) }}</span>
            <span>合同：{{ displayText(bill.contractNo) }}</span>
            <span>账期：{{ dateRangeText(bill.billStartDate, bill.billEndDate) }}</span>
          </div>
        </div>
      </section>

      <section class="amount-ledger">
        <div class="amount-item amount-item--income">
          <span>收入金额</span>
          <strong>¥{{ moneyText(bill.incomeAmount) }}</strong>
        </div>
        <div class="amount-item amount-item--expense">
          <span>费用金额</span>
          <strong>¥{{ moneyText(bill.expenseAmount) }}</strong>
        </div>
        <div class="amount-item amount-item--payable">
          <span>结算金额</span>
          <strong>¥{{ moneyText(bill.payableAmount) }}</strong>
        </div>
        <div class="amount-item amount-item--withdrawable">
          <span>可提现金额</span>
          <strong>¥{{ moneyText(bill.withdrawableAmount) }}</strong>
        </div>
      </section>

      <section class="detail-dashboard">
        <div class="detail-card detail-card--main">
          <div class="detail-card__header">
            <h3>基础信息</h3>
          </div>
          <div class="detail-fields">
            <div class="detail-field">
              <span>业主</span>
              <strong>{{ displayText(bill.ownerName) }}</strong>
            </div>
            <div class="detail-field">
              <span>联系电话</span>
              <strong>{{ displayText(bill.ownerPhone) }}</strong>
            </div>
            <div class="detail-field">
              <span>合同编号</span>
              <strong>{{ displayText(bill.contractNo) }}</strong>
            </div>
            <div class="detail-field">
              <span>账单类型</span>
              <strong>{{ billBizTypeText }}</strong>
            </div>
            <div class="detail-field detail-field--wide">
              <span>合同房源</span>
              <strong>{{ displayText(bill.subjectName) }}</strong>
            </div>
            <div class="detail-field">
              <span>生成时间</span>
              <strong>{{ displayText(bill.createAt || bill.gmtCreate || bill.generatedAt) }}</strong>
            </div>
            <div class="detail-field">
              <span>更新时间</span>
              <strong>{{ displayText(bill.updateAt || bill.gmtModified) }}</strong>
            </div>
            <div class="detail-field detail-field--wide">
              <span>备注</span>
              <strong>{{ displayText(bill.remark) }}</strong>
            </div>
          </div>
        </div>

        <div class="detail-card detail-card--side">
          <div class="detail-card__header">
            <h3>状态与金额构成</h3>
          </div>
          <div class="status-summary">
            <div class="status-summary__item">
              <span>审批状态</span>
              <el-tag :type="approvalTagType(bill.approvalStatus)" effect="plain">
                {{ approvalStatusText(bill.approvalStatus) }}
              </el-tag>
            </div>
            <div class="status-summary__item">
              <span>结算状态</span>
              <el-tag :type="settlementTagType(bill.settlementStatus)" effect="plain">
                {{ settlementStatusText(bill.settlementStatus) }}
              </el-tag>
            </div>
          </div>
          <div class="amount-formula">
            <div class="formula-line">
              <span>收入</span>
              <strong>¥{{ moneyText(bill.incomeAmount) }}</strong>
            </div>
            <div class="formula-line">
              <span>费用</span>
              <strong>-¥{{ moneyText(bill.expenseAmount) }}</strong>
            </div>
            <div class="formula-line">
              <span>减免</span>
              <strong>-¥{{ moneyText(bill.reductionAmount) }}</strong>
            </div>
            <div class="formula-line">
              <span>调账</span>
              <strong>¥{{ moneyText(bill.adjustAmount) }}</strong>
            </div>
            <div class="formula-line formula-line--total">
              <span>结算金额</span>
              <strong>¥{{ moneyText(bill.payableAmount) }}</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="section-panel">
        <div class="section-title-row">
          <h3>结算明细</h3>
          <span>共 {{ bill.feeList?.length || 0 }} 项</span>
        </div>
        <el-table :data="bill.feeList || []" border class="detail-table">
          <el-table-column prop="feeName" label="项目" min-width="150" show-overflow-tooltip />
          <el-table-column label="类型" min-width="140">
            <template #default="{ row }">
              {{ feeTypeText(row.feeType) }}
            </template>
          </el-table-column>
          <el-table-column label="方向" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="row.direction === 'IN' ? 'success' : 'danger'" effect="plain">
                {{ row.direction === "IN" ? "收入" : "支出" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额" min-width="130" align="right">
            <template #default="{ row }">
              <span :class="['money-cell', row.direction === 'IN' ? 'money-cell--in' : 'money-cell--out']">¥{{ moneyText(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="bizDate" label="业务日期" min-width="130" />
          <el-table-column prop="formulaSnapshot" label="计算说明" min-width="220" show-overflow-tooltip />
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>
      </section>

      <section class="section-panel">
        <div class="section-title-row">
          <h3>账单减免</h3>
          <span>共 {{ bill.reductionList?.length || 0 }} 项</span>
        </div>
        <el-table :data="bill.reductionList || []" border class="detail-table">
          <el-table-column label="减免项" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ displayText(row.reductionName || row.reductionItemName) }}</template>
          </el-table-column>
          <el-table-column prop="reductionType" label="减免类型" min-width="140" show-overflow-tooltip />
          <el-table-column label="减免金额" min-width="130" align="right">
            <template #default="{ row }">¥{{ moneyText(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="bizDate" label="业务日期" min-width="130" />
          <el-table-column prop="ruleSnapshot" label="规则快照" min-width="220" show-overflow-tooltip />
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import { getOwnerSettlementBillDetail, type SettlementBillDetailVo } from "@/api/owner/owner";
  import { LeaseBillFeeTypeEnumMeta, OwnerBillingItemTypeEnumMeta } from "@/types/generated/enum.meta";
  import { message } from "@/utils/message";

  defineOptions({ name: "OwnerSettlementBillDetailDialog" });

  interface Props {
    billId: number | string;
  }

  type TagType = "success" | "warning" | "info" | "primary" | "danger";

  type EnumMetaItem = {
    value?: string | number;
    code?: string | number;
    label?: string;
    name?: string;
  };

  const props = defineProps<Props>();

  const loading = ref(false);
  const bill = ref<SettlementBillDetailVo & { gmtCreate?: string; gmtModified?: string }>({});

  const approvalStatusMap: Record<string, { text: string; type: TagType }> = {
    1: { text: "审批中", type: "warning" },
    2: { text: "已通过", type: "success" },
    3: { text: "已驳回", type: "danger" },
    4: { text: "已撤回", type: "info" },
    PENDING: { text: "待审批", type: "warning" },
    APPROVED: { text: "已通过", type: "success" },
    REJECTED: { text: "已驳回", type: "danger" }
  };

  const settlementStatusMap: Record<string, { text: string; type: TagType }> = {
    0: { text: "未结算", type: "info" },
    1: { text: "部分结算", type: "warning" },
    2: { text: "已结算", type: "success" },
    UNSETTLED: { text: "未结算", type: "info" },
    PART_SETTLED: { text: "部分结算", type: "warning" },
    PARTIAL: { text: "部分结算", type: "warning" },
    SETTLED: { text: "已结算", type: "success" }
  };

  const feeTypeFallbackMap: Record<string, string> = {
    RENTAL: "租金",
    RENT: "租金",
    DEPOSIT: "押金",
    OTHER_FEE: "其他费用",
    MANAGEMENT_FEE: "管理费",
    BREACH_PENALTY: "违约金"
  };

  const billBizTypeText = "轻托管结算单";

  const displayText = (value?: string | number | null) => {
    if (value === undefined || value === null || value === "") {
      return "-";
    }
    return String(value);
  };

  const moneyText = (value?: number | string | null) => {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
  };

  const dateRangeText = (start?: string | null, end?: string | null) => {
    const startText = displayText(start);
    const endText = displayText(end);
    if (startText === "-" && endText === "-") {
      return "-";
    }
    return `${startText} 至 ${endText}`;
  };

  const enumText = (meta: Record<string, EnumMetaItem>, value?: string | number | null) => {
    if (value === undefined || value === null || value === "") {
      return "";
    }
    const valueText = String(value);
    const item = Object.values(meta).find(metaItem => {
      return String(metaItem.value ?? "") === valueText || String(metaItem.code ?? "") === valueText;
    });
    return item?.label || item?.name || "";
  };

  const feeTypeText = (value?: string | number | null) => {
    if (value === undefined || value === null || value === "") {
      return "-";
    }
    const valueText = String(value);
    return enumText(LeaseBillFeeTypeEnumMeta, valueText) || enumText(OwnerBillingItemTypeEnumMeta, valueText) || feeTypeFallbackMap[valueText] || valueText;
  };

  const approvalStatusText = (status?: string | number | null) => {
    if (status === undefined || status === null || status === "") {
      return "-";
    }
    return approvalStatusMap[String(status)]?.text || String(status);
  };

  const approvalTagType = (status?: string | number | null): TagType => {
    if (status === undefined || status === null || status === "") {
      return "info";
    }
    return approvalStatusMap[String(status)]?.type || "info";
  };

  const settlementStatusText = (status?: string | number | null) => {
    if (status === undefined || status === null || status === "") {
      return "-";
    }
    return settlementStatusMap[String(status)]?.text || String(status);
  };

  const settlementTagType = (status?: string | number | null): TagType => {
    if (status === undefined || status === null || status === "") {
      return "info";
    }
    return settlementStatusMap[String(status)]?.type || "info";
  };

  const fetchDetail = async () => {
    if (!props.billId) {
      return;
    }
    loading.value = true;
    try {
      const res = await getOwnerSettlementBillDetail({ billId: props.billId });
      if (res.code !== 0 || !res.data) {
        message(res.message || "获取业主结算单详情失败", { type: "error" });
        return;
      }
      bill.value = res.data || {};
    } catch (error) {
      console.error(error);
      message("获取结算单详情失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  fetchDetail();
</script>

<style scoped lang="scss">
  .owner-bill-detail {
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: var(--el-text-color-primary);
  }

  .detail-skeleton {
    padding: 8px 0;
  }

  .bill-hero {
    padding: 4px 0 2px;
  }

  .hero-main {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  .hero-title-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;

    h2 {
      max-width: 100%;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 24px;
      line-height: 1.25;
      color: var(--el-text-color-primary);
      white-space: nowrap;
    }
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    color: var(--el-text-color-secondary);

    span {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .amount-ledger {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .amount-item {
    position: relative;
    min-width: 0;
    padding: 18px 20px;
    overflow: hidden;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      content: "";
      background: var(--el-border-color);
    }

    span {
      display: block;
      margin-bottom: 12px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }

    strong {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 25px;
      line-height: 1.2;
      white-space: nowrap;
    }
  }

  .amount-item--income {
    strong {
      color: var(--el-text-color-primary);
    }
  }

  .amount-item--expense {
    &::before {
      background: var(--el-color-warning);
    }

    strong {
      color: var(--el-color-warning);
    }
  }

  .amount-item--payable {
    &::before {
      background: var(--el-color-success);
    }

    strong {
      color: var(--el-color-success);
    }
  }

  .amount-item--withdrawable {
    &::before {
      background: var(--el-color-primary);
    }

    strong {
      color: var(--el-color-primary);
    }
  }

  .detail-dashboard {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.85fr);
    gap: 12px;
  }

  .detail-card,
  .section-panel {
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
  }

  .detail-card {
    min-width: 0;
    padding: 20px 22px;
  }

  .detail-card__header,
  .section-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .detail-card__header h3,
  .section-title-row h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .detail-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 22px;
    margin-top: 16px;
  }

  .detail-field {
    min-width: 0;

    span {
      display: block;
      margin-bottom: 7px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    strong {
      display: block;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 600;
      color: var(--el-text-color-primary);
      white-space: nowrap;
    }
  }

  .detail-field--wide {
    grid-column: 1 / -1;

    strong {
      white-space: normal;
    }
  }

  .detail-card--side {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .status-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .status-summary__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
    min-height: 32px;

    span {
      color: var(--el-text-color-secondary);
    }
  }

  .amount-formula {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .formula-line {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;

    span {
      color: var(--el-text-color-secondary);
    }

    strong {
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .formula-line--total {
    padding-top: 12px;
    margin-top: 2px;
    border-top: 1px dashed var(--el-border-color);

    strong {
      font-size: 18px;
      color: var(--el-color-success);
    }
  }

  .section-panel {
    padding: 20px 24px 26px;
  }

  .section-title-row {
    margin-bottom: 16px;

    span {
      color: var(--el-text-color-secondary);
    }
  }

  .detail-table {
    width: 100%;
  }

  .money-cell {
    font-weight: 600;
  }

  .money-cell--in {
    color: var(--el-color-success);
  }

  .money-cell--out {
    color: var(--el-color-danger);
  }

  @media (width <= 1200px) {
    .amount-ledger {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 900px) {
    .detail-dashboard {
      grid-template-columns: 1fr;
    }
  }

  @media (width <= 640px) {
    .amount-ledger {
      grid-template-columns: 1fr;
    }

    .section-panel {
      padding: 16px;
    }

    .detail-card {
      padding: 16px;
    }

    .detail-fields,
    .status-summary {
      grid-template-columns: 1fr;
    }
  }
</style>
