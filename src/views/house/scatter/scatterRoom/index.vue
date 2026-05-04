<script setup lang="ts">
  import { nextTick, onMounted, ref, watch } from "vue";
  import { useRoute } from "vue-router";
  import { delay, subBefore, useResizeObserver } from "@pureadmin/utils";
  import Search from "~icons/ri/search-eye-line";
  import { useScatterRoom } from "@/views/house/scatter/scatterRoom/utils/hook";
  import RoomStatusGrid from "../../components/RoomGrid/RoomStatusGrid.vue";
  import { useEntireEdit } from "@/views/house/components/EntireCreate/hook";
  import { useShareEdit } from "@/views/house/components/ShareCreate/hook";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import More from "~icons/ep/more-filled";

  defineOptions({
    name: "ScatterRoom"
  });

  const route = useRoute();

  const { openEntireEditDialog } = useEntireEdit();
  const { openShareEditDialog } = useShareEdit();
  const {
    queryForm,
    onBack,
    loading,
    roomTableList,
    pagination,
    onSearch,
    resetForm,
    handleSizeChange,
    handleCurrentChange,
    focusOptions,
    rentalTypeTabs,
    roomStatusTotal,
    activeStatusKey,
    handleRentalTypeClick,
    isRentalTypeActive,
    handleStatusClick,
    isStatusActive,
    displayModeToList,
    displayModeText,
    columns,
    handleDisplayClick,
    handleRoomAction,
    handleRoomDropdownCommand,
    isRoomAvailable
  } = useScatterRoom();

  const formRef = ref();
  const tableRef = ref();
  const contentRef = ref();
  const treeHeight = ref();
  const tableSize = ref("default");

  function handleTableDropdownCommand(row, command) {
    handleRoomDropdownCommand(row, command);
  }

  function applyRouteQuery() {
    queryForm.occupancyStatus = typeof route.query.occupancyStatus === "string" && route.query.occupancyStatus !== "" ? Number(route.query.occupancyStatus) : undefined;
    queryForm.vacancyDaysMin = typeof route.query.vacancyDaysMin === "string" && route.query.vacancyDaysMin !== "" ? Number(route.query.vacancyDaysMin) : undefined;
    queryForm.vacancyDaysMax = typeof route.query.vacancyDaysMax === "string" && route.query.vacancyDaysMax !== "" ? Number(route.query.vacancyDaysMax) : undefined;
    if (queryForm.occupancyStatus === 0) {
      queryForm.locked = undefined;
      queryForm.closed = undefined;
    }
  }

  onMounted(() => {
    applyRouteQuery();
    if (route.query.occupancyStatus || route.query.vacancyDaysMin || route.query.vacancyDaysMax) {
      onSearch();
    }
    useResizeObserver(contentRef, async () => {
      await nextTick();
      delay(60).then(() => {
        treeHeight.value = Number.parseFloat(subBefore(tableRef.value.getTableDoms().tableWrapper.style.height, "px"));
      });
    });
  });

  watch(
    () => route.query,
    () => {
      applyRouteQuery();
      onSearch();
    }
  );
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
              <el-dropdown-item @click="openEntireEditDialog('新增', undefined, onSearch)">整租房源</el-dropdown-item>
              <el-dropdown-item @click="openShareEditDialog('新增', undefined, onSearch)">合租房源</el-dropdown-item>
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
              <el-button-group class="rental-type-bar">
                <el-button
                  v-for="item in rentalTypeTabs"
                  :key="item.value ?? 'all'"
                  class="rental-type-btn"
                  type="default"
                  :class="{ 'is-active': isRentalTypeActive(item.value) }"
                  @click="handleRentalTypeClick(item.value)"
                >
                  {{ item.label }}
                </el-button>
              </el-button-group>
            </el-form-item>
            <el-form-item>
              <!--
                状态栏改为手动点击分发，不再用 v-model 绑定 queryForm.roomStatus。
                原因：锁房(BY_LOCKED) 和 已关闭(BY_CLOSED) 不是 roomStatus 的枚举值，
                而是独立的 locked / closed 字段，无法通过单一 v-model 表达。
                后端 filterType 决定用哪个字段查询：
                  0 = BY_STATUS  → queryForm.roomStatus
                  1 = BY_LOCKED  → queryForm.locked = true
                  2 = BY_CLOSED  → queryForm.closed = true
              -->
              <el-button-group class="status-bar">
                <el-button
                  v-for="item in roomStatusTotal"
                  :key="item.filterType !== undefined ? `${item.filterType}-${item.roomStatus}` : 'all'"
                  class="status-btn"
                  type="default"
                  :class="{ 'is-active': isStatusActive(item) }"
                  @click="handleStatusClick(item)"
                >
                  <span class="status-content">
                    <span v-if="item.roomStatusColor" class="status-dot" :style="{ backgroundColor: item.roomStatusColor }" />
                    {{ item.roomStatusName }}（{{ item.total }}）
                  </span>
                </el-button>
              </el-button-group>
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

    <!-- 列表模式 -->
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
        :adaptiveConfig="{ offsetBottom: 92 }"
        :data="roomTableList"
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
          <div class="room-table-actions">
            <el-button link type="primary" @click="handleRoomAction(row, 'view')">查看</el-button>
            <el-button link type="primary" :disabled="!isRoomAvailable(row)" @click="handleRoomAction(row, 'booking')">预约</el-button>
            <el-button link type="primary" :disabled="!isRoomAvailable(row)" @click="handleRoomAction(row, 'tenant')">签约</el-button>
            <el-dropdown :hide-on-click="false" popper-class="action-dropdown" trigger="click" @command="command => handleTableDropdownCommand(row, command)">
              <el-button class="ml-3! mt-[2px]!" link type="info" size="default" :icon="useRenderIcon(More)" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="lock" :disabled="row.locked">锁房</el-dropdown-item>
                  <el-dropdown-item command="unlock" :disabled="!row.locked">解锁</el-dropdown-item>
                  <el-dropdown-item command="close" :disabled="row.closed">关闭</el-dropdown-item>
                  <el-dropdown-item command="open" :disabled="!row.closed">开启</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <span class="text-danger">删除房间</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </pure-table>
    </el-row>

    <!-- 房态模式 -->
    <el-row v-if="!displayModeToList">
      <el-col :span="24">
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

  /* ========== 状态栏 ========== */
	  .status-bar {
	    display: inline-flex;
	    flex-wrap: nowrap;
	    align-items: stretch;
	  }

	  .rental-type-bar {
	    display: inline-flex;
	    flex-wrap: nowrap;
	    align-items: stretch;
	  }

	  :deep(.rental-type-btn) {
	    margin: 0 !important;
	    padding: 8px 14px;
	    font-size: 14px;
	    color: var(--el-text-color-regular);
	    border-color: var(--el-border-color) !important;
	    background: var(--el-bg-color);
	    transition: all 0.2s;

	    &:hover {
	      color: var(--el-color-primary);
	      border-color: var(--el-color-primary-light-5);
	      background: var(--el-fill-color-light);
	    }

	    &.is-active {
	      color: var(--el-color-primary);
	      background: var(--el-color-primary-light-9);
	      border-color: var(--el-color-primary);
	    }
	  }

  :deep(.status-btn) {
    margin: 0 !important;
    padding: 8px 16px;
    font-size: 14px;
    color: var(--el-text-color-regular);
    border-color: var(--el-border-color) !important;
    transition: all 0.2s;

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }

    &.is-active {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
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

  .room-table-actions {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    width: 100%;

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }
</style>
