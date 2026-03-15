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
              <div v-if="row.otherFees && row.otherFees.length === 0" class="text-center">没有其他费用</div>
              <div v-if="row.otherFees && row.otherFees.length > 0" class="expanded-content">
                <div class="expanded-header m-1">
                  <el-space>
                    <span class="header-title">其他费用明细</span>
                    <el-tag type="info" size="small">共 {{ row.otherFees.length }} 项</el-tag>
                  </el-space>
                </div>
                <el-table :data="row.otherFees" border size="small" class="sub-table">
                  <el-table-column type="index" label="序号" width="60" align="center" />
                  <el-table-column prop="name" label="费用名称" align="center" min-width="120" />
                  <el-table-column prop="amount" label="金额" align="center" width="100">
                    <template #default="{ row: fee }">
                      <span class="fee-amount">¥{{ fee.amount }}</span>
                    </template>
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

          <el-table-column prop="rentPeriodStart" label="账期开始" align="center" width="110">
            <template #default="{ row }">{{ row.rentPeriodStart?.substring(0, 10) }}</template>
          </el-table-column>

          <el-table-column prop="rentPeriodEnd" label="账期结束" align="center" width="110">
            <template #default="{ row }">{{ row.rentPeriodEnd?.substring(0, 10) }}</template>
          </el-table-column>

          <el-table-column prop="rentalAmount" label="租金" align="center" width="100">
            <template #default="{ row }">
              <span v-if="row.rentalAmount > 0" class="amount-text">¥{{ row.rentalAmount }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="depositAmount" label="押金" align="center" width="100">
            <template #default="{ row }">
              <span v-if="row.depositAmount !== 0" class="amount-text">¥{{ row.depositAmount }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="otherFeeAmount" label="其他费用" align="center" width="120">
            <template #default="{ row }">
              <el-space v-if="row.otherFeeAmount > 0" :size="4">
                <span class="amount-text">¥{{ row.otherFeeAmount }}</span>
                <el-tag v-if="row.otherFees && row.otherFees.length > 0" type="info" size="small">{{ row.otherFees.length }}项</el-tag>
              </el-space>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="totalAmount" label="应收总额" align="center" width="120">
            <template #default="{ row }">
              <span class="total-amount">¥{{ row.totalAmount }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="payStatus" label="支付状态" align="center" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.payStatus === 0" type="danger">未支付</el-tag>
              <el-tag v-else-if="row.payStatus === 1" type="success">已支付</el-tag>
              <el-tag v-else type="warning">部分支付</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="remark" label="备注" align="center" min-width="250" show-overflow-tooltip />

          <el-table-column label="操作" fixed="right" align="center" width="120">
            <template #default="{ row }">
              <el-dropdown trigger="click" @command="cmd => handleAction(cmd, row)">
                <el-button size="small" link type="primary" @click.stop>操作</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <template v-if="row.payStatus === 0">
                      <el-dropdown-item command="collect">收款</el-dropdown-item>
                      <el-dropdown-item command="split">账单拆分</el-dropdown-item>
                      <el-dropdown-item command="free">免收</el-dropdown-item>
                      <el-dropdown-item command="badDebt">标记坏账</el-dropdown-item>
                      <el-dropdown-item command="void">作废账单</el-dropdown-item>
                    </template>
                    <template v-else-if="row.payStatus === 1">
                      <el-dropdown-item command="void">作废账单</el-dropdown-item>
                    </template>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
              <div v-if="row.otherFees && row.otherFees.length === 0" class="text-center">没有其他费用</div>
              <div v-if="row.otherFees && row.otherFees.length > 0" class="expanded-content">
                <div class="expanded-header m-1">
                  <el-space>
                    <span class="header-title">其他费用明细</span>
                    <el-tag type="info" size="small">共 {{ row.otherFees.length }} 项</el-tag>
                  </el-space>
                </div>
                <el-table :data="row.otherFees" border size="small" class="sub-table">
                  <el-table-column type="index" label="序号" width="60" align="center" />
                  <el-table-column prop="name" label="费用名称" align="center" min-width="120" />
                  <el-table-column prop="amount" label="金额" align="center" width="100">
                    <template #default="{ row: fee }">
                      <span class="fee-amount">¥{{ fee.amount }}</span>
                    </template>
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

          <el-table-column prop="rentPeriodStart" label="账期开始" align="center" width="110">
            <template #default="{ row }">{{ row.rentPeriodStart?.substring(0, 10) }}</template>
          </el-table-column>

          <el-table-column prop="rentPeriodEnd" label="账期结束" align="center" width="110">
            <template #default="{ row }">{{ row.rentPeriodEnd?.substring(0, 10) }}</template>
          </el-table-column>

          <el-table-column prop="rentalAmount" label="租金" align="center" width="100">
            <template #default="{ row }">
              <span v-if="row.rentalAmount > 0" class="amount-text">¥{{ row.rentalAmount }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="depositAmount" label="押金" align="center" width="100">
            <template #default="{ row }">
              <span v-if="row.depositAmount !== 0" class="amount-text">¥{{ row.depositAmount }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="otherFeeAmount" label="其他费用" align="center" width="100">
            <template #default="{ row }">
              <el-space v-if="row.otherFeeAmount > 0" :size="4">
                <span class="amount-text">¥{{ row.otherFeeAmount }}</span>
                <el-tag v-if="row.otherFees && row.otherFees.length > 0" type="info" size="small">{{ row.otherFees.length }}项</el-tag>
              </el-space>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="totalAmount" label="应收总额" align="center" width="120">
            <template #default="{ row }">
              <span class="total-amount">¥{{ row.totalAmount }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="payStatus" label="支付状态" align="center" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.payStatus === 0" type="danger">未支付</el-tag>
              <el-tag v-else-if="row.payStatus === 1" type="success">已支付</el-tag>
              <el-tag v-else type="warning">部分支付</el-tag>
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
  import { getLeaseBillInvalidList, getLeaseBillList } from "@/api/contract/tenant";
  import { addDialog } from "@/components/ReDialog";
  import { message } from "@/utils/message";
  import LeaseBillDetailDialog from "@/views/contract/tenant/view/LeaseBillDetailDialog.vue";

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
      contentRenderer: () => h(LeaseBillDetailDialog, { billId })
    });
  };

  const handleAction = (action: string, row: LeaseBillListVo) => {
    if (action === "collect") return handleCollect(row);
    if (action === "split") return handleSplit(row);
    if (action === "free") return handleFree(row);
    if (action === "badDebt") return handleBadDebt(row);
    if (action === "void") return handleVoid(row);
  };

  const handleCollect = (row: LeaseBillListVo) => {
    message(`收款：第${row.sortOrder}期`, { type: "info" });
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
