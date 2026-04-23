<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-position="top" class="tenant-info-edit-form">
    <div class="tenant-info-edit-form__head">
      <div class="tenant-info-edit-form__title">租客信息</div>
      <el-segmented v-model="formData.tenantType" :options="tenantTypeOptions" />
    </div>

    <template v-if="formData.tenantType === 0">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="姓名" prop="tenantPersonal.name">
            <el-input v-model="formData.tenantPersonal.name" placeholder="请输入租客姓名" clearable maxlength="20" />
          </el-form-item>
        </el-col>
        <el-col :span="3">
          <el-form-item label="性别" prop="tenantPersonal.gender">
            <el-segmented v-model="formData.tenantPersonal.gender" :options="genderOptions" />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="联系电话" prop="tenantPersonal.phone">
            <el-input v-model="formData.tenantPersonal.phone" placeholder="请输入联系电话" clearable maxlength="30" />
          </el-form-item>
        </el-col>
        <el-col :span="10">
          <el-form-item label="证件信息" prop="tenantPersonal.idNo">
            <el-input v-model="formData.tenantPersonal.idNo" placeholder="请输入证件号码" clearable maxlength="20">
              <template #prepend>
                <el-select v-model="formData.tenantPersonal.idType" placeholder="证件类型" style="width: 120px">
                  <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="tenantPersonal.idType" class="hidden-form-item" />
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="租客标签" prop="tenantPersonal.tags">
            <el-select v-model="formData.tenantPersonal.tags" placeholder="租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
              <el-option v-for="item in tenantTagOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <div class="upload-group">
        <div class="upload-group-title">
          <el-icon><Picture /></el-icon>
          证件照片
        </div>
        <div class="upload-items">
          <div class="upload-item">
            <UploadImage v-model="formData.tenantPersonal.idCardFrontList" :limit="1" :width="120" :height="76">
              <template #tip="">
                <div class="upload-tip">
                  <el-icon><CreditCard /></el-icon>
                  身份证人像面
                </div>
              </template>
            </UploadImage>
          </div>
          <div class="upload-item">
            <UploadImage v-model="formData.tenantPersonal.idCardBackList" :limit="1" :width="120" :height="76">
              <template #tip="">
                <div class="upload-tip">
                  <el-icon><Avatar /></el-icon>
                  身份证国徽面
                </div>
              </template>
            </UploadImage>
          </div>
          <div class="upload-item">
            <UploadImage v-model="formData.tenantPersonal.idCardInHandList" :limit="1" :width="120" :height="76">
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
            <UploadImage v-model="formData.tenantPersonal.otherImageList" :limit="3" :width="120" :height="76">
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
    </template>

    <template v-else>
      <el-row :gutter="20">
        <el-col :span="7">
          <el-form-item label="企业名称" prop="tenantCompany.companyName">
            <el-input v-model="formData.tenantCompany.companyName" placeholder="请输入企业名称" clearable maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="统一社会信用代码" prop="tenantCompany.uscc">
            <el-input v-model="formData.tenantCompany.uscc" placeholder="请输入统一社会信用代码" clearable maxlength="20" />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="法定代表人" prop="tenantCompany.legalPerson">
            <el-input v-model="formData.tenantCompany.legalPerson" placeholder="请输入法定代表人" clearable maxlength="30" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="联系电话" prop="tenantCompany.contactPhone">
            <el-input v-model="formData.tenantCompany.contactPhone" placeholder="请输入联系电话" clearable maxlength="30" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="租客标签" prop="tenantCompany.tags">
            <el-select v-model="formData.tenantCompany.tags" placeholder="租客标签" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
              <el-option v-for="item in tenantTagOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <div class="upload-group">
        <div class="upload-group-title">
          <el-icon><Picture /></el-icon>
          营业执照
        </div>
        <div class="upload-items">
          <div class="upload-item">
            <UploadImage v-model="formData.tenantCompany.businessLicenseUrls" :limit="1" :width="120" :height="76">
              <template #tip="">
                <div class="upload-tip">
                  <el-icon><Files /></el-icon>
                  营业执照
                </div>
              </template>
            </UploadImage>
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
  import { Avatar, CreditCard, Files, Picture, Postcard } from "@element-plus/icons-vue";
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
      tenantTagOptions.value = (tagResp.data || []).map(item => ({
        label: item.name,
        value: item.name
      }));
    }
  };
  fetchTagOptions();

  const getRef = () => formRef.value;
  const getFormData = () => formData;

  defineExpose({
    getRef,
    getFormData
  });
</script>

<style scoped lang="scss">
  .tenant-info-edit-form {
    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    &__title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .hidden-form-item {
    margin: 0;

    :deep(.el-form-item__content) {
      min-height: 0;
    }
  }

  .upload-group {
    margin-top: 8px;
    padding: 16px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .upload-group-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .upload-items {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
  }

  .upload-divider {
    width: 1px;
    height: 76px;
    background: var(--el-border-color-lighter);
  }

  .upload-tip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
