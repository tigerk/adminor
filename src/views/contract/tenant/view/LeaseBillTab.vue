<template>
  <div class="tenant-bill-tab">
    <!-- 当前账单区块 -->
    <div class="mb-3 bill-section">
      <div class="section-header-wrapper">
        <div class="flex items-center justify-between px-4 py-2.5 section-header-content">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold section-title">当前账单</span>
            <div class="flex items-center gap-1.5 px-2 py-1 count-badge">
              <span class="text-xs font-medium">{{ billList?.length || 0 }}条</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <el-button type="primary" size="small" :icon="Refresh" :loading="loading" @click="fetchBillData">刷新</el-button>
          </div>
        </div>
      </div>

      <!-- 当前账单表格 -->
      <div class="bill-table-wrapper">
        <el-table
          v-if="billList && billList.length > 0"
          v-loading="loading"
          :data="billList"
          border
          stripe
          class="bill-table"
          :expand-row-keys="expandedBillRows"
          row-key="id"
          @row-click="openBillDetail"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <div v-if="row.feeList && row.feeList.length === 0" class="text-center">没有费用明细</div>
              <div v-if="row.feeList && row.feeList.length > 0" class="expanded-content">
                <div class="expanded-header m-1">
                  <el-space>
                    <span class="header-title">费用明细</span>
                    <el-tag type="info" size="small">共 {{ row.feeList.length }} 项</el-tag>
                  </el-space>
                </div>
                <el-table :data="row.feeList" border size="small" class="sub-table">
                  <el-table-column type="index" label="序号" width="60" align="center" />
                  <el-table-column prop="feeType" label="费用类型" align="center" width="120">
                    <template #default="{ row: fee }">
                      <el-tag v-if="fee.feeType === 'RENTAL'" type="success">租金</el-tag>
                      <el-tag v-else-if="fee.feeType === 'DEPOSIT'" type="warning">押金</el-tag>
                      <el-tag v-else type="info">其他费用</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="name" label="费用名称" align="center" min-width="140" />
                  <el-table-column prop="amount" label="金额" align="center" width="110">
                    <template #default="{ row: fee }">
                      <span class="fee-amount">¥{{ fee.amount }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="费用周期" align="center" min-width="200">
                    <template #default="{ row: fee }">{{ fee.feeStart?.substring(0, 10) }} ~ {{ fee.feeEnd?.substring(0, 10) }}</template>
                  </el-table-column>
                  <el-table-column prop="remark" label="说明" align="center" min-width="200" show-overflow-tooltip />
                </el-table>
              </div>
            </template>
          </el-table-column>

          <el-table-column type="index" label="序号" width="70" align="center" />

          <el-table-column prop="sortOrder" label="期数" align="center" width="80">
            <template #default="{ row }">第{{ row.sortOrder }}期</template>
          </el-table-column>

          <el-table-column prop="dueDate" label="应收日期" align="center" width="110">
            <template #default="{ row }">{{ row.dueDate?.substring(0, 10) }}</template>
          </el-table-column>

          <el-table-column prop="billType" label="账单类型" align="center" width="110">
            <template #default="{ row }">
              <el-tag v-if="row.billType === 1" type="success">租金</el-tag>
              <el-tag v-else-if="row.billType === 2" type="warning">押金</el-tag>
              <el-tag v-else-if="row.billType === 5" type="success">押金结转入</el-tag>
              <el-tag v-else-if="row.billType === 6" type="warning">押金结转出</el-tag>
              <el-tag v-else type="info">其他费用</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="billStart" label="账期开始" align="center" width="110">
            <template #default="{ row }">{{ row.billStart?.substring(0, 10) }}</template>
          </el-table-column>

          <el-table-column prop="billEnd" label="账期结束" align="center" width="110">
            <template #default="{ row }">{{ row.billEnd?.substring(0, 10) }}</template>
          </el-table-column>

          <el-table-column prop="totalAmount" label="应收总额" align="center" width="120">
            <template #default="{ row }">
              <span class="total-amount">¥{{ row.totalAmount }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="payStatus" label="支付状态" align="center" width="100">
            <template #default="{ row }">
              <el-tag :type="getPayStatusTagType(row)">{{ getPayStatusLabel(row) }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="remark" label="备注" align="center" min-width="250" show-overflow-tooltip />

          <el-table-column label="操作" fixed="right" align="center" width="70">
            <template #default="{ row }">
              <div @click.stop>
                <el-dropdown trigger="click" @command="cmd => handleAction(cmd, row)">
                  <el-button class="mt-[2px]!" link type="primary" size="small" :icon="useRenderIcon(More)" @click.stop />
                  <template #dropdown>
                    <el-dropdown-menu @click.stop>
                      <template v-if="row.payStatus === 0">
                        <el-dropdown-item command="collect">收款</el-dropdown-item>
                        <el-dropdown-item command="edit">编辑账单</el-dropdown-item>
                        <el-dropdown-item command="split">账单拆分</el-dropdown-item>
                        <el-dropdown-item command="free">免收</el-dropdown-item>
                        <el-dropdown-item command="badDebt">标记坏账</el-dropdown-item>
                        <el-dropdown-item command="void">作废账单</el-dropdown-item>
                      </template>
                      <template v-else-if="row.payStatus === 1">
                        <el-dropdown-item command="collect">收款</el-dropdown-item>
                        <el-dropdown-item command="edit">编辑账单</el-dropdown-item>
                        <el-dropdown-item command="void">作废账单</el-dropdown-item>
                      </template>
                      <template v-else-if="row.payStatus === 2">
                        <el-dropdown-item command="edit" disabled>编辑账单</el-dropdown-item>
                        <el-dropdown-item command="void">作废账单</el-dropdown-item>
                      </template>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-else-if="!loading" description="暂无当前账单" :image-size="180">
          <slot name="empty">
            <el-button type="primary" size="default">生成账单</el-button>
          </slot>
        </el-empty>
      </div>
    </div>

    <!-- 历史无效账单区块 -->
    <div v-if="invalidBillList && invalidBillList.length > 0" class="bill-section">
      <div class="section-header-wrapper">
        <div class="flex items-center justify-between px-4 py-2.5 section-header-content">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold section-title">历史无效账单</span>
            <div class="flex items-center gap-1.5 px-2 py-1 count-badge">
              <span class="text-xs font-medium">{{ invalidBillList?.length || 0 }}条</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 历史无效账单表格 -->
      <div class="bill-table-wrapper">
        <el-table
          v-loading="invalidLoading"
          :data="invalidBillList"
          border
          stripe
          class="bill-table invalid-bill-table"
          :expand-row-keys="expandedInvalidBillRows"
          row-key="id"
          @row-click="openBillDetail"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <div v-if="row.feeList && row.feeList.length === 0" class="text-center">没有费用明细</div>
              <div v-if="row.feeList && row.feeList.length > 0" class="expanded-content">
                <div class="expanded-header m-1">
                  <el-space>
                    <span class="header-title">费用明细</span>
                    <el-tag type="info" size="small">共 {{ row.feeList.length }} 项</el-tag>
                  </el-space>
                </div>
                <el-table :data="row.feeList" border size="small" class="sub-table">
                  <el-table-column type="index" label="序号" width="60" align="center" />
                  <el-table-column prop="feeType" label="费用类型" align="center" width="120">
                    <template #default="{ row: fee }">
                      <el-tag v-if="fee.feeType === 'RENTAL'" type="success">租金</el-tag>
                      <el-tag v-else-if="fee.feeType === 'DEPOSIT'" type="warning">押金</el-tag>
                      <el-tag v-else type="info">其他费用</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="name" label="费用名称" align="center" min-width="140" />
                  <el-table-column prop="amount" label="金额" align="center" width="110">
                    <template #default="{ row: fee }">
                      <span class="fee-amount">¥{{ fee.amount }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="费用周期" align="center" min-width="200">
                    <template #default="{ row: fee }">{{ fee.feeStart?.substring(0, 10) }} ~ {{ fee.feeEnd?.substring(0, 10) }}</template>
                  </el-table-column>
                  <el-table-column prop="remark" label="说明" align="center" min-width="200" show-overflow-tooltip />
                </el-table>
              </div>
            </template>
          </el-table-column>

          <el-table-column type="index" label="序号" width="70" align="center" />

          <el-table-column prop="sortOrder" label="期数" align="center" width="80">
            <template #default="{ row }">第{{ row.sortOrder }}期</template>
          </el-table-column>

          <el-table-column prop="dueDate" label="应收日期" align="center" width="110">
            <template #default="{ row }">{{ row.dueDate?.substring(0, 10) }}</template>
          </el-table-column>

          <el-table-column prop="billType" label="账单类型" align="center" width="110">
            <template #default="{ row }">
              <el-tag v-if="row.billType === 1" type="success">租金</el-tag>
              <el-tag v-else-if="row.billType === 2" type="warning">押金</el-tag>
              <el-tag v-else-if="row.billType === 5" type="success">押金结转入</el-tag>
              <el-tag v-else-if="row.billType === 6" type="warning">押金结转出</el-tag>
              <el-tag v-else type="info">其他费用</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="billStart" label="账期开始" align="center" width="110">
            <template #default="{ row }">{{ row.billStart?.substring(0, 10) }}</template>
          </el-table-column>

          <el-table-column prop="billEnd" label="账期结束" align="center" width="110">
            <template #default="{ row }">{{ row.billEnd?.substring(0, 10) }}</template>
          </el-table-column>

          <el-table-column prop="totalAmount" label="应收总额" align="center" width="120">
            <template #default="{ row }">
              <span class="total-amount">¥{{ row.totalAmount }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="payStatus" label="支付状态" align="center" width="100">
            <template #default="{ row }">
              <el-tag :type="getPayStatusTagType(row)">{{ getPayStatusLabel(row) }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="remark" label="备注" align="center" min-width="250" show-overflow-tooltip />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { h, onMounted, ref, watch } from "vue";
  import { Refresh } from "@element-plus/icons-vue";
  import { LeaseBillListVo } from "@/types";
  import { collectLeaseBill, getLeaseBillDetail, getLeaseBillInvalidList, getLeaseBillList, updateLeaseBill } from "@/api/contract/tenant";
  import { addDialog } from "@/components/ReDialog";
  import { message } from "@/utils/message";
  import LeaseBillDetailDialog from "@/views/contract/tenant/view/bill/LeaseBillDetailDialog.vue";
  import LeaseBillEditDialog from "@/views/contract/tenant/view/bill/LeaseBillEditDialog.vue";
  import LeaseBillCollectDialog from "@/views/contract/tenant/view/bill/LeaseBillCollectDialog.vue";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import More from "~icons/ep/more-filled";

  interface Props {
    leaseId: string;
  }

  const props = defineProps<Props>();

  // 当前账单数据
  const billList = ref<LeaseBillListVo[]>([]);
  const loading = ref(false);
  const expandedBillRows = ref<string[]>([]);

  // 历史无效账单数据
  const invalidBillList = ref<LeaseBillListVo[]>([]);
  const invalidLoading = ref(false);
  const expandedInvalidBillRows = ref<string[]>([]);

  const isOverdue = (bill: LeaseBillListVo) => {
    if (bill.payStatus === 2 || !bill.dueDate) return false;
    return new Date(bill.dueDate).getTime() < Date.now();
  };

  const getPayStatusLabel = (bill: LeaseBillListVo) => {
    if (bill.payStatus === 2) return "已支付";
    if (isOverdue(bill)) return "逾期";
    if (bill.payStatus === 1) return "部分支付";
    return "未支付";
  };

  const getPayStatusTagType = (bill: LeaseBillListVo) => {
    if (bill.payStatus === 2) return "success";
    if (isOverdue(bill)) return "danger";
    if (bill.payStatus === 1) return "warning";
    return "danger";
  };

  const openBillDetail = (row: LeaseBillListVo) => {
    let billId = row.id as string;
    if (!billId) return;
    addDialog({
      title: "账单详情",
      width: "70%",
      top: "8%",
      alignCenter: true,
      lockScroll: true,
      closeOnClickModal: true,
      hideFooter: true,
      contentRenderer: () => h(LeaseBillDetailDialog, { billId })
    });
  };

  const handleAction = (action: string, row: LeaseBillListVo) => {
    if (action === "collect") return handleCollect(row);
    if (action === "edit") return handleEdit(row);
    if (action === "split") return handleSplit(row);
    if (action === "free") return handleFree(row);
    if (action === "badDebt") return handleBadDebt(row);
    if (action === "void") return handleVoid(row);
  };

  const handleCollect = (row: LeaseBillListVo) => {
    const collectRef = ref<InstanceType<typeof LeaseBillCollectDialog>>();
    addDialog({
      title: "账单收款",
      width: "620px",
      top: "10%",
      alignCenter: true,
      lockScroll: true,
      closeOnClickModal: false,
      contentRenderer: () => h(LeaseBillCollectDialog, { ref: collectRef, bill: row }),
      beforeSure: async done => {
        const formInstance = collectRef.value;
        if (!formInstance) return;
        const valid = await formInstance.validate();
        if (!valid) return;
        const resp = await collectLeaseBill(formInstance.getFormData());
        if (resp.code === 0 && resp.data !== false) {
          message("收款成功", { type: "success" });
          fetchBillData();
          done();
        } else {
          message(resp.message || "收款失败", { type: "warning" });
        }
      }
    });
  };

  const handleSplit = (row: LeaseBillListVo) => {
    message(`账单拆分：第${row.sortOrder}期`, { type: "info" });
  };

  const handleFree = (row: LeaseBillListVo) => {
    message(`免收：第${row.sortOrder}期`, { type: "info" });
  };

  const handleBadDebt = (row: LeaseBillListVo) => {
    message(`标记坏账：第${row.sortOrder}期`, { type: "info" });
  };

  const handleVoid = (row: LeaseBillListVo) => {
    message(`作废账单：第${row.sortOrder}期`, { type: "warning" });
  };

  const handleEdit = async (row: LeaseBillListVo) => {
    if (row.payStatus === 2) {
      message("账单已支付，不允许编辑", { type: "warning" });
      return;
    }
    const editRef = ref<InstanceType<typeof LeaseBillEditDialog>>();
    let billData = row;
    if (row.id) {
      const res = await getLeaseBillDetail({ billId: row.id });
      if (res.code === 0 && res.data) {
        billData = res.data;
      } else {
        message(res.message || "获取账单详情失败", { type: "warning" });
        return;
      }
    }
    addDialog({
      title: "编辑账单",
      width: "70%",
      top: "6%",
      alignCenter: true,
      lockScroll: true,
      closeOnClickModal: false,
      contentRenderer: () => h(LeaseBillEditDialog, { ref: editRef, bill: billData }),
      beforeSure: async done => {
        const formInstance = editRef.value;
        if (!formInstance) return;
        const valid = await formInstance.validate();
        if (!valid) return;
        const payload = formInstance.getFormData();
        const resp = await updateLeaseBill(payload);
        if (resp.code === 0 && resp.data !== false) {
          message("账单更新成功", { type: "success" });
          fetchBillData();
          done();
        } else {
          message(resp.message || "账单更新失败", { type: "warning" });
        }
      }
    });
  };

  // 获取当前账单数据
  const fetchBillList = async () => {
    if (!props.leaseId) return;

    loading.value = true;
    try {
      const res = await getLeaseBillList({ leaseId: props.leaseId });
      if (res.code === 0) {
        billList.value = res.data || [];
      }
    } finally {
      loading.value = false;
    }
  };

  // 获取历史无效账单数据
  const fetchInvalidBillList = async () => {
    if (!props.leaseId) return;

    invalidLoading.value = true;
    try {
      const res = await getLeaseBillInvalidList({ leaseId: props.leaseId });
      if (res.code === 0) {
        invalidBillList.value = res.data || [];
      }
    } finally {
      invalidLoading.value = false;
    }
  };

  // 刷新所有账单数据
  const fetchBillData = () => {
    fetchBillList();
    fetchInvalidBillList();
  };

  // 暴露刷新方法供父组件调用
  defineExpose({
    refresh: fetchBillData
  });

  // 监听 leaseId 变化
  watch(
    () => props.leaseId,
    newVal => {
      if (newVal) {
        fetchBillData();
      }
    },
    { immediate: false }
  );

  // 组件挂载时获取数据
  onMounted(() => {
    fetchBillData();
  });
</script>

<style scoped lang="scss">
  .tenant-bill-tab {
    min-height: 400px;
  }

  .bill-section {
    margin-bottom: 20px;
  }

  // 区块标题样式
  .section-header-wrapper {
    margin-bottom: 0;

    .section-header-content {
      background: var(--el-fill-color-light);
      border-radius: 8px 8px 0 0;
      border-bottom: 2px solid var(--el-color-primary);
      transition: all 0.3s ease;

      .section-title {
        color: var(--el-text-color-primary);
      }

      .count-badge {
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color);
        border-radius: 6px;
        transition: all 0.3s ease;

        .el-icon {
          color: var(--el-text-color-secondary);
        }

        span {
          color: var(--el-text-color-regular);
        }

        &:hover {
          background: var(--el-fill-color-light);
          border-color: var(--el-color-primary-light-7);
        }
      }
    }
  }

  // 账单表格样式
  .bill-table-wrapper {
    .bill-table {
      :deep(.el-table__header) {
        th {
          background: var(--el-fill-color-light);
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }

      .expanded-content {
        padding: 16px;
        background: var(--el-fill-color-lighter);

        .expanded-header {
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--el-border-color-light);

          .header-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }

        .sub-table {
          :deep(.el-table__header) {
            th {
              background: var(--el-fill-color);
            }
          }
        }
      }

      .fee-amount {
        color: #f56c6c;
        font-weight: 600;
      }

      .amount-text {
        color: var(--el-text-color-primary);
        font-weight: 500;
      }

      .total-amount {
        color: #f56c6c;
        font-weight: 600;
        font-size: 15px;
      }
    }

    // 无效账单表格特殊样式
    .invalid-bill-table {
      :deep(.el-table__row) {
        opacity: 0.8;
      }
    }

    .text-center {
      text-align: center;
      padding: 20px;
      color: var(--el-text-color-secondary);
    }
  }

  // 深色模式优化
  html.dark {
    .section-header-wrapper {
      .section-header-content {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }
    }
  }
</style>
