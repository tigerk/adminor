<template>
  <div class="project-info-form">
    <el-form ref="ruleFormRef" label-position="top" :rules="focusBasicInfoRules">
      <!-- 项目信息 -->
      <div class="section">
        <h3 class="section-title">项目信息</h3>
        <el-row :gutter="20" class="form-row">
          <el-col :span="5">
            <el-form-item class="el-form-item" label="联系电话" required>
              <el-input v-model="formData.storePhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="用水" required class="el-form-item">
              <el-select v-model="formData.water" placeholder="请选择">
                <el-option label="商业用水" value="commercial" />
                <el-option label="民用水" value="residential" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="用电" required>
              <el-select v-model="formData.electricity" placeholder="请选择">
                <el-option label="商业用电" value="commercial" />
                <el-option label="民用电" value="residential" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="供暖信息" required>
              <el-select v-model="formData.heating" placeholder="请选择">
                <el-option label="集中供暖" value="central" />
                <el-option label="独立供暖" value="independent" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="&nbsp;">
              <el-checkbox v-model="formData.hasGas">有燃气</el-checkbox>
              <el-checkbox v-model="formData.hasElevator">有电梯</el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" class="form-row">
          <el-col :span="24">
            <el-form-item label="项目配置" required>
              <el-space wrap size="large" class="items-start">
                <el-checkbox
                  v-for="item in facilitiesOptions"
                  :key="item.value"
                  :checked="formData.facilities.includes(item.value)"
                  border
                  @change="
                    (val: boolean) => {
                      if (val) {
                        formData.facilities.push(item.value);
                      } else {
                        const index = formData.facilities.indexOf(item.value);
                        if (index > -1) {
                          formData.facilities.splice(index, 1);
                        }
                      }
                    }
                  "
                >
                  {{ item.label }}
                </el-checkbox>
              </el-space>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 项目介绍 -->
      <div class="section">
        <el-form-item label="项目介绍">
          <el-input v-model="formData.houseDesc" type="text" placeholder="请输入项目介绍" :rows="4" maxlength="500" show-word-limit />
        </el-form-item>
      </div>

      <!-- 商圈介绍 -->
      <div class="section">
        <el-form-item label="商圈介绍">
          <el-input v-model="formData.businessDesc" type="text" placeholder="请输入商圈介绍" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
      </div>

      <!-- 项目标签 -->
      <div class="section">
        <el-form-item label="项目标签">
          <div class="tag-section">
            <el-select v-model="formData.tags" multiple filterable allow-create default-first-option :reserve-keyword="false" placeholder="输入标签后按回车添加" class="full-width">
              <el-option v-for="item in tagOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>
        </el-form-item>
      </div>

      <!-- 备注 -->
      <div class="section">
        <el-form-item label="备注">
          <div class="note-section">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注信息" :rows="3" maxlength="500" show-word-limit />
          </div>
        </el-form-item>
      </div>

      <!-- 项目图片 -->
      <div class="section">
        <h3 class="section-title">项目图片</h3>
        <UploadImage v-model="formData.imageList" :limit="10" />
      </div>
    </el-form>

    <el-row :gutter="20">
      <el-col :span="24" class="text-right">
        <el-button type="primary" style="margin-top: 12px" @click="stepPrevious">上一步</el-button>
        <el-button type="primary" style="margin-top: 12px" @click="clickCreateHouse">完成创建</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref, watch } from "vue";
  import { focusBasicInfoRules } from "@/views/house/focus/components/utils/rule";
  import { FocusFormItemProps } from "@/views/house/focus/components/utils/types";
  import UploadImage from "@/components/Business/UploadImage.vue";
  import { getDictDataByDictCode } from "@/api/sys/dict";

  // 获取 FocusCreateForm 中的form数据，vue3.3+
  const formData = defineModel<FocusFormItemProps>();

  // 初始化操作，没有值时进行默认值处理
  formData.value.storePhone = formData.value?.storePhone || "";
  formData.value.water = formData.value?.water || "commercial";
  formData.value.electricity = formData.value?.electricity || "commercial";
  formData.value.heating = formData.value?.heating || "central";
  formData.value.hasGas = formData.value?.hasGas !== undefined ? formData.value.hasGas : true;
  formData.value.hasElevator = formData.value?.hasElevator !== undefined ? formData.value.hasElevator : true;
  formData.value.facilities = formData.value?.facilities || [];
  formData.value.houseDesc = formData.value?.houseDesc || "";
  formData.value.businessDesc = formData.value?.businessDesc || "";
  formData.value.tags = formData.value?.tags || [];
  formData.value.remark = formData.value?.remark || "";
  formData.value.imageList = formData.value?.imageList || [];

  // 定义 emits
  const emit = defineEmits<{
    "step-previous": [];
    "to-create-house": [];
  }>();

  // 预设标签选项
  const tagOptions = ref([
    { label: "精装修", value: "精装修" },
    { label: "近地铁", value: "近地铁" },
    { label: "商圈核心", value: "商圈核心" },
    { label: "拎包入住", value: "拎包入住" },
    { label: "高性价比", value: "高性价比" }
  ]);

  const facilitiesOptions = ref([]);

  onMounted(() => {
    getDictDataByDictCode({
      dictCode: "house_facilities"
    }).then(res => {
      facilitiesOptions.value = res.data.map(item => ({
        label: item.name,
        value: item.value
      }));
    });
  });

  async function stepPrevious() {
    emit("step-previous");
  }

  async function clickCreateHouse() {
    emit("to-create-house");
  }
</script>

<style lang="scss" scoped>
  :deep(.el-form-item--label-top .el-form-item__label) {
    font-size: 12px;
    color: #43464c;
  }

  .section {
    margin-bottom: 24px;
  }

  .section-title {
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .form-row {
    margin-bottom: 5px;
  }

  .tag-section,
  .note-section {
    width: 100%;
  }

  .tag-limit,
  .note-limit {
    margin-right: 8px;
    font-size: 12px;
    color: #909399;
  }

  .upload-demo {
    margin-top: 8px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
  }

  :deep(.el-input__wrapper) {
    border-radius: 4px;
  }

  :deep(.el-select) {
    width: 100%;
  }
</style>
