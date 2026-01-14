<script setup lang="ts">
  import { nextTick, onMounted, ref } from "vue";
  import { delay, subBefore, useResizeObserver } from "@pureadmin/utils";
  import Search from "~icons/ri/search-eye-line";
  import { useScatterRoom } from "@/views/house/scatter/scatterRoom/utils/hook";
  import RoomStatusGrid from "../../components/RoomGrid/RoomStatusGrid.vue";
  import { useEntireEdit } from "@/views/house/components/EntireCreate/hook";
  import { useShareEdit } from "@/views/house/components/ShareCreate/hook";

  defineOptions({
    name: "ScatterRoom"
  });

  const { openEntireEditDialog } = useEntireEdit();
  const { openShareEditDialog } = useShareEdit();
  const {
    queryForm,
    onBack,
    loading,
    columns,
    roomTableList,
    pagination,
    onSearch,
    resetForm,
    handleSizeChange,
    handleCurrentChange,
    focusOptions,
    roomStatusTotal,
    displayModeToList,
    displayModeText,
    handleDisplayClick
  } = useScatterRoom();

  const formRef = ref();
  const tableRef = ref();
  const contentRef = ref();
  const treeHeight = ref();
  const tableSize = ref("default");

  // 初始化加载
  onMounted(() => {
    useResizeObserver(contentRef, async () => {
      await nextTick();
      delay(60).then(() => {
        treeHeight.value = Number.parseFloat(subBefore(tableRef.value.getTableDoms().tableWrapper.style.height, "px"));
      });
    });
  });

  const statusRadio = ref("all");
</script>

<template>
  <div class="main">
    <el-row class="bg-bg_color w-full p-4 overflow-auto">
      <el-col :span="12">
        <el-page-header @back="onBack">
          <template #content>
            <div class="flex items-center">
              <span class="text-large font-600 mr-3">整/合租列表</span>
              <el-tag>{{ displayModeText }}</el-tag>
            </div>
          </template>
        </el-page-header>
      </el-col>
      <el-col :span="12" class="text-right">
        <el-button plain @click="handleDisplayClick">
          <IconifyIconOnline icon="flat-color-icons:department" class="mr-1" />
          {{ displayModeToList ? "切换房态模式" : "切换列表模式" }}
        </el-button>
        <el-dropdown class="pl-2">
          <el-button type="primary" color="#626aef" :dark="true">
            添加房源 &nbsp;
            <IconifyIconOnline icon="ep:arrow-down-bold" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="openEntireEditDialog()">整租房源</el-dropdown-item>
              <el-dropdown-item @click="openShareEditDialog()">合租房源</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-col>
    </el-row>
    <el-row class="search-form bg-bg_color w-full px-4 overflow-auto">
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
        <el-input v-model="queryForm.keywords" placeholder="项目名称/房间号/租客电话/业主姓名/业主电话/标签" clearable @keyup.enter="onSearch" @clear="onSearch">
          <template #suffix>
            <IconifyIconOffline :icon="Search" />
          </template>
        </el-input>
      </el-col>
    </el-row>
    <!--项目列表-->
    <el-row v-if="displayModeToList" class="bg-bg_color w-full p-4 pt-[12px] overflow-auto">
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
        :data="roomTableList"
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
    <el-row v-if="!displayModeToList">
      <el-col :span="24" class="text-right">
        <RoomStatusGrid v-model="queryForm" />
      </el-col>
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
    margin-right: 6px;
    border-radius: 50%;
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
