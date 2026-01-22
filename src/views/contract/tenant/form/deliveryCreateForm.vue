<template>
  <div class="delivery-form-container">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" label-position="top">
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><InfoFilled /></el-icon>
          <span>基本信息</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="交割类型" prop="handoverType">
              <el-select v-model="formData.handoverType" placeholder="请选择交割类型" class="w-full" disabled>
                <el-option label="入住交割" value="check_in" />
                <el-option label="退租交割" value="check_out" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="交割日期" prop="handoverDate">
              <el-date-picker v-model="formData.handoverDate" type="date" placeholder="选择交割日期" class="w-full" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="验收人" prop="inspectorId">
              <el-select v-model="formData.inspectorId" placeholder="请选择验收人" class="w-full" filterable>
                <el-option v-for="user in inspectorList" :key="user.id" :label="user.name" :value="user.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 房间设施清单 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Grid /></el-icon>
          <span>房间设施清单</span>
        </div>
        <el-table :data="formData.items" border stripe class="facilities-table">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="itemName" label="物品名称" min-width="150" align="center" />
          <el-table-column prop="currentValue" label="数量" width="120" align="center">
            <template #default="{ row }">
              <el-input v-model="row.currentValue" placeholder="请输入" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="damaged" label="是否损坏" width="100" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.damaged" :active-value="1" :inactive-value="0" active-color="#f56c6c" inactive-color="#67c23a" />
            </template>
          </el-table-column>
          <el-table-column prop="remarks" label="备注" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.remarks" type="textarea" :rows="1" placeholder="请输入备注" size="small" />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 水电燃气读数 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><DataLine /></el-icon>
          <span>水电燃气读数</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="never" class="meter-card meter-card-water">
              <template #header>
                <div class="card-header">
                  <IconifyIconOnline icon="solar:water-broken" color="#409eff" />
                  <span>水表读数</span>
                </div>
              </template>
              <el-input v-model="meterReadings.water" placeholder="请输入水表读数" type="number" size="large">
                <template #append>m³</template>
              </el-input>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="meter-card meter-card-electric">
              <template #header>
                <div class="card-header">
                  <el-icon color="#f56c6c"><Lightning /></el-icon>
                  <span>电表读数</span>
                </div>
              </template>
              <el-input v-model="meterReadings.electricity" placeholder="请输入电表读数" type="number" size="large">
                <template #append>kWh</template>
              </el-input>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="meter-card meter-card-gas">
              <template #header>
                <div class="card-header">
                  <IconifyIconOnline icon="ep:sunny" color="#67c23a" />
                  <span>燃气表读数</span>
                </div>
              </template>
              <el-input v-model="meterReadings.gas" placeholder="请输入燃气表读数" type="number" size="large">
                <template #append>m³</template>
              </el-input>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 现场照片 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Picture /></el-icon>
          <span>现场照片</span>
        </div>
        <UploadImage v-model="formData.imageList" :limit="9" :width="120" :height="120">
          <template #tip>
            <div class="upload-tip">最多可上传9张现场照片</div>
          </template>
        </UploadImage>
      </div>

      <!-- 备注说明 -->
      <div class="form-section">
        <el-form-item label="备注说明" prop="remarks">
          <el-input v-model="formData.remarks" type="textarea" :rows="4" placeholder="请输入备注说明" maxlength="500" show-word-limit />
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import type { DeliveryCreateFormProps } from "@/types";
  import { DataLine, Grid, InfoFilled, Lightning, Picture } from "@element-plus/icons-vue";
  import UploadImage from "@/components/Business/UploadImage.vue";
  import { getCompanyUserOptions } from "@/api/company";
  import { IconifyIconOnline } from "@/components/ReIcon";
  import { getDictDataByDictCode } from "@/api/sys/dict";

  interface FormProps {
    formInline: DeliveryCreateFormProps;
  }

  const props = defineProps<FormProps>();

  const formRef = ref<FormInstance>();
  const inspectorList = ref<any[]>([]);
  // 当前的物品配置
  const facilityOptions = ref([]);

  // 表单数据
  const formData = reactive<DeliveryCreateFormProps>({
    id: props.formInline?.id,
    subjectType: props.formInline?.subjectType || "tenant",
    subjectTypeId: props.formInline?.subjectTypeId,
    roomId: props.formInline?.roomId,
    handoverType: props.formInline?.handoverType || "check_in",
    status: props.formInline?.status ?? 0,
    handoverDate: props.formInline?.handoverDate || new Date(),
    inspectorId: props.formInline?.inspectorId,
    remarks: props.formInline?.remarks || "",
    items: props.formInline?.items || [],
    imageList: props.formInline?.imageList || []
  });

  // 水电燃气读数
  const meterReadings = reactive({
    water: 0,
    electricity: 0,
    gas: 0
  });

  // 表单验证规则
  const rules = reactive<FormRules>({
    handoverType: [{ required: true, message: "请选择交割类型", trigger: "change" }],
    handoverDate: [{ required: true, message: "请选择交割日期", trigger: "change" }],
    inspectorId: [{ required: true, message: "请选择验收人", trigger: "change" }]
  });

  // 初始化表单数据
  const initFormData = () => {
    // 如果有房间设施数据，转换为交割单项目
    if (props.formInline?.facilities && props.formInline.facilities.length > 0) {
      formData.items = props.formInline.facilities.map((facility, index) => ({
        itemCode: facility.name,
        itemName: facilityOptions.value.find(opt => opt.value === facility.name)?.label || facility.name,
        itemUnit: "个",
        currentValue: facility.count || "1",
        damaged: 0,
        remarks: "",
        sortOrder: index + 1
      }));
    }

    // 从已有的items中提取水电燃气读数
    formData.items.forEach(item => {
      if (item.itemName === "水表读数") {
        meterReadings.water = item.currentValue;
      } else if (item.itemName === "电表读数") {
        meterReadings.electricity = item.currentValue;
      } else if (item.itemName === "燃气表读数") {
        meterReadings.gas = item.currentValue;
      }
    });
  };

  // 保存时合并水电燃气数据到items
  const mergeMetersToItems = () => {
    const meters = [
      { name: "水表读数", value: meterReadings.water, unit: "m³", category: "水电燃气" },
      { name: "电表读数", value: meterReadings.electricity, unit: "kWh", category: "水电燃气" },
      { name: "燃气表读数", value: meterReadings.gas, unit: "m³", category: "水电燃气" }
    ];

    meters.forEach(meter => {
      if (meter.value) {
        const existingIndex = formData.items.findIndex(item => item.itemName === meter.name);
        if (existingIndex > -1) {
          formData.items[existingIndex].currentValue = meter.value;
        } else {
          formData.items.push({
            itemName: meter.name,
            category: meter.category,
            itemUnit: meter.unit,
            currentValue: meter.value,
            damaged: 0,
            remarks: "",
            sortOrder: formData.items.length + 1
          });
        }
      }
    });
  };

  // 获取表单引用
  const getRef = () => formRef.value;

  // 获取表单数据
  const getFormData = () => {
    mergeMetersToItems();
    return formData;
  };

  onMounted(() => {
    getDictDataByDictCode({
      dictCode: "house_facilities"
    }).then(res => {
      facilityOptions.value = res.data.map(item => ({
        label: item.name,
        value: item.value
      }));
    });

    initFormData();

    // 获取验收人列表
    getCompanyUserOptions().then(resp => {
      inspectorList.value = resp.data;
    });
  });

  defineExpose({
    getRef,
    getFormData,
    formData
  });
