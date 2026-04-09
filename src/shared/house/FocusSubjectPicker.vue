<template>
  <el-dialog
    v-model="visible"
    title="选择集中式项目"
    width="60vw"
    append-to-body
    :close-on-click-modal="false"
    :align-center="true"
    :draggable="true"
    :show-close="true"
    class="focus-subject-picker-dialog"
  >
    <div class="focus-subject-picker">
      <!-- Left: Selected Panel -->
      <div class="selected-panel">
        <div class="selected-panel__header">
          <div class="selected-panel__header-left">
            <span class="selected-panel__label">已选项目 / 楼栋</span>
            <span class="selected-panel__badge" :class="{ active: selectedRows.length > 0 }">{{ selectedRows.length }}</span>
          </div>
          <button v-if="selectedRows.length > 0" class="clear-btn" @click="clearAllSelection">清空全部</button>
        </div>

        <div class="selected-panel__body">
          <transition-group name="list" tag="div" class="selected-list">
            <div v-for="row in selectedRows" :key="`${row.subjectType}-${row.subjectId}`" class="selected-card">
              <div class="selected-card__dot" />
              <div class="selected-card__info">
                <div class="selected-card__name">
                  <el-tag size="small" effect="plain" class="subject-tag">
                    {{ row.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS.value ? "项目" : "楼栋" }}
                  </el-tag>
                  <span>{{ row.subjectName }}</span>
                </div>
                <div class="selected-card__addr">{{ row.address || "暂无地址" }}</div>
              </div>
              <button class="selected-card__remove" @click="handleRemoveTag(row)">
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </transition-group>

          <div v-if="selectedRows.length === 0" class="empty-state">
            <div class="empty-state__icon">
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="14" y="28" width="52" height="38" rx="4" stroke="currentColor" stroke-width="2.5" fill="none" />
                <path d="M8 32L40 10L72 32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                <rect x="28" y="44" width="24" height="22" rx="2" stroke="currentColor" stroke-width="2" fill="none" />
                <line x1="40" y1="44" x2="40" y2="66" stroke="currentColor" stroke-width="2" />
              </svg>
            </div>
            <p class="empty-state__text">暂未选择集中式项目</p>
            <p class="empty-state__hint">右侧可直接选择整项目，也可以选择项目下的多个楼栋</p>
          </div>
        </div>
      </div>

      <!-- Right: Main Panel -->
      <div class="main-panel">
        <!-- Search Bar -->
        <div class="search-bar">
          <div class="search-bar__input-wrap">
            <el-icon class="search-bar__icon"><Search /></el-icon>
            <el-input v-model="queryParams.keywords" placeholder="搜索项目名称或地址..." clearable class="search-bar__input" @keyup.enter="handleQuery" />
          </div>
          <button class="btn btn--primary" @click="handleQuery">
            <el-icon><Search /></el-icon>
            查询
          </button>
          <button class="btn btn--ghost" @click="resetQuery">
            <el-icon><Refresh /></el-icon>
            重置
          </button>
        </div>

        <div class="main-layout">
          <!-- Project List Panel -->
          <div v-loading="loading" class="project-panel">
            <div class="project-panel__header">项目列表</div>
            <div v-if="projectList.length" class="project-list">
              <button
                v-for="project in projectList"
                :key="project.subjectId"
                type="button"
                :class="['project-card', { 'is-active': activeProjectId === project.subjectId, 'is-selected': isProjectSelected(project.subjectId) }]"
                @click="handleProjectCardClick(project)"
              >
                <div class="project-card__inner">
                  <div class="project-card__name">{{ project.subjectName }}</div>
                  <div class="project-card__addr">{{ project.address || "暂无地址" }}</div>
                </div>
                <div v-if="isProjectSelected(project.subjectId)" class="project-card__check">
                  <el-icon><Check /></el-icon>
                </div>
              </button>
            </div>
            <el-empty v-else description="暂无可选项目" :image-size="80" />
          </div>

          <!-- Building Panel -->
          <div v-loading="buildingLoading" class="building-panel">
            <div class="building-panel__header">
              <div>
                <div class="building-panel__title">{{ activeProjectName || "请选择左侧项目" }}</div>
                <div class="building-panel__desc">点击整项目卡片可选中整项目；也可在此选择具体楼栋。</div>
              </div>
            </div>
            <div v-if="buildingRows.length" class="building-grid">
              <button
                v-for="building in buildingRows"
                :key="building.subjectId"
                type="button"
                class="building-card"
                :class="{ 'is-selected': isBuildingSelected(building.subjectId) }"
                @click="toggleBuilding(building)"
              >
                <div class="building-card__inner">
                  <div class="building-card__name">{{ building.subjectName }}</div>
                  <div class="building-card__meta">
                    <span class="meta-item">{{ building.floorTotal || 0 }} 层</span>
                    <span class="meta-sep">·</span>
                    <span class="meta-item">每层 {{ building.houseCountPerFloor || 0 }} 套</span>
                  </div>
                </div>
                <div v-if="isBuildingSelected(building.subjectId)" class="building-card__check">
                  <el-icon><Check /></el-icon>
                </div>
              </button>
            </div>
            <el-empty v-else :description="activeProjectId ? '当前项目暂无楼栋' : '请先选择项目'" :image-size="90" />
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar">
          <span class="pagination-bar__total">共 {{ total }} 个项目</span>
          <el-pagination
            v-model:current-page="queryParams.currentPage"
            v-model:page-size="queryParams.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            background
            layout="sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="picker-footer">
        <div class="picker-footer__summary">
          <template v-if="selectedRows.length > 0">
            已选
            <strong>{{ selectedRows.length }}</strong>
            项
          </template>
        </div>
        <div class="picker-footer__actions">
          <button class="btn btn--ghost" @click="visible = false">取消</button>
          <button class="btn btn--primary btn--confirm" :disabled="selectedRows.length === 0" @click="submitSelection">
            确认选择
            <span v-if="selectedRows.length > 0" class="btn__count">{{ selectedRows.length }}</span>
          </button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { nextTick, reactive, ref } from "vue";
  import { Close, Check, Refresh, Search } from "@element-plus/icons-vue";
  import { getFocusById, getFocusList } from "@/api/house/focus";
  import type { FocusBuildingDto, FocusCreateDto, FocusListVo, OwnerContractSubjectTypeEnum } from "@/types/generated";
  import { OwnerContractSubjectTypeEnumMeta } from "@/types/generated/enum.meta";

  defineOptions({ name: "FocusSubjectPicker" });

  type FocusSubjectPickerRow = {
    subjectType: OwnerContractSubjectTypeEnum;
    subjectId: string;
    subjectName: string;
    address?: string;
    focusId?: string;
    focusName?: string;
    floorTotal?: number;
    houseCountPerFloor?: number;
  };

  type FocusSubjectPickerShowOptions = {
    selected?: FocusSubjectPickerRow[];
  };

  const emit = defineEmits<{
    (e: "confirm", value: FocusSubjectPickerRow[]): void;
  }>();

  const visible = ref(false);
  const loading = ref(false);
  const buildingLoading = ref(false);
  const total = ref(0);
  const projectList = ref<FocusSubjectPickerRow[]>([]);
  const buildingRows = ref<FocusSubjectPickerRow[]>([]);
  const selectedRows = ref<FocusSubjectPickerRow[]>([]);
  const activeProjectId = ref("");
  const activeProjectName = ref("");
  const activeProjectAddress = ref("");

  const queryParams = reactive({
    currentPage: 1,
    pageSize: 10,
    keywords: ""
  });

  const buildProjectRow = (row: FocusListVo): FocusSubjectPickerRow => ({
    subjectType: OwnerContractSubjectTypeEnumMeta.FOCUS.value,
    subjectId: String(row.id || ""),
    subjectName: row.focusName || "未命名项目",
    address: row.address || ""
  });

  const buildBuildingName = (focusName: string, item: FocusBuildingDto) => {
    return [focusName, item.building, item.unit ? `${item.unit}单元` : ""].filter(Boolean).join(" ");
  };

  const getList = async () => {
    loading.value = true;
    try {
      const res = await getFocusList({
        currentPage: queryParams.currentPage,
        pageSize: queryParams.pageSize,
        keywords: queryParams.keywords
      });
      const rows = (((res as any)?.data?.list || []) as FocusListVo[]).filter(item => item.id);
      projectList.value = rows.map(buildProjectRow);
      total.value = Number((res as any)?.data?.total || 0);
      if (!activeProjectId.value && projectList.value.length) {
        await activateProject(projectList.value[0]);
      } else if (activeProjectId.value) {
        const matched = projectList.value.find(item => item.subjectId === activeProjectId.value);
        if (matched) {
          await activateProject(matched);
        }
      }
    } finally {
      loading.value = false;
    }
  };

  const activateProject = async (project: FocusSubjectPickerRow) => {
    activeProjectId.value = project.subjectId;
    activeProjectName.value = project.subjectName;
    activeProjectAddress.value = project.address || "";
    buildingLoading.value = true;
    try {
      const res = await getFocusById({ id: project.subjectId });
      const focusDetail = ((res as any)?.data || {}) as FocusCreateDto;
      const buildings = (focusDetail.buildings || []) as FocusBuildingDto[];
      buildingRows.value = buildings
        .filter(item => item.id)
        .map(item => ({
          subjectType: OwnerContractSubjectTypeEnumMeta.FOCUS_BUILDING.value,
          subjectId: String(item.id || ""),
          subjectName: buildBuildingName(project.subjectName, item),
          focusId: project.subjectId,
          focusName: project.subjectName,
          address: project.address,
          floorTotal: item.floorTotal,
          houseCountPerFloor: item.houseCountPerFloor
        }));
    } finally {
      buildingLoading.value = false;
    }
  };

  const isProjectSelected = (subjectId: string) =>
    selectedRows.value.some(item => item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS.value && item.subjectId === subjectId);

  const isBuildingSelected = (subjectId: string) =>
    selectedRows.value.some(item => item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS_BUILDING.value && item.subjectId === subjectId);

  const handleProjectClick = (project: FocusSubjectPickerRow) => {
    void activateProject(project);
  };

  const handleProjectCardClick = (project: FocusSubjectPickerRow) => {
    void activateProject(project);
    toggleProject(project);
  };

  const toggleProject = (project: FocusSubjectPickerRow) => {
    const isSelected = isProjectSelected(project.subjectId);
    if (isSelected) {
      selectedRows.value = selectedRows.value.filter(item => !(item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS.value && item.subjectId === project.subjectId));
      return;
    }
    selectedRows.value = selectedRows.value.filter(item => !(item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS_BUILDING.value && item.focusId === project.subjectId));
    selectedRows.value.push(project);
  };

  const toggleBuilding = (building: FocusSubjectPickerRow) => {
    const projectId = building.focusId || "";
    if (projectId) {
      selectedRows.value = selectedRows.value.filter(item => !(item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS.value && item.subjectId === projectId));
    }
    const isSelected = isBuildingSelected(building.subjectId);
    if (isSelected) {
      selectedRows.value = selectedRows.value.filter(
        item => !(item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS_BUILDING.value && item.subjectId === building.subjectId)
      );
      return;
    }
    selectedRows.value.push(building);
  };

  const handleRemoveTag = (row: FocusSubjectPickerRow) => {
    selectedRows.value = selectedRows.value.filter(item => !(item.subjectType === row.subjectType && item.subjectId === row.subjectId));
  };

  const clearAllSelection = () => {
    selectedRows.value = [];
  };

  const handleQuery = () => {
    queryParams.currentPage = 1;
    void getList();
  };

  const resetQuery = () => {
    queryParams.keywords = "";
    queryParams.currentPage = 1;
    void getList();
  };

  const handlePageChange = (page: number) => {
    queryParams.currentPage = page;
    void getList();
  };

  const handleSizeChange = (size: number) => {
    queryParams.pageSize = size;
    queryParams.currentPage = 1;
    void getList();
  };

  const submitSelection = () => {
    emit("confirm", selectedRows.value);
    visible.value = false;
  };

  const show = (options?: FocusSubjectPickerShowOptions | FocusSubjectPickerRow[]) => {
    visible.value = true;
    const resolvedOptions = Array.isArray(options) ? { selected: options } : options || {};
    selectedRows.value = (resolvedOptions.selected || []).map(item => ({ ...item }));
    const firstFocusId =
      selectedRows.value.find(item => item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS.value)?.subjectId ||
      selectedRows.value.find(item => item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS_BUILDING.value)?.focusId ||
      "";
    activeProjectId.value = firstFocusId;
    nextTick(() => void getList());
  };

  defineExpose({ show });
