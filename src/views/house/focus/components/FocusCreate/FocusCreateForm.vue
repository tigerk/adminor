<script setup lang="ts">
  import { ref, reactive, watch } from "vue";
  import { FormProps, HouseStatusProps } from "@/views/house/focus/components/FocusCreate/utils/types";
  import FocusAssignHouse from "@/views/house/focus/components/FocusCreate/FocusAssignHouse.vue";
  import FocusExtraInfo from "@/views/house/focus/components/FocusCreate/FocusExtraInfo.vue";
  import FocusBasicInfo from "@/views/house/focus/components/FocusCreate/FocusBasicInfo.vue";
  import { ElMessage } from "element-plus";
  import { createFocusHouse } from "@/api/house/focus";

  const props = withDefaults(defineProps<FormProps>(), {
    formInline: () => ({
      id: 0,
      businessMode: 0,
      houseCode: "",
      houseName: "",
      region: [],
      address: "",
      buildings: [
        {
          building: "",
          unit: "",
          floorTotal: 34,
          houseCountPerFloor: 10,
          closedFloors: [],
          closedHouses: [],
          selectedFloor: 1,
          housePrefix: "A",
          excludeFour: false,
          numberLength: 4,
          selectedHouses: null,
          housesStatusOfFloors: new Map() // 确保初始化
        }
      ],
      houseList: [],
      deptId: 0,
      salesmanId: 0,
      storePhone: "",
      water: "commercial",
      electricity: "commercial",
      heating: "central",
      hasGas: true,
      hasElevator: true,
      facilities: [],
      houseDesc: "",
      businessDesc: "",
      tags: [],
      remark: "",
      imageList: [],
      houseLayoutList: [
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
      ]
    })
  });

  const emit = defineEmits(["create-success", "created-focus-house"]);

  // 深度克隆函数，确保 Map 对象被正确复制
  const deepCloneForm = (source: any) => {
    const result = JSON.parse(
      JSON.stringify(source, (key, value) => {
        if (value instanceof Map) {
          return Array.from(value.entries());
        }
        return value;
      })
    );

    // 重新构建 Map 对象
    if (result.buildings) {
      result.buildings.forEach((building: any) => {
        if (building.housesStatusOfFloors && Array.isArray(building.housesStatusOfFloors)) {
          const newMap = new Map();
          building.housesStatusOfFloors.forEach(([floor, houses]: [number, any[]]) => {
            const houseMap = new Map();
            houses.forEach(([houseKey, houseValue]: [string, any]) => {
              houseMap.set(houseKey, houseValue);
            });
            newMap.set(floor, houseMap);
          });
          building.housesStatusOfFloors = newMap;
        } else {
          building.housesStatusOfFloors = new Map();
        }
      });
    }

    return result;
  };

  // 使用深度克隆确保响应式
  const form = reactive(deepCloneForm(props.formInline));

  // 步骤激活状态
  const stepActive = ref(0);

  // 组件引用
  const basicInfoRef = ref();
  const assignHouseRef = ref();
  const extraInfoRef = ref();

  const stepNext = () => {
    if (stepActive.value++ > 2) {
      stepActive.value = 0;
    }
  };

  const stepPrevious = () => {
    if (stepActive.value-- < 0) {
      stepActive.value = 0;
    }
  };

  function getRef() {
    return basicInfoRef.value?.getRef();
  }

  defineExpose({ getRef });

  // 处理基本信息组件的表单数据更新
  const handleFormDataUpdate = (newFormData: any) => {
    Object.assign(form, newFormData);
  };

  // 提交所有数据到后台
  const submitAllData = async () => {
    try {
      const submitData = {
        ...form,
        imageList: form.imageList.map((file: any) => file?.url).filter(Boolean),
        regionId: form.region[form.region.length - 1]
      };

      const response = await createFocusHouse(submitData);

      if (response.code === 0) {
        ElMessage.success("项目保存成功！");
        emit("create-success");
        emit("created-focus-house", response.data);
      } else {
        ElMessage.error(response.message || "提交失败");
      }
    } catch (error) {
      console.error("提交失败:", error);
      ElMessage.error("提交失败，请稍后重试");
    }
  };
</script>

<template>
  <div class="steps-container">
    <el-steps :active="stepActive" finish-status="success" align-center>
      <el-step title="基本信息" />
      <el-step title="配置房间" />
      <el-step title="完善项目" />
    </el-steps>
  </div>
  <div class="property-form">
    <div v-if="stepActive == 0">
      <FocusBasicInfo ref="basicInfoRef" v-model="form" @to-assign-house="stepNext" />
    </div>
    <div v-if="stepActive == 1">
      <FocusAssignHouse ref="assignHouseRef" v-model="form" @step-previous="stepPrevious" @to-add-extra="stepNext" />
    </div>
    <div v-if="stepActive == 2">
      <FocusExtraInfo ref="extraInfoRef" v-model="form" @step-previous="stepPrevious" @to-create-house="submitAllData" />
    </div>
  </div>
</template>

<style scoped>
  .property-form {
    padding: 15px 20px;
    margin: 0 auto;
  }

  .steps-container {
    margin-bottom: -10px;
    transform: scale(0.85);
    transform-origin: center top;
  }
</style>
