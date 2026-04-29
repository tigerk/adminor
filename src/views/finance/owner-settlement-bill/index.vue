<script setup lang="ts">
  import { PureTableBar } from "@/components/RePureTableBar";
  import OwnerSummaryCards from "@/shared/owner/OwnerSummaryCards.vue";
  import "@/shared/owner/financePage.scss";
  import useOwnerSettlementBill from "@/views/finance/owner-settlement-bill/utils/hook";

  defineOptions({ name: "OwnerSettlementBillEntry" });

  const props = withDefaults(defineProps<{ ownerId?: string | number; contractId?: string | number; embedded?: boolean }>(), {
    embedded: false
  });

  const {
    loading,
    showPageIntro,
    queryForm,
    pagination,
    tableData,
    summaryCards,
    columns,
    approvalStatusOptions,
    settlementStatusOptions,
    fetchData,
    resetQuery,
    handleSizeChange,
    handleCurrentChange,
    handleRowClick,
    openOwnerSettlementBillDetailDialog,
    closePageIntro,
    approvalStatusText,
    settlementStatusText,
    approvalStatusBadgeType,
    settlementStatusBadgeType
  } = useOwnerSettlementBill({ ownerId: props.ownerId, contractId: props.contractId, embedded: props.embedded });
</script>

<template>
  <div class="pf-page">
    <div v-if="showPageIntro" class="page-intro-wrap">
      <el-alert class="page-intro-alert" type="info" closable @close="closePageIntro">
        <div class="page-intro-alert__content">
          <span class="page-intro-alert__title">轻托管业主结算单</span>
          <span class="page-intro-alert__desc">用于管理轻托管模式下按账期生成的业主结算账单</span>
        </div>
      </el-alert>
    </div>

    <div class="summary-block">
      <OwnerSummaryCards :cards="summaryCards" :columns="4" />
    </div>

    <div class="filter-card -mb-2">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="业主名称">
          <el-input v-model="queryForm.ownerName" placeholder="请输入业主名称" clearable class="filter-input" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item label="结算单号">
          <el-input v-model="queryForm.billNo" placeholder="请输入结算单号" clearable class="filter-input" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item label="审批状态">
          <el-select v-model="queryForm.approvalStatus" placeholder="请选择审批状态" clearable class="filter-input">
            <el-option v-for="item in approvalStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="结算状态">
          <el-select v-model="queryForm.settlementStatus" placeholder="请选择结算状态" clearable class="filter-input">
            <el-option v-for="item in settlementStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <PureTableBar title="轻托管业主结算单" :columns="columns" @refresh="fetchData">
      <template #default="{ size, dynamicColumns }">
        <pure-table
          row-key="billId"
          adaptive
          :adaptiveConfig="{ offsetBottom: props.embedded ? 12 : 80 }"
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
          <template #approvalStatus="{ row }">
            <div class="status-badge" :class="`status-badge--${approvalStatusBadgeType(row.approvalStatus)}`">
              <span class="status-badge__dot" />
              {{ approvalStatusText(row.approvalStatus) }}
            </div>
          </template>
          <template #settlementStatus="{ row }">
            <div class="status-badge" :class="`status-badge--${settlementStatusBadgeType(row.settlementStatus)}`">
              <span class="status-badge__dot" />
              {{ settlementStatusText(row.settlementStatus) }}
            </div>
          </template>
          <template #operation="{ row }">
            <el-button link type="primary" @click.stop="openOwnerSettlementBillDetailDialog(row.billId)">详情</el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>
