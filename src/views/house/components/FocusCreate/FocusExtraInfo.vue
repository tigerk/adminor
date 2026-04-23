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
                <el-option v-for="item in WATER_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="用电" required>
              <el-select v-model="formData.electricity" placeholder="请选择">
                <el-option v-for="item in ELECTRICITY_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="供暖信息" required>
              <el-select v-model="formData.heating" placeholder="请选择">
                <el-option v-for="item in HEATING_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
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
  import { computed, onMounted, reactive, ref, watch } from "vue";
  import { LocalFocusCreateDto } from "@/views/house/components/FocusCreate/utils/types";
  import UploadImage from "@/components/upload/UploadImage.vue";
  import { getDictDataByDictCode } from "@/api/sys/dict";
  import { createFocusBasicInfoRules } from "@/views/house/components/FocusCreate/utils/rule";
  import { ELECTRICITY_TYPE_OPTIONS, HEATING_TYPE_OPTIONS, WATER_TYPE_OPTIONS } from "@/constants";

  // 获取 FocusCreateForm 中的form数据，vue3.3+
  const formData = defineModel<LocalFocusCreateDto>();

  const focusBasicInfoRules = createFocusBasicInfoRules(formData);

  // 定义 emits
  const emit = defineEmits<{
    "step-previous": [];
    "to-create-house": [];
  }>();

  // 预设标签选项（从字典获取：focus_tags）
  const tagOptions = ref<Array<{ label: string; value: string }>>([]);

  const facilitiesOptions = ref([]);

  onMounted(async () => {
    const [facilitiesResp, focusTagsResp] = await Promise.all([
      getDictDataByDictCode({
        dictCode: "focus_facilities"
      }),
      getDictDataByDictCode({
        dictCode: "focus_tags"
      })
    ]);

    facilitiesOptions.value = (facilitiesResp.data || []).map((item: any) => ({
      label: item.name,
      value: item.value
    }));

    tagOptions.value = (focusTagsResp.data || []).map((item: any) => ({
      label: item.name,
      value: String(item.value ?? item.id ?? item.name)
    }));
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
