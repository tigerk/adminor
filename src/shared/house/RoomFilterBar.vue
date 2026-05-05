<script setup lang="ts">
  import { computed, nextTick, ref, watch } from "vue";
  import type { PropType } from "vue";
  import Filter from "~icons/ri/filter-3-line";
  import Search from "~icons/ri/search-line";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import type { CommunityDto, RoomTotalItemVo } from "@/types";

  type RentalTypeFilterItem = {
    label: string;
    value?: number;
  };

  type RoomStatusFilterItem = RoomTotalItemVo & {
    filterType?: number;
    roomStatus?: number;
  };

  type RoomAdvancedFilterValue = {
    rentalType?: number;
    communityId?: string;
    communityName?: string;
    roomNumber?: string;
    vacancyDaysMin?: number;
    vacancyDaysMax?: number;
    priceMin?: number;
    priceMax?: number;
    areaMin?: number;
    areaMax?: number;
    direction?: string;
    hasImage?: boolean;
  };

  type CommunityOption = CommunityDto & {
    communityId?: string;
  };

  const emptyAdvancedValue = (): RoomAdvancedFilterValue => ({
    rentalType: undefined,
    communityId: undefined,
    communityName: undefined,
    roomNumber: undefined,
    vacancyDaysMin: undefined,
    vacancyDaysMax: undefined,
    priceMin: undefined,
    priceMax: undefined,
    areaMin: undefined,
    areaMax: undefined,
    direction: undefined,
    hasImage: undefined
  });

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
    },
    advancedValue: {
      type: Object as PropType<RoomAdvancedFilterValue>,
      default: () => ({
        communityId: undefined,
        rentalType: undefined,
        communityName: undefined,
        roomNumber: undefined,
        vacancyDaysMin: undefined,
        vacancyDaysMax: undefined,
        priceMin: undefined,
        priceMax: undefined,
        areaMin: undefined,
        areaMax: undefined,
        direction: undefined,
        hasImage: undefined
      })
    },
    showAdvancedSearch: {
      type: Boolean,
      default: false
    },
    communityOptions: {
      type: Array as PropType<CommunityOption[]>,
      default: () => []
    },
    communityLoading: {
      type: Boolean,
      default: false
    },
    showSearchActions: {
      type: Boolean,
      default: true
    }
  });

  const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "update:advancedValue", value: RoomAdvancedFilterValue): void;
    (e: "search"): void;
    (e: "reset-keyword"): void;
    (e: "reset-filters"): void;
    (e: "community-search", value: string): void;
    (e: "rental-type-click", value?: number): void;
    (e: "status-click", item: RoomStatusFilterItem): void;
  }>();

  const filterVisible = ref(false);
  const filterPopoverRef = ref();
  const keywordPopoverVisible = ref(false);
  const keywordPopoverRef = ref();
  const draftKeyword = ref("");
  const draftAdvanced = ref<RoomAdvancedFilterValue>(emptyAdvancedValue());

  const directionOptions = ["东", "南", "西", "北", "东南", "东北", "西南", "西北", "南北", "东西"];

  const keywordText = computed(() => props.modelValue.trim());
  const showRentalType = computed(() => props.rentalTypeItems.length > 0 && !props.showAdvancedSearch);
  const draftRentalTypeValue = computed({
    get: () => draftAdvanced.value.rentalType ?? "all",
    set: value => {
      draftAdvanced.value.rentalType = value === "all" ? undefined : Number(value);
    }
  });
  const draftHasImageValue = computed({
    get: () => {
      if (draftAdvanced.value.hasImage === true) return "true";
      if (draftAdvanced.value.hasImage === false) return "false";
      return "all";
    },
    set: value => {
      draftAdvanced.value.hasImage = value === "all" ? undefined : value === "true";
    }
  });
  const hasAdvancedValue = computed(() =>
    Boolean(
      props.advancedValue.rentalType !== undefined ||
        props.advancedValue.communityId ||
        props.advancedValue.roomNumber ||
        props.advancedValue.vacancyDaysMin !== undefined ||
        props.advancedValue.vacancyDaysMax !== undefined ||
        props.advancedValue.priceMin !== undefined ||
        props.advancedValue.priceMax !== undefined ||
        props.advancedValue.areaMin !== undefined ||
        props.advancedValue.areaMax !== undefined ||
        props.advancedValue.direction ||
        props.advancedValue.hasImage !== undefined
    )
  );

  const activeFilterCount = computed(() => {
    let count = 0;
    if (props.advancedValue.rentalType !== undefined) count += 1;
    if (props.advancedValue.communityId) count += 1;
    if (props.advancedValue.roomNumber) count += 1;
    if (props.advancedValue.vacancyDaysMin !== undefined || props.advancedValue.vacancyDaysMax !== undefined) count += 1;
    if (props.advancedValue.priceMin !== undefined || props.advancedValue.priceMax !== undefined) count += 1;
    if (props.advancedValue.areaMin !== undefined || props.advancedValue.areaMax !== undefined) count += 1;
    if (props.advancedValue.direction) count += 1;
    if (props.advancedValue.hasImage !== undefined) count += 1;
    return count;
  });

  const vacancyText = computed(() => formatRange(props.advancedValue.vacancyDaysMin, props.advancedValue.vacancyDaysMax, "天"));
  const priceText = computed(() => formatRange(props.advancedValue.priceMin, props.advancedValue.priceMax, "元"));
  const areaText = computed(() => formatRange(props.advancedValue.areaMin, props.advancedValue.areaMax, "m²"));
  const communityText = computed(() => props.advancedValue.communityName || props.communityOptions.find(item => item.communityId === props.advancedValue.communityId)?.name || props.advancedValue.communityId);
  const rentalTypeText = computed(() => props.rentalTypeItems.find(item => item.value === props.advancedValue.rentalType)?.label || "");

  watch(
    () => props.modelValue,
    value => {
      if (!filterVisible.value && !keywordPopoverVisible.value) {
        draftKeyword.value = value || "";
      }
    },
    { immediate: true }
  );

  watch(
    () => props.advancedValue,
    value => {
      if (!filterVisible.value) {
        draftAdvanced.value = normalizeAdvancedValue(value);
      }
    },
    { deep: true, immediate: true }
  );

  watch(filterVisible, visible => {
    if (visible) {
      draftKeyword.value = props.modelValue || "";
      draftAdvanced.value = normalizeAdvancedValue(props.advancedValue);
      emit("community-search", "");
    }
  });

  watch(keywordPopoverVisible, visible => {
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
    emit("update:advancedValue", normalizeAdvancedValue(draftAdvanced.value));
    emit("search");
    closeFilterPopover();
  }

  function clearDraftFilters() {
    draftKeyword.value = "";
    draftAdvanced.value = emptyAdvancedValue();
  }

  function resetAppliedFilters() {
    draftKeyword.value = "";
    draftAdvanced.value = emptyAdvancedValue();
    emit("update:modelValue", "");
    emit("update:advancedValue", emptyAdvancedValue());
    emit("reset-keyword");
    emit("reset-filters");
    closeFilterPopover();
    closeKeywordPopover();
  }

  function clearKeyword() {
    emit("update:modelValue", "");
    emit("reset-keyword");
  }

  function clearAdvancedField(field: keyof RoomAdvancedFilterValue) {
    const next = normalizeAdvancedValue(props.advancedValue);
    if (field === "rentalType") {
      next.rentalType = undefined;
    } else if (field === "communityId") {
      next.communityId = undefined;
      next.communityName = undefined;
    } else if (field === "vacancyDaysMin" || field === "vacancyDaysMax") {
      next.vacancyDaysMin = undefined;
      next.vacancyDaysMax = undefined;
    } else if (field === "priceMin" || field === "priceMax") {
      next.priceMin = undefined;
      next.priceMax = undefined;
    } else if (field === "areaMin" || field === "areaMax") {
      next.areaMin = undefined;
      next.areaMax = undefined;
    } else {
      (next as Record<string, unknown>)[field] = undefined;
    }
    emit("update:advancedValue", next);
    emit("reset-filters");
  }

  function submitQuickSearch() {
    emit("update:modelValue", draftKeyword.value.trim());
    emit("search");
  }

  function submitKeywordSearch() {
    emit("update:modelValue", draftKeyword.value.trim());
    emit("search");
    closeKeywordPopover();
  }

  function resetKeywordOnly() {
    draftKeyword.value = "";
    emit("update:modelValue", "");
    emit("reset-keyword");
    closeKeywordPopover();
  }

  function closeFilterPopover() {
    filterVisible.value = false;
    nextTick(() => {
      filterPopoverRef.value?.hide?.();
    });
  }

  function closeKeywordPopover() {
    keywordPopoverVisible.value = false;
    nextTick(() => {
      keywordPopoverRef.value?.hide?.();
    });
  }

  function handleCommunityChange(value?: string) {
    const selected = props.communityOptions.find(item => item.communityId === value);
    draftAdvanced.value.communityName = selected?.name;
  }

  function normalizeAdvancedValue(value?: RoomAdvancedFilterValue): RoomAdvancedFilterValue {
    return {
      ...emptyAdvancedValue(),
      ...value,
      roomNumber: value?.roomNumber?.trim() || undefined,
      direction: value?.direction || undefined,
      communityId: value?.communityId || undefined,
      communityName: value?.communityName || undefined
    };
  }

  function formatRange(min?: number, max?: number, unit = "") {
    if (min === undefined && max === undefined) return "";
    if (min !== undefined && max !== undefined) return `${min} - ${max}${unit}`;
    if (min !== undefined) return `≥ ${min}${unit}`;
    return max !== undefined ? `≤ ${max}${unit}` : "";
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
          <span class="room-filter-btn__content">{{ item.label }}</span>
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

    <div v-if="showSearchActions && showAdvancedSearch" class="room-filter-bar__actions">
      <el-input v-model="draftKeyword" class="room-filter-bar__search" clearable placeholder="请输入关键字" @keyup.enter="submitQuickSearch" />
      <el-button class="room-filter-bar__action-btn" :type="keywordText ? 'primary' : 'default'" plain :icon="useRenderIcon(Search)" @click="submitQuickSearch">查询</el-button>
      <el-popover
        v-if="showAdvancedSearch"
        ref="filterPopoverRef"
        v-model:visible="filterVisible"
        trigger="click"
        placement="bottom-end"
        :width="760"
        popper-class="room-search-popover room-search-popover--wide"
      >
        <template #reference>
          <el-button class="room-filter-bar__action-btn" :type="hasAdvancedValue ? 'primary' : 'default'" plain :icon="useRenderIcon(Filter)">筛选{{ activeFilterCount ? `（${activeFilterCount}）` : "" }}</el-button>
        </template>

        <div class="room-search-popover__content" @click.stop>
          <div class="room-search-popover__head">
            <div>
              <div class="room-search-popover__title">筛选房源</div>
              <div class="room-search-popover__desc">组合小区、房间号、价格、面积等条件进行过滤</div>
            </div>
            <el-button link type="primary" native-type="button" @click="clearDraftFilters">清空当前填写</el-button>
          </div>
          <el-form class="room-search-form" label-position="top" @submit.prevent>
            <el-form-item v-if="rentalTypeItems.length" label="房源类型">
              <el-radio-group v-model="draftRentalTypeValue" class="room-filter-radio">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button :label="1">整租</el-radio-button>
                <el-radio-button :label="2">合租</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="小区/项目">
              <el-select
                v-model="draftAdvanced.communityId"
                clearable
                filterable
                remote
                reserve-keyword
                :remote-method="value => emit('community-search', value)"
                :loading="communityLoading"
                placeholder="请选择小区/项目"
                @change="handleCommunityChange"
              >
                <el-option
                  v-for="item in communityOptions"
                  :key="item.communityId"
                  :label="item.address ? `${item.name}（${item.address}）` : item.name"
                  :value="item.communityId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="房间号">
              <el-input v-model="draftAdvanced.roomNumber" clearable placeholder="请输入房间号" @keyup.enter="submitSearch" />
            </el-form-item>
            <el-form-item label="空置天数">
              <div class="room-range-input">
                <el-input-number v-model="draftAdvanced.vacancyDaysMin" :min="0" :controls="false" placeholder="最小空置天数" />
                <span>~</span>
                <el-input-number v-model="draftAdvanced.vacancyDaysMax" :min="0" :controls="false" placeholder="最大空置天数" />
              </div>
            </el-form-item>
            <el-form-item label="出租价格">
              <div class="room-range-input">
                <el-input-number v-model="draftAdvanced.priceMin" :min="0" :precision="0" :controls="false" placeholder="最低价格" />
                <span>~</span>
                <el-input-number v-model="draftAdvanced.priceMax" :min="0" :precision="0" :controls="false" placeholder="最高价格" />
              </div>
            </el-form-item>
            <el-form-item label="房屋面积">
              <div class="room-range-input">
                <el-input-number v-model="draftAdvanced.areaMin" :min="0" :precision="1" :controls="false" placeholder="最小面积" />
                <span>~</span>
                <el-input-number v-model="draftAdvanced.areaMax" :min="0" :precision="1" :controls="false" placeholder="最大面积" />
              </div>
            </el-form-item>
            <el-form-item label="朝向">
              <el-select v-model="draftAdvanced.direction" clearable placeholder="全部">
                <el-option v-for="item in directionOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item label="是否有图">
              <el-radio-group v-model="draftHasImageValue" class="room-filter-radio">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="true">有图</el-radio-button>
                <el-radio-button label="false">无图</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
          <div class="room-search-popover__footer">
            <el-button native-type="button" @click="clearDraftFilters">清空</el-button>
            <el-button type="primary" native-type="button" @click="submitSearch">过滤</el-button>
          </div>
        </div>
      </el-popover>
      <el-button v-if="keywordText || hasAdvancedValue" class="room-filter-bar__action-btn" plain @click="resetAppliedFilters">重置</el-button>
    </div>

    <div v-else-if="showSearchActions" class="room-filter-bar__actions">
      <el-tag v-if="keywordText" class="room-filter-bar__keyword" closable @close="clearKeyword">关键词：{{ keywordText }}</el-tag>
      <el-popover ref="keywordPopoverRef" v-model:visible="keywordPopoverVisible" trigger="click" placement="bottom-end" :width="360" popper-class="room-search-popover">
        <template #reference>
          <el-button :type="keywordText ? 'primary' : 'default'" plain :icon="useRenderIcon(Search)">搜索</el-button>
        </template>

        <div class="room-search-popover__content" @click.stop>
          <div class="room-search-popover__title">搜索房间</div>
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="关键词">
              <el-input v-model="draftKeyword" clearable placeholder="项目/房号/租客/业主/标签" @keyup.enter="submitKeywordSearch" />
            </el-form-item>
          </el-form>
          <div class="room-search-popover__footer">
            <el-button native-type="button" @click="resetKeywordOnly">重置</el-button>
            <el-button type="primary" native-type="button" @click="submitKeywordSearch">查询</el-button>
          </div>
        </div>
      </el-popover>
    </div>

    <div v-if="showAdvancedSearch && (keywordText || hasAdvancedValue)" class="room-filter-bar__tags">
      <el-tag v-if="keywordText" closable @close="clearKeyword">关键词：{{ keywordText }}</el-tag>
      <el-tag v-if="props.advancedValue.rentalType !== undefined" closable @close="clearAdvancedField('rentalType')">类型：{{ rentalTypeText }}</el-tag>
      <el-tag v-if="props.advancedValue.communityId" closable @close="clearAdvancedField('communityId')">小区：{{ communityText }}</el-tag>
      <el-tag v-if="props.advancedValue.roomNumber" closable @close="clearAdvancedField('roomNumber')">房间号：{{ props.advancedValue.roomNumber }}</el-tag>
      <el-tag v-if="vacancyText" closable @close="clearAdvancedField('vacancyDaysMin')">空置：{{ vacancyText }}</el-tag>
      <el-tag v-if="priceText" closable @close="clearAdvancedField('priceMin')">价格：{{ priceText }}</el-tag>
      <el-tag v-if="areaText" closable @close="clearAdvancedField('areaMin')">面积：{{ areaText }}</el-tag>
      <el-tag v-if="props.advancedValue.direction" closable @close="clearAdvancedField('direction')">朝向：{{ props.advancedValue.direction }}</el-tag>
      <el-tag v-if="props.advancedValue.hasImage !== undefined" closable @close="clearAdvancedField('hasImage')">
        {{ props.advancedValue.hasImage ? "有图" : "无图" }}
      </el-tag>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .room-filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    padding: 0 16px 10px;
    background: var(--el-bg-color);
  }

  .room-filter-bar__main {
    display: flex;
    flex: 1 1 auto;
    gap: 8px;
    align-items: center;
    min-width: 0;
    overflow-x: auto;
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
    gap: 8px;
    align-items: center;
    margin-left: auto;
  }

  .room-filter-bar__search {
    width: clamp(260px, 24vw, 360px);

    :deep(.el-input__wrapper) {
      height: 34px;
      border-radius: 6px;
      box-shadow: 0 0 0 1px var(--el-border-color) inset;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-border-color-darker) inset;
      }

      &.is-focus {
        box-shadow: 0 0 0 1px var(--el-color-primary) inset;
      }
    }
  }

  .room-filter-bar__action-btn {
    height: 34px;
    padding: 0 14px;
    border-radius: 6px;
  }

  .room-filter-bar__keyword {
    max-width: 260px;

    :deep(.el-tag__content) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .room-filter-bar__tags {
    display: flex;
    flex-basis: 100%;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-top: -2px;
  }

  .room-filter-btn {
    height: 32px;
    min-width: 64px;
    margin: 0 !important;
    padding: 0 10px;
    font-size: 13px;
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
    gap: 6px;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
  }

  .room-filter-btn--status {
    min-width: 86px;
  }

  .room-filter-btn__dot {
    display: inline-block;
    flex: none;
    min-width: 7px;
    max-width: 7px;
    width: 7px;
    height: 7px;
    min-height: 7px;
    max-height: 7px;
    border-radius: 50%;
  }

  .room-search-popover__content {
    width: 100%;
    pointer-events: auto;
  }

  .room-search-popover__head {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .room-search-popover__title {
    font-size: var(--el-font-size-base);
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .room-search-popover__desc {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .room-search-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 14px;
    overflow: visible;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
      height: 20px;
      padding: 0 0 6px;
      line-height: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    :deep(.el-form-item__content) {
      min-width: 0;
    }

    :deep(.el-select),
    :deep(.el-input),
    :deep(.el-input-number) {
      width: 100%;
    }

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      min-height: 34px;
      border-radius: 6px;
    }

    :deep(.el-input-number .el-input__inner) {
      text-align: left;
    }
  }

  .room-filter-radio {
    display: flex;
    width: 100%;

    :deep(.el-radio-button) {
      flex: 1;
      min-width: 0;
    }

    :deep(.el-radio-button__inner) {
      width: 100%;
      height: 34px;
      padding: 0 12px;
      line-height: 32px;
      color: var(--el-text-color-regular);
      background: var(--el-bg-color);
      border-color: var(--el-border-color);
      box-shadow: none;
    }

    :deep(.el-radio-button:first-child .el-radio-button__inner) {
      border-radius: 6px 0 0 6px;
    }

    :deep(.el-radio-button:last-child .el-radio-button__inner) {
      border-radius: 0 6px 6px 0;
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-5);
    }
  }

  .room-search-popover__footer {
    position: relative;
    z-index: 2;
    display: flex;
    padding-top: 14px;
    margin-top: 14px;
    justify-content: flex-end;
    gap: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
    pointer-events: auto;
  }

  .room-range-input {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 18px minmax(0, 1fr);
    gap: 6px;
    align-items: center;
    width: 100%;
    color: var(--el-text-color-placeholder);
    text-align: center;
  }

  :global(.room-search-popover) {
    padding: 14px !important;
    border-radius: 8px !important;
    overflow: visible !important;
  }

  :global(.room-search-popover--wide) {
    max-width: calc(100vw - 48px);
  }

  @media (max-width: 1200px) {
    .room-filter-bar {
      flex-wrap: wrap;
    }

    .room-filter-bar__main {
      flex-wrap: wrap;
      width: 100%;
      overflow-x: visible;
    }

    .room-filter-bar__actions {
      justify-content: flex-end;
      width: 100%;
    }

    .room-filter-bar__search {
      flex: 1;
      min-width: 240px;
    }
  }

  @media (max-width: 900px) {
    .room-search-form {
      grid-template-columns: 1fr;
    }
  }
</style>
