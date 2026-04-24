<template>
  <div v-loading="pageLoading" class="delivery-form-container mb-3">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" label-position="top">
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><InfoFilled /></el-icon>
          <span>基本信息</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="交割类型" prop="handoverType">
              <el-select v-model="formData.handoverType" placeholder="请选择交割类型" class="w-full" disabled>
                <el-option v-for="type in handoverTypeOptions" :key="type.value" :label="type.label" :value="type.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="交割日期" prop="handoverDate">
              <el-date-picker v-model="formData.handoverDate" type="date" placeholder="选择交割日期" class="w-full" value-format="YYYY-MM-DD" :disabled="isViewMode" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="验收人" prop="inspectorId">
              <el-select v-model="formData.inspectorId" placeholder="请选择验收人" class="w-full" filterable :disabled="isViewMode">
                <el-option v-for="user in inspectorList" :key="user.id" :label="user.name" :value="user.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="清洁情况" prop="cleanCondition">
              <el-radio-group v-model="formData.cleanCondition" class="clean-condition-group" :disabled="isViewMode">
                <el-radio-button v-for="option in cleanConditionOptions" :key="option.value" :label="option.value">
                  {{ option.label }}
                </el-radio-button>
              </el-radio-group>
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
              <div class="meter-card__body">
                <el-input
                  v-model="meterReadings.water"
                  placeholder="请输入水表余额或读数"
                  type="number"
                  size="large"
                  :disabled="isViewMode"
                  @input="updateMeterReading('water', $event)"
                >
                  <template #suffix>
                    <span class="meter-value-unit">{{ meterUnits.water }}</span>
                  </template>
                </el-input>
                <el-segmented
                  v-model="meterUnits.water"
                  :options="meterUnitOptions.water"
                  class="meter-mode-switch"
                  :disabled="isViewMode"
                  @change="updateMeterUnit('water', $event)"
                />
                <div class="meter-proof">
                  <div class="meter-proof__header">
                    <div class="meter-proof__label">读数凭证图</div>
                    <div class="meter-proof__tip">选填，建议上传表盘照片</div>
                  </div>
                  <UploadImage v-model="meterProofImages.water" :limit="1" :width="136" :height="136" :max-size-mb="2" :disabled="isViewMode">
                    <template #tip><span /></template>
                  </UploadImage>
                </div>
              </div>
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
              <div class="meter-card__body">
                <el-input
                  v-model="meterReadings.electricity"
                  placeholder="请输入电表余额或读数"
                  type="number"
                  size="large"
                  :disabled="isViewMode"
                  @input="updateMeterReading('electricity', $event)"
                >
                  <template #suffix>
                    <span class="meter-value-unit">{{ meterUnits.electricity }}</span>
                  </template>
                </el-input>
                <el-segmented
                  v-model="meterUnits.electricity"
                  :options="meterUnitOptions.electricity"
                  class="meter-mode-switch"
                  :disabled="isViewMode"
                  @change="updateMeterUnit('electricity', $event)"
                />
                <div class="meter-proof">
                  <div class="meter-proof__header">
                    <div class="meter-proof__label">读数凭证图</div>
                    <div class="meter-proof__tip">选填，建议上传电表照片</div>
                  </div>
                  <UploadImage v-model="meterProofImages.electricity" :limit="1" :width="136" :height="136" :max-size-mb="2" :disabled="isViewMode">
                    <template #tip><span /></template>
                  </UploadImage>
                </div>
              </div>
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
              <div class="meter-card__body">
                <el-input
                  v-model="meterReadings.gas"
                  placeholder="请输入燃气表余额或读数"
                  type="number"
                  size="large"
                  :disabled="isViewMode"
                  @input="updateMeterReading('gas', $event)"
                >
                  <template #suffix>
                    <span class="meter-value-unit">{{ meterUnits.gas }}</span>
                  </template>
                </el-input>
                <el-segmented v-model="meterUnits.gas" :options="meterUnitOptions.gas" class="meter-mode-switch" :disabled="isViewMode" @change="updateMeterUnit('gas', $event)" />
                <div class="meter-proof">
                  <div class="meter-proof__header">
                    <div class="meter-proof__label">读数凭证图</div>
                    <div class="meter-proof__tip">选填，建议上传燃气表照片</div>
                  </div>
                  <UploadImage v-model="meterProofImages.gas" :limit="1" :width="136" :height="136" :max-size-mb="2" :disabled="isViewMode">
                    <template #tip><span /></template>
                  </UploadImage>
                </div>
              </div>
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

          <el-table-column prop="itemName" label="物品名称" min-width="150" align="center">
            <template #default="{ row }">
              <el-input v-if="row.isCustom && !isViewMode" v-model="row.itemName" placeholder="请输入物品名称" />
              <span v-else>{{ row.itemName }}</span>
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

      <div class="form-section">
        <div class="section-title">
          <el-icon><Picture /></el-icon>
          <span>现场照片</span>
        </div>
        <UploadImage v-model="formData.imageList" :limit="9" :width="108" :height="108" :max-size-mb="2" :disabled="isViewMode">
          <template #tip>
            <div class="upload-tip">最多可上传9张现场照片</div>
          </template>
        </UploadImage>
      </div>

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
  import type {
    DeliveryCleanConditionEnum,
    DeliveryCreateDto,
    DeliveryHandoverTypeEnum,
    DeliveryItemCategoryEnum,
    DeliveryItemCodeEnum,
    DeliveryItemDto,
    DeliveryItemVo,
    FacilityItemDto,
    RoomListVo
  } from "@/types";
  import { DataLine, Delete, Grid, InfoFilled, Lightning, Picture, Plus } from "@element-plus/icons-vue";
  import UploadImage from "@/components/upload/UploadImage.vue";
  import { getCompanyUserOptions } from "@/api/company";
  import { getRoomDetail } from "@/api/house/room";
  import { IconifyIconOnline } from "@/components/ReIcon";
  import { getDictDataByDictCode } from "@/api/sys/dict";
  import { DeliveryCleanConditionEnumMeta, DeliveryHandoverTypeEnumMeta, HouseDetailVo, RoomDetailVo } from "@/types";
  import { useUserStoreHook } from "@/store/modules/user";
  import { message } from "@/utils/message";

  type DeliveryFormData = Omit<DeliveryCreateDto, "handoverType" | "cleanCondition" | "items"> & {
    id?: string;
    status?: number;
    facilities?: FacilityItemDto[];
    roomData?: RoomListVo;
    handoverType: DeliveryHandoverTypeEnum;
    cleanCondition?: DeliveryCleanConditionEnum;
    items?: DeliverySubmitItem[];
  };

  type DeliveryFormItem = Omit<DeliveryItemVo, "itemCode"> & {
    itemCode?: string;
    itemName?: string;
    deliveryId?: string;
    isCustom?: boolean;
  };

  type DeliverySubmitItem = Omit<DeliveryItemDto, "itemCode"> & {
    itemCode?: string;
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

  const userStore = useUserStoreHook();
  const formRef = ref<FormInstance>();
  const inspectorList = ref<any[]>([]);
  const facilityOptions = ref<Array<{ label: string; value: string }>>([]);
  const pageLoading = ref(false);
  const latestRoomDetail = ref<RoomDetailVo>();
  const handoverTypeOptions = Object.values(DeliveryHandoverTypeEnumMeta).map(item => ({
    label: item.name,
    value: item.code as DeliveryHandoverTypeEnum
  }));
  const cleanConditionOptions = Object.values(DeliveryCleanConditionEnumMeta).map(item => ({
    label: item.name,
    value: item.code as DeliveryCleanConditionEnum
  }));
  const meterItemCodeMap = {
    water: "WATER_METER" as DeliveryItemCodeEnum,
    electricity: "ELECTRICITY_METER" as DeliveryItemCodeEnum,
    gas: "GAS_METER" as DeliveryItemCodeEnum
  };
  const deliveryItemCategoryMap = {
    facility: "FACILITY" as DeliveryItemCategoryEnum,
    utility: "UTILITY" as DeliveryItemCategoryEnum
  };
  const meterItemCodeSet = new Set(Object.values(meterItemCodeMap));
  const meterItemNameMap: Record<DeliveryItemCodeEnum, string> = {
    WATER_METER: "水表读数",
    ELECTRICITY_METER: "电表读数",
    GAS_METER: "燃气表读数"
  };
  const utilityOrder = [meterItemCodeMap.water, meterItemCodeMap.electricity, meterItemCodeMap.gas] as const;

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
    cleanCondition: props.formInline?.cleanCondition,
    items: [],
    imageList: props.formInline?.imageList || []
  });

  // 水电燃气读数（用于界面展示和编辑）
  const meterReadings = reactive({
    water: "0",
    electricity: "0",
    gas: "0"
  });

  const meterUnits = reactive({
    water: "元",
    electricity: "元",
    gas: "元"
  });

  const meterProofImages = reactive({
    water: [] as string[],
    electricity: [] as string[],
    gas: [] as string[]
  });

  const meterUnitOptions = {
    water: [
      { label: "余额（元）", value: "元" },
      { label: "读数（m³）", value: "m³" }
    ],
    electricity: [
      { label: "余额（元）", value: "元" },
      { label: "读数（kWh）", value: "kWh" }
    ],
    gas: [
      { label: "余额（元）", value: "元" },
      { label: "读数（m³）", value: "m³" }
    ]
  };

  // 设施项目列表（包含水电燃气和房间设施）
  const facilityItems = ref<DeliveryFormItem[]>([]);

  // 过滤后的设施列表（仅用于表格显示，不包含水电燃气）
  const facilityItemsFiltered = computed(() => {
    return facilityItems.value.filter(item => !meterItemCodeSet.has(item.itemCode as DeliveryItemCodeEnum));
  });

  // 表单验证规则
  const rules = reactive<FormRules>({
    handoverType: [{ required: true, message: "请选择交割类型", trigger: "change" }],
    handoverDate: [{ required: true, message: "请选择交割日期", trigger: "change" }],
    inspectorId: [{ required: true, message: "请选择验收人", trigger: "change" }]
  });

  // 初始化表单数据
  const initFormData = () => {
    facilityItems.value = buildFormItems();
    extractMeterReadings();
  };

  const setDefaultInspector = () => {
    if (props.isViewMode || formData.inspectorId || !inspectorList.value.length) return;

    const currentNickname = String(userStore.nickname || "").trim();
    const currentUsername = String(userStore.username || "").trim();
    const matchedUser = inspectorList.value.find(user => {
      const candidates = [user?.name, user?.nickname, user?.username].map(item => String(item || "").trim());
      return (currentNickname && candidates.includes(currentNickname)) || (currentUsername && candidates.includes(currentUsername));
    });

    if (matchedUser?.id) {
      formData.inspectorId = matchedUser.id;
    }
  };

  const getSourceFacilities = (): FacilityItemDto[] => {
    if (latestRoomDetail.value) {
      const latestHouse = latestRoomDetail.value.house as HouseDetailVo | undefined;
      if (latestHouse?.rentalType === 1) {
        return latestHouse.houseLayout?.facilities || [];
      }
      return latestRoomDetail.value?.facilities || [];
    }

    const roomData = props.formInline?.roomData;
    if (roomData) {
      if (roomData.rentalType === 1) {
        return roomData.houseLayout?.facilities || [];
      }
      return roomData.facilities || [];
    }

    return props.formInline?.facilities || [];
  };

  const loadLatestRoomData = async () => {
    const roomId = props.formInline?.roomId;
    if (!roomId) return;

    pageLoading.value = true;
    try {
      const resp = await getRoomDetail({ roomId });
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || "获取房间详情失败");
      }
      latestRoomDetail.value = resp.data;
    } catch (error: any) {
      message(error?.message || "获取最新物品清单失败", { type: "warning" });
    } finally {
      pageLoading.value = false;
    }
  };

  const createDefaultUtilityItem = (itemCode: DeliveryItemCodeEnum, sortOrder: number): DeliveryFormItem => ({
    itemCategory: deliveryItemCategoryMap.utility,
    itemCode,
    itemName: meterItemNameMap[itemCode],
    itemUnit: "元",
    currentValue: "0",
    proofImageList: [],
    damaged: false,
    remark: "",
    sortOrder,
    isCustom: false
  });

  const buildSourceFacilityItem = (facility: FacilityItemDto, sortOrder: number, existing?: DeliveryFormItem): DeliveryFormItem => {
    const facilityOption = facilityOptions.value.find(opt => opt.value === facility.name);
    return {
      ...existing,
      itemCategory: deliveryItemCategoryMap.facility,
      itemCode: facility.name,
      itemName: existing?.itemName || facilityOption?.label || facility.name,
      itemUnit: existing?.itemUnit || "个",
      currentValue: existing?.currentValue || String(facility.count || 0),
      damaged: existing?.damaged || false,
      remark: existing?.remark || "",
      proofImageList: existing?.proofImageList || [],
      sortOrder,
      isCustom: false
    };
  };

  const normalizeExistingItem = (item: DeliveryItemVo | DeliverySubmitItem, sortOrder: number): DeliveryFormItem => ({
    ...item,
    itemName: item.itemName || "",
    damaged: item.damaged || false,
    sortOrder,
    isCustom: "customized" in item ? item.customized || false : "isCustom" in item ? item.isCustom || false : false
  });

  const buildFormItems = (): DeliveryFormItem[] => {
    const sourceFacilities = getSourceFacilities();
    const existingItems = (props.formInline?.items || []).map((item, index) => normalizeExistingItem(item, index + 1));
    const utilityItemMap = new Map(
      existingItems.filter(item => item.itemCategory === deliveryItemCategoryMap.utility && item.itemCode).map(item => [item.itemCode as DeliveryItemCodeEnum, item])
    );
    const facilityItemMap = new Map(existingItems.filter(item => item.itemCategory === deliveryItemCategoryMap.facility && item.itemCode).map(item => [item.itemCode, item]));
    const currentSourceCodes = new Set(sourceFacilities.map(item => item.name).filter(Boolean));

    const items: DeliveryFormItem[] = [];
    let sortOrder = 1;

    utilityOrder.forEach(itemCode => {
      const existingItem = utilityItemMap.get(itemCode);
      items.push(
        existingItem
          ? { ...existingItem, itemName: existingItem.itemName || meterItemNameMap[itemCode], sortOrder: sortOrder++, isCustom: false }
          : createDefaultUtilityItem(itemCode, sortOrder++)
      );
    });

    sourceFacilities.forEach(facility => {
      if (!facility?.name) return;
      items.push(buildSourceFacilityItem(facility, sortOrder++, facilityItemMap.get(facility.name)));
    });

    existingItems
      .filter(item => item.itemCategory === deliveryItemCategoryMap.facility)
      .filter(item => !item.itemCode || !currentSourceCodes.has(item.itemCode))
      .forEach(item => {
        items.push({
          ...item,
          sortOrder: sortOrder++,
          isCustom: true
        });
      });

    return items;
  };

  // 从items中提取水电燃气读数到meterReadings
  const extractMeterReadings = () => {
    facilityItems.value.forEach(item => {
      if (item.itemCode === meterItemCodeMap.water) {
        meterReadings.water = item.currentValue || "0";
        meterUnits.water = item.itemUnit || "元";
        meterProofImages.water = [...(item.proofImageList || [])];
      } else if (item.itemCode === meterItemCodeMap.electricity) {
        meterReadings.electricity = item.currentValue || "0";
        meterUnits.electricity = item.itemUnit || "元";
        meterProofImages.electricity = [...(item.proofImageList || [])];
      } else if (item.itemCode === meterItemCodeMap.gas) {
        meterReadings.gas = item.currentValue || "0";
        meterUnits.gas = item.itemUnit || "元";
        meterProofImages.gas = [...(item.proofImageList || [])];
      }
    });
  };

  // 更新水电燃气读数到items
  const updateMeterReading = (type: "water" | "electricity" | "gas", value: string) => {
    const meterCode = meterItemCodeMap[type];
    const item = facilityItems.value.find(currentItem => currentItem.itemCode === meterCode);

    if (item) {
      item.currentValue = value || "0";
    }
  };

  const updateMeterUnit = (type: "water" | "electricity" | "gas", value: string) => {
    const meterCode = meterItemCodeMap[type];
    const item = facilityItems.value.find(currentItem => currentItem.itemCode === meterCode);
    if (item) {
      item.itemUnit = value || "元";
    }
  };

  const syncMeterProofImages = () => {
    const proofMap = {
      [meterItemCodeMap.water]: meterProofImages.water,
      [meterItemCodeMap.electricity]: meterProofImages.electricity,
      [meterItemCodeMap.gas]: meterProofImages.gas
    } as const;

    facilityItems.value.forEach(item => {
      if (item.itemCode && proofMap[item.itemCode as keyof typeof proofMap]) {
        item.proofImageList = [...proofMap[item.itemCode as keyof typeof proofMap]];
      }
    });
  };

  // 添加自定义项
  const addCustomItem = () => {
    facilityItems.value.push({
      itemCategory: deliveryItemCategoryMap.facility,
      itemName: "",
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
    syncMeterProofImages();

    // 更新 formData.items 为当前的 facilityItems
    formData.items = facilityItems.value.map<DeliverySubmitItem>(item => ({
      id: item.id,
      deliveryId: item.deliveryId,
      itemCategory: item.itemCategory,
      itemCode: item.itemCode,
      itemName: item.itemName || "",
      itemUnit: item.itemUnit,
      currentValue: item.currentValue || "0",
      damaged: item.damaged,
      remark: item.remark,
      sortOrder: item.sortOrder,
      proofImageList: item.proofImageList || [],
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
      cleanCondition: formData.cleanCondition,
      items: formData.items,
      imageList: formData.imageList
    };
  };

  onMounted(async () => {
    // 加载设施字典
    try {
      const res = await getDictDataByDictCode({ dictCode: "house_facilities" });
      facilityOptions.value = (res.data || []).map(item => ({
        label: item.name,
        value: item.value
      }));
    } catch (error) {
      console.error("加载设施字典失败:", error);
    }

    await loadLatestRoomData();

    // 初始化表单数据
    initFormData();

    // 获取验收人列表
    try {
      const resp = await getCompanyUserOptions();
      inspectorList.value = resp.data || [];
      setDefaultInspector();
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
    background-color: var(--el-bg-color);
    transition: background-color 0.3s ease;

    .form-section {
      margin-bottom: 16px;
      padding: 14px;
      background-color: var(--el-bg-color-overlay);
      border-radius: 10px;
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
        margin-bottom: 14px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--el-border-color);
        font-size: 15px;
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
        padding: 12px 14px;
      }

      :deep(.el-card__body) {
        padding: 14px;
        background-color: var(--el-bg-color-overlay);
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

    .meter-card__body {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .meter-mode-switch {
      width: 100%;
      :deep(.el-segmented) {
        padding: 4px;
        border-radius: 10px;
      }

      :deep(.el-segmented__item) {
        min-height: 34px;
        font-weight: 600;
      }
    }

    .meter-proof {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px dashed var(--el-border-color-lighter);
    }

    .meter-proof__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 10px;
    }

    .meter-proof__label {
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .meter-proof__tip {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      line-height: 1.4;
      text-align: right;
    }

    .meter-value-unit {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      font-weight: 600;
    }

    .upload-tip {
      color: var(--el-text-color-secondary);
      font-size: 13px;
      margin-top: 6px;
      transition: color 0.3s ease;
    }

    :deep(.el-form-item) {
      margin-bottom: 12px;
    }

    :deep(.el-form-item__label) {
      color: var(--el-text-color-regular);
      font-weight: 500;
      transition: color 0.3s ease;
      margin-bottom: 6px;
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

    :deep(.clean-condition-group .el-radio-button__inner) {
      min-width: 72px;
      padding: 8px 14px;
      font-weight: 500;
    }

    :deep(.meter-proof .el-upload__tip) {
      display: none;
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
