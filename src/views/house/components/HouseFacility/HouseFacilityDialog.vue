<script setup lang="ts">
  import { reactive, watch } from "vue";
  import { Plus, Minus } from "@element-plus/icons-vue";
  import { type FacilityFormProps } from "@/views/house/components/HouseFacility/types";

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

  // 配置项列表
  const facilityOptions = [
    { label: "空调", value: "空调" },
    { label: "冰箱", value: "冰箱" },
    { label: "洗衣机", value: "洗衣机" },
    { label: "微波炉", value: "微波炉" },
    { label: "饮水机", value: "饮水机" },
    { label: "电视", value: "电视" },
    { label: "电磁炉", value: "电磁炉" },
    { label: "油烟机", value: "油烟机" },
    { label: "热水器", value: "热水器" },
    { label: "燃气灶", value: "燃气灶" },
    { label: "暖气", value: "暖气" },
    { label: "座椅", value: "座椅" },
    { label: "床", value: "床" },
    { label: "书桌", value: "书桌" },
    { label: "沙发", value: "沙发" },
    { label: "衣柜", value: "衣柜" },
    { label: "床头柜", value: "床头柜" },
    { label: "灯", value: "灯" },
    { label: "窗帘", value: "窗帘" },
    { label: "字画", value: "字画" },
    { label: "办公桌", value: "办公桌" },
    { label: "办公椅", value: "办公椅" },
    { label: "会议桌", value: "会议桌" },
    { label: "WIFI", value: "WIFI" },
    { label: "智能门锁", value: "智能门锁" }
  ];

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
    return facilityOptions.every(option => selectedFacilities.hasOwnProperty(option.value));
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (isAllSelected()) {
      // 取消全选
      facilityOptions.forEach(option => {
        delete selectedFacilities[option.value];
      });
    } else {
      // 全选
      facilityOptions.forEach(option => {
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
          {{ option.label }}
        </el-checkbox>

        <div v-if="isSelected(option.value)" class="count-control">
          <el-button size="small" circle :disabled="getCount(option.value) <= 1" @click="decreaseCount(option.value)">
            <el-icon><Minus /></el-icon>
          </el-button>
          <span class="count-text">{{ getCount(option.value) }}</span>
          <el-button size="small" circle @click="increaseCount(option.value)">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .facilities-container {
    padding: 10px 0;
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
    color: #303133;
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
    background: #f5f7fa;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .facility-item:hover {
    background: #ecf5ff;
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
    color: #303133;
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
