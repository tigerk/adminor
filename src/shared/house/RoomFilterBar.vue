<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import type { PropType } from "vue";
  import Filter from "~icons/ri/filter-3-line";
  import Search from "~icons/ri/search-line";
  import { useRenderIcon } from "@/components/ReIcon/src/hooks";
  import type { CommunityOption, RentalTypeFilterItem, RoomAdvancedFilterValue, RoomStatusFilterItem } from "./roomFilterTypes";

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

  const advancedPanelVisible = ref(false);
  const keywordDraft = ref("");
  const draftAdvanced = ref<RoomAdvancedFilterValue>(emptyAdvancedValue());

  const directionOptions = ["东", "南", "西", "北", "东南", "东北", "西南", "西北", "南北", "东西"];
  const ALL_RENTAL_TYPE_VALUE = "__all__";

  const keywordText = computed(() => props.modelValue.trim());
  const showRentalType = computed(() => props.rentalTypeItems.length > 0);
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
  const draftRentalTypeValue = computed({
    get: () => (draftAdvanced.value.rentalType === undefined ? ALL_RENTAL_TYPE_VALUE : String(draftAdvanced.value.rentalType)),
    set: value => {
      draftAdvanced.value.rentalType = value === ALL_RENTAL_TYPE_VALUE ? undefined : Number(value);
    }
  });

  const vacancyText = computed(() => formatRange(props.advancedValue.vacancyDaysMin, props.advancedValue.vacancyDaysMax, "天"));
  const priceText = computed(() => formatRange(props.advancedValue.priceMin, props.advancedValue.priceMax, "元"));
  const areaText = computed(() => formatRange(props.advancedValue.areaMin, props.advancedValue.areaMax, "m²"));
  const communityText = computed(
    () => props.advancedValue.communityName || props.communityOptions.find(item => item.communityId === props.advancedValue.communityId)?.name || props.advancedValue.communityId
  );
  const rentalTypeText = computed(() => props.rentalTypeItems.find(item => item.value === props.advancedValue.rentalType)?.label || "");

  watch(
    () => props.modelValue,
    value => {
      keywordDraft.value = value || "";
    },
    { immediate: true }
  );

  watch(
    () => props.advancedValue,
    value => {
      if (!advancedPanelVisible.value) {
        draftAdvanced.value = normalizeAdvancedValue(value);
      }
    },
    { deep: true, immediate: true }
  );

  function statusKey(item: RoomStatusFilterItem) {
    if (item.filterType === undefined || item.filterType === null) {
      return "all";
    }
    return `${item.filterType}-${item.roomStatus ?? "none"}`;
  }

  function toggleAdvancedPanel() {
    if (advancedPanelVisible.value) {
      advancedPanelVisible.value = false;
      return;
    }
    draftAdvanced.value = normalizeAdvancedValue(props.advancedValue);
    emit("community-search", "");
    advancedPanelVisible.value = true;
  }

  function submitKeywordSearch() {
    emit("update:modelValue", keywordDraft.value.trim());
    emit("search");
  }

  function submitAdvancedSearch() {
    emit("update:advancedValue", normalizeAdvancedValue(draftAdvanced.value));
    emit("search");
    advancedPanelVisible.value = false;
  }

  function clearDraftFilters() {
    draftAdvanced.value = emptyAdvancedValue();
  }

  function resetAppliedFilters() {
    keywordDraft.value = "";
    draftAdvanced.value = emptyAdvancedValue();
    emit("update:modelValue", "");
    emit("update:advancedValue", emptyAdvancedValue());
    emit("search");
    advancedPanelVisible.value = false;
  }

  function clearKeyword() {
    keywordDraft.value = "";
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
  <div class="room-filter-bar" :class="{ 'room-filter-bar--expanded': showAdvancedSearch && advancedPanelVisible }">
    <!-- 顶部工具栏 -->
    <div class="room-filter-bar__toolbar">
      <div class="room-filter-bar__filters">
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

      <div v-if="showSearchActions" class="room-filter-bar__actions">
        <el-input
          v-model="keywordDraft"
          class="room-filter-bar__search"
          clearable
          placeholder="项目/房号/租客/业主/标签"
          @clear="clearKeyword"
          @keyup.enter="submitKeywordSearch"
        />
        <el-button class="room-filter-bar__action-btn" :type="keywordText ? 'primary' : 'default'" plain :icon="useRenderIcon(Search)" @click="submitKeywordSearch">查询</el-button>
        <el-button
          v-if="showAdvancedSearch"
          class="room-filter-bar__action-btn room-filter-bar__action-btn--filter"
          :class="{ 'is-active': hasAdvancedValue || advancedPanelVisible }"
          :type="hasAdvancedValue || advancedPanelVisible ? 'primary' : 'default'"
          plain
          :icon="useRenderIcon(Filter)"
          @click="toggleAdvancedPanel"
        >
          {{ advancedPanelVisible ? "收起筛选" : `筛选${activeFilterCount ? `（${activeFilterCount}）` : ""}` }}
          <span v-if="activeFilterCount && !advancedPanelVisible" class="filter-badge">{{ activeFilterCount }}</span>
        </el-button>
        <el-button v-if="keywordText || hasAdvancedValue || advancedPanelVisible" class="room-filter-bar__action-btn" plain @click="resetAppliedFilters">重置</el-button>
      </div>
    </div>

    <!-- 已选筛选标签 -->
    <div v-if="showAdvancedSearch && (keywordText || hasAdvancedValue)" class="room-filter-bar__tags">
      <el-tag v-if="keywordText" closable type="info" effect="light" round @close="clearKeyword">关键词：{{ keywordText }}</el-tag>
      <el-tag v-if="props.advancedValue.rentalType !== undefined" closable effect="light" round @close="clearAdvancedField('rentalType')">类型：{{ rentalTypeText }}</el-tag>
      <el-tag v-if="props.advancedValue.communityId" closable effect="light" round @close="clearAdvancedField('communityId')">小区：{{ communityText }}</el-tag>
      <el-tag v-if="props.advancedValue.roomNumber" closable effect="light" round @close="clearAdvancedField('roomNumber')">房间号：{{ props.advancedValue.roomNumber }}</el-tag>
      <el-tag v-if="vacancyText" closable effect="light" round @close="clearAdvancedField('vacancyDaysMin')">空置：{{ vacancyText }}</el-tag>
      <el-tag v-if="priceText" closable effect="light" round @close="clearAdvancedField('priceMin')">价格：{{ priceText }}</el-tag>
      <el-tag v-if="areaText" closable effect="light" round @close="clearAdvancedField('areaMin')">面积：{{ areaText }}</el-tag>
      <el-tag v-if="props.advancedValue.direction" closable effect="light" round @close="clearAdvancedField('direction')">朝向：{{ props.advancedValue.direction }}</el-tag>
      <el-tag v-if="props.advancedValue.hasImage !== undefined" closable effect="light" round @close="clearAdvancedField('hasImage')">
        {{ props.advancedValue.hasImage ? "有图" : "无图" }}
      </el-tag>
    </div>

    <!-- 高级筛选面板 -->
    <transition name="room-filter-panel">
      <div v-if="showAdvancedSearch && advancedPanelVisible" class="room-filter-panel">
        <!-- 面板头部 -->
        <div class="room-filter-panel__head">
          <div class="room-filter-panel__head-left">
            <div class="room-filter-panel__icon-wrap">
              <el-icon :size="14"><component :is="useRenderIcon(Filter)" /></el-icon>
            </div>
            <div>
              <div class="room-filter-panel__title">筛选房源</div>
              <div class="room-filter-panel__desc">先选快速条件，再组合小区、房号、价格和面积等条件过滤。</div>
            </div>
          </div>
        </div>

        <el-form class="room-filter-form" label-position="top" @submit.prevent>
          <!-- 详细字段区 -->
          <div class="room-filter-form__fields">
            <el-form-item label="小区 / 项目" class="room-filter-form__community">
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

            <el-form-item label="房间号" class="room-filter-form__room">
              <el-input v-model="draftAdvanced.roomNumber" clearable placeholder="请输入房间号" @keyup.enter="submitAdvancedSearch" />
            </el-form-item>

            <el-form-item label="朝向" class="room-filter-form__direction">
              <el-select v-model="draftAdvanced.direction" clearable placeholder="全部">
                <el-option v-for="item in directionOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>

            <el-form-item label="出租价格" class="room-filter-form__price">
              <div class="room-range-input">
                <el-input-number v-model="draftAdvanced.priceMin" :min="0" :precision="0" :controls="false" placeholder="最低价格" />
                <span class="room-range-input__sep">~</span>
                <el-input-number v-model="draftAdvanced.priceMax" :min="0" :precision="0" :controls="false" placeholder="最高价格" />
              </div>
            </el-form-item>

            <el-form-item label="房屋面积" class="room-filter-form__area">
              <div class="room-range-input">
                <el-input-number v-model="draftAdvanced.areaMin" :min="0" :precision="1" :controls="false" placeholder="最小面积" />
                <span class="room-range-input__sep">~</span>
                <el-input-number v-model="draftAdvanced.areaMax" :min="0" :precision="1" :controls="false" placeholder="最大面积" />
              </div>
            </el-form-item>

            <el-form-item label="空置天数" class="room-filter-form__vacancy">
              <div class="room-range-input">
                <el-input-number v-model="draftAdvanced.vacancyDaysMin" :min="0" :controls="false" placeholder="最小空置天数" />
                <span class="room-range-input__sep">~</span>
                <el-input-number v-model="draftAdvanced.vacancyDaysMax" :min="0" :controls="false" placeholder="最大空置天数" />
              </div>
            </el-form-item>
          </div>

          <!-- 快速选项区 -->
          <div class="room-filter-form__quick mb-2" :class="{ 'is-single': !showRentalType }">
            <el-form-item v-if="showRentalType" class="room-filter-form__type" label="房源类型">
              <el-radio-group v-model="draftRentalTypeValue" size="small" class="room-filter-radio room-filter-radio--small">
                <el-radio-button v-for="item in rentalTypeItems" :key="item.value ?? 'all'" :label="item.value === undefined ? ALL_RENTAL_TYPE_VALUE : String(item.value)">
                  {{ item.label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="是否有图" class="room-filter-form__image">
              <el-radio-group v-model="draftHasImageValue" size="small" class="room-filter-radio room-filter-radio--small">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="true">有图</el-radio-button>
                <el-radio-button label="false">无图</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <div v-if="showRentalType" class="room-filter-form__quick-spacer" aria-hidden="true" />
          </div>
        </el-form>

        <!-- 底部操作 -->
        <div class="room-filter-panel__footer">
          <el-button native-type="button" class="footer-btn-reset" @click.stop.prevent="clearDraftFilters">
            <span>清空条件</span>
          </el-button>
          <el-button type="primary" native-type="button" class="footer-btn-submit" @click.stop.prevent="submitAdvancedSearch">
            <el-icon :size="13"><component :is="useRenderIcon(Filter)" /></el-icon>
            <span>应用过滤</span>
          </el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
  // ─── 颜色变量 ───────────────────────────────────────────────────
  $primary: var(--el-color-primary);
  $primary-light: var(--el-color-primary-light-9);
  $primary-border: var(--el-color-primary-light-5);
  $primary-text: var(--el-color-primary);

  // ─── 外层容器 ───────────────────────────────────────────────────
  .room-filter-bar {
    position: relative;
    isolation: isolate;
    z-index: 2;
    width: 100%;
    padding: 0 16px 10px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .room-filter-bar--expanded {
    z-index: 60;
  }

  // ─── 工具栏 ─────────────────────────────────────────────────────
  .room-filter-bar__toolbar {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .room-filter-bar__filters {
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

  .room-filter-bar__segment--fluid {
    display: flex;
    width: 100%;

    .room-filter-btn--type {
      flex: 1;
      min-width: 0;
    }
  }

  .room-filter-bar__actions {
    display: inline-flex;
    flex: none;
    gap: 8px;
    align-items: center;
    margin-left: auto;
  }

  .room-filter-bar__search {
    width: clamp(280px, 28vw, 430px);

    :deep(.el-input__wrapper) {
      height: 34px;
      border-radius: 6px;
      box-shadow: 0 0 0 1px var(--el-border-color) inset;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-border-color-darker) inset;
      }

      &.is-focus {
        box-shadow: 0 0 0 1px $primary inset;
      }
    }
  }

  .room-filter-bar__action-btn {
    height: 34px;
    padding: 0 14px;
    border-radius: 6px;

    &--filter {
      position: relative;
    }
  }

  .filter-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    font-size: 10px;
    font-weight: 700;
    line-height: 16px;
    color: #fff;
    text-align: center;
    background: var(--el-color-danger);
    border-radius: 8px;
  }

  // ─── 筛选标签 ───────────────────────────────────────────────────
  .room-filter-bar__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-top: 10px;
  }

  // ─── 状态/类型按钮 ──────────────────────────────────────────────
  .room-filter-btn {
    height: 34px;
    min-width: 70px;
    margin: 0 !important;
    padding: 0 12px;
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    background: var(--el-bg-color);
    border-color: var(--el-border-color) !important;
    transition:
      color 0.2s,
      background-color 0.2s,
      border-color 0.2s;

    &:hover {
      color: $primary-text;
      background: var(--el-fill-color-light);
      border-color: $primary-border !important;
    }

    &.is-active {
      color: $primary-text;
      background: $primary-light;
      border-color: $primary-border !important;
    }
  }

  .room-filter-btn--type.is-active {
    font-weight: 700;
  }

  .room-filter-btn--status {
    min-width: 90px;
  }

  .room-filter-btn__content {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
  }

  .room-filter-btn__dot {
    display: inline-block;
    flex: none;
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  // ─── 筛选面板 ───────────────────────────────────────────────────
  .room-filter-panel {
    position: relative;
    z-index: 61;
    pointer-events: auto;
    margin-top: 12px;
    padding: 0 0 2px;
    background: linear-gradient(180deg, var(--el-bg-color), var(--el-fill-color-extra-light));
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow:
      0 4px 24px rgb(15 23 42 / 6%),
      0 1px 4px rgb(15 23 42 / 4%);
    overflow: hidden;
  }

  // ─── 面板头部 ───────────────────────────────────────────────────
  .room-filter-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 12px;
    background: linear-gradient(to right, var(--el-fill-color-extra-light), var(--el-bg-color) 70%);
    border-bottom: 1px solid var(--el-border-color-extra-light);
  }

  .room-filter-panel__head-left {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .room-filter-panel__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: $primary-text;
    background: var(--el-color-primary-light-8);
    border: 1px solid $primary-border;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .room-filter-panel__title {
    font-size: var(--el-font-size-base);
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.4;
  }

  .room-filter-panel__desc {
    margin-top: 2px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }

  // ─── 表单整体 ───────────────────────────────────────────────────
  .room-filter-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 16px 0;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
      height: 18px;
      padding: 0 0 5px;
      line-height: 18px;
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      letter-spacing: 0.02em;
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
      min-height: 38px;
      border-radius: 8px;
      transition: box-shadow 0.15s;
    }

    :deep(.el-input-number .el-input__inner) {
      text-align: left;
    }
  }

  // ─── 快速条件区（租赁类型 + 是否有图）──────────────────────────
  .room-filter-form__quick {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px 20px;
    padding: 12px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 10px;

    &.is-single {
      grid-template-columns: minmax(0, 1fr);
    }

    :deep(.el-form-item__content) {
      align-items: center;
    }
  }

  // ─── 详细字段区 ─────────────────────────────────────────────────
  .room-filter-form__fields {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px 20px;
    padding: 12px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 10px;
  }

  .room-filter-form__quick-spacer {
    min-height: 1px;
  }

  // ─── Radio 按钮组 ────────────────────────────────────────────────
  .room-filter-radio {
    display: flex;
    width: 100%;

    :deep(.el-radio-button) {
      flex: 1;
      min-width: 0;
    }

    :deep(.el-radio-button__inner) {
      width: 100%;
      height: 38px;
      padding: 0 12px;
      line-height: 36px;
      color: var(--el-text-color-regular);
      background: var(--el-bg-color);
      border-color: var(--el-border-color);
      box-shadow: none;
      transition:
        background 0.15s,
        color 0.15s;
    }

    :deep(.el-radio-button:first-child .el-radio-button__inner) {
      border-radius: 8px 0 0 8px;
    }

    :deep(.el-radio-button:last-child .el-radio-button__inner) {
      border-radius: 0 8px 8px 0;
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      color: $primary-text;
      background: $primary-light;
      border-color: $primary-border;
      font-weight: 600;
    }
  }

  .room-filter-radio--small {
    :deep(.el-radio-button__inner) {
      height: 34px;
      line-height: 32px;
      font-size: 13px;
    }
  }

  // ─── 范围输入组 ─────────────────────────────────────────────────
  .room-range-input {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 16px minmax(0, 1fr);
    gap: 4px;
    align-items: center;
    width: 100%;

    &__sep {
      text-align: center;
      font-size: 13px;
      color: var(--el-text-color-placeholder);
      user-select: none;
    }
  }

  // ─── 底部操作栏 ─────────────────────────────────────────────────
  .room-filter-panel__footer {
    position: relative;
    z-index: 62;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 12px 16px 10px;
    margin-top: 2px;
    background: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-extra-light);
    pointer-events: auto;

    .footer-btn-reset {
      height: 36px;
      padding: 0 16px;
      border-radius: 8px;
      font-size: 13px;
      color: var(--el-text-color-regular);
      border-color: var(--el-border-color);
      background: var(--el-bg-color);

      &:hover {
        color: var(--el-color-danger);
        border-color: var(--el-color-danger-light-5);
        background: var(--el-color-danger-light-9);
      }
    }

    .footer-btn-submit {
      height: 36px;
      padding: 0 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    :deep(.el-button) {
      pointer-events: auto;
    }
  }

  // ─── 动画 ────────────────────────────────────────────────────────
  .room-filter-panel-enter-active,
  .room-filter-panel-leave-active {
    overflow: hidden;
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;
  }

  .room-filter-panel-enter-from,
  .room-filter-panel-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }

  // ─── 响应式 ──────────────────────────────────────────────────────
  @media (max-width: 1200px) {
    .room-filter-bar__toolbar {
      flex-wrap: wrap;
    }

    .room-filter-bar__filters {
      flex-wrap: wrap;
      width: 100%;
      overflow-x: visible;
    }

    .room-filter-bar__actions {
      justify-content: flex-end;
    }

    .room-filter-bar__search {
      flex: 1;
      min-width: 240px;
    }
  }

  @media (max-width: 1280px) {
    .room-filter-form__quick,
    .room-filter-form__fields {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .room-filter-form__quick.is-single {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .room-filter-form__quick,
    .room-filter-form__quick.is-single,
    .room-filter-form__fields {
      grid-template-columns: 1fr;
    }
  }
</style>
