<script setup lang="ts">
  import { ref, reactive } from "vue";
  import { FormProps, RoomStatusProps } from "@/views/house/focus/components/utils/types";
  import FocusAssignRoom from "@/views/house/focus/components/FocusAssignRoom.vue";
  import FocusExtraInfo from "@/views/house/focus/components/FocusExtraInfo.vue";
  import FocusBasicInfo from "@/views/house/focus/components/FocusBasicInfo.vue";
  import { ElMessage } from "element-plus";
  import { createFocusHouse } from "@/api/house/focus";

  const props = withDefaults(defineProps<FormProps>(), {
    formInline: () => ({
      id: 0,
      businessMode: 0,
      houseCode: "",
      houseName: "",
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
      closedRooms: [],
      // 所有楼层的房间状态
      roomsStatusOfFloors: new Map<number, Map<string, RoomStatusProps>>(),
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
      phone: "",
      water: "commercial",
      electricity: "commercial",
      heating: "central",
      hasGas: true,
      hasElevator: true,
      facilities: {},
      projectDescription: "",
      businessDescription: "",
      tags: [],
      remark: ""
    })
  });

  // 表单数据
  const form = reactive(props.formInline);

  // 步骤激活状态
  const stepActive = ref(0);

  // 组件引用
  const basicInfoRef = ref();
  const assignRoomRef = ref();
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

        // 房型信息
        houseLayouts: assignRoomRef.value?.houseLayouts || [],

        // 房间信息
        rooms: [],

        // FocusExtraInfo组件的数据
        extraInfo: extraInfoRef.value?.formData || {}
      };

      // 转换房间数据格式
      if (assignRoomRef.value?.allRooms) {
        submitData.rooms = assignRoomRef.value.allRooms.map(room => ({
          id: room.id,
          roomNumber: room.roomNumber,
          floor: room.floor,
          locked: room.locked,
          houseLayoutId: room.houseLayoutId,
          price: room.price,
          direction: room.direction,
          area: room.area
        }));
      }

      // 调用后台接口
      const response = await createFocusHouse(submitData);

      if (response.code === 0) {
        ElMessage.success("项目创建成功！");
        // 可以根据需要进行页面跳转或其他操作
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
      <FocusBasicInfo ref="basicInfoRef" :form-data="form" @update:form-data="handleFormDataUpdate" @to-assign-room="stepNext" />
    </div>
    <div v-if="stepActive == 1">
      <FocusAssignRoom ref="assignRoomRef" :form-data="form" @update:form-data="handleFormDataUpdate" @step-previous="stepPrevious" @to-add-extra="stepNext" />
    </div>
    <div v-if="stepActive == 2">
      <FocusExtraInfo ref="extraInfoRef" :form-data="form" @update:form-data="handleFormDataUpdate" @step-previous="stepPrevious" @to-create-house="submitAllData" />
    </div>
    <!-- 其他步骤的按钮 -->
    <el-row v-if="stepActive !== 0" :gutter="20">
      <el-col :span="24" class="text-right">
        <el-button v-if="stepActive == 2" type="primary" style="margin-top: 12px" @click="submitAllData">保存</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
  .property-form {
    padding: 20px;
    margin: 0 auto;
  }
</style>
