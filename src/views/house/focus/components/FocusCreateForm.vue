<script setup lang="ts">
  import { ref, reactive } from "vue";
  import { FormProps } from "@/views/house/focus/components/utils/types";
  import FocusAssignRoom from "@/views/house/focus/components/FocusAssignRoom.vue";
  import FocusExtraInfo from "@/views/house/focus/components/FocusExtraInfo.vue";
  import FocusBasicInfo from "@/views/house/focus/components/FocusBasicInfo.vue";

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
      remark: "",
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
      salesmanId: 0
    })
  });

  // 表单数据
  const form = reactive(props.formInline);

  // 步骤激活状态
  const stepActive = ref(2);
  const stepNext = () => {
    if (stepActive.value++ > 2) {
      stepActive.value = 0;
    }
  };

  const stepPrevious = () => {
    if (stepActive.value-- > 2) {
      stepActive.value = 0;
    }
  };

  const basicInfoRef = ref();

  function getRef() {
    return basicInfoRef.value?.getRef();
  }

  defineExpose({ getRef });

  // 处理基本信息组件的表单数据更新
  const handleFormDataUpdate = (newFormData: any) => {
    Object.assign(form, newFormData);
  };

  // 处理保存并进入下一步
  const handleSaveFocusHouse = () => {
    stepNext();
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
      <FocusBasicInfo ref="basicInfoRef" :form-data="form" @update:form-data="handleFormDataUpdate" @save-focus-house="handleSaveFocusHouse" />
    </div>
    <div v-if="stepActive == 1">
      <FocusAssignRoom />
    </div>
    <div v-if="stepActive == 2">
      <FocusExtraInfo />
    </div>
    <!-- 其他步骤的按钮 -->
    <el-row v-if="stepActive !== 0" :gutter="20">
      <el-col :span="24" class="text-right">
        <el-button v-if="stepActive == 1 || stepActive == 2" type="primary" style="margin-top: 12px" @click="stepPrevious">上一步</el-button>
        <el-button v-if="stepActive == 1" type="primary" style="margin-top: 12px" @click="stepNext">保存并完善项目</el-button>
        <el-button v-if="stepActive == 2" type="primary" style="margin-top: 12px">保存</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
  .property-form {
    margin: 0 auto;
    padding: 20px;
  }
</style>
