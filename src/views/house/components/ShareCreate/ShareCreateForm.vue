<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import PoiSearch from "@/components/Business/PoiSearch.vue";
  import { CircleCheck, Delete, Picture, Plus, Setting, Notebook } from "@element-plus/icons-vue";
  import DeptTreeSelect from "@/components/Business/DeptTreeSelect.vue";
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
  import type { FacilityItemProps } from "@/types";

  // 使用hook中的方法
  const { openFacilityEditDialog } = useFacilityEdit();
  const { openHouseTagsEditDialog } = useHouseTagsEdit();
  const { openHouseImageEditDialog } = useHouseImageEdit();
  const { openPriceConfigDialog } = usePriceConfigEdit();
  const { shareFormRef, openShareEditDialog, getScatterDefaultHouseItem, getDefaultRoomItem } = useShareEdit();

  const props = withDefaults(defineProps<ShareFormProps>(), {});
  const emit = defineEmits(["onSave"]);

  // 将 entireForm 和 houseList 合并到一个响应式对象中
  const shareForm = reactive({
    ...props.formInline,
    houseList: [getScatterDefaultHouseItem()]
  });

  // 使用 entireForm.houseList 替代独立的 houseList
  const houseList = shareForm.houseList;

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

  // 房间类型选项
  const roomTypeOptions = ROOM_TYPE_OPTIONS;

  // 添加新房源
  const addNewHouse = () => {
    shareForm.houseList.push(getScatterDefaultHouseItem());
  };

  // 添加新房间
  const addNewRoom = (houseIndex: number) => {
    shareForm.houseList[houseIndex].roomList.push(getDefaultRoomItem());
  };

  // 删除房间
  const removeRoom = (houseIndex: number, roomIndex: number) => {
    if (shareForm.houseList[houseIndex].roomList.length > 1) {
      shareForm.houseList[houseIndex].roomList.splice(roomIndex, 1);
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
    const newHouse = JSON.parse(JSON.stringify(houseToCopy));
    shareForm.houseList.splice(index + 1, 0, newHouse);
  };

  // 删除房源
  const removeHouse = (index: number) => {
    if (shareForm.houseList.length > 1) {
      shareForm.houseList.splice(index, 1);
    }
  };

  /**
   * 房源配置对话框 start
   */
  const openFacilitiesDialog = (index: number) => {
    const currentHouse = shareForm.houseList[index];

    openFacilityEditDialog("", currentHouse.houseLayout.facilities, (facilities: FacilityItemProps[]) => {
      shareForm.houseList[index].houseLayout.facilities = facilities;
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
   * 房间配置对话框 start
   */
  const openRoomFacilitiesDialog = (houseIndex: number, roomIndex: number) => {
    const currentRoom = shareForm.houseList[houseIndex].roomList[roomIndex];

    openFacilityEditDialog("", currentRoom.facilities, (facilities: FacilityItemProps[]) => {
      shareForm.houseList[houseIndex].roomList[roomIndex].facilities = facilities;
    });
  };
  /**
   * 房间配置对话框 end
   */

  /**
   * 房源特色对话框 start
   */
  const openHouseTagsDialog = (index: number) => {
    const currentHouse = shareForm.houseList[index];

    openHouseTagsEditDialog("", currentHouse.houseLayout.tags, (tags: any[]) => {
      shareForm.houseList[index].houseLayout.tags = tags;
    });
  };
  /**
   * 房源特色对话框 end
   */

  /**
   * 房间特色对话框 start
   */
  const openRoomTagsDialog = (houseIndex: number, roomIndex: number) => {
    const currentRoom = shareForm.houseList[houseIndex].roomList[roomIndex];

    openHouseTagsEditDialog("", currentRoom.tags, (tags: any[]) => {
      shareForm.houseList[houseIndex].roomList[roomIndex].tags = tags;
    });
  };
  /**
   * 房间特色对话框 end
   */

  /**
   * 房源图片对话框 start
   */
  const openImageListDialog = (index: number) => {
    const currentHouse = shareForm.houseList[index];

    openHouseImageEditDialog("", currentHouse.houseLayout.imageList, (imageList: any[]) => {
      shareForm.houseList[index].houseLayout.imageList = imageList;
    });
  };
  /**
   * 房源图片对话框 end
   */

  /**
   * 房间图片对话框 start
   */
  const openRoomImageListDialog = (houseIndex: number, roomIndex: number) => {
    const currentRoom = shareForm.houseList[houseIndex].roomList[roomIndex];

    openHouseImageEditDialog("", currentRoom.imageList, (imageList: any[]) => {
      shareForm.houseList[houseIndex].roomList[roomIndex].imageList = imageList;
    });
  };
  /**
   * 房间图片对话框 end
   */

  /**
   * 租金配置对话框 start
   */
  const openRoomPriceConfigDialog = (houseIndex: number, roomIndex: number) => {
    const currentRoom = shareForm.houseList[houseIndex].roomList[roomIndex];

    openPriceConfigDialog("", currentRoom?.priceConfig, (priceConfig: any) => {
      shareForm.houseList[houseIndex].roomList[roomIndex].priceConfig = priceConfig;
      shareForm.houseList[houseIndex].roomList[roomIndex].price = priceConfig.price;
    });
  };
  /**
   * 租金配置对话框 end
   */

  const validateForm = async () => {
    if (!ruleFormRef.value) {
      return false;
    }

    try {
      // 验证整个表单（包括小区信息、负责人信息和所有房源）
      await ruleFormRef.value?.validate();
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
        <!-- 项目信息 -->
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
                  <el-form-item label="房源编号" :prop="`houseList.${index}.houseCode`" :rules="[{ required: true, message: '请输入房源编号', trigger: 'blur' }]">
                    <el-input v-model="house.houseCode" placeholder="请输入房源编号" />
                  </el-form-item>
                </el-col>
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
                  <el-form-item label="公区图片">
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
                  <el-form-item label="公区配置">
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

          <!-- 房间信息 -->
          <div class="share-room-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
              <h4>房间信息</h4>
              <el-button type="primary" plain size="small" @click="addNewRoom(index)">
                <el-icon>
                  <Plus />
                </el-icon>
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
                            <el-input v-model="room.area" placeholder="面积" class="table-input">
                              <template #suffix>m²</template>
                            </el-input>
                          </el-form-item>
                        </td>
                        <td>
                          <el-form-item label-width="0" class="table-form-item" :prop="`houseList.${index}.roomList.${roomIndex}.price`">
                            <el-space>
                              <el-input v-model="room.price" placeholder="租金" class="table-input">
                                <template #suffix>元/月</template>
                              </el-input>
                              <el-icon class="mr-2 text-blue-700 background-bl" @click="openRoomPriceConfigDialog(index, roomIndex)"><Notebook /></el-icon>
                            </el-space>
                          </el-form-item>
                        </td>
                        <td class="text-center">
                          <el-form-item label-width="0" class="table-form-item text-center">
                            <el-button :type="room.imageList && room.imageList.length > 0 ? 'primary' : ''" link size="small" @click="openRoomImageListDialog(index, roomIndex)">
                              <el-icon>
                                <Picture />
                              </el-icon>
                              {{ room.imageList && room.imageList.length > 0 ? "已设置" : "暂无图片" }}
                            </el-button>
                          </el-form-item>
                        </td>
                        <td class="text-center">
                          <el-form-item label-width="0" class="table-form-item">
                            <el-button :type="room.facilities && room.facilities.length > 0 ? 'primary' : ''" link size="small" @click="openRoomFacilitiesDialog(index, roomIndex)">
                              <el-icon>
                                <Setting />
                              </el-icon>
                              {{ room.facilities && room.facilities.length > 0 ? "已设置" : "暂无配置" }}
                            </el-button>
                          </el-form-item>
                        </td>
                        <td class="text-center">
                          <el-form-item label-width="0" class="table-form-item">
                            <el-button :type="room.tags && room.tags.length > 0 ? 'primary' : ''" link size="small" @click="openRoomTagsDialog(index, roomIndex)">
                              <el-icon>
                                <Setting />
                              </el-icon>
                              {{ room.tags && room.tags.length > 0 ? "已设置" : "暂无特色" }}
                            </el-button>
                          </el-form-item>
                        </td>
                        <td class="text-center">
                          <el-form-item label-width="0" class="table-form-item">
                            <el-button type="danger" link size="small" :disabled="house.roomList.length <= 1" @click="removeRoom(index, roomIndex)">
                              <el-icon>
                                <Delete />
                              </el-icon>
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

  .share-room-section {
  }

  /* 表格包装器 - 只针对房间信息表格 */
  .share-room-section .room-table-wrapper {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    overflow: hidden;
  }

  /* 表格基础样式 - 只针对房间信息表格 */
  .share-room-section .room-table {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
    background-color: #fff;
    table-layout: fixed;
  }

  /* 表头样式 - 只针对房间信息表格 */
  .share-room-section .room-table thead {
    background-color: #f5f7fa;
  }

  /* 表头样式 - 只针对房间信息表格 */
  .share-room-section .room-table th {
    padding: 8px;
    text-align: center;
    font-weight: 600;
    font-size: 14px;
    color: #606266;
    border-bottom: 1px solid #e4e7ed;
    border-right: 1px solid #e4e7ed;
    line-height: 1.5;
    height: 32px;
    vertical-align: middle;
  }

  .share-room-section .room-table th:last-child {
    border-right: none;
  }

  /* 表体单元格样式 - 只针对房间信息表格 */
  .share-room-section .room-table td {
    padding: 0;
    border-bottom: 1px solid #e4e7ed;
    border-right: 1px solid #e4e7ed;
    vertical-align: middle;
    position: relative;
    height: 32px;
  }

  .share-room-section .room-table td:last-child {
    border-right: none;
    text-align: center;
  }

  .share-room-section .room-table tbody tr:last-child td {
    border-bottom: none;
  }

  /* 表格行悬停效果 - 只针对房间信息表格 */
  .share-room-section .room-table tbody tr:hover {
    background-color: #f5f7fa;
  }

  /* 文本居中 */
  .text-center {
    text-align: center;
  }

  /* 表单项样式 - 完全移除所有边距和边框 - 只针对房间信息表格 */
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

  /* 输入框和下拉框基础样式 - 只针对房间信息表格 */
  .share-room-section .table-input,
  .share-room-section .table-select {
    width: 100%;
    display: block;
  }

  /* 输入框样式 - 完全填充单元格 - 只针对房间信息表格 */
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

  /* 下拉框样式 - 完全填充单元格 - 只针对房间信息表格 */
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

  /* 下拉框内部元素布局 - 只针对房间信息表格 */
  :deep(.share-room-section .table-select .el-select__selection) {
    display: flex;
    align-items: center;
    flex: 1;
  }

  :deep(.share-room-section .table-select .el-select__selected-item) {
    padding: 0;
    line-height: normal;
    flex: 1;
  }

  :deep(.share-room-section .table-select .el-select__placeholder) {
    padding: 0;
    font-size: 13px;
    text-align: center;
  }

  :deep(.share-room-section .table-select .el-select__suffix) {
    display: flex;
    align-items: center;
    margin-left: 8px;
  }

  :deep(.share-room-section .table-select .el-select__caret) {
    color: #909399;
  }

  /* 下拉框悬停效果 - 只针对房间信息表格 */
  :deep(.share-room-section .table-select .el-select__wrapper:hover) {
    background-color: rgba(64, 158, 255, 0.05);
  }

  /* 输入框聚焦效果 - 只针对房间信息表格 */
  :deep(.share-room-section .table-input .el-input__wrapper.is-focus) {
    background-color: #fff;
  }

  /* 下拉框聚焦/展开效果 - 只针对房间信息表格 */
  :deep(.share-room-section .table-select.is-focused .el-select__wrapper) {
    background-color: #fff;
  }

  /* 输入框内部元素 - 只针对房间信息表格 */
  :deep(.share-room-section .table-input .el-input__inner) {
    padding: 0;
    font-size: 14px;
    color: #606266;
    height: auto;
    line-height: normal;
    text-align: center;
  }

  /* 下拉框选中值样式 - 只针对房间信息表格 */
  :deep(.share-room-section .table-select .el-select__selected-item .el-select__tags-text) {
    font-size: 14px;
    color: #606266;
    text-align: center;
  }

  /* 输入框后缀 - 只针对房间信息表格 */
  :deep(.share-room-section .table-input .el-input__suffix) {
    display: flex;
    align-items: center;
    color: #909399;
    font-size: 13px;
  }

  :deep(.share-room-section .table-input .el-input__suffix-inner) {
    display: inline-flex;
  }

  /* Placeholder 样式 - 只针对房间信息表格 */
  :deep(.share-room-section .table-input .el-input__inner::placeholder) {
    color: #c0c4cc;
    font-size: 13px;
  }

  /* 验证错误状态 - 只针对房间信息表格 */
  :deep(.share-room-section .table-form-item.is-error .el-input__wrapper),
  :deep(.share-room-section .table-form-item.is-error .el-select__wrapper) {
    background-color: #fef0f0 !important;
  }

  :deep(.share-room-section .table-form-item.is-error .el-input__wrapper.is-focus),
  :deep(.share-room-section .table-form-item.is-error .el-select.is-focused .el-select__wrapper) {
    box-shadow: inset 0 0 0 1px #f56c6c !important;
  }

  /* 链接按钮样式 - 只针对房间信息表格 */
  :deep(.share-room-section .table-form-item .el-button--primary.is-link) {
    color: #409eff;
    font-size: 13px;
    padding: 0;
  }

  :deep(.share-room-section .table-form-item .el-button.is-link) {
    color: #606266;
    font-size: 13px;
    padding: 0;
  }

  :deep(.share-room-section .table-form-item .el-button.is-link:hover) {
    color: #409eff;
  }

  :deep(.share-room-section .table-form-item .el-button--danger.is-link) {
    color: #f56c6c;
    padding: 0;
  }

  :deep(.share-room-section .table-form-item .el-button--danger.is-link:hover) {
    color: #f78989;
  }

  :deep(.share-room-section .table-form-item .el-button.is-disabled) {
    color: #c0c4cc;
  }

  /* 按钮图标样式 - 只针对房间信息表格 */
  :deep(.share-room-section .table-form-item .el-button .el-icon) {
    margin-right: 4px;
  }

  /* 禁用状态 - 只针对房间信息表格 */
  :deep(.share-room-section .table-input.is-disabled .el-input__wrapper),
  :deep(.share-room-section .table-select.is-disabled .el-select__wrapper) {
    background-color: #f5f7fa;
    cursor: not-allowed;
  }

  /* 下拉面板样式调整 */
  :deep(.el-select-dropdown) {
    border: 1px solid #e4e7ed;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  /* 响应式调整 - 只针对房间信息表格 */
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

  .add-button-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }

  .add-button-wrapper .el-button {
    min-width: 200px;
  }
</style>
