<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import { getDictDataByDictCode } from "@/api/sys/dict";
  import { useFocusHouse } from "@/views/house/focus/focusHouse/utils/hook";
  import type { FormInstance } from "element-plus";
  import { ElEmpty, ElImage, ElSkeleton, ElTag } from "element-plus";
  import { IconifyIconOnline } from "@/components/ReIcon";
  import { Setting } from "@element-plus/icons-vue";
  import { ELECTRICITY_TYPE_OPTIONS, getOptionByCode, HEATING_TYPE_OPTIONS, WATER_TYPE_OPTIONS } from "@/constants";
  import { useFocusEdit } from "@/views/house/components/FocusCreate/utils/hook";

  defineOptions({
    name: "FocusHouse"
  });

  const { queryForm, loading, focusList, focusOptions, pagination, onFocusHouseSearch, handleSizeChange, handleCurrentChange, handleEditFocus } = useFocusHouse();
  const { openFocusEditDialog } = useFocusEdit();

  // 表单引用
  const searchFormRef = ref<FormInstance>();
  // 滚动容器引用
  const scrollContainer = ref<HTMLElement>();
  const loadingMore = ref(false);
  const tagLabelMap = ref<Record<string, string>>({});
  const noMore = computed(() => {
    return pagination.currentPage * pagination.pageSize >= pagination.total;
  });

  // 处理滚动加载更多
  const handleScroll = async (e: Event) => {
    const target = e.target as HTMLElement;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    // 滚动到底部前100px时触发加载
    if (scrollBottom < 100 && !loadingMore.value && !noMore.value && !loading.value) {
      loadingMore.value = true;
      pagination.currentPage++;
      await onFocusHouseSearch();
      loadingMore.value = false;
    }
  };

  // 搜索重置到第一页
  const handleSearch = () => {
    pagination.currentPage = 1;
    focusList.value = [];
    onFocusHouseSearch();
  };

  // 重置表单
  const handleReset = () => {
    searchFormRef.value?.resetFields();
    pagination.currentPage = 1;
    focusList.value = [];
    onFocusHouseSearch();
  };

  // 获取设施标签文本
  const getFacilityLabel = (facility: string) => {
    return facility;
  };

  const getTagLabel = (tag: string) => {
    return tagLabelMap.value[String(tag)] || tag;
  };

  // 获取水电类型文本
  const getWaterLabel = (type: string) => {
    const option = getOptionByCode([...WATER_TYPE_OPTIONS], type);
    return option?.label || type;
  };

  const getElectricityLabel = (type: string) => {
    const option = getOptionByCode([...ELECTRICITY_TYPE_OPTIONS], type);
    return option?.label || type;
  };

  // 获取供暖类型文本
  const getHeatingLabel = (type: string) => {
    const option = getOptionByCode([...HEATING_TYPE_OPTIONS], type);
    return option?.label || type;
  };

  onMounted(async () => {
    const resp = await getDictDataByDictCode({ dictCode: "focus_tags" });
    if (resp.code === 0) {
      const map: Record<string, string> = {};
      (resp.data || []).forEach((item: any) => {
        map[String(item.value ?? item.id ?? item.name)] = item.name;
      });
      tagLabelMap.value = map;
    }
    handleSearch();
  });
</script>

