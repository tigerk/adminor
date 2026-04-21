<template>
  <div class="section-tenant-info">
    <el-form ref="ruleFormRef" :model="formInlines" :rules="dynamicRules" label-width="100px" label-position="top">
      <div v-for="(tenant, index) in formInlines" :key="index" class="mb-4">
        <el-card class="mb-4">
          <template #header>
            <div class="card-header">
              <span>同住人 {{ index + 1 }} {{ tenant.name }}</span>
              <el-button size="small" type="primary" @click="removeMate(index)">删除</el-button>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="5">
              <el-form-item label="姓名" :prop="`${index}.name`" required>
                <el-input v-model="tenant.name" placeholder="请输入租客姓名" clearable maxlength="20" show-word-limit />
              </el-form-item>
            </el-col>

            <el-col :span="2">
              <el-form-item label="&nbsp;" :prop="`${index}.gender`">
                <el-segmented v-model="tenant.gender" :options="genderOptions" />
              </el-form-item>
            </el-col>

            <el-col :span="4">
              <el-form-item label="联系电话" :prop="`${index}.phone`" required>
                <el-input v-model="tenant.phone" placeholder="请输入联系电话" clearable maxlength="30" />
              </el-form-item>
            </el-col>

            <el-col :span="3">
              <el-form-item label="证件类型" :prop="`${index}.idType`" required>
                <el-select v-model="tenant.idType" placeholder="请选择证件类型" class="w-full">
                  <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="证件号码" :prop="`${index}.idNo`" required>
                <el-input v-model="tenant.idNo" placeholder="请输入证件号码" clearable maxlength="20" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="租客标签" :prop="`${index}.tags`">
                <el-select v-model="tenant.tags" placeholder="租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
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
                    <UploadImage v-model="tenant.idCardFrontList" :limit="1" :width="120" :height="72">
                      <!-- 使用自定义提示 -->
                      <template #tip="">
                        <div class="text-center font-bold text-sm">身份证国徽面</div>
                      </template>
                    </UploadImage>
                    <UploadImage v-model="tenant.idCardBackList" :limit="1" :width="120" :height="72">
                      <!-- 使用自定义提示 -->
                      <template #tip="">
                        <div class="text-center font-bold text-sm">身份证人像面</div>
                      </template>
                    </UploadImage>
                    <UploadImage v-model="tenant.idCardInHandList" :limit="1" :width="120" :height="72">
                      <!-- 使用自定义提示 -->
                      <template #tip="">
                        <div class="text-center font-bold text-sm">手持身份证照片</div>
                      </template>
                    </UploadImage>
                  </el-space>
                </div>
                <div>
                  <div class="mb-2">
                    <span class="font-bold">其他照片</span>
                  </div>
                  <UploadImage v-model="tenant.otherImageList" :limit="3" :width="120" :height="72">
                    <!-- 使用自定义提示 -->
                    <template #tip="">
                      <div class="font-bold text-sm">其他照片，最多可上传3张</div>
                    </template>
                  </UploadImage>
                </div>
              </el-space>
            </el-col>
          </el-row>
        </el-card>
      </div>
    </el-form>
    <el-row class="mt-4">
      <el-col :span="24" class="text-center">
        <el-button type="default" class="dashed-border w-md" @click="addMate">添加同住人</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from "vue";
  import type { FormInstance } from "element-plus";
  import { GENDER_OPTIONS, ID_TYPE_OPTIONS, TENANT_TYPE_OPTIONS } from "@/constants";
  import type { TenantMateVo } from "@/types";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import UploadImage from "@/components/upload/UploadImage.vue";

  const { tenantSourceOptions, dealChannelOptions, tenantTagOptions } = useTenant();

  const baseRules = {
    name: [{ required: true, message: "请输入姓名", trigger: "blur" }],
    phone: [{ required: true, message: "请输入联系电话", trigger: "blur" }],
    idType: [{ required: true, message: "请选择证件类型", trigger: "change" }],
    idNo: [{ required: true, message: "请输入证件号码", trigger: "blur" }]
  };
  // 动态生成校验规则
  const dynamicRules = computed(() => {
    const rules: any = {};
    formInlines.forEach((_, index) => {
      rules[index] = baseRules;
    });
    return rules;
  });

  interface TenantMateFormProps {
    formInline: {
      tenantMateList: TenantMateVo[];
    };
  }

  const props = defineProps<TenantMateFormProps>();

  // 表单引用
  const ruleFormRef = ref<FormInstance>();

  const defaultMateRow = {
    id: null,
    tenantId: null,
    name: "",
    gender: null,
    idType: null,
    idNo: "",
    phone: "",
    tags: [],
    remark: "",
    status: 1,
    idCardFrontList: [],
    idCardBackList: [],
    idCardInHandList: [],
    otherImageList: []
  };

  // 检查 props.formInline.tenantMateList 是否存在且不为空，否则提供一个默认的空数组
  const initialTenantMateList = props.formInline && props.formInline.tenantMateList.length > 0 ? [...props.formInline.tenantMateList] : [defaultMateRow];

  // 创建响应式对象
  // 表单数据
  const formInlines = reactive<TenantMateVo[]>(initialTenantMateList);

  // 常量选项
  const genderOptions = [...GENDER_OPTIONS];
  const idTypeOptions = ID_TYPE_OPTIONS;
  const tenantTypeOptions = TENANT_TYPE_OPTIONS;

  // 添加同住人
  const addMate = () => {
    formInlines.push(defaultMateRow);
  };

  // 删除同住人
  const removeMate = (i: number) => {
    formInlines.splice(i, 1);
  };

  // 暴露方法给父组件
  const getRef = () => {
    return ruleFormRef.value;
  };

  defineExpose({
    getRef,
    formInlines
  });
</script>

<style scoped lang="scss">
  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  /* 自定义样式 */
  .dashed-border {
    border: 1px dashed #e13c39 !important; /* 虚线边框，颜色可以根据需要调整 */
    border-radius: 0; /* 可选：调整边框圆角 */
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
