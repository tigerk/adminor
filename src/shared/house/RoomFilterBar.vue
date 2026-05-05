<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import type { PropType } from "vue";
  import Search from "~icons/ri/search-line";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import type { RoomTotalItemVo } from "@/types";

  type RentalTypeFilterItem = {
    label: string;
    value?: number;
  };

  type RoomStatusFilterItem = RoomTotalItemVo & {
    filterType?: number;
    roomStatus?: number;
  };

  const props = defineProps({
    modelValue: {
      type: String,
      default: ""
    },
    rentalTypeItems: {
      type: Array as PropType<RentalTypeFilterItem[]>,
      default: () => []
    },
    statusItems: {
      type: Array as PropType<RoomStatusFilterItem[]>,
      default: () => []
    },
    isRentalTypeActive: {
      type: Function as PropType<(value?: number) => boolean>,
      default: () => false
    },
    isStatusActive: {
      type: Function as PropType<(item: RoomStatusFilterItem) => boolean>,
      default: () => false
    }
  });

  const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "search"): void;
    (e: "reset-keyword"): void;
    (e: "rental-type-click", value?: number): void;
    (e: "status-click", item: RoomStatusFilterItem): void;
  }>();

  const popoverVisible = ref(false);
  const draftKeyword = ref("");

  const keywordText = computed(() => props.modelValue.trim());
  const showRentalType = computed(() => props.rentalTypeItems.length > 0);

  watch(
    () => props.modelValue,
    value => {
      if (!popoverVisible.value) {
        draftKeyword.value = value || "";
      }
    },
    { immediate: true }
  );

  watch(popoverVisible, visible => {
    if (visible) {
      draftKeyword.value = props.modelValue || "";
    }
  });

  function statusKey(item: RoomStatusFilterItem) {
    if (item.filterType === undefined || item.filterType === null) {
      return "all";
    }
    return `${item.filterType}-${item.roomStatus ?? "none"}`;
  }

  function submitSearch() {
    emit("update:modelValue", draftKeyword.value.trim());
    emit("search");
    popoverVisible.value = false;
  }

  function resetKeyword() {
    draftKeyword.value = "";
    emit("update:modelValue", "");
    emit("reset-keyword");
    popoverVisible.value = false;
  }

  function clearKeyword() {
    emit("update:modelValue", "");
    emit("reset-keyword");
  }
</script>

<template>
  <div class="room-filter-bar">
    <div class="room-filter-bar__main">
      <el-button-group v-if="showRentalType" class="room-filter-bar__segment">
        <el-button
          v-for="item in rentalTypeItems"
          :key="item.value ?? 'all'"
          class="room-filter-btn room-filter-btn--type"
          :class="{ 'is-active': isRentalTypeActive(item.value) }"
          @click="emit('rental-type-click', item.value)"
        >
          {{ item.label }}
        </el-button>
      </el-button-group>

      <el-button-group class="room-filter-bar__status">
        <el-button
          v-for="item in statusItems"
          :key="statusKey(item)"
          class="room-filter-btn room-filter-btn--status"
          :class="{ 'is-active': isStatusActive(item) }"
          @click="emit('status-click', item)"
        >
          <span class="room-filter-btn__content">
            <span v-if="item.roomStatusColor" class="room-filter-btn__dot" :style="{ backgroundColor: item.roomStatusColor }" />
            {{ item.roomStatusName }}（{{ item.total }}）
          </span>
        </el-button>
      </el-button-group>
    </div>

    <div class="room-filter-bar__actions">
      <el-tag v-if="keywordText" class="room-filter-bar__keyword" closable @close="clearKeyword">关键词：{{ keywordText }}</el-tag>
      <el-popover v-model:visible="popoverVisible" trigger="click" placement="bottom-end" :width="360" popper-class="room-search-popover">
        <template #reference>
          <el-button :type="keywordText ? 'primary' : 'default'" plain :icon="useRenderIcon(Search)">搜索</el-button>
        </template>

        <div class="room-search-popover__content">
          <div class="room-search-popover__title">搜索房间</div>
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="关键词">
              <el-input v-model="draftKeyword" clearable placeholder="项目/房号/租客/业主/标签" @keyup.enter="submitSearch" />
            </el-form-item>
          </el-form>
          <div class="room-search-popover__footer">
            <el-button @click="resetKeyword">重置</el-button>
            <el-button type="primary" @click="submitSearch">查询</el-button>
          </div>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .room-filter-bar {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 16px 12px;
    overflow-x: auto;
    background: var(--el-bg-color);
  }

  .room-filter-bar__main {
    display: flex;
    flex: 1;
    gap: 12px;
    align-items: center;
    min-width: 0;
  }

  .room-filter-bar__segment,
  .room-filter-bar__status {
    display: inline-flex;
    flex: none;
    align-items: stretch;
  }

  .room-filter-bar__status {
    min-width: 0;
  }

  .room-filter-bar__actions {
    display: inline-flex;
    flex: none;
    gap: 10px;
    align-items: center;
  }

  .room-filter-bar__keyword {
    max-width: 260px;

    :deep(.el-tag__content) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .room-filter-btn {
    height: 40px;
    margin: 0 !important;
    padding: 0 16px;
    font-size: var(--el-font-size-base);
    font-weight: 500;
    color: var(--el-text-color-regular);
    background: var(--el-bg-color);
    border-color: var(--el-border-color) !important;
    transition: color 0.2s, background-color 0.2s, border-color 0.2s;

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-fill-color-light);
      border-color: var(--el-color-primary-light-5) !important;
    }

    &.is-active {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-5) !important;
    }
  }

  .room-filter-btn--type.is-active {
    font-weight: 700;
  }

  .room-filter-btn__content {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    white-space: nowrap;
  }

  .room-filter-btn__dot {
    display: inline-block;
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .room-search-popover__content {
    width: 100%;
  }

  .room-search-popover__title {
    margin-bottom: 12px;
    font-size: var(--el-font-size-base);
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .room-search-popover__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  :global(.room-search-popover) {
    padding: 16px !important;
  }

  :global(.room-search-popover .el-form-item) {
    margin-bottom: 14px;
  }

  @media (max-width: 1200px) {
    .room-filter-bar {
      flex-wrap: wrap;
    }

    .room-filter-bar__main {
      flex-wrap: wrap;
      width: 100%;
    }

    .room-filter-bar__actions {
      justify-content: flex-end;
      width: 100%;
    }
  }
</style>
