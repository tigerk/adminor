<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import PoiSearch from "@/components/Business/PoiSearch.vue";
  import { EntireFormProps } from "@/views/house/components/EntireCreate/types";
  import { CircleCheck, Plus } from "@element-plus/icons-vue";
  import DeptTreeSelect from "@/components/Business/DeptTreeSelect.vue";
  import { getCompanyUserOptions } from "@/api/company";
  import { useFacilityEdit } from "@/views/house/components/HouseFacility/hook";
  import HouseLayoutSelector from "@/views/house/components/HouseLayout/HouseLayoutSelector.vue";
  import { useHouseTagsEdit } from "@/views/house/components/HouseTags/hook";
  import { createEntireFormRules } from "./rule";
  import type { FormInstance } from "element-plus";
  import { useHouseImageEdit } from "@/views/house/components/HouseImage/hook";
  import { FacilityItemDto, type OtherFeeDto, type PriceConfigDto, type PricePlanDto, ScatterHouseDto } from "@/types";
  import { DECORATION_TYPE_OPTIONS, DIRECTION_OPTIONS, ELECTRICITY_TYPE_OPTIONS, HEATING_TYPE_OPTIONS, WATER_TYPE_OPTIONS } from "@/constants";
  import { usePriceConfigEdit } from "@/views/house/components/PriceConfig/hook";
  import { message } from "@/utils/message"; // 使用hook中的方法

  // 使用hook中的方法
  const { openFacilityEditDialog } = useFacilityEdit();
  const { openHouseTagsEditDialog } = useHouseTagsEdit();
  const { openHouseImageEditDialog } = useHouseImageEdit();
  const { openPriceConfigDialog } = usePriceConfigEdit();

  function getDefaultPriceConfigItem(): PriceConfigDto {
    return {
      /** 房间ID */
      roomId: null,
      /** 出房价格（单位：元/月） */
      price: null,
      /** 底价（单位：元/月） */
      floorPrice: null,
      /** 底价方式：0=固定金额，1=按比例 */
      floorPriceMethod: 0,
      /** 底价录入值（金额或比例，具体由 low_price_method 决定） */
      floorPriceInput: null,
      /** 其他费用列表 */
      otherFees: [] as OtherFeeDto[],
      pricePlans: [] as PricePlanDto[]
    };
  }

  const getDefaultEntireHouseItem = (): ScatterHouseDto => {
    return {
      houseCode: "",
      building: "",
      unit: "",
      doorNumber: "",
      floor: null,
      floorTotal: null,
      houseLayout: {
        livingRoom: 0,
        bedroom: 0,
        bathroom: 0,
        kitchen: 0,
        imageList: [],
        tags: [],
        facilities: []
      },
      roomList: [
        {
          roomNumber: undefined,
          roomType: null,
          direction: "",
          area: null,
          price: null,
          imageList: [],
          facilities: [],
          tags: [],
          priceConfig: getDefaultPriceConfigItem()
        }
      ],
      rentalType: 1,
      direction: "",
      area: "",
      decorationType: "",
      propertyFee: null
    };
  };

  const props = withDefaults(defineProps<EntireFormProps>(), {
    formInline: () => ({
      houseList: []
    })
  });
  const emit = defineEmits(["onSave"]);

  // 将 entireForm 和 houseList 合并到一个响应式对象中
  const entireForm = reactive({
    ...props.formInline
  });

  // 确保 houseList 初始化
  if (!entireForm.houseList || entireForm.houseList.length === 0) {
    entireForm.houseList = [getDefaultEntireHouseItem()];
  }

  // 使用 entireForm.houseList 替代独立的 houseList
  const houseList = computed(() => entireForm.houseList);

  // 表单引用
  const ruleFormRef = ref<FormInstance>();

  // 创建表单验证规则
  const rules = createEntireFormRules(entireForm);

  // 负责人列表
  const salesmanList = ref([]);

  const handlePoiSelected = (poi: any) => {
    entireForm.community = {
      name: poi.name,
      adcode: poi.adcode,
      cityId: poi.cityId,
      address: poi.address,
      district: poi.district,
      location: poi.location
    };
  };

  // 朝向选项
  const directionOptions = DIRECTION_OPTIONS;

  const decorationTypeOptions = DECORATION_TYPE_OPTIONS;

  // 添加新房源
  const addNewHouse = () => {
    entireForm.houseList.push(getDefaultEntireHouseItem());
  };

  onMounted(() => {
    getCompanyUserOptions().then(resp => {
      salesmanList.value = resp.data;
    });
  });

  const copyHouse = (index: number) => {
    const houseToCopy = entireForm.houseList[index];
    try {
      // 使用 JSON 深拷贝,会自动过滤掉函数、undefined 等无法序列化的值
      const newHouse = JSON.parse(JSON.stringify(houseToCopy));
      newHouse.id = undefined; // 清除ID
      // 清空房间ID
      newHouse?.roomList?.forEach(room => (room.id = undefined)); // 清除ID
      // 清空房型ID，清空前要进行判断，否则报错
      if (newHouse.houseLayout) {
        newHouse.houseLayout.id = undefined;
      }
      entireForm.houseList.splice(index + 1, 0, newHouse);
    } catch (error) {
      console.error("复制房源失败:", error);
      message("复制房源失败,请重试", { type: "error" });
    }
  };

  // 删除房源
  const removeHouse = (index: number) => {
    if (entireForm.houseList.length > 1) {
      entireForm.houseList.splice(index, 1);
    }
  };

  /**
   * 房源配置对话框 start
   */
  const openFacilitiesDialog = (index: number) => {
    const currentHouse = entireForm.houseList[index];

    openFacilityEditDialog("", currentHouse.houseLayout.facilities, (facilities: FacilityItemDto[]) => {
      entireForm.houseList[index].houseLayout.facilities = facilities;
    });
  };

  // 获取房源配置状态文本
  const getFacilitiesStatusText = (features: any[]) => {
    return features && features.length > 0 ? "已设置" : "未设置";
  };
  /**
   * 房源配置对话框 end
   */

  /**
   * 房源特色对话框 start
   */
  const openHouseTagsDialog = (index: number) => {
    const currentHouseLayout = entireForm.houseList[index].houseLayout;

    openHouseTagsEditDialog("", currentHouseLayout.tags, (tags: any[]) => {
      entireForm.houseList[index].houseLayout.tags = tags;
    });
  };
  /**
   * 房源特色对话框 end
   */

  /**
   * 房源图片对话框 start
   */
  const openImageListDialog = (index: number) => {
    const currentHouse = entireForm.houseList[index];

    openHouseImageEditDialog("", currentHouse.houseLayout.imageList, (imageList: any[]) => {
      entireForm.houseList[index].houseLayout.imageList = imageList;
    });
  };
  /**
   * 房源图片对话框 end
   */

  /**
   * 租金配置对话框 start
   */
  const openRoomPriceConfigDialog = (houseIndex: number) => {
    const currentHouse = entireForm.houseList[houseIndex];

    // 确保结构完整
    if (!currentHouse.roomList || currentHouse.roomList.length === 0) {
      currentHouse.roomList = [{ roomNumber: "", price: undefined, priceConfig: getDefaultPriceConfigItem() }];
    }

    // 如果填写了 price，则更新到 priceConfig.price
    if (currentHouse.roomList[0]?.price) {
      currentHouse.roomList[0].priceConfig.price = currentHouse.roomList[0].price;
    }

    openPriceConfigDialog("", currentHouse?.roomList[0]?.priceConfig, (priceConfig: any) => {
      currentHouse.roomList[0].priceConfig = priceConfig;
      currentHouse.roomList[0].price = priceConfig.price;
    });
  };
  /**
   * 租金配置对话框 end
   */

  // 验证表单（供父组件调用）
  const validateForm = async (): Promise<boolean> => {
    if (!ruleFormRef.value) return false;
    try {
      return ruleFormRef.value.validate();
    } catch (error) {
      // 定位到具体的校验失败位置
      console.error("Validation Error:", error);
      return false;
    }
  };

  // 暴露给父组件的方法和数据
  defineExpose({
    validateForm,
    entireForm,
    houseList: entireForm.houseList
  });
