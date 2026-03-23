<template>
  <div v-loading="loading" class="payment-flow-detail">
    <div class="detail-hero">
      <div class="hero-main">
        <div class="hero-title">支付流水详情</div>
        <div class="hero-no">{{ detail.paymentNo || "-" }}</div>
      </div>
      <div class="hero-tags">
        <el-tag :type="statusTagType(detail.status)" effect="light" round>{{ statusText(detail.status) }}</el-tag>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-card">
        <div class="detail-card__title">租客信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="租客姓名">{{ detail.tenantName || "-" }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detail.tenantPhone || "-" }}</el-descriptions-item>
          <el-descriptions-item label="付款人">{{ detail.payerName || "-" }}</el-descriptions-item>
          <el-descriptions-item label="付款人电话">{{ detail.payerPhone || "-" }}</el-descriptions-item>
          <el-descriptions-item label="房源信息" :span="2">{{ detail.roomAddress || "-" }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="detail-card">
        <div class="detail-card__title">支付信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="支付金额">{{ moneyText(detail.amount) }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ channelText(detail.channel) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ formatDateTime(detail.payTime) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(detail.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="交易流水号" :span="2">{{ detail.thirdTradeNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="支付备注" :span="2">{{ detail.remark || "-" }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ detail.operatorName || "-" }}</el-descriptions-item>
          <el-descriptions-item label="审批状态">{{ approvalStatusText(detail.approvalStatus) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <div class="detail-card">
      <div class="detail-card__title">账单关联</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="所属账单">{{ detail.sortOrder ? `第${detail.sortOrder}期` : "-" }}</el-descriptions-item>
        <el-descriptions-item label="账单ID">{{ detail.billId || "-" }}</el-descriptions-item>
        <el-descriptions-item label="账单周期">{{ `${formatDate(detail.billStart)} ~ ${formatDate(detail.billEnd)}` }}</el-descriptions-item>
        <el-descriptions-item label="应收日期">{{ formatDate(detail.dueDate) }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div v-if="detail.paymentVoucherUrl" class="detail-card">
      <div class="detail-card__title">支付凭证</div>
      <el-image :src="detail.paymentVoucherUrl" fit="contain" class="voucher-image" preview-teleported />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import dayjs from "dayjs";
  import type { PaymentFlowFinanceItemVo } from "@/types";
  import { getFinancePaymentFlowDetail } from "@/api/finance/paymentFlow";
  import { PaymentFlowChannelEnumMeta } from "@/types/generated/enum.meta";

  const props = defineProps<{ flowId: string }>();
  const loading = ref(false);
  const detail = reactive<PaymentFlowFinanceItemVo>({});

  async function fetchDetail() {
    if (!props.flowId) return;
    loading.value = true;
    try {
      const { data } = await getFinancePaymentFlowDetail(props.flowId);
      Object.assign(detail, data || {});
    } finally {
      loading.value = false;
    }
  }

  function moneyText(value?: number) {
    return `¥${Number(value || 0).toFixed(2)}`;
  }

  function formatDate(value?: string) {
    return value ? dayjs(value).format("YYYY-MM-DD") : "-";
  }

  function formatDateTime(value?: string) {
    return value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-";
  }

  function statusText(status?: number) {
    if (status === 1) return "待审批";
    if (status === 2) return "支付成功";
    if (status === 4) return "已关闭";
    return "-";
  }

  function statusTagType(status?: number) {
    if (status === 2) return "success";
    if (status === 4) return "info";
    return "warning";
  }

  function approvalStatusText(status?: number) {
    if (status === 1) return "审批中";
    if (status === 2) return "已通过";
    if (status === 3) return "已驳回";
    if (status === 4) return "已撤回";
    return "-";
  }

  function channelText(channel?: string) {
    if (!channel) return "-";
    return (PaymentFlowChannelEnumMeta as Record<string, { label: string }>)[channel]?.label || channel;
  }

  onMounted(fetchDetail);
</script>

<style scoped>
  .payment-flow-detail {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .detail-hero,
  .detail-card {
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    background: #fff;
  }

  .detail-hero {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 20px;
    background: linear-gradient(135deg, #f8fbff 0%, #f2f7ff 100%);
  }

  .hero-title {
    font-size: 13px;
    color: #64748b;
  }

  .hero-no {
    margin-top: 6px;
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .detail-card {
    padding: 16px;
  }

  .detail-card__title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }

  .voucher-image {
    width: 240px;
    height: 240px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
  }

  @media (max-width: 960px) {
    .detail-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
