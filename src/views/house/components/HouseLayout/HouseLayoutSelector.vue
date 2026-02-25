<script setup lang="ts">
  import { ArrowDown } from "@element-plus/icons-vue";
  import { useHouseLayoutEdit } from "@/views/house/components/HouseLayout/hook";
  import { HouseLayoutDto } from "@/types";
  import { computed } from "vue";

  interface Props {
    modelValue?: HouseLayoutDto;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: null
  });

  const emit = defineEmits<{
    "update:modelValue": [value: HouseLayoutDto];
  }>();

  const { openHouseLayoutEditDialog } = useHouseLayoutEdit();

  // 打开对话框
  const handleOpen = (): void => {
    openHouseLayoutEditDialog("选择", props.modelValue, (layout: HouseLayoutDto) => {
      emit("update:modelValue", layout);
    });
  };

  // 假设 HouseLayoutDto 包含一个 name 字段用于显示
  const displayedValue = computed(() => {
    let layoutName = "";
    if (props.modelValue === null) {
      return layoutName;
    }

    const { bedroom, livingRoom, kitchen, bathroom } = props.modelValue;
    if (bedroom > 0 || livingRoom > 0 || kitchen > 0 || bathroom > 0) {
      layoutName = `${bedroom}室${livingRoom}厅${kitchen}厨${bathroom}卫`;
    }

    return layoutName;
  });
</script>

<template>
  <div>
    <!-- 触发器 -->
    <el-input :model-value="displayedValue" placeholder="请选择户型" readonly style="cursor: pointer" @click="handleOpen">
      <template #suffix>
        <el-icon class="el-input__icon">
          <ArrowDown />
        </el-icon>
      </template>
    </el-input>
  </div>
</template>
