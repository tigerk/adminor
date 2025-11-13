<template>
  <div class="main">
    <el-row class="bg-bg_color w-full px-4 pb-0 pt-[12px] overflow-auto">
      <el-col :span="12">
        <div class="grid-content ep-bg-purple w-full" style="align-items: flex-start">
          <el-form-item>
            <el-radio-group v-model="queryForm.contractType" @change="onContractTemplateSearch">
              <el-radio-button v-for="item in contractTypeOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>
      </el-col>
      <el-col :span="12" class="text-right">
        <el-space>
          <el-radio-group v-model="queryForm.status" @change="onContractTemplateSearch">
            <el-radio-button v-for="item in statusOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
          <el-input v-model="queryForm.templateName" placeholder="模板名称" clearable class="w-full" @keyup.enter="onContractTemplateSearch" @clear="onContractTemplateSearch">
            <template #suffix>
              <IconifyIconOffline :icon="Search" />
            </template>
          </el-input>
          <el-button color="#626aef" :dark="true" @click="openContractTemplateDialog()">添加合同模板</el-button>
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
        :loading="loading"
        :loading-config="{ background: 'transparent' }"
        adaptive
        :adaptiveConfig="{ offsetBottom: 108 }"
        :data="contractTemplateList"
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
          <el-button class="reset-margin" link type="primary" :icon="useRenderIcon(Printer)" @click="handlePreview(row)">预览</el-button>
          <el-button class="reset-margin" link type="primary" :icon="useRenderIcon(EditPen)" @click="openContractTemplateDialog('修改', row)">修改</el-button>
          <el-popconfirm :title="`是否确认删除这条数据`" @confirm="handleDeleteTemplate(row)">
            <template #reference>
              <el-button class="reset-margin" link type="primary" :icon="useRenderIcon(Delete)">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </pure-table>
    </el-row>
    <el-dialog v-model="previewVisible" top="10px" title="合同预览" width="80%" height="100vh" :destroy-on-close="true" align-center :lock-scroll="true">
      <iframe title="合同预览" :src="pdfUrl" style="width: 100%; height: 89vh; border: none" />
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
  import Search from "~icons/ri/search-eye-line";
  import { CONTRACT_TYPE_OPTIONS } from "@/constants";
  import useContractSettings from "@/views/contract/settings/utils/hook";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import Delete from "~icons/ep/delete";
  import EditPen from "~icons/ep/edit-pen";
  import Printer from "~icons/ep/printer";
  import { getContractTemplatePdf } from "@/api/contract/template";
  import { ref, watch } from "vue";
  import { message } from "@/utils/message";

  defineOptions({
    name: "ContractTenant"
  });

  const {
    queryForm,
    openContractTemplateDialog,
    onContractTemplateSearch,
    handleDeleteTemplate,
    tableSize,
    columns,
    loading,
    pagination,
    contractTemplateList,
    handleSizeChange,
    handleCurrentChange
  } = useContractSettings();

  const contractTypeOptions = CONTRACT_TYPE_OPTIONS;
  const statusOptions = [
    {
      label: "全部",
      value: ""
    },
    {
      label: "已启用",
      value: 1
    },
    {
      label: "未启用",
      value: 0
    }
  ];

  const previewVisible = ref(false);
  const pdfUrl = ref("");

  function handlePreview(row: any) {
    getContractTemplatePdf({ id: row.id })
      .then(resp => {
        const blob = new Blob([resp], { type: "application/pdf" });
        pdfUrl.value = URL.createObjectURL(blob);
        previewVisible.value = true;
      })
      .catch(error => {
        message("预览失败", { type: "error" });
      });
  }

  // 关闭弹窗时释放 URL
  watch(previewVisible, newVal => {
    if (!newVal && pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = "";
    }
  });
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
</style>
