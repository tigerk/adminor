<template>
  <div class="main">
    <!-- 顶部工具栏 -->
    <div class="settings-toolbar bg-bg_color px-4 py-3">
      <div class="toolbar-left">
        <!-- 合同类型 Tab 切换 -->
        <div class="contract-type-tabs">
          <button
            v-for="item in contractTypeOptions"
            :key="item.value"
            class="tab-btn"
            :class="{ 'tab-btn--active': queryForm.contractType === item.value && viewMode === 'template' }"
            @click="handleContractTypeChange(item.value)"
          >
            {{ item.label }}
          </button>
        </div>

        <!-- 分割线 -->
        <div class="toolbar-divider" />

        <!-- 电子签章入口 -->
        <button class="seal-btn" :class="{ 'seal-btn--active': viewMode === 'seal' }" @click="openSeal">
          <el-icon :size="14"><Stamp /></el-icon>
          <span>电子签章</span>
          <span v-if="viewMode === 'seal'" class="seal-btn__dot" />
        </button>
      </div>

      <!-- 右侧操作区 -->
      <transition name="toolbar-fade">
        <div v-show="viewMode === 'template' || viewMode === 'seal'" class="toolbar-right">
          <!-- 状态筛选 -->
          <div v-if="viewMode === 'template'" class="status-filter">
            <button
              v-for="item in statusOptions"
              :key="item.value"
              class="status-btn"
              :class="{ 'status-btn--active': queryForm.status === item.value }"
              @click="handleStatusChange(item.value)"
            >
              {{ item.label }}
            </button>
          </div>

          <!-- 搜索框 -->
          <el-input
            v-if="viewMode === 'template'"
            v-model="queryForm.templateName"
            placeholder="搜索模板名称"
            clearable
            class="toolbar-search"
            @keyup.enter="onContractTemplateSearch"
            @clear="onContractTemplateSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <!-- 添加按钮 -->
          <el-button v-if="viewMode === 'template'" type="primary" class="add-btn" @click="openContractTemplateDialog()">
            <el-icon class="mr-1"><Plus /></el-icon>
            添加模板
          </el-button>

          <!-- 电子签章添加按钮 -->
          <el-button v-else type="primary" class="add-btn" @click="openSealDialog">
            <el-icon class="mr-1"><Plus /></el-icon>
            添加电子签章
          </el-button>
        </div>
      </transition>
    </div>

    <!-- 合同模板表格 -->
    <el-row v-if="viewMode === 'template'" class="bg-bg_color w-full px-4 pt-0 overflow-auto">
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
          <el-popconfirm title="是否确认删除这条数据" @confirm="handleDeleteTemplate(row)">
            <template #reference>
              <el-button class="reset-margin" link type="danger" :icon="useRenderIcon(Delete)">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </pure-table>
    </el-row>

    <!-- 电子签章视图 -->
    <el-row v-else class="bg-bg_color w-full px-4 pt-0 overflow-auto">
      <Seal ref="sealRef" />
    </el-row>

    <!-- 合同预览弹窗 -->
    <el-dialog v-model="previewVisible" top="10px" title="合同预览" width="80%" height="100vh" :destroy-on-close="true" align-center :lock-scroll="true">
      <iframe title="合同预览" :src="pdfUrl" style="width: 100%; height: 89vh; border: none" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { CONTRACT_TYPE_OPTIONS } from "@/constants";
  import useContractSettings from "@/views/contract/settings/utils/hook";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import Delete from "~icons/ep/delete";
  import EditPen from "~icons/ep/edit-pen";
  import Printer from "~icons/ep/printer";
  import { Search, Plus, Stamp } from "@element-plus/icons-vue";
  import { getContractTemplatePdf } from "@/api/contract/template";
  import { message } from "@/utils/message";
  import Seal from "@/views/contract/settings/seal/index.vue";

  defineOptions({ name: "ContractTenant" });

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
    { label: "全部", value: "" },
    { label: "已启用", value: 1 },
    { label: "未启用", value: 0 }
  ];

  const previewVisible = ref(false);
  const pdfUrl = ref("");
  const route = useRoute();
  const router = useRouter();
  const viewMode = ref(route.query.view === "seal" ? "seal" : "template");
  const sealRef = ref<InstanceType<typeof Seal> | null>(null);

  watch(
    () => route.query.view,
    val => {
      viewMode.value = val === "seal" ? "seal" : "template";
    },
    { immediate: true }
  );

  watch(
    () => route.query.contractType,
    val => {
      const nextType = Number(val);
      if (nextType && nextType !== queryForm.contractType) {
        queryForm.contractType = nextType as any;
        if (viewMode.value === "template") onContractTemplateSearch();
      }
    },
    { immediate: true }
  );

  function handleStatusChange(val: any) {
    queryForm.status = val;
    onContractTemplateSearch();
  }

  function handlePreview(row: any) {
    getContractTemplatePdf({ id: row.id })
      .then(resp => {
        const blob = new Blob([resp], { type: "application/pdf" });
        pdfUrl.value = URL.createObjectURL(blob);
        previewVisible.value = true;
      })
      .catch(() => {
        message("预览失败", { type: "error" });
      });
  }

  watch(previewVisible, newVal => {
    if (!newVal && pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = "";
    }
  });

  function openSeal() {
    router.push({ path: route.path, query: { ...route.query, view: "seal" } });
  }

  function openSealDialog() {
    sealRef.value?.openDialog?.();
  }

  function handleContractTypeChange(val: number) {
    if (viewMode.value === "seal") {
      const nextQuery = { ...route.query, contractType: String(val) } as any;
      delete nextQuery.view;
      router.push({ path: route.path, query: nextQuery });
      return;
    }
    queryForm.contractType = val as any;
    router.replace({ path: route.path, query: { ...route.query, contractType: String(val) } });
    onContractTemplateSearch();
  }
