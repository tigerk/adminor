<script setup lang="ts">
  import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
  import { FormProps, FocusFormItemProps, HouseStatusProps, FocusBuildingProps } from "@/views/house/focus/components/FocusCreate/utils/types";
  import RegionCascader from "@/components/Business/RegionCascader.vue";
  import DeptCascader from "@/components/Business/DeptUserCascader.vue";
  import { getDeptUserList } from "@/api/sys/dept";
  import { useFocusEdit } from "@/views/house/focus/components/FocusCreate/utils/hook";
  import { InfoFilled, Plus, Delete } from "@element-plus/icons-vue";
  import AntDesignLockFilled from "~icons/ant-design/lock-filled";
  import { focusBasicInfoRules } from "@/views/house/focus/components/FocusCreate/utils/rule";
  import { ElMessage, ElMessageBox } from "element-plus";
  import { getCompanyUserOptions } from "@/api/company";

  // 获取 FocusCreateForm 中的form数据
  const form = defineModel<FocusFormItemProps>();

  // 定义 emits
  const emit = defineEmits<{
    "to-assign-room": [];
  }>();

  // 负责人列表
  const salesmanList = ref([]);
  const ruleFormRef = ref();

  function getRef() {
    return ruleFormRef.value;
  }

  defineExpose({ getRef });

  // 添加新楼栋
  const addBuilding = () => {
    const newBuilding: FocusBuildingProps = {
      building: "",
      unit: "",
      floorTotal: 2,
      houseCountPerFloor: 10,
      closedFloors: [],
      closedHouses: [],
      selectedFloor: 1,
      housePrefix: `B${form.value.buildings.length + 1}`,
      excludeFour: false,
      numberLength: 3,
      housesStatusOfFloors: new Map<number, Map<string, HouseStatusProps>>()
    };
    form.value.buildings.push(newBuilding);
    // 初始化新楼栋
    nextTick(() => {
      initAllFloorsForBuilding(form.value.buildings.length - 1);
    });
  };

  // 删除楼栋
  const removeBuilding = (index: number) => {
    if (form.value.buildings.length <= 1) {
      ElMessage.warning("至少需要保留一个楼栋");
      return;
    }
    ElMessageBox.confirm("确认删除该楼栋吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        form.value.buildings.splice(index, 1);
        ElMessage.success("删除成功");
      })
      .catch(() => {});
  };

  // 为指定楼栋初始化所有楼层房源状态
  const initAllFloorsForBuilding = (buildingIndex: number) => {
    const building = form.value.buildings[buildingIndex];
    if (!building.floorTotal || !building.houseCountPerFloor) {
      return;
    }

    // 初始化 Map
    if (!building.housesStatusOfFloors) {
      building.housesStatusOfFloors = new Map<number, Map<string, HouseStatusProps>>();
    } else {
      building.housesStatusOfFloors.clear();
    }

    // 初始化每个楼层的房源数据
    for (let floor = 1; floor <= building.floorTotal; floor++) {
      const houseStatusMap = new Map<string, HouseStatusProps>();

      for (let house = 1; house <= building.houseCountPerFloor; house++) {
        const houseNum = house.toString();
        if (building.excludeFour && houseNum.endsWith("4")) {
          continue;
        }

        houseStatusMap.set(houseNum, {
          cursor: `${buildingIndex}-${floor}-${house}`,
          houseIndex: house,
          doorNumber: useFocusEdit().formatHouseNumber(building.housePrefix, building.numberLength, floor, houseNum),
          locked: false,
          floor: floor,
          building: building.building,
          unit: building.unit,
          houseLayoutId: null,
          price: 0,
          direction: "",
          area: 0
        });
      }

      building.housesStatusOfFloors.set(floor, houseStatusMap);
    }

    // 自动选中第一个楼层
    if (building.floorTotal > 0 && !building.selectedFloor) {
      building.selectedFloor = 1;
    }
  };

  // 获取指定楼栋的楼层列表
  const getFloorList = (buildingIndex: number) => {
    const building = form.value.buildings[buildingIndex];
    if (!building?.floorTotal) {
      return [];
    }
    return Array.from({ length: building.floorTotal }, (_, i) => i + 1);
  };

  // 获取指定楼栋指定楼层的房源列表
  const getHouseListForFloor = (buildingIndex: number, floor: number) => {
    const building = form.value.buildings[buildingIndex];
    if (!building?.housesStatusOfFloors || !building.housesStatusOfFloors.has(floor)) {
      return [];
    }

    let houses = Array.from(building.housesStatusOfFloors.get(floor).values());

    // 如果启用了"去4"选项，则过滤掉房源号末位是4的房源
    if (building.excludeFour) {
      houses = houses.filter(item => !item.doorNumber.endsWith("4"));
    }

    return houses;
  };

  // 获取指定楼栋指定楼层的房源数量
  const getHouseCountForFloor = (buildingIndex: number, floor: number) => {
    const building = form.value.buildings[buildingIndex];
    if (!building?.housesStatusOfFloors || !building.housesStatusOfFloors.has(floor)) {
      return 0;
    }
    return building.housesStatusOfFloors.get(floor).size;
  };

  // 楼层选择处理
  const handleFloorSelect = (buildingIndex: number, floor: number) => {
    const building = form.value.buildings[buildingIndex];
    building.selectedFloor = floor;

    // 如果选中的楼层没有房源数据，使用默认房源数量初始化
    if (!building.housesStatusOfFloors.has(floor) && building.houseCountPerFloor) {
      initHouseListOfFloor(buildingIndex, floor, building.houseCountPerFloor);
    }
  };

  // 初始化特定楼层房源列表
  const initHouseListOfFloor = (buildingIndex: number, floor: number, houseCount: number) => {
    const building = form.value.buildings[buildingIndex];
    const houseStatusMap = new Map<string, HouseStatusProps>();

    for (let i = 1; i <= houseCount; i++) {
      const houseNum = i.toString();
      if (building.excludeFour && houseNum.endsWith("4")) {
        continue;
      }

      houseStatusMap.set(houseNum, {
        cursor: `${buildingIndex}-${floor}-${i}`,
        houseIndex: i,
        doorNumber: useFocusEdit().formatHouseNumber(building.housePrefix, building.numberLength, floor, houseNum),
        locked: false,
        floor: floor,
        building: building.building,
        unit: building.unit,
        houseLayoutId: null,
        price: 0,
        direction: "",
        area: 0
      });
    }

    building.housesStatusOfFloors.set(floor, houseStatusMap);
  };

  // 更新特定楼栋楼层的房源数量
  const updateHouseCountForFloor = (buildingIndex: number, floor: number, newHouseCount: number) => {
    const building = form.value.buildings[buildingIndex];
    const houseCount = Number(newHouseCount);

    if (isNaN(houseCount) || houseCount < 1) {
      return;
    }

    if (!building.housesStatusOfFloors.has(floor)) {
      initHouseListOfFloor(buildingIndex, floor, houseCount);
      return;
    }

    const currentFloor = building.housesStatusOfFloors.get(floor);
    const currentSize = currentFloor.size;

    if (houseCount > currentSize) {
      // 增加房源
      for (let i = currentSize + 1; i <= houseCount; i++) {
        const houseNum = i.toString();
        if (building.excludeFour && houseNum.endsWith("4")) {
          continue;
        }

        currentFloor.set(houseNum, {
          cursor: `${buildingIndex}-${floor}-${i}`,
          houseIndex: i,
          doorNumber: useFocusEdit().formatHouseNumber(building.housePrefix, building.numberLength, floor, houseNum),
          locked: false,
          floor: floor,
          building: building.building,
          unit: building.unit,
          houseLayoutId: null,
          price: 0,
          direction: "",
          area: 0
        });
      }
    } else if (houseCount < currentSize) {
      // 减少房源 - 截断
      const newMap = new Map<string, HouseStatusProps>();
      let count = 0;

      for (const [key, value] of currentFloor) {
        if (count >= houseCount) break;
        newMap.set(key, value);
        count++;
      }

      building.housesStatusOfFloors.set(floor, newMap);
    }
  };

  // 监听楼栋配置变化，重新初始化
  const handleBuildingConfigChange = (buildingIndex: number) => {
    const building = form.value.buildings[buildingIndex];
    if (building.floorTotal && building.houseCountPerFloor) {
      initAllFloorsForBuilding(buildingIndex);
    }
  };

  // 处理关闭楼层
  const handleCloseFloor = (buildingIndex: number) => {
    const building = form.value.buildings[buildingIndex];
    // 确保 closedFloors 是数组
    if (!Array.isArray(building.closedFloors)) {
      building.closedFloors = [];
    }

    const index = building.closedFloors.indexOf(building.selectedFloor);
    if (index > -1) {
      // 如果已关闭，则开启
      building.closedFloors.splice(index, 1);
    } else {
      // 如果未关闭，则关闭
      building.closedFloors.push(building.selectedFloor);
    }
  };

  // 处理房源点击事件
  const handleHouseClick = (buildingIndex: number, houseStatus: HouseStatusProps) => {
    const building = form.value.buildings[buildingIndex];
    // 确保 closedHouses 是数组
    if (!Array.isArray(building.closedHouses)) {
      building.closedHouses = [];
    }

    houseStatus.locked = !houseStatus.locked;
    if (houseStatus.locked) {
      building.closedHouses.push(houseStatus);
    } else {
      const index = building.closedHouses.findIndex(item => item.floor === building.selectedFloor && item.doorNumber === houseStatus.doorNumber);
      if (index > -1) {
        building.closedHouses.splice(index, 1);
      }
    }
  };

  onMounted(() => {
    // 确保至少有一个楼栋
    if (!form.value.buildings || form.value.buildings.length === 0) {
      form.value.buildings = [
        {
          building: "",
          unit: "",
          floorTotal: 2,
          houseCountPerFloor: 10,
          closedFloors: [],
          closedHouses: [],
          selectedFloor: 1,
          housePrefix: "A",
          excludeFour: false,
          numberLength: 3,
          housesStatusOfFloors: new Map<number, Map<string, HouseStatusProps>>()
        }
      ];
    }

    // 初始化所有楼栋
    form.value.buildings.forEach((_, index) => {
      initAllFloorsForBuilding(index);
    });

    getCompanyUserOptions().then(resp => {
      salesmanList.value = resp.data;
    });
  });

  function handleDeptSelected(deptId: number) {
    return;
    // form.value.deptId = deptId;
    //
    // getDeptUserList({
    //   deptId: deptId
    // }).then(resp => {
    //   salesmanList.value = Array.isArray(resp.data) ? resp.data : [];
    //   const salesmanExists = salesmanList.value.some(salesman => salesman.id === form.value.salesmanId);
    //   if (!salesmanExists) {
    //     form.value.salesmanId = null;
    //   }
    // });
  }

  // 保存项目信息
  async function clickSaveBasicInfo() {
    try {
      // 验证表单
      await ruleFormRef.value.validate();

      // 额外验证：至少需要一个楼栋
      if (!form.value.buildings || form.value.buildings.length === 0) {
        ElMessage.warning("至少需要添加一个楼栋");
        return;
      }

      // 检查负责人信息
      if (!form.value.deptId || !form.value.salesmanId) {
        ElMessage.warning("请选择归属部门和负责人");
        return;
      }

      // 收集所有楼栋的房源数据
      const allHouses = [];
      form.value.buildings.forEach(building => {
        if (building.housesStatusOfFloors) {
          for (const [floor, houses] of building.housesStatusOfFloors) {
            for (const [_, house] of houses) {
              allHouses.push(house);
            }
          }
        }
      });

      form.value.houseList = allHouses;

      if (allHouses.length === 0) {
        ElMessage.warning("请至少配置一间房源");
        return;
      }

      // 验证通过，触发保存事件
      emit("to-assign-room");
      ElMessage.success("基本信息保存成功");
    } catch (error) {
      console.error("表单验证失败:", error);
      ElMessage.warning("请完善必填项信息");
    }
  }
