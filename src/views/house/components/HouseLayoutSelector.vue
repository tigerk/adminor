<script setup lang="ts">
  import { ref, computed, nextTick } from "vue";
  import { ArrowDown } from "@element-plus/icons-vue";

  interface LayoutSelection {
    bedroom: number;
    livingRoom: number;
    kitchen: number;
    bathroom: number;
  }

  interface Props {
    modelValue?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: ""
  });

  const emit = defineEmits<{
    "update:modelValue": [value: string];
  }>();

  const dialogVisible = ref<boolean>(false);
  const inputRef = ref();
  const dialogStyle = ref({
    position: "absolute",
    top: "0px",
    left: "0px",
    margin: "0"
  });

  const tempSelection = ref<LayoutSelection>({
    bedroom: 0,
    livingRoom: 0,
    kitchen: 0,
    bathroom: 0
  });

  // 生成数字数组的辅助函数
  const generateRange = (start: number, end: number): number[] => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // 常用户型表格（快捷选择）
  const quickRows = [2, 3, 4, 5, 6]; // 室的数量
  const quickCols = [0, 1, 2, 3, 4]; // 厅的数量

  // 自定义输入的数量范围
  const bedroomRange = generateRange(1, 99); // 1-99室
  const livingRoomRange = generateRange(0, 30); // 0-30厅
  const kitchenRange = generateRange(0, 30); // 0-30厨
  const bathroomRange = generateRange(0, 30); // 0-30卫

  // 解析现有的户型字符串
  const parseLayout = (layout: string): void => {
    if (!layout) {
      tempSelection.value = {
        bedroom: 0,
        livingRoom: 0,
        kitchen: 0,
        bathroom: 0
      };
      return;
    }

    const bedroomMatch = layout.match(/(\d+)室/);
    const livingRoomMatch = layout.match(/(\d+)厅/);
    const kitchenMatch = layout.match(/(\d+)厨/);
    const bathroomMatch = layout.match(/(\d+)卫/);

    tempSelection.value = {
      bedroom: bedroomMatch ? parseInt(bedroomMatch[1]) : 0,
      livingRoom: livingRoomMatch ? parseInt(livingRoomMatch[1]) : 0,
      kitchen: kitchenMatch ? parseInt(kitchenMatch[1]) : 0,
      bathroom: bathroomMatch ? parseInt(bathroomMatch[1]) : 0
    };
  };

  // 计算对话框位置
  const calculateDialogPosition = () => {
    nextTick(() => {
      if (inputRef.value && inputRef.value.$el) {
        const inputEl = inputRef.value.$el;
        const rect = inputEl.getBoundingClientRect();

        // 计算对话框应该出现的位置（在输入框下方）
        dialogStyle.value = {
          position: "fixed",
          top: `${rect.bottom + 5}px`,
          left: `${rect.left}px`,
          margin: "0"
        };
      }
    });
  };

  // 打开对话框
  const handleOpen = (): void => {
    parseLayout(props.modelValue);
    dialogVisible.value = true;
    calculateDialogPosition();
  };

  // 选择户型（室+厅的组合）
  const handleLayoutSelect = (bedroom: number, livingRoom: number): void => {
    tempSelection.value.bedroom = bedroom;
    tempSelection.value.livingRoom = livingRoom;
  };

  // 检查是否选中
  const isLayoutSelected = (bedroom: number, livingRoom: number): boolean => {
    return tempSelection.value.bedroom === bedroom && tempSelection.value.livingRoom === livingRoom;
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

  // 确认
  const handleConfirm = (): void => {
    const { bedroom, livingRoom, kitchen, bathroom } = tempSelection.value;
    if (bedroom > 0 || livingRoom > 0 || kitchen > 0 || bathroom > 0) {
      const layout = `${bedroom}室${livingRoom}厅${kitchen}厨${bathroom}卫`;
      emit("update:modelValue", layout);
    }
    dialogVisible.value = false;
  };
</script>

<template>
  <div>
    <!-- 触发器 -->
    <el-input ref="inputRef" :model-value="modelValue" placeholder="请选择户型" readonly style="cursor: pointer" @click="handleOpen">
      <template #suffix>
        <el-icon class="el-input__icon">
          <ArrowDown />
        </el-icon>
      </template>
    </el-input>

    <!-- 选择对话框 -->
    <el-dialog v-model="dialogVisible" :show-close="true" :close-on-click-modal="false" width="600px" class="layout-selector-dialog" append-to-body>
      <template #header>
        <span class="dialog-title">选择户型</span>
      </template>

      <div class="layout-selector-content">
        <!-- 当前选择显示 -->
        <div class="current-selection">
          <span class="label">当前选择：</span>
          <span class="value">{{ formatDisplay }}</span>
        </div>

        <!-- 自定义输入区域 -->
        <div class="custom-section">
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

      <!-- 底部按钮 -->
      <template #footer>
        <el-space>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleConfirm">确认</el-button>
        </el-space>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
  .dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .layout-selector-content {
    padding: 0;
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
    color: #409eff;
  }

  .quick-section {
    margin-bottom: 16px;
  }

  .layout-table {
    width: 100%;
    border-collapse: collapse;
  }

  .layout-table th,
  .layout-table td {
    padding: 8px;
    text-align: center;
    border: 1px solid #ebeef5;
  }

  .layout-table th {
    font-size: 13px;
    font-weight: 500;
    color: #606266;
    background-color: #f5f7fa;
  }

  .corner-cell {
    background-color: #fff !important;
    border: none !important;
  }

  .row-header {
    font-size: 13px;
    font-weight: 500;
    color: #606266;
    background-color: #f5f7fa;
  }

  .cell-wrapper {
    padding: 3px;
  }

  .cell {
    padding: 8px 6px;
    font-size: 13px;
    color: #606266;
    cursor: pointer;
    user-select: none;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .cell:hover {
    color: #409eff;
    background-color: #ecf5ff;
  }

  .cell.selected {
    font-weight: 500;
    color: #fff;
    background-color: #409eff;
  }

  .custom-section {
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
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

  .footer-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-dialog__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 12px 20px;
    border-top: 1px solid #ebeef5;
  }
</style>
