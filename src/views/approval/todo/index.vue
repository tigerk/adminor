<script setup lang="ts">
  import { ref } from "vue";
  import { useApprovalTodo } from "./utils/hook";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";

  import Refresh from "~icons/ep/refresh";
  import View from "~icons/ep/view";

  defineOptions({
    name: "ApprovalTodo"
  });

  const formRef = ref();
  const tableRef = ref();
  const {
    form,
    loading,
    columns,
    dataList,
    pagination,
    activeTab,
    bizTypeOptions,
    statusOptions,
    onSearch,
    resetForm,
    handleTabChange,
    handleSizeChange,
    handleCurrentChange,
    handleView
  } = useApprovalTodo();

  function onFullscreen() {
    tableRef.value.setAdaptive();
  }
</script>

<template>
  <div class="main">
    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="approval-tabs">
      <el-tab-pane name="todo">
        <template #label>
          <span>
            我的待办
            <el-badge :value="pagination.todoCount" :max="99" v-if="pagination.todoCount > 0" />
          </span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="我的已办" name="done" />
      <el-tab-pane label="我发起的" name="apply" />
    </el-tabs>

    <!-- 搜索表单 -->
    <el-form ref="formRef" :inline="true" :model="form" class="search-form bg-bg_color w-full pl-8 pt-[12px] overflow-auto">
      <el-form-item label="业务类型：" prop="bizType">
        <el-select v-model="form.bizType" placeholder="请选择" clearable class="w-[180px]!">
          <el-option v-for="item in bizTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="activeTab !== 'todo'" label="状态：" prop="status">
        <el-select v-model="form.status" placeholder="请选择" clearable class="w-[180px]!">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键字：" prop="keyword">
        <el-input v-model="form.keyword" placeholder="标题/单号" clearable class="w-[200px]!" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="useRenderIcon('ri:search-line')" :loading="loading" @click="onSearch">搜索</el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 列表 -->
    <PureTableBar
      :title="activeTab === 'todo' ? '待办列表' : activeTab === 'done' ? '已办列表' : '我发起的'"
      :columns="columns"
      :tableRef="tableRef?.getTableRef()"
      @refresh="onSearch"
      @fullscreen="onFullscreen"
    >
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          ref="tableRef"
          adaptive
          :adaptiveConfig="{ offsetBottom: 45 }"
          align-whole="center"
          row-key="id"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #operation="{ row }">
            <el-button class="reset-margin" link type="primary" :size="size" :icon="useRenderIcon(View)" @click="handleView(row)">
              {{ activeTab === "todo" ? "审批" : "查看" }}
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style lang="scss" scoped>
  .main {
    padding: 8px;

    .approval-tabs {
      margin-bottom: 16px;
    }

    .search-form {
      :deep(.el-form-item) {
        margin-bottom: 12px;
      }
    }
  }
</style>
