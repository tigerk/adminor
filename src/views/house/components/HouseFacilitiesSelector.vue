<script setup lang="ts">
  import { ref, reactive, watch } from "vue";
  import { ElMessage } from "element-plus";

  interface FacilityItem {
    name: string;
    count: number;
  }

  interface Props {
    modelValue: boolean;
    facilities?: FacilityItem[];
  }

  interface Emits {
    (e: "update:modelValue", value: boolean): void;
    (e: "confirm", facilities: FacilityItem[]): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    facilities: () => []
  });

  const emit = defineEmits<Emits>();

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

  // 存储选中的配置及其数量
  const selectedFacilities = reactive<Record<string, number>>({});

  // 初始化已选配置
  watch(
    () => props.facilities,
    newVal => {
      if (newVal && newVal.length > 0) {
        Object.keys(selectedFacilities).forEach(key => {
          delete selectedFacilities[key];
        });
        newVal.forEach(item => {
          selectedFacilities[item.name] = item.count;
        });
      }
    },
    { immediate: true }
  );

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

  // 关闭对话框
  const handleClose = () => {
    emit("update:modelValue", false);
  };

  // 取消
  const handleCancel = () => {
    handleClose();
  };

  // 保存
  const handleConfirm = () => {
    const result: FacilityItem[] = Object.entries(selectedFacilities).map(([name, count]) => ({
      name,
      count
    }));

    emit("confirm", result);
    emit("update:modelValue", false);
    ElMessage.success("保存成功");
  };

  // 判断是否选中
  const isSelected = (value: string) => {
    return selectedFacilities.hasOwnProperty(value);
  };

  // 获取数量
  const getCount = (value: string) => {
    return selectedFacilities[value] || 1;
  };
</script>

<template>
  <el-dialog :model-value="modelValue" title="编辑房源配置" width="800px" @close="handleClose">
    <div class="facilities-container">
      <h4 class="section-title">物品配置</h4>
      <div class="facilities-grid">
        <div v-for="option in facilityOptions" :key="option.value" class="facility-item">
          <el-checkbox :model-value="isSelected(option.value)" @change="toggleFacility(option.value)">
            {{ option.label }}
          </el-checkbox>

          <div v-if="isSelected(option.value)" class="count-control">
            <el-button size="small" circle :disabled="getCount(option.value) <= 1" @click="decreaseCount(option.value)">
              <span class="control-icon">−</span>
            </el-button>
            <span class="count-text">{{ getCount(option.value) }}</span>
            <el-button size="small" circle @click="increaseCount(option.value)">
              <span class="control-icon">+</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取 消</el-button>
        <el-button type="primary" @click="handleConfirm">保 存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
  .facilities-container {
    padding: 10px 0;
  }

  .section-title {
    margin: 0 0 20px;
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

  .count-control .el-button {
    width: 24px;
    height: 24px;
    min-height: 24px;
    padding: 0;
    font-size: 16px;
    line-height: 1;
  }

  .control-icon {
    display: inline-block;
    font-size: 14px;
    font-weight: bold;
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
