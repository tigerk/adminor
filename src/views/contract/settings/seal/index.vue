<template>
  <div class="seal">
    <!-- 头部区域 -->
    <div class="seal__header">
      <div class="flex items-center gap-3 mb-1">
        <div class="seal__icon-wrap">
          <el-icon :size="20" color="#4f6ef7"><Stamp /></el-icon>
        </div>
        <span class="seal__title">电子签章管理</span>
      </div>
      <div class="seal__sub">
        <el-icon :size="13" class="mr-1" color="#f59e0b"><WarningFilled /></el-icon>
        由「法大大」提供法律认证，签章信息将用于合同签署
      </div>
    </div>

    <!-- 签章卡片列表 -->
    <el-row :gutter="16" class="seal__grid">
      <el-col v-for="item in signList" :key="item.id" :xs="24" :sm="12" :lg="8" class="mb-4">
        <div
          class="sign-card"
          :class="[item.source === 2 ? (item.sealType === 1 ? 'sign-card--fadada-enterprise' : 'sign-card--fadada-personal') : 'sign-card--enterprise-seal']"
        >
          <!-- 顶部类型标识 -->
          <div class="sign-card__header">
            <div class="sign-card__type-tag">
              <el-icon :size="13">
                <OfficeBuilding v-if="item.sealType === 1 || item.source !== 2" />
                <User v-else />
              </el-icon>
              <span>{{ getCardTypeLabel(item) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="sign-card__provider-badge" :class="item.source === 2 ? 'badge--fadada' : 'badge--seal'">
                {{ item.source === 2 ? "法大大" : "企业章" }}
              </span>
              <el-tag type="success" size="small" effect="plain" class="sign-card__cert-tag">
                <el-icon :size="11" class="mr-0.5"><CircleCheckFilled /></el-icon>
                已认证
              </el-tag>
            </div>
          </div>

          <!-- 法大大·企业 -->
          <div v-if="item.source === 2 && item.sealType === 1" class="sign-card__body">
            <div class="sign-card__name">{{ item.companyName || "-" }}</div>
            <div class="sign-card__info-list">
              <div class="sign-card__info-row">
                <span class="sign-card__info-label">信用代码</span>
                <span class="sign-card__info-value">{{ item.companyUscc || "-" }}</span>
              </div>
              <div class="sign-card__info-row">
                <span class="sign-card__info-label">法人姓名</span>
                <span class="sign-card__info-value">{{ item.legalPerson || "-" }}</span>
              </div>
              <div class="sign-card__info-row">
                <span class="sign-card__info-label">法人证件</span>
                <span class="sign-card__info-value">{{ formatIdInfo(item.legalPersonIdType, item.legalPersonIdNo) }}</span>
              </div>
              <div class="sign-card__info-row">
                <span class="sign-card__info-label">经办人</span>
                <span class="sign-card__info-value">{{ item.operatorName || "-" }}</span>
              </div>
            </div>
          </div>

          <!-- 法大大·个人 -->
          <div v-else-if="item.source === 2 && item.sealType === 2" class="sign-card__body">
            <div class="sign-card__name">{{ item.operatorName || "-" }}</div>
            <div class="sign-card__info-list">
              <div class="sign-card__info-row">
                <span class="sign-card__info-label">联系电话</span>
                <span class="sign-card__info-value">{{ item.operatorPhone || "-" }}</span>
              </div>
              <div class="sign-card__info-row">
                <span class="sign-card__info-label">证件信息</span>
                <span class="sign-card__info-value">{{ formatIdInfo(item.operatorIdType, item.operatorIdNo) }}</span>
              </div>
            </div>
          </div>

          <!-- 企业章 -->
          <div v-else class="sign-card__body">
            <div class="sign-card__name">{{ item.companyName || "-" }}</div>
            <div class="sign-card__info-list">
              <div class="sign-card__info-row">
                <span class="sign-card__info-label">信用代码</span>
                <span class="sign-card__info-value">{{ item.companyUscc || "-" }}</span>
              </div>
              <div class="sign-card__info-row">
                <span class="sign-card__info-label">法人姓名</span>
                <span class="sign-card__info-value">{{ item.legalPerson || "-" }}</span>
              </div>
              <div class="sign-card__info-row">
                <span class="sign-card__info-label">法人证件</span>
                <span class="sign-card__info-value">{{ formatIdInfo(item.legalPersonIdType, item.legalPersonIdNo) }}</span>
              </div>
            </div>
          </div>

          <div class="sign-card__deco" />
        </div>
      </el-col>

      <!-- 添加卡片（优化版） -->
      <el-col :xs="24" :sm="12" :lg="8" class="mb-4">
        <div class="sign-card sign-card--add" @click="openDialog">
          <div class="add-card__bg-ring add-card__bg-ring--1" />
          <div class="add-card__bg-ring add-card__bg-ring--2" />
          <div class="sign-card__add-inner">
            <div class="sign-card__add-icon">
              <el-icon :size="24"><Plus /></el-icon>
            </div>
            <div class="sign-card__add-title">添加电子签章</div>
            <div class="sign-card__add-sub">
              <span class="add-tag">法大大</span>
              <span class="add-tag-sep">·</span>
              <span class="add-tag">企业章</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 新增对话框 -->
    <el-dialog v-model="dialogVisible" title="添加电子签章" width="660px" align-center :lock-scroll="true" destroy-on-close class="sign-dialog">
      <el-form ref="formRef" :model="form" label-width="110px" class="sign-form">
        <!-- Step 1：选择签章来源 -->
        <el-form-item label="签章来源" required>
          <div class="provider-select-group">
            <div class="provider-card" :class="{ 'provider-card--active': form.provider === 'fadada' }" @click="handleProviderChange('fadada')">
              <div class="provider-card__logo provider-card__logo--fadada">法大大</div>
              <div class="provider-card__desc">电子合同法律认证</div>
              <div class="provider-card__check">
                <el-icon><Select /></el-icon>
              </div>
            </div>
            <div class="provider-card" :class="{ 'provider-card--active': form.provider === 'enterprise-seal' }" @click="handleProviderChange('enterprise-seal')">
              <div class="provider-card__logo provider-card__logo--seal">
                <el-icon :size="18"><Stamp /></el-icon>
                企业章
              </div>
              <div class="provider-card__desc">上传企业实体印章</div>
              <div class="provider-card__check">
                <el-icon><Select /></el-icon>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-divider class="my-3" />

        <!-- 法大大 -->
        <template v-if="form.provider === 'fadada'">
          <el-form-item label="印章类型" required>
            <el-radio-group v-model="form.sealType" @change="handleSignTypeChange" class="sign-type-group">
              <el-radio :value="1" border>
                <div class="flex items-center gap-1.5">
                  <el-icon><OfficeBuilding /></el-icon>
                  企业
                </div>
              </el-radio>
              <el-radio :value="2" border>
                <div class="flex items-center gap-1.5">
                  <el-icon><User /></el-icon>
                  个人
                </div>
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-divider class="my-3" />

          <!-- 法大大·企业 -->
          <template v-if="form.sealType === 1">
            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="公司名称" required>
                  <el-input v-model="form.companyName" placeholder="请输入公司全称" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="社会信用代码" required>
                  <el-input v-model="form.companyUscc" placeholder="请输入统一社会信用代码" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法人姓名" required>
                  <el-input v-model="form.legalPerson" placeholder="请输入" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法人证件类型">
                  <el-select v-model="form.legalPersonIdType" placeholder="请选择" class="w-full">
                    <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="String(item.value)" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法人证件号" required>
                  <el-input v-model="form.legalPersonIdNo" placeholder="请输入" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="经办人" required>
                  <el-select v-model="form.operatorId" placeholder="请选择经办人" @change="handleOperatorChange" filterable class="w-full">
                    <el-option v-for="item in userOptions" :key="item.id" :label="item.name" :value="item.id" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="no-seal-tip">
              <el-icon :size="13" color="#10b981"><CircleCheckFilled /></el-icon>
              <span>法大大电子签章无需上传印章图片，系统将自动生成</span>
            </div>
          </template>

          <!-- 法大大·个人 -->
          <template v-else>
            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="经办人" required>
                  <el-select v-model="form.operatorId" placeholder="请选择经办人" @change="handleOperatorChange" filterable class="w-full">
                    <el-option v-for="item in userOptions" :key="item.id" :label="item.name" :value="item.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="证件类型">
                  <el-input v-model="form.operatorIdTypeLabel" placeholder="自动读取" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="证件号码">
                  <el-input v-model="form.operatorIdNo" placeholder="自动读取" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系电话">
                  <el-input v-model="form.operatorPhone" placeholder="自动读取" disabled />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="no-seal-tip">
              <el-icon :size="13" color="#10b981"><CircleCheckFilled /></el-icon>
              <span>个人签章选择经办人后即可完成，系统将自动关联身份信息</span>
            </div>
          </template>
        </template>

        <!-- 企业章 -->
        <template v-else-if="form.provider === 'enterprise-seal'">
          <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="公司名称" required>
                  <el-input v-model="form.companyName" placeholder="请输入公司全称" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="社会信用代码" required>
                  <el-input v-model="form.companyUscc" placeholder="请输入统一社会信用代码" />
                </el-form-item>
              </el-col>
            <el-col :span="12">
              <el-form-item label="法人姓名" required>
                <el-input v-model="form.legalPerson" placeholder="请输入" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="法人证件类型">
                <el-select v-model="form.legalPersonIdType" placeholder="请选择" class="w-full">
                  <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="String(item.value)" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="法人证件号" required>
                <el-input v-model="form.legalPersonIdNo" placeholder="请输入" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider class="my-3" />

          <el-form-item label="电子印章" required>
            <div class="seal-upload-area">
              <UploadImage v-model="form.sealUrls" :limit="1" :width="120" :height="72" />
              <p class="text-xs text-gray-400 mt-2">建议上传透明背景的印章图片，支持 PNG 格式，尺寸建议 300×300px</p>
            </div>
          </el-form-item>
        </template>

        <!-- 未选择占位 -->
        <template v-else>
          <div class="provider-placeholder">
            <el-icon :size="32" color="#d0d5e8"><InfoFilled /></el-icon>
            <p>请先选择签章来源</p>
          </div>
        </template>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="saving" :disabled="!form.provider" @click="handleSave">
            <el-icon class="mr-1"><Check /></el-icon>
            保 存
          </el-button>
        </div>
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
  import { createCompanySeal, getCompanySealList } from "@/api/contract/companySeal";
  import type { CompanySealCreateDto, CompanySealVo, IdNameVo } from "@/types/generated";
  import { Stamp, WarningFilled, OfficeBuilding, User, CircleCheckFilled, Plus, Check, Select, InfoFilled } from "@element-plus/icons-vue";

  const idTypeOptions = ID_TYPE_OPTIONS;
  const signList = ref<CompanySealVo[]>([]);
  const dialogVisible = ref(false);
  const saving = ref(false);
  const userOptions = ref<IdNameVo[]>([]);

  const form = reactive({
    provider: "" as "fadada" | "enterprise-seal" | "",
    sealType: 1,
    source: 1,
    companyName: "",
    companyUscc: "",
    legalPerson: "",
    legalPersonIdType: "0",
    legalPersonIdNo: "",
    operatorId: undefined as undefined | string,
    operatorIdTypeLabel: "",
    operatorIdNo: "",
    operatorPhone: "",
    status: 1,
    sealUrls: [] as string[]
  });

  function getCardTypeLabel(item: CompanySealVo) {
    if (item.source === 2) return item.sealType === 1 ? "法大大·企业" : "法大大·个人";
    return "企业章";
  }

  const loadUserOptions = async () => {
    const resp = await getCompanyUserOptions();
    if (resp.code === 0) userOptions.value = resp.data || [];
  };

  const fetchList = async () => {
    const resp = await getCompanySealList({});
    if (resp.code === 0) signList.value = resp.data || [];
  };

  const openDialog = async () => {
    resetForm();
    await loadUserOptions();
    dialogVisible.value = true;
  };

  const resetForm = () => {
    Object.assign(form, {
      provider: "",
      sealType: 1,
      source: 1,
      companyName: "",
      companyUscc: "",
      legalPerson: "",
      legalPersonIdType: "0",
      legalPersonIdNo: "",
      operatorId: undefined,
      operatorIdTypeLabel: "",
      operatorIdNo: "",
      operatorPhone: "",
      status: 1,
      sealUrls: []
    });
  };

  const handleProviderChange = (provider: "fadada" | "enterprise-seal") => {
    form.provider = provider;
    form.sealType = 1;
    form.source = provider === "fadada" ? 2 : 1;
    form.status = 1;
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
      form.operatorIdTypeLabel = idTypeOptions.find(item => item.value === resp.data.idType)?.label || "";
      form.operatorIdNo = resp.data.idNo || "";
      form.operatorPhone = resp.data.phone || "";
    }
  };

  const handleSignTypeChange = () => {
    form.operatorId = undefined;
    form.operatorIdTypeLabel = "";
    form.operatorIdNo = "";
    form.operatorPhone = "";
  };

  const validateForm = (): string => {
    if (!form.provider) return "请选择签章来源";
    if (form.provider === "fadada") {
      if (form.sealType === 1) {
        if (!form.companyName) return "请输入公司名称";
        if (!form.companyUscc) return "请输入统一社会信用代码";
        if (!form.legalPerson) return "请输入法人姓名";
        if (!form.legalPersonIdNo) return "请输入法人证件号";
        if (!form.operatorId) return "请选择经办人";
      } else {
        if (!form.operatorId) return "请选择经办人";
      }
    }
    if (form.provider === "enterprise-seal") {
      if (!form.companyName) return "请输入公司名称";
      if (!form.companyUscc) return "请输入统一社会信用代码";
      if (!form.legalPerson) return "请输入法人姓名";
      if (!form.legalPersonIdNo) return "请输入法人证件号";
      if (!form.sealUrls || form.sealUrls.length === 0) return "请上传电子印章";
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

    const payload: CompanySealCreateDto = {
      sealType: form.provider === "fadada" ? form.sealType : 1,
      source: form.source,
      status: form.status,
      sealUrls: form.provider === "enterprise-seal" ? form.sealUrls : []
    };

    if (form.provider === "fadada" && form.sealType === 1) {
      Object.assign(payload, {
        companyName: form.companyName,
        companyUscc: form.companyUscc,
        legalPerson: form.legalPerson,
        legalPersonIdType: form.legalPersonIdType,
        legalPersonIdNo: form.legalPersonIdNo,
        operatorId: form.operatorId
      });
    } else if (form.provider === "fadada" && form.sealType === 2) {
      payload.operatorId = form.operatorId;
    } else if (form.provider === "enterprise-seal") {
      Object.assign(payload, {
        companyName: form.companyName,
        companyUscc: form.companyUscc,
        legalPerson: form.legalPerson,
        legalPersonIdType: form.legalPersonIdType,
        legalPersonIdNo: form.legalPersonIdNo
      });
    }

    const resp = await createCompanySeal(payload);
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
    return `${label} · ${idNo}`;
  };

  onMounted(() => {
    fetchList();
  });
</script>

<style lang="scss" scoped>
  .seal {
    padding: 20px 0 28px;

    &__header {
      margin-bottom: 20px;
    }

    &__icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #eef1ff 0%, #dde4ff 100%);
    }

    &__title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__sub {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #b45309;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 6px 12px;
      margin-top: 10px;
      width: fit-content;
    }

    &__grid {
      margin-top: 4px;
    }
  }

  /* ===== 签章卡片通用 ===== */
  .sign-card {
    position: relative;
    min-height: 170px;
    padding: 18px 20px 20px;
    border-radius: 12px;
    overflow: hidden;
    transition:
      box-shadow 0.2s ease,
      transform 0.2s ease;

    &:hover:not(.sign-card--add) {
      transform: translateY(-2px);
    }

    /* 法大大·企业 */
    &--fadada-enterprise {
      background: linear-gradient(145deg, #f0f4ff 0%, #e8eeff 100%);
      border: 1px solid #d4dcff;
      box-shadow: 0 2px 12px rgba(79, 110, 247, 0.08);
      &:hover {
        box-shadow: 0 6px 20px rgba(79, 110, 247, 0.14);
      }
      .sign-card__type-tag {
        background: rgba(79, 110, 247, 0.1);
        color: #4f6ef7;
      }
    }

    /* 法大大·个人 */
    &--fadada-personal {
      background: linear-gradient(145deg, #f0faf5 0%, #e6f7ee 100%);
      border: 1px solid #c6e8d4;
      box-shadow: 0 2px 12px rgba(16, 185, 129, 0.07);
      &:hover {
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.13);
      }
      .sign-card__type-tag {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
      }
    }

    /* 企业章 */
    &--enterprise-seal {
      background: linear-gradient(145deg, #fff8f0 0%, #fff0e6 100%);
      border: 1px solid #ffd6b0;
      box-shadow: 0 2px 12px rgba(234, 88, 12, 0.07);
      &:hover {
        box-shadow: 0 6px 20px rgba(234, 88, 12, 0.13);
      }
      .sign-card__type-tag {
        background: rgba(234, 88, 12, 0.1);
        color: #ea580c;
      }
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    &__type-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 500;
      padding: 3px 10px;
      border-radius: 20px;
    }

    &__provider-badge {
      font-size: 10px;
      font-weight: 500;
      padding: 2px 7px;
      border-radius: 4px;

      &.badge--fadada {
        background: #eef1ff;
        color: #4f6ef7;
        border: 1px solid #d4dcff;
      }
      &.badge--seal {
        background: #fff4ec;
        color: #ea580c;
        border: 1px solid #ffd6b0;
      }
    }

    &__cert-tag {
      font-size: 11px;
    }

    &__name {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__info-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    &__info-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-size: 12.5px;
    }

    &__info-label {
      flex-shrink: 0;
      color: var(--el-text-color-placeholder);
      min-width: 52px;
    }

    &__info-value {
      color: var(--el-text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__deco {
      position: absolute;
      bottom: -20px;
      right: -20px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.45);
      pointer-events: none;
    }

    /* ===== 添加卡片 ===== */
    &--add {
      min-height: 170px;
      border: 1.5px dashed #c7d2fe;
      background: linear-gradient(145deg, #fafbff 0%, #f5f7ff 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition:
        border-color 0.22s,
        background 0.22s,
        transform 0.22s,
        box-shadow 0.22s;

      &:hover {
        border-color: #4f6ef7;
        background: linear-gradient(145deg, #f0f4ff 0%, #eaefff 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(79, 110, 247, 0.12);

        .sign-card__add-icon {
          background: #4f6ef7;
          transform: scale(1.08) rotate(90deg);
          box-shadow: 0 4px 16px rgba(79, 110, 247, 0.35);
          color: #fff;
        }

        .sign-card__add-title {
          color: #3d5ce0;
        }

        .add-card__bg-ring--1 {
          transform: translate(-50%, -50%) scale(1.15);
          opacity: 0.12;
        }
        .add-card__bg-ring--2 {
          transform: translate(-50%, -50%) scale(1.1);
          opacity: 0.08;
        }
      }
    }

    &__add-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    &__add-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #eef1ff;
      color: #4f6ef7;
      transition:
        background 0.22s,
        transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.22s,
        color 0.22s;
    }

    &__add-title {
      font-size: 14px;
      font-weight: 600;
      color: #4f6ef7;
      transition: color 0.2s;
    }

    &__add-sub {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  /* 背景装饰圈 */
  .add-card__bg-ring {
    position: absolute;
    border-radius: 50%;
    border: 1.5px solid #4f6ef7;
    opacity: 0.06;
    pointer-events: none;
    transition:
      transform 0.4s ease,
      opacity 0.4s ease;

    &--1 {
      width: 120px;
      height: 120px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    &--2 {
      width: 190px;
      height: 190px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .add-tag {
    font-size: 11px;
    color: #6b7280;
    background: rgba(107, 114, 128, 0.08);
    border-radius: 4px;
    padding: 1px 6px;
  }

  .add-tag-sep {
    font-size: 11px;
    color: #d1d5db;
  }

  /* ===== 来源选择卡片 ===== */
  .provider-select-group {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .provider-card {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 16px 12px 14px;
    border: 1.5px solid var(--el-border-color);
    border-radius: 10px;
    cursor: pointer;
    background: var(--el-fill-color-blank);
    transition: all 0.18s ease;

    &:hover:not(.provider-card--active) {
      border-color: #b0bcff;
      background: #fafbff;
    }

    &--active {
      border-color: #4f6ef7;
      background: #f0f4ff;
      box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.1);

      .provider-card__check {
        opacity: 1;
        color: #4f6ef7;
      }
    }

    &__logo {
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;

      &--fadada {
        color: #1a56db;
      }
      &--seal {
        color: #ea580c;
      }
    }

    &__desc {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }

    &__check {
      position: absolute;
      top: 8px;
      right: 10px;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.15s;
    }
  }

  /* ===== 签章类型单选 ===== */
  .sign-type-group {
    display: flex;
    gap: 12px;

    :deep(.el-radio.is-bordered) {
      padding: 10px 20px;
      border-radius: 8px;
      transition: all 0.15s;

      &.is-checked {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
    }
  }

  /* ===== 提示条 ===== */
  .no-seal-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #059669;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 4px;
  }

  /* ===== 未选择占位 ===== */
  .provider-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 32px 0;
    color: var(--el-text-color-placeholder);
    font-size: 13px;
  }

  .sign-form {
    padding: 0 4px;
  }
  .seal-upload-area {
    width: 100%;
  }

  :deep(.sign-dialog .el-dialog__header) {
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
</style>
