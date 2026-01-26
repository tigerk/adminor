<script setup lang="ts">
  import { ref } from "vue";
  import { useApprovalFlow } from "./utils/hook";
  import { PureTableBar } from "@/components/RePureTableBar";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";

  import Delete from "~icons/ep/delete";
  import EditPen from "~icons/ep/edit-pen";
  import Refresh from "~icons/ep/refresh";
  import AddFill from "~icons/ri/add-circle-line";

  defineOptions({
    name: "ApprovalFlowConfig"
  });

  const tableRef = ref();
  const { loading, columns, dataList, onSearch, openDialog, handleDelete, handleToggleStatus } = useApprovalFlow();

  function onFullscreen() {
    tableRef.value.setAdaptive();
  }
</script>

<template>
  <div class="main">
    <PureTableBar title="审批流程配置" :columns="columns" :tableRef="tableRef?.getTableRef()" @refresh="onSearch" @fullscreen="onFullscreen">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(AddFill)" @click="openDialog()">新增流程</el-button>
      </template>
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
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
        >
          <template #operation="{ row }">
            <el-button class="reset-margin" link type="primary" :size="size" :icon="useRenderIcon(EditPen)" @click="openDialog('修改', row)">修改</el-button>
            <el-popconfirm :title="`是否确认删除流程「${row.flowName}」？`" @confirm="handleDelete(row)">
              <template #reference>
                <el-button class="reset-margin" link type="primary" :size="size" :icon="useRenderIcon(Delete)">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style lang="scss" scoped>
  .main {
    padding: 16px;
  }
</style>
