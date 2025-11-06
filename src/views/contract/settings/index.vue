<template>
  <div class="main">
    <el-row class="bg-bg_color w-full px-4 pb-0 pt-[12px] overflow-auto">
      <el-col :span="12">
        <div class="grid-content ep-bg-purple w-full" style="align-items: flex-start">
          <el-form-item>
            <el-radio-group v-model="queryForm.roomStatus" @change="onSearch">
              <el-radio-button
                v-for="item in tenantStatusTotal"
                :key="item.roomStatus"
                :value="item.roomStatus"
                :class="['room-status-button', `status-${item.roomStatus || 'all'}`]"
                :style="{
                  // '--status-color': item.roomStatusColor
                  // '--status-bg-color': item.roomStatusColor + '5' // 添加透明度
                }"
              >
                <span class="status-content">
                  <span class="status-dot" :style="{ backgroundColor: item.roomStatusColor }" />
                  {{ item.roomStatusName }}（{{ item.total }}）
                </span>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>
      </el-col>
      <el-col :span="8" class="text-left">
        <el-input v-model="queryForm.keywords" placeholder="项目名称/房间号/租客电话/业主姓名/业主电话/标签" clearable class="w-full" @keyup.enter="onSearch" @clear="onSearch">
          <template #suffix>
            <IconifyIconOffline :icon="Search" />
          </template>
        </el-input>
      </el-col>
      <el-col :span="4" class="text-right">
        <el-space>
          <el-button color="#626aef" :dark="true" @click="openDialog()">添加租客</el-button>
        </el-space>
      </el-col>
    </el-row>
    <!--项目列表-->
    <el-row class="bg-bg_color w-full px-4 pt-0 overflow-auto">
      <pure-table
        border
        row-key="id"
        alignWhole="center"
        showOverflowTooltip
        :size="tableSize as any"
        :loading="loading"
        :loading-config="{ background: 'transparent' }"
        adaptive
        :adaptiveConfig="{ offsetBottom: 108 }"
        :data="tenantTableList"
        :columns="columns"
        :pagination="pagination"
        :header-cell-style="{
          background: 'var(--el-fill-color-light)',
          color: 'var(--el-text-color-primary)'
        }"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
      />
    </el-row>
  </div>
</template>
<script setup lang="ts">
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";

  import Delete from "~icons/ep/delete";
  import EditPen from "~icons/ep/edit-pen";
  import Search from "~icons/ri/search-eye-line";
  import { useContractTenant } from "@/views/contract/tenant/utils/hook";

  defineOptions({
    name: "ContractTenant"
  });

  const { queryForm, openDialog, tenantStatusTotal, onSearch, tableSize, columns, loading, pagination, tenantTableList, handleSizeChange, handleCurrentChange } =
    useContractTenant();
</script>

<style lang="scss" scoped>
  :deep(.el-dropdown-menu__item i) {
    margin: 0;
  }

  .search-form {
    :deep(.el-form-item) {
      margin-bottom: 12px;
    }
  }

  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 6px;
    border-radius: 50%;
  }

  /* 房间状态按钮样式 */
  .room-status-button {
    position: relative;

    :deep(.el-radio-button__inner) {
      position: relative;
      z-index: 1;
      color: var(--status-color, #606266);
      background-color: var(--status-bg-color, transparent);
      transition: all 0.3s ease;

      &:hover {
        //border-color: var(--status-color);
        background-color: var(--status-bg-color);
      }
    }

    /* 修复选中状态的左侧边框显示问题 */
    :deep(.el-radio-button__original:checked + .el-radio-button__inner) {
      border-left-color: var(--status-color) !important;
      box-shadow: none;
    }

    /* 确保第一个按钮的左边框显示 */
    &:first-child :deep(.el-radio-button__original:checked + .el-radio-button__inner) {
      border-left-color: var(--status-color) !important;
    }

    /* 确保相邻按钮之间的边框处理 */
    &:not(:first-child) :deep(.el-radio-button__original:checked + .el-radio-button__inner) {
      margin-left: -1px;
      border-left-color: var(--status-color) !important;
    }

    /* 当前一个按钮选中时，确保当前按钮的左边框正确显示 */
    &:not(:first-child) :deep(.el-radio-button__inner) {
      margin-left: -1px;
    }
  }

  .status-content {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .status-dot {
    display: inline-block;
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  /* 特定状态的自定义样式（如果需要） */
  .status-all {
    /* 全部状态的特殊样式 */
  }

  .status-0 {
    /* 空置状态的特殊样式 */
  }

  .status-1 {
    /* 已租状态的特殊样式 */
  }

  .status-2 {
    /* 锁房状态的特殊样式 */
  }

  .status-3 {
    /* 配置中状态的特殊样式 */
  }

  .status-4 {
    /* 下架状态的特殊样式 */
  }
</style>
