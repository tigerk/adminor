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
      building: "",
      unit: "",
      doorNumber: "",
      // 总楼层
      floorTotal: 34,
      // 每个楼层的房间数量
      roomCountPerFloor: null,
      // 关闭楼层楼层
      closedFloors: [],
      // 关闭的房间
      closedRooms: [],
      // 所有楼层的房间状态
      houseStatusOfFloors: new Map<number, Map<string, HouseStatusProps>>(),
      // 所有房间
      houseList: [],
      // 选择的楼层
      selectedFloor: 1,
      // 选择的房间数量
      selectedRooms: null,
      // 房间前缀
      roomPrefix: "",
      // 去掉4
      excludeFour: false,
      // 房间编号长度
      roomNumberLength: 3,
      deptId: 0,
      salesmanId: 0,
      // 第三步填写
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

  // 定义 emits
  const emit = defineEmits(["create-success", "created-focus-house"]);

  // 表单数据 - 确保响应式
  const form = reactive({ ...props.formInline });

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
      // 收集所有数据
      const submitData = {
        // 基本信息
        ...form,
        imageList: form.imageList.map((file: any) => file?.url).filter(Boolean),
        regionId: form.region[form.region.length - 1]
      };

      // 调用后台接口
      const response = await createFocusHouse(submitData);

      if (response.code === 0) {
        ElMessage.success("项目保存成功！");
        // 可以根据需要进行页面跳转或其他操作
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
  <el-steps :active="stepActive" finish-status="success" align-center>
    <el-step title="基本信息" />
    <el-step title="配置房间" />
    <el-step title="完善项目" />
  </el-steps>
  <div class="property-form">
    <div v-if="stepActive == 0">
      <FocusBasicInfo ref="basicInfoRef" v-model="form" @to-assign-room="stepNext" />
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
    padding: 20px;
    margin: 0 auto;
  }
</style>
