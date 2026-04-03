<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import PoiSearch from "@/components/region/PoiSearch.vue";
  import { CircleCheck, Delete, Picture, Plus, Setting } from "@element-plus/icons-vue";
  import DeptTreeSelect from "@/components/org/DeptTreeSelect.vue";
  import { getCompanyUserOptions } from "@/api/company";
  import { useFacilityEdit } from "@/views/house/components/HouseFacility/hook";
  import HouseLayoutSelector from "@/views/house/components/HouseLayout/HouseLayoutSelector.vue";
  import { useHouseTagsEdit } from "@/views/house/components/HouseTags/hook";
  import { createShareFormRules } from "./rule";
  import type { FormInstance } from "element-plus";
  import { ElMessage } from "element-plus";
  import { useHouseImageEdit } from "@/views/house/components/HouseImage/hook";
  import { DECORATION_TYPE_OPTIONS, DIRECTION_OPTIONS, ELECTRICITY_TYPE_OPTIONS, HEATING_TYPE_OPTIONS, ROOM_TYPE_OPTIONS, WATER_TYPE_OPTIONS } from "@/constants";
  import { ShareFormProps } from "@/views/house/components/ShareCreate/types";
  import { usePriceConfigEdit } from "@/views/house/components/PriceConfig/hook";
  import { useShareEdit } from "@/views/house/components/ShareCreate/hook";
  import type { FacilityItemDto, PriceConfigDto, ScatterHouseDto } from "@/types";

  // 使用hook中的方法
  const { openFacilityEditDialog } = useFacilityEdit();
  const { openHouseTagsEditDialog } = useHouseTagsEdit();
  const { openHouseImageEditDialog } = useHouseImageEdit();
  const { openPriceConfigDialog } = usePriceConfigEdit();
  const { getScatterDefaultHouseItem, getDefaultRoomItem } = useShareEdit();

  const props = withDefaults(defineProps<ShareFormProps>(), {});
  const emit = defineEmits(["onSave"]);

  // 合并 props.formInline 到响应式对象，houseList 若为空则初始化默认值
  const shareForm = reactive({
    ...props.formInline,
    houseList: props.formInline?.houseList?.length ? props.formInline.houseList : [getScatterDefaultHouseItem()]
  });

  // 确保每个 house 的 houseLayout 和 roomList 均已初始化（兼容从后端加载的数据）
  shareForm.houseList.forEach((house: ScatterHouseDto) => {
    if (!house.houseLayout) {
      house.houseLayout = { imageList: [], tags: [], facilities: [] };
    }
    house.houseLayout.imageList = house.houseLayout.imageList ?? [];
    house.houseLayout.tags = house.houseLayout.tags ?? [];
    house.houseLayout.facilities = house.houseLayout.facilities ?? [];

    if (!house.roomList || house.roomList.length === 0) {
      house.roomList = [getDefaultRoomItem()];
    }
    house.roomList.forEach(room => {
      room.imageList = room.imageList ?? [];
      room.facilities = room.facilities ?? [];
      room.tags = room.tags ?? [];
    });
  });

  // 直接引用 shareForm.houseList，保持响应性
  const houseList = shareForm.houseList as ScatterHouseDto[];

  // 表单引用
  const ruleFormRef = ref<FormInstance>();

  // 创建表单验证规则
  const rules = createShareFormRules(shareForm);

  // 负责人列表
  const salesmanList = ref([]);

  const handlePoiSelected = (poi: any) => {
    shareForm.community = {
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
  const roomTypeOptions = ROOM_TYPE_OPTIONS;

  // 添加新房源
  const addNewHouse = () => {
    shareForm.houseList.push(getScatterDefaultHouseItem());
  };

  // 添加新房间
  const addNewRoom = (houseIndex: number) => {
    shareForm.houseList[houseIndex].roomList!.push(getDefaultRoomItem());
  };

  // 删除房间
  const removeRoom = (houseIndex: number, roomIndex: number) => {
    const roomList = shareForm.houseList[houseIndex].roomList!;
    if (roomList.length > 1) {
      roomList.splice(roomIndex, 1);
    } else {
      ElMessage.warning("至少保留一个房间");
    }
  };

  onMounted(() => {
    getCompanyUserOptions().then(resp => {
      salesmanList.value = resp.data;
    });
  });

  const copyHouse = (index: number) => {
    const houseToCopy = shareForm.houseList[index];
    const newHouse: ScatterHouseDto = JSON.parse(JSON.stringify(houseToCopy));
    newHouse.id = undefined;
    newHouse.roomList?.forEach(room => (room.id = undefined));
    if (newHouse.houseLayout) {
      newHouse.houseLayout.id = undefined;
    }
    shareForm.houseList.splice(index + 1, 0, newHouse);
  };

  // 删除房源
  const removeHouse = (index: number) => {
    if (shareForm.houseList.length > 1) {
      shareForm.houseList.splice(index, 1);
    }
  };

  /**
   * 公区配置对话框
   */
  const openFacilitiesDialog = (index: number) => {
    const currentHouse = shareForm.houseList[index];
    openFacilityEditDialog("", currentHouse.houseLayout!.facilities, (facilities: FacilityItemDto[]) => {
      shareForm.houseList[index].houseLayout!.facilities = facilities;
    });
  };

  const getFacilitiesStatusText = (features: any[]) => {
    return features && features.length > 0 ? "已设置" : "未设置";
  };

  /**
   * 房间配置对话框
   */
  const openRoomFacilitiesDialog = (houseIndex: number, roomIndex: number) => {
    const currentRoom = shareForm.houseList[houseIndex].roomList![roomIndex];
    openFacilityEditDialog("", currentRoom.facilities, (facilities: FacilityItemDto[]) => {
      shareForm.houseList[houseIndex].roomList![roomIndex].facilities = facilities;
    });
  };

  /**
   * 公区特色对话框
   */
  const openHouseTagsDialog = (index: number) => {
    const currentHouse = shareForm.houseList[index];
    openHouseTagsEditDialog("", currentHouse.houseLayout!.tags, (tags: any[]) => {
      shareForm.houseList[index].houseLayout!.tags = tags;
    });
  };

  /**
   * 房间特色对话框
   */
  const openRoomTagsDialog = (houseIndex: number, roomIndex: number) => {
    const currentRoom = shareForm.houseList[houseIndex].roomList![roomIndex];
    openHouseTagsEditDialog("", currentRoom.tags, (tags: any[]) => {
      shareForm.houseList[houseIndex].roomList![roomIndex].tags = tags;
    });
  };

  /**
   * 公区图片对话框
   */
  const openImageListDialog = (index: number) => {
    const currentHouse = shareForm.houseList[index];
    openHouseImageEditDialog("", currentHouse.houseLayout!.imageList, (imageList: any[]) => {
      shareForm.houseList[index].houseLayout!.imageList = imageList;
    });
  };

  /**
   * 房间图片对话框
   */
  const openRoomImageListDialog = (houseIndex: number, roomIndex: number) => {
    const currentRoom = shareForm.houseList[houseIndex].roomList![roomIndex];
    openHouseImageEditDialog("", currentRoom.imageList, (imageList: any[]) => {
      shareForm.houseList[houseIndex].roomList![roomIndex].imageList = imageList;
    });
  };

  /**
   * 租金配置对话框
   */
  const openRoomPriceConfigDialog = (houseIndex: number, roomIndex: number) => {
    const currentRoom = shareForm.houseList[houseIndex].roomList![roomIndex];
    openPriceConfigDialog("", currentRoom.priceConfig, (priceConfig: PriceConfigDto) => {
      shareForm.houseList[houseIndex].roomList![roomIndex].priceConfig = priceConfig;
      shareForm.houseList[houseIndex].roomList![roomIndex].price = priceConfig.price;
    });
  };

  const validateForm = async (): Promise<boolean> => {
    if (!ruleFormRef.value) return false;
    try {
      await ruleFormRef.value.validate();
      return true;
    } catch (error) {
      console.error("表单验证失败", error);
      ElMessage.error("请填写完整的表单信息");
      return false;
    }
  };

  // 暴露给父组件的方法和数据
  defineExpose({
    validateForm,
    shareForm
  });
</script>

<template>
  <div class="entier-create-container">
    <div>
      <el-form ref="ruleFormRef" :model="shareForm" :rules="rules" label-width="100px" label-position="top">
        <!-- 小区信息 -->
        <h3 class="pb-4">小区信息</h3>
        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="小区地址" prop="community.name">
              <PoiSearch :cityId="shareForm?.community?.cityId" :name="shareForm?.community?.name" @poi-selected="handlePoiSelected" />
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="用水" prop="water" class="el-form-item">
              <el-select v-model="shareForm.water" placeholder="请选择">
                <el-option v-for="item in WATER_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="用电" prop="electricity">
              <el-select v-model="shareForm.electricity" placeholder="请选择">
                <el-option v-for="item in ELECTRICITY_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="供暖信息" prop="heating">
              <el-select v-model="shareForm.heating" placeholder="请选择">
                <el-option v-for="item in HEATING_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="2">
            <el-form-item label="&nbsp;">
              <el-checkbox v-model="shareForm.hasGas">有燃气</el-checkbox>
            </el-form-item>
          </el-col>
          <el-col :span="2">
            <el-form-item label="&nbsp;">
              <el-checkbox v-model="shareForm.hasElevator">有电梯</el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 房源信息 -->
        <h3 class="py-4">房源信息</h3>
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
            <el-col :span="18">
              <!-- 第一行 -->
              <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="座/栋" :prop="`houseList.${index}.building`" :rules="[{ required: true, message: '请输入座/栋', trigger: 'blur' }]">
                    <el-input v-model="house.building" placeholder="请输入座/栋" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="单元" :prop="`houseList.${index}.unit`">
                    <el-input v-model="house.unit" placeholder="请输入单元" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="门牌号" :prop="`houseList.${index}.doorNumber`" :rules="[{ required: true, message: '请输入门牌号', trigger: 'blur' }]">
                    <el-input v-model="house.doorNumber" placeholder="请输入门牌号" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item
                    label="所在楼层"
                    :prop="`houseList.${index}.floor`"
                    :rules="[
                      { required: true, message: '请输入所在楼层', trigger: 'blur' },
                      { type: 'number', message: '所在楼层必须是数字', trigger: 'blur', transform: (value: any) => Number(value) }
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
                      { type: 'number', message: '总楼层数必须是数字', trigger: 'blur', transform: (value: any) => Number(value) }
                    ]"
                  >
                    <el-input v-model.number="house.floorTotal" placeholder="请输入总楼层数" type="number" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="装修类型" :prop="`houseList.${index}.decorationType`" :rules="[{ required: true, message: '请选择装修类型', trigger: 'change' }]">
                    <el-select v-model="house.decorationType" placeholder="请选择装修类型" style="width: 100%">
                      <el-option v-for="item in decorationTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 第二行 -->
              <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="户型" :prop="`houseList.${index}.houseLayout`" :rules="[{ required: true, message: '请选择户型', trigger: 'change' }]">
                    <HouseLayoutSelector v-model="house.houseLayout" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="朝向" :prop="`houseList.${index}.direction`" :rules="[{ required: true, message: '请选择朝向', trigger: 'change' }]">
                    <el-select v-model="house.direction" placeholder="请选择朝向" style="width: 100%">
                      <el-option v-for="item in directionOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="面积">
                    <!-- 使用 .number 修饰符，与 area: number | undefined 类型一致 -->
                    <el-input v-model.number="house.area" placeholder="请输入面积" type="number">
                      <template #suffix>m²</template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="物业费">
                    <!-- 使用 .number 修饰符，与 propertyFee: number | undefined 类型一致 -->
                    <el-input v-model.number="house.propertyFee" placeholder="请输入物业费" type="number">
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
                  <el-form-item label="公区图片">
                    <el-button
                      class="status-btn"
                      :type="house.houseLayout?.imageList && house.houseLayout.imageList.length > 0 ? 'success' : 'default'"
                      @click="openImageListDialog(index)"
                    >
                      <el-icon><CircleCheck /></el-icon>
                      <span>{{ house.houseLayout?.imageList && house.houseLayout.imageList.length > 0 ? "已设置" : "未设置" }}</span>
                    </el-button>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="公区配置">
                    <el-button
                      class="status-btn"
                      :type="house.houseLayout?.facilities && house.houseLayout.facilities.length > 0 ? 'success' : 'default'"
                      @click="openFacilitiesDialog(index)"
                    >
                      <el-icon><CircleCheck /></el-icon>
                      <span>{{ getFacilitiesStatusText(house.houseLayout?.facilities ?? []) }}</span>
                    </el-button>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="产权信息">
                    <el-button class="status-btn" disabled>
                      <el-icon><CircleCheck /></el-icon>
                      <span>开发中</span>
                    </el-button>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="更多信息">
                    <el-button class="status-btn" disabled>
                      <el-icon><CircleCheck /></el-icon>
                      <span>开发中</span>
                    </el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-col>
          </el-row>

          <!-- 房间信息 -->
          <div class="share-room-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
              <h4>房间信息</h4>
              <el-button type="primary" plain size="small" @click="addNewRoom(index)">
                <el-icon><Plus /></el-icon>
                添加房间
              </el-button>
            </div>

            <el-row>
              <el-col :span="24">
                <div class="room-table-wrapper">
                  <table class="room-table">
                    <thead>
                      <tr>
                        <th style="width: 8%">房间号</th>
                        <th style="width: 10%">房间类型</th>
                        <th style="width: 10%">朝向</th>
                        <th style="width: 10%">面积</th>
                        <th style="width: 12%">出租价格</th>
                        <th style="width: 10%">图片</th>
                        <th style="width: 10%">配置</th>
                        <th style="width: 10%">特色</th>
                        <th style="width: 8%">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(room, roomIndex) in house.roomList" :key="roomIndex">
                        <td>
                          <el-form-item label-width="0" class="table-form-item" :prop="`houseList.${index}.roomList.${roomIndex}.roomNumber`">
                            <el-input v-model="room.roomNumber" placeholder="房间号" class="table-input" />
                          </el-form-item>
                        </td>
                        <td>
                          <el-form-item label-width="0" class="table-form-item" :prop="`houseList.${index}.roomList.${roomIndex}.roomType`">
                            <el-select v-model="room.roomType" placeholder="类型" class="table-select">
                              <el-option v-for="item in roomTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                          </el-form-item>
                        </td>
                        <td>
                          <el-form-item label-width="0" class="table-form-item" :prop="`houseList.${index}.roomList.${roomIndex}.direction`">
                            <el-select v-model="room.direction" placeholder="朝向" class="table-select">
                              <el-option v-for="item in directionOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                          </el-form-item>
                        </td>
                        <td>
                          <el-form-item label-width="0" class="table-form-item" :prop="`houseList.${index}.roomList.${roomIndex}.area`">
                            <!-- 使用 .number 修饰符，与 area: number | undefined 类型一致 -->
                            <el-input v-model.number="room.area" placeholder="面积" class="table-input" type="number">
                              <template #suffix>m²</template>
                            </el-input>
                          </el-form-item>
                        </td>
                        <td>
                          <el-form-item label-width="0" class="table-form-item" :prop="`houseList.${index}.roomList.${roomIndex}.price`">
                            <el-space>
                              <!-- 使用 .number 修饰符，与 price: number | undefined 类型一致 -->
                              <el-input v-model.number="room.price" placeholder="租金" class="table-input" type="number">
                                <template #suffix>元/月</template>
                              </el-input>
                              <el-icon class="mr-2 text-blue-700 background-bl" @click="openRoomPriceConfigDialog(index, roomIndex)">
                                <FontIcon icon="icon-zhangben" />
                              </el-icon>
                            </el-space>
                          </el-form-item>
                        </td>
                        <td class="text-center">
                          <el-form-item label-width="0" class="table-form-item text-center">
                            <el-button :type="room.imageList && room.imageList.length > 0 ? 'primary' : ''" link size="small" @click="openRoomImageListDialog(index, roomIndex)">
                              <el-icon><Picture /></el-icon>
                              {{ room.imageList && room.imageList.length > 0 ? "已设置" : "暂无图片" }}
                            </el-button>
                          </el-form-item>
                        </td>
                        <td class="text-center">
                          <el-form-item label-width="0" class="table-form-item">
                            <el-button :type="room.facilities && room.facilities.length > 0 ? 'primary' : ''" link size="small" @click="openRoomFacilitiesDialog(index, roomIndex)">
                              <el-icon><Setting /></el-icon>
                              {{ room.facilities && room.facilities.length > 0 ? "已设置" : "暂无配置" }}
                            </el-button>
                          </el-form-item>
                        </td>
                        <td class="text-center">
                          <el-form-item label-width="0" class="table-form-item">
                            <el-button :type="room.tags && room.tags.length > 0 ? 'primary' : ''" link size="small" @click="openRoomTagsDialog(index, roomIndex)">
                              <el-icon><Setting /></el-icon>
                              {{ room.tags && room.tags.length > 0 ? "已设置" : "暂无特色" }}
                            </el-button>
                          </el-form-item>
                        </td>
                        <td class="text-center">
                          <el-form-item label-width="0" class="table-form-item">
                            <el-button type="danger" link size="small" :disabled="house.roomList!.length <= 1" @click="removeRoom(index, roomIndex)">
                              <el-icon><Delete /></el-icon>
                              删除
                            </el-button>
                          </el-form-item>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 添加新房源按钮 -->
        <div class="add-button-wrapper">
          <el-button type="primary" plain @click="addNewHouse">
            <el-icon><Plus /></el-icon>
            添加新房源
          </el-button>
        </div>

        <div>
          <!-- 负责人信息 -->
          <h3 class="py-4">负责人信息</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="归属部门" prop="deptId">
                <DeptTreeSelect v-model="shareForm.deptId" :emit-on-default="true" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="负责人" prop="salesmanId">
                <el-select v-model="shareForm.salesmanId" filterable placeholder="请选择负责人" clearable>
                  <el-option v-for="item in salesmanList" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
  /* 基础容器样式 - 支持深色模式 */
  .entier-create-container {
    padding: 5px;
    background-color: var(--el-bg-color);
    color: var(--el-text-color-primary);
  }

  /* 标题样式 - 支持深色模式 */
  .section-title {
    color: var(--el-text-color-primary);
    transition: color 0.3s;
  }

  /* 房源卡片 - 支持深色模式 */
  .house-form-card {
    padding: 10px;
    margin-bottom: 10px;
    background-color: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    transition: all 0.3s;
  }

  /* 深色模式下的房源卡片增强 */
  .dark .house-form-card {
    background-color: var(--el-fill-color-light);
    border-color: var(--el-border-color-darker);
  }

  /* 房间信息区域 */
  .share-room-section {
    margin-top: 10px;
  }

  /* 表格包装器 - 支持深色模式 */
  .share-room-section .room-table-wrapper {
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    overflow: hidden;
    background-color: var(--el-fill-color-blank);
    transition: all 0.3s;
  }

  /* 深色模式下的表格包装器 */
  .dark .share-room-section .room-table-wrapper {
    background-color: var(--el-bg-color);
    border-color: var(--el-border-color-darker);
  }

  /* 表格基础样式 - 支持深色模式 */
  .share-room-section .room-table {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
    background-color: var(--el-fill-color-blank);
    table-layout: fixed;
    transition: background-color 0.3s;
  }

  /* 表头样式 - 支持深色模式 */
  .share-room-section .room-table thead {
    background-color: var(--el-fill-color-light);
    transition: background-color 0.3s;
  }

  /* 深色模式下的表头 */
  .dark .share-room-section .room-table thead {
    background-color: var(--el-fill-color-dark);
  }

  /* 表头单元格 - 支持深色模式 */
  .share-room-section .room-table th {
    padding: 8px;
    text-align: center;
    font-weight: 600;
    font-size: 14px;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color);
    border-right: 1px solid var(--el-border-color);
    line-height: 1.5;
    height: 32px;
    vertical-align: middle;
    transition: all 0.3s;
  }

  .share-room-section .room-table th:last-child {
    border-right: none;
  }

  /* 表体单元格 - 支持深色模式 */
  .share-room-section .room-table td {
    padding: 0;
    border-bottom: 1px solid var(--el-border-color);
    border-right: 1px solid var(--el-border-color);
    vertical-align: middle;
    position: relative;
    height: 32px;
    background-color: var(--el-fill-color-blank);
    transition: all 0.3s;
  }

  .share-room-section .room-table td:last-child {
    border-right: none;
    text-align: center;
  }

  .share-room-section .room-table tbody tr:last-child td {
    border-bottom: none;
  }

  /* 表格行悬停效果 - 支持深色模式 */
  .share-room-section .room-table tbody tr:hover {
    background-color: var(--el-fill-color-light);
  }

  .dark .share-room-section .room-table tbody tr:hover {
    background-color: var(--el-fill-color);
  }

  /* 表格行悬停时单元格背景 */
  .share-room-section .room-table tbody tr:hover td {
    background-color: var(--el-fill-color-light);
  }

  .dark .share-room-section .room-table tbody tr:hover td {
    background-color: var(--el-fill-color);
  }

  /* 文本居中 */
  .text-center {
    text-align: center;
  }

  /* 表单项样式 */
  .share-room-section .table-form-item {
    margin: 0 !important;
    width: 100%;
  }

  :deep(.share-room-section .table-form-item .el-form-item__content) {
    margin: 0 !important;
    line-height: normal;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  :deep(.share-room-section .table-form-item .el-form-item__error) {
    position: absolute;
    bottom: -20px;
    left: 12px;
    padding-top: 0;
    font-size: 12px;
    line-height: 1;
    z-index: 10;
  }

  /* 输入框和下拉框基础样式 */
  .share-room-section .table-input,
  .share-room-section .table-select {
    width: 100%;
    display: block;
  }

  /* 输入框样式 - 支持深色模式 */
  :deep(.share-room-section .table-input .el-input__wrapper) {
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    background-color: transparent !important;
    padding: 4px;
    transition: background-color 0.2s;
    min-height: 32px;
    box-sizing: border-box;
  }

  /* 下拉框样式 - 支持深色模式 */
  :deep(.share-room-section .table-select .el-select__wrapper) {
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    background-color: transparent !important;
    padding: 4px;
    transition: background-color 0.2s;
    width: 100%;
    display: flex;
    justify-content: center;
    min-height: 32px;
    box-sizing: border-box;
  }

  /* 输入框聚焦效果 - 支持深色模式 */
  :deep(.share-room-section .table-input .el-input__wrapper.is-focus) {
    background-color: var(--el-fill-color-blank);
  }

  .dark :deep(.share-room-section .table-input .el-input__wrapper.is-focus) {
    background-color: var(--el-bg-color);
  }

  /* 下拉框聚焦效果 */
  :deep(.share-room-section .table-select.is-focused .el-select__wrapper) {
    background-color: var(--el-fill-color-blank);
  }

  .dark :deep(.share-room-section .table-select.is-focused .el-select__wrapper) {
    background-color: var(--el-bg-color);
  }

  /* 输入框内部元素 - 支持深色模式 */
  :deep(.share-room-section .table-input .el-input__inner) {
    padding: 0;
    font-size: 14px;
    color: var(--el-text-color-primary);
    height: auto;
    line-height: normal;
    text-align: center;
    transition: color 0.3s;
  }

  /* 下拉框选中值样式 */
  :deep(.share-room-section .table-select .el-select__selected-item .el-select__tags-text) {
    font-size: 14px;
    color: var(--el-text-color-primary);
    text-align: center;
    transition: color 0.3s;
  }

  /* 输入框后缀 */
  :deep(.share-room-section .table-input .el-input__suffix) {
    display: flex;
    align-items: center;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    transition: color 0.3s;
  }

  /* Placeholder 样式 */
  :deep(.share-room-section .table-input .el-input__inner::placeholder) {
    color: var(--el-text-color-placeholder);
    font-size: 13px;
  }

  /* 验证错误状态 */
  :deep(.share-room-section .table-form-item.is-error .el-input__wrapper),
  :deep(.share-room-section .table-form-item.is-error .el-select__wrapper) {
    background-color: var(--el-color-error-light-9) !important;
  }

  :deep(.share-room-section .table-form-item.is-error .el-input__wrapper.is-focus),
  :deep(.share-room-section .table-form-item.is-error .el-select.is-focused .el-select__wrapper) {
    box-shadow: inset 0 0 0 1px var(--el-color-error) !important;
  }

  /* 链接按钮样式 - 支持深色模式 */
  :deep(.share-room-section .table-form-item .el-button--primary.is-link) {
    color: var(--el-color-primary);
    font-size: 13px;
    padding: 0;
  }

  :deep(.share-room-section .table-form-item .el-button.is-link) {
    color: var(--el-text-color-primary);
    font-size: 13px;
    padding: 0;
    transition: color 0.3s;
  }

  :deep(.share-room-section .table-form-item .el-button.is-link:hover) {
    color: var(--el-color-primary);
  }

  /* 添加按钮包装器 */
  .add-button-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }

  .add-button-wrapper .el-button {
    min-width: 200px;
  }

  /* 禁用状态 */
  :deep(.share-room-section .table-input.is-disabled .el-input__wrapper),
  :deep(.share-room-section .table-select.is-disabled .el-select__wrapper) {
    background-color: var(--el-fill-color-light);
    cursor: not-allowed;
  }

  .dark :deep(.share-room-section .table-input.is-disabled .el-input__wrapper),
  .dark :deep(.share-room-section .table-select.is-disabled .el-select__wrapper) {
    background-color: var(--el-fill-color-dark);
  }

  /* 响应式调整 */
  @media screen and (max-width: 1600px) {
    .share-room-section .room-table th,
    :deep(.share-room-section .table-input .el-input__wrapper),
    :deep(.share-room-section .table-select .el-select__wrapper) {
      padding: 6px 8px;
      font-size: 13px;
    }

    :deep(.share-room-section .table-form-item .el-button) {
      font-size: 12px;
    }
  }

  @media screen and (max-width: 1366px) {
    .share-room-section .room-table th,
    :deep(.share-room-section .table-input .el-input__wrapper),
    :deep(.share-room-section .table-select .el-select__wrapper) {
      padding: 4px 6px;
      font-size: 12px;
    }
  }
</style>
