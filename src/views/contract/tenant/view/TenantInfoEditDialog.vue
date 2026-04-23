<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-position="top" class="tenant-form">
    <!-- 头部 -->
    <div class="tenant-form__header">
      <div class="tenant-form__header-left">
        <span class="tenant-form__icon-wrap">
          <el-icon :size="14"><User /></el-icon>
        </span>
        <div class="tenant-form__title-wrap">
          <span class="tenant-form__title">租客信息</span>
          <span class="tenant-form__subtitle">仅修改租客资料，不影响租约房间、租金与账单配置。</span>
        </div>
      </div>
      <el-segmented v-model="formData.tenantType" :options="tenantTypeOptions" />
    </div>

    <!-- ══ 个人租客 ══ -->
    <template v-if="formData.tenantType === 0">
      <div class="tenant-form__panel">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="姓名" prop="tenantPersonal.name">
              <el-input v-model="formData.tenantPersonal.name" placeholder="请输入姓名" clearable maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="性别" prop="tenantPersonal.gender">
              <el-segmented v-model="formData.tenantPersonal.gender" :options="genderOptions" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="联系电话" prop="tenantPersonal.phone">
              <el-input v-model="formData.tenantPersonal.phone" placeholder="请输入手机号" clearable maxlength="30" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="14">
            <el-form-item label="证件信息" prop="tenantPersonal.idNo">
              <el-input v-model="formData.tenantPersonal.idNo" placeholder="请输入证件号码" clearable maxlength="20">
                <template #prepend>
                  <el-select v-model="formData.tenantPersonal.idType" placeholder="证件类型" style="width: 100px">
                    <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="tenantPersonal.idType" class="hidden-form-item" />
          </el-col>
          <el-col :span="10">
            <el-form-item label="租客标签" prop="tenantPersonal.tags">
              <el-select v-model="formData.tenantPersonal.tags" placeholder="请选择租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
                <el-option v-for="item in tenantTagOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 证件照片上传区 -->
      <div class="upload-section">
        <div class="upload-section__header">
          <div class="upload-section__title">
            <span class="upload-section__icon">
              <el-icon :size="13"><Picture /></el-icon>
            </span>
            证件照片
          </div>
          <span class="upload-section__hint">JPG / PNG / GIF，支持拖拽排序，单张 ≤ 2MB</span>
        </div>
        <div class="upload-row upload-row--personal-primary">
          <div class="upload-cell">
            <div class="upload-cell__label">
              <el-icon :size="11"><CreditCard /></el-icon>
              身份证人像面
            </div>
            <div class="upload-cell__body">
              <UploadImage v-model="formData.tenantPersonal.idCardFrontList" :limit="1" :width="120" :height="76" :max-size-mb="2">
                <template #tip />
              </UploadImage>
            </div>
          </div>

          <div class="upload-cell">
            <div class="upload-cell__label">
              <el-icon :size="11"><Avatar /></el-icon>
              身份证国徽面
            </div>
            <div class="upload-cell__body">
              <UploadImage v-model="formData.tenantPersonal.idCardBackList" :limit="1" :width="120" :height="76" :max-size-mb="2">
                <template #tip />
              </UploadImage>
            </div>
          </div>

          <div class="upload-cell">
            <div class="upload-cell__label">
              <el-icon :size="11"><Postcard /></el-icon>
              手持身份证
            </div>
            <div class="upload-cell__body">
              <UploadImage v-model="formData.tenantPersonal.idCardInHandList" :limit="1" :width="120" :height="76" :max-size-mb="2">
                <template #tip />
              </UploadImage>
            </div>
          </div>
        </div>
        <div class="upload-row upload-row--single">
          <div class="upload-cell">
            <div class="upload-cell__label">
              <el-icon :size="11"><Files /></el-icon>
              其他照片
              <span class="upload-cell__badge">最多 3 张</span>
            </div>
            <div class="upload-cell__body upload-cell__body--multi">
              <UploadImage v-model="formData.tenantPersonal.otherImageList" :limit="3" :width="120" :height="76" :max-size-mb="2">
                <template #tip />
              </UploadImage>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ══ 企业租客 ══ -->
    <template v-else>
      <div class="tenant-form__panel">
        <el-row :gutter="12">
          <el-col :span="9">
            <el-form-item label="企业名称" prop="tenantCompany.companyName">
              <el-input v-model="formData.tenantCompany.companyName" placeholder="请输入企业名称" clearable maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="9">
            <el-form-item label="统一社会信用代码" prop="tenantCompany.uscc">
              <el-input v-model="formData.tenantCompany.uscc" placeholder="请输入 18 位信用代码" clearable maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="法定代表人" prop="tenantCompany.legalPerson">
              <el-input v-model="formData.tenantCompany.legalPerson" placeholder="请输入姓名" clearable maxlength="30" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="9">
            <el-form-item label="联系电话" prop="tenantCompany.contactPhone">
              <el-input v-model="formData.tenantCompany.contactPhone" placeholder="请输入手机号" clearable maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="15">
            <el-form-item label="租客标签" prop="tenantCompany.tags">
              <el-select v-model="formData.tenantCompany.tags" placeholder="请选择租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="3">
                <el-option v-for="item in tenantTagOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 营业执照上传区 -->
      <div class="upload-section">
        <div class="upload-section__header">
          <div class="upload-section__title">
            <span class="upload-section__icon">
              <el-icon :size="13"><Picture /></el-icon>
            </span>
            营业执照
          </div>
          <span class="upload-section__hint">JPG / PNG / GIF，支持拖拽排序，单张 ≤ 2MB</span>
        </div>
        <div class="upload-row upload-row--single">
          <div class="upload-cell">
            <div class="upload-cell__label">
              <el-icon :size="11"><Files /></el-icon>
              营业执照正本
            </div>
            <div class="upload-cell__body">
              <UploadImage v-model="formData.tenantCompany.businessLicenseUrls" :limit="1" :width="120" :height="76" :max-size-mb="2">
                <template #tip />
              </UploadImage>
            </div>
          </div>
        </div>
        <div class="upload-row upload-row--single">
          <div class="upload-cell">
            <div class="upload-cell__label">
              <el-icon :size="11"><Files /></el-icon>
              其他附件
              <span class="upload-cell__badge">最多 3 张</span>
            </div>
            <div class="upload-cell__body upload-cell__body--multi">
              <UploadImage v-model="formData.tenantCompany.otherImageList" :limit="3" :width="120" :height="76" :max-size-mb="2">
                <template #tip />
              </UploadImage>
            </div>
          </div>
        </div>
      </div>
    </template>
  </el-form>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import { getDictDataByDictCode } from "@/api/sys/dict";
  import UploadImage from "@/components/upload/UploadImage.vue";
  import { Avatar, CreditCard, Files, Picture, Postcard, User } from "@element-plus/icons-vue";
  import { GENDER_OPTIONS, ID_TYPE_OPTIONS, TENANT_TYPE_OPTIONS } from "@/constants";
  import type { LeaseDetailVo } from "@/types";

  const validatePhone = (_rule: any, value: any, callback: any) => {
    if (!value) callback(new Error("请输入联系电话"));
    else if (!/^1[3-9]\d{9}$/.test(value)) callback(new Error("请输入正确的手机号码"));
    else callback();
  };

  const validateIdNo = (_rule: any, value: any, callback: any) => {
    if (!value) callback(new Error("请输入证件号码"));
    else if (formData.tenantType === 0 && formData.tenantPersonal.idType === 0 && !/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(value)) {
      callback(new Error("请输入正确的身份证号码"));
    } else callback();
  };

  const props = defineProps<{ formInline: LeaseDetailVo }>();

  const formRef = ref<FormInstance>();
  const tenantTagOptions = ref<any[]>([]);
  const genderOptions = [...GENDER_OPTIONS];
  const idTypeOptions = ID_TYPE_OPTIONS;
  const tenantTypeOptions = TENANT_TYPE_OPTIONS;

  const formData = reactive<any>({
    leaseId: props.formInline.leaseId,
    tenantType: props.formInline.tenantType,
    tenantPersonal: {
      id: props.formInline.tenantPersonal?.id,
      companyId: props.formInline.tenantPersonal?.companyId,
      name: props.formInline.tenantPersonal?.name || "",
      gender: props.formInline.tenantPersonal?.gender,
      idType: props.formInline.tenantPersonal?.idType ?? 0,
      idNo: props.formInline.tenantPersonal?.idNo || "",
      phone: props.formInline.tenantPersonal?.phone || "",
      tags: props.formInline.tenantPersonal?.tags || [],
      remark: props.formInline.tenantPersonal?.remark || "",
      idCardBackList: props.formInline.tenantPersonal?.idCardBackList || [],
      idCardFrontList: props.formInline.tenantPersonal?.idCardFrontList || [],
      idCardInHandList: props.formInline.tenantPersonal?.idCardInHandList || [],
      otherImageList: props.formInline.tenantPersonal?.otherImageList || []
    },
    tenantCompany: {
      id: props.formInline.tenantCompany?.id,
      companyName: props.formInline.tenantCompany?.companyName || "",
      uscc: props.formInline.tenantCompany?.uscc || "",
      legalPerson: props.formInline.tenantCompany?.legalPerson || "",
      legalPersonIdType: props.formInline.tenantCompany?.legalPersonIdType ?? 0,
      legalPersonIdNo: props.formInline.tenantCompany?.legalPersonIdNo || "",
      contactName: props.formInline.tenantCompany?.contactName || "",
      contactPhone: props.formInline.tenantCompany?.contactPhone || "",
      registeredAddress: props.formInline.tenantCompany?.registeredAddress || "",
      businessLicenseUrls: props.formInline.tenantCompany?.businessLicenseList || [],
      otherImageList: props.formInline.tenantCompany?.otherImageList || [],
      tags: props.formInline.tenantCompany?.tags || [],
      remark: props.formInline.tenantCompany?.remark || ""
    }
  });

  const rules = computed<FormRules>(() =>
    formData.tenantType === 0
      ? {
          "tenantPersonal.name": [
            { required: true, message: "请输入租客姓名", trigger: "blur" },
            { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
          ],
          "tenantPersonal.idType": [{ required: true, message: "请选择证件类型", trigger: "change" }],
          "tenantPersonal.idNo": [{ required: true, validator: validateIdNo, trigger: "blur" }],
          "tenantPersonal.phone": [{ required: true, validator: validatePhone, trigger: "blur" }]
        }
      : {
          "tenantCompany.companyName": [
            { required: true, message: "请输入企业名称", trigger: "blur" },
            { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
          ],
          "tenantCompany.uscc": [{ required: true, message: "请输入统一社会信用代码", trigger: "blur" }],
          "tenantCompany.legalPerson": [{ required: true, message: "请输入法定代表人", trigger: "blur" }],
          "tenantCompany.contactPhone": [{ required: true, validator: validatePhone, trigger: "blur" }]
        }
  );

  const fetchTagOptions = async () => {
    const tagResp = await getDictDataByDictCode({ dictCode: "tenant_tags" });
    if (tagResp.code === 0) {
      tenantTagOptions.value = (tagResp.data || []).map((item: any) => ({
        label: item.name,
        value: item.name
      }));
    }
  };
  fetchTagOptions();

  const getRef = () => formRef.value;
  const getFormData = () => formData;
  defineExpose({ getRef, getFormData });
</script>

<style scoped lang="scss">
  .tenant-form {
    padding-bottom: 8px;
  }

  /* ── 头部 ── */
  .tenant-form__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 10px 0 10px;
  }

  .tenant-form__header-left {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .tenant-form__icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 7px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  .tenant-form__title-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tenant-form__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .tenant-form__subtitle {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .tenant-form__panel {
    padding: 14px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    background: var(--el-bg-color-page);
    margin-bottom: 10px;
  }

  .tenant-form__panel :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  /* ── 隐藏校验占位 ── */
  .hidden-form-item {
    margin: 0;
    :deep(.el-form-item__content) {
      min-height: 0;
    }
  }

  /* ══════════════════════════
   上传区外壳
══════════════════════════ */
  .upload-section {
    margin-top: 2px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    overflow: hidden;
    transition: box-shadow 0.2s;
    &:hover {
      box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
    }
  }

  /* 标题栏 */
  .upload-section__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .upload-section__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .upload-section__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  .upload-section__hint {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  /* ══════════════════════════
   核心：一行横排所有上传槽
══════════════════════════ */
  .upload-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
    padding: 14px 14px 0;
    gap: 12px;
  }

  .upload-row--single {
    grid-template-columns: 1fr;
    padding-top: 12px;
    padding-bottom: 14px;
  }

  /* 单个上传槽 */
  .upload-cell {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    min-width: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-blank);
  }

  /* 上传槽标签行 */
  .upload-cell__label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    height: 20px;
    flex-shrink: 0;
  }

  .upload-cell__badge {
    margin-left: 4px;
    padding: 0 5px;
    border-radius: 3px;
    font-size: 11px;
    line-height: 18px;
    background: var(--el-color-info-light-9);
    color: var(--el-text-color-placeholder);
  }

  /* 图片内容区 */
  .upload-cell__body {
    display: flex;
    align-items: flex-start;

    :deep(.el-upload__tip) {
      display: none;
    }

    /* 多图模式：让图片列表横向排列 */
    &--multi {
      :deep(.el-upload-list) {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      :deep(.el-upload-list__item) {
        margin: 0;
      }
    }
  }

  @media (max-width: 1200px) {
    .upload-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .upload-row--personal-primary {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .upload-row--single {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .tenant-form__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }

    .tenant-form__panel {
      padding: 10px;
    }

    .upload-section__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .upload-row {
      grid-template-columns: 1fr;
      padding: 12px 12px 0;
    }

    .upload-row--single {
      padding-bottom: 12px;
    }
  }
</style>