</script>

<style scoped lang="scss">
  .delivery-form-container {
    padding: 20px;
    background-color: var(--el-bg-color);
    transition: background-color 0.3s ease;

    .form-section {
      margin-bottom: 30px;
      padding: 20px;
      background-color: var(--el-bg-color-overlay);
      border-radius: 8px;
      border: 1px solid var(--el-border-color-light);
      transition: all 0.3s ease;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        border-color: var(--el-border-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--el-border-color);
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        transition: all 0.3s ease;

        .el-icon {
          font-size: 18px;
          color: var(--el-color-primary);
        }
      }
    }

    .facilities-table {
      background-color: var(--el-bg-color);
      border-color: var(--el-border-color-light);

      :deep(.el-table__header-wrapper) {
        background-color: var(--el-fill-color-light);
      }

      :deep(.el-table__row) {
        background-color: var(--el-bg-color);
        transition: background-color 0.3s ease;

        &:hover {
          background-color: var(--el-fill-color-light) !important;
        }

        &.el-table__row--striped {
          background-color: var(--el-fill-color-lighter);

          &:hover {
            background-color: var(--el-fill-color-light) !important;
          }
        }
      }

      :deep(.el-table__cell) {
        border-color: var(--el-border-color-lighter);
      }

      :deep(.el-input__inner),
      :deep(.el-textarea__inner) {
        background-color: var(--el-fill-color-blank);
        border-color: var(--el-border-color);
        color: var(--el-text-color-regular);
        transition: all 0.3s ease;

        &:focus {
          border-color: var(--el-color-primary);
        }

        &::placeholder {
          color: var(--el-text-color-placeholder);
        }
      }
    }

    .meter-card {
      border: 1px solid var(--el-border-color-light);
      background-color: var(--el-bg-color-overlay);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        transition: opacity 0.3s ease;
        opacity: 0.8;
      }

      &.meter-card-water::before {
        background: linear-gradient(90deg, #409eff, #67c4ff);
      }

      &.meter-card-electric::before {
        background: linear-gradient(90deg, #f56c6c, #ff9898);
      }

      &.meter-card-gas::before {
        background: linear-gradient(90deg, #67c23a, #95d475);
      }

      &:hover {
        border-color: var(--el-border-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);

        &::before {
          opacity: 1;
        }
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        transition: color 0.3s ease;
      }

      :deep(.el-card__header) {
        background-color: var(--el-fill-color-light);
        border-bottom: 1px solid var(--el-border-color-lighter);
        transition: all 0.3s ease;
        padding: 14px 16px;
      }

      :deep(.el-card__body) {
        padding: 16px;
        background-color: var(--el-bg-color-overlay);
      }

      :deep(.el-input-group__append) {
        background-color: var(--el-fill-color);
        color: var(--el-text-color-secondary);
        border-color: var(--el-border-color);
        font-weight: 500;
        transition: all 0.3s ease;
      }

      :deep(.el-input__inner) {
        background-color: var(--el-fill-color-blank);
        border-color: var(--el-border-color);
        color: var(--el-text-color-regular);
        font-size: 16px;
        font-weight: 500;
        transition: all 0.3s ease;

        &:focus {
          border-color: var(--el-color-primary);
        }

        &::placeholder {
          color: var(--el-text-color-placeholder);
        }
      }
    }

    .upload-tip {
      color: var(--el-text-color-secondary);
      font-size: 13px;
      margin-top: 8px;
      transition: color 0.3s ease;
    }

    // 表单标签样式优化
    :deep(.el-form-item__label) {
      color: var(--el-text-color-regular);
      font-weight: 500;
      transition: color 0.3s ease;
    }

    // 输入框样式统一
    :deep(.el-input__inner),
    :deep(.el-textarea__inner),
    :deep(.el-select .el-input__inner) {
      background-color: var(--el-fill-color-blank);
      border-color: var(--el-border-color);
      color: var(--el-text-color-regular);
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--el-border-color-hover);
      }

      &:focus {
        border-color: var(--el-color-primary);
      }

      &::placeholder {
        color: var(--el-text-color-placeholder);
      }
    }

    // 字数统计样式
    :deep(.el-input__count) {
      background-color: transparent;
      color: var(--el-text-color-secondary);
    }
  }

  // 深色模式特殊优化
  html.dark {
    .delivery-form-container {
      .form-section {
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      }

      .meter-card {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
      }

      .facilities-table {
        :deep(.el-table__row) {
          &:hover {
            background-color: var(--el-fill-color) !important;
          }
        }
      }
    }
  }
</style>
