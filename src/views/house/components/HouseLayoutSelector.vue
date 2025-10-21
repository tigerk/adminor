<script setup lang="ts">
  import { ArrowDown } from "@element-plus/icons-vue";
  import { useHouseLayoutEdit } from "@/views/house/components/HouseLayoutDialog/hook";

  interface Props {
    modelValue?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: ""
  });

  const emit = defineEmits<{
    "update:modelValue": [value: string];
  }>();

  const { openHouseLayoutEditDialog } = useHouseLayoutEdit();

  // 打开对话框
  const handleOpen = (): void => {
    openHouseLayoutEditDialog("选择", props.modelValue, (layout: string) => {
      emit("update:modelValue", layout);
    });
  };
</script>

<template>
  <div>
    <!-- 触发器 -->
    <el-input :model-value="modelValue" placeholder="请选择户型" readonly style="cursor: pointer" @click="handleOpen">
      <template #suffix>
        <el-icon class="el-input__icon">
          <ArrowDown />
        </el-icon>
      </template>
    </el-input>
  </div>
</template>