</script>

<style lang="scss" scoped>
  /* ===== 工具栏整体 ===== */
  .settings-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--el-border-color-lighter);
    min-height: 56px;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 0;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .toolbar-divider {
    width: 1px;
    height: 22px;
    background: var(--el-border-color);
    margin: 0 14px;
  }

  /* ===== 合同类型 Tab ===== */
  .contract-type-tabs {
    display: flex;
    align-items: center;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
  }

  .tab-btn {
    position: relative;
    padding: 5px 16px;
    font-size: 13px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.18s ease;
    white-space: nowrap;

    &:hover:not(.tab-btn--active) {
      color: var(--el-text-color-primary);
      background: rgba(255, 255, 255, 0.6);
    }

    &--active {
      font-weight: 500;
      color: var(--el-color-primary);
      background: #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }
  }

  /* ===== 电子签章入口按钮 ===== */
  .seal-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 500;
    color: #4f6ef7;
    background: #eef1ff;
    border: 1px solid #d4dcff;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.18s ease;

    &:hover {
      background: #e4e9ff;
      border-color: #b0bcff;
      box-shadow: 0 2px 8px rgba(79, 110, 247, 0.15);
    }

    &--active {
      color: #fff;
      background: #4f6ef7;
      border-color: #4f6ef7;
      box-shadow: 0 3px 10px rgba(79, 110, 247, 0.3);

      &:hover {
        background: #3d5ce0;
        border-color: #3d5ce0;
      }
    }

    &__dot {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f59e0b;
      border: 1.5px solid #fff;
      animation: pulse-dot 1.6s infinite;
    }
  }

  @keyframes pulse-dot {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.3);
      opacity: 0.7;
    }
  }

  /* ===== 面包屑 ===== */
  .breadcrumb-bar {
    padding-top: 0;
  }

  .breadcrumb-link {
    cursor: pointer;
    color: var(--el-color-primary);
    transition: opacity 0.15s;

    &:hover {
      opacity: 0.75;
    }
  }

  /* ===== 状态筛选 ===== */
  .status-filter {
    display: flex;
    align-items: center;
    background: var(--el-fill-color-light);
    border-radius: 6px;
    padding: 2px;
    gap: 1px;
  }

  .status-btn {
    padding: 4px 12px;
    font-size: 12.5px;
    color: var(--el-text-color-secondary);
    background: transparent;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover:not(.status-btn--active) {
      color: var(--el-text-color-primary);
    }

    &--active {
      font-weight: 500;
      color: var(--el-color-primary);
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
  }

  /* ===== 搜索框 ===== */
  .toolbar-search {
    width: 200px;

    :deep(.el-input__wrapper) {
      border-radius: 7px;
    }
  }

  /* ===== 添加按钮 ===== */
  .add-btn {
    border-radius: 7px;
    font-weight: 500;
  }

  /* ===== 过渡动画 ===== */
  .toolbar-fade-enter-active,
  .toolbar-fade-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .toolbar-fade-enter-from,
  .toolbar-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }

  /* ===== 其他 ===== */
  :deep(.el-dropdown-menu__item i) {
    margin: 0;
  }
</style>
/* 电子签章添加按钮（右侧） */ .seal-add-entry { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 8px; border: 1px solid #d4dcff; background:
linear-gradient(135deg, #eef1ff, #dde4ff); color: #4f6ef7; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; } .seal-add-entry:hover { background:
linear-gradient(135deg, #e6ebff, #d2dbff); border-color: #c5d0ff; } .seal-add-entry__title { line-height: 1; }
