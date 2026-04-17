<template>
  <div class="bill-detail-dialog">
    <el-skeleton v-if="loading" :rows="12" animated />
    <template v-else>
      <!-- 顶部地址栏 -->
      <div class="address-banner">
        <div class="address-banner__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div class="address-banner__content">
          <span class="address-banner__label">房源地址</span>
          <span class="address-banner__value">{{ roomAddressText }}</span>
        </div>
        <div class="address-banner__tags">
          <div class="address-banner__badge" :class="billStatusBadgeClass">
            {{ billStatusText }}
          </div>
          <div class="address-banner__badge" :class="statusBadgeClass">
            {{ payStatusText }}
          </div>
          <div v-if="isOverdue" class="address-banner__badge address-banner__badge--overdue">已逾期</div>
        </div>
      </div>

      <!-- 核心指标卡片 -->
      <div class="metrics-row">
        <div class="metric-card metric-card--amount">
          <div class="metric-card__icon-wrap">
            <el-icon><Wallet /></el-icon>
          </div>
          <div class="metric-card__label">应收总额</div>
          <div class="metric-card__value metric-card__value--amount">
            <span class="metric-card__currency">¥</span>
            {{ bill.totalAmount ?? 0 }}
          </div>
        </div>

        <div class="metric-card metric-card--payer">
          <div class="metric-card__icon-wrap">
            <el-icon><User /></el-icon>
          </div>
          <div class="metric-card__label">付款人</div>
          <div class="metric-card__value metric-card__value--sm">{{ payerInfo }}</div>
        </div>

        <div class="metric-card metric-card--period">
          <div class="metric-card__icon-wrap">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="metric-card__label">预计收款日</div>
          <div class="metric-card__value metric-card__value--sm">{{ formatDate(bill.dueDate) }}</div>
        </div>

        <div class="metric-card metric-card--summary">
          <div class="metric-card__icon-wrap">
            <el-icon><Tickets /></el-icon>
          </div>
          <div class="metric-card__label">账单摘要</div>
          <div class="metric-card__value metric-card__value--sm">{{ billSummary }}</div>
        </div>
      </div>

      <!-- 账单信息 -->
      <div class="panel">
        <div class="panel__header">
          <div class="panel__title">
            <span class="panel__title-dot" />
            账单信息
          </div>
          <div class="panel__actions">
            <button v-if="!isVoided && (bill.payStatus === 0 || bill.payStatus === 1)" class="action-btn action-btn--primary" @click="handleCollect">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path
                  d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 4.5v.94a2.5 2.5 0 010 4.62v.94h-1.5v-.94A2.5 2.5 0 015 9h1.5a1 1 0 001 1h1a1 1 0 000-2h-1a2.5 2.5 0 010-5h.25V2h1.5v.5H9a2.5 2.5 0 012.5 2.5H10a1 1 0 00-1-1h-1a1 1 0 000 2h1a2.5 2.5 0 012.25 3.59A2.5 2.5 0 019 11h-.25V11h-.5v.5H6.75V11H6a2.5 2.5 0 01-2.5-2.5H5a1 1 0 001 1z"
                />
              </svg>
              收款
            </button>
            <button class="action-btn" :disabled="!canEdit" :class="{ 'action-btn--disabled': !canEdit }" @click="handleEdit">编辑账单</button>
            <button v-if="!isVoided && bill.payStatus === 0" class="action-btn" @click="handleSplit">账单拆分</button>
            <button v-if="!isVoided && bill.payStatus === 0" class="action-btn" @click="handleFree">免收</button>
            <button v-if="!isVoided && bill.payStatus === 0" class="action-btn" @click="handleBadDebt">标记坏账</button>
            <button v-if="!isVoided" class="action-btn action-btn--danger" @click="handleVoid">作废账单</button>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-cell">
            <div class="info-cell__key">账单编号</div>
            <div class="info-cell__val info-cell__val--mono">{{ bill.id || "—" }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">生成方式</div>
            <div class="info-cell__val">
              <span class="tag tag--blue">系统生成</span>
            </div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">账单所属</div>
            <div class="info-cell__val">
              <span class="tag tag--gray">租客</span>
            </div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">账单类型</div>
            <div class="info-cell__val">{{ billTypeText }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">账单期数</div>
            <div class="info-cell__val">
              第
              <strong>{{ bill.sortOrder || "—" }}</strong>
              期
            </div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">账期范围</div>
            <div class="info-cell__val">{{ formatDate(bill.billStart) }} — {{ formatDate(bill.billEnd) }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">付款人姓名</div>
            <div class="info-cell__val">{{ bill.payerName || leaseDetail?.tenantName || "—" }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">付款人电话</div>
            <div class="info-cell__val info-cell__val--mono">{{ bill.payerPhone || leaseDetail?.tenantPhone || "—" }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">证件类型</div>
            <div class="info-cell__val">{{ getPayerIdTypeName }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">证件号码</div>
            <div class="info-cell__val info-cell__val--mono">{{ getPayerIdNo }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">账单状态</div>
            <div class="info-cell__val">
              <span class="status-badge" :class="billStatusBadgeClass">{{ billStatusText }}</span>
            </div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">支付状态</div>
            <div class="info-cell__val">
              <span class="status-badge" :class="statusBadgeClass">{{ payStatusText }}</span>
            </div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">逾期状态</div>
            <div class="info-cell__val">
              <span v-if="isOverdue" class="status-badge badge--overdue">已逾期</span>
              <span v-else class="tag tag--gray">未逾期</span>
            </div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">最近支付方式</div>
            <div class="info-cell__val">{{ latestPaymentChannelText }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">最近支付时间</div>
            <div class="info-cell__val">{{ formatDateTime(latestPaymentFlow?.payAt) }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">累计实收金额</div>
            <div class="info-cell__val info-cell__val--amount">
              {{ bill.paidAmount != null ? `¥${moneyText(bill.paidAmount)}` : "—" }}
            </div>
          </div>
          <div class="info-cell">
            <div class="info-cell__key">当前待收金额</div>
            <div class="info-cell__val info-cell__val--amount">
              {{ bill.unpaidAmount != null ? `¥${moneyText(bill.unpaidAmount)}` : "—" }}
            </div>
          </div>
          <div class="info-cell info-cell--full">
            <div class="info-cell__key">备注</div>
            <div class="info-cell__val">{{ bill.remark || "—" }}</div>
          </div>
        </div>
      </div>

      <div v-if="isVoided" class="panel">
        <div class="panel__header">
          <div class="panel__title">
            <span class="panel__title-dot panel__title-dot--danger" />
            作废信息
          </div>
        </div>

        <div class="void-info-grid">
          <div class="void-info-cell">
            <div class="info-cell__key">作废操作人</div>
            <div class="info-cell__val">{{ bill.voidByName || "—" }}</div>
          </div>
          <div class="void-info-cell">
            <div class="info-cell__key">作废时间</div>
            <div class="info-cell__val">{{ formatDateTime(bill.voidAt) }}</div>
          </div>
          <div class="void-info-cell void-info-cell--full">
            <div class="info-cell__key">作废原因</div>
            <div class="info-cell__val">{{ bill.voidReason || "—" }}</div>
          </div>
        </div>
      </div>

      <!-- 账单明细 -->
      <div class="panel">
        <div class="panel__header">
          <div class="panel__title">
            <span class="panel__title-dot panel__title-dot--orange" />
            账单明细
          </div>
          <div v-if="bill.feeList?.length" class="panel__count">共 {{ bill.feeList.length }} 项</div>
        </div>

        <template v-if="bill.feeList?.length">
          <div class="fee-table">
            <div class="fee-table__head">
              <div class="fee-col fee-col--idx">#</div>
              <div class="fee-col fee-col--type">收支类型</div>
              <div class="fee-col fee-col--name">费用科目</div>
              <div class="fee-col fee-col--num">应收（付）</div>
              <div class="fee-col fee-col--num">已收（付）</div>
              <div class="fee-col fee-col--num">待收（付）</div>
              <div class="fee-col fee-col--period">费用周期</div>
              <div class="fee-col fee-col--remark">备注</div>
            </div>
            <div class="fee-table__body">
              <div v-for="(row, index) in bill.feeList" :key="index" class="fee-row">
                <div class="fee-col fee-col--idx">{{ index + 1 }}</div>
                <div class="fee-col fee-col--type">
                  <span class="tag" :class="getFeePayStatusClass(row.payStatus)">{{ getFeePayStatusText(row.payStatus) }}</span>
                </div>
                <div class="fee-col fee-col--name">{{ row.feeName }}</div>
                <div class="fee-col fee-col--num fee-col--positive">+ {{ row.amount }}元</div>
                <div class="fee-col fee-col--num">{{ moneyText(row.paidAmount) }}元</div>
                <div class="fee-col fee-col--num fee-col--positive">+ {{ moneyText(row.unpaidAmount) }}元</div>
                <div class="fee-col fee-col--period">{{ formatDate(row.feeStartDate) }} ~ {{ formatDate(row.feeEndDate) }}</div>
                <div class="fee-col fee-col--remark">
                  <el-tooltip v-if="row.remark" :content="row.remark" placement="top" :show-after="200" popper-class="remark-tooltip">
                    <span class="remark-text">{{ row.remark }}</span>
                  </el-tooltip>
                  <span v-else>—</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="empty-state">
          <div class="empty-state__icon">📋</div>
          <div class="empty-state__text">暂无费用明细</div>
        </div>
      </div>

      <!-- 财务流水 -->
      <div class="panel">
        <div class="panel__header">
          <div class="panel__title">
            <span class="panel__title-dot panel__title-dot--green" />
            账单财务流水
          </div>
          <div v-if="financeFlowList.length" class="panel__count">共 {{ financeFlowList.length }} 条</div>
        </div>

        <template v-if="financeFlowList.length">
          <div class="fee-table">
            <div class="fee-table__head">
              <div class="flow-col flow-col--no">流水号</div>
              <div class="flow-col flow-col--type">流水类型</div>
              <div class="flow-col flow-col--dir">资金方向</div>
              <div class="flow-col flow-col--status">状态</div>
              <div class="flow-col flow-col--amount">金额</div>
              <div class="flow-col flow-col--name">费用名称</div>
              <div class="flow-col flow-col--operator">操作人</div>
              <div class="flow-col flow-col--time">流水时间</div>
              <div class="flow-col flow-col--remark">备注</div>
            </div>
            <div class="fee-table__body">
              <div v-for="(row, index) in financeFlowList" :key="index" class="fee-row">
                <div class="flow-col flow-col--no flow-col--mono">{{ row.flowNo || "—" }}</div>
                <div class="flow-col flow-col--type">
                  <span class="flow-type-tag">{{ financeFlowTypeText(row.flowType) }}</span>
                </div>
                <div class="flow-col flow-col--dir">
                  <span class="direction-tag" :class="row.flowDirection === 'IN' ? 'direction-tag--in' : 'direction-tag--out'">
                    {{ financeFlowDirectionText(row.flowDirection) }}
                  </span>
                </div>
                <div class="flow-col flow-col--status">
                  <span class="flow-status" :class="`flow-status--${row.status}`">{{ flowStatusText(row.status) }}</span>
                </div>
                <div class="flow-col flow-col--amount fee-col--positive">¥{{ formatAmount(row.amount) }}</div>
                <div class="flow-col flow-col--name">{{ getFinanceFlowFeeName(row.bizId) || "—" }}</div>
                <div class="flow-col flow-col--operator">{{ row.operatorName || "—" }}</div>
                <div class="flow-col flow-col--time">{{ formatDateTime(row.flowAt) }}</div>
                <div class="flow-col flow-col--remark">
                  <el-tooltip v-if="row.remark" :content="row.remark" placement="top" :show-after="200" popper-class="remark-tooltip">
                    <span class="remark-text">{{ row.remark }}</span>
                  </el-tooltip>
                  <span v-else>—</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="empty-state">
          <div class="empty-state__icon">💳</div>
          <div class="empty-state__text">暂无财务流水</div>
        </div>
      </div>

      <!-- 支付流水 -->
      <div class="panel">
        <div class="panel__header">
          <div class="panel__title">
            <span class="panel__title-dot panel__title-dot--purple" />
            支付流水
          </div>
        </div>

        <template v-if="paymentFlowList.length">
          <div class="fee-table">
            <div class="fee-table__head">
              <div class="pay-col pay-col--no">支付流水号</div>
              <div class="pay-col pay-col--channel">支付渠道</div>
              <div class="pay-col pay-col--status">支付状态</div>
              <div class="pay-col pay-col--third">第三方单号</div>
              <div class="pay-col pay-col--voucher">支付凭证</div>
              <div class="pay-col pay-col--amount">支付金额</div>
              <div class="pay-col pay-col--remark">支付备注</div>
              <div class="pay-col pay-col--time">支付时间</div>
            </div>
            <div class="fee-table__body">
              <div v-for="(row, index) in paymentFlowList" :key="index" class="fee-row">
                <div class="pay-col pay-col--no flow-col--mono">{{ row.paymentNo || "—" }}</div>
                <div class="pay-col pay-col--channel">{{ paymentChannelText(row.channel) }}</div>
                <div class="pay-col pay-col--status">
                  <span class="pay-status-tag" :class="getPaymentStatusClass(row.status)">{{ paymentStatusText(row.status) }}</span>
                </div>
                <div class="pay-col pay-col--third flow-col--mono">{{ row.thirdTradeNo || "—" }}</div>
                <div class="pay-col pay-col--voucher">
                  <el-image
                    v-if="row.paymentVoucherUrl"
                    :src="row.paymentVoucherUrl"
                    :preview-src-list="[row.paymentVoucherUrl]"
                    fit="cover"
                    class="payment-voucher-thumb"
                    preview-teleported
                  />
                  <span v-else>—</span>
                </div>
                <div class="pay-col pay-col--amount fee-col--positive">¥{{ formatAmount(row.amount) }}</div>
                <div class="pay-col pay-col--remark">
                  <el-tooltip v-if="row.remark" :content="row.remark" placement="top" :show-after="200" popper-class="remark-tooltip">
                    <span class="remark-text">{{ row.remark }}</span>
                  </el-tooltip>
                  <span v-else>—</span>
                </div>
                <div class="pay-col pay-col--time">{{ formatDateTime(row.payAt) }}</div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="empty-state">
          <div class="empty-state__icon">🧾</div>
          <div class="empty-state__text">暂无支付流水</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { Calendar, Money, Tickets, User, Wallet } from "@element-plus/icons-vue";
  import { ElMessageBox } from "element-plus";
  import { computed, onMounted, ref } from "vue";
  import { h } from "vue";
  import type { FinanceFlowVo, LeaseBillListVo, LeaseDetailVo, PaymentFlowVo } from "@/types";
  import { collectLeaseBill, getLeaseBillDetail, getLeaseDetail, updateLeaseBill, voidLeaseBill } from "@/api/contract/tenant";
  import { addDialog } from "@/components/ReDialog/index";
  import { message } from "@/utils/message";
  import LeaseBillEditDialog from "@/views/finance/lease-bill/form/LeaseBillEditDialog.vue";
  import LeaseBillCollectDialog from "@/views/finance/lease-bill/form/LeaseBillCollectDialog.vue";

  interface Props {
    billId: string;
  }

  const props = defineProps<Props>();

  const bill = ref<LeaseBillListVo>({} as LeaseBillListVo);
  const leaseDetail = ref<LeaseDetailVo | null>(null);
  const loading = ref(false);

  onMounted(async () => {
    if (!props.billId) return;
    loading.value = true;
    try {
      const res = await getLeaseBillDetail({ billId: props.billId });
      if (res.code === 0 && res.data) {
        bill.value = res.data;
        if (res.data.leaseId) {
          const leaseRes = await getLeaseDetail({ leaseId: res.data.leaseId });
          if (leaseRes.code === 0 && leaseRes.data) {
            leaseDetail.value = leaseRes.data;
          }
        }
      }
    } finally {
      loading.value = false;
    }
  });

  const financeFlowList = computed(() => bill.value.financeFlowList || []);
  const paymentFlowList = computed(() =>
    (bill.value.paymentFlowList || []).slice().sort((a, b) => {
      const aTime = a.payAt ? new Date(a.payAt).getTime() : 0;
      const bTime = b.payAt ? new Date(b.payAt).getTime() : 0;
      return bTime - aTime;
    })
  );
  const latestPaymentFlow = computed<PaymentFlowVo | undefined>(() => paymentFlowList.value[0]);
  const isVoided = computed(() => bill.value.status === 2);
  const canEdit = computed(() => !isVoided.value && bill.value.payStatus !== 2);

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
    if (status === 1) return "部分收款";
    if (status === 2) return "已支付";
    return "未知";
  });

  const billStatusText = computed(() => (bill.value.status === 2 ? "已作废" : "正常"));

  const latestPaymentChannelText = computed(() => paymentChannelText(latestPaymentFlow.value?.channel));

  const payerInfo = computed(() => {
    const payerName = bill.value.payerName || leaseDetail.value?.tenantName;
    const payerPhone = bill.value.payerPhone || leaseDetail.value?.tenantPhone;
    if (payerName && payerPhone) {
      return `${payerName} ${payerPhone}`;
    }
    return payerName || payerPhone || "—";
  });

  const billSummary = computed(() => {
    const feeNames = (bill.value.feeList || []).map(item => item.feeName).filter(Boolean);
    return feeNames.length ? Array.from(new Set(feeNames)).join("/") : billTypeText.value;
  });

  const isOverdue = computed(() => {
    if (isVoided.value || bill.value.payStatus === 2 || !bill.value.dueDate) return false;
    return new Date(bill.value.dueDate).getTime() < Date.now();
  });

  const statusBadgeClass = computed(() => {
    if (bill.value.payStatus === 0) return "badge--unpaid";
    if (bill.value.payStatus === 1) return "badge--partial";
    if (bill.value.payStatus === 2) return "badge--paid";
    return "";
  });

  const billStatusBadgeClass = computed(() => (isVoided.value ? "badge--voided" : "badge--normal"));

  const formatDate = (val?: string) => (val ? val.substring(0, 10) : "—");
  const formatDateTime = (val?: string) => (val ? val.substring(0, 19).replace("T", " ") : "—");

  const formatAmount = (val?: string | number) => {
    if (val === undefined || val === null) return "—";
    const amount = typeof val === "string" ? Number(val) : val;
    if (Number.isNaN(amount)) return "—";
    return amount;
  };

  const moneyText = (val?: string | number) => {
    if (val === undefined || val === null) return "0.00";
    const amount = typeof val === "string" ? Number(val) : val;
    if (Number.isNaN(amount)) return "0.00";
    return amount.toFixed(2);
  };

  const flowStatusText = (status?: number) => {
    if (status === 0) return "处理中";
    if (status === 1) return "成功";
    if (status === 2) return "失败";
    if (status === 3) return "已作废";
    return "—";
  };

  const paymentStatusText = (status?: number) => {
    if (status === 0) return "支付中";
    if (status === 1) return "支付成功";
    if (status === 2) return "支付失败";
    if (status === 3) return "已关闭";
    if (status === 4) return "退款中";
    if (status === 5) return "已退款";
    return "—";
  };

  const getPaymentStatusClass = (status?: number) => {
    if (status === 0) return "pay-status--processing";
    if (status === 1) return "pay-status--success";
    if (status === 2) return "pay-status--fail";
    if (status === 3) return "pay-status--closed";
    if (status === 4 || status === 5) return "pay-status--refund";
    return "";
  };

  const paymentChannelText = (channel?: string) => {
    if (!channel) return "—";
    const normalized = channel.toUpperCase();
    if (normalized === "CASH") return "现金";
    if (normalized === "TRANSFER") return "转账";
    if (normalized === "ALIPAY") return "支付宝";
    if (normalized === "WECHAT") return "微信";
    if (normalized === "POS") return "POS";
    if (normalized === "OTHER") return "其他";
    return channel;
  };

  const financeFlowTypeText = (flowType?: string) => {
    if (!flowType) return "—";
    if (flowType === "RECEIVE") return "收款";
    if (flowType === "PAY") return "付款";
    if (flowType === "REFUND") return "退款";
    if (flowType === "VOID") return "作废";
    if (flowType === "ADJUST") return "调整";
    return flowType;
  };

  const financeFlowDirectionText = (direction?: string) => {
    if (!direction) return "—";
    if (direction === "IN") return "收入";
    if (direction === "OUT") return "支出";
    return direction;
  };

  const getFeePayStatusText = (status?: number) => {
    if (status === 0) return "未支付";
    if (status === 1) return "部分支付";
    if (status === 2) return "已支付";
    return "—";
  };

  const getFeePayStatusClass = (status?: number) => {
    if (status === 2) return "tag--green";
    if (status === 1) return "tag--orange";
    return "tag--orange";
  };

  const feeNameMap = computed(() => {
    return new Map((bill.value.feeList || []).filter(item => item.id).map(item => [item.id as string, item.feeName || "—"]));
  });

  const getFinanceFlowFeeName = (bizId?: FinanceFlowVo["bizId"]) => {
    if (!bizId) return "—";
    return feeNameMap.value.get(String(bizId)) || "—";
  };

  const idTypeNameMap: Record<number, string> = {
    0: "身份证",
    1: "护照",
    2: "港澳通行证",
    3: "台胞证"
  };

  const getPayerIdTypeName = computed(() => {
    if (bill.value.payerIdTypeName) return bill.value.payerIdTypeName;
    if (leaseDetail.value?.tenantType === 0) {
      const idType = leaseDetail.value.tenantPersonal?.idType;
      return idType == null ? "—" : idTypeNameMap[idType] || "—";
    }
    if (leaseDetail.value?.tenantType === 1) {
      const idType = leaseDetail.value.tenantCompany?.legalPersonIdType;
      return idType == null ? "—" : idTypeNameMap[idType] || "—";
    }
    return "—";
  });

  const getPayerIdNo = computed(() => {
    if (bill.value.payerIdNo) return bill.value.payerIdNo;
    if (leaseDetail.value?.tenantType === 0) return leaseDetail.value.tenantPersonal?.idNo || "—";
    if (leaseDetail.value?.tenantType === 1) return leaseDetail.value.tenantCompany?.legalPersonIdNo || "—";
    return "—";
  });

  const roomAddressText = computed(() => {
    if (bill.value.roomAddress) return bill.value.roomAddress;
    const roomList = leaseDetail.value?.roomList || [];
    if (!roomList.length) return "—";
    return (
      roomList
        .map(room => room.houseName || room.doorNumber || room.roomNumber)
        .filter(Boolean)
        .join("、") || "—"
    );
  });

  const refreshBillDetail = async () => {
    if (!props.billId) return;
    const res = await getLeaseBillDetail({ billId: props.billId });
    if (res.code === 0 && res.data) {
      bill.value = res.data;
    }
  };

  const handleCollect = () => {
    const collectRef = ref<InstanceType<typeof LeaseBillCollectDialog>>();
    addDialog({
      title: "账单收款",
      width: "50%",
      top: "10%",
      alignCenter: true,
      lockScroll: true,
      closeOnClickModal: false,
      contentRenderer: () => h(LeaseBillCollectDialog, { ref: collectRef, bill: bill.value }),
      beforeSure: async done => {
        const formInstance = collectRef.value;
        if (!formInstance) return;
        const valid = await formInstance.validate();
        if (!valid) return;
        const resp = await collectLeaseBill(formInstance.getFormData());
        if (resp.code === 0 && resp.data !== false) {
          message("收款成功", { type: "success" });
          await refreshBillDetail();
          done();
        } else {
          message(resp.message || "收款失败", { type: "warning" });
        }
      }
    });
  };

  const handleSplit = () => {
    message(`账单拆分：第${bill.value.sortOrder}期`, { type: "info" });
  };

  const handleFree = () => {
    message(`免收：第${bill.value.sortOrder}期`, { type: "info" });
  };

  const handleBadDebt = () => {
    message(`标记坏账：第${bill.value.sortOrder}期`, { type: "info" });
  };

  const handleVoid = async () => {
    if (isVoided.value) {
      message("账单已作废", { type: "warning" });
      return;
    }
    if (bill.value.payStatus !== 0) {
      message("仅未支付账单允许作废", { type: "warning" });
      return;
    }
    try {
      const { value } = await ElMessageBox.prompt(`确认作废后，此账单将无效，请谨慎操作。`, `确定要作废 ${bill.value.sortOrder}期账单吗？`, {
        confirmButtonText: "确认作废",
        cancelButtonText: "取消",
        inputType: "textarea",
        inputPlaceholder: "请输入作废原因",
        inputPattern: /\S+/,
        inputErrorMessage: "请输入作废原因"
      });
      const resp = await voidLeaseBill({
        billId: String(bill.value.id || ""),
        voidReason: value
      });
      if (resp.code === 0 && resp.data !== false) {
        message("账单作废成功", { type: "success" });
        await refreshBillDetail();
      } else {
        message(resp.message || "账单作废失败", { type: "warning" });
      }
    } catch {}
  };

  const handleEdit = () => {
    if (!canEdit.value) {
      message(isVoided.value ? "账单已作废，不允许编辑" : "账单已支付，不允许编辑", { type: "warning" });
      return;
    }
    const editRef = ref<InstanceType<typeof LeaseBillEditDialog>>();
    addDialog({
      title: "编辑账单",
      width: "70%",
      top: "6%",
      alignCenter: true,
      lockScroll: true,
      closeOnClickModal: false,
      contentRenderer: () => h(LeaseBillEditDialog, { ref: editRef, bill: bill.value }),
      beforeSure: async done => {
        const formInstance = editRef.value;
        if (!formInstance) return;
        const valid = await formInstance.validate();
        if (!valid) return;
        const payload = formInstance.getFormData();
        const resp = await updateLeaseBill(payload);
        if (resp.code === 0 && resp.data !== false) {
          message("账单更新成功", { type: "success" });
          await refreshBillDetail();
          done();
        } else {
          message(resp.message || "账单更新失败", { type: "warning" });
        }
      }
    });
  };
</script>

<style scoped>
  /* ===== 全局布局 ===== */
  .bill-detail-dialog {
    --bill-bg: var(--el-bg-color);
    --bill-bg-overlay: var(--el-bg-color-overlay);
    --bill-bg-soft: var(--el-fill-color-light);
    --bill-bg-softer: var(--el-fill-color-lighter);
    --bill-bg-softest: var(--el-fill-color-extra-light);
    --bill-border: var(--el-border-color);
    --bill-border-light: var(--el-border-color-light);
    --bill-border-lighter: var(--el-border-color-lighter);
    --bill-border-extra: var(--el-border-color-extra-light);
    --bill-text-primary: var(--el-text-color-primary);
    --bill-text-regular: var(--el-text-color-regular);
    --bill-text-secondary: var(--el-text-color-secondary);
    --bill-text-placeholder: var(--el-text-color-placeholder);
    --bill-primary: var(--el-color-primary);
    --bill-primary-dark: var(--el-color-primary-dark-2);
    --bill-primary-soft: var(--el-color-primary-light-9);
    --bill-primary-soft-border: var(--el-color-primary-light-7);
    --bill-success: var(--el-color-success);
    --bill-success-soft: var(--el-color-success-light-9);
    --bill-success-soft-border: var(--el-color-success-light-7);
    --bill-warning: var(--el-color-warning);
    --bill-warning-soft: var(--el-color-warning-light-9);
    --bill-warning-soft-border: var(--el-color-warning-light-7);
    --bill-danger: var(--el-color-danger);
    --bill-danger-soft: var(--el-color-danger-light-9);
    --bill-danger-soft-border: var(--el-color-danger-light-7);
    --bill-info-soft: var(--el-color-info-light-9);
    --bill-info-soft-border: var(--el-color-info-light-7);
    --bill-purple: #7c3aed;
    --bill-purple-soft: color-mix(in srgb, var(--bill-purple) 14%, transparent);
    display: flex;
    flex-direction: column;
    gap: 14px;
    color: var(--bill-text-primary);
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  }

  /* ===== 地址横幅 ===== */
  .address-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    background: linear-gradient(135deg, var(--bill-primary-soft) 0%, var(--bill-bg-softer) 100%);
    border: 1px solid var(--bill-primary-soft-border);
    border-radius: 10px;
  }

  .address-banner__icon {
    width: 36px;
    height: 36px;
    background: var(--bill-primary);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  .address-banner__icon svg {
    width: 18px;
    height: 18px;
  }

  .address-banner__content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .address-banner__label {
    color: var(--bill-text-secondary);
    font-size: 13px;
    white-space: nowrap;
  }

  .address-banner__value {
    color: var(--bill-text-primary);
    font-size: 14px;
    font-weight: 600;
  }

  .address-banner__badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .address-banner__tags {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  /* ===== 指标卡片行 ===== */
  .metrics-row {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 1fr;
    gap: 12px;
  }

  .metric-card {
    position: relative;
    overflow: hidden;
    padding: 18px 20px;
    border-radius: 12px;
    border: 1px solid var(--bill-border-lighter);
    background: var(--bill-bg-overlay);
  }

  .metric-card--amount {
    border-color: var(--bill-primary-soft-border);
    background: var(--bill-primary-soft);
  }

  .metric-card--amount .metric-card__icon-wrap {
    background: var(--bill-primary-soft);
    color: var(--bill-primary);
  }

  .metric-card__value--amount {
    font-size: 22px;
    font-weight: 700;
    color: var(--bill-primary-dark);
  }

  .metric-card__currency {
    font-size: 14px;
    font-weight: 500;
    margin-right: 2px;
    color: var(--bill-primary-dark);
    opacity: 0.8;
  }

  .metric-card__icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-bottom: 10px;
  }

  .metric-card--payer .metric-card__icon-wrap {
    background: var(--bill-primary-soft);
    color: var(--bill-primary);
  }

  .metric-card--period .metric-card__icon-wrap {
    background: var(--bill-success-soft);
    color: var(--bill-success);
  }

  .metric-card--summary .metric-card__icon-wrap {
    background: var(--bill-warning-soft);
    color: var(--bill-warning);
  }

  .metric-card__label {
    font-size: 12px;
    color: var(--bill-text-placeholder);
    margin-bottom: 4px;
  }

  .metric-card__value {
    font-size: 15px;
    font-weight: 600;
    color: var(--bill-text-primary);
    line-height: 1.4;
  }

  .metric-card__value--sm {
    font-size: 13px;
    word-break: break-all;
  }

  .payment-voucher-thumb {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    border: 1px solid var(--bill-border-light);
    overflow: hidden;
  }

  /* ===== 状态标签 ===== */
  .badge--unpaid,
  .status-badge.badge--unpaid {
    background: var(--bill-danger-soft);
    color: var(--bill-danger);
    border: 1px solid var(--bill-danger-soft-border);
  }
  .badge--partial,
  .status-badge.badge--partial {
    background: var(--bill-warning-soft);
    color: var(--bill-warning);
    border: 1px solid var(--bill-warning-soft-border);
  }
  .badge--paid,
  .status-badge.badge--paid {
    background: var(--bill-success-soft);
    color: var(--bill-success);
    border: 1px solid var(--bill-success-soft-border);
  }
  .badge--normal,
  .status-badge.badge--normal {
    background: var(--bill-primary-soft);
    color: var(--bill-primary);
    border: 1px solid var(--bill-primary-soft-border);
  }
  .badge--voided,
  .status-badge.badge--voided {
    background: var(--bill-info-soft);
    color: var(--bill-text-secondary);
    border: 1px solid var(--bill-info-soft-border);
  }
  .badge--overdue,
  .status-badge.badge--overdue,
  .address-banner__badge--overdue {
    background: var(--bill-danger-soft);
    color: var(--bill-danger);
    border: 1px solid var(--bill-danger-soft-border);
  }

  .address-banner__badge.badge--unpaid {
    background: var(--bill-danger-soft);
    color: var(--bill-danger);
  }
  .address-banner__badge.badge--partial {
    background: var(--bill-warning-soft);
    color: var(--bill-warning);
  }
  .address-banner__badge.badge--paid {
    background: var(--bill-success-soft);
    color: var(--bill-success);
  }
  .address-banner__badge.badge--normal {
    background: var(--bill-primary-soft);
    color: var(--bill-primary);
  }
  .address-banner__badge.badge--voided {
    background: var(--bill-info-soft);
    color: var(--bill-text-secondary);
  }
  .address-banner__badge--overdue {
    background: var(--bill-danger-soft);
    color: var(--bill-danger);
  }

  .status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }

  /* ===== 通用 Panel ===== */
  .panel {
    border: 1px solid var(--bill-border-lighter);
    border-radius: 12px;
    background: var(--bill-bg-overlay);
    overflow: hidden;
  }

  .panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--bill-border-extra);
    background: var(--bill-bg-softest);
  }

  .panel__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--bill-text-primary);
  }

  .panel__title-dot {
    width: 4px;
    height: 16px;
    border-radius: 2px;
    background: var(--bill-primary);
    flex-shrink: 0;
  }

  .panel__title-dot--orange {
    background: var(--bill-warning);
  }
  .panel__title-dot--green {
    background: var(--bill-success);
  }
  .panel__title-dot--danger {
    background: var(--bill-danger);
  }
  .panel__title-dot--purple {
    background: var(--bill-purple);
  }

  .panel__count {
    font-size: 12px;
    color: var(--bill-text-placeholder);
    background: var(--bill-bg-soft);
    padding: 2px 10px;
    border-radius: 20px;
  }

  .panel__actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  /* ===== 操作按钮 ===== */
  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--bill-border-light);
    background: var(--bill-bg-overlay);
    color: var(--bill-primary);
    transition: all 0.15s ease;
    line-height: 1;
  }

  .action-btn:hover {
    background: var(--bill-primary-soft);
    border-color: var(--bill-primary-soft-border);
    color: var(--bill-primary);
  }

  .action-btn--disabled,
  .action-btn:disabled {
    cursor: not-allowed;
    color: var(--bill-text-placeholder);
    border-color: var(--bill-border-light);
    background: var(--bill-bg-softest);
  }

  .action-btn--disabled:hover,
  .action-btn:disabled:hover {
    color: var(--bill-text-placeholder);
    border-color: var(--bill-border-light);
    background: var(--bill-bg-softest);
  }

  .action-btn--primary {
    background: var(--bill-primary);
    color: #fff;
    border-color: var(--bill-primary);
  }

  .action-btn--primary:hover {
    background: var(--bill-primary-dark);
    border-color: var(--bill-primary-dark);
    color: #fff;
  }

  .action-btn--primary svg {
    width: 13px;
    height: 13px;
  }

  .action-btn--danger {
    color: var(--bill-danger);
    border-color: var(--bill-danger-soft-border);
    background: var(--bill-danger-soft);
  }

  .action-btn--danger:hover {
    background: var(--bill-danger-soft);
    border-color: var(--bill-danger-soft-border);
  }

  /* ===== 信息网格 ===== */
  .info-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    padding: 4px 0;
  }

  .info-cell {
    padding: 14px 20px;
    border-bottom: 1px solid var(--bill-border-extra);
    border-right: 1px solid var(--bill-border-extra);
  }

  .info-cell:nth-child(4n) {
    border-right: none;
  }

  .info-cell--full {
    grid-column: 1 / -1;
    border-right: none;
  }

  .info-cell:last-child {
    border-bottom: none;
  }

  .info-cell__key {
    font-size: 12px;
    color: var(--bill-text-placeholder);
    margin-bottom: 6px;
  }

  .info-cell__val {
    font-size: 14px;
    color: var(--bill-text-primary);
    font-weight: 500;
    line-height: 1.5;
    word-break: break-all;
  }

  .info-cell__val--mono {
    font-family: "SF Mono", "Menlo", monospace;
    font-size: 13px;
    letter-spacing: 0.02em;
  }

  .info-cell__val--amount {
    color: var(--bill-primary);
    font-weight: 700;
    font-size: 15px;
  }

  .void-info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    padding: 4px 0;
  }

  .void-info-cell {
    padding: 14px 20px;
    border-bottom: 1px solid var(--bill-border-extra);
    border-right: 1px solid var(--bill-border-extra);
  }

  .void-info-cell:nth-child(2n) {
    border-right: none;
  }

  .void-info-cell--full {
    grid-column: 1 / -1;
    border-right: none;
    border-bottom: none;
  }

  /* ===== 标签 ===== */
  .tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .tag--blue {
    background: var(--bill-primary-soft);
    color: var(--bill-primary);
  }
  .tag--gray {
    background: var(--bill-bg-soft);
    color: var(--bill-text-secondary);
  }
  .tag--orange {
    background: var(--bill-warning-soft);
    color: var(--bill-warning);
  }
  .tag--green {
    background: var(--bill-success-soft);
    color: var(--bill-success);
  }

  /* ===== 费用明细自定义表格 ===== */
  .fee-table {
    font-size: 13px;
  }

  .fee-table__head {
    display: flex;
    align-items: center;
    background: var(--bill-bg-softest);
    border-bottom: 1px solid var(--bill-border-lighter);
    padding: 10px 20px;
    font-weight: 600;
    color: var(--bill-text-secondary);
    font-size: 12px;
  }

  .fee-table__body {
    divide-y: 1px solid var(--bill-border-extra);
  }

  .fee-row {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid var(--bill-border-extra);
    transition: background 0.12s;
  }

  .fee-row:last-child {
    border-bottom: none;
  }

  .fee-row:hover {
    background: var(--bill-bg-softest);
  }

  .fee-col {
    display: flex;
    align-items: center;
  }
  .fee-col--idx {
    width: 48px;
    flex-shrink: 0;
    color: var(--bill-text-placeholder);
    font-weight: 600;
  }
  .fee-col--type {
    width: 90px;
    flex-shrink: 0;
  }
  .fee-col--name {
    flex: 1;
    min-width: 0;
    color: var(--bill-text-primary);
    font-weight: 500;
  }
  .fee-col--num {
    width: 110px;
    flex-shrink: 0;
    justify-content: flex-end;
    color: var(--bill-text-regular);
  }
  .fee-col--period {
    width: 210px;
    flex-shrink: 0;
    color: var(--bill-text-secondary);
    padding-left: 20px;
  }
  .fee-col--remark {
    flex: 1;
    min-width: 0;
    color: var(--bill-text-placeholder);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-left: 20px;
  }

  .fee-col--positive {
    color: var(--bill-primary);
    font-weight: 600;
  }

  /* ===== 财务流水列 ===== */
  .flow-col {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: var(--bill-text-regular);
  }
  .flow-col--no {
    flex: 1.4;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .flow-col--type {
    width: 80px;
    flex-shrink: 0;
  }
  .flow-col--dir {
    width: 72px;
    flex-shrink: 0;
  }
  .flow-col--status {
    width: 72px;
    flex-shrink: 0;
  }
  .flow-col--amount {
    width: 90px;
    flex-shrink: 0;
    justify-content: flex-end;
  }
  .flow-col--name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-left: 16px;
  }
  .flow-col--operator {
    width: 90px;
    flex-shrink: 0;
    justify-content: center;
  }
  .flow-col--time {
    width: 148px;
    flex-shrink: 0;
    justify-content: center;
    color: var(--bill-text-secondary);
  }
  .flow-col--remark {
    flex: 1;
    min-width: 0;
    padding-left: 16px;
  }
  .flow-col--mono {
    font-family: "SF Mono", "Menlo", monospace;
    font-size: 12px;
    color: var(--bill-text-secondary);
    letter-spacing: 0.01em;
  }

  /* ===== 支付流水列 ===== */
  .pay-col {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: var(--bill-text-regular);
  }
  .pay-col--no {
    flex: 1.4;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: "SF Mono", "Menlo", monospace;
    font-size: 12px;
    color: var(--bill-text-secondary);
  }
  .pay-col--channel {
    width: 80px;
    flex-shrink: 0;
  }
  .pay-col--status {
    width: 88px;
    flex-shrink: 0;
  }
  .pay-col--third {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: "SF Mono", "Menlo", monospace;
    font-size: 12px;
    color: var(--bill-text-secondary);
  }
  .pay-col--voucher {
    width: 68px;
    flex-shrink: 0;
    justify-content: center;
  }
  .pay-col--amount {
    width: 90px;
    flex-shrink: 0;
    justify-content: flex-end;
  }
  .pay-col--remark {
    flex: 1.2;
    min-width: 0;
    padding-left: 16px;
  }
  .pay-col--time {
    width: 148px;
    flex-shrink: 0;
    justify-content: center;
    color: var(--bill-text-secondary);
  }

  /* ===== 备注悬浮 ===== */
  .remark-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    cursor: default;
    color: var(--bill-text-placeholder);
  }
  .remark-text:hover {
    color: var(--bill-primary);
    text-decoration: underline dotted;
    text-underline-offset: 2px;
  }

  /* ===== 支付状态标签 ===== */
  .pay-status-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
  .pay-status--processing {
    background: var(--bill-warning-soft);
    color: var(--bill-warning);
  }
  .pay-status--success {
    background: var(--bill-success-soft);
    color: var(--bill-success);
  }
  .pay-status--fail {
    background: var(--bill-danger-soft);
    color: var(--bill-danger);
  }
  .pay-status--closed {
    background: var(--bill-bg-soft);
    color: var(--bill-text-placeholder);
  }
  .pay-status--refund {
    background: var(--bill-purple-soft);
    color: var(--bill-purple);
  }

  /* ===== Element Plus 表格美化 ===== */
  .styled-table :deep(.el-table) {
    border-radius: 0;
  }

  .styled-table :deep(.el-table th) {
    background: var(--bill-bg-softest) !important;
    color: var(--bill-text-secondary);
    font-size: 12px;
    font-weight: 600;
  }

  .styled-table :deep(.el-table td) {
    color: var(--bill-text-primary);
    font-size: 13px;
  }

  .flow-type-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    background: var(--bill-primary-soft);
    color: var(--bill-primary);
  }

  .direction-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  .direction-tag--in {
    background: var(--bill-success-soft);
    color: var(--bill-success);
  }
  .direction-tag--out {
    background: var(--bill-danger-soft);
    color: var(--bill-danger);
  }

  .flow-status {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .flow-status--0 {
    background: var(--bill-warning-soft);
    color: var(--bill-warning);
  }
  .flow-status--1 {
    background: var(--bill-success-soft);
    color: var(--bill-success);
  }
  .flow-status--2 {
    background: var(--bill-danger-soft);
    color: var(--bill-danger);
  }
  .flow-status--3 {
    background: var(--bill-bg-soft);
    color: var(--bill-text-placeholder);
  }

  .amount-value {
    font-weight: 600;
    color: var(--bill-primary);
    font-variant-numeric: tabular-nums;
  }

  /* ===== 支付流水网格 ===== */
  .payment-flow-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
  }

  .payment-cell {
    padding: 16px 22px;
    border-right: 1px solid var(--bill-border-extra);
    border-bottom: 1px solid var(--bill-border-extra);
  }

  .payment-cell:nth-child(3n) {
    border-right: none;
  }

  .payment-cell:nth-last-child(-n + 3) {
    border-bottom: none;
  }

  .payment-cell__label {
    font-size: 12px;
    color: var(--bill-text-placeholder);
    margin-bottom: 6px;
  }

  .payment-cell__value {
    font-size: 14px;
    font-weight: 500;
    color: var(--bill-text-primary);
  }

  .payment-cell__value--mono {
    font-family: "SF Mono", "Menlo", monospace;
    font-size: 13px;
    letter-spacing: 0.02em;
    color: var(--bill-text-regular);
  }

  .payment-cell__value--amount {
    color: var(--bill-primary);
    font-weight: 700;
    font-size: 16px;
  }

  /* ===== 空状态 ===== */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    gap: 10px;
  }

  .empty-state__icon {
    font-size: 32px;
    opacity: 0.4;
  }

  .empty-state__text {
    font-size: 13px;
    color: var(--bill-text-placeholder);
  }

  /* ===== 响应式 ===== */
  @media (max-width: 1280px) {
    .metrics-row {
      grid-template-columns: repeat(2, 1fr);
    }
    .info-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .info-cell:nth-child(4n) {
      border-right: 1px solid var(--bill-border-extra);
    }
    .info-cell:nth-child(2n) {
      border-right: none;
    }
    .void-info-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .payment-flow-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .payment-cell:nth-child(3n) {
      border-right: 1px solid var(--bill-border-extra);
    }
    .payment-cell:nth-child(2n) {
      border-right: none;
    }
  }

  @media (max-width: 900px) {
    .metrics-row {
      grid-template-columns: 1fr 1fr;
    }
    .panel__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
    .fee-col--period {
      display: none;
    }
    .fee-col--remark {
      display: none;
    }
    .void-info-grid {
      grid-template-columns: 1fr;
    }
    .void-info-cell {
      border-right: none;
    }
    .void-info-cell--full {
      grid-column: auto;
    }
  }
</style>