</script>

<template>
  <div>
    <el-form ref="ruleFormRef" :model="form" label-position="top" :rules="focusBasicInfoRules">
      <div>
        <!-- 项目信息 -->
        <h3 class="pb-4">项目信息</h3>
        <el-row :gutter="20" class="bor">
          <el-col :span="6">
            <el-form-item label="项目编号" prop="houseCode">
              <el-input v-model="form.houseCode" placeholder="请输入项目编号" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目名称" prop="houseName">
              <el-input v-model="form.houseName" placeholder="请输入项目名称" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="选择区域" prop="region">
              <RegionCascader v-model="form.region" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目地址" prop="address">
              <el-input v-model="form.address" placeholder="请输入项目地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 楼栋列表 -->
        <div class="building-section">
          <div class="section-header">
            <h3>楼栋信息</h3>
            <el-button type="primary" :icon="Plus" size="small" @click="addBuilding">添加楼栋</el-button>
          </div>

          <!-- 楼栋卡片列表 -->
          <div v-for="(building, buildingIndex) in form.buildings" :key="buildingIndex" class="building-card">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span class="building-title">
                    {{ building.building || `楼栋${buildingIndex + 1}` }}
                    {{ building.unit ? `${building.unit}单元` : "" }}
                  </span>
                  <el-button type="danger" :icon="Delete" size="small" :disabled="form.buildings.length <= 1" @click="removeBuilding(buildingIndex)">删除</el-button>
                </div>
              </template>

              <!-- 楼栋配置 -->
              <el-row :gutter="20">
                <el-col :span="3">
                  <el-form-item label="楼栋" :prop="`buildings.${buildingIndex}.building`" :rules="[{ required: true, message: '楼栋号为必填项', trigger: 'blur' }]">
                    <el-input v-model="building.building" placeholder="楼栋号">
                      <template #append>栋</template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="3">
                  <el-form-item label="单元" :prop="`buildings.${buildingIndex}.unit`">
                    <el-input v-model="building.unit" placeholder="选填">
                      <template #append>单元</template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="3">
                  <el-form-item
                    label="楼层"
                    :prop="`buildings.${buildingIndex}.floorTotal`"
                    :rules="[
                      { required: true, message: '楼层为必填项', trigger: 'blur' },
                      {
                        type: 'number',
                        min: 1,
                        max: 100,
                        message: '楼层必须在1-100之间',
                        trigger: 'blur',
                        transform: value => Number(value)
                      }
                    ]"
                  >
                    <el-input v-model.number="building.floorTotal" placeholder="楼层数" @change="handleBuildingConfigChange(buildingIndex)">
                      <template #prepend>共</template>
                      <template #append>层</template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="3">
                  <el-form-item
                    label="每层房源数"
                    :prop="`buildings.${buildingIndex}.houseCountPerFloor`"
                    :rules="[
                      { required: true, message: '每层房源数为必填项', trigger: 'blur' },
                      {
                        type: 'number',
                        min: 1,
                        max: 100,
                        message: '房源数必须在1-100之间',
                        trigger: 'blur',
                        transform: value => Number(value)
                      }
                    ]"
                  >
                    <el-input v-model.number="building.houseCountPerFloor" placeholder="房源数" @change="handleBuildingConfigChange(buildingIndex)">
                      <template #append>间</template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="3">
                  <el-form-item label="房源号前缀">
                    <el-input v-model="building.housePrefix" placeholder="前缀" @change="handleBuildingConfigChange(buildingIndex)" />
                  </el-form-item>
                </el-col>
                <el-col :span="3">
                  <el-form-item
                    label="房源号长度"
                    :prop="`buildings.${buildingIndex}.numberLength`"
                    :rules="[
                      {
                        type: 'number',
                        min: 1,
                        max: 10,
                        message: '长度必须在1-10之间',
                        trigger: 'blur',
                        transform: value => Number(value)
                      }
                    ]"
                  >
                    <el-input v-model.number="building.numberLength" placeholder="长度" type="number" @change="handleBuildingConfigChange(buildingIndex)" />
                  </el-form-item>
                </el-col>
                <el-col :span="3">
                  <el-form-item label="选项">
                    <el-checkbox v-model="building.excludeFour" label="房间号去“4”" @change="handleBuildingConfigChange(buildingIndex)" />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 房源配置区域 -->
              <div class="house-config-section">
                <h5>房源配置</h5>

                <!-- 楼层选择 -->
                <div class="floor-selector">
                  <el-radio-group v-model="building.selectedFloor">
                    <el-radio-button v-for="floor in getFloorList(buildingIndex)" :key="floor" :value="floor" @click="handleFloorSelect(buildingIndex, floor)">
                      <span
                        :class="{
                          'floor-label': true,
                          'closed-floor': building.closedFloors?.includes(floor)
                        }"
                      >
                        {{ floor }}F
                      </span>
                    </el-radio-button>
                  </el-radio-group>
                </div>

                <!-- 当前楼层信息 -->
                <div v-if="building.selectedFloor" class="floor-info">
                  <el-row>
                    <el-col :span="20">
                      <el-space>
                        第 {{ building.selectedFloor }} 层，共
                        <el-input
                          :model-value="getHouseCountForFloor(buildingIndex, building.selectedFloor)"
                          size="small"
                          type="number"
                          :style="{ width: '60px' }"
                          :min="1"
                          :max="100"
                          @input="val => updateHouseCountForFloor(buildingIndex, building.selectedFloor, val)"
                        />
                        间房源
                      </el-space>
                    </el-col>
                    <el-col :span="4" class="text-right">
                      <el-button type="danger" plain size="small" @click="handleCloseFloor(buildingIndex)">
                        {{ building.closedFloors?.includes(building.selectedFloor) ? "开启楼层" : "关闭楼层" }}
                      </el-button>
                    </el-col>
                  </el-row>

                  <!-- 房源号列表 -->
                  <div class="house-list">
                    <div class="house-title-container">
                      <span class="house-title">房源号</span>
                      <el-tooltip content="点击房源号将房源锁定，再次点击解锁" placement="right" effect="light">
                        <el-icon class="info-icon">
                          <InfoFilled />
                        </el-icon>
                      </el-tooltip>
                    </div>

                    <el-space wrap :size="10">
                      <el-check-tag
                        v-for="(houseStatus, houseIndex) in getHouseListForFloor(buildingIndex, building.selectedFloor)"
                        :key="houseIndex"
                        :class="['house-tag', houseStatus.locked && 'closed-house']"
                        :checked="!houseStatus.locked"
                        @click="handleHouseClick(buildingIndex, houseStatus)"
                      >
                        <el-space :size="4">
                          <el-icon v-if="houseStatus.locked">
                            <AntDesignLockFilled />
                          </el-icon>
                          <span>{{ houseStatus.doorNumber }}</span>
                        </el-space>
                      </el-check-tag>
                    </el-space>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 负责人信息 -->
        <h3 class="py-4">负责人信息</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="归属部门" prop="deptId">
              <DeptCascader v-model="form.deptId" :emit-on-default="true" @dept-selected="handleDeptSelected" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="负责人" prop="salesmanId">
              <el-select v-model="form.salesmanId" filterable placeholder="请选择负责人" clearable>
                <el-option v-for="item in salesmanList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <el-row :gutter="20">
      <el-col :span="24" class="text-right">
        <el-button type="primary" @click="clickSaveBasicInfo">保存并配置房源</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
  :deep(.el-form-item--label-top .el-form-item__label) {
    font-size: 12px;
    color: #43464c;
  }

  :deep(.el-input-group__append),
  :deep(.el-input-group__prepend) {
    padding: 0 10px;
    color: #43464c;
  }

  .building-section {
    margin: 20px 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .building-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .building-title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }

  .house-config-section {
    padding-top: 20px;
    margin-top: 20px;
    border-top: 1px solid #ebeef5;
  }

  .house-config-section h5 {
    margin: 0 0 15px;
    font-size: 14px;
    color: #606266;
  }

  .floor-selector {
    margin: 15px 0;
  }

  .floor-info {
    margin-top: 15px;
  }

  .house-list {
    padding: 15px;
    margin-top: 15px;
    background: #f5f7fa;
    border-radius: 4px;
  }

  .house-title-container {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 10px;
  }

  .house-title {
    font-size: 13px;
    font-weight: bold;
    color: #606266;
  }

  .info-icon {
    font-size: 14px;
    color: #909399;
    cursor: pointer;
  }

  .house-tag {
    cursor: pointer;
    transition: all 0.3s;
  }

  .house-tag:hover {
    transform: scale(1.05);
  }

  /* 楼层标签样式 */
  .floor-label {
    display: inline-block;
    padding: 0;
  }

  /* 已关闭楼层的样式 */
  .closed-floor {
    color: #c0c4cc !important;
    text-decoration: line-through;
    opacity: 0.6;
  }

  /* 已关闭房源的样式 */
  .closed-house {
    color: #c0c4cc !important;
    text-decoration: line-through;
    background-color: #f5f5f5 !important;
    opacity: 0.6;
  }

  .text-right {
    text-align: right;
  }
</style>
