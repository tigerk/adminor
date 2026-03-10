<template>
  <div class="digital-sign">
    <div class="digital-sign__header">
      <div class="digital-sign__title">电子签章</div>
      <div class="digital-sign__sub">由“e签宝”和“契约锁”提供法律认证</div>
    </div>

    <el-row :gutter="16" class="digital-sign__grid">
      <el-col v-for="item in signList" :key="item.id" :span="8">
        <div class="sign-card">
          <div class="sign-card__badge">已认证</div>
          <div class="sign-card__title">
            {{ item.signType === 1 ? "企业签章" : "个人签章" }}
          </div>

          <div class="sign-card__body" v-if="item.signType === 1">
            <div class="sign-card__row">公司名称：{{ item.name || "-" }}</div>
            <div class="sign-card__row">统一社会信用代码：{{ item.uscc || "-" }}</div>
            <div class="sign-card__row">法人姓名：{{ item.legalPerson || "-" }}</div>
            <div class="sign-card__row">法人身份证信息：{{ formatIdInfo(item.legalPersonIdType, item.legalPersonIdNo) }}</div>
          </div>

          <div class="sign-card__body" v-else>
            <div class="sign-card__row">经办人姓名：{{ item.operatorName || "-" }}</div>
            <div class="sign-card__row">经办人联系电话：{{ item.operatorPhone || "-" }}</div>
            <div class="sign-card__row">经办人身份信息：{{ formatIdInfo(item.operatorIdType, item.operatorIdNo) }}</div>
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="sign-card sign-card--add" @click="openDialog">
          <div class="sign-card__add-icon">+</div>
          <div class="sign-card__add-text">添加电子签章</div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" title="添加电子签章" width="720px" align-center :lock-scroll="true">
      <el-form ref="formRef" :model="form" label-width="120px" class="sign-form">
        <el-form-item label="签章类型" required>
          <el-radio-group v-model="form.signType" @change="handleSignTypeChange">
            <el-radio-button :value="1">企业签章</el-radio-button>
            <el-radio-button :value="2">个人签章</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-row :gutter="16" v-if="form.signType === 1">
          <el-col :span="12">
            <el-form-item label="公司名称" required>
              <el-input v-model="form.name" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统一社会信用代码" required>
              <el-input v-model="form.uscc" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法人姓名" required>
              <el-input v-model="form.legalPerson" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法人证件号" required>
              <el-input v-model="form.legalPersonIdNo" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法人证件类型">
              <el-select v-model="form.legalPersonIdType" placeholder="请选择">
                <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="String(item.value)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" v-else>
          <el-col :span="12">
            <el-form-item label="经办人" required>
              <el-select v-model="form.operatorId" placeholder="请选择" @change="handleOperatorChange" filterable>
                <el-option v-for="item in userOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经办人证件类型">
              <el-input v-model="form.operatorIdTypeLabel" placeholder="自动读取" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经办人证件号">
              <el-input v-model="form.operatorIdNo" placeholder="自动读取" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.operatorPhone" placeholder="自动读取" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="电子印章">
          <UploadImage v-model="form.sealUrls" :limit="1" :width="120" :height="72" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from "vue";
  import { message } from "@/utils/message";
  import { ID_TYPE_OPTIONS } from "@/constants";
  import UploadImage from "@/components/Business/UploadImage.vue";
  import { getCompanyUserOptions, getCompanyUserDetail } from "@/api/company";
  import { createCompanyDigitalSign, getCompanyDigitalSignList } from "@/api/contract/digitalSign";
  import type { CompanyDigitalSignCreateDto, CompanyDigitalSignVo, IdNameVo } from "@/types/generated";

  const idTypeOptions = ID_TYPE_OPTIONS;
  const signList = ref<CompanyDigitalSignVo[]>([]);
  const dialogVisible = ref(false);
  const saving = ref(false);
  const userOptions = ref<IdNameVo[]>([]);

  const form = reactive({
    signType: 1,
    name: "",
    uscc: "",
    legalPerson: "",
    legalPersonIdType: "0",
    legalPersonIdNo: "",
    operatorId: undefined as undefined | string,
    operatorIdTypeLabel: "",
    operatorIdNo: "",
    operatorPhone: "",
    sealUrls: [] as string[]
  });

  const loadUserOptions = async () => {
    const resp = await getCompanyUserOptions();
    if (resp.code === 0) {
      userOptions.value = resp.data || [];
    }
  };

  const fetchList = async () => {
    const resp = await getCompanyDigitalSignList({});
    if (resp.code === 0) {
      signList.value = resp.data || [];
    }
  };

  const openDialog = async () => {
    resetForm();
    await loadUserOptions();
    dialogVisible.value = true;
  };

  const resetForm = () => {
    form.signType = 1;
    form.name = "";
    form.uscc = "";
    form.legalPerson = "";
    form.legalPersonIdType = "0";
    form.legalPersonIdNo = "";
    form.operatorId = undefined;
    form.operatorIdTypeLabel = "";
    form.operatorIdNo = "";
    form.operatorPhone = "";
    form.sealUrls = [];
  };

  const handleOperatorChange = async (userId: string) => {
    if (!userId) return;
    const resp = await getCompanyUserDetail(userId);
    if (resp.code === 0 && resp.data) {
      const idTypeLabel = idTypeOptions.find(item => item.value === resp.data.idType)?.label || "";
      form.operatorIdTypeLabel = idTypeLabel;
      form.operatorIdNo = resp.data.idNo || "";
      form.operatorPhone = resp.data.phone || "";
    }
  };

  const handleSignTypeChange = () => {
    if (form.signType === 1) {
      form.operatorId = undefined;
      form.operatorIdTypeLabel = "";
      form.operatorIdNo = "";
      form.operatorPhone = "";
    } else {
      form.name = "";
      form.uscc = "";
      form.legalPerson = "";
      form.legalPersonIdType = "0";
      form.legalPersonIdNo = "";
    }
  };

  const validateForm = () => {
    if (form.signType === 1) {
      if (!form.name) return "请输入公司名称";
      if (!form.uscc) return "请输入统一社会信用代码";
      if (!form.legalPerson) return "请输入法人姓名";
      if (!form.legalPersonIdNo) return "请输入法人证件号";
    }

    if (form.signType === 2 && !form.operatorId) {
      return "请选择经办人";
    }

    return "";
  };

  const handleSave = async () => {
    const errorMsg = validateForm();
    if (errorMsg) {
      message(errorMsg, { type: "warning" });
      return;
    }

    saving.value = true;
    const payload: CompanyDigitalSignCreateDto = {
      signType: form.signType,
      sealUrls: form.sealUrls
    };

    if (form.signType === 1) {
      payload.name = form.name;
      payload.uscc = form.uscc;
      payload.legalPerson = form.legalPerson;
      payload.legalPersonIdType = form.legalPersonIdType;
      payload.legalPersonIdNo = form.legalPersonIdNo;
    } else {
      payload.operatorId = form.operatorId;
    }

    const resp = await createCompanyDigitalSign(payload);
    saving.value = false;
    if (resp.code === 0) {
      message("新增电子签章成功", { type: "success" });
      dialogVisible.value = false;
      fetchList();
    } else {
      message(resp.message || "保存失败", { type: "error" });
    }
  };

  const formatIdInfo = (idType: any, idNo: any) => {
    if (!idNo) return "-";
    const label = idTypeOptions.find(item => String(item.value) === String(idType))?.label || "证件";
    return `${label}-${idNo}`;
  };

  onMounted(() => {
    fetchList();
  });
