<template>
  <div class="bill-table-wrapper">
    <el-table v-if="billList && billList.length > 0" :data="billList" border stripe class="bill-table" :expand-row-keys="expandedRows" row-key="id">
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

      <el-table-column prop="billType" label="账单类型" align="center" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.billType === 1" type="success">租金</el-tag>
          <el-tag v-else-if="row.billType === 2" type="warning">押金</el-tag>
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
          <span v-if="row.depositAmount > 0" class="amount-text">¥{{ row.depositAmount }}</span>
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

    <el-empty v-else :description="emptyText" :image-size="emptyImageSize">
      <slot name="empty" />
    </el-empty>
  </div>
</template>

<script setup lang="ts">
  import { TenantBillListProps } from "@/types";

  interface BillTableProps {
    billList?: TenantBillListProps[];
    expandedRows?: string[];
    emptyText?: string;
    emptyImageSize?: number;
  }

  const props = withDefaults(defineProps<BillTableProps>(), {
    billList: () => [],
    expandedRows: () => [],
    emptyText: "暂无账单信息",
    emptyImageSize: 180
  });

  // 使用示例:
  // <BillTable
  //   :bill-list="localFormInline.tenantBillList"
  //   :expanded-rows="expandedBillRows"
  //   empty-text="暂无当前账单"
  // >
  //   <template #empty>
  //     <el-button type="primary" size="default">生成账单</el-button>
  //   </template>
  // </BillTable>
</script>

<style scoped lang="scss">
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

    .text-center {
      text-align: center;
      padding: 20px;
      color: var(--el-text-color-secondary);
    }
  }
</style>
