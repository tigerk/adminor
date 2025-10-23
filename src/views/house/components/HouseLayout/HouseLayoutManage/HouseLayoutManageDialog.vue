<script setup lang="ts">
  import { ref, reactive, watch } from "vue";
  import { FormInstance } from "element-plus";
  import HouseLayoutDialog from "@/views/house/components/HouseLayout/HouseLayoutDialog.vue";
  import HouseTagsDialog from "@/views/house/components/HouseTags/HouseTagsDialog.vue";
  import HouseFacilityDialog from "@/views/house/components/HouseFacility/HouseFacilityDialog.vue";
  import type { FacilityItemProps } from "@/types/models";

  interface HouseLayoutManageFormProps {
    formInline?: {
      id: string;
      name: string;
      layout: string;
      tags?: number[];
      facilities?: FacilityItemProps[];
    };
  }

  const props = withDefaults(defineProps<HouseLayoutManageFormProps>(), {
    formInline: () => ({
      id: "",
      name: "",
      layout: "",
      tags: [] as number[],
      facilities: [] as FacilityItemProps[]
    })
  });

  const formRef = ref<FormInstance>();
  const layoutDialogRef = ref();
  const tagsDialogRef = ref();
  const facilityDialogRef = ref();

  // 表单数据
  const formData = reactive({
    id: "",
    name: "",
    layout: "",
    tags: [] as number[],
    facilities: [] as FacilityItemProps[]
  });

  // 表单验证规则
  const rules = {
    name: [
      { required: true, message: "请输入房型名称", trigger: "blur" },
      { min: 2, max: 20, message: "房型名称长度为2-20个字符", trigger: "blur" }
    ],
    layout: [{ required: true, message: "请选择户型配置", trigger: "change" }]
  };

  // 监听 props 变化并初始化表单
  watch(
    () => props.formInline,
    newVal => {
      if (newVal) {
        formData.id = newVal.id || "";
        formData.name = newVal.name || "";
        formData.layout = newVal.layout || "";
        formData.tags = newVal.tags || [];
        formData.facilities = newVal.facilities || [];
      }
    },
    { immediate: true, deep: true }
  );

  // 获取表单数据的方法
  const getRef = async () => {
    await formRef.value?.validate();

    const layoutStr = layoutDialogRef.value?.getRef();
    if (!layoutStr) {
      throw new Error("请选择户型配置");
    }

    // 获取标签和配置数据
    const selectedTags = tagsDialogRef.value?.getRef() || [];
    const selectedFacilities = facilityDialogRef.value?.getRef() || {};

    // 将 facilities 对象转换为数组
    const facilitiesArray: FacilityItemProps[] = Object.entries(selectedFacilities).map(([name, count]) => ({
      name,
      count: Number(count)
    }));

    return {
      id: formData.id,
      name: formData.name,
      layout: layoutStr,
      tags: selectedTags,
      facilities: facilitiesArray
    };
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
