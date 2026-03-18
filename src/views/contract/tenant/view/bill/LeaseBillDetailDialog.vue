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
            <button v-if="bill.payStatus === 0 || bill.payStatus === 1" class="action-btn action-btn--primary" @click="handleCollect">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path
                  d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 4.5v.94a2.5 2.5 0 010 4.62v.94h-1.5v-.94A2.5 2.5 0 015 9h1.5a1 1 0 001 1h1a1 1 0 000-2h-1a2.5 2.5 0 010-5h.25V2h1.5v.5H9a2.5 2.5 0 012.5 2.5H10a1 1 0 00-1-1h-1a1 1 0 000 2h1a2.5 2.5 0 012.25 3.59A2.5 2.5 0 019 11h-.25V11h-.5v.5H6.75V11H6a2.5 2.5 0 01-2.5-2.5H5a1 1 0 001 1z"
                />
              </svg>
              收款
            </button>
            <button class="action-btn" :disabled="bill.payStatus === 2" :class="{ 'action-btn--disabled': bill.payStatus === 2 }" @click="handleEdit">编辑账单</button>
            <button v-if="bill.payStatus === 0" class="action-btn" @click="handleSplit">账单拆分</button>
            <button v-if="bill.payStatus === 0" class="action-btn" @click="handleFree">免收</button>
            <button v-if="bill.payStatus === 0" class="action-btn" @click="handleBadDebt">标记坏账</button>
            <button class="action-btn action-btn--danger" @click="handleVoid">作废账单</button>
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
            <div class="info-cell__val">{{ formatDateTime(latestPaymentFlow?.payTime) }}</div>
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
                <div class="fee-col fee-col--period">{{ formatDate(row.feeStart) }} ~ {{ formatDate(row.feeEnd) }}</div>
                <div class="fee-col fee-col--remark" :title="row.remark">{{ row.remark || "—" }}</div>
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
          <el-table :data="financeFlowList" class="styled-table">
            <el-table-column prop="flowNo" label="流水号" min-width="180" show-overflow-tooltip />
            <el-table-column label="流水类型" width="110" align="center">
              <template #default="{ row }">
                <span class="flow-type-tag">{{ financeFlowTypeText(row.flowType) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="资金方向" width="110" align="center">
              <template #default="{ row }">
                <span class="direction-tag" :class="row.flowDirection === 'IN' ? 'direction-tag--in' : 'direction-tag--out'">
                  {{ financeFlowDirectionText(row.flowDirection) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <span class="flow-status" :class="`flow-status--${row.status}`">{{ flowStatusText(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120" align="right">
              <template #default="{ row }">
                <span class="amount-value">¥{{ formatAmount(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="费用名称" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">
                {{ getFinanceFlowFeeName(row.bizId) }}
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="110" align="center" />
            <el-table-column label="流水时间" min-width="160" align="center">
              <template #default="{ row }">{{ formatDateTime(row.flowTime) }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
          </el-table>
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
          <el-table :data="paymentFlowList" class="styled-table">
            <el-table-column prop="paymentNo" label="支付流水号" min-width="180" show-overflow-tooltip />
            <el-table-column label="支付渠道" width="120" align="center">
              <template #default="{ row }">
                {{ paymentChannelText(row.channel) }}
              </template>
            </el-table-column>
            <el-table-column label="支付状态" width="110" align="center">
              <template #default="{ row }">
                {{ paymentStatusText(row.status) }}
              </template>
            </el-table-column>
            <el-table-column prop="thirdTradeNo" label="第三方单号" min-width="160" show-overflow-tooltip />
            <el-table-column label="支付凭证" width="120" align="center">
              <template #default="{ row }">
                <el-image
                  v-if="row.paymentVoucherUrl"
                  :src="row.paymentVoucherUrl"
                  :preview-src-list="[row.paymentVoucherUrl]"
                  fit="cover"
                  class="payment-voucher-thumb"
                  preview-teleported
                />
                <span v-else>—</span>
              </template>
            </el-table-column>
            <el-table-column label="支付金额" width="120" align="right">
              <template #default="{ row }">
                <span class="amount-value">¥{{ formatAmount(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="支付备注" min-width="180" show-overflow-tooltip />
            <el-table-column label="支付时间" min-width="160" align="center">
              <template #default="{ row }">{{ formatDateTime(row.payTime) }}</template>
            </el-table-column>
          </el-table>
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
  import { computed, onMounted, ref } from "vue";
  import { h } from "vue";
  import type { FinanceFlowVo, LeaseBillListVo, LeaseDetailVo, PaymentFlowVo } from "@/types";
  import { collectLeaseBill, getLeaseBillDetail, getLeaseDetail, updateLeaseBill } from "@/api/contract/tenant";
  import { addDialog } from "@/components/ReDialog";
  import { message } from "@/utils/message";
  import LeaseBillEditDialog from "@/views/contract/tenant/view/bill/LeaseBillEditDialog.vue";
  import LeaseBillCollectDialog from "@/views/contract/tenant/view/bill/LeaseBillCollectDialog.vue";

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
      const aTime = a.payTime ? new Date(a.payTime).getTime() : 0;
      const bTime = b.payTime ? new Date(b.payTime).getTime() : 0;
      return bTime - aTime;
    })
  );
  const latestPaymentFlow = computed<PaymentFlowVo | undefined>(() => paymentFlowList.value[0]);

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
    if (bill.value.payStatus === 2 || !bill.value.dueDate) return false;
    return new Date(bill.value.dueDate).getTime() < Date.now();
  });

  const statusBadgeClass = computed(() => {
    if (bill.value.payStatus === 0) return "badge--unpaid";
    if (bill.value.payStatus === 1) return "badge--partial";
    if (bill.value.payStatus === 2) return "badge--paid";
    return "";
  });

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

  const handleVoid = () => {
    message(`作废账单：第${bill.value.sortOrder}期`, { type: "warning" });
  };

  const handleEdit = () => {
    if (bill.value.payStatus === 2) {
      message("账单已支付，不允许编辑", { type: "warning" });
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
    display: flex;
    flex-direction: column;
    gap: 14px;
    color: #1a1f2e;
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  }

  /* ===== 地址横幅 ===== */
  .address-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
    border: 1px solid #c7d7fb;
    border-radius: 10px;
  }

  .address-banner__icon {
    width: 36px;
    height: 36px;
    background: #3b5bdb;
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
    color: #6c7a9c;
    font-size: 13px;
    white-space: nowrap;
  }

  .address-banner__value {
    color: #1a1f2e;
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
    border: 1px solid #e8ecf4;
    background: #fff;
  }

  .metric-card--amount {
    border-color: #dbeafe;
    background: #f8fbff;
  }

  .metric-card--amount .metric-card__icon-wrap {
    background: #dbeafe;
    color: #2563eb;
  }

  .metric-card__value--amount {
    font-size: 22px;
    font-weight: 700;
    color: #1d4ed8;
  }

  .metric-card__currency {
    font-size: 14px;
    font-weight: 500;
    margin-right: 2px;
    color: #1d4ed8;
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
    background: #eff6ff;
    color: #2563eb;
  }

  .metric-card--period .metric-card__icon-wrap {
    background: #f0fdf4;
    color: #16a34a;
  }

  .metric-card--summary .metric-card__icon-wrap {
    background: #fff7ed;
    color: #d97706;
  }

  .metric-card__label {
    font-size: 12px;
    color: #8492b0;
    margin-bottom: 4px;
  }

  .metric-card__value {
    font-size: 15px;
    font-weight: 600;
    color: #1a1f2e;
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
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }

  /* ===== 状态标签 ===== */
  .badge--unpaid,
  .status-badge.badge--unpaid {
    background: #fff1f2;
    color: #e11d48;
    border: 1px solid #fecdd3;
  }
  .badge--partial,
  .status-badge.badge--partial {
    background: #fffbeb;
    color: #d97706;
    border: 1px solid #fde68a;
  }
  .badge--paid,
  .status-badge.badge--paid {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
  }
  .badge--overdue,
  .status-badge.badge--overdue,
  .address-banner__badge--overdue {
    background: #fff1f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .address-banner__badge.badge--unpaid {
    background: #fff1f2;
    color: #e11d48;
  }
  .address-banner__badge.badge--partial {
    background: #fffbeb;
    color: #d97706;
  }
  .address-banner__badge.badge--paid {
    background: #f0fdf4;
    color: #16a34a;
  }
  .address-banner__badge--overdue {
    background: #fff1f2;
    color: #dc2626;
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
    border: 1px solid #e8ecf4;
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
  }

  .panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid #f0f2f8;
    background: #fafbfd;
  }

  .panel__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    color: #1a1f2e;
  }

  .panel__title-dot {
    width: 4px;
    height: 16px;
    border-radius: 2px;
    background: #2563eb;
    flex-shrink: 0;
  }

  .panel__title-dot--orange {
    background: #f59e0b;
  }
  .panel__title-dot--green {
    background: #10b981;
  }
  .panel__title-dot--purple {
    background: #8b5cf6;
  }

  .panel__count {
    font-size: 12px;
    color: #8492b0;
    background: #f0f2f8;
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
    border: 1px solid #d1d9f0;
    background: #fff;
    color: #4361b8;
    transition: all 0.15s ease;
    line-height: 1;
  }

  .action-btn:hover {
    background: #f0f4ff;
    border-color: #93a8f0;
    color: #2563eb;
  }

  .action-btn--disabled,
  .action-btn:disabled {
    cursor: not-allowed;
    color: #9ca3af;
    border-color: #e5e7eb;
    background: #f8fafc;
  }

  .action-btn--disabled:hover,
  .action-btn:disabled:hover {
    color: #9ca3af;
    border-color: #e5e7eb;
    background: #f8fafc;
  }

  .action-btn--primary {
    background: #2563eb;
    color: #fff;
    border-color: #2563eb;
  }

  .action-btn--primary:hover {
    background: #1d4ed8;
    border-color: #1d4ed8;
    color: #fff;
  }

  .action-btn--primary svg {
    width: 13px;
    height: 13px;
  }

  .action-btn--danger {
    color: #e11d48;
    border-color: #fecdd3;
    background: #fff1f2;
  }

  .action-btn--danger:hover {
    background: #ffe4e6;
    border-color: #fda4af;
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
    border-bottom: 1px solid #f4f5f9;
    border-right: 1px solid #f4f5f9;
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
    color: #8492b0;
    margin-bottom: 6px;
  }

  .info-cell__val {
    font-size: 14px;
    color: #1a1f2e;
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
    color: #2563eb;
    font-weight: 700;
    font-size: 15px;
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
    background: #eff6ff;
    color: #2563eb;
  }
  .tag--gray {
    background: #f4f5f9;
    color: #6c7a9c;
  }
  .tag--orange {
    background: #fff7ed;
    color: #d97706;
  }
  .tag--green {
    background: #f0fdf4;
    color: #16a34a;
  }

  /* ===== 费用明细自定义表格 ===== */
  .fee-table {
    font-size: 13px;
  }

  .fee-table__head {
    display: flex;
    align-items: center;
    background: #f8fafc;
    border-bottom: 1px solid #e8ecf4;
    padding: 10px 20px;
    font-weight: 600;
    color: #6c7a9c;
    font-size: 12px;
  }

  .fee-table__body {
    divide-y: 1px solid #f0f2f8;
  }

  .fee-row {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid #f4f5f9;
    transition: background 0.12s;
  }

  .fee-row:last-child {
    border-bottom: none;
  }

  .fee-row:hover {
    background: #fafbff;
  }

  .fee-col {
    display: flex;
    align-items: center;
  }
  .fee-col--idx {
    width: 48px;
    flex-shrink: 0;
    color: #bcc4d8;
    font-weight: 600;
  }
  .fee-col--type {
    width: 90px;
    flex-shrink: 0;
  }
  .fee-col--name {
    flex: 1;
    min-width: 0;
    color: #1a1f2e;
    font-weight: 500;
  }
  .fee-col--num {
    width: 110px;
    flex-shrink: 0;
    justify-content: flex-end;
    color: #4b5563;
  }
  .fee-col--period {
    width: 210px;
    flex-shrink: 0;
    color: #6c7a9c;
    padding-left: 20px;
  }
  .fee-col--remark {
    flex: 1;
    min-width: 0;
    color: #8492b0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-left: 20px;
  }

  .fee-col--positive {
    color: #2563eb;
    font-weight: 600;
  }

  /* ===== Element Plus 表格美化 ===== */
  .styled-table :deep(.el-table) {
    border-radius: 0;
  }

  .styled-table :deep(.el-table th) {
    background: #f8fafc !important;
    color: #6c7a9c;
    font-size: 12px;
    font-weight: 600;
  }

  .styled-table :deep(.el-table td) {
    color: #1a1f2e;
    font-size: 13px;
  }

  .flow-type-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    background: #f0f4ff;
    color: #3b5bdb;
  }

  .direction-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  .direction-tag--in {
    background: #f0fdf4;
    color: #16a34a;
  }
  .direction-tag--out {
    background: #fff1f2;
    color: #e11d48;
  }

  .flow-status {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .flow-status--0 {
    background: #fffbeb;
    color: #d97706;
  }
  .flow-status--1 {
    background: #f0fdf4;
    color: #16a34a;
  }
  .flow-status--2 {
    background: #fff1f2;
    color: #e11d48;
  }
  .flow-status--3 {
    background: #f4f5f9;
    color: #8492b0;
  }

  .amount-value {
    font-weight: 600;
    color: #2563eb;
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
    border-right: 1px solid #f4f5f9;
    border-bottom: 1px solid #f4f5f9;
  }

  .payment-cell:nth-child(3n) {
    border-right: none;
  }

  .payment-cell:nth-last-child(-n + 3) {
    border-bottom: none;
  }

  .payment-cell__label {
    font-size: 12px;
    color: #8492b0;
    margin-bottom: 6px;
  }

  .payment-cell__value {
    font-size: 14px;
    font-weight: 500;
    color: #1a1f2e;
  }

  .payment-cell__value--mono {
    font-family: "SF Mono", "Menlo", monospace;
    font-size: 13px;
    letter-spacing: 0.02em;
    color: #4b5563;
  }

  .payment-cell__value--amount {
    color: #2563eb;
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
    color: #b0b9cc;
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
      border-right: 1px solid #f4f5f9;
    }
    .info-cell:nth-child(2n) {
      border-right: none;
    }
    .payment-flow-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .payment-cell:nth-child(3n) {
      border-right: 1px solid #f4f5f9;
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
  }
</style>
