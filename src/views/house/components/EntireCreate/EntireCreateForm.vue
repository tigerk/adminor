<script setup lang="ts">
  import { onMounted, reactive } from "vue";
  import { useEntireEdit } from "@/views/house/components/EntireCreate/hook";
  import PoiSearch from "@/components/Business/PoiSearch.vue";
  import { EntireFormProps } from "@/views/house/components/EntireCreate/types";
  import { ref } from "vue";
  import { Plus, CircleCheck } from "@element-plus/icons-vue";
  import type { HouseItemProps } from "./types";
  import DeptCascader from "@/components/Business/DeptUserCascader.vue";
  import { getCompanyUserOptions } from "@/api/company";
  import HouseLayoutSelector from "@/views/house/components/HouseLayoutSelector.vue";

  // 使用hook中的方法
  const { openEntireEditDialog } = useEntireEdit();

  const props = withDefaults(defineProps<EntireFormProps>(), {});

  const entireForm = reactive(props.formInline);

  // 负责人列表
  const salesmanList = ref([]);

  const handlePoiSelected = (poi: any) => {
    entireForm.community = {
      name: poi.name, // poi名称
      adcode: poi.adcode, // 地区编码
      cityId: poi.cityId, // 区域ID
      address: poi.address, // 地址
      district: poi.district, // 区域
      location: poi.location // 经纬度
    };
  };

  // 初始化房源列表
  const houseList = ref<HouseItemProps[]>([
    {
      houseCode: "",
      building: "",
      unit: "",
      doorNumber: "",
      floor: null,
      totalFloor: null,
      houseLayout: null,
      rentalType: 1,
      direction: "",
      area: "",
      decorationType: "",
      price: "",
      propertyFee: "",
      features: [],
      images: [],
      moreInfo: null
    }
  ]);

  // 朝向选项
  const directionOptions = [
    { label: "东", value: "东" },
    { label: "南", value: "南" },
    { label: "西", value: "西" },
    { label: "北", value: "北" },
    { label: "东南", value: "东南" },
    { label: "西南", value: "西南" },
    { label: "东北", value: "东北" },
    { label: "西北", value: "西北" }
  ];

  // 添加新房源
  const addNewHouse = () => {
    houseList.value.push({
      houseCode: "",
      building: "",
      unit: "",
      doorNumber: "",
      floor: null,
      totalFloor: null,
      houseLayout: null,
      rentalType: 1,
      direction: "",
      area: "",
      decorationType: "",
      price: "",
      propertyFee: "",
      features: [],
      images: [],
      moreInfo: null
    });
  };

  onMounted(() => {
    getCompanyUserOptions().then(resp => {
      salesmanList.value = resp.data;
    });
  });

  const copyHouse = (index: number) => {
    const houseToCopy = houseList.value[index];
    // 深拷贝当前房源数据
    const newHouse = JSON.parse(JSON.stringify(houseToCopy));
    // 在当前房源后面插入新房源
    houseList.value.splice(index + 1, 0, newHouse);
  };

  // 删除房源
  const removeHouse = (index: number) => {
    if (houseList.value.length > 1) {
      houseList.value.splice(index, 1);
    }
  };
</script>

<template>
  <div class="entier-create-container">
    <el-form ref="ruleFormRef" :model="entireForm" label-position="top">
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
            <el-form-item label="用水" required class="el-form-item">
              <el-select v-model="entireForm.water" placeholder="请选择">
                <el-option label="民用水" value="residential" />
                <el-option label="商业用水" value="commercial" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="用电" required>
              <el-select v-model="entireForm.electricity" placeholder="请选择">
                <el-option label="民用电" value="residential" />
                <el-option label="商业用电" value="commercial" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="供暖信息" required>
              <el-select v-model="entireForm.heating" placeholder="请选择">
                <el-option label="独立供暖" value="independent" />
                <el-option label="集中供暖" value="central" />
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
            <!-- 左侧表单区域 -->
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
                  <el-form-item label="房源编号" prop="houseCode">
                    <el-input v-model="house.houseCode" placeholder="请输入房源编号" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="座/栋" prop="building">
                    <el-input v-model="house.building" placeholder="请输入座/栋" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="单元" prop="unit">
                    <el-input v-model="house.unit" placeholder="请输入单元" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="房间号" prop="doorNumber">
                    <el-input v-model="house.doorNumber" placeholder="请输入房间号" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="所在楼层" prop="floor">
                    <el-input v-model="house.floor" placeholder="请输入楼层" type="number" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="总楼层数" prop="totalFloor">
                    <el-input v-model="house.totalFloor" placeholder="请输入总楼层数" type="number" />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 第三行 -->
              <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="户型" prop="houseLayout">
                    <HouseLayoutSelector v-model="house.houseLayout" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="朝向" prop="direction">
                    <el-select v-model="house.direction" placeholder="请选择朝向" style="width: 100%">
                      <el-option v-for="item in directionOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="面积" prop="area">
                    <el-input v-model="house.area" placeholder="请输入面积">
                      <template #suffix>m²</template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="装修类型" prop="decorationType">
                    <el-input v-model="house.decorationType" placeholder="请输入装修类型" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="出租价格" prop="price">
                    <el-input v-model="house.price" placeholder="请输入价格">
                      <template #suffix>元/月</template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="物业费" prop="propertyFee">
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
                    <el-button class="status-btn">
                      <el-icon>
                        <CircleCheck />
                      </el-icon>
                      <span>未设置</span>
                    </el-button>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="房源配置">
                    <el-button class="status-btn">
                      <el-icon>
                        <CircleCheck />
                      </el-icon>
                      <span>未设置</span>
                    </el-button>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="产权信息">
                    <el-button class="status-btn">
                      <el-icon>
                        <CircleCheck />
                      </el-icon>
                      <span>未设置</span>
                    </el-button>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="房源图片">
                    <el-button class="status-btn">
                      <el-icon>
                        <CircleCheck />
                      </el-icon>
                      <span>未设置</span>
                    </el-button>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="更多信息">
                    <el-button class="status-btn">
                      <el-icon>
                        <CircleCheck />
                      </el-icon>
                      <span>未设置</span>
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
                <DeptCascader v-model="entireForm.deptId" :emit-on-default="true" />
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
    background-color: #fff;
    border: 1px solid #dcdfe6;
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
    justify-content: flex-end; /* 使子元素（即删除按钮）靠右 */
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