</script>

<style scoped lang="scss">
  /* ─── Dialog Override ─────────────────────────────── */
  :deep(.focus-subject-picker-dialog) {
    border-radius: 16px !important;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.12) !important;

    .el-dialog {
      background: var(--el-bg-color);
    }

    .el-dialog__header {
      padding: 18px 56px 14px 20px !important;
      margin: 0 !important;
      border-bottom: 1px solid var(--el-border-color-light);
    }

    .el-dialog__title {
      color: var(--el-text-color-primary);
      font-size: 18px;
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      top: 16px;
      right: 16px;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      transition: background-color 0.2s ease;

      &:hover {
        background: var(--el-fill-color-light);
      }
    }

    .el-dialog__close {
      color: var(--el-text-color-regular);
      font-size: 18px;
    }

    .el-dialog__body {
      padding: 0 !important;
    }

    .el-dialog__footer {
      padding: 0 !important;
      border-top: 1px solid var(--el-border-color-light);
    }
  }

  /* ─── Body Layout ─────────────────────────────────── */
  .focus-subject-picker {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    height: 70vh;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
  }

  /* ─── Selected Panel ──────────────────────────────── */
  .selected-panel {
    border-right: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-lighter);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      flex-shrink: 0;
    }

    &__header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &__label {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__badge {
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      background: var(--el-fill-color);
      color: var(--el-text-color-secondary);
      font-size: 11px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;

      &.active {
        background: #f97316;
        color: #fff;
      }
    }

    &__body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      min-height: 0;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: #ddd;
        border-radius: 2px;
      }
    }
  }

  .clear-btn {
    font-size: 12px;
    color: #f97316;
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background 0.2s;

    &:hover {
      background: var(--el-color-primary-light-9);
    }
  }

  /* ─── Selected List & Card ────────────────────────── */
  .selected-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .selected-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    background: var(--el-bg-color);
    border-radius: 10px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.2s;

    &:hover {
      border-color: #fbd5bc;
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.08);
    }

    &__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #f97316;
      flex-shrink: 0;
      margin-top: 6px;
    }

    &__info {
      flex: 1;
      min-width: 0;
    }

    &__name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 1.5;
    }

    &__addr {
      margin-top: 4px;
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      line-height: 1.6;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__remove {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      border: none;
      background: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--el-text-color-placeholder);
      transition: all 0.2s;

      &:hover {
        background: #fee2e2;
        color: #ef4444;
      }
    }
  }

  .subject-tag {
    flex-shrink: 0;
  }

  /* ─── Empty State ─────────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    gap: 8px;

    &__icon {
      width: 60px;
      height: 60px;
      color: var(--el-border-color);
    }

    &__text {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--el-text-color-placeholder);
      font-weight: 500;
    }

    &__hint {
      margin: 0;
      font-size: 11px;
      color: var(--el-text-color-disabled);
      text-align: center;
      line-height: 1.6;
    }
  }

  /* ─── Main Panel ──────────────────────────────────── */
  .main-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--el-bg-color);
  }

  /* ─── Search Bar ──────────────────────────────────── */
  .search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
    flex-shrink: 0;

    &__input-wrap {
      position: relative;
      flex: 1;
      max-width: 320px;
    }

    &__icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--el-text-color-placeholder);
      font-size: 14px;
      z-index: 1;
    }

    :deep(.search-bar__input) {
      .el-input__wrapper {
        padding-left: 36px;
        border-radius: 8px;
        box-shadow: 0 0 0 1px var(--el-border-color);
        transition: box-shadow 0.2s;

        &:hover,
        &.is-focus {
          box-shadow: 0 0 0 2px #f97316 !important;
        }
      }
    }
  }

  /* ─── Buttons ─────────────────────────────────────── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    height: 34px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    white-space: nowrap;

    &--primary {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #fff;
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(249, 115, 22, 0.35);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        transform: none;
      }
    }

    &--ghost {
      background: var(--el-bg-color);
      color: var(--el-text-color-regular);
      border: 1px solid var(--el-border-color);

      &:hover {
        border-color: #f97316;
        color: #f97316;
        background: var(--el-color-primary-light-9);
      }
    }

    &--confirm {
      padding-right: 12px;
    }

    &__count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.3);
      font-size: 11px;
      font-weight: 700;
      margin-left: 2px;
    }
  }

  /* ─── Main Layout ─────────────────────────────────── */
  .main-layout {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 0;
    overflow: hidden;
    padding: 16px;
    gap: 16px;
  }

  /* ─── Project Panel ───────────────────────────────── */
  .project-panel {
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    background: var(--el-bg-color);
    overflow: hidden;
    display: flex;
    flex-direction: column;

    &__header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-border-color-light);
      background: var(--el-fill-color-extra-light);
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      flex-shrink: 0;
    }
  }

  .project-list {
    flex: 1;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #ddd;
      border-radius: 2px;
    }
  }

  .project-card {
    position: relative;
    padding: 11px 14px;
    border-radius: 10px;
    border: 1.5px solid var(--el-border-color-light);
    background: var(--el-bg-color);
    text-align: left;
    cursor: pointer;
    transition: all 0.18s ease;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;

    &:hover:not(.is-selected) {
      border-color: #fdba74;
      background: #fffbf7;
    }

    &.is-active:not(.is-selected) {
      border-color: #fdba74;
      background: #fff7ed;
    }

    &.is-selected {
      border-color: #f97316;
      border-width: 2px;
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);

      .project-card__name {
        color: #c2410c;
      }
    }

    &__inner {
      flex: 1;
      min-width: 0;
    }

    &__name {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__addr {
      margin-top: 5px;
      font-size: 11px;
      color: var(--el-text-color-secondary);
      line-height: 1.5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__check {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #f97316;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 11px;
    }
  }

  /* ─── Building Panel ──────────────────────────────── */
  .building-panel {
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    background: var(--el-bg-color);
    overflow: hidden;
    display: flex;
    flex-direction: column;

    &__header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-border-color-light);
      background: var(--el-fill-color-extra-light);
      flex-shrink: 0;
    }

    &__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__desc {
      margin-top: 3px;
      font-size: 11px;
      color: var(--el-text-color-secondary);
      line-height: 1.6;
    }
  }

  .building-grid {
    flex: 1;
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 10px;
    align-content: start;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #ddd;
      border-radius: 2px;
    }
  }

  .building-card {
    position: relative;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1.5px solid var(--el-border-color-light);
    background: var(--el-bg-color);
    text-align: left;
    cursor: pointer;
    transition: all 0.18s ease;
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 8px;

    &:hover:not(.is-selected) {
      border-color: #fdba74;
      background: #fffbf7;
    }

    &.is-selected {
      border-color: #f97316;
      border-width: 2px;
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);

      .building-card__name {
        color: #c2410c;
      }

      .building-card__meta {
        color: #ea580c;
      }
    }

    &__inner {
      flex: 1;
      min-width: 0;
    }

    &__name {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 1.5;
    }

    &__meta {
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--el-text-color-secondary);
      transition: color 0.18s;
    }

    &__check {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #f97316;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 11px;
      margin-top: 1px;
    }
  }

  .meta-item {
    display: inline;
  }

  .meta-sep {
    color: var(--el-border-color);
  }

  /* ─── Pagination Bar ──────────────────────────────── */
  .pagination-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid var(--el-border-color-light);
    flex-shrink: 0;

    &__total {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }

    :deep(.el-pagination) {
      .el-pager li:not(.is-disabled).is-active {
        background: #f97316;
      }

      .btn-prev,
      .btn-next {
        border-radius: 6px;
      }
    }
  }

  /* ─── Footer ──────────────────────────────────────── */
  .picker-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    &__summary {
      font-size: 13px;
      color: var(--el-text-color-secondary);

      strong {
        color: #f97316;
        font-weight: 700;
      }
    }

    &__actions {
      display: flex;
      gap: 10px;
    }
  }

  /* ─── List Transition ─────────────────────────────── */
  .list-enter-active,
  .list-leave-active {
    transition: all 0.25s ease;
  }

  .list-enter-from {
    opacity: 0;
    transform: translateX(-12px);
  }

  .list-leave-to {
    opacity: 0;
    transform: translateX(12px);
  }
</style>
