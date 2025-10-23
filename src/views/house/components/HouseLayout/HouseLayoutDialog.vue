<script setup lang="ts">
  import { ref, computed } from "vue";
  import { HouseLayoutFormProps } from "./types";
  import { FacilityItemProps, HouseLayoutProps } from "@/types";

  const props = withDefaults(defineProps<HouseLayoutFormProps>(), {});

  const tempSelection = ref<HouseLayoutProps>({
    bedroom: 0,
    livingRoom: 0,
    kitchen: 0,
    bathroom: 0
  });
  // 生成数字数组的辅助函数
  const generateRange = (start: number, end: number): number[] => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // 快捷户型选项
  const quickLayouts = [
    { bedroom: 1, livingRoom: 1, kitchen: 1, bathroom: 1, label: "1室1厅1厨1卫" },
    { bedroom: 2, livingRoom: 1, kitchen: 1, bathroom: 1, label: "2室1厅1厨1卫" },
    { bedroom: 3, livingRoom: 2, kitchen: 1, bathroom: 2, label: "3室2厅1厨2卫" },
    { bedroom: 4, livingRoom: 2, kitchen: 1, bathroom: 2, label: "4室2厅1厨2卫" }
  ];

  // 自定义输入的数量范围
  const bedroomRange = generateRange(1, 99);
  const livingRoomRange = generateRange(0, 30);
  const kitchenRange = generateRange(0, 30);
  const bathroomRange = generateRange(0, 30);

  // 解析现有的户型字符串
  const parseLayout = (layout: HouseLayoutProps): void => {
    if (layout == null) {
      tempSelection.value = {
        bedroom: 0,
        livingRoom: 0,
        kitchen: 0,
        bathroom: 0
      };
      return;
    }

    tempSelection.value = {
      bedroom: layout.bedroom !== 0 ? layout.bedroom : 0,
      livingRoom: layout.livingRoom !== 0 ? layout.livingRoom : 0,
      kitchen: layout.kitchen !== 0 ? layout.kitchen : 0,
      bathroom: layout.bathroom !== 0 ? layout.bathroom : 0
    };
  };

  // 初始化数据
  if (props.formInline) {
    parseLayout(props.formInline);
  }

  // 选择快捷户型
  const handleQuickSelect = (layout: (typeof quickLayouts)[0]): void => {
    tempSelection.value.bedroom = layout.bedroom;
    tempSelection.value.livingRoom = layout.livingRoom;
    tempSelection.value.kitchen = layout.kitchen;
    tempSelection.value.bathroom = layout.bathroom;
  };

  // 检查快捷选项是否选中
  const isQuickLayoutSelected = (layout: (typeof quickLayouts)[0]): boolean => {
    return (
      tempSelection.value.bedroom === layout.bedroom &&
      tempSelection.value.livingRoom === layout.livingRoom &&
      tempSelection.value.kitchen === layout.kitchen &&
      tempSelection.value.bathroom === layout.bathroom
    );
  };

  // 格式化显示文本
  const formatDisplay = computed<string>(() => {
    const { bedroom, livingRoom, kitchen, bathroom } = tempSelection.value;
    const parts: string[] = [];
    if (bedroom > 0) parts.push(`${bedroom}室`);
    if (livingRoom > 0) parts.push(`${livingRoom}厅`);
    if (kitchen > 0) parts.push(`${kitchen}厨`);
    if (bathroom > 0) parts.push(`${bathroom}卫`);
    return parts.length > 0 ? parts.join("") : "请选择户型";
  });

  // 重置
  const handleReset = (): void => {
    tempSelection.value = {
      bedroom: 0,
      livingRoom: 0,
      kitchen: 0,
      bathroom: 0
    };
  };

  // 获取选中的户型字符串
  const getRef = (): HouseLayoutProps => {
    let layoutName = "";
    const { bedroom, livingRoom, kitchen, bathroom } = tempSelection.value;
    if (bedroom > 0 || livingRoom > 0 || kitchen > 0 || bathroom > 0) {
      layoutName = `${bedroom}室${livingRoom}厅${kitchen}厨${bathroom}卫`;
    } else {
      return null;
    }

    return {
      layoutName: layoutName,
      bedroom: bedroom,
      livingRoom: livingRoom,
      kitchen: kitchen,
      bathroom: bathroom
    };
  };

  defineExpose({ getRef, handleReset });
</script>

<template>
  <div class="layout-selector-content">
    <!-- 当前选择显示 -->
    <div class="current-selection">
      <span class="label">当前选择：</span>
      <span class="value">{{ formatDisplay }}</span>
    </div>

    <!-- 快捷选项区域 -->
    <div class="quick-options">
      <div class="section-title">快捷选择</div>
      <div class="quick-buttons">
        <el-button v-for="layout in quickLayouts" :key="layout.label" :type="isQuickLayoutSelected(layout) ? 'primary' : 'default'" @click="handleQuickSelect(layout)">
          {{ layout.label }}
        </el-button>
      </div>
    </div>

    <!-- 自定义输入区域 -->
    <div class="custom-section">
      <div class="section-title">自定义选择</div>
      <div class="custom-inputs">
        <el-row :gutter="10">
          <el-col :span="6">
            <div class="input-group">
              <label class="input-label">室</label>
              <el-select v-model="tempSelection.bedroom" placeholder="室" filterable>
                <el-option v-for="num in bedroomRange" :key="num" :label="`${num}室`" :value="num" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="input-group">
              <label class="input-label">厅</label>
              <el-select v-model="tempSelection.livingRoom" placeholder="厅" filterable>
                <el-option v-for="num in livingRoomRange" :key="num" :label="`${num}厅`" :value="num" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="input-group">
              <label class="input-label">厨</label>
              <el-select v-model="tempSelection.kitchen" placeholder="厨" filterable>
                <el-option v-for="num in kitchenRange" :key="num" :label="`${num}厨`" :value="num" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="input-group">
              <label class="input-label">卫</label>
              <el-select v-model="tempSelection.bathroom" placeholder="卫" filterable>
                <el-option v-for="num in bathroomRange" :key="num" :label="`${num}卫`" :value="num" />
              </el-select>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .layout-selector-content {
    padding: 0;
    margin-bottom: 20px;
  }

  .current-selection {
    padding: 8px 10px;
    margin-bottom: 16px;
    font-size: 14px;
    background-color: #ecf5ff;
    border-radius: 4px;
  }

  .current-selection .label {
    margin-right: 8px;
    color: #606266;
  }

  .current-selection .value {
    font-size: 15px;
    font-weight: 600;
  }

  .quick-options {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
  }

  .section-title {
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 500;
    color: #606266;
  }

  .quick-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .custom-section {
    padding-top: 0;
    border-top: none;
  }

  .custom-inputs {
    border-radius: 4px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .input-label {
    font-weight: 500;
    color: #606266;
  }

  :deep(.el-select) {
    width: 100%;
  }
</style>
