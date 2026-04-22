<template>
  <div class="section-tenant-info">
    <el-form ref="ruleFormRef" :model="formInlines" :rules="dynamicRules" label-width="100px" label-position="top">
      <div v-for="(tenant, index) in formInlines" :key="index" class="mb-4">
        <el-card class="mb-4">
          <template #header>
            <div class="card-header">
              <div class="card-header-left">
                <div class="tenant-title">
                  <span class="tenant-label">同住人 {{ index + 1 }}</span>
                  <span v-if="tenant.name" class="tenant-name-tag">{{ tenant.name }}</span>
                </div>
              </div>
              <el-button size="small" type="danger" plain :icon="Delete" class="delete-btn" @click="removeMate(index)">删除</el-button>
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

            <el-col :span="8">
              <el-form-item label="证件信息" :prop="`${index}.idNo`" required>
                <el-input v-model="tenant.idNo" placeholder="请输入证件号码" clearable maxlength="20">
                  <template #prepend>
                    <el-select v-model="tenant.idType" placeholder="证件类型" style="width: 120px">
                      <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item :prop="`${index}.idType`" required class="hidden-form-item" />
            </el-col>
            <el-col :span="5">
              <el-form-item label="租客标签" :prop="`${index}.tags`">
                <el-select v-model="tenant.tags" placeholder="租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
                  <el-option v-for="item in tenantTagOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <div class="section-block">
            <!-- 证件照片上传 -->
            <div class="upload-section">
              <div class="upload-group">
                <div class="upload-group-title">
                  <el-icon><Picture /></el-icon>
                  证件照片
                </div>
                <div class="upload-items">
                  <div class="upload-item">
                    <UploadImage v-model="tenant.idCardFrontList" :limit="1" :width="120" :height="76">
                      <template #tip="">
                        <div class="upload-tip">
                          <el-icon><CreditCard /></el-icon>
                          身份证国徽面
                        </div>
                      </template>
                    </UploadImage>
                  </div>
                  <div class="upload-item">
                    <UploadImage v-model="tenant.idCardBackList" :limit="1" :width="120" :height="76">
                      <template #tip="">
                        <div class="upload-tip">
                          <el-icon><Avatar /></el-icon>
                          身份证人像面
                        </div>
                      </template>
                    </UploadImage>
                  </div>
                  <div class="upload-item">
                    <UploadImage v-model="tenant.idCardInHandList" :limit="1" :width="120" :height="76">
                      <template #tip="">
                        <div class="upload-tip">
                          <el-icon><Postcard /></el-icon>
                          手持身份证照片
                        </div>
                      </template>
                    </UploadImage>
                  </div>
                  <div class="upload-divider" />
                  <div class="upload-item">
                    <UploadImage v-model="tenant.otherImageList" :limit="3" :width="120" :height="76">
                      <template #tip="">
                        <div class="upload-tip">
                          <el-icon><Files /></el-icon>
                          其他照片（最多3张）
                        </div>
                      </template>
                    </UploadImage>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-form>
    <!-- 添加按钮 -->
    <div class="add-btn-wrapper">
      <el-button type="primary" plain class="add-mate-btn" :icon="Plus" @click="addMate">添加同住人</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from "vue";
  import type { FormInstance } from "element-plus";
  import { GENDER_OPTIONS, ID_TYPE_OPTIONS, TENANT_TYPE_OPTIONS } from "@/constants";
  import type { TenantMateVo } from "@/types";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import UploadImage from "@/components/upload/UploadImage.vue";
  import { User, UserFilled, Phone, Tickets, Picture, CreditCard, Avatar, Postcard, Files, Plus, Delete } from "@element-plus/icons-vue";

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
    idType: 0,
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

  .hidden-form-item {
    margin: 0;

    :deep(.el-form-item__content) {
      min-height: 0;
    }
  }

  /* ── 卡片头部 ── */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .tenant-badge {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--el-color-primary);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tenant-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tenant-label {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .tenant-name-tag {
    font-size: 12px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    padding: 2px 8px;
    border-radius: 20px;
    font-weight: 500;
  }

  .delete-btn {
    border-radius: 8px !important;
    font-size: 13px !important;
  }

  /* ── 照片上传区 ── */
  .upload-section {
    margin-top: 4px;
  }

  .upload-group {
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    padding: 16px;
  }

  .upload-group-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #555;
    margin-bottom: 14px;

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .upload-items {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px;
  }

  .upload-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .upload-divider {
    width: 1px;
    height: 80px;
    background: #e8e8e8;
    margin: 0 4px;
    align-self: center;
  }

  .upload-tip {
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: center;
    font-size: 12px;
    font-weight: 500;
    color: #666;
    margin-top: 6px;

    .el-icon {
      font-size: 13px;
      color: var(--el-color-primary);
    }
  }

  /* ── 添加按钮 ── */
  .add-btn-wrapper {
    display: flex;
    justify-content: center;
    padding: 4px 0 8px;
  }

  .add-mate-btn {
    width: 220px;
    height: 40px;
    border-radius: 10px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    border-style: dashed !important;
    letter-spacing: 0.5px;
    transition: all 0.25s ease !important;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.25);
    }
  }
</style>
