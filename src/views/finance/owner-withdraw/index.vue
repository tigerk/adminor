<script setup lang="ts">
  import { PureTableBar } from "@/components/RePureTableBar";
  import OwnerSummaryCards from "@/shared/owner/OwnerSummaryCards.vue";
  import "@/shared/owner/financePage.scss";
  import useOwnerWithdraw from "@/views/finance/owner-withdraw/utils/hook";

  defineOptions({ name: "OwnerWithdrawEntry" });

  const props = withDefaults(defineProps<{ ownerId?: string | number; contractId?: string | number; embedded?: boolean }>(), {
    embedded: false
  });

  const {
    loading,
    queryForm,
    pagination,
    tableData,
    summaryCards,
    columns,
    createForm,
    approvalStatusOptions,
    withdrawStatusOptions,
    fetchData,
    resetQuery,
    handleSizeChange,
    handleCurrentChange,
    handleRowClick,
    openDetail,
    openCreateDialog,
    operate,
    rowActions,
    approvalStatusText,
    withdrawStatusText,
    approvalStatusBadgeType,
    withdrawStatusBadgeType
  } = useOwnerWithdraw({ ownerId: props.ownerId, contractId: props.contractId, embedded: props.embedded });
</script>

<template>
  <div class="pf-page">
    <div class="summary-block">
      <OwnerSummaryCards :cards="summaryCards" :columns="6" />
    </div>

    <div class="filter-card -mb-2">
      <div class="filter-toolbar">
        <div class="filter-toolbar__main">
          <el-form :inline="true" :model="queryForm" class="filter-form">
            <el-form-item label="业主名称">
              <el-input v-model="queryForm.ownerName" placeholder="请输入业主名称" clearable class="filter-input" @keyup.enter="fetchData" />
            </el-form-item>
            <el-form-item label="提现单号">
              <el-input v-model="queryForm.applyNo" placeholder="请输入提现单号" clearable class="filter-input" @keyup.enter="fetchData" />
            </el-form-item>
            <el-form-item label="审批状态">
              <el-select v-model="queryForm.approvalStatus" placeholder="请选择审批状态" clearable class="filter-input">
                <el-option v-for="item in approvalStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="打款状态">
              <el-select v-model="queryForm.withdrawStatus" placeholder="请选择打款状态" clearable class="filter-input">
                <el-option v-for="item in withdrawStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchData">查询</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="filter-toolbar__actions">
          <el-button type="primary" :disabled="!createForm.ownerId" @click="openCreateDialog">发起提现</el-button>
        </div>
      </div>
    </div>

    <PureTableBar title="业主提现列表" :columns="columns" @refresh="fetchData">
      <template #default="{ size, dynamicColumns }">
        <pure-table
          row-key="applyId"
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
          <template #withdrawStatus="{ row }">
            <div class="status-badge" :class="`status-badge--${withdrawStatusBadgeType(row.withdrawStatus)}`">
              <span class="status-badge__dot" />
              {{ withdrawStatusText(row.withdrawStatus) }}
            </div>
          </template>
          <template #operation="{ row }">
            <el-button link type="primary" @click.stop="openDetail(row.applyId)">详情</el-button>
            <el-button v-for="action in rowActions(row)" :key="action.type" link :type="action.buttonType" @click.stop="operate(row, action.type)">
              {{ action.label }}
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>
