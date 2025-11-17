<template>
  <div class="section-tenant-info">
    <el-form ref="ruleFormRef" :model="formInline" :rules="rules" label-width="100px" label-position="top">
      <div class="section-header">
        <el-space spacer=" | ">
          <el-tooltip content="请选择租客类型" placement="right">
            <el-segmented v-model="formInline.tenant.tenantType" :options="tenantTypeOptions" />
          </el-tooltip>
        </el-space>
      </div>
      <div class="mt-4">
        <div v-if="formInline.tenant.tenantType === 0">
          <el-row :gutter="20">
            <el-col :span="4">
              <el-form-item label="租客姓名" prop="name">
                <el-input v-model="formInline.tenant.name" placeholder="请输入租客姓名" clearable maxlength="20" show-word-limit />
              </el-form-item>
            </el-col>

            <el-col :span="3">
              <el-form-item label="&nbsp;" prop="gender">
                <el-segmented v-model="formInline.tenant.gender" :options="genderOptions" />
              </el-form-item>
            </el-col>

            <el-col :span="4">
              <el-form-item label="联系电话" prop="phone">
                <el-input v-model="formInline.tenant.phone" placeholder="请输入联系电话" clearable maxlength="30" />
              </el-form-item>
            </el-col>

            <el-col :span="3">
              <el-form-item label="证件类型" prop="idType">
                <el-select v-model="formInline.tenant.idType" placeholder="请选择证件类型" class="w-full">
                  <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="证件号码" prop="idNo">
                <el-input v-model="formInline.tenant.idNo" placeholder="请输入证件号码" clearable maxlength="20" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="租客标签" prop="tags">
                <el-select v-model="formInline.tenant.tags" placeholder="租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
                  <el-option v-for="item in tenantTagOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="1" class="mb-4">
            <el-col :span="24">
              <el-space spacer="|">
                <div>
                  <div class="mb-2">
                    <span class="font-bold">证件信息</span>
                  </div>
                  <el-space>
                    <UploadImage v-model="idCardFrontList" :limit="1" :width="120" :height="72">
                      <!-- 使用自定义提示 -->
                      <template #tip="{ limit, fileCount }">
                        <div class="text-center font-bold text-sm">身份证国徽面</div>
                      </template>
                    </UploadImage>
                    <UploadImage v-model="idCardBackList" :limit="1" :width="120" :height="72">
                      <!-- 使用自定义提示 -->
                      <template #tip="{ limit, fileCount }">
                        <div class="text-center font-bold text-sm">身份证人像面</div>
                      </template>
                    </UploadImage>
                    <UploadImage v-model="idCardInHandList" :limit="1" :width="120" :height="72">
                      <!-- 使用自定义提示 -->
                      <template #tip="{ limit, fileCount }">
                        <div class="text-center font-bold text-sm">手持身份证照片</div>
                      </template>
                    </UploadImage>
                  </el-space>
                </div>
                <div>
                  <div class="mb-2">
                    <span class="font-bold">租客证件照片</span>
                  </div>
                  <UploadImage v-model="otherImageList" :limit="3" :width="120" :height="72">
                    <!-- 使用自定义提示 -->
                    <template #tip="{ limit, fileCount }">
                      <div class="font-bold text-sm">其他照片，最多可上传3张</div>
                    </template>
                  </UploadImage>
                </div>
              </el-space>
            </el-col>
          </el-row>
        </div>

        <div v-if="formInline.tenant.tenantType === 1">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="企业名称" prop="name">
                <el-input v-model="formInline.tenant.name" placeholder="请输入企业名称" clearable maxlength="20" show-word-limit />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="统一社会信用代码" prop="idNo">
                <el-input v-model="formInline.tenant.idNo" placeholder="请输入统一社会信用代码" clearable maxlength="20" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="法定代表人" prop="legalRepresentative">
                <el-input v-model="formInline.tenant.legalRepresentative" placeholder="请输入法定代表人" clearable maxlength="30" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="联系电话" prop="phone">
                <el-input v-model="formInline.tenant.phone" placeholder="请输入联系电话" clearable maxlength="30" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="租客标签" prop="tags">
                <el-select v-model="formInline.tenant.tags" placeholder="租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
                  <el-option v-for="item in tenantTagOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <upload-image v-model="formInline.tenant.avatar" :limit="3" />
            </el-col>
          </el-row>
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="租客来源" prop="tenantSource">
              <el-select v-model="formInline.tenant.tenantSource" placeholder="请选择租客来源" class="w-full" clearable>
                <el-option v-for="item in tenantSourceOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="成交渠道" prop="dealChannel">
              <el-select v-model="formInline.tenant.dealChannel" placeholder="请选择成交渠道" class="w-full" clearable>
                <el-option v-for="item in dealChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="租客标签" prop="tags">
              <el-select v-model="formInline.tenant.tags" placeholder="请选择租客标签" class="w-full" multiple clearable collapse-tags collapse-tags-tooltip>
                <el-option v-for="item in tenantTagOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="formInline.tenant.remark" type="textarea" :rows="4" placeholder="请输入备注信息" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from "vue";
  import type { FormInstance } from "element-plus";
  import { GENDER_OPTIONS, ID_TYPE_OPTIONS, TENANT_TYPE_OPTIONS } from "@/constants";
  import type { TenantsCreateFormProps } from "@/types";
  import { tenantFormRules } from "@/views/contract/tenant/utils/rule";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import UploadImage from "@/components/Business/UploadImage.vue";

  const { tenantSourceOptions, dealChannelOptions, tenantTagOptions } = useTenant();

  interface FormProps {
    formInline: TenantsCreateFormProps;
  }
  const props = defineProps<FormProps>();

  // 表单引用
  const ruleFormRef = ref<FormInstance>();

  // 表单数据
  const formInline = reactive<TenantsCreateFormProps>({
    tenant: {
      id: props.formInline?.tenant?.id,
      name: props.formInline?.tenant?.name || "",
      gender: props.formInline?.tenant?.gender,
      tenantType: props.formInline?.tenant?.tenantType ?? 0,
      idType: props.formInline?.tenant?.idType ?? 0,
      idNo: props.formInline?.tenant?.idNo || "",
      phone: props.formInline?.tenant?.phone || "",
      tenantSource: props.formInline?.tenant?.tenantSource,
      dealChannel: props.formInline?.tenant?.dealChannel,
      tags: props.formInline?.tenant?.tags || [],
      remark: props.formInline?.tenant?.remark || "",
      status: props.formInline?.tenant?.status ?? 1
    },
    contract: null
  });

  // 验证规则
  const rules = tenantFormRules(formInline);

  // 常量选项
  const genderOptions = GENDER_OPTIONS;
  const idTypeOptions = ID_TYPE_OPTIONS;
  const tenantTypeOptions = TENANT_TYPE_OPTIONS;

  const idCardFrontList = ref([]);
  const idCardBackList = ref([]);
  const idCardInHandList = ref([]);
  const otherImageList = ref([]);

  // 暴露方法给父组件
  const getRef = () => {
    return ruleFormRef.value;
  };

  defineExpose({
    getRef,
    formInline
  });
</script>

<style scoped lang="scss">
  :deep(.el-form-item__label) {
    font-weight: 500;
  }
</style>
