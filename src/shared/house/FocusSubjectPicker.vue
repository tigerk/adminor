<template>
  <el-dialog
    v-model="visible"
    title="选择集中式项目"
    width="78vw"
    append-to-body
    :close-on-click-modal="false"
    :align-center="true"
    :draggable="true"
    :show-close="true"
    class="focus-subject-picker-dialog"
  >
    <div class="focus-subject-picker">
      <div class="selected-panel">
        <div class="selected-panel__header">
          <div class="selected-panel__header-left">
            <span class="selected-panel__label">已选项目 / 楼栋</span>
            <span class="selected-panel__badge" :class="{ active: selectedRows.length > 0 }">{{ selectedRows.length }}</span>
          </div>
          <button v-if="selectedRows.length > 0" class="clear-btn" @click="clearAllSelection">清空全部</button>
        </div>

        <div class="selected-panel__body">
          <div v-if="selectedRows.length" class="selected-list">
            <div v-for="row in selectedRows" :key="`${row.subjectType}-${row.subjectId}`" class="selected-card">
              <div class="selected-card__dot" />
              <div class="selected-card__info">
                <div class="selected-card__name">
                  <el-tag size="small" effect="plain">{{ row.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS.value ? "项目" : "楼栋" }}</el-tag>
                  <span>{{ row.subjectName }}</span>
                </div>
                <div class="selected-card__addr">{{ row.address || "暂无地址" }}</div>
              </div>
              <button class="selected-card__remove" @click="handleRemoveTag(row)">
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </div>
          <div v-else class="empty-state">
            <p class="empty-state__text">暂未选择集中式项目</p>
            <p class="empty-state__hint">右侧可直接选择整项目，也可以选择项目下的多个楼栋</p>
          </div>
        </div>
      </div>

      <div class="main-panel">
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
          <div v-loading="loading" class="project-panel">
            <div class="project-panel__header">项目列表</div>
            <div v-if="projectList.length" class="project-list">
              <button
                v-for="project in projectList"
                :key="project.subjectId"
                type="button"
                :class="['project-card', { 'is-active': activeProjectId === project.subjectId }]"
                @click="handleProjectClick(project)"
              >
                <div class="project-card__top">
                  <el-checkbox
                    :model-value="isProjectSelected(project.subjectId)"
                    @click.stop
                    @change="toggleProject(project)"
                  />
                  <div class="project-card__name">{{ project.subjectName }}</div>
                </div>
                <div class="project-card__addr">{{ project.address || "暂无地址" }}</div>
              </button>
            </div>
            <el-empty v-else description="暂无可选项目" :image-size="80" />
          </div>

          <div v-loading="buildingLoading" class="building-panel">
            <div class="building-panel__header">
              <div>
                <div class="building-panel__title">{{ activeProjectName || "请选择左侧项目" }}</div>
                <div class="building-panel__desc">整项目可直接勾选；如按楼栋签约，可在这里勾选多个楼栋。</div>
              </div>
            </div>
            <div v-if="buildingRows.length" class="building-grid">
              <div v-for="building in buildingRows" :key="building.subjectId" class="building-card">
                <div class="building-card__top">
                  <el-checkbox :model-value="isBuildingSelected(building.subjectId)" @change="toggleBuilding(building)" />
                  <div class="building-card__name">{{ building.subjectName }}</div>
                </div>
                <div class="building-card__meta">
                  <span>{{ building.floorTotal || 0 }} 层</span>
                  <span>每层 {{ building.houseCountPerFloor || 0 }} 套</span>
                </div>
              </div>
            </div>
            <el-empty v-else :description="activeProjectId ? '当前项目暂无楼栋' : '请先选择项目'" :image-size="90" />
          </div>
        </div>

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
  import { Close, Refresh, Search } from "@element-plus/icons-vue";
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
      selectedRows.value = selectedRows.value.filter(item => !(item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS_BUILDING.value && item.subjectId === building.subjectId));
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
    }

    .el-dialog__close {
      color: var(--el-text-color-regular);
      font-size: 18px;
    }

    .el-dialog__body,
    .el-dialog__footer {
      padding: 0 !important;
    }
  }

  .focus-subject-picker {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    min-height: 620px;
  }

  .selected-panel {
    border-right: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-extra-light);
    display: flex;
    flex-direction: column;
  }

  .selected-panel__header {
    padding: 18px 20px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .selected-panel__header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .selected-panel__label {
    font-size: 15px;
    font-weight: 600;
  }

  .selected-panel__badge {
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .selected-panel__badge.active {
    background: #f97316;
    color: #fff;
  }

  .clear-btn {
    border: none;
    background: transparent;
    color: var(--el-color-primary);
    cursor: pointer;
  }

  .selected-panel__body {
    flex: 1;
    padding: 16px;
    overflow: auto;
  }

  .selected-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .selected-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }

  .selected-card__dot {
    width: 7px;
    height: 7px;
    margin-top: 7px;
    border-radius: 50%;
    background: #f97316;
    flex-shrink: 0;
  }

  .selected-card__info {
    min-width: 0;
    flex: 1;
  }

  .selected-card__name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.5;
  }

  .selected-card__addr {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }

  .selected-card__remove {
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--el-text-color-secondary);
  }

  .empty-state {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--el-text-color-secondary);
  }

  .empty-state__text {
    font-size: 14px;
    font-weight: 600;
  }

  .empty-state__hint {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.6;
  }

  .main-panel {
    display: flex;
    flex-direction: column;
    padding: 18px 20px;
    min-width: 0;
  }

  .search-bar {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .search-bar__input-wrap {
    flex: 1;
    position: relative;
  }

  .search-bar__icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    color: var(--el-text-color-secondary);
  }

  .search-bar__input :deep(.el-input__wrapper) {
    padding-left: 34px;
  }

  .main-layout {
    margin-top: 16px;
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 16px;
    min-height: 0;
    flex: 1;
  }

  .project-panel,
  .building-panel {
    border: 1px solid var(--el-border-color-light);
    border-radius: 16px;
    background: var(--el-bg-color);
    overflow: hidden;
  }

  .project-panel__header,
  .building-panel__header {
    padding: 14px 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-extra-light);
    font-size: 14px;
    font-weight: 600;
  }

  .building-panel__title {
    font-size: 14px;
    font-weight: 600;
  }

  .building-panel__desc {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }

  .project-list {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 430px;
    overflow: auto;
  }

  .project-card {
    padding: 12px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
    text-align: left;
    cursor: pointer;
  }

  .project-card.is-active {
    border-color: #f97316;
    background: #fff7ed;
  }

  .project-card__top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .project-card__name {
    font-size: 13px;
    font-weight: 600;
  }

  .project-card__addr {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }

  .building-grid {
    padding: 14px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .building-card {
    padding: 12px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }

  .building-card__top {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .building-card__name {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.6;
  }

  .building-card__meta {
    margin-top: 8px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .pagination-bar {
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .picker-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-top: 1px solid var(--el-border-color-light);
  }

  .picker-footer__actions {
    display: flex;
    gap: 10px;
  }

  .btn {
    border: none;
    border-radius: 10px;
    padding: 0 16px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-weight: 600;
  }

  .btn--ghost {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
  }

  .btn--primary {
    background: #f97316;
    color: #fff;
  }

  .btn--confirm:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn__count {
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.24);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
</style>
