<template>
  <div class="main">
    <!-- 搜索栏 -->
    <el-row class="bg-bg_color w-full px-4 pt-[12px]">
      <el-col :span="24">
        <el-form ref="queryFormRef" :inline="true" :model="queryForm" class="search-form">
          <el-form-item>
            <el-input v-model="queryForm.flowName" placeholder="流程名称" clearable class="!w-[180px]" @keyup.enter="onSearch" @clear="onSearch">
              <template #prefix>
                <IconifyIconOffline :icon="Document" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.bizType" placeholder="业务类型" clearable class="!w-[160px]" @change="onSearch">
              <el-option v-for="item in bizTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.enabled" placeholder="状态" clearable class="!w-[120px]" @change="onSearch">
              <el-option label="启用" :value="true" />
              <el-option label="停用" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button :icon="useRenderIcon(Search)" type="primary" @click="onSearch">搜索</el-button>
            <el-button :icon="useRenderIcon(Refresh)" @click="resetQueryForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>

    <!-- 流程列表 -->
    <PureTableBar title="审批流配置" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Plus)" @click="openDialog()">新增流程</el-button>
      </template>
      <template v-slot="{}">
        <pure-table
          border
          row-key="id"
          alignWhole="center"
          :show-overflow-tooltip="false"
          :loading="loading"
          :loading-config="{ background: 'transparent' }"
          adaptive
          :adaptiveConfig="{ offsetBottom: 46 }"
          :data="dataList"
          :size="tableSize as any"
          :columns="columns"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
        >
          <template #operation="{ row }">
            <el-button class="reset-margin" link type="primary" :icon="useRenderIcon(EditPen)" @click="openDialog('修改', row)">修改</el-button>
            <el-dropdown :hide-on-click="false">
              <el-button class="ml-3! mt-[2px]!" link type="info" size="default" :icon="useRenderIcon(More)" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleConfirmDelete(row)">
                    <el-button link :icon="useRenderIcon(Delete)">删除</el-button>
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

<script setup lang="ts">
  import { useApprovalFlow } from "./utils/hook";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";

  import Search from "~icons/ri/search-line";
  import Refresh from "~icons/ep/refresh";
  import Plus from "~icons/ep/plus";
  import EditPen from "~icons/ep/edit-pen";
  import Delete from "~icons/ep/delete";
  import Document from "~icons/ep/document";
  import More from "~icons/ep/more-filled";
  import { PureTableBar } from "@/components/RePureTableBar";

  defineOptions({
    name: "ApprovalFlowConfig"
  });

  const { queryForm, loading, columns, dataList, tableSize, bizTypeOptions, onSearch, resetQueryForm, openDialog, handleConfirmDelete } = useApprovalFlow();
</script>

<style lang="scss" scoped>
  .search-form {
    :deep(.el-form-item) {
      margin-bottom: 12px;
    }
  }

  :deep(.el-dropdown-menu__item i) {
    margin: 0;
  }

  .node-flow {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }

  .node-arrow {
    color: var(--el-text-color-secondary);
  }
</style>
