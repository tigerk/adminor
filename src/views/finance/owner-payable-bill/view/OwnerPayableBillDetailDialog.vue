<template>
  <div class="owner-payable-bill-detail">
    <el-skeleton v-if="loading" :rows="10" animated />
    <template v-else>
      <div class="detail-header">
        <div class="detail-header__main">
          <div class="detail-header__title">
            <span>{{ bill.billNo || "包租应付单" }}</span>
            <el-tag size="small" effect="plain" type="warning">包租应付单</el-tag>
          </div>
          <div class="detail-header__meta">
            <span>业主：{{ bill.ownerName || "-" }}</span>
            <span>合同：{{ bill.contractNo || "-" }}</span>
            <span>账期：{{ bill.billStartDate || "-" }} 至 {{ bill.billEndDate || "-" }}</span>
            <span>应付日期：{{ bill.dueDate || "-" }}</span>
          </div>
        </div>
        <div class="detail-header__actions">
          <el-button v-if="showPaymentAction" type="primary" @click="openPaymentDialog">登记付款</el-button>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-card__label">应付金额</span>
          <strong class="summary-card__value">¥{{ moneyText(bill.payableAmount) }}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">已付金额</span>
          <strong class="summary-card__value summary-card__value--success">¥{{ moneyText(bill.paidAmount) }}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">未付金额</span>
          <strong class="summary-card__value summary-card__value--warning">¥{{ moneyText(bill.unpaidAmount) }}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">付款状态</span>
          <strong class="summary-card__value">{{ paymentStatusText(bill.paymentStatus) }}</strong>
        </div>
      </div>

      <el-descriptions :column="2" border class="detail-descriptions">
        <el-descriptions-item label="应付单号">{{ bill.billNo || "-" }}</el-descriptions-item>
        <el-descriptions-item label="单据状态">
          <el-tag :type="Number(bill.billStatus || 1) === 2 ? 'danger' : 'success'">{{ Number(bill.billStatus || 1) === 2 ? "已作废" : "正常" }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="业主">{{ bill.ownerName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ bill.ownerPhone || "-" }}</el-descriptions-item>
        <el-descriptions-item label="合同编号">{{ bill.contractNo || "-" }}</el-descriptions-item>
        <el-descriptions-item label="合同房源">{{ bill.subjectName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="应付日期">{{ bill.dueDate || "-" }}</el-descriptions-item>
        <el-descriptions-item label="生成时间">{{ bill.generatedAt || "-" }}</el-descriptions-item>
        <el-descriptions-item label="付款状态">
          <el-tag :type="paymentStatusTagType(bill.paymentStatus)">{{ paymentStatusText(bill.paymentStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ bill.updateTime || "-" }}</el-descriptions-item>
        <el-descriptions-item label="作废人">{{ bill.cancelByName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="作废时间">{{ bill.cancelAt || "-" }}</el-descriptions-item>
        <el-descriptions-item label="作废原因" :span="2">{{ bill.cancelReason || "-" }}</el-descriptions-item>
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
          <el-table-column prop="bizTime" label="业务日期" min-width="120" />
          <el-table-column prop="formulaSnapshot" label="计算说明" min-width="240" show-overflow-tooltip />
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>
      </div>

      <div class="section-block">
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
          <el-table-column prop="payAt" label="付款时间" min-width="160" />
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

      <div class="section-block">
        <div class="section-block__header">
          <span class="section-block__title">操作记录</span>
          <span class="section-block__count">共 {{ bill.operateLogList?.length || 0 }} 条</span>
        </div>
        <el-table :data="bill.operateLogList || []" border>
          <el-table-column prop="operateDesc" label="操作" min-width="160" />
          <el-table-column prop="operatorName" label="操作人" min-width="120" />
          <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
          <el-table-column prop="createTime" label="操作时间" min-width="180" />
        </el-table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, h, ref } from "vue";
  import { addDialog } from "@/components/ReDialog";
  import { createOwnerPayableBillPayment, getOwnerPayableBillDetail, type PayableBillDetailVo, type PayableBillPaymentCreateDto } from "@/api/owner/owner";
  import OwnerPayableBillPaymentDialog from "@/views/finance/owner-payable-bill/view/OwnerPayableBillPaymentDialog.vue";
  import { message } from "@/utils/message";
  import { PaymentFlowChannelEnumMeta } from "@/types/generated/enum.meta";

  defineOptions({ name: "OwnerPayableBillDetailDialog" });

  const props = defineProps<{ billId: string | number }>();
  const loading = ref(false);
  const paymentFormRef = ref();
  const bill = ref<PayableBillDetailVo>({});

  const payChannelLabelMap = Object.values(PaymentFlowChannelEnumMeta).reduce<Record<string, string>>((acc, item) => {
    acc[item.value] = item.label || item.value;
    return acc;
  }, {});

  const paymentStatusMap: Record<number, string> = {
    0: "未付款",
    1: "部分付款",
    2: "已付款"
  };

  const showPaymentAction = computed(() => Number(bill.value.billStatus || 1) === 1 && Number(bill.value.unpaidAmount || 0) > 0);
  const moneyText = (value?: number) => Number(value || 0).toFixed(2);
  const paymentStatusText = (value?: number) => paymentStatusMap[value ?? 0] || `状态${value ?? "-"}`;
  const payChannelText = (value?: string) => (value ? payChannelLabelMap[value] || value : "-");

  const paymentStatusTagType = (value?: number) => {
    if (value === 2) return "success";
    if (value === 1) return "warning";
    return "info";
  };

  async function fetchDetail() {
    loading.value = true;
    try {
      const resp = await getOwnerPayableBillDetail({ billId: String(props.billId) });
      if (resp.code !== 0 || !resp.data) {
        message(resp.message || "获取包租应付单详情失败", { type: "error" });
        return;
      }
      bill.value = resp.data;
    } finally {
      loading.value = false;
    }
  }

  function openPaymentDialog() {
    if (!bill.value.billId || Number(bill.value.unpaidAmount || 0) <= 0) {
      message("当前账单无可登记付款金额", { type: "warning" });
      return;
    }
    addDialog({
      title: "登记付款",
      width: "720px",
      lockScroll: true,
      alignCenter: true,
      closeOnClickModal: false,
      contentRenderer: () =>
        h(OwnerPayableBillPaymentDialog, {
          ref: paymentFormRef,
          billId: String(bill.value.billId),
          unpaidAmount: Number(bill.value.unpaidAmount || 0)
        }),
      beforeSure: async done => {
        const payload = await paymentFormRef.value?.validateAndBuildPayload?.();
        if (!payload) return;
        const resp = await createOwnerPayableBillPayment(payload as PayableBillPaymentCreateDto);
        if (resp.code === 0) {
          message("付款登记成功", { type: "success" });
          await fetchDetail();
          done();
          return;
        }
        message(resp.message || "付款登记失败", { type: "error" });
      }
    });
  }

  fetchDetail();
</script>

<style scoped lang="scss">
  .owner-payable-bill-detail { display: flex; flex-direction: column; gap: 16px; }
  .detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .detail-header__main { display: flex; flex-direction: column; gap: 8px; }
  .detail-header__title { display: flex; align-items: center; gap: 10px; color: var(--el-text-color-primary); font-size: 20px; font-weight: 600; }
  .detail-header__meta { display: flex; flex-wrap: wrap; gap: 12px 20px; color: var(--el-text-color-secondary); font-size: 13px; }
  .detail-header__actions { display: flex; align-items: center; gap: 12px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .summary-card { display: flex; flex-direction: column; gap: 10px; padding: 16px; border: 1px solid var(--el-border-color-light); border-radius: 14px; background: var(--el-fill-color-blank); }
  .summary-card__label { color: var(--el-text-color-secondary); font-size: 13px; }
  .summary-card__value { color: var(--el-text-color-primary); font-size: 22px; font-weight: 600; line-height: 1.2; }
  .summary-card__value--success { color: var(--el-color-success); }
  .summary-card__value--warning { color: var(--el-color-warning); }
  .detail-descriptions, .section-block { margin-top: 0; }
  .section-block { border: 1px solid var(--el-border-color-light); border-radius: 14px; padding: 16px; background: var(--el-fill-color-blank); }
  .section-block__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .section-block__title { color: var(--el-text-color-primary); font-size: 16px; font-weight: 600; }
  .section-block__count { color: var(--el-text-color-secondary); font-size: 13px; }
  .voucher-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .voucher-list__item { width: 44px; height: 44px; border-radius: 8px; overflow: hidden; border: 1px solid var(--el-border-color-light); }
</style>