</script>

<style lang="scss" scoped>
  .digital-sign {
    padding: 16px 0 24px;

    &__header {
      margin: 8px 0 16px;
    }

    &__title {
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 6px;
    }

    &__sub {
      color: #f59e0b;
      font-size: 12px;
    }

    &__grid {
      padding-bottom: 12px;
    }
  }

  .sign-card {
    position: relative;
    min-height: 160px;
    padding: 16px 18px;
    background: #f3f6ff;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 14px rgba(30, 66, 151, 0.06);

    &__badge {
      position: absolute;
      top: 0;
      right: 10px;
      writing-mode: vertical-rl;
      text-align: center;
      background: #3b82f6;
      color: #fff;
      padding: 8px 6px;
      border-bottom-left-radius: 8px;
      border-bottom-right-radius: 8px;
      font-size: 12px;
    }

    &__title {
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 10px;
    }

    &__row {
      font-size: 13px;
      color: #4b5563;
      margin-bottom: 6px;
    }

    &--add {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 1px dashed #cfd8ff;
      background: #f7f9ff;
    }

    &__add-icon {
      width: 44px;
      height: 44px;
      line-height: 44px;
      text-align: center;
      border-radius: 50%;
      border: 1px solid #cfd8ff;
      color: #4f6ef7;
      font-size: 22px;
      margin-bottom: 8px;
    }

    &__add-text {
      color: #4f6ef7;
      font-size: 14px;
    }
  }

  .sign-form {
    padding-right: 12px;
  }
</style>
