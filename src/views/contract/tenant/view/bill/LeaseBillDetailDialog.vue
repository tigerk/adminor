<template>
  <div class="bill-detail-dialog">
    <el-skeleton v-if="loading" :rows="10" animated />
    <template v-else>
      <div class="bill-address-bar">
        <span class="address-label">房源地址：</span>
        <span class="address-value">{{ roomAddressText }}</span>
      </div>

      <div class="bill-overview">
        <div class="overview-card overview-card--status">
          <div class="overview-icon">
            <el-icon><Money /></el-icon>
          </div>
          <div class="overview-main">
            <div class="overview-label">当前状态</div>
            <div class="overview-value" :class="statusClass">{{ payStatusText }}</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="overview-icon overview-icon--person">
            <el-icon><User /></el-icon>
          </div>
          <div class="overview-main">
            <div class="overview-label">付款人信息</div>
            <div class="overview-value">{{ payerInfo }}</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="overview-icon overview-icon--amount">
            <el-icon><Wallet /></el-icon>
          </div>
          <div class="overview-main">
            <div class="overview-label">金额</div>
            <div class="overview-value">¥{{ bill.totalAmount ?? 0 }}</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="overview-icon overview-icon--summary">
            <el-icon><Tickets /></el-icon>
          </div>
          <div class="overview-main">
            <div class="overview-label">账单摘要</div>
            <div class="overview-value">{{ billSummary }}</div>
          </div>
        </div>

        <div class="overview-card">
          <div class="overview-icon overview-icon--date">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="overview-main">
            <div class="overview-label">预计收款日期</div>
            <div class="overview-value">{{ formatDate(bill.dueDate) }}</div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <div class="section-title">账单信息</div>
          <div class="section-actions">
            <el-button v-if="bill.payStatus === 0" type="primary" link @click="handleCollect">收款</el-button>
            <el-button v-if="bill.payStatus === 0" type="primary" link @click="handleEdit">编辑账单</el-button>
            <el-button v-if="bill.payStatus === 0" type="primary" link @click="handleSplit">账单拆分</el-button>
            <el-button v-if="bill.payStatus === 0" type="primary" link @click="handleFree">免收</el-button>
            <el-button v-if="bill.payStatus === 0" type="primary" link @click="handleBadDebt">标记坏账</el-button>
            <el-button v-if="bill.payStatus === 0 || bill.payStatus === 1" type="danger" link @click="handleVoid">作废账单</el-button>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">账单编号</div>
            <div class="info-value">{{ bill.id || "-" }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">账单生成方式</div>
            <div class="info-value">系统生成</div>
          </div>
          <div class="info-item">
            <div class="info-label">账单所属</div>
            <div class="info-value">租客</div>
          </div>
          <div class="info-item">
            <div class="info-label">付款人姓名</div>
            <div class="info-value">{{ bill.payerName || leaseDetail?.tenantName || "-" }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">付款人电话</div>
            <div class="info-value">{{ bill.payerPhone || leaseDetail?.tenantPhone || "-" }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">付款人证件类型</div>
            <div class="info-value">{{ getPayerIdTypeName }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">付款人证件号</div>
            <div class="info-value">{{ getPayerIdNo }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">账单类型</div>
            <div class="info-value">{{ billTypeText }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">账单期数</div>
            <div class="info-value">第{{ bill.sortOrder || "-" }}期</div>
          </div>
          <div class="info-item">
            <div class="info-label">账期</div>
            <div class="info-value">{{ formatDate(bill.billStart) }} - {{ formatDate(bill.billEnd) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">应收总额</div>
            <div class="info-value">¥{{ bill.totalAmount ?? 0 }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">支付状态</div>
            <div class="info-value">{{ payStatusText }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">支付方式</div>
            <div class="info-value">{{ payChannelText }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">支付时间</div>
            <div class="info-value">{{ formatDateTime(bill.payTime) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">支付金额</div>
            <div class="info-value">{{ bill.payAmount != null ? `¥${bill.payAmount}` : "-" }}</div>
          </div>
          <div class="info-item info-item--full">
            <div class="info-label">备注</div>
            <div class="info-value">{{ bill.remark || "-" }}</div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title mb-1">账单明细</div>
        <el-table v-if="bill.feeList?.length" :data="bill.feeList" border>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="收支类型" width="110" align="center">
            <template #default>待收</template>
          </el-table-column>
          <el-table-column prop="name" label="费用科目" min-width="180" />
          <el-table-column label="应收(付)" width="120" align="center">
            <template #default="{ row }">
              <span class="amount-primary">+ {{ row.amount }}元</span>
            </template>
          </el-table-column>
          <el-table-column label="已收(付)" width="120" align="center">
            <template #default>0元</template>
          </el-table-column>
          <el-table-column label="待收(付)" width="120" align="center">
            <template #default="{ row }">
              <span class="amount-primary">+ {{ row.amount }}元</span>
            </template>
          </el-table-column>
          <el-table-column label="费用周期" min-width="200" align="center">
            <template #default="{ row }">{{ formatDate(row.feeStart) }} ~ {{ formatDate(row.feeEnd) }}</template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>
        <el-empty v-else description="暂无费用明细" :image-size="80" />
      </div>

      <div class="section-card">
        <div class="section-title">账单财务流水</div>
        <el-table v-if="financeFlowList.length" :data="financeFlowList" border>
          <el-table-column prop="flowNo" label="流水号" min-width="180" show-overflow-tooltip />
          <el-table-column label="流水类型" width="120" align="center">
            <template #default="{ row }">{{ financeFlowTypeText(row.flowType) }}</template>
          </el-table-column>
          <el-table-column label="资金方向" width="110" align="center">
            <template #default="{ row }">{{ financeFlowDirectionText(row.flowDirection) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">{{ flowStatusText(row.status) }}</template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="center">
            <template #default="{ row }">¥{{ formatAmount(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="feeName" label="费用名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="operatorName" label="操作人" width="120" align="center" />
          <el-table-column label="流水时间" min-width="170" align="center">
            <template #default="{ row }">{{ formatDateTime(row.flowTime) }}</template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>
        <el-empty v-else description="暂无财务流水" :image-size="80" />
      </div>

      <div class="section-card">
        <div class="section-title">支付流水</div>
        <el-descriptions v-if="paymentFlow" :column="3" border>
          <el-descriptions-item label="支付流水号">{{ paymentFlow.paymentNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="支付渠道">{{ paymentChannelText(paymentFlow.channel) }}</el-descriptions-item>
          <el-descriptions-item label="支付状态">{{ paymentStatusText(paymentFlow.status) }}</el-descriptions-item>
          <el-descriptions-item label="第三方单号">{{ paymentFlow.thirdTradeNo || "-" }}</el-descriptions-item>
          <el-descriptions-item label="支付金额">¥{{ formatAmount(paymentFlow.amount) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ formatDateTime(paymentFlow.payTime) }}</el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="暂无支付流水" :image-size="80" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { Calendar, Money, Tickets, User, Wallet } from "@element-plus/icons-vue";
  import { computed, onMounted, ref } from "vue";
  import { h } from "vue";
  import type { LeaseBillListVo, LeaseDetailVo, PaymentFlowVo } from "@/types";
  import { getLeaseBillDetail, getLeaseDetail, updateLeaseBill } from "@/api/contract/tenant";
  import { addDialog } from "@/components/ReDialog";
  import { message } from "@/utils/message";
  import LeaseBillEditDialog from "@/views/contract/tenant/view/bill/LeaseBillEditDialog.vue";

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
  const paymentFlow = computed(() => bill.value.paymentFlow as PaymentFlowVo | undefined);

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
    if (status === 0) return "待收";
    if (status === 1) return "部分收款";
    if (status === 2) return "已收";
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

  const payerInfo = computed(() => {
    const payerName = bill.value.payerName || leaseDetail.value?.tenantName;
    const payerPhone = bill.value.payerPhone || leaseDetail.value?.tenantPhone;
    if (payerName && payerPhone) {
      return `${payerName} ${payerPhone}`;
    }
    return payerName || payerPhone || "-";
  });

  const billSummary = computed(() => {
    const feeNames = (bill.value.feeList || []).map(item => item.name).filter(Boolean);
    return feeNames.length ? Array.from(new Set(feeNames)).join("/") : billTypeText.value;
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

  const formatAmount = (val?: string | number) => {
    if (val === undefined || val === null) return "-";
    const amount = typeof val === "string" ? Number(val) : val;
    if (Number.isNaN(amount)) return "-";
    return (amount / 100).toFixed(2);
  };

  const flowStatusText = (status?: number) => {
    if (status === 0) return "处理中";
    if (status === 1) return "成功";
    if (status === 2) return "失败";
    if (status === 3) return "已作废";
    return "-";
  };

  const paymentStatusText = (status?: number) => {
    if (status === 0) return "支付中";
    if (status === 1) return "支付成功";
    if (status === 2) return "支付失败";
    if (status === 3) return "已关闭";
    if (status === 4) return "退款中";
    if (status === 5) return "已退款";
    return "-";
  };

  const paymentChannelText = (channel?: string) => {
    if (!channel) return "-";
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
    if (!flowType) return "-";
    if (flowType === "RECEIVE") return "收款";
    if (flowType === "PAY") return "付款";
    if (flowType === "REFUND") return "退款";
    if (flowType === "VOID") return "作废";
    if (flowType === "ADJUST") return "调整";
    return flowType;
  };

  const financeFlowDirectionText = (direction?: string) => {
    if (!direction) return "-";
    if (direction === "IN") return "收入";
    if (direction === "OUT") return "支出";
    return direction;
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
      return idType == null ? "-" : idTypeNameMap[idType] || "-";
    }
    if (leaseDetail.value?.tenantType === 1) {
      const idType = leaseDetail.value.tenantCompany?.legalPersonIdType;
      return idType == null ? "-" : idTypeNameMap[idType] || "-";
    }
    return "-";
  });

  const getPayerIdNo = computed(() => {
    if (bill.value.payerIdNo) return bill.value.payerIdNo;
    if (leaseDetail.value?.tenantType === 0) return leaseDetail.value.tenantPersonal?.idNo || "-";
    if (leaseDetail.value?.tenantType === 1) return leaseDetail.value.tenantCompany?.legalPersonIdNo || "-";
    return "-";
  });

  const roomAddressText = computed(() => {
    if (bill.value.roomAddress) return bill.value.roomAddress;
    const roomList = leaseDetail.value?.roomList || [];
    if (!roomList.length) return "-";
    return roomList.map(room => room.houseName || room.doorNumber || room.roomNumber).filter(Boolean).join("、") || "-";
  });

  const refreshBillDetail = async () => {
    if (!props.billId) return;
    const res = await getLeaseBillDetail({ billId: props.billId });
    if (res.code === 0 && res.data) {
      bill.value = res.data;
    }
  };

  const handleCollect = () => {
    message(`收款：第${bill.value.sortOrder}期`, { type: "info" });
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
        if (resp.code === 0) {
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
  .bill-detail-dialog {
    display: grid;
    gap: 16px;
    color: #1f2937;
  }

  .bill-address-bar {
    padding: 14px 18px;
    border-radius: 10px;
    background: #eef3ff;
    font-size: 15px;
  }

  .address-label {
    color: #6b7280;
  }

  .address-value {
    color: #374151;
    font-weight: 500;
  }

  .bill-overview {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px;
  }

  .overview-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #fff;
  }

  .overview-icon {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fee2e2;
    color: #ef4444;
    font-size: 20px;
    flex-shrink: 0;
  }

  .overview-icon--person {
    background: #dbeafe;
    color: #3b82f6;
  }

  .overview-icon--amount {
    background: #dbeafe;
    color: #2563eb;
  }

  .overview-icon--summary {
    background: #ffedd5;
    color: #f59e0b;
  }

  .overview-icon--date {
    background: #dcfce7;
    color: #10b981;
  }

  .overview-label {
    color: #6b7280;
    font-size: 13px;
    margin-bottom: 6px;
  }

  .overview-value {
    color: #111827;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
  }

  .status--unpaid {
    color: #ef4444;
  }

  .status--partial {
    color: #f59e0b;
  }

  .status--paid {
    color: #16a34a;
  }

  .status--overdue {
    color: #dc2626;
  }

  .section-card {
    padding: 18px 20px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #fff;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }

  .section-title {
    padding-left: 10px;
    border-left: 4px solid #2563eb;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .section-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px 28px;
  }

  .info-item--full {
    grid-column: 1 / -1;
  }

  .info-label {
    margin-bottom: 8px;
    color: #6b7280;
    font-size: 13px;
  }

  .info-value {
    color: #111827;
    font-size: 15px;
    line-height: 1.5;
    word-break: break-all;
  }

  .amount-primary {
    color: #2563eb;
    font-weight: 600;
  }

  @media (max-width: 1280px) {
    .bill-overview {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .info-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .section-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
