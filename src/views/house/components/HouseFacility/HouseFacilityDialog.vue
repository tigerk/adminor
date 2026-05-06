<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import { Minus, Plus } from "@element-plus/icons-vue";
  import { type FacilityFormProps } from "@/views/house/components/HouseFacility/types";
  import { getDictDataByDictCode } from "@/api/sys/dict";
  import type { FacilityItemDto } from "@/types";

  interface FacilityOption {
    label: string;
    value: string;
    fromDict: boolean;
  }

  const props = defineProps<FacilityFormProps>();
  const selectedFacilities = reactive<Record<string, number>>({});
  const facilityOptions = ref<FacilityOption[]>([]);

  const normalizeCount = (count?: string | number) => {
    const value = Number(count);
    return Number.isFinite(value) && value > 0 ? value : 1;
  };

  const seedSelectedFacilities = (facilities: FacilityItemDto[] = []) => {
    Object.keys(selectedFacilities).forEach(key => {
      delete selectedFacilities[key];
    });

    facilities.forEach(item => {
      if (!item?.name) return;
      selectedFacilities[item.name] = normalizeCount(item.count);
    });
  };

  const mergeInitialFacilities = (dictOptions: FacilityOption[]) => {
    const optionMap = new Map<string, FacilityOption>();

    dictOptions.forEach(item => {
      optionMap.set(item.value, item);
    });

    (props.formInline ?? []).forEach(item => {
      if (!item?.name || optionMap.has(item.name)) return;
      optionMap.set(item.name, {
        label: item.name,
        value: item.name,
        fromDict: false
      });
    });

    facilityOptions.value = Array.from(optionMap.values());
  };

  seedSelectedFacilities(props.formInline ?? []);

  onMounted(() => {
    getDictDataByDictCode({
      dictCode: "house_facilities"
    }).then(res => {
      const dictOptions = (res.data ?? []).map(item => ({
        label: item.name,
        value: item.value,
        fromDict: true
      }));
      mergeInitialFacilities(dictOptions);
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
    return Object.prototype.hasOwnProperty.call(selectedFacilities, value);
  };

  // 获取数量
  const getCount = (value: string) => {
    return selectedFacilities[value] || 1;
  };

  // 全选状态
  const isAllSelected = () => {
    return facilityOptions.value.length > 0 && facilityOptions.value.every(option => isSelected(option.value));
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
      <div v-for="option in facilityOptions" :key="option.value" class="facility-item">
        <el-checkbox :model-value="isSelected(option.value)" @change="toggleFacility(option.value)">
          <span class="facility-item__label">{{ option.label }}</span>
          <el-tag v-if="!option.fromDict" class="facility-item__legacy" size="small" type="warning" effect="plain">未入字典</el-tag>
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

  .facility-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .facility-item:hover {
    background: var(--el-fill-color);
  }

  .facility-item__label {
    display: inline-flex;
    align-items: center;
  }

  .facility-item__legacy {
    margin-left: 6px;
    vertical-align: middle;
  }

  .count-control {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-left: 12px;
  }

  :deep(.count-control .el-button) {
    width: 20px;
    height: 20px;
    min-height: 20px;
    padding: 0;
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
    min-width: 20px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    text-align: center;
  }

  .dialog-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  :deep(.el-checkbox) {
    margin-right: 0;
  }

  :deep(.el-checkbox__label) {
    padding-left: 8px;
    font-size: 14px;
  }
</style>
