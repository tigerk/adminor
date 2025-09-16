<template>
  <el-row :gutter="20" class="flex items-center justify-end p-1">
    <el-col :span="12">
      <el-space>
        <el-text size="large" class="font-bold italic">项目名称： {{ projectName }}</el-text>
      </el-space>
    </el-col>
    <el-col :span="12" class="text-right">
      <el-space>
        <el-text size="large" class="font-bold">总房数： {{ totalHouses }} 间</el-text>
        <el-tag type="danger">剩余 {{ unassignedHouses }} 间未分配</el-tag>
        <el-tag type="success">启用 {{ enabledHouses }} 间</el-tag>
        <el-tag type="info">锁房 {{ disabledHouses }} 间</el-tag>
      </el-space>
    </el-col>
  </el-row>

  <el-row :gutter="20">
    <el-col :span="24">
      <div class="house-floor-management p-1" style="height: 70vh">
        <!-- 左侧房型管理 -->
        <div class="flex space-x-6 h-full">
          <div class="w-60 rounded-lg shadow p-4 h-fit" style="display: flex; flex-direction: column; max-height: 65vh">
            <div class="flex justify-between items-center mb-1">
              <h2 class="text-lg font-semibold text-gray-800">房型名称</h2>
              <el-tooltip content="创建房型" placement="top">
                <el-icon class="text-gray-400 cursor-help">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>

            <!-- 房型列表 -->
            <div class="space-y-2 mb-4 overflow-y-auto flex-1" style="max-height: calc(65vh - 120px)">
              <div
                v-for="houseLayout in form.houseLayoutList"
                :key="houseLayout.id"
                class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                :class="{ 'bg-blue-50 border-blue-300': selectedHouseLayoutId === houseLayout.id }"
                @click="selectedHouseLayoutId = houseLayout.id"
              >
                <div>
                  <div class="font-medium text-gray-900">{{ houseLayout.layoutName }}</div>
                  <div class="text-xs text-gray-500">{{ houseLayout.bedroom }}室{{ houseLayout.livingRoom }}厅{{ houseLayout.kitchen }}厨{{ houseLayout.bathroom }}卫</div>
                </div>
                <div class="flex space-x-1">
                  <el-button size="small" type="primary" text @click.stop="editHouseLayout(houseLayout)">
                    <el-icon>
                      <Edit />
                    </el-icon>
                  </el-button>
                  <el-button size="small" type="danger" text @click.stop="deleteHouseLayout(houseLayout.id)">
                    <el-icon>
                      <Delete />
                    </el-icon>
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 创建房型 -->
            <div
              class="border-2 border-dashed border-gray-300 rounded-lg p-1 text-center hover:border-blue-300 cursor-pointer transition-colors flex-shrink-0"
              @click="showCreateDialog = true"
            >
              <el-space>
                <IconifyIconOffline :icon="AntDesignPlusCircleOutlined" />
                <div class="text-sm text-gray-600">创建房型</div>
              </el-space>
            </div>
          </div>

          <!-- 右侧房源信息 -->
          <div class="flex-1 rounded-lg shadow-sm p-3 h-full overflow-hidden flex flex-col">
            <!-- 楼栋切换区域 -->
            <div class="mb-4 pb-2 border-b border-gray-100">
              <div class="flex justify-between" style="align-items: center; min-height: 40px; padding: 4px 0">
                <div class="flex flex-wrap gap-2" style="align-items: center">
                  <el-button
                    v-for="(building, index) in form.buildings"
                    :key="index"
                    :type="selectedBuildingIndex === index ? 'primary' : 'default'"
                    size="default"
                    @click="selectBuilding(index)"
                  >
                    {{ building.building }}栋
                    {{ building.unit ? `${building.unit}单元` : "" }}
                    <el-tag v-if="getBuildingHouseCount(index) > 0" size="small" class="ml-1" effect="light">{{ getBuildingHouseCount(index) }}间</el-tag>
                  </el-button>
                </div>
                <div class="flex flex-wrap gap-2" style="align-items: center">
                  <!-- 添加楼层按钮 -->
                  <el-popover v-model:visible="showAddFloorPopover" placement="bottom" :width="300" trigger="click">
                    <template #reference>
                      <el-button plain type="primary" size="small" :icon="Plus">添加楼层</el-button>
                    </template>
                    <div>
                      <el-form @submit.prevent="confirmAddFloor">
                        <el-form-item label="楼层号">
                          <el-input-number v-model="newFloorNumber" :min="1" :max="99" placeholder="请输入楼层号" style="width: 100%" />
                        </el-form-item>
                        <div class="text-gray-500 text-xs mb-3">将按照当前楼栋配置创建：每层 {{ currentBuilding?.houseCountPerFloor || 0 }} 间房源</div>
                        <div class="text-right">
                          <el-button size="small" @click="showAddFloorPopover = false">取消</el-button>
                          <el-button type="primary" size="small" @click="confirmAddFloor">确定</el-button>
                        </div>
                      </el-form>
                    </div>
                  </el-popover>
                  <!-- 使用当前楼栋的统计数据 -->
                  <el-tag type="info">共 {{ currentBuildingStats.floors }} 层</el-tag>
                  <el-tag type="info">共 {{ currentBuildingStats.total }} 间</el-tag>
                  <el-tag type="danger">剩余 {{ currentBuildingStats.unassigned }} 间未分配</el-tag>
                  <el-tag type="success">启用 {{ currentBuildingStats.enabled }} 间</el-tag>
                  <el-tag type="info">锁房 {{ currentBuildingStats.disabled }} 间</el-tag>
                </div>
              </div>
            </div>

            <!-- 按楼层显示房源 -->
            <div class="flex-1 overflow-y-auto space-y-3" style="max-height: calc(100% - 180px)">
              <div v-for="floor in currentBuildingFloors" :key="floor" class="floor-section">
                <div class="flex justify-between items-center mb-1">
                  <h4 class="text-md font-medium" :class="{ 'text-gray-400': isFloorDisabled(floor), 'text-gray-700': !isFloorDisabled(floor) }">
                    {{ floor }}F
                    <el-tag v-if="isFloorDisabled(floor)" type="info" size="small" class="ml-2">已禁用</el-tag>
                  </h4>

                  <div class="flex items-center gap-2">
                    <!-- 禁用/启用楼层按钮 -->
                    <el-button size="small" :type="isFloorDisabled(floor) ? 'success' : 'warning'" plain @click="toggleFloorStatus(floor)">
                      <el-icon>
                        <Lock v-if="!isFloorDisabled(floor)" />
                        <Unlock v-else />
                      </el-icon>
                      {{ isFloorDisabled(floor) ? "启用楼层" : "禁用楼层" }}
                    </el-button>

                    <!-- 删除楼层按钮 -->
                    <el-popconfirm
                      :title="`确定要删除第 ${floor} 层吗？该楼层的 ${getHousesByFloor(floor).length} 个房源数据将被永久删除。`"
                      confirm-button-text="确定"
                      cancel-button-text="取消"
                      :icon="InfoFilled"
                      icon-color="#ff4949"
                      @confirm="deleteFloor(floor)"
                    >
                      <template #reference>
                        <el-button size="small" type="danger" plain>
                          <el-icon>
                            <Delete />
                          </el-icon>
                          删除楼层
                        </el-button>
                      </template>
                    </el-popconfirm>

                    <!-- 全选复选框 -->
                    <el-checkbox
                      v-model="getFloorChecked(floor).value"
                      :indeterminate="getFloorIndeterminate(floor)"
                      :disabled="isFloorDisabled(floor)"
                      class="floor-checkbox"
                      @change="handleFloorSelectAll(floor, $event)"
                    >
                      全选
                    </el-checkbox>
                  </div>
                </div>

                <div class="border-2 rounded-lg p-4 transition-all" :class="getFloorBorderClass(floor)" :style="{ opacity: isFloorDisabled(floor) ? 0.5 : 1 }">
                  <div class="grid grid-cols-6 gap-3">
                    <div
                      v-for="house in getHousesByFloor(floor)"
                      :key="house.cursor"
                      class="relative border rounded-lg p-2 transition-all"
                      :class="[
                        getHouseCardClass(house),
                        {
                          'cursor-pointer hover:shadow': !isFloorDisabled(floor),
                          'cursor-not-allowed': isFloorDisabled(floor)
                        }
                      ]"
                      style="min-width: 100px"
                      @click="!isFloorDisabled(floor) && toggleHouseSelection(house.cursor)"
                      @contextmenu.prevent="!isFloorDisabled(floor) && handleHouseRightClick($event, house)"
                    >
                      <!-- 房源内容保持不变 -->
                      <div
                        v-if="house.houseLayoutId && !isFloorDisabled(floor)"
                        class="absolute -top-2 -right-1 bg-red-300 text-white text-xs px-1 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center border border-white shadow z-10"
                      >
                        {{ house.price }}元 {{ house.area }}m²
                      </div>

                      <!-- 选中图标 -->
                      <div class="absolute top-1 right-1">
                        <el-icon v-if="selectedHouses.includes(house.cursor) && !isFloorDisabled(floor)" class="text-blue-500" size="14">
                          <CircleCheckFilled />
                        </el-icon>
                      </div>

                      <div class="text-center">
                        <el-space width="auto">
                          <IconifyIconOffline v-if="house.locked || isFloorDisabled(floor)" :icon="AntDesignLockFilled" />
                          <span class="font-medium text-sm" :class="{ 'text-gray-400 line-through': house.locked || isFloorDisabled(floor) }">
                            {{ house.doorNumber }}
                          </span>
                          <el-tag v-if="house.houseLayoutId && !isFloorDisabled(floor)" :type="getHouseLayoutTagType(house.houseLayoutId)" size="small" class="text-xs px-1">
                            {{ getHouseLayoutName(house.houseLayoutId) }}
                          </el-tag>
                        </el-space>
                      </div>
                    </div>

                    <!-- 添加房源按钮 -->
                    <div
                      v-if="!isFloorDisabled(floor)"
                      class="border-2 border-dashed border-gray-300 rounded-lg p-2 flex items-center justify-center hover:border-blue-300 cursor-pointer transition-colors"
                      style="min-width: 120px"
                      @click="addHouse(floor)"
                    >
                      <el-icon class="text-gray-400">
                        <Plus />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 批量配置区域 -->
            <div class="mt-4 border-2 border-b-gray-300 rounded-lg p-2 bg-blue-25 flex-shrink-0">
              <div class="mb-3">
                <span class="text-red-700 font-medium">对「{{ getSelectedHouseNumbers() }}」房源进行统一配置</span>
              </div>

              <div class="grid grid-cols-12 gap-3 mb-3">
                <div class="col-span-2">
                  <el-select v-model="batchConfig.houseLayoutId" placeholder="请选择房型" class="w-full">
                    <template #prefix>房型</template>
                    <el-option v-for="houseLayout in form.houseLayoutList" :key="houseLayout.id" :label="houseLayout.layoutName" :value="houseLayout.id" />
                  </el-select>
                </div>

                <div class="col-span-3">
                  <el-input v-model="batchConfig.price" placeholder="请输入价格" type="number">
                    <template #prepend>价格</template>
                    <template #append>元</template>
                  </el-input>
                </div>

                <div class="col-span-2">
                  <el-select v-model="batchConfig.direction" placeholder="朝向" class="w-full">
                    <el-option label="东" value="东" />
                    <el-option label="南" value="南" />
                    <el-option label="西" value="西" />
                    <el-option label="北" value="北" />
                    <el-option label="东南" value="东南" />
                    <el-option label="西南" value="西南" />
                    <el-option label="东北" value="东北" />
                    <el-option label="西北" value="西北" />
                  </el-select>
                </div>

                <div class="col-span-2">
                  <el-input v-model="batchConfig.area" placeholder="面积" type="number">
                    <template #append>m²</template>
                  </el-input>
                </div>

                <div class="col-span-3">
                  <div class="flex justify-end space-x-2 text-right">
                    <el-button type="primary" @click="applyBatchConfig">应用配置</el-button>
                    <el-button @click="clearSelection">取消选择</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右键菜单 -->
        <div
          v-show="contextMenu.visible"
          :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
          class="fixed z-50 bg-white border border-gray-200 rounded-lg shadow py-1 min-w-24"
          @click="hideContextMenu"
        >
          <div class="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center" @click="editHouse(contextMenu.house)">
            <el-icon class="mr-2">
              <Edit />
            </el-icon>
            修改
          </div>
          <div class="px-3 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer flex items-center" @click="deleteHouseAction(contextMenu.house)">
            <el-icon class="mr-2">
              <Delete />
            </el-icon>
            删除
          </div>
        </div>

        <!-- 创建/编辑房型对话框 -->
        <el-dialog v-model="showCreateDialog" :title="isEditing ? '编辑房型' : '创建房型'" width="600px" @closed="resetForm">
          <el-form ref="formRef" :model="houseLayoutForm" :rules="rules" label-width="80px">
            <el-form-item label="房型名称" prop="name">
              <el-input v-model="houseLayoutForm.name" placeholder="请输入房型名称" />
            </el-form-item>

            <el-form-item label="户型配置">
              <el-row>
                <el-col :span="6">
                  <label class="text-sm text-gray-600 block mb-1">卧室</label>
                  <el-input-number v-model="houseLayoutForm.bedroom" :min="0" :max="10" size="small" class="w-full" />
                </el-col>
                <el-col :span="6">
                  <label class="text-sm text-gray-600 block mb-1">客厅</label>
                  <el-input-number v-model="houseLayoutForm.livingRoom" :min="0" :max="5" size="small" class="w-full" />
                </el-col>
                <el-col :span="6">
                  <label class="text-sm text-gray-600 block mb-1">厨房</label>
                  <el-input-number v-model="houseLayoutForm.kitchen" :min="0" :max="3" size="small" class="w-full" />
                </el-col>
                <el-col :span="6">
                  <label class="text-sm text-gray-600 block mb-1">卫生间</label>
                  <el-input-number v-model="houseLayoutForm.bathroom" :min="0" :max="5" size="small" class="w-full" />
                </el-col>
              </el-row>
            </el-form-item>
          </el-form>

          <template #footer>
            <span class="dialog-footer">
              <el-button @click="showCreateDialog = false">取消</el-button>
              <el-button type="primary" @click="saveHouseLayout">
                {{ isEditing ? "更新" : "创建" }}
              </el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 添加/编辑房源对话框 -->
        <el-dialog v-model="showAddHouseDialog" :title="isEditingHouse ? '编辑房源' : '添加房源'" width="350px" @closed="resetHouseForm">
          <el-form :model="newHouseForm" label-width="80px">
            <el-form-item label="房源号" required>
              <el-input v-model="newHouseForm.houseNumber" placeholder="请输入房源号" />
            </el-form-item>
          </el-form>

          <template #footer>
            <span class="dialog-footer">
              <el-button @click="showAddHouseDialog = false">取消</el-button>
              <el-button type="primary" @click="saveHouse">
                {{ isEditingHouse ? "更新" : "确定" }}
              </el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </el-col>
  </el-row>

  <el-row :gutter="20">
    <el-col :span="24" class="text-right">
      <el-button type="primary" style="margin-top: 12px" @click="stepPrevious">上一步</el-button>
      <el-button type="primary" style="margin-top: 12px" @click="resetHouses">重置</el-button>
      <el-button type="primary" style="margin-top: 12px" @click="clickSaveAssignHouse">保存并完善项目</el-button>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, onMounted, onUnmounted, defineModel } from "vue";
  import { CheckboxValueType, ElMessage, ElMessageBox, type FormInstance } from "element-plus";
  import { Plus, Edit, Delete, QuestionFilled, CircleCheckFilled, InfoFilled } from "@element-plus/icons-vue";
  import AntDesignPlusCircleOutlined from "~icons/ant-design/plus-circle-outlined";
  import AntDesignLockFilled from "~icons/ant-design/lock-filled";
  import { HouseLayoutProps, HouseStatusProps, FocusFormItemProps } from "@/views/house/focus/components/FocusCreate/utils/types";
  import { useFocusEdit } from "@/views/house/focus/components/FocusCreate/utils/hook";
  import { Lock, Unlock } from "@element-plus/icons-vue";

  // 获取 FocusCreateForm 中的form数据
  const form = defineModel<FocusFormItemProps>();
  // 添加新的状态
  const showAddFloorPopover = ref(false);
  const newFloorNumber = ref<number>(1);

  // 初始化默认房型
  if (!form.value.houseLayoutList || form.value.houseLayoutList.length === 0) {
    form.value.houseLayoutList = [
      {
        id: "1",
        layoutName: "精装一房",
        bedroom: 1,
        livingRoom: 1,
        kitchen: 1,
        bathroom: 1,
        newly: true
      },
      {
        id: "2",
        layoutName: "精装二房",
        bedroom: 2,
        livingRoom: 1,
        kitchen: 1,
        bathroom: 1,
        newly: true
      }
    ];
  }

  // 定义 emits
  const emit = defineEmits<{
    "to-add-extra": [];
    "step-previous": [];
  }>();

  // 使用 hook 中的方法
  const { getHouseListForFloor, addHouseToFloor, updateHouseInfo, deleteHouse, convertBuildingsToHouseList, initAllFloorsForBuilding, formatHouseNumber } = useFocusEdit();

  // 状态管理
  const selectedHouseLayoutId = ref<string>("");
  const selectedHouses = ref<string[]>([]);
  const showCreateDialog = ref(false);
  const showAddHouseDialog = ref(false);
  const isEditing = ref(false);
  const isEditingHouse = ref(false);
  const formRef = ref<FormInstance>();

  // 楼栋选择相关
  const selectedBuildingIndex = ref(0);

  // 右键菜单状态
  const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    house: null as HouseStatusProps | null
  });

  // 批量配置表单
  const batchConfig = reactive({
    houseLayoutId: "",
    price: "",
    direction: "",
    area: ""
  });

  // 房型表单
  const houseLayoutForm = reactive({
    id: "",
    name: "",
    bedroom: 1,
    livingRoom: 1,
    kitchen: 1,
    bathroom: 1
  });

  // 新房源表单
  const newHouseForm = reactive({
    cursor: "",
    houseNumber: "",
    floor: 1,
    building: "",
    unit: ""
  });

  // 表单验证规则
  const rules = {
    name: [
      { required: true, message: "请输入房型名称", trigger: "blur" },
      { min: 2, max: 20, message: "房型名称长度为2-20个字符", trigger: "blur" }
    ]
  };

  // 计算属性
  const projectName = computed(() => form.value.houseName || "未命名项目");

  // 当前楼栋
  const currentBuilding = computed(() => {
    return form.value.buildings?.[selectedBuildingIndex.value] || null;
  });

  // 当前楼栋的楼层列表
  const currentBuildingFloors = computed(() => {
    if (!currentBuilding.value?.housesStatusOfFloors) return [];

    const floors = Array.from(currentBuilding.value.housesStatusOfFloors.keys());
    return floors.sort((a, b) => a - b); // 确保按楼层号升序排列
  });

  // 统计信息（基于所有楼栋）
  const totalFloors = computed(() => {
    return form.value.buildings?.reduce((total, building) => total + (building.floorTotal || 0), 0) || 0;
  });

  const totalHouses = computed(() => {
    let count = 0;
    form.value.buildings?.forEach(building => {
      if (building.housesStatusOfFloors) {
        for (const [floor, houseMap] of building.housesStatusOfFloors) {
          if (!building.closedFloors?.includes(floor)) {
            count += houseMap.size;
          }
        }
      }
    });
    return count;
  });

  const unassignedHouses = computed(() => {
    let count = 0;
    form.value.buildings?.forEach(building => {
      if (building.housesStatusOfFloors) {
        for (const [floor, houseMap] of building.housesStatusOfFloors) {
          if (!building.closedFloors?.includes(floor)) {
            for (const [_, house] of houseMap) {
              if (!house.houseLayoutId && !house.locked) {
                count++;
              }
            }
          }
        }
      }
    });
    return count;
  });

  const enabledHouses = computed(() => {
    let count = 0;
    form.value.buildings?.forEach(building => {
      if (building.housesStatusOfFloors) {
        for (const [floor, houseMap] of building.housesStatusOfFloors) {
          if (!building.closedFloors?.includes(floor)) {
            for (const [_, house] of houseMap) {
              if (!house.locked) {
                count++;
              }
            }
          }
        }
      }
    });
    return count;
  });

  const disabledHouses = computed(() => {
    let count = 0;
    form.value.buildings?.forEach(building => {
      if (building.housesStatusOfFloors) {
        for (const [_, houseMap] of building.housesStatusOfFloors) {
          for (const [_, house] of houseMap) {
            if (house.locked) {
              count++;
            }
          }
        }
      }
    });
    return count;
  });

  // 楼栋切换相关方法
  const selectBuilding = (index: number) => {
    selectedBuildingIndex.value = index;
    selectedHouses.value = [];
  };

  const getBuildingHouseCount = (buildingIndex: number) => {
    const building = form.value.buildings?.[buildingIndex];
    if (!building?.housesStatusOfFloors) return 0;

    let count = 0;
    for (const [floor, houseMap] of building.housesStatusOfFloors) {
      if (!building.closedFloors?.includes(floor)) {
        count += houseMap.size;
      }
    }
    return count;
  };

  // 获取当前楼栋某层的房源
  const getHousesByFloor = (floor: number) => {
    if (!currentBuilding.value) return [];
    return getHouseListForFloor(currentBuilding.value, floor);
  };

  // 获取房型名称
  const getHouseLayoutName = (houseLayoutId: string) => {
    const houseLayout = form.value.houseLayoutList.find(hl => hl.id === houseLayoutId);
    return houseLayout ? houseLayout.layoutName : "未知房型";
  };

  const getHouseLayoutTagType = (houseLayoutId: string): "success" | "warning" | "info" | "danger" => {
    const colors: ("success" | "warning" | "info" | "danger")[] = ["success", "warning", "info", "danger"];
    const index = parseInt(houseLayoutId) % colors.length;
    return colors[index];
  };

  const getHouseCardClass = (house: HouseStatusProps) => {
    if (selectedHouses.value.includes(house.cursor)) {
      return "border-blue-500 bg-blue-50";
    }
    if (house.houseLayoutId) {
      return "border-green-300 bg-white hover:bg-green-50";
    }
    return "border-gray-200 bg-white hover:bg-gray-50";
  };

  // 修改 getFloorBorderClass 方法，考虑禁用状态
  const getFloorBorderClass = (floor: number) => {
    if (isFloorDisabled(floor)) {
      return "border-gray-300 bg-gray-100";
    }

    const floorHouses = getHousesByFloor(floor);
    const selectedFloorHouses = floorHouses.filter(house => selectedHouses.value.includes(house.cursor));

    if (selectedFloorHouses.length === floorHouses.length && floorHouses.length > 0) {
      return "border-blue-500 bg-blue-50";
    } else if (selectedFloorHouses.length > 0) {
      return "border-blue-300 bg-blue-25";
    }
    return "border-gray-300";
  };

  const getFloorChecked = (floor: number) => {
    const floorHouses = getHousesByFloor(floor);
    const selectedFloorHouses = floorHouses.filter(house => selectedHouses.value.includes(house.cursor));
    return { value: selectedFloorHouses.length === floorHouses.length && floorHouses.length > 0 };
  };

  const getFloorIndeterminate = (floor: number) => {
    const floorHouses = getHousesByFloor(floor);
    const selectedFloorHouses = floorHouses.filter(house => selectedHouses.value.includes(house.cursor));
    return selectedFloorHouses.length > 0 && selectedFloorHouses.length < floorHouses.length;
  };

  const handleFloorSelectAll = (floor: number, checked: CheckboxValueType) => {
    const isChecked = Boolean(checked);
    const floorHouses = getHousesByFloor(floor);
    const floorHouseIds = floorHouses.map(house => house.cursor);

    if (isChecked) {
      floorHouseIds.forEach(houseId => {
        if (!selectedHouses.value.includes(houseId)) {
          selectedHouses.value.push(houseId);
        }
      });
    } else {
      selectedHouses.value = selectedHouses.value.filter(houseId => !floorHouseIds.includes(houseId));
    }
  };

  const toggleHouseSelection = (houseId: string) => {
    const index = selectedHouses.value.indexOf(houseId);
    if (index > -1) {
      selectedHouses.value.splice(index, 1);
    } else {
      selectedHouses.value.push(houseId);
    }
  };

  const getSelectedHouseNumbers = () => {
    const houses: string[] = [];

    selectedHouses.value.forEach(cursor => {
      if (currentBuilding.value?.housesStatusOfFloors) {
        for (const [_, houseMap] of currentBuilding.value.housesStatusOfFloors) {
          for (const [_, house] of houseMap) {
            if (house.cursor === cursor) {
              houses.push(house.doorNumber);
              break;
            }
          }
        }
      }
    });

    return houses.join("、");
  };

  // 批量配置
  const applyBatchConfig = () => {
    if (selectedHouses.value.length === 0) {
      ElMessage.warning("请先选择房源");
      return;
    }

    selectedHouses.value.forEach(cursor => {
      const updates: Partial<HouseStatusProps> = {};

      if (batchConfig.houseLayoutId) {
        updates.houseLayoutId = batchConfig.houseLayoutId;
      }
      if (batchConfig.price) {
        updates.price = Number(batchConfig.price);
      }
      if (batchConfig.direction) {
        updates.direction = batchConfig.direction;
      }
      if (batchConfig.area) {
        updates.area = Number(batchConfig.area);
      }

      if (currentBuilding.value) {
        updateHouseInfo(currentBuilding.value, cursor, updates);
      }
    });

    ElMessage.success(`已对${selectedHouses.value.length}个房源应用配置`);
    clearSelection();
  };

  const clearSelection = () => {
    selectedHouses.value = [];
    batchConfig.houseLayoutId = "";
    batchConfig.price = "";
    batchConfig.direction = "";
    batchConfig.area = "";
  };

  // 右键菜单相关方法
  const handleHouseRightClick = (event: MouseEvent, house: HouseStatusProps) => {
    event.preventDefault();
    contextMenu.visible = true;
    contextMenu.x = event.clientX;
    contextMenu.y = event.clientY;
    contextMenu.house = house;
  };

  const hideContextMenu = () => {
    contextMenu.visible = false;
    contextMenu.house = null;
  };

  const editHouse = (house: HouseStatusProps | null) => {
    if (!house) return;

    isEditingHouse.value = true;
    newHouseForm.cursor = house.cursor;
    newHouseForm.houseNumber = house.doorNumber;
    newHouseForm.floor = house.floor;
    showAddHouseDialog.value = true;
    hideContextMenu();
  };

  const deleteHouseAction = async (house: HouseStatusProps | null) => {
    if (!house || !currentBuilding.value) return;

    try {
      await ElMessageBox.confirm(`确定要删除房源 ${house.doorNumber} 吗？`, "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      });

      if (deleteHouse(currentBuilding.value, house.cursor)) {
        const selectedIndex = selectedHouses.value.indexOf(house.cursor);
        if (selectedIndex > -1) {
          selectedHouses.value.splice(selectedIndex, 1);
        }
        ElMessage.success("房源删除成功");
      }
    } catch {
      // 用户取消删除
    }

    hideContextMenu();
  };

  const addHouse = (floor: number) => {
    if (!currentBuilding.value) {
      ElMessage.warning("请先选择楼栋");
      return;
    }

    newHouseForm.floor = floor;
    showAddHouseDialog.value = true;
  };

  const saveHouse = () => {
    if (!newHouseForm.houseNumber) {
      ElMessage.warning("请输入房源号");
      return;
    }

    if (!currentBuilding.value) {
      ElMessage.warning("请先选择楼栋");
      return;
    }

    if (isEditingHouse.value) {
      // 编辑房源
      if (updateHouseInfo(currentBuilding.value, newHouseForm.cursor, { doorNumber: newHouseForm.houseNumber })) {
        ElMessage.success("房源修改成功");
      }
    } else {
      // 新增房源
      const existingHouses = getHousesByFloor(newHouseForm.floor);
      const exists = existingHouses.some(house => house.doorNumber === newHouseForm.houseNumber);

      if (exists) {
        ElMessage.warning("该楼层中房源号已存在");
        return;
      }

      addHouseToFloor(currentBuilding.value, newHouseForm.floor, newHouseForm.houseNumber);
      ElMessage.success("房源添加成功");
    }

    showAddHouseDialog.value = false;
  };

  const resetHouseForm = () => {
    isEditingHouse.value = false;
    newHouseForm.cursor = "";
    newHouseForm.houseNumber = "";
    newHouseForm.floor = 1;
  };

  // 房型管理
  const editHouseLayout = (houseLayout: HouseLayoutProps) => {
    isEditing.value = true;
    houseLayoutForm.id = houseLayout.id;
    houseLayoutForm.name = houseLayout.layoutName;
    houseLayoutForm.bedroom = houseLayout.bedroom;
    houseLayoutForm.livingRoom = houseLayout.livingRoom;
    houseLayoutForm.kitchen = houseLayout.kitchen;
    houseLayoutForm.bathroom = houseLayout.bathroom;
    showCreateDialog.value = true;
  };

  const deleteHouseLayout = async (id: string) => {
    // 检查是否有房源使用了该房型
    let assignedCount = 0;
    form.value.buildings?.forEach(building => {
      if (building.housesStatusOfFloors) {
        for (const [_, houseMap] of building.housesStatusOfFloors) {
          for (const [_, house] of houseMap) {
            if (house.houseLayoutId === id) {
              assignedCount++;
            }
          }
        }
      }
    });

    if (assignedCount > 0) {
      ElMessage.warning(`该房型已分配给${assignedCount}个房源，请先清除房源分配后再删除`);
      return;
    }

    try {
      await ElMessageBox.confirm("确定要删除这个房型吗？", "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      });

      const index = form.value.houseLayoutList.findIndex(hl => hl.id === id);
      if (index > -1) {
        form.value.houseLayoutList.splice(index, 1);
        if (selectedHouseLayoutId.value === id) {
          selectedHouseLayoutId.value = "";
        }
        ElMessage.success("房型删除成功");
      }
    } catch {
      // 用户取消删除
    }
  };

  const saveHouseLayout = async () => {
    if (!formRef.value) return;

    try {
      await formRef.value.validate();

      if (isEditing.value) {
        const index = form.value.houseLayoutList.findIndex(hl => hl.id === houseLayoutForm.id);
        if (index > -1) {
          form.value.houseLayoutList[index] = {
            ...form.value.houseLayoutList[index],
            layoutName: houseLayoutForm.name,
            bedroom: houseLayoutForm.bedroom,
            livingRoom: houseLayoutForm.livingRoom,
            kitchen: houseLayoutForm.kitchen,
            bathroom: houseLayoutForm.bathroom
          };
          ElMessage.success("房型更新成功");
        }
      } else {
        const newHouseLayout: HouseLayoutProps = {
          id: Date.now().toString(),
          layoutName: houseLayoutForm.name,
          bedroom: houseLayoutForm.bedroom,
          livingRoom: houseLayoutForm.livingRoom,
          kitchen: houseLayoutForm.kitchen,
          bathroom: houseLayoutForm.bathroom,
          newly: true
        };
        form.value.houseLayoutList.push(newHouseLayout);
        ElMessage.success("房型创建成功");
      }

      showCreateDialog.value = false;
    } catch (error) {
      // 验证失败
    }
  };

  const resetForm = () => {
    isEditing.value = false;
    houseLayoutForm.id = "";
    houseLayoutForm.name = "";
    houseLayoutForm.bedroom = 1;
    houseLayoutForm.livingRoom = 1;
    houseLayoutForm.kitchen = 1;
    houseLayoutForm.bathroom = 1;
    formRef.value?.clearValidate();
  };

  // 重置房源数据
  const resetHouses = () => {
    form.value.buildings?.forEach(building => {
      initAllFloorsForBuilding(building);
    });
    selectedHouses.value = [];
    ElMessage.success("房源数据已重置");
  };

  // 保存并进入下一步
  const clickSaveAssignHouse = async () => {
    try {
      // 转换 Map 结构为 houseList 数组
      form.value.houseList = convertBuildingsToHouseList(form.value.buildings);

      if (form.value.houseList.length === 0) {
        ElMessage.warning("请至少配置一间房源");
        return;
      }

      emit("to-add-extra");
    } catch (error) {
      ElMessage.warning("请完善房源配置");
    }
  };

  const stepPrevious = () => {
    emit("step-previous");
  };

  // 生命周期钩子
  onMounted(() => {
    document.addEventListener("click", hideContextMenu);

    // 确保有楼栋时默认选中第一个
    if (form.value.buildings && form.value.buildings.length > 0) {
      selectedBuildingIndex.value = 0;

      // 如果楼栋没有初始化房源数据，进行初始化
      form.value.buildings.forEach(building => {
        if (!building.housesStatusOfFloors || building.housesStatusOfFloors.size === 0) {
          initAllFloorsForBuilding(building);
        }
      });
    }
  });

  onUnmounted(() => {
    document.removeEventListener("click", hideContextMenu);
  });

  // 当前楼栋的统计信息
  // 修改统计信息，排除禁用楼层
  const currentBuildingStats = computed(() => {
    const building = currentBuilding.value;
    if (!building) {
      return {
        floors: 0,
        total: 0,
        unassigned: 0,
        enabled: 0,
        disabled: 0
      };
    }

    let total = 0;
    let unassigned = 0;
    let enabled = 0;
    let disabled = 0;

    // 计算活跃楼层数（未禁用的楼层）
    const activeFloors = building.floorTotal - (building.closedFloors?.length || 0);

    if (building.housesStatusOfFloors) {
      for (const [floor, houseMap] of building.housesStatusOfFloors) {
        // 跳过已禁用的楼层
        if (building.closedFloors?.includes(floor)) {
          continue;
        }

        for (const [_, house] of houseMap) {
          total++;
          if (house.locked) {
            disabled++;
          } else {
            enabled++;
            if (!house.houseLayoutId) {
              unassigned++;
            }
          }
        }
      }
    }

    return {
      floors: activeFloors,
      total,
      unassigned,
      enabled,
      disabled
    };
  });

  // 检查楼层是否被禁用
  const isFloorDisabled = (floor: number) => {
    return currentBuilding.value?.closedFloors?.includes(floor) || false;
  };

  // 切换楼层禁用状态
  const toggleFloorStatus = async (floor: number) => {
    if (!currentBuilding.value) return;

    // 确保 closedFloors 是数组
    if (!currentBuilding.value.closedFloors) {
      currentBuilding.value.closedFloors = [];
    }

    const index = currentBuilding.value.closedFloors.indexOf(floor);

    if (index > -1) {
      // 启用楼层
      try {
        await ElMessageBox.confirm(`确定要启用第 ${floor} 层吗？该楼层的所有房源将恢复可用状态。`, "启用楼层", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        });

        currentBuilding.value.closedFloors.splice(index, 1);
        ElMessage.success(`第 ${floor} 层已启用`);
      } catch {
        // 用户取消
      }
    } else {
      // 禁用楼层
      try {
        const floorHouses = getHousesByFloor(floor);
        await ElMessageBox.confirm(`确定要禁用第 ${floor} 层吗？该楼层的 ${floorHouses.length} 个房源将被禁用。`, "禁用楼层", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        });

        currentBuilding.value.closedFloors.push(floor);

        // 从选中列表中移除该楼层的房源
        const floorHouseIds = floorHouses.map(h => h.cursor);
        selectedHouses.value = selectedHouses.value.filter(id => !floorHouseIds.includes(id));

        ElMessage.success(`第 ${floor} 层已禁用`);
      } catch {
        // 用户取消
      }
    }
  };

  // 删除楼层方法
  // 删除楼层方法（已有的，确保更新楼层总数）
  const deleteFloor = (floor: number) => {
    if (!currentBuilding.value) return;

    // 删除楼层数据
    if (currentBuilding.value.housesStatusOfFloors) {
      currentBuilding.value.housesStatusOfFloors.delete(floor);

      // 如果删除的是最高层，更新楼层总数
      const remainingFloors = Array.from(currentBuilding.value.housesStatusOfFloors.keys());
      if (remainingFloors.length > 0) {
        currentBuilding.value.floorTotal = Math.max(...remainingFloors);
      } else {
        currentBuilding.value.floorTotal = 0;
      }
    }

    // 从禁用列表中移除
    if (currentBuilding.value.closedFloors) {
      const index = currentBuilding.value.closedFloors.indexOf(floor);
      if (index > -1) {
        currentBuilding.value.closedFloors.splice(index, 1);
      }
    }

    // 从选中列表中移除该楼层的房源
    const floorHouses = getHousesByFloor(floor);
    const floorHouseIds = floorHouses.map(h => h.cursor);
    selectedHouses.value = selectedHouses.value.filter(id => !floorHouseIds.includes(id));

    ElMessage.success(`第 ${floor} 层已删除`);
  };

  // 添加楼层的方法
  const confirmAddFloor = () => {
    if (!currentBuilding.value) {
      ElMessage.warning("请先选择楼栋");
      return;
    }

    const floor = newFloorNumber.value;

    // 检查楼层是否已存在
    if (currentBuilding.value.housesStatusOfFloors?.has(floor)) {
      ElMessage.warning(`第 ${floor} 层已存在`);
      return;
    }

    // 使用 hook 中的方法初始化新楼层
    initFloorWithConfig(floor);

    // 更新楼层总数（如果新楼层超出了原有总数）
    if (currentBuilding.value.floorTotal < floor) {
      currentBuilding.value.floorTotal = floor;
    }

    ElMessage.success(`第 ${floor} 层创建成功`);
    showAddFloorPopover.value = false;
    newFloorNumber.value = 1;
  };

  // 使用当前楼栋配置初始化楼层
  const initFloorWithConfig = (floor: number) => {
    if (!currentBuilding.value) return;

    const building = currentBuilding.value;
    const houseCount = building.houseCountPerFloor || 10;
    const houseStatusMap = new Map<string, HouseStatusProps>();

    for (let i = 1; i <= houseCount; i++) {
      const houseNum = i.toString();

      // 如果启用了"去4"选项，跳过包含4的房间号
      if (building.excludeFour && houseNum.includes("4")) {
        continue;
      }

      const doorNumber = formatHouseNumber(building.housePrefix, building.numberLength, floor, houseNum);

      houseStatusMap.set(houseNum, {
        cursor: `${building.building}-${building.unit || "0"}-${floor}-${i}`,
        houseIndex: i,
        doorNumber: doorNumber,
        locked: false,
        floor: floor,
        building: building.building,
        unit: building.unit,
        houseLayoutId: undefined,
        price: 0,
        direction: "",
        area: 0
      });
    }

    // 确保 housesStatusOfFloors 存在
    if (!building.housesStatusOfFloors) {
      building.housesStatusOfFloors = new Map();
    }

    building.housesStatusOfFloors.set(floor, houseStatusMap);
  };
</script>

<style scoped>
  .house-floor-management {
    /* 样式保持不变 */
  }

  .building-selector h2 {
    margin-bottom: 12px;
  }

  .building-selector .el-button {
    margin-right: 8px;
    margin-bottom: 8px;
  }

  .floor-checkbox :deep(.el-checkbox__label) {
    font-size: 14px;
    font-weight: 500;
  }

  :deep(.el-input-number .el-input__inner) {
    text-align: center;
  }

  .bg-blue-25 {
    background-color: rgb(59 130 246 / 10%);
  }

  /* 已关闭房源的样式 */
  .closed-house {
    color: #c0c4cc !important;
    text-decoration: line-through;
    opacity: 0.6;
  }

  /* 添加禁用楼层的样式 */
  .floor-section {
    transition: all 0.3s ease;
  }

  .floor-section:hover {
    transform: translateX(2px);
  }
</style>
