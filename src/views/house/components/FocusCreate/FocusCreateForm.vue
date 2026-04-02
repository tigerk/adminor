<script setup lang="ts">
  import { ref } from "vue";
  import type { FocusHouseDto } from "@/types";
  import type { FormProps, LocalFocusCreateDto } from "@/views/house/components/FocusCreate/utils/types";
  import FocusAssignHouse from "@/views/house/components/FocusCreate/FocusAssignHouse.vue";
  import FocusExtraInfo from "@/views/house/components/FocusCreate/FocusExtraInfo.vue";
  import FocusBasicInfo from "@/views/house/components/FocusCreate/FocusBasicInfo.vue";
  import { ElMessage } from "element-plus";
  import { createFocusHouse } from "@/api/house/focus";
  import { useFocusEdit } from "@/views/house/components/FocusCreate/utils/hook";
  import { convertImage2string } from "@/utils/image";

  const props = withDefaults(defineProps<FormProps>(), {
    formInline: () => ({
      id: "",
      leaseMode: 1,
      focusCode: "",
      focusName: "",
      address: "",
      community: null,
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
          housesStatusOfFloors: new Map<number, Map<string, FocusHouseDto>>(),
          isNew: true
        }
      ],
      houseList: [],
      deptId: "",
      salesmanId: "",
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

  // 使用hook中的方法
  const { distributeHousesToBuildings } = useFocusEdit();

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

    distributeHousesToBuildings(result);

    return result;
  };

  // ✅ 改为 ref 而不是 reactive
  const form = ref<LocalFocusCreateDto>(
    deepCloneForm({
      ...props.formInline,
      // ✅ 在这里设置默认值
      storePhone: props.formInline.storePhone || "",
      water: props.formInline.water || "commercial",
      electricity: props.formInline.electricity || "commercial",
      heating: props.formInline.heating || "central",
      hasGas: props.formInline.hasGas === undefined ? true : props.formInline.hasGas,
      hasElevator: props.formInline.hasElevator === undefined ? true : props.formInline.hasElevator,
      facilities: props.formInline.facilities || [],
      houseDesc: props.formInline.houseDesc || "",
      businessDesc: props.formInline.businessDesc || "",
      tags: props.formInline.tags || [],
      remark: props.formInline.remark || "",
      imageList: props.formInline.imageList || []
    })
  );

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

  // 提交所有数据到后台
  const submitAllData = async () => {
    try {
      const submitData = {
        ...form.value
      };
      // 处理 imageList 字段，图片对象时，提取 url 字段，字符串时，直接添加
      submitData.imageList = convertImage2string(form.value.imageList);

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
    padding: 15px 5px 0 5px;
    margin: 0 auto;
  }

  .steps-container {
    margin-bottom: -10px;
    transform: scale(0.85);
    transform-origin: center top;
  }
</style>
