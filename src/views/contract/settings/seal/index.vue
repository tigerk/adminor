<template>
  <div class="seal-page">
    <!-- ══ 顶部操作栏 ══ -->
    <div class="seal-topbar">
      <!-- 第一行：标题 + 计数 + 添加按钮 -->
      <div class="seal-topbar__row">
        <div class="seal-topbar__left">
          <div class="seal-topbar__icon">
            <el-icon :size="16" color="#4f6ef7"><Stamp /></el-icon>
          </div>
          <span class="seal-topbar__title">电子签章</span>
          <span class="seal-topbar__dot" />
          <span class="seal-topbar__count">{{ signList.length }} 个签章</span>
        </div>
        <div class="seal-topbar__notice">
          <el-icon :size="12" class="notice-icon"><Warning /></el-icon>
          由「法大大」提供法律认证服务
        </div>
      </div>
    </div>

    <!-- ══ 签章列表（卡片宫格） ══ -->
    <div v-if="signList.length" class="seal-grid mt-3">
      <div v-for="item in signList" :key="item.id" class="seal-card" :class="getItemClass(item)">
        <!-- 顶部：图标 + 标签 -->
        <div class="seal-card__header">
          <div class="seal-card__avatar" :class="getAvatarClass(item)">
            <el-icon :size="18">
              <OfficeBuilding v-if="item.sealType === 1 || item.source !== ContractSealSourceEnum.FADADA" />
              <User v-else />
            </el-icon>
          </div>
          <div class="seal-card__badges">
            <span class="seal-card__tag" :class="item.source === ContractSealSourceEnum.FADADA ? 'tag--fadada' : 'tag--seal'">
              {{ getCardTypeLabel(item) }}
            </span>
            <span v-if="item.source !== ContractSealSourceEnum.SELF" class="seal-card__certified">
              <el-icon :size="10" class="certified-icon"><CircleCheckFilled /></el-icon>
              已认证
            </span>
            <span v-else class="seal-card__warn">
              <el-icon :size="10" class="warn-icon"><Warning /></el-icon>
              企业签章不具备法律效应
            </span>
          </div>
        </div>

        <!-- 名称 -->
        <div class="seal-card__name">
          {{ item.source === ContractSealSourceEnum.FADADA && item.sealType === 2 ? item.operatorName || "—" : item.companyName || "—" }}
        </div>

        <!-- 详情字段 -->
        <div class="seal-card__fields">
          <!-- 法大大·企业 -->
          <template v-if="item.source === ContractSealSourceEnum.FADADA && item.sealType === 1">
            <div class="seal-card__field">
              <span class="seal-card__field-label">统一代码</span>
              <span class="seal-card__field-val">{{ item.companyUscc || "—" }}</span>
            </div>
            <div class="seal-card__field">
              <span class="seal-card__field-label">法人</span>
              <span class="seal-card__field-val">{{ item.legalPerson || "—" }}</span>
            </div>
            <div class="seal-card__field">
              <span class="seal-card__field-label">经办人</span>
              <span class="seal-card__field-val">{{ item.operatorName || "—" }}</span>
            </div>
          </template>
          <!-- 法大大·个人 -->
          <template v-else-if="item.source === ContractSealSourceEnum.FADADA && item.sealType === 2">
            <div class="seal-card__field">
              <span class="seal-card__field-label">联系电话</span>
              <span class="seal-card__field-val">{{ item.operatorPhone || "—" }}</span>
            </div>
            <div class="seal-card__field">
              <span class="seal-card__field-label">证件</span>
              <span class="seal-card__field-val">{{ formatIdInfo(item.operatorIdType, item.operatorIdNo) }}</span>
            </div>
          </template>
          <!-- 企业章 -->
          <template v-else>
            <div class="seal-card__field">
              <span class="seal-card__field-label">统一代码</span>
              <span class="seal-card__field-val">{{ item.companyUscc || "—" }}</span>
            </div>
            <div class="seal-card__field">
              <span class="seal-card__field-label">法人</span>
              <span class="seal-card__field-val">{{ item.legalPerson || "—" }}</span>
            </div>
          </template>
          <!-- 编辑按钮，绝对定位到右下角 -->
          <button class="seal-card__edit-btn" @click.stop="openEditDialog(item)">
            <el-icon :size="14"><Edit /></el-icon>
          </button>
        </div>

        <!-- 底部装饰条 -->
        <div class="seal-card__bar" />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="seal-empty">
      <div class="seal-empty__icon-wrap">
        <el-icon :size="32" class="empty-stamp-icon"><Stamp /></el-icon>
      </div>
      <p class="seal-empty__title">暂无电子签章</p>
      <p class="seal-empty__desc">点击右上角「添加电子签章」开始配置</p>
    </div>

    <!-- ══ 对话框 ══ -->
    <el-dialog v-model="dialogVisible" width="560px" align-center :lock-scroll="false" destroy-on-close class="seal-dialog">
      <template #header>
        <div class="seal-dialog__hd">
          <div class="seal-dialog__hd-icon">
            <el-icon :size="14" class="dialog-stamp-icon"><Stamp /></el-icon>
          </div>
          <span class="seal-dialog__hd-title">{{ editingId ? "编辑电子签章" : "添加电子签章" }}</span>
        </div>
      </template>

      <div class="sd-form">
        <!-- 签章来源切换（行内，作为普通字段） -->
        <div class="sd-field-group">
          <label class="sd-label sd-label--required">签章来源</label>
          <div class="sd-source-row">
            <button
              class="sd-source-opt"
              :class="{ 'sd-source-opt--on': form.source === ContractSealSourceEnum.SELF, 'sd-source-opt--disabled': !!editingId }"
              :disabled="!!editingId"
              @click="!editingId && handleSourceChange(ContractSealSourceEnum.SELF)"
            >
              <span class="sd-source-opt__badge sd-source-opt__badge--seal">
                <el-icon :size="14"><Stamp /></el-icon>
              </span>
              <div class="sd-source-opt__info">
                <span class="sd-source-opt__name">企业章</span>
                <span class="sd-source-opt__sub">上传实体印章图片</span>
              </div>
              <el-icon v-if="form.source === ContractSealSourceEnum.SELF" class="sd-source-opt__check" :size="14">
                <CircleCheckFilled />
              </el-icon>
            </button>
            <button
              class="sd-source-opt"
              :class="{ 'sd-source-opt--on': form.source === ContractSealSourceEnum.FADADA, 'sd-source-opt--disabled': !!editingId }"
              :disabled="!!editingId"
              @click="!editingId && handleSourceChange(ContractSealSourceEnum.FADADA)"
            >
              <span class="sd-source-opt__badge sd-source-opt__badge--fadada">法</span>
              <div class="sd-source-opt__info">
                <span class="sd-source-opt__name">法大大</span>
                <span class="sd-source-opt__sub">电子合同 · 法律认证</span>
              </div>
              <el-icon v-if="form.source === ContractSealSourceEnum.FADADA" class="sd-source-opt__check" :size="14">
                <CircleCheckFilled />
              </el-icon>
            </button>
          </div>
        </div>

        <!-- 法大大：印章类型 -->
        <template v-if="form.source === ContractSealSourceEnum.FADADA">
          <div class="sd-field-group">
            <label class="sd-label sd-label--required">印章类型</label>
            <div class="sd-type-switch">
              <button
                class="sd-type-btn"
                :class="{ 'sd-type-btn--on': form.sealType === 1 }"
                @click="
                  form.sealType = 1;
                  handleSignTypeChange();
                "
              >
                <el-icon :size="13"><OfficeBuilding /></el-icon>
                企业印章
              </button>
              <button
                class="sd-type-btn"
                :class="{ 'sd-type-btn--on': form.sealType === 2 }"
                @click="
                  form.sealType = 2;
                  handleSignTypeChange();
                "
              >
                <el-icon :size="13"><User /></el-icon>
                个人印章
              </button>
            </div>
          </div>
        </template>

        <div class="sd-divider" />

        <!-- 企业信息（企业章 / 法大大·企业） -->
        <template v-if="form.source === ContractSealSourceEnum.SELF || (form.source === ContractSealSourceEnum.FADADA && form.sealType === 1)">
          <div class="sd-field-group">
            <label class="sd-label sd-label--required">公司名称</label>
            <el-input v-model="form.companyName" placeholder="请输入公司全称" />
          </div>
          <div class="sd-field-group">
            <label class="sd-label sd-label--required">统一社会信用代码</label>
            <el-input v-model="form.companyUscc" placeholder="请输入 18 位统一社会信用代码" />
          </div>
          <div class="sd-field-group">
            <label class="sd-label sd-label--required">法人姓名</label>
            <el-input v-model="form.legalPerson" placeholder="请输入法人姓名" />
          </div>
          <div class="sd-field-group">
            <label class="sd-label sd-label--required">法人证件</label>
            <el-input
              v-model="form.legalPersonIdNo"
              :placeholder="
                idTypeOptions.find(o => String(o.value) === form.legalPersonIdType)?.label
                  ? `请输入${idTypeOptions.find(o => String(o.value) === form.legalPersonIdType)?.label}号码`
                  : '请输入证件号码'
              "
            >
              <template #prepend>
                <el-select v-model="form.legalPersonIdType" style="width: 110px">
                  <el-option v-for="opt in idTypeOptions" :key="opt.value" :label="opt.label" :value="String(opt.value)" />
                </el-select>
              </template>
            </el-input>
          </div>
        </template>

        <!-- 经办人（法大大） -->
        <template v-if="form.source === ContractSealSourceEnum.FADADA">
          <div class="sd-field-group">
            <label class="sd-label sd-label--required">经办人</label>
            <el-select v-model="form.operatorId" placeholder="搜索或选择经办人" filterable class="w-full" @change="handleOperatorChange">
              <el-option v-for="opt in userOptions" :key="opt.id" :label="opt.name" :value="opt.id" />
            </el-select>
          </div>
          <template v-if="form.sealType === 2 && form.operatorId">
            <div class="sd-field-group">
              <label class="sd-label">证件类型</label>
              <el-input v-model="form.operatorIdTypeLabel" disabled placeholder="自动读取" />
            </div>
            <div class="sd-field-group">
              <label class="sd-label">证件号码</label>
              <el-input v-model="form.operatorIdNo" disabled placeholder="自动读取" />
            </div>
            <div class="sd-field-group">
              <label class="sd-label">联系电话</label>
              <el-input v-model="form.operatorPhone" disabled placeholder="自动读取" />
            </div>
          </template>
          <div class="sd-tip">
            <el-icon :size="12" class="tip-check-icon"><CircleCheckFilled /></el-icon>
            {{ form.sealType === 1 ? "法大大将自动生成企业电子印章，无需手动上传" : "选择经办人后系统将自动关联身份信息并生成个人印章" }}
          </div>
        </template>

        <!-- 企业章：印章图片上传 -->
        <template v-if="form.source === ContractSealSourceEnum.SELF">
          <div class="sd-field-group">
            <label class="sd-label sd-label--required">电子印章图片</label>
            <div class="sd-upload">
              <UploadImage v-model="form.sealUrls" :limit="1" :width="100" :height="100">
                <!-- 使用自定义提示 -->
                <template #tip="">
                  <div>上传企业印章图片</div>
                </template>
              </UploadImage>
              <div class="sd-upload__hint">
                <p>· 透明背景 PNG 格式</p>
                <p>· 建议尺寸 300 × 300 px</p>
                <p>· 可拖拽上传最多1张，单个不超过2MB</p>
              </div>
            </div>
          </div>
        </template>
      </div>

      <template #footer>
        <div class="seal-dialog__ft">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">保存签章</el-button>
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
  import { createContractSeal, updateContractSeal, getContractSealList } from "@/api/contract/contractSeal";
  import type { ContractSealCreateDto, ContractSealVo, IdNameVo } from "@/types/generated";
  import { ContractSealSourceEnum, ContractSealTypeEnum } from "@/types/enums";
  import { Stamp, Warning, OfficeBuilding, User, CircleCheckFilled, ArrowRight, Edit } from "@element-plus/icons-vue";
  import { convertImage2string } from "@/utils/image";

  const idTypeOptions = ID_TYPE_OPTIONS;
  const signList = ref<ContractSealVo[]>([]);
  const dialogVisible = ref(false);
  const saving = ref(false);
  const userOptions = ref<IdNameVo[]>([]);

  /** null = 新增模式；有值 = 编辑模式（存当前记录 id） */
  const editingId = ref<string | null>(null);

  const form = reactive({
    sealType: 1,
    source: ContractSealSourceEnum.SELF,
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

  function getCardTypeLabel(item: ContractSealVo) {
    if (item.source === ContractSealSourceEnum.FADADA) return item.sealType === ContractSealTypeEnum.COMPANY ? "法大大·企业" : "法大大·个人";
    return "企业章";
  }

  function getItemClass(item: ContractSealVo) {
    if (item.source === ContractSealSourceEnum.FADADA) return item.sealType === ContractSealTypeEnum.COMPANY ? "seal-item--fadada-ent" : "seal-item--fadada-per";
    return "seal-item--ent-seal";
  }

  function getAvatarClass(item: ContractSealVo) {
    if (item.source === ContractSealSourceEnum.FADADA) return item.sealType === ContractSealTypeEnum.COMPANY ? "avatar--blue" : "avatar--green";
    return "avatar--orange";
  }

  const loadUserOptions = async () => {
    const resp = await getCompanyUserOptions();
    if (resp.code === 0) userOptions.value = resp.data || [];
  };

  const fetchList = async () => {
    const resp = await getContractSealList({});
    if (resp.code === 0) signList.value = resp.data || [];
  };

  /** 新增模式 */
  const openDialog = async () => {
    editingId.value = null;
    resetForm();
    await loadUserOptions();
    dialogVisible.value = true;
  };

  /** 编辑模式：回填当前卡片数据 */
  const openEditDialog = async (item: ContractSealVo) => {
    editingId.value = item.id ?? null;
    await loadUserOptions();
    Object.assign(form, {
      sealType: item.sealType ?? ContractSealTypeEnum.COMPANY,
      source: item.source ?? ContractSealSourceEnum.SELF,
      companyName: item.companyName ?? "",
      companyUscc: item.companyUscc ?? "",
      legalPerson: item.legalPerson ?? "",
      legalPersonIdType: item.legalPersonIdType != null ? String(item.legalPersonIdType) : "0",
      legalPersonIdNo: item.legalPersonIdNo ?? "",
      operatorId: item.operatorId ?? undefined,
      operatorIdTypeLabel: item.operatorIdType != null ? (idTypeOptions.find(i => String(i.value) === String(item.operatorIdType))?.label ?? "") : "",
      operatorIdNo: item.operatorIdNo ?? "",
      operatorPhone: item.operatorPhone ?? "",
      status: item.status ?? 1,
      sealUrls: (item.sealUrls ?? []).filter(Boolean)
    });
    dialogVisible.value = true;
  };

  const resetForm = () => {
    Object.assign(form, {
      sealType: ContractSealTypeEnum.COMPANY,
      source: ContractSealSourceEnum.SELF,
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

  const handleSourceChange = (source: ContractSealSourceEnum) => {
    form.source = source;
    form.sealType = ContractSealTypeEnum.COMPANY;
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
      form.operatorIdTypeLabel = idTypeOptions.find(i => i.value === resp.data.idType)?.label || "";
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

  const getSealUrlList = () => {
    const list = form.sealUrls || [];
    const urls = list
      .map(item => {
        if (!item) return "";
        if (typeof item === "string") return item;
        if (item.status && item.status !== "success") return "";
        if (item.url) return item.url;
        const resp = item.response || item?.raw?.response || item?.raw;
        return resp?.url || resp?.fileUrl || resp?.path || resp?.data?.url || "";
      })
      .filter(Boolean);
    return urls;
  };

  const hasUploadingSeal = () => {
    return (form.sealUrls || []).some(item => typeof item === "object" && item?.status && item.status !== "success");
  };

  const validateForm = (): string => {
    if (!form.source) return "请选择签章来源";
    if (form.source === ContractSealSourceEnum.FADADA) {
      if (form.sealType === ContractSealTypeEnum.COMPANY) {
        if (!form.companyName) return "请输入公司名称";
        if (!form.companyUscc) return "请输入统一社会信用代码";
        if (!form.legalPerson) return "请输入法人姓名";
        if (!form.legalPersonIdNo) return "请输入法人证件号";
        if (!form.operatorId) return "请选择经办人";
      } else {
        if (!form.operatorId) return "请选择经办人";
      }
    }
    if (form.source === ContractSealSourceEnum.SELF) {
      if (!form.companyName) return "请输入公司名称";
      if (!form.companyUscc) return "请输入统一社会信用代码";
      if (!form.legalPerson) return "请输入法人姓名";
      if (!form.legalPersonIdNo) return "请输入法人证件号";
      if (hasUploadingSeal()) return "图片正在上传中，请稍后再保存";
      if (getSealUrlList().length === 0) return "请上传电子印章";
    }
    return "";
  };

  const buildPayload = (): ContractSealCreateDto => {
    const sealUrlList = getSealUrlList();
    const firstSealUrl = sealUrlList[0];
    const payload: ContractSealCreateDto = {
      sealType: form.source === ContractSealSourceEnum.FADADA ? form.sealType : ContractSealTypeEnum.COMPANY,
      source: form.source,
      status: form.status,
      sealUrls: form.source === ContractSealSourceEnum.SELF && firstSealUrl ? [firstSealUrl] : []
    };
    if (form.source === ContractSealSourceEnum.FADADA && form.sealType === 1) {
      Object.assign(payload, {
        companyName: form.companyName,
        companyUscc: form.companyUscc,
        legalPerson: form.legalPerson,
        legalPersonIdType: form.legalPersonIdType,
        legalPersonIdNo: form.legalPersonIdNo,
        operatorId: form.operatorId
      });
    } else if (form.source === ContractSealSourceEnum.FADADA && form.sealType === 2) {
      payload.operatorId = form.operatorId;
    } else if (form.source === ContractSealSourceEnum.SELF) {
      Object.assign(payload, {
        companyName: form.companyName,
        companyUscc: form.companyUscc,
        legalPerson: form.legalPerson,
        legalPersonIdType: form.legalPersonIdType,
        legalPersonIdNo: form.legalPersonIdNo
      });
    }
    return payload;
  };

  const handleSave = async () => {
    const err = validateForm();
    if (err) {
      message(err, { type: "warning" });
      return;
    }
    saving.value = true;
    const payload = buildPayload();

    let resp;
    if (editingId.value) {
      resp = await updateContractSeal({ ...payload, id: editingId.value });
    } else {
      resp = await createContractSeal(payload);
    }

    saving.value = false;
    if (resp.code === 0) {
      message(editingId.value ? "编辑电子签章成功" : "新增电子签章成功", { type: "success" });
      dialogVisible.value = false;
      fetchList();
    } else {
      message(resp.message || "保存失败", { type: "error" });
    }
  };

  const formatIdInfo = (idType: any, idNo: any) => {
    if (!idNo) return "—";
    const label = idTypeOptions.find(i => String(i.value) === String(idType))?.label || "证件";
    return `${label} · ${idNo}`;
  };

  onMounted(() => {
    fetchList();
  });

  defineExpose({ openDialog });
</script>

<style lang="scss" scoped>
  /* =============================================
CSS 自定义属性 —— 浅色默认，dark class 覆盖
vue-pure-admin 深色模式在 <html class="dark"> 上
scoped 样式用 :global(.dark) 触发
============================================= */

  /* 浅色 token */
  .seal-page {
    /* 顶部图标背景 */
    --seal-icon-bg-from: #eef1ff;
    --seal-icon-bg-to: #dde4ff;
    --seal-icon-border: #d4dcff;

    /* 提示条（黄色） */
    --seal-notice-color: #92400e;
    --seal-notice-bg: #fef3c7;
    --seal-notice-border: #fde68a;

    /* 卡片：法大大·企业（蓝紫） */
    --seal-card-ent-bg-from: #f5f7ff;
    --seal-card-ent-bg-to: #ffffff;
    --seal-card-ent-border: #dde4ff;

    /* 卡片：法大大·个人（绿） */
    --seal-card-per-bg-from: #f0fdf7;
    --seal-card-per-bg-to: #ffffff;
    --seal-card-per-border: #bbf7d0;

    /* 卡片：企业章（橙） */
    --seal-card-seal-bg-from: #fff8f2;
    --seal-card-seal-bg-to: #ffffff;
    --seal-card-seal-border: #fed7aa;

    /* 头像图标 */
    --seal-avatar-blue-bg: #eef1ff;
    --seal-avatar-blue-color: #4f6ef7;
    --seal-avatar-green-bg: #ecfdf5;
    --seal-avatar-green-color: #059669;
    --seal-avatar-orange-bg: #fff7ed;
    --seal-avatar-orange-color: #ea580c;

    /* 标签 */
    --seal-tag-fadada-bg: #eef1ff;
    --seal-tag-fadada-color: #4f6ef7;
    --seal-tag-fadada-border: #d4dcff;
    --seal-tag-seal-bg: #fff7ed;
    --seal-tag-seal-color: #ea580c;
    --seal-tag-seal-border: #fed7aa;

    /* 认证 / 警告 */
    --seal-certified-color: #16a34a;
    --seal-warn-color: #ef4444;

    /* 空状态图标背景 */
    --seal-empty-icon-bg: #eef1ff;

    /* 对话框头部图标 */
    --seal-dialog-icon-bg-from: #eef1ff;
    --seal-dialog-icon-bg-to: #dde4ff;

    /* 来源选项 hover */
    --sd-source-default-bg: var(--el-fill-color-light);
    --sd-source-default-border: var(--el-border-color-lighter);
    --sd-source-hover-border: #a5b4fc;
    --sd-source-hover-bg: #fafbff;
    --sd-source-on-border: #4f6ef7;
    --sd-source-on-bg: #f0f4ff;

    /* 来源选项 badge */
    --sd-badge-fadada-bg: #dbeafe;
    --sd-badge-fadada-color: #1d4ed8;
    --sd-badge-seal-bg: #ffedd5;
    --sd-badge-seal-color: #ea580c;

    /* 绿色提示条 */
    --sd-tip-color: #15803d;
    --sd-tip-bg: #f0fdf4;
    --sd-tip-border: #bbf7d0;

    /* 卡片 hover 阴影 */
    --seal-card-hover-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }

  /* 深色 token 覆盖 */
  :global(.dark) .seal-page {
    --seal-icon-bg-from: #1e2152;
    --seal-icon-bg-to: #252b66;
    --seal-icon-border: #3a4285;

    --seal-notice-color: #fde68a;
    --seal-notice-bg: rgba(120, 80, 0, 0.35);
    --seal-notice-border: rgba(253, 230, 138, 0.25);

    --seal-card-ent-bg-from: #1a1d3a;
    --seal-card-ent-bg-to: #1e2235;
    --seal-card-ent-border: #2d3566;

    --seal-card-per-bg-from: #0f2820;
    --seal-card-per-bg-to: #141f1a;
    --seal-card-per-border: #1a4a33;

    --seal-card-seal-bg-from: #2a1a0a;
    --seal-card-seal-bg-to: #1e1610;
    --seal-card-seal-border: #5a3010;

    --seal-avatar-blue-bg: rgba(79, 110, 247, 0.2);
    --seal-avatar-blue-color: #818cf8;
    --seal-avatar-green-bg: rgba(5, 150, 105, 0.2);
    --seal-avatar-green-color: #34d399;
    --seal-avatar-orange-bg: rgba(234, 88, 12, 0.2);
    --seal-avatar-orange-color: #fb923c;

    --seal-tag-fadada-bg: rgba(79, 110, 247, 0.18);
    --seal-tag-fadada-color: #818cf8;
    --seal-tag-fadada-border: rgba(129, 140, 248, 0.3);
    --seal-tag-seal-bg: rgba(234, 88, 12, 0.18);
    --seal-tag-seal-color: #fb923c;
    --seal-tag-seal-border: rgba(251, 146, 60, 0.3);

    --seal-certified-color: #34d399;
    --seal-warn-color: #f87171;

    --seal-empty-icon-bg: rgba(79, 110, 247, 0.15);

    --seal-dialog-icon-bg-from: #1e2152;
    --seal-dialog-icon-bg-to: #252b66;

    --sd-source-default-bg: #1e2130;
    --sd-source-default-border: #363d52;
    --sd-source-hover-border: #6374f8;
    --sd-source-hover-bg: rgba(79, 110, 247, 0.1);
    --sd-source-on-border: #6374f8;
    --sd-source-on-bg: rgba(79, 110, 247, 0.28);

    --sd-badge-fadada-bg: rgba(29, 78, 216, 0.3);
    --sd-badge-fadada-color: #93c5fd;
    --sd-badge-seal-bg: rgba(234, 88, 12, 0.3);
    --sd-badge-seal-color: #fdba74;

    --sd-tip-color: #34d399;
    --sd-tip-bg: rgba(5, 150, 105, 0.12);
    --sd-tip-border: rgba(52, 211, 153, 0.25);

    --seal-card-hover-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
  }

  /* =============================================
页面
============================================= */
  .seal-page {
    width: 100%;
    padding: 20px 0 32px;
    display: flex;
    flex-direction: column;
  }

  /* =============================================
顶部操作栏
============================================= */
  .seal-topbar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    width: 100%;
  }

  .seal-topbar__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
  }

  .seal-topbar__left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .seal-topbar__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--seal-icon-bg-from), var(--seal-icon-bg-to));
    border: 1px solid var(--seal-icon-border);
    flex-shrink: 0;
  }

  .seal-topbar__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .seal-topbar__dot {
    display: inline-block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--el-border-color);
    margin: 0 8px;
    vertical-align: middle;
  }

  .seal-topbar__count {
    font-size: 13px;
    color: var(--el-text-color-placeholder);
  }

  .seal-topbar__notice {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--seal-notice-color);
    background: var(--seal-notice-bg);
    border: 1px solid var(--seal-notice-border);
    border-radius: 5px;
    padding: 4px 10px;
    width: fit-content;
  }

  /* =============================================
签章卡片宫格
============================================= */
  .seal-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
  }

  .seal-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 16px 0 16px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-blank);
    overflow: hidden;
    transition:
      box-shadow 0.2s,
      transform 0.2s;

    &:hover {
      box-shadow: var(--seal-card-hover-shadow);
      transform: translateY(-2px);
    }

    /* 颜色主题 */
    &--fadada-ent {
      background: linear-gradient(145deg, var(--seal-card-ent-bg-from) 0%, var(--seal-card-ent-bg-to) 60%);
      border-color: var(--seal-card-ent-border);

      .seal-card__bar {
        background: linear-gradient(90deg, #6366f1, #818cf8);
      }
    }

    &--fadada-per {
      background: linear-gradient(145deg, var(--seal-card-per-bg-from) 0%, var(--seal-card-per-bg-to) 60%);
      border-color: var(--seal-card-per-border);

      .seal-card__bar {
        background: linear-gradient(90deg, #10b981, #34d399);
      }
    }

    &--ent-seal {
      background: linear-gradient(145deg, var(--seal-card-seal-bg-from) 0%, var(--seal-card-seal-bg-to) 60%);
      border-color: var(--seal-card-seal-border);

      .seal-card__bar {
        background: linear-gradient(90deg, #f97316, #fb923c);
      }
    }

    &__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }

    &__avatar {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.avatar--blue {
        background: var(--seal-avatar-blue-bg);
        color: var(--seal-avatar-blue-color);
        box-shadow: 0 2px 8px rgba(79, 110, 247, 0.18);
      }

      &.avatar--green {
        background: var(--seal-avatar-green-bg);
        color: var(--seal-avatar-green-color);
        box-shadow: 0 2px 8px rgba(5, 150, 105, 0.18);
      }

      &.avatar--orange {
        background: var(--seal-avatar-orange-bg);
        color: var(--seal-avatar-orange-color);
        box-shadow: 0 2px 8px rgba(234, 88, 12, 0.18);
      }
    }

    &__badges {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
    }

    &__tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 5px;
      border: 1px solid transparent;
      white-space: nowrap;

      &.tag--fadada {
        background: var(--seal-tag-fadada-bg);
        color: var(--seal-tag-fadada-color);
        border-color: var(--seal-tag-fadada-border);
      }

      &.tag--seal {
        background: var(--seal-tag-seal-bg);
        color: var(--seal-tag-seal-color);
        border-color: var(--seal-tag-seal-border);
      }
    }

    &__certified {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: var(--seal-certified-color);
    }

    &__warn {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: var(--seal-warn-color);
    }

    &__name {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.4;
    }

    &__fields {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-bottom: 14px;
    }

    &__field {
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-size: 12px;
    }

    &__field-label {
      flex-shrink: 0;
      color: var(--el-text-color-placeholder);
      min-width: 48px;
    }

    &__field-val {
      color: var(--el-text-color-regular);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    &__bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
    }
  }

  /* =============================================
空状态
============================================= */
  .seal-empty {
    width: 100%;
    height: calc(100vh - 200px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-align: center;
  }

  .seal-empty__icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--seal-empty-icon-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
  }

  .seal-empty__title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    margin: 0;
  }

  .seal-empty__desc {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin: 0;
  }

  /* =============================================
对话框
============================================= */
  .seal-dialog {
    :deep(.el-dialog) {
      border-radius: 14px;
      overflow: hidden;
    }

    :deep(.el-dialog__header) {
      padding: 18px 22px 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      margin-right: 0;
    }

    :deep(.el-dialog__body) {
      padding: 0;
    }

    :deep(.el-dialog__footer) {
      padding: 12px 22px 18px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }

  .seal-dialog__hd {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .seal-dialog__hd-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--seal-dialog-icon-bg-from), var(--seal-dialog-icon-bg-to));
    flex-shrink: 0;
  }

  .seal-dialog__hd-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .seal-dialog__ft {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  /* =============================================
统一表单
============================================= */
  .sd-form {
    padding: 20px 22px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .sd-field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sd-label {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--el-text-color-regular);

    &--required::after {
      content: " *";
      color: var(--el-color-danger);
    }
  }

  .sd-divider {
    height: 1px;
    background: var(--el-border-color-lighter);
    margin: 2px 0 0;
  }

  /* ── 来源选择 ── */
  .sd-source-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .sd-source-opt {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--sd-source-default-bg);
    border: 1.5px solid var(--sd-source-default-border);
    border-radius: 9px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    position: relative;

    &:hover:not(.sd-source-opt--on) {
      border-color: var(--sd-source-hover-border);
      background: var(--sd-source-hover-bg);
    }

    &--on {
      border-color: var(--sd-source-on-border);
      background: var(--sd-source-on-bg);
      box-shadow: 0 0 0 2.5px rgba(99, 116, 248, 0.25);
    }
  }

  .sd-source-opt__badge {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 800;

    &--fadada {
      background: var(--sd-badge-fadada-bg);
      color: var(--sd-badge-fadada-color);
    }

    &--seal {
      background: var(--sd-badge-seal-bg);
      color: var(--sd-badge-seal-color);
    }
  }

  .sd-source-opt__info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }

  .sd-source-opt__name {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .sd-source-opt__sub {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  /* 选中态：文字强制高对比 */
  .sd-source-opt--on .sd-source-opt__name {
    color: var(--el-color-primary);
  }

  :global(.dark) .sd-source-opt--on .sd-source-opt__name {
    color: #ffffff;
  }

  :global(.dark) .sd-source-opt--on .sd-source-opt__sub {
    color: rgba(255, 255, 255, 0.65);
  }

  .sd-source-opt__check {
    flex-shrink: 0;
  }

  /* ── 印章类型 segmented ── */
  .sd-type-switch {
    display: flex;
    gap: 0;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    padding: 3px;
    width: fit-content;
  }

  .sd-type-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 18px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover:not(.sd-type-btn--on) {
      color: var(--el-text-color-primary);
    }

    &--on {
      font-weight: 500;
      color: var(--el-color-primary);
      background: var(--el-fill-color-blank);
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
    }
  }

  /* ── 绿色提示条 ── */
  .sd-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--sd-tip-color);
    background: var(--sd-tip-bg);
    border: 1px solid var(--sd-tip-border);
    border-radius: 7px;
    padding: 8px 12px;
  }

  /* ── 上传区 ── */
  .sd-upload {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  /* ── icon 颜色（避免 hardcode，跟随主题） ── */
  .notice-icon {
    color: var(--seal-notice-color);
  }

  .certified-icon {
    color: var(--seal-certified-color);
  }

  .warn-icon {
    color: var(--seal-warn-color);
  }

  .empty-stamp-icon {
    color: var(--seal-avatar-blue-color);
  }

  .dialog-stamp-icon {
    color: var(--el-color-primary);
  }

  .tip-check-icon {
    color: var(--sd-tip-color);
  }

  /* ── 来源选中 check icon ── */
  .sd-source-opt__check {
    flex-shrink: 0;
    color: var(--el-color-primary);
  }

  /* ── 来源选项禁用态（编辑模式） ── */
  .sd-source-opt--disabled {
    opacity: 0.65;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* ── 卡片编辑按钮（绝对定位到 fields 右下角，纯图标无边框） ── */
  .seal-card__edit-btn {
    position: absolute;
    right: 0;
    bottom: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--el-text-color-placeholder);
    cursor: pointer;
    transition: color 0.15s;

    &:hover {
      color: var(--el-color-primary);
    }
  }
</style>
