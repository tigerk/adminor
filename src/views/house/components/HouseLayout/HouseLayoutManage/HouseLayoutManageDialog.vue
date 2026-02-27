<script setup lang="ts">
  import { ref, reactive, watch } from "vue";
  import { FormInstance } from "element-plus";
  import HouseLayoutDialog from "@/views/house/components/HouseLayout/HouseLayoutDialog.vue";
  import HouseTagsDialog from "@/views/house/components/HouseTags/HouseTagsDialog.vue";
  import HouseFacilityDialog from "@/views/house/components/HouseFacility/HouseFacilityDialog.vue";
  import type { FacilityItemDto, HouseLayoutDto } from "@/types";
  import type { HouseLayoutManageFormProps } from "./types";

  const props = withDefaults(defineProps<HouseLayoutManageFormProps>(), {
    formInline: () => ({
      id: "",
      name: "",
      layout: undefined,
      tags: [] as Array<string>,
      facilities: []
    })
  });

  const formRef = ref<FormInstance>();
  const layoutDialogRef = ref();
  const tagsDialogRef = ref();
  const facilityDialogRef = ref();

  // 表单数据 - 明确类型定义
  const formData = reactive<HouseLayoutManageFormProps["formInline"]>({
    id: "",
    name: "",
    layout: undefined,
    tags: [] as Array<string>,
    facilities: []
  });

  // 表单验证规则
  const rules = {
    name: [
      { required: true, message: "请输入房型名称", trigger: "blur" },
      { min: 2, max: 20, message: "房型名称长度为2-20个字符", trigger: "blur" }
    ]
  };

  // 监听 props 变化并初始化表单
  watch(
    () => props.formInline,
    newVal => {
      if (newVal) {
        formData.id = newVal.id || "";
        formData.name = newVal.name || "";

        // 处理 layout 字段 - 可能是字符串或 HouseLayoutDto 对象
        if (typeof newVal.layout === "string") {
          formData.layout = newVal.layout;
        } else if (newVal.layout && typeof newVal.layout === "object") {
          // 如果是对象，直接使用
          formData.layout = newVal.layout;
        } else {
          formData.layout = null;
        }

        formData.tags = newVal.tags || [];
        formData.facilities = newVal.facilities || [];
      }
    },
    { immediate: true, deep: true }
  );

  // 获取表单数据的方法
  const getRef = async (): Promise<HouseLayoutDto> => {
    await formRef.value?.validate();

    const layoutData = layoutDialogRef.value?.getRef();
    if (!layoutData) {
      throw new Error("请选择户型配置");
    }

    // 获取标签和配置数据
    const selectedTags = tagsDialogRef.value?.getRef() || [];
    const selectedFacilities = facilityDialogRef.value?.getRef() || {};

    // 将 facilities 对象转换为数组
    const facilitiesArray: Array<FacilityItemDto> = Object.entries(selectedFacilities).map(([name, count]) => ({
      name,
      count: count.toString()
    }));

    // 返回完整的 HouseLayoutDto 数据
    const result: HouseLayoutDto = {
      id: formData.id || layoutData.id,
      layoutName: formData.name,
      bedroom: layoutData.bedroom,
      livingRoom: layoutData.livingRoom,
      kitchen: layoutData.kitchen,
      bathroom: layoutData.bathroom,
      newly: layoutData.newly ?? true,
      tags: selectedTags,
      facilities: facilitiesArray
    };

    return result;
  };

  // 重置表单
  const resetForm = () => {
    formRef.value?.resetFields();
    layoutDialogRef.value?.handleReset();
  };

  defineExpose({ getRef, resetForm });
</script>

<template>
  <div class="house-layout-manage-dialog">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="top">
      <el-form-item label="房型名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入房型名称，如：精装一房" clearable />
      </el-form-item>

      <el-form-item label="户型配置" prop="layout">
        <!-- 复用 HouseLayoutDialog 组件 -->
        <HouseLayoutDialog ref="layoutDialogRef" :form-inline="formData.layout" />
      </el-form-item>

      <!-- 房源特色标签 -->
      <HouseTagsDialog ref="tagsDialogRef" :form-inline="formData.tags" />

      <!-- 房源配置 -->
      <HouseFacilityDialog ref="facilityDialogRef" :form-inline="formData.facilities" />
    </el-form>
  </div>
</template>

<style scoped>
  .house-layout-manage-dialog {
    padding: 10px 0;
  }

  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
  }
</style>
