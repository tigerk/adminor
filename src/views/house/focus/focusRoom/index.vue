<script setup lang="ts">
  import { ref, nextTick, onMounted } from "vue";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import { delay, subBefore, useResizeObserver } from "@pureadmin/utils";

  import Delete from "~icons/ep/delete";
  import EditPen from "~icons/ep/edit-pen";
  import Search from "~icons/ri/search-eye-line";
  import { useFocusEdit } from "@/views/house/focus/components/utils/hook";
  import { userFocusRoom } from "@/views/house/focus/focusRoom/utils/hook";

  defineOptions({
    name: "FocusRoom"
  });

  const { openFocusEditDialog } = useFocusEdit();
  const {
    queryForm,
    onBack,
    isShow,
    curRow,
    loading,
    columns,
    rowStyle,
    dataList,
    treeData,
    isLinkage,
    pagination,
    treeSearchValue,
    onSearch,
    resetForm,
    handleDelete,
    filterMethod,
    transformI18n,
    handleSizeChange,
    handleCurrentChange,
    houseOptions,
    roomStatusTotal
  } = userFocusRoom();

  const formRef = ref();
  const tableRef = ref();
  const contentRef = ref();
  const treeHeight = ref();
  const tableSize = ref("default");
  const displayModeToList = ref(true);

  onMounted(() => {
    useResizeObserver(contentRef, async () => {
      await nextTick();
      delay(60).then(() => {
        treeHeight.value = parseFloat(subBefore(tableRef.value.getTableDoms().tableWrapper.style.height, "px"));
      });
    });
  });

  function handleDisplayClick() {
    displayModeToList.value = !displayModeToList.value;
  }

  const statusRadio = ref("all");
</script>

<template>
  <div class="main">
    <el-row class="bg-bg_color w-full p-4 pt-[12px] overflow-auto">
      <el-col :span="8">
        <el-page-header @back="onBack">
          <template #content>
            <div class="flex items-center">
              <span class="text-large font-600 mr-3">集中式房间列表</span>
              <el-tag>列表模式</el-tag>
            </div>
          </template>
        </el-page-header>
      </el-col>
      <el-col :span="16" class="text-right">
        <el-space>
          <el-select v-model="queryForm.houseId" placeholder="项目名称" clearable class="w-[180px]!" @change="onSearch">
            <el-option v-for="item in houseOptions" :key="item.id" :label="item.houseName" :value="item.id" />
          </el-select>
          <el-button type="primary" :icon="useRenderIcon(EditPen)" :loading="loading" @click="onSearch" />
          <el-button :icon="useRenderIcon(Delete)" @click="resetForm(formRef)" />
          <el-input placeholder="项目名称/房间号/租客电话/业主姓名/业主电话/标签" clearable style="width: 400px">
            <template #suffix>
              <IconifyIconOffline :icon="Search" />
            </template>
          </el-input>
        </el-space>
      </el-col>
    </el-row>
    <el-row class="search-form bg-bg_color w-full px-4 pt-[12px] overflow-auto">
      <el-col :span="18">
        <div class="grid-content ep-bg-purple" style="align-items: flex-start">
          <el-space>
            <el-form-item>
              <el-radio-group v-model="queryForm.roomStatus" @change="onSearch">
                <el-radio-button
                  v-for="item in roomStatusTotal"
                  :key="item.roomStatus"
                  :value="item.roomStatus"
                  :class="['room-status-button', `status-${item.roomStatus || 'all'}`]"
                  :style="{
                    '--status-color': item.roomStatusColor,
                    '--status-bg-color': item.roomStatusColor + '20' // 添加透明度
                  }"
                >
                  <span class="status-content">
                    <span class="status-dot" :style="{ backgroundColor: item.roomStatusColor }" />
                    {{ item.roomStatusName }}（{{ item.total }}）
                  </span>
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-space>
        </div>
      </el-col>
      <el-col :span="6" class="text-right">
        <el-button plain @click="handleDisplayClick">
          <IconifyIconOnline icon="flat-color-icons:department" class="mr-1" />
          {{ displayModeToList ? "切换房态模式" : "切换列表模式" }}
        </el-button>
        <el-button color="#626aef" :dark="true" @click="openFocusEditDialog()">添加新项目</el-button>
      </el-col>
    </el-row>
    <el-row class="bg-bg_color w-full p-4 pt-[12px] overflow-auto">
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
        :data="dataList"
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
    border-radius: 50%;
    margin-right: 6px;
  }

  /* 房间状态按钮样式 */
  .room-status-button {
    position: relative;

    :deep(.el-radio-button__inner) {
      color: var(--status-color, #606266);
      background-color: var(--status-bg-color, transparent);
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;

      &:hover {
        //border-color: var(--status-color);
        background-color: var(--status-bg-color);
      }
    }

    /* 选中状态 */
    :deep(.el-radio-button__original:checked + .el-radio-button__inner) {
      background-color: var(--status-color) !important;
      border-color: var(--status-color) !important;
      color: #fff !important;
      z-index: 2;
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
    align-items: center;
    gap: 6px;
  }

  .status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
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