</script>

<template>
  <div class="entier-create-container">
    <el-form ref="ruleFormRef" :model="entireForm" :rules="rules" label-position="top">
      <div>
        <!-- 项目信息 -->
        <h3 class="pb-4">小区信息</h3>
        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="小区地址" prop="community.name">
              <PoiSearch :cityId="entireForm?.community?.cityId" :name="entireForm?.community?.name" @poi-selected="handlePoiSelected" />
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="用水" prop="water" class="el-form-item">
              <el-select v-model="entireForm.water" placeholder="请选择">
                <el-option v-for="item in WATER_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="用电" prop="electricity">
              <el-select v-model="entireForm.electricity" placeholder="请选择">
                <el-option v-for="item in ELECTRICITY_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="供暖信息" prop="heating">
              <el-select v-model="entireForm.heating" placeholder="请选择">
                <el-option v-for="item in HEATING_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="2">
            <el-form-item label="&nbsp;">
              <el-checkbox v-model="entireForm.hasGas">有燃气</el-checkbox>
            </el-form-item>
          </el-col>
          <el-col :span="2">
            <el-form-item label="&nbsp;">
              <el-checkbox v-model="entireForm.hasElevator">有电梯</el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      <div class="house-container">
        <h3 class="pb-4">房源信息</h3>
        <div v-for="(house, index) in houseList" :key="index" class="house-form-card">
          <el-row :gutter="20" class="mb-1">
            <el-col :span="12">
              <h3 class="pb-4">房源 {{ index + 1 }}</h3>
            </el-col>
            <!-- 操作按钮 -->
            <el-col :span="12" class="text-right">
              <el-button type="warning" plain @click="copyHouse(index)">复制此房源</el-button>
              <el-button v-if="houseList.length > 1" type="danger" plain class="remove-btn" @click="removeHouse(index)">删除此房源</el-button>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <!-- 左侧表单区域 -->
            <el-col :span="18">
              <!-- 第一行 -->
              <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="座/栋" :prop="`houseList.${index}.building`" :rules="[{ required: true, message: '请输入座/栋', trigger: 'blur' }]">
                    <el-input v-model="house.building" placeholder="请输入座/栋" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="单元">
                    <el-input v-model="house.unit" placeholder="请输入单元" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="房间号" :prop="`houseList.${index}.doorNumber`" :rules="[{ required: true, message: '请输入房间号', trigger: 'blur' }]">
                    <el-input v-model="house.doorNumber" placeholder="请输入房间号" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item
                    label="所在楼层"
                    :prop="`houseList.${index}.floor`"
                    :rules="[
                      { required: true, message: '请输入所在楼层', trigger: 'blur' },
                      { type: 'number', message: '所在楼层必须是数字', trigger: 'blur', transform: value => Number(value) }
                    ]"
                  >
                    <el-input v-model.number="house.floor" placeholder="请输入楼层" type="number" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item
                    label="总楼层数"
                    :prop="`houseList.${index}.floorTotal`"
                    :rules="[
                      { required: true, message: '请输入总楼层数', trigger: 'blur' },
                      { type: 'number', message: '总楼层数必须是数字', trigger: 'blur', transform: value => Number(value) }
                    ]"
                  >
                    <el-input v-model.number="house.floorTotal" placeholder="请输入总楼层数" type="number" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="户型" :prop="`houseList.${index}.houseLayout`" :rules="[{ required: true, message: '请选择户型', trigger: 'change' }]">
                    <HouseLayoutSelector v-model="house.houseLayout" />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 第二行 -->
              <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="朝向" :prop="`houseList.${index}.direction`" :rules="[{ required: true, message: '请选择朝向', trigger: 'change' }]">
                    <el-select v-model="house.direction" placeholder="请选择朝向" style="width: 100%">
                      <el-option v-for="item in directionOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="面积">
                    <el-input v-model="house.area" placeholder="请输入面积">
                      <template #suffix>m²</template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="装修类型" :prop="`houseList.${index}.decorationType`" :rules="[{ required: true, message: '请选择装修类型', trigger: 'change' }]">
                    <el-select v-model="house.decorationType" placeholder="请选择装修类型" style="width: 100%">
                      <el-option v-for="item in decorationTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item
                    label="出租价格"
                    :prop="`houseList.${index}.roomList[0].price`"
                    :rules="[
                      { required: true, message: '请输入出租价格', trigger: 'blur' },
                      { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入有效的价格', trigger: 'blur' }
                    ]"
                  >
                    <el-space>
                      <el-input v-model="house.roomList[0].price" placeholder="请输入价格">
                        <template #suffix>元/月</template>
                      </el-input>
                      <el-icon class="mr-2 text-blue-700 background-bl" @click="openRoomPriceConfigDialog(index)">
                        <FontIcon icon="icon-zhangben" />
                      </el-icon>
                    </el-space>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="物业费">
                    <el-input v-model="house.propertyFee" placeholder="请输入物业费">
                      <template #suffix>元/月</template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-col>

            <!-- 右侧状态按钮区域 -->
            <el-col :span="6">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="房源特色">
                    <el-button class="status-btn" :type="house.houseLayout.tags && house.houseLayout.tags.length > 0 ? 'success' : 'default'" @click="openHouseTagsDialog(index)">
                      <el-icon>
                        <CircleCheck />
                      </el-icon>
                      <span>{{ house.houseLayout.tags && house.houseLayout.tags.length > 0 ? "已设置" : "未设置" }}</span>
                    </el-button>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="房源配置">
                    <el-button
                      class="status-btn"
                      :type="house.houseLayout.facilities && house.houseLayout.facilities.length > 0 ? 'success' : 'default'"
                      @click="openFacilitiesDialog(index)"
                    >
                      <el-icon>
                        <CircleCheck />
                      </el-icon>
                      <span>{{ getFacilitiesStatusText(house.houseLayout.facilities) }}</span>
                    </el-button>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="产权信息">
                    <el-button class="status-btn" disabled>
                      <el-icon>
                        <CircleCheck />
                      </el-icon>
                      <span>开发中</span>
                    </el-button>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="房源图片">
                    <el-button
                      class="status-btn"
                      :type="house.houseLayout.imageList && house.houseLayout.imageList.length > 0 ? 'success' : 'default'"
                      @click="openImageListDialog(index)"
                    >
                      <el-icon>
                        <CircleCheck />
                      </el-icon>
                      <span>{{ house.houseLayout.imageList && house.houseLayout.imageList.length > 0 ? "已设置" : "未设置" }}</span>
                    </el-button>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="更多信息">
                    <el-button class="status-btn" disabled>
                      <el-icon>
                        <CircleCheck />
                      </el-icon>
                      <span>开发中</span>
                    </el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-col>
          </el-row>
        </div>

        <!-- 添加新房源按钮 -->
        <div class="add-button-wrapper">
          <el-button type="primary" plain @click="addNewHouse">
            <el-icon>
              <Plus />
            </el-icon>
            添加新房源
          </el-button>
        </div>
        <div>
          <!-- 负责人信息 -->
          <h3 class="py-4">负责人信息</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="归属部门" prop="deptId">
                <DeptTreeSelect v-model="entireForm.deptId" :emit-on-default="true" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="负责人" prop="salesmanId">
                <el-select v-model="entireForm.salesmanId" filterable placeholder="请选择负责人" clearable>
                  <el-option v-for="item in salesmanList" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-form>
  </div>
</template>
<style scoped>
  .entier-create-container {
    padding: 5px;
  }

  .house-form-card {
    padding: 10px;
    margin-bottom: 10px;
    background-color: var(--el-bg-color); /* 使用 Element Plus 的 CSS 变量 */
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-form-item__label) {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: #606266;
  }

  .status-section {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .status-section .remove-btn-wrapper {
    display: flex;
    justify-content: flex-end;
  }

  .status-section .el-form-item {
    margin-bottom: 18px;
  }

  .status-btn {
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .status-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .remove-btn {
    margin-top: auto;
  }

  .add-button-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }

  .add-button-wrapper .el-button {
    min-width: 200px;
  }

  :deep(.el-input__suffix) {
    display: flex;
    align-items: center;
  }
</style>
