<template>
  <div class="main">
    <!-- 搜索栏 -->
    <el-row class="bg-bg_color w-full px-4 pt-[12px]">
      <el-col :span="24">
        <el-form ref="queryFormRef" :inline="true" :model="queryForm" class="search-form">
          <el-form-item>
            <el-input v-model="queryForm.keyword" placeholder="标题/单号" clearable class="!w-[180px]" @keyup.enter="onSearch" @clear="onSearch">
              <template #prefix>
                <IconifyIconOffline :icon="Search" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.bizType" placeholder="业务类型" clearable class="!w-[160px]" @change="onSearch">
              <el-option v-for="item in bizTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="activeTab !== 'todo'">
            <el-select v-model="queryForm.status" placeholder="状态" clearable class="!w-[120px]" @change="onSearch">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button :icon="useRenderIcon(SearchIcon)" type="primary" @click="onSearch">搜索</el-button>
            <el-button :icon="useRenderIcon(Refresh)" @click="resetQueryForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>

    <PureTableBar title="我的审批" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-space>
          <el-radio-group v-model="activeTab" @change="handleTabChange">
            <el-radio-button value="todo" :class="['approval-status-button']">
              <span class="status-content">
                <span class="status-dot" style="background-color: #e6a23c" />
                我的待办（{{ todoCount }}）
              </span>
            </el-radio-button>
            <el-radio-button value="done" :class="['approval-status-button']">
              <span class="status-content">
                <span class="status-dot" style="background-color: #67c23a" />
                我的已办
              </span>
            </el-radio-button>
            <el-radio-button value="apply" :class="['approval-status-button']">
              <span class="status-content">
                <span class="status-dot" style="background-color: #409eff" />
                我发起的
              </span>
            </el-radio-button>
          </el-radio-group>
        </el-space>
      </template>
      <template v-slot="{}">
        <pure-table
          border
          row-key="id"
          alignWhole="center"
          :show-overflow-tooltip="true"
          :loading="loading"
          :loading-config="{ background: 'transparent' }"
          adaptive
          :adaptiveConfig="{ offsetBottom: 82 }"
          :data="dataList"
          :size="tableSize as any"
          :columns="columns"
          :pagination="pagination"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #operation="{ row }">
            <el-button class="reset-margin" link type="primary" :icon="useRenderIcon(View)" @click="handleView(row)">
              {{ activeTab === "todo" ? "审批" : "查看" }}
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<script setup lang="ts">
  import { useApprovalTodo } from "./utils/hook";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";

  import SearchIcon from "~icons/ri/search-line";
  import Search from "~icons/ep/search";
  import Refresh from "~icons/ep/refresh";
  import View from "~icons/ep/view";
  import { PureTableBar } from "@/components/RePureTableBar";

  defineOptions({
    name: "ApprovalTodo"
  });

  const {
    queryForm,
    loading,
    columns,
    dataList,
    pagination,
    activeTab,
    tableSize,
    bizTypeOptions,
    statusOptions,
    todoCount,
    onSearch,
    resetQueryForm,
    handleTabChange,
    handleSizeChange,
    handleCurrentChange,
    handleView
  } = useApprovalTodo();
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
</style>
