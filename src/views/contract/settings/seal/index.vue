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

        <!-- 添加入口（紧靠标题行右端） -->
        <button class="seal-add-entry" @click="openDialog">
          <el-icon :size="13" color="#4f6ef7"><Plus /></el-icon>
          <span class="seal-add-entry__title">添加电子签章</span>
        </button>
      </div>

      <!-- 第二行：法律提示 -->
      <div class="seal-topbar__notice">
        <el-icon :size="12" color="#d97706"><Warning /></el-icon>
        由「法大大」提供法律认证服务
      </div>
    </div>

    <!-- ══ 签章列表 ══ -->
    <div v-if="signList.length" class="seal-list">
      <div v-for="item in signList" :key="item.id" class="seal-item" :class="getItemClass(item)">
        <!-- 左侧色条 -->
        <div class="seal-item__stripe" />

        <!-- 左侧图标 -->
        <div class="seal-item__avatar" :class="getAvatarClass(item)">
          <el-icon :size="16">
            <OfficeBuilding v-if="item.sealType === 1 || item.source !== ContractSealSourceEnum.FADADA" />
            <User v-else />
          </el-icon>
        </div>

        <!-- 主信息 -->
        <div class="seal-item__main">
          <div class="seal-item__name">
            {{ item.source === ContractSealSourceEnum.FADADA && item.sealType === 2 ? item.operatorName || "—" : item.companyName || "—" }}
          </div>
          <div class="seal-item__meta">
            <!-- 法大大·企业 -->
            <template v-if="item.source === ContractSealSourceEnum.FADADA && item.sealType === 1">
              <span>{{ item.companyUscc || "—" }}</span>
              <span class="seal-item__sep">·</span>
              <span>法人：{{ item.legalPerson || "—" }}</span>
              <span class="seal-item__sep">·</span>
              <span>经办人：{{ item.operatorName || "—" }}</span>
            </template>
            <!-- 法大大·个人 -->
            <template v-else-if="item.source === ContractSealSourceEnum.FADADA && item.sealType === 2">
              <span>{{ item.operatorPhone || "—" }}</span>
              <span class="seal-item__sep">·</span>
              <span>{{ formatIdInfo(item.operatorIdType, item.operatorIdNo) }}</span>
            </template>
            <!-- 企业章 -->
            <template v-else>
              <span>{{ item.companyUscc || "—" }}</span>
              <span class="seal-item__sep">·</span>
              <span>法人：{{ item.legalPerson || "—" }}</span>
            </template>
          </div>
        </div>

        <!-- 右侧标签组 -->
        <div class="seal-item__tags">
          <span class="seal-item__tag" :class="item.source === ContractSealSourceEnum.FADADA ? 'tag--fadada' : 'tag--seal'">
            {{ getCardTypeLabel(item) }}
          </span>
          <span class="seal-item__certified">
            <el-icon :size="11" color="#16a34a"><CircleCheckFilled /></el-icon>
            已认证
          </span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="seal-empty">
      <div class="seal-empty__icon-wrap">
        <el-icon :size="32" color="#a5b4fc"><Stamp /></el-icon>
      </div>
      <p class="seal-empty__title">暂无电子签章</p>
      <p class="seal-empty__desc">点击右上角「添加电子签章」开始配置</p>
    </div>

    <!-- ══ 对话框 ══ -->
    <el-dialog v-model="dialogVisible" width="560px" align-center :lock-scroll="false" destroy-on-close class="seal-dialog">
      <template #header>
        <div class="seal-dialog__hd">
          <div class="seal-dialog__hd-icon">
            <el-icon :size="14" color="#4f6ef7"><Stamp /></el-icon>
          </div>
          <span class="seal-dialog__hd-title">添加电子签章</span>
        </div>
      </template>

      <div class="sd-form">
        <!-- 签章来源切换（行内，作为普通字段） -->
        <div class="sd-field-group">
          <label class="sd-label sd-label--required">签章来源</label>
          <div class="sd-source-row">
            <button class="sd-source-opt" :class="{ 'sd-source-opt--on': form.source === ContractSealSourceEnum.SELF }" @click="handleSourceChange(ContractSealSourceEnum.SELF)">
              <span class="sd-source-opt__badge sd-source-opt__badge--seal">
                <el-icon :size="14"><Stamp /></el-icon>
              </span>
              <div class="sd-source-opt__info">
                <span class="sd-source-opt__name">企业章</span>
                <span class="sd-source-opt__sub">上传实体印章图片</span>
              </div>
              <el-icon v-if="form.source === ContractSealSourceEnum.SELF" class="sd-source-opt__check" :size="14" color="#4f6ef7">
                <CircleCheckFilled />
              </el-icon>
            </button>
            <button
              class="sd-source-opt"
              :class="{ 'sd-source-opt--on': form.source === ContractSealSourceEnum.FADADA }"
              @click="handleSourceChange(ContractSealSourceEnum.FADADA)"
            >
              <span class="sd-source-opt__badge sd-source-opt__badge--fadada">法</span>
              <div class="sd-source-opt__info">
                <span class="sd-source-opt__name">法大大</span>
                <span class="sd-source-opt__sub">电子合同 · 法律认证</span>
              </div>
              <el-icon v-if="form.source === ContractSealSourceEnum.FADADA" class="sd-source-opt__check" :size="14" color="#4f6ef7">
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
            <el-icon :size="12" color="#16a34a"><CircleCheckFilled /></el-icon>
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
  import { createContractSeal, getContractSealList } from "@/api/contract/contractSeal";
  import type { ContractSealCreateDto, ContractSealVo, IdNameVo } from "@/types/generated";
  import { ContractSealSourceEnum, ContractSealTypeEnum } from "@/types/enums";
  import { Stamp, Warning, OfficeBuilding, User, CircleCheckFilled, Plus, ArrowRight } from "@element-plus/icons-vue";
  import { convertImage2string } from "@/utils/image";

  const idTypeOptions = ID_TYPE_OPTIONS;
  const signList = ref<ContractSealVo[]>([]);
  const dialogVisible = ref(false);
  const saving = ref(false);
  const userOptions = ref<IdNameVo[]>([]);

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

  const openDialog = async () => {
    resetForm();
    await loadUserOptions();
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
      if (!form.sealUrls?.length) return "请上传电子印章";
    }
    return "";
  };

  const handleSave = async () => {
    const err = validateForm();
    if (err) {
      message(err, { type: "warning" });
      return;
    }
    saving.value = true;
    let image2strings = convertImage2string(form.sealUrls);
    const firstSealUrl = Array.isArray(image2strings) ? image2strings[0] : undefined;
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
    const resp = await createContractSeal(payload);
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
    if (!idNo) return "—";
    const label = idTypeOptions.find(i => String(i.value) === String(idType))?.label || "证件";
    return `${label} · ${idNo}`;
  };

  onMounted(() => {
    fetchList();
  });
