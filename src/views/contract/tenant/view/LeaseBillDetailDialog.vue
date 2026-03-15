<template>
  <div class="bill-detail-dialog">
    <el-skeleton v-if="loading" :rows="8" animated />
    <template v-else>
      <div class="detail-header">
        <div class="header-left">
          <div class="status-block">
            <div class="status-icon">
              <el-icon><i class="ri-bill-line" /></el-icon>
            </div>
            <div>
              <div class="status-label">当前状态</div>
              <div class="status-value" :class="statusClass">{{ payStatusText }}</div>
            </div>
          </div>
          <div class="header-divider" />
          <div class="header-item">
            <div class="item-label">付款人信息</div>
            <div class="item-value">{{ payerInfo }}</div>
          </div>
          <div class="header-divider" />
          <div class="header-item">
            <div class="item-label">金额</div>
            <div class="item-value">待收 ¥{{ bill.totalAmount ?? 0 }}</div>
          </div>
          <div class="header-divider" />
          <div class="header-item">
            <div class="item-label">账单摘要</div>
            <div class="item-value">{{ billSummary }}</div>
          </div>
          <div class="header-divider" />
          <div class="header-item">
            <div class="item-label">预计收款日期</div>
            <div class="item-value">{{ formatDate(bill.dueDate) }}</div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">账单信息</div>
        <el-descriptions :column="3" size="default" border>
          <el-descriptions-item label="账单编号">{{ bill.id || "-" }}</el-descriptions-item>
          <el-descriptions-item label="账单生成方式">系统生成</el-descriptions-item>
          <el-descriptions-item label="账单所属">租客</el-descriptions-item>
          <el-descriptions-item label="租客信息">{{ payerInfo }}</el-descriptions-item>
          <el-descriptions-item label="账单期数">第{{ bill.sortOrder }}期</el-descriptions-item>
          <el-descriptions-item label="账单类型">{{ billTypeText }}</el-descriptions-item>
          <el-descriptions-item label="账期">{{ formatDate(bill.rentPeriodStart) }} ~ {{ formatDate(bill.rentPeriodEnd) }}</el-descriptions-item>
          <el-descriptions-item label="租金">¥{{ bill.rentalAmount ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="押金">¥{{ bill.depositAmount ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="其他费用">¥{{ bill.otherFeeAmount ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="应收总额">¥{{ bill.totalAmount ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="支付状态">{{ payStatusText }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ bill.remark || "-" }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="section-card">
        <div class="section-title">流水信息</div>
        <el-descriptions v-if="hasFlow" :column="2" size="default" border>
          <el-descriptions-item label="支付时间">{{ formatDateTime(bill.payTime) }}</el-descriptions-item>
          <el-descriptions-item label="支付金额">¥{{ bill.payAmount ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ payChannelText }}</el-descriptions-item>
          <el-descriptions-item label="流水备注">{{ bill.remark || "-" }}</el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="暂无流水记录" :image-size="80" />
      </div>

      <div class="section-card">
        <div class="section-title">财务流水</div>
        <div v-if="financeFlowList && financeFlowList.length" class="flow-list">
          <el-descriptions
            v-for="flow in financeFlowList"
            :key="flow.flowNo || flow.flowTime || flow.bizId"
            :column="2"
            size="default"
            border
            class="flow-item"
          >
            <el-descriptions-item label="财务流水号">{{ flow.flowNo || "-" }}</el-descriptions-item>
            <el-descriptions-item label="流水类型">{{ flow.flowType || "-" }}</el-descriptions-item>
            <el-descriptions-item label="资金方向">{{ flow.flowDirection || "-" }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ flow.status || "-" }}</el-descriptions-item>
            <el-descriptions-item label="业务单号">{{ flow.bizNo || "-" }}</el-descriptions-item>
            <el-descriptions-item label="流水时间">{{ formatDateTime(flow.flowTime) }}</el-descriptions-item>
            <el-descriptions-item label="金额">¥{{ formatAmount(flow.amount) }}</el-descriptions-item>
            <el-descriptions-item label="收款方">{{ flow.receiverName || "-" }}</el-descriptions-item>
            <el-descriptions-item label="付款方">{{ formatPayer(flow) }}</el-descriptions-item>
            <el-descriptions-item label="操作人">{{ flow.operatorName || "-" }}</el-descriptions-item>
            <el-descriptions-item label="备注">{{ flow.remark || "-" }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <el-empty v-else description="暂无财务流水" :image-size="80" />
      </div>

      <div class="section-card">
        <div class="section-title">支付流水</div>
        <el-descriptions v-if="paymentFlow" :column="2" size="default" border>
          <el-descriptions-item label="支付流水号">{{ paymentFlow.paymentNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="支付渠道">{{ paymentFlow.channel || "-" }}</el-descriptions-item>
          <el-descriptions-item label="支付状态">{{ paymentFlow.status || "-" }}</el-descriptions-item>
          <el-descriptions-item label="第三方单号">{{ paymentFlow.thirdTradeNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="支付金额">¥{{ formatAmount(paymentFlow.amount) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ formatDateTime(paymentFlow.payTime) }}</el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="暂无支付流水" :image-size="80" />
      </div>

      <div class="section-card">
        <div class="section-title">账单明细</div>
        <el-table v-if="bill.otherFees && bill.otherFees.length" :data="bill.otherFees" border size="small">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="name" label="费用名称" min-width="120" />
          <el-table-column prop="amount" label="金额" width="100">
            <template #default="{ row }">¥{{ row.amount }}</template>
          </el-table-column>
          <el-table-column prop="remark" label="说明" min-width="200" show-overflow-tooltip />
        </el-table>
        <el-empty v-else description="暂无费用明细" :image-size="80" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import type { LeaseBillListVo } from "@/types";
  import { getLeaseBillDetail } from "@/api/contract/tenant";

  interface FinanceFlowLite {
    flowNo?: string;
    bizNo?: string;
    flowType?: string;
    flowDirection?: string;
    status?: string;
    amount?: number;
    flowTime?: string;
    payerName?: string;
    payerPhone?: string;
    receiverName?: string;
    operatorName?: string;
    remark?: string;
  }

  interface PaymentFlowLite {
    paymentNo?: string;
    channel?: string;
    status?: string;
    thirdTradeNo?: string;
    amount?: number;
    payTime?: string;
  }

  interface Props {
    billId: string;
  }

  const props = defineProps<Props>();

  const bill = ref<LeaseBillListVo>({} as LeaseBillListVo);
  const loading = ref(false);

  onMounted(async () => {
    if (!props.billId) return;
    loading.value = true;
    try {
    const res = await getLeaseBillDetail({ billId: props.billId });
      if (res.code === 0 && res.data) {
        bill.value = res.data;
      }
    } finally {
      loading.value = false;
    }
  });

  const billTypeText = computed(() => {
    const type = bill.value.billType;
    if (type === 1) return "租金";
    if (type === 2) return "押金";
    if (type === 5) return "押金结转入";
    if (type === 6) return "押金结转出";
    return "其他费用";
  });

  const payStatusText = computed(() => {
    const status = bill.value.payStatus;
    if (status === 0) return "未支付";
    if (status === 1) return "部分支付";
    if (status === 2) return "已支付";
    if (status === 3) return "逾期";
    return "未知";
  });

  const payChannelText = computed(() => {
    const channel = bill.value.payChannel;
    if (channel === 1) return "现金";
    if (channel === 2) return "转账";
    if (channel === 3) return "支付宝";
    if (channel === 4) return "微信";
    if (channel === 5) return "其他";
    return "-";
  });

  const hasFlow = computed(() => Boolean(bill.value.payTime || bill.value.payAmount || bill.value.payChannel));

  const financeFlowList = computed(() => {
    const data = bill.value as LeaseBillListVo & { financeFlowList?: FinanceFlowLite[] };
    return data.financeFlowList || [];
  });

  const paymentFlow = computed(() => {
    const data = bill.value as LeaseBillListVo & { paymentFlow?: PaymentFlowLite };
    return data.paymentFlow;
  });

  const payerInfo = computed(() => {
    const tenantId = bill.value.tenantId ?? "-";
    return `租客ID ${tenantId}`;
  });

  const billSummary = computed(() => {
    const items: string[] = [];
    if ((bill.value.rentalAmount ?? 0) > 0) items.push("租金");
    if ((bill.value.otherFeeAmount ?? 0) > 0) items.push("杂费");
    if ((bill.value.depositAmount ?? 0) > 0) items.push("押金");
    return items.length ? items.join(" / ") : "账单费用";
  });

  const statusClass = computed(() => {
    if (bill.value.payStatus === 0) return "status--unpaid";
    if (bill.value.payStatus === 1) return "status--partial";
    if (bill.value.payStatus === 2) return "status--paid";
    if (bill.value.payStatus === 3) return "status--overdue";
    return "";
  });

  const formatDate = (val?: string) => (val ? val.substring(0, 10) : "-");
  const formatDateTime = (val?: string) => (val ? val.substring(0, 19).replace("T", " ") : "-");
  const formatAmount = (val?: number) => {
    if (val === undefined || val === null) return "-";
    return (val / 100).toFixed(2);
  };

  const formatPayer = (flow?: FinanceFlowLite) => {
    if (!flow) return "-";
    if (flow.payerName && flow.payerPhone) return `${flow.payerName}（${flow.payerPhone}）`;
    return flow.payerName || flow.payerPhone || "-";
  };
</script>

<style scoped>
  .bill-detail-dialog {
    display: grid;
    gap: 16px;
  }

  .detail-header {
    border-radius: 10px;
    padding: 16px 20px;
    background: #eef2ff;
  }

  .header-left {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }

  .header-divider {
    width: 1px;
    height: 42px;
    background: #d9e2ff;
  }

  .status-block {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 160px;
  }

  .status-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2563eb;
    font-size: 20px;
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.12);
  }

  .status-label {
    color: #6b7280;
    font-size: 12px;
  }

  .status-value {
    font-size: 16px;
    font-weight: 600;
    margin-top: 4px;
  }

  .status--unpaid {
    color: #f97316;
  }

  .status--paid {
    color: #16a34a;
  }

  .status--partial {
    color: #f59e0b;
  }

  .status--overdue {
    color: #ef4444;
  }

  .header-item {
    display: grid;
    gap: 6px;
  }

  .item-label {
    color: #6b7280;
    font-size: 12px;
  }

  .item-value {
    color: #111827;
    font-size: 14px;
    font-weight: 600;
  }

  .section-card {
    background: #ffffff;
    border-radius: 10px;
    padding: 16px 20px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  }

  .flow-list {
    display: grid;
    gap: 12px;
  }

  .flow-item {
    margin-bottom: 0;
  }

  .section-title {
    font-weight: 600;
    margin-bottom: 12px;
  }
</style>
