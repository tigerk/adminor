<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import { useFocusHouse } from "@/views/house/focus/focusHouse/utils/hook";
  import type { FormInstance } from "element-plus";
  import { ElEmpty, ElImage, ElSkeleton, ElTag } from "element-plus";
  import { IconifyIconOnline } from "@/components/ReIcon";

  defineOptions({
    name: "FocusHouse"
  });

  const { queryForm, loading, focusList, focusOptions, pagination, onFocusHouseSearch, handleSizeChange, handleCurrentChange } = useFocusHouse();

  // 表单引用
  const searchFormRef = ref<FormInstance>();
  // 滚动容器引用
  const scrollContainer = ref<HTMLElement>();
  const loadingMore = ref(false);
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
    const facilityMap = {
      laundry: "洗衣机",
      airCondition: "空调",
      oven: "烤箱",
      kitchen: "厨房",
      fridge: "冰箱",
      security24: "24小时安保"
    };
    return facilityMap[facility] || facility;
  };

  // 获取水电类型文本
  const getUtilityLabel = (type: string) => {
    const utilityMap = {
      commercial: "商业",
      residential: "民用"
    };
    return utilityMap[type] || type;
  };

  // 获取供暖类型文本
  const getHeatingLabel = (type: string) => {
    const heatingMap = {
      central: "集中供暖",
      individual: "自供暖"
    };
    return heatingMap[type] || type;
  };

  onMounted(() => {
    handleSearch();
  });
</script>

<template>
  <div class="focus-house-container">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
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
                  <IconifyIconOnline icon="ep:picture" :style="{ fontSize: '48px', color: '#ccc' }" />
                </div>
              </template>
            </el-image>
            <div v-else class="image-placeholder">
              <IconifyIconOnline icon="ep:picture" :style="{ fontSize: '48px', color: '#ccc' }" />
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
              <el-tag v-if="!item.tags || item.tags.length == 0">暂无标签</el-tag>
              <el-tag v-for="tag in item.tags" :key="tag" size="small" type="primary" effect="plain">
                {{ tag }}
              </el-tag>
            </div>

            <!-- 设施信息 -->
            <div class="facilities-row">
              <IconifyIconOnline icon="ep:setting" class="facilities-icon" />
              <div class="facilities-tags">
                <el-tag v-for="facility in item.facilities" :key="facility" size="small" effect="plain">
                  {{ getFacilityLabel(facility) }}
                </el-tag>
                <el-tag v-if="!item.facilities || item.facilities.length == 0">暂无设施</el-tag>
              </div>
            </div>

            <!-- 基础设施 -->
            <div class="utilities-row">
              <div class="utility-item">
                <IconifyIconOnline icon="ep:water-cup" />
                <span>水: {{ getUtilityLabel(item.water) }}</span>
              </div>
              <div class="utility-item">
                <IconifyIconOnline icon="ep:lightning" />
                <span>电: {{ getUtilityLabel(item.electricity) }}</span>
              </div>
              <div class="utility-item">
                <IconifyIconOnline icon="ep:sunny" />
                <span>{{ getHeatingLabel(item.heating) }}</span>
              </div>
              <div v-if="item.hasElevator" class="utility-item">
                <IconifyIconOnline icon="ep:top" />
                <span>电梯</span>
              </div>
              <div v-if="item.hasGas" class="utility-item">
                <IconifyIconOnline icon="ep:food" />
                <span>燃气</span>
              </div>
            </div>

            <!-- 联系方式 -->
            <div class="contact-row">
              <IconifyIconOnline icon="ep:phone" class="contact-icon" />
              <span>{{ item.storePhone }}</span>
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
  .focus-house-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f5f7fa;
  }

  .search-card {
    margin-bottom: 16px;
    border-radius: 8px;

    :deep(.el-card__body) {
      padding: 16px;
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
    background: #f5f7fa;
  }

  .image-placeholder,
  .image-error {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
  }

  .occupancy-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
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
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .card-code {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
  }

  .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    color: #606266;
    font-size: 14px;
  }

  .info-icon {
    margin-right: 6px;
    color: #409eff;
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
    background: #f5f7fa;
    border-radius: 6px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #409eff;
  }

  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 12px 0;
  }

  .facilities-row {
    display: flex;
    align-items: flex-start;
    margin: 12px 0;
    padding: 8px;
    background: #f0f9ff;
    border-radius: 6px;
  }

  .facilities-icon {
    margin-right: 8px;
    margin-top: 2px;
    color: #409eff;
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
    background: #fef0f0;
    border-radius: 6px;
  }

  .utility-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #606266;

    .iconify {
      font-size: 14px;
      color: #f56c6c;
    }
  }

  .contact-row {
    display: flex;
    align-items: center;
    margin: 12px 0;
    color: #606266;
    font-size: 14px;
  }

  .contact-icon {
    margin-right: 6px;
    color: #67c23a;
    font-size: 16px;
  }

  .update-time {
    font-size: 12px;
    color: #c0c4cc;
    text-align: right;
    margin-top: 8px;
  }

  .loading-more,
  .no-more {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    color: #909399;
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