</script>

<style lang="scss" scoped>
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

  /* 第一行：标题 + 计数 + 添加按钮 */
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
    background: linear-gradient(135deg, #eef1ff, #dde4ff);
    border: 1px solid #d4dcff;
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

  /* 第二行：提示 */
  .seal-topbar__notice {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: #92400e;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 5px;
    padding: 4px 10px;
    width: fit-content;
  }

  /* ── 添加入口按钮（紧凑横向，贴标题行右侧） ── */
  .seal-add-entry {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px 0 7px;
    height: 28px;
    background: #eef1ff;
    border: 1px solid #c7d2fe;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;

    &:hover {
      background: #4f6ef7;
      border-color: #4f6ef7;
      box-shadow: 0 2px 8px rgba(79, 110, 247, 0.3);

      .seal-add-entry__title {
        color: #fff;
      }

      :deep(.el-icon) {
        color: #fff !important;
      }
    }
  }

  .seal-add-entry__title {
    font-size: 13px;
    font-weight: 500;
    color: #4f6ef7;
    white-space: nowrap;
    transition: color 0.15s;
  }

  /* =============================================
签章列表
============================================= */
  .seal-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .seal-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px 14px 20px;
    border-radius: 10px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-blank);
    overflow: hidden;
    transition:
      box-shadow 0.18s,
      transform 0.18s;

    &:hover {
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.07);
      transform: translateX(2px);
    }

    /* 左侧色条 */
    &__stripe {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      border-radius: 10px 0 0 10px;
    }

    &--fadada-ent {
      .seal-item__stripe {
        background: #6366f1;
      }
      background: linear-gradient(to right, #f8f9ff, var(--el-fill-color-blank));
    }

    &--fadada-per {
      .seal-item__stripe {
        background: #10b981;
      }
      background: linear-gradient(to right, #f5fdf8, var(--el-fill-color-blank));
    }

    &--ent-seal {
      .seal-item__stripe {
        background: #f97316;
      }
      background: linear-gradient(to right, #fffaf6, var(--el-fill-color-blank));
    }

    /* 左侧头像 */
    &__avatar {
      flex-shrink: 0;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.avatar--blue {
        background: #eef1ff;
        color: #4f6ef7;
      }
      &.avatar--green {
        background: #ecfdf5;
        color: #059669;
      }
      &.avatar--orange {
        background: #fff7ed;
        color: #ea580c;
      }
    }

    /* 主信息 */
    &__main {
      flex: 1;
      min-width: 0;
    }

    &__name {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 3px;
    }

    &__meta {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__sep {
      color: var(--el-border-color);
      margin: 0 2px;
    }

    /* 右侧标签 */
    &__tags {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    &__tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 5px;
      border: 1px solid transparent;

      &.tag--fadada {
        background: #eef1ff;
        color: #4f6ef7;
        border-color: #d4dcff;
      }

      &.tag--seal {
        background: #fff7ed;
        color: #ea580c;
        border-color: #fed7aa;
      }
    }

    &__certified {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: #16a34a;
    }
  }

  /* 空状态 */
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
    background: #eef1ff;
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
    background: linear-gradient(135deg, #eef1ff, #dde4ff);
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

  /* 字段组：label 上方，控件下方 */
  .sd-field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  /* label */
  .sd-label {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--el-text-color-regular);

    &--required::after {
      content: " *";
      color: var(--el-color-danger);
    }
  }

  /* 分割线 */
  .sd-divider {
    height: 1px;
    background: var(--el-border-color-lighter);
    margin: 2px 0 0;
  }

  /* ── 来源选择：紧凑横排单选 ── */
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
    background: var(--el-fill-color-light);
    border: 1.5px solid var(--el-border-color-lighter);
    border-radius: 9px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    position: relative;

    &:hover:not(.sd-source-opt--on) {
      border-color: #a5b4fc;
      background: #fafbff;
    }

    &--on {
      border-color: #4f6ef7;
      background: #f0f4ff;
      box-shadow: 0 0 0 2.5px rgba(79, 110, 247, 0.12);
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
      background: #dbeafe;
      color: #1d4ed8;
    }
    &--seal {
      background: #ffedd5;
      color: #ea580c;
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
      color: #4f6ef7;
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
    color: #15803d;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 7px;
    padding: 8px 12px;
  }

  /* ── 上传区 ── */
  .sd-upload {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .sd-upload__hint {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    line-height: 2;
    padding-top: 8px;
  }
</style>
