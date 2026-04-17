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
                <el-option v-for="type in DELIVERY_TYPE_OPTIONS" :key="type.value" :label="type.label" :value="type.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="交割日期" prop="handoverDate">
              <el-date-picker v-model="formData.handoverDate" type="date" placeholder="选择交割日期" class="w-full" value-format="YYYY-MM-DD" :disabled="isViewMode" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="验收人" prop="inspectorId">
              <el-select v-model="formData.inspectorId" placeholder="请选择验收人" class="w-full" filterable :disabled="isViewMode">
                <el-option v-for="user in inspectorList" :key="user.id" :label="user.name" :value="user.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
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
              <el-input v-model="meterReadings.water" placeholder="请输入水表读数" type="number" size="large" :disabled="isViewMode" @input="updateMeterReading('water', $event)">
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
              <el-input
                v-model="meterReadings.electricity"
                placeholder="请输入电表读数"
                type="number"
                size="large"
                :disabled="isViewMode"
                @input="updateMeterReading('electricity', $event)"
              >
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
              <el-input v-model="meterReadings.gas" placeholder="请输入燃气表读数" type="number" size="large" :disabled="isViewMode" @input="updateMeterReading('gas', $event)">
                <template #append>m³</template>
              </el-input>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 房间设施清单 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Grid /></el-icon>
          <span>房间设施清单</span>
          <el-button v-if="!isViewMode" type="primary" link size="small" :icon="Plus" class="ml-2" @click="addCustomItem">添加自定义项</el-button>
        </div>
        <el-table :data="facilityItemsFiltered" border stripe class="facilities-table">
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column prop="feeName" label="物品名称" min-width="150" align="center">
            <template #default="{ row }">
              <el-input v-if="row.isCustom && !isViewMode" v-model="row.feeName" placeholder="请输入物品名称" />
              <span v-else>{{ row.feeName }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="currentValue" label="数量" width="220" align="center">
            <template #default="{ row }">
              <el-input-number v-model="row.currentValue" :min="0" :max="100" :disabled="isViewMode">
                <template #suffix>
                  <span>个</span>
                </template>
              </el-input-number>
            </template>
          </el-table-column>

          <el-table-column prop="damaged" label="是否损坏" width="100" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.damaged" :active-value="true" :inactive-value="false" active-color="#f56c6c" inactive-color="#67c23a" :disabled="isViewMode" />
            </template>
          </el-table-column>

          <el-table-column prop="remark" label="备注" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.remark" placeholder="请输入备注" :disabled="isViewMode" />
            </template>
          </el-table-column>

          <el-table-column v-if="!isViewMode" label="操作" width="80" align="center" fixed="right">
            <template #default="{ row, $index }">
              <el-button v-if="row.isCustom" type="danger" link :icon="Delete" size="small" @click="removeFacilityItem($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 现场照片 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Picture /></el-icon>
          <span>现场照片</span>
        </div>
        <UploadImage v-model="formData.imageList" :limit="9" :width="120" :height="120" :disabled="isViewMode">
          <template #tip>
            <div class="upload-tip">最多可上传9张现场照片</div>
          </template>
        </UploadImage>
      </div>

      <!-- 备注说明 -->
      <div class="form-section">
        <el-form-item label="备注说明" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="4" placeholder="请输入备注说明" maxlength="500" show-word-limit :disabled="isViewMode" />
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import type { DeliveryCreateDto, DeliveryItemDto, DeliveryItemVo, FacilityItemDto } from "@/types";
  import { DataLine, Delete, Grid, InfoFilled, Lightning, Picture, Plus } from "@element-plus/icons-vue";
  import UploadImage from "@/components/upload/UploadImage.vue";
  import { getCompanyUserOptions } from "@/api/company";
  import { IconifyIconOnline } from "@/components/ReIcon";
  import { getDictDataByDictCode } from "@/api/sys/dict";
  import { DELIVERY_ITEM_CATEGORY, DELIVERY_TYPE_OPTIONS } from "@/constants";

  type DeliveryFormData = DeliveryCreateDto & {
    id?: string;
    status?: number;
    facilities?: FacilityItemDto[];
  };

  type DeliveryFormItem = DeliveryItemVo & {
    deliveryId?: string;
    isCustom?: boolean;
  };

  type DeliverySubmitItem = DeliveryItemDto & {
    id?: string;
    deliveryId?: string;
    isCustom?: boolean;
  };

  interface FormProps {
    formInline: DeliveryFormData;
    isViewMode?: boolean; // 是否为查看模式
  }

  const props = withDefaults(defineProps<FormProps>(), {
    isViewMode: false
  });

  const formRef = ref<FormInstance>();
  const inspectorList = ref<any[]>([]);
  const facilityOptions = ref<Array<{ label: string; value: string }>>([]);

  // 表单数据
  const formData = reactive<DeliveryFormData>({
    id: props.formInline?.id,
    subjectType: props.formInline?.subjectType || "tenant",
    subjectTypeId: props.formInline?.subjectTypeId,
    roomId: props.formInline?.roomId,
    handoverType: props.formInline?.handoverType || "CHECK_IN",
    status: props.formInline?.status ?? 0,
    handoverDate: props.formInline?.handoverDate || new Date().toISOString().split("T")[0],
    inspectorId: props.formInline?.inspectorId,
    remark: props.formInline?.remark || "",
    items: [],
    imageList: props.formInline?.imageList || []
  });

  // 水电燃气读数（用于界面展示和编辑）
  const meterReadings = reactive({
    water: "0",
    electricity: "0",
    gas: "0"
  });

  // 设施项目列表（包含水电燃气和房间设施）
  const facilityItems = ref<DeliveryFormItem[]>([]);

  // 过滤后的设施列表（仅用于表格显示，不包含水电燃气）
  const facilityItemsFiltered = computed(() => {
    return facilityItems.value.filter(item => {
      // 排除水电燃气项
      return item.feeName !== "水表读数" && item.feeName !== "电表读数" && item.feeName !== "燃气表读数";
    });
  });

  // 表单验证规则
  const rules = reactive<FormRules>({
    handoverType: [{ required: true, message: "请选择交割类型", trigger: "change" }],
    handoverDate: [{ required: true, message: "请选择交割日期", trigger: "change" }],
    inspectorId: [{ required: true, message: "请选择验收人", trigger: "change" }]
  });

  // 初始化表单数据
  const initFormData = () => {
    // 如果是编辑模式（有id且有items），从items回显数据
    if (props.formInline?.id && props.formInline?.items && props.formInline.items.length > 0) {
      // 回显已有的交割单数据
      facilityItems.value = props.formInline.items.map((item, index) => ({
        ...item,
        damaged: item.damaged || false,
        sortOrder: index + 1
      }));

      // 提取水电燃气读数
      extractMeterReadings();
    } else {
      // 新建模式：从房间设施初始化
      initFacilitiesFromRoom();
    }
  };

  // 从房间设施初始化物品列表
  const initFacilitiesFromRoom = () => {
    const items: DeliveryFormItem[] = [];
    let sortOrder = 1;

    // 1. 添加水电燃气项（固定项）
    items.push(
      {
        itemCategory: "UTILITY",
        feeName: "水表读数",
        itemUnit: "m³",
        currentValue: "0",
        damaged: false,
        remark: "",
        sortOrder: sortOrder++,
        isCustom: false
      },
      {
        itemCategory: "UTILITY",
        feeName: "电表读数",
        itemUnit: "kWh",
        currentValue: "0",
        damaged: false,
        remark: "",
        sortOrder: sortOrder++,
        isCustom: false
      },
      {
        itemCategory: "UTILITY",
        feeName: "燃气表读数",
        itemUnit: "m³",
        currentValue: "0",
        damaged: false,
        remark: "",
        sortOrder: sortOrder++,
        isCustom: false
      }
    );

    // 2. 从房间设施添加设施项
    if (props.formInline?.facilities && props.formInline.facilities.length > 0) {
      props.formInline.facilities.forEach((facility: FacilityItemDto) => {
        const facilityOption = facilityOptions.value.find(opt => opt.value === facility.name);

        items.push({
          itemCategory: "FACILITY",
          itemCode: facility.name,
          feeName: facilityOption?.label || facility.name,
          itemUnit: "个",
          currentValue: String(facility.count || 0),
          damaged: false,
          remark: "",
          sortOrder: sortOrder++,
          isCustom: false
        });
      });
    }

    facilityItems.value = items;
  };

  // 从items中提取水电燃气读数到meterReadings
  const extractMeterReadings = () => {
    facilityItems.value.forEach(item => {
      if (item.feeName === "水表读数") {
        meterReadings.water = item.currentValue || "0";
      } else if (item.feeName === "电表读数") {
        meterReadings.electricity = item.currentValue || "0";
      } else if (item.feeName === "燃气表读数") {
        meterReadings.gas = item.currentValue || "0";
      }
    });
  };

  // 更新水电燃气读数到items
  const updateMeterReading = (type: "water" | "electricity" | "gas", value: string) => {
    const meterNameMap = {
      water: "水表读数",
      electricity: "电表读数",
      gas: "燃气表读数"
    };

    const meterName = meterNameMap[type];
    const item = facilityItems.value.find(item => item.feeName === meterName);

    if (item) {
      item.currentValue = value || "0";
    }
  };

  // 添加自定义项
  const addCustomItem = () => {
    facilityItems.value.push({
      itemCategory: "FACILITY",
      feeName: "",
      itemUnit: "个",
      currentValue: "0",
      damaged: false,
      remark: "",
      sortOrder: facilityItems.value.length + 1,
      isCustom: true
    });
  };

  // 删除设施项
  const removeFacilityItem = (index: number) => {
    facilityItems.value.splice(index, 1);
    // 重新排序
    facilityItems.value.forEach((item, idx) => {
      item.sortOrder = idx + 1;
    });
  };

  // 获取表单引用
  const getRef = () => formRef.value;

  // 获取表单数据（提交时调用）
  const getFormData = (): DeliveryFormData => {
    // 更新 formData.items 为当前的 facilityItems
    formData.items = facilityItems.value.map<DeliverySubmitItem>(item => ({
      id: item.id,
      deliveryId: item.deliveryId,
      itemCategory: item.itemCategory,
      itemCode: item.itemCode,
      feeName: item.feeName || "",
      itemUnit: item.itemUnit,
      currentValue: item.currentValue || "0",
      damaged: item.damaged,
      remark: item.remark,
      sortOrder: item.sortOrder,
      isCustom: item.isCustom
    }));

    return {
      id: formData.id,
      subjectType: formData.subjectType,
      subjectTypeId: formData.subjectTypeId,
      roomId: formData.roomId,
      handoverType: formData.handoverType,
      handoverDate: formData.handoverDate,
      inspectorId: formData.inspectorId,
      remark: formData.remark,
      items: formData.items,
      imageList: formData.imageList
    };
  };

  onMounted(async () => {
    // 加载设施字典
    try {
      const res = await getDictDataByDictCode({ dictCode: "house_facilities" });
      facilityOptions.value = res.data.map(item => ({
        label: item.name,
        value: item.value
      }));
    } catch (error) {
      console.error("加载设施字典失败:", error);
    }

    // 初始化表单数据
    initFormData();

    // 获取验收人列表
    try {
      const resp = await getCompanyUserOptions();
      inspectorList.value = resp.data;
    } catch (error) {
      console.error("获取验收人列表失败:", error);
    }
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

      :deep(.el-table__header) {
        th {
          background-color: var(--el-fill-color-light);
        }
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

    :deep(.el-form-item__label) {
      color: var(--el-text-color-regular);
      font-weight: 500;
      transition: color 0.3s ease;
    }

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

    :deep(.el-input__count) {
      background-color: transparent;
      color: var(--el-text-color-secondary);
    }
  }

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
