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
              <el-select v-model="formData.handoverType" placeholder="请选择交割类型" class="w-full">
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
          <el-table-column prop="category" label="类别" width="100" align="center" />
          <el-table-column prop="itemName" label="物品名称" min-width="150" align="center" />
          <el-table-column prop="itemUnit" label="单位" width="80" align="center" />
          <el-table-column prop="currentValue" label="数量/状态" width="120" align="center">
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
            <el-card shadow="never" class="meter-card">
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
            <el-card shadow="never" class="meter-card">
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
            <el-card shadow="never" class="meter-card">
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

  interface FormProps {
    formInline: DeliveryCreateFormProps;
  }

  const props = defineProps<FormProps>();

  const formRef = ref<FormInstance>();
  const inspectorList = ref<any[]>([]);

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
    water: "",
    electricity: "",
    gas: ""
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
        itemId: facility.id,
        itemName: facility.name,
        category: facility.category || "家具家电",
        itemUnit: facility.unit || "个",
        currentValue: facility.quantity || "1",
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

    .form-section {
      margin-bottom: 30px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid #e4e7ed;
        font-size: 16px;
        font-weight: 600;
        color: #303133;

        .el-icon {
          font-size: 18px;
          color: #409eff;
        }
      }
    }

    .facilities-table {
      :deep(.el-input__inner),
      :deep(.el-textarea__inner) {
        border: 1px solid #dcdfe6;
      }
    }

    .meter-card {
      border: 1px solid #e4e7ed;

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
      }

      :deep(.el-card__body) {
        padding: 16px;
      }

      :deep(.el-input-group__append) {
        background-color: #f5f7fa;
        color: #909399;
        font-weight: 500;
      }
    }

    .upload-tip {
      color: #909399;
      font-size: 13px;
      margin-top: 8px;
    }
  }
</style>
