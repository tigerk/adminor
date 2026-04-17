<script setup lang="ts">
  import More from "~icons/ep/more-filled";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import { PureTableBar } from "@/components/RePureTableBar";
  import OwnerSummaryCards from "@/shared/owner/OwnerSummaryCards.vue";
  import "@/shared/owner/financePage.scss";
  import useOwnerPayableBill from "@/views/finance/owner-payable-bill/utils/hook";

  defineOptions({ name: "OwnerPayableBillEntry" });

  const {
    loading,
    showPageIntro,
    queryForm,
    pagination,
    tableData,
    summaryCards,
    columns,
    settlementStatusOptions,
    fetchData,
    resetQuery,
    handleSizeChange,
    handleCurrentChange,
    handleRowClick,
    openOwnerPayableBillDetailDialog,
    openPayableBillFormDialog,
    openPayableBillCancelDialog,
    openPayableBillPaymentDialog,
    closePageIntro,
    settlementStatusText,
    settlementStatusBadgeType,
    billStatusText,
    billStatusBadgeType
  } = useOwnerPayableBill();
</script>

<template>
  <div class="pf-page">
    <div v-if="showPageIntro" class="page-intro-wrap">
      <el-alert class="page-intro-alert" type="info" closable @close="closePageIntro">
        <div class="page-intro-alert__content">
          <span class="page-intro-alert__title">包租应付单</span>
          <span class="page-intro-alert__desc">用于管理包租模式下按付款设置生成的业主应付账单与付款执行</span>
        </div>
      </el-alert>
    </div>

    <div class="summary-block">
      <OwnerSummaryCards :cards="summaryCards" :columns="4" />
    </div>

    <div class="filter-card -mb-2">
      <div class="filter-toolbar">
        <el-form :inline="true" :model="queryForm" class="filter-form">
          <el-form-item label="业主名称">
            <el-input v-model="queryForm.ownerName" placeholder="请输入业主名称" clearable class="filter-input" @keyup.enter="fetchData" />
          </el-form-item>
          <el-form-item label="应付单号">
            <el-input v-model="queryForm.billNo" placeholder="请输入应付单号" clearable class="filter-input" @keyup.enter="fetchData" />
          </el-form-item>
          <el-form-item label="付款状态">
            <el-select v-model="queryForm.paymentStatus" placeholder="请选择付款状态" clearable class="filter-input">
              <el-option v-for="item in settlementStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchData">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" @click="openPayableBillFormDialog()">新增包租应付单</el-button>
      </div>
    </div>

    <PureTableBar title="包租应付单" :columns="columns" @refresh="fetchData">
      <template #default="{ size, dynamicColumns }">
        <pure-table
          row-key="billId"
          adaptive
          :adaptiveConfig="{ offsetBottom: 80 }"
          alignWhole="center"
          table-layout="auto"
          showOverflowTooltip
          :loading="loading"
          :size="size"
          :data="tableData"
          :columns="dynamicColumns"
          :pagination="pagination"
          class="pf-table"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
          @row-click="handleRowClick"
        >
          <template #settlementStatus="{ row }">
            <div class="status-badge" :class="`status-badge--${settlementStatusBadgeType(row.paymentStatus)}`">
              <span class="status-badge__dot" />
              {{ settlementStatusText(row.paymentStatus) }}
            </div>
          </template>
          <template #billStatus="{ row }">
            <div class="status-badge" :class="`status-badge--${billStatusBadgeType(row.billStatus)}`">
              <span class="status-badge__dot" />
              {{ billStatusText(row.billStatus) }}
            </div>
          </template>
          <template #operation="{ row }">
            <el-button link type="primary" @click.stop="openOwnerPayableBillDetailDialog(row.billId)">查看</el-button>
            <el-button v-if="Number(row.billStatus || 1) === 1 && Number(row.unpaidAmount || 0) > 0" link type="primary" @click.stop="openPayableBillPaymentDialog(row)">
              登记付款
            </el-button>
            <el-dropdown :hide-on-click="false" popper-class="action-dropdown" @click.stop>
              <el-button class="ml-3! mt-[2px]!" link type="info" size="default" :icon="useRenderIcon(More)" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    :disabled="!(Number(row.billStatus || 1) === 1 && Number(row.paymentStatus || 0) === 0 && Number(row.paidAmount || 0) <= 0)"
                    @click="openPayableBillFormDialog(row)"
                  >
                    修改账单
                  </el-dropdown-item>
                  <el-dropdown-item
                    :disabled="!(Number(row.billStatus || 1) === 1 && Number(row.paymentStatus || 0) === 0 && Number(row.paidAmount || 0) <= 0)"
                    divided
                    @click="openPayableBillCancelDialog(row)"
                  >
                    <span class="text-danger">作废账单</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>