<template>
  <div class="focus-house-container">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <div class="search-header-flex">
        <el-form ref="searchFormRef" :model="queryForm" inline>
          <el-form-item label="关键词" prop="keywords">
            <el-input v-model="queryForm.keywords" placeholder="请输入项目名称或编号" clearable style="width: 200px" @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item label="项目" prop="leaseModeId">
            <el-select v-model="queryForm.leaseModeId" placeholder="请选择项目" clearable style="width: 200px">
              <el-option v-for="item in focusOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <IconifyIconOnline icon="ep:search" class="mr-1" />
              搜索
            </el-button>
            <el-button @click="handleReset">
              <IconifyIconOnline icon="ep:refresh" class="mr-1" />
              重置
            </el-button>
          </el-form-item>
        </el-form>

        <div class="action-buttons">
          <el-button color="#626aef" :dark="true" @click="openFocusEditDialog('新增', undefined, onFocusHouseSearch)">添加房源</el-button>
        </div>
      </div>
    </el-card>

    <!-- 卡片列表 -->
    <div ref="scrollContainer" class="card-list-container" @scroll="handleScroll">
      <div v-if="loading && focusList.length === 0" class="skeleton-container">
        <el-skeleton v-for="i in 6" :key="i" animated class="skeleton-card">
          <template #template>
            <el-skeleton-item variant="image" style="width: 100%; height: 200px" />
            <div style="padding: 14px">
              <el-skeleton-item variant="h3" style="width: 50%" />
              <el-skeleton-item variant="text" style="margin-top: 10px" />
              <el-skeleton-item variant="text" style="margin-top: 10px" />
            </div>
          </template>
        </el-skeleton>
      </div>

      <div v-else-if="focusList.length > 0" class="card-grid">
        <el-card v-for="item in focusList" :key="item.id" class="focus-card" shadow="hover">
          <!-- 项目图片 -->
          <div class="card-image">
            <el-image v-if="item.imageList && item.imageList.length > 0" :src="item.imageList[0]" fit="cover" style="width: 100%; height: 100%">
              <template #error>
                <div class="image-error">
                  <IconifyIconOnline icon="ep:picture" :style="{ fontSize: '48px' }" class="image-error-icon" />
                </div>
              </template>
            </el-image>
            <div v-else class="image-placeholder">
              <IconifyIconOnline icon="ep:picture" :style="{ fontSize: '48px' }" class="image-placeholder-icon" />
            </div>

            <!-- 出租率标签 -->
            <div class="occupancy-badge">
              <span>出租率: {{ (item.focusTotal.occupancyRate * 100).toFixed(1) }}%</span>
            </div>
          </div>

          <!-- 项目信息 -->
          <div class="card-content">
            <div class="card-header">
              <h3 class="card-title">{{ item.focusName }}</h3>
              <span class="card-code">{{ item.focusCode }}</span>
            </div>

            <!-- 小区信息 -->
            <div class="info-row">
              <IconifyIconOnline icon="ep:location" class="info-icon" />
              <span class="info-text">{{ item.community?.name }}</span>
            </div>
            <div class="info-row">
              <IconifyIconOnline icon="ep:map-location" class="info-icon" />
              <span class="info-text">{{ item.community?.address }}</span>
            </div>

            <!-- 房间统计 -->
            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-label">总房间</span>
                <span class="stat-value">{{ item.focusTotal.totalRoomCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已出租</span>
                <span class="stat-value">{{ item.focusTotal.totalRentedRoomCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">可用房间</span>
                <span class="stat-value">{{ item.focusTotal.totalRoomCount - item.focusTotal.totalRentedRoomCount }}</span>
              </div>
            </div>

            <!-- 标签 -->
            <div class="tags-row">
              <el-tag v-if="!item.tags || item.tags.length == 0" class="empty-tag">暂无标签</el-tag>
              <el-tag v-for="tag in item.tags" :key="tag" size="small" type="primary" effect="plain">
                {{ getTagLabel(tag) }}
              </el-tag>
            </div>

            <!-- 设施信息 -->
            <div class="facilities-row">
              <IconifyIconOnline icon="ep:setting" class="facilities-icon" />
              <div class="facilities-tags">
                <el-tag v-for="facility in item.facilityNames" :key="facility" size="small" effect="plain">
                  {{ getFacilityLabel(facility) }}
                </el-tag>
                <el-tag v-if="!item.facilities || item.facilities.length == 0" class="empty-tag">暂无设施</el-tag>
              </div>
            </div>

            <!-- 基础设施 -->
            <div class="utilities-row">
              <div class="utility-item">
                <IconifyIconOnline icon="solar:water-broken" />
                <span>水: {{ getWaterLabel(item.water) }}</span>
              </div>
              <div class="utility-item">
                <IconifyIconOnline icon="ep:lightning" />
                <span>电: {{ getElectricityLabel(item.electricity) }}</span>
              </div>
              <div class="utility-item">
                <IconifyIconOnline icon="ep:sunny" />
                <span>{{ getHeatingLabel(item.heating) }}</span>
              </div>
              <div v-if="item.hasElevator" class="utility-item">
                <IconifyIconOnline icon="material-symbols:elevator" />
                <span>电梯</span>
              </div>
              <div v-if="item.hasGas" class="utility-item">
                <IconifyIconOnline icon="ep:food" />
                <span>燃气</span>
              </div>
            </div>

            <!-- 联系方式 -->
            <div class="contact-row">
              <div class="contact-info">
                <IconifyIconOnline icon="ep:phone" class="contact-icon" />
                <span>{{ item.storePhone }}</span>
              </div>
              <el-button link type="primary" @click="handleEditFocus(item.id)">
                <el-icon>
                  <Setting />
                </el-icon>
                <span>管理项目</span>
              </el-button>
            </div>

            <!-- 更新时间 -->
            <div class="update-time">更新于: {{ item.updateTime }}</div>
          </div>
        </el-card>
      </div>

      <el-empty v-else description="暂无数据" />

      <!-- 加载更多提示 -->
      <div v-if="loadingMore" class="loading-more">
        <el-icon class="is-loading">
          <IconifyIconOnline icon="ep:loading" />
        </el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="noMore && focusList.length > 0" class="no-more">没有更多数据了</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .search-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .action-buttons {
    margin-bottom: 18px;
  }

  .focus-house-container {
    height: 100%;
    margin: 0 !important;
    display: flex;
    flex-direction: column;
  }

  .search-card {
    margin: 16px;
    border-radius: 8px;

    :deep(.el-card__body) {
      padding: 16px 16px 0 16px;
    }
  }

  .card-list-container {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px 16px;
  }

  .skeleton-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 16px;
  }

  .skeleton-card {
    border-radius: 8px;
    overflow: hidden;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 16px;
  }

  .focus-card {
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
    }

    :deep(.el-card__body) {
      padding: 0;
    }
  }

  .card-image {
    position: relative;
    width: 100%;
    height: 200px;
    background: var(--el-fill-color-lighter);
  }

  .image-placeholder,
  .image-error {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-fill-color-lighter);
  }

  .image-placeholder-icon,
  .image-error-icon {
    color: var(--el-text-color-placeholder);
  }

  .occupancy-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    backdrop-filter: blur(4px);
  }

  .card-content {
    padding: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .card-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .card-code {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-left: 8px;
  }

  .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    color: var(--el-text-color-regular);
    font-size: 14px;
  }

  .info-icon {
    margin-right: 6px;
    color: var(--el-color-primary);
    font-size: 16px;
  }

  .info-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stats-row {
    display: flex;
    justify-content: space-around;
    padding: 12px 0;
    margin: 12px 0;
    background: var(--el-fill-color-light);
    border-radius: 6px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 12px 0;
  }

  .empty-tag {
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
    border-color: var(--el-border-color-lighter);
  }

  .facilities-row {
    display: flex;
    align-items: flex-start;
    margin: 12px 0;
    padding: 8px;
    background: var(--el-color-primary-light-9);
    border-radius: 6px;
    border: 1px solid var(--el-color-primary-light-8);
  }

  .facilities-icon {
    margin-right: 8px;
    margin-top: 2px;
    color: var(--el-color-primary);
    font-size: 16px;
  }

  .facilities-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;
  }

  .utilities-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin: 12px 0;
    padding: 8px;
    background: var(--el-color-danger-light-9);
    border-radius: 6px;
    border: 1px solid var(--el-color-danger-light-8);
  }

  .utility-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--el-text-color-regular);

    .iconify {
      font-size: 14px;
      color: var(--el-color-danger);
    }
  }

  .contact-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 12px 0;
    color: var(--el-text-color-regular);
    font-size: 14px;
  }

  .contact-info {
    display: flex;
    align-items: center;
  }

  .contact-icon {
    margin-right: 6px;
    color: var(--el-color-success);
    font-size: 16px;
  }

  .update-time {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    text-align: right;
    margin-top: 8px;
  }

  .loading-more,
  .no-more {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    gap: 8px;
  }

  .loading-more .is-loading {
    animation: rotating 2s linear infinite;
  }

  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .card-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
