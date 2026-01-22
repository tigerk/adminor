<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import { Minus, Plus } from "@element-plus/icons-vue";
  import { type FacilityFormProps } from "@/views/house/components/HouseFacility/types";
  import { getDictDataByDictCode } from "@/api/sys/dict";

  const props = withDefaults(defineProps<FacilityFormProps>(), {});
  const facilities = reactive(props.formInline);

  // 存储选中的配置及其数量
  const selectedFacilities = reactive<Record<string, number>>({});

  if (facilities) {
    // 清空现有数据
    Object.keys(selectedFacilities).forEach(key => {
      delete selectedFacilities[key];
    });

    // 加载传入的数据
    if (facilities && facilities.length > 0) {
      facilities.forEach(item => {
        selectedFacilities[item.name] = item.count;
      });
    }
  }

  const facilityOptions = ref([]);

  onMounted(() => {
    getDictDataByDictCode({
      dictCode: "house_facilities"
    }).then(res => {
      facilityOptions.value = res.data.map(item => ({
        label: item.name,
        value: item.value
      }));
    });
  });

  // 切换选中状态
  const toggleFacility = (value: string) => {
    if (selectedFacilities[value]) {
      delete selectedFacilities[value];
    } else {
      selectedFacilities[value] = 1;
    }
  };

  // 增加数量
  const increaseCount = (value: string) => {
    if (selectedFacilities[value]) {
      selectedFacilities[value]++;
    }
  };

  // 减少数量
  const decreaseCount = (value: string) => {
    if (selectedFacilities[value] && selectedFacilities[value] > 1) {
      selectedFacilities[value]--;
    }
  };

  // 判断是否选中
  const isSelected = (value: string) => {
    return selectedFacilities.hasOwnProperty(value);
  };

  // 获取数量
  const getCount = (value: string) => {
    return selectedFacilities[value] || 1;
  };

  // 全选状态
  const isAllSelected = () => {
    return facilityOptions.value.every(option => selectedFacilities.hasOwnProperty(option.value));
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (isAllSelected()) {
      // 取消全选
      facilityOptions.value.forEach(option => {
        delete selectedFacilities[option.value];
      });
    } else {
      // 全选
      facilityOptions.value.forEach(option => {
        if (!selectedFacilities[option.value]) {
          selectedFacilities[option.value] = 1;
        }
      });
    }
  };

  function getRef() {
    return selectedFacilities;
  }

  defineExpose({ getRef });
</script>

<template>
  <div class="facilities-container">
    <div class="header-section">
      <h4 class="section-title">物品配置</h4>
      <el-checkbox :model-value="isAllSelected()" @change="toggleSelectAll">全选</el-checkbox>
    </div>
    <div class="facilities-grid">
      <div v-for="option in facilityOptions" :key="option.value" class="facility-item" :class="{ 'is-selected': isSelected(option.value) }">
        <el-checkbox :model-value="isSelected(option.value)" @change="toggleFacility(option.value)">
          {{ option.label }}
        </el-checkbox>

        <div v-if="isSelected(option.value)" class="count-control">
          <el-button size="small" circle :disabled="getCount(option.value) <= 1" @click="decreaseCount(option.value)">
            <el-icon>
              <Minus />
            </el-icon>
          </el-button>
          <span class="count-text">{{ getCount(option.value) }}</span>
          <el-button size="small" circle @click="increaseCount(option.value)">
            <el-icon>
              <Plus />
            </el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .facilities-container {
    padding: 10px 0;
    margin-bottom: 15px;
  }

  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .section-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .facilities-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px 20px;
  }

  @media (max-width: 1200px) {
    .facilities-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .facilities-grid {
      grid-template-columns: 1fr;
    }
  }

  .facility-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .facility-item:hover {
    background: var(--el-fill-color);
    border-color: var(--el-border-color);
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.06);
  }

  .facility-item.is-selected {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }

  .facility-item.is-selected:hover {
    background: var(--el-color-primary-light-8);
    border-color: var(--el-color-primary-light-3);
  }

  /* 暗色主题额外适配 */
  html.dark .facility-item {
    background: var(--el-fill-color-dark);
    border-color: var(--el-border-color);
  }

  html.dark .facility-item:hover {
    background: var(--el-fill-color);
    border-color: var(--el-border-color-light);
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.3);
  }

  html.dark .facility-item.is-selected {
    background: rgba(var(--el-color-primary-rgb), 0.15);
    border-color: var(--el-color-primary-light-5);
  }

  html.dark .facility-item.is-selected:hover {
    background: rgba(var(--el-color-primary-rgb), 0.25);
    border-color: var(--el-color-primary-light-3);
  }

  .count-control {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-left: 12px;
  }

  :deep(.count-control .el-button) {
    width: 24px;
    height: 24px;
    min-height: 24px;
    padding: 0;
    background: var(--el-fill-color);
    border-color: var(--el-border-color);
  }

  :deep(.count-control .el-button:hover) {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }

  :deep(.count-control .el-button.is-disabled) {
    background: var(--el-fill-color-lighter);
    border-color: var(--el-border-color-lighter);
    color: var(--el-text-color-disabled);
  }

  :deep(.count-control .el-button.is-circle) {
    border-radius: 50%;
  }

  :deep(.count-control .el-icon) {
    width: 12px;
    height: 12px;
    font-size: 12px;
  }

  .count-text {
    min-width: 24px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    text-align: center;
  }

  :deep(.el-checkbox) {
    margin-right: 0;
  }

  :deep(.el-checkbox__label) {
    padding-left: 8px;
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
    color: var(--el-color-primary);
  }
</style>
