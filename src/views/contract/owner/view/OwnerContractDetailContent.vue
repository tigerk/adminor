<template>
  <div v-if="detailData">
    <div class="overview-bar">
      <div class="overview-bar__section overview-bar__section--rooms">
        <div class="overview-bar__label">
          <span>合同房源</span>
        </div>
        <div class="room-chip-list">
          <el-tag v-for="subject in detailData.contractSubjectList || []" :key="subject.id || subject.subjectId" type="primary" effect="light" class="room-chip">
            {{ subject.subjectName || "-" }}
          </el-tag>
          <el-tag type="info" effect="plain" class="room-chip room-chip--meta">房源数量：{{ detailData.subjectCount || 0 }}套</el-tag>
          <el-tag type="info" effect="plain" class="room-chip room-chip--meta">已配置：{{ detailData.configuredSubjectCount || 0 }}套</el-tag>
          <el-tag type="info" effect="plain" class="room-chip room-chip--meta">总面积：{{ formatArea(detailData.totalArea) }}m²</el-tag>
        </div>
      </div>

      <div class="overview-bar__section overview-bar__section--summary">
        <div class="overview-bar__label">
          <span>合同摘要</span>
        </div>
        <div class="summary-strip">
          <div class="summary-strip__item">
            <span class="summary-strip__label">业主</span>
            <span class="summary-strip__value">{{ detailOwnerName }}</span>
          </div>
          <div class="summary-strip__item">
            <span class="summary-strip__label">委托模式</span>
            <span class="summary-strip__value">{{ cooperationModeLabelMap[detailData.ownerContract?.cooperationMode || "LIGHT_MANAGED"] }}</span>
          </div>
          <div class="summary-strip__item">
            <span class="summary-strip__label">合同编号</span>
            <span class="summary-strip__value">{{ detailData.ownerContract?.contractNo || "-" }}</span>
          </div>
          <div class="summary-strip__item">
            <span class="summary-strip__label">合同周期</span>
            <span class="summary-strip__value">{{ formatDate(detailData.ownerContract?.contractStart) }} 至 {{ formatDate(detailData.ownerContract?.contractEnd) }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="modern-tabs">
      <el-tab-pane label="业主信息" name="owner">
        <el-card shadow="never" class="detail-card">
          <template #header><span>业主信息</span></template>
          <el-descriptions :column="3" border>
            <template v-if="detailData.ownerType === 0">
              <el-descriptions-item label="姓名">{{ detailData.ownerPersonal?.name || "-" }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ genderText(detailData.ownerPersonal?.gender) }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ detailData.ownerPersonal?.phone || "-" }}</el-descriptions-item>
              <el-descriptions-item label="证件类型">{{ idTypeText(detailData.ownerPersonal?.idType) }}</el-descriptions-item>
              <el-descriptions-item label="证件号码">{{ detailData.ownerPersonal?.idNo || "-" }}</el-descriptions-item>
              <el-descriptions-item label="标签">{{ tagsText(detailData.ownerPersonal?.tags) }}</el-descriptions-item>
              <el-descriptions-item label="收款人姓名">{{ detailData.ownerPersonal?.payeeName || "-" }}</el-descriptions-item>
              <el-descriptions-item label="收款人电话">{{ detailData.ownerPersonal?.payeePhone || "-" }}</el-descriptions-item>
              <el-descriptions-item label="收款人证件类型">{{ idTypeText(detailData.ownerPersonal?.payeeIdType) }}</el-descriptions-item>
              <el-descriptions-item label="收款人证件号码">{{ detailData.ownerPersonal?.payeeIdNo || "-" }}</el-descriptions-item>
              <el-descriptions-item label="银行卡开户名">{{ detailData.ownerPersonal?.bankAccountName || "-" }}</el-descriptions-item>
              <el-descriptions-item label="银行卡号">{{ detailData.ownerPersonal?.bankAccountNo || "-" }}</el-descriptions-item>
              <el-descriptions-item label="开户行">{{ detailData.ownerPersonal?.bankName || "-" }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="3">{{ detailData.ownerPersonal?.remark || "-" }}</el-descriptions-item>
            </template>
            <template v-else>
              <el-descriptions-item label="企业名称">{{ detailData.ownerCompany?.name || "-" }}</el-descriptions-item>
              <el-descriptions-item label="统一信用代码">{{ detailData.ownerCompany?.uscc || "-" }}</el-descriptions-item>
              <el-descriptions-item label="法定代表人">{{ detailData.ownerCompany?.legalPerson || "-" }}</el-descriptions-item>
              <el-descriptions-item label="法人证件类型">{{ idTypeText(detailData.ownerCompany?.legalPersonIdType) }}</el-descriptions-item>
              <el-descriptions-item label="法人证件号码">{{ detailData.ownerCompany?.legalPersonIdNo || "-" }}</el-descriptions-item>
              <el-descriptions-item label="联系人姓名">{{ detailData.ownerCompany?.contactName || "-" }}</el-descriptions-item>
              <el-descriptions-item label="联系人电话">{{ detailData.ownerCompany?.contactPhone || "-" }}</el-descriptions-item>
              <el-descriptions-item label="注册地址">{{ detailData.ownerCompany?.registeredAddress || "-" }}</el-descriptions-item>
              <el-descriptions-item label="标签">{{ tagsText(detailData.ownerCompany?.tags) }}</el-descriptions-item>
              <el-descriptions-item label="收款人姓名">{{ detailData.ownerCompany?.payeeName || "-" }}</el-descriptions-item>
              <el-descriptions-item label="收款人电话">{{ detailData.ownerCompany?.payeePhone || "-" }}</el-descriptions-item>
              <el-descriptions-item label="收款人证件类型">{{ idTypeText(detailData.ownerCompany?.payeeIdType) }}</el-descriptions-item>
              <el-descriptions-item label="收款人证件号码">{{ detailData.ownerCompany?.payeeIdNo || "-" }}</el-descriptions-item>
              <el-descriptions-item label="银行卡开户名">{{ detailData.ownerCompany?.bankAccountName || "-" }}</el-descriptions-item>
              <el-descriptions-item label="银行卡号">{{ detailData.ownerCompany?.bankAccountNo || "-" }}</el-descriptions-item>
              <el-descriptions-item label="开户行">{{ detailData.ownerCompany?.bankName || "-" }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="3">{{ detailData.ownerCompany?.remark || "-" }}</el-descriptions-item>
            </template>
          </el-descriptions>

          <div class="image-preview-group">
            <template v-if="detailData.ownerType === 0">
              <div v-for="card in personalImageCards" :key="card.label" class="image-preview-card">
                <div class="image-preview-card__label">{{ card.label }}</div>
                <el-image v-if="card.url" :src="card.url" fit="cover" class="image-preview-card__image" :preview-src-list="[card.url]" preview-teleported />
                <div v-else class="image-preview-card__empty">未上传</div>
              </div>
            </template>
            <template v-else>
              <div class="image-preview-card">
                <div class="image-preview-card__label">营业执照</div>
                <el-image
                  v-if="detailData.ownerCompany?.businessLicenseUrls?.[0]"
                  :src="detailData.ownerCompany.businessLicenseUrls[0]"
                  fit="cover"
                  class="image-preview-card__image"
                  :preview-src-list="detailData.ownerCompany.businessLicenseUrls"
                  preview-teleported
                />
                <div v-else class="image-preview-card__empty">未上传</div>
              </div>
            </template>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="合同信息" name="contract">
        <el-card shadow="never" class="detail-card">
          <template #header><span>合同信息</span></template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="合同模板">{{ detailData.contractTemplateName || detailTemplate?.templateName || detailData.ownerContract?.contractTemplateId || "-" }}</el-descriptions-item>
            <el-descriptions-item label="合同周期">{{ formatDate(detailData.ownerContract?.contractStart) }} 至 {{ formatDate(detailData.ownerContract?.contractEnd) }}</el-descriptions-item>
            <el-descriptions-item label="合同状态">{{ statusLabelMap[detailData.ownerContract?.status ?? 1] }}</el-descriptions-item>
            <el-descriptions-item label="签署状态">{{ signStatusLabelMap[detailData.ownerContract?.signStatus ?? 0] }}</el-descriptions-item>
            <el-descriptions-item label="签约类型">{{ signTypeLabelMap[detailData.ownerContract?.signType || "NEW"] }}</el-descriptions-item>
            <el-descriptions-item label="合同性质">{{ contractNatureText(detailData.ownerContract?.contractNature) }}</el-descriptions-item>
            <el-descriptions-item label="合同介质">{{ contractMediumLabelMap[detailData.ownerContract?.contractMedium || "PAPER"] }}</el-descriptions-item>
            <el-descriptions-item label="通知业主">{{ detailData.ownerContract?.notifyOwner ? "是" : "否" }}</el-descriptions-item>
            <el-descriptions-item label="审批状态">{{ approvalStatusText(detailData.ownerContract?.approvalStatus) }}</el-descriptions-item>
            <el-descriptions-item label="来源合同">{{ detailData.ownerContract?.renewFromContractNo || detailData.ownerContract?.parentContractId || "-" }}</el-descriptions-item>
            <el-descriptions-item label="退房状态">{{ detailData.ownerContract?.checkoutStatus === 1 ? "已退房" : "未退房" }}</el-descriptions-item>
            <el-descriptions-item label="退房日期">{{ formatDate(detailData.ownerContract?.checkoutDate) }}</el-descriptions-item>
            <el-descriptions-item label="退房操作人">{{ detailData.ownerContract?.checkoutByName || detailData.ownerContract?.checkoutBy || "-" }}</el-descriptions-item>
            <el-descriptions-item label="退房操作时间">{{ detailData.ownerContract?.checkoutAt || "-" }}</el-descriptions-item>
            <el-descriptions-item label="退房原因" :span="3">{{ detailData.ownerContract?.checkoutReason || "-" }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ detailData.createByName || detailData.createBy || "-" }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ detailData.createAt || "-" }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ detailData.updateAt || "-" }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="3">{{ detailData.ownerContract?.remark || "-" }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never" class="detail-card">
          <template #header><span>模板预览信息</span></template>
          <div class="template-preview-panel">
            <div class="template-preview-metrics">
              <div class="template-preview-metric">
                <span class="template-preview-metric__label">模板名称</span>
                <span class="template-preview-metric__value">{{ detailData.contractTemplateName || detailTemplate?.templateName || "-" }}</span>
              </div>
              <div class="template-preview-metric">
                <span class="template-preview-metric__label">快照字段</span>
                <span class="template-preview-metric__value">{{ detailTemplatePlaceholders.length }}</span>
              </div>
              <div class="template-preview-metric">
                <span class="template-preview-metric__label">可直接识别</span>
                <span class="template-preview-metric__value">{{ detailTemplateResolvedCount }}</span>
              </div>
              <div class="template-preview-metric">
                <span class="template-preview-metric__label">快照长度</span>
                <span class="template-preview-metric__value">{{ detailTemplateTextLength }}</span>
              </div>
            </div>
            <div class="template-token-list">
              <el-tag v-for="key in detailTemplatePlaceholders" :key="key" effect="plain">{{ getTemplateLabel(key) }}</el-tag>
            </div>
            <div class="template-preview-grid">
              <div v-for="item in detailTemplatePreviewFields" :key="item.key" class="template-preview-item">
                <div class="template-preview-item__label">{{ item.label }}</div>
                <div class="template-preview-item__value">{{ item.value }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="条款信息" name="clause">
        <template v-if="detailData.ownerContract?.cooperationMode === 'LIGHT_MANAGED'">
          <el-card shadow="never" class="detail-card">
            <template #header><span>轻托管合同房源条款</span></template>
            <el-table :data="detailData.contractSubjectList || []" border>
              <el-table-column prop="subjectName" label="合同房源" min-width="180" />
              <el-table-column label="结算模式" min-width="120">
                <template #default="{ row }">{{ settlementModeLabelMap[row.settlementRule?.settlementMode || "FIXED"] }}</template>
              </el-table-column>
              <el-table-column label="收入口径" min-width="100">
                <template #default="{ row }">{{ incomeBasisLabelMap[row.settlementRule?.incomeBasis || "RECEIVED"] }}</template>
              </el-table-column>
              <el-table-column label="保底租金" min-width="100">
                <template #default="{ row }">
                  {{ row.settlementRule?.hasGuaranteedRent ? formatMoney(row.settlementRule?.guaranteedRentAmount) : "无保底" }}
                </template>
              </el-table-column>
              <el-table-column label="佣金" min-width="120">
                <template #default="{ row }">{{ feeModeLabelMap[row.settlementRule?.commissionMode || "RATIO"] }} / {{ formatMoney(row.settlementRule?.commissionValue) }}</template>
              </el-table-column>
              <el-table-column label="管理费" min-width="150">
                <template #default="{ row }">
                  {{
                    row.settlementRule?.managementFeeEnabled
                      ? `${feeModeLabelMap[row.settlementRule?.managementFeeMode || "RATIO"]} / ${formatMoney(row.settlementRule?.managementFeeValue)}`
                      : "未收取"
                  }}
                </template>
              </el-table-column>
              <el-table-column label="手续费承担" min-width="160">
                <template #default="{ row }">{{ paymentFeeBearTypeLabelMap[row.settlementRule?.paymentFeeBearType || "PLATFORM_ALL"] }}</template>
              </el-table-column>
              <el-table-column label="分账时间" min-width="180">
                <template #default="{ row }">{{ settlementTimingLabelMap[row.settlementRule?.settlementTiming || "TENANT_PAYMENT_REALTIME"] }}</template>
              </el-table-column>
              <el-table-column label="免租规则" min-width="220">
                <template #default="{ row }">
                  {{
                    row.rentFreeRule?.enabled
                      ? `${freeTypeLabelMap[row.rentFreeRule?.freeType || "BUILT_IN"]} / ${bearTypeLabelMap[row.rentFreeRule?.bearType || "PLATFORM"]} / ${formatDate(row.rentFreeRule?.startDate)} - ${formatDate(row.rentFreeRule?.endDate)}`
                      : "未启用"
                  }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </template>
        <template v-else>
          <el-card shadow="never" class="detail-card">
            <template #header><span>包租条款</span></template>
            <el-descriptions :column="4" border>
              <el-descriptions-item label="总月租金">{{ formatMoney(detailData.ownerLeaseRule?.rentAmount) }}</el-descriptions-item>
              <el-descriptions-item label="总押金">{{ formatMoney(detailData.ownerLeaseRule?.depositAmount) }}</el-descriptions-item>
              <el-descriptions-item label="押金月数">{{ detailData.ownerLeaseRule?.depositMonths || 0 }}</el-descriptions-item>
              <el-descriptions-item label="付款月数">{{ detailData.ownerLeaseRule?.paymentMonths || 0 }}</el-descriptions-item>
              <el-descriptions-item label="付款方式">{{ detailData.ownerLeaseRule?.payWay || "-" }}</el-descriptions-item>
              <el-descriptions-item label="付款设置">{{ getRentDueTypeText(detailData.ownerLeaseRule) }}</el-descriptions-item>
              <el-descriptions-item label="折算方式">{{ prorateTypeLabelMap[detailData.ownerLeaseRule?.prorateType || "BY_DAYS"] }}</el-descriptions-item>
              <el-descriptions-item label="交房日期">{{ formatDate(detailData.ownerLeaseRule?.handoverDate) }}</el-descriptions-item>
              <el-descriptions-item label="承租用途">{{ detailData.ownerLeaseRule?.usageType || "-" }}</el-descriptions-item>
            </el-descriptions>

            <el-table v-if="detailData.ownerLeaseRule?.otherFeeList?.length" :data="detailData.ownerLeaseRule.otherFeeList" border class="mt-4">
              <el-table-column prop="name" label="费用名称" min-width="160" />
              <el-table-column prop="paymentMethod" label="收支方向" min-width="120" />
              <el-table-column prop="priceMethod" label="金额方式" min-width="120" />
              <el-table-column prop="priceInput" label="金额/比例" min-width="120" />
            </el-table>
          </el-card>
        </template>
      </el-tab-pane>

      <el-tab-pane v-if="isLightManaged" label="业主结算单" name="settlementBill">
        <OwnerSettlementBillEntry :owner-id="detailData.ownerId" :contract-id="detailData.ownerContract?.id" embedded />
      </el-tab-pane>

      <el-tab-pane v-if="isLightManaged" label="业主提现" name="withdraw">
        <OwnerWithdrawEntry :owner-id="detailData.ownerId" :contract-id="detailData.ownerContract?.id" embedded />
      </el-tab-pane>

      <el-tab-pane v-if="isMasterLease" label="包租应付账单" name="payableBill">
        <OwnerPayableBillEntry :owner-id="detailData.ownerId" :contract-id="detailData.ownerContract?.id" embedded />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import { getMyAvailableContractTemplates, getContractTemplateParams } from "@/api/contract/template";
  import OwnerSettlementBillEntry from "@/views/finance/owner-settlement-bill/index.vue";
  import OwnerWithdrawEntry from "@/views/finance/owner-withdraw/index.vue";
  import OwnerPayableBillEntry from "@/views/finance/owner-payable-bill/index.vue";
  import { BizApprovalStatusEnumMeta, GenderEnumMeta, IdTypeEnumMeta } from "@/types/generated/enum.meta";
  import type { ContractTemplateListVo, OwnerContractDto, OwnerContractSubjectDto, OwnerDetailVo, OwnerLeaseRuleDto } from "@/types/generated";

  type OwnerDetailData = OwnerDetailVo & {
    contractTemplateName?: string;
    contractSubjectList?: Array<OwnerContractSubjectDto & {
      subjectType?: OwnerContractSubjectDto["subjectType"];
      settlementRule?: any;
      rentFreeRule?: any;
    }>;
    subjectCount?: number;
    configuredSubjectCount?: number;
    ownerPersonal?: OwnerDetailVo["ownerPersonal"] & {
      payeeName?: string;
      payeePhone?: string;
      bankAccountNo?: string;
      idCardFrontList?: string[];
      idCardBackList?: string[];
      idCardInHandList?: string[];
      otherImageList?: string[];
    };
    ownerCompany?: OwnerDetailVo["ownerCompany"] & {
      payeeName?: string;
      payeePhone?: string;
      bankAccountNo?: string;
      businessLicenseUrls?: string[];
    };
    ownerContract?: OwnerDetailVo["ownerContract"] & {
      signType?: OwnerContractDto["signType"];
      contractMedium?: OwnerContractDto["contractMedium"];
      notifyOwner?: boolean;
    };
    ownerLeaseRule?: OwnerLeaseRuleDto & {
      handoverDate?: string;
      usageType?: string;
      otherFeeList?: OwnerLeaseRuleDto["otherFeeList"];
    };
  };
  const props = defineProps<{ formInline?: OwnerDetailData | null }>();
  const detailData = computed(() => props.formInline as OwnerDetailData | null | undefined);
  const activeTab = ref("owner");
  const contractTemplates = ref<ContractTemplateListVo[]>([]);
  const templateParams = ref<{ key: string; label: string }[]>([]);

  const ownerTypeLabelMap = { 0: "个人", 1: "企业" } as const;
  const cooperationModeLabelMap = { LIGHT_MANAGED: "轻托管", MASTER_LEASE: "包租" } as const;
  const signStatusLabelMap = { 0: "待签字", 1: "已签字" } as const;
  const signTypeLabelMap = { NEW: "新签", RENEW: "续签" } as const;
  const contractMediumLabelMap = { ELECTRONIC: "电子合同", PAPER: "纸质合同" } as const;
  const statusLabelMap = { 0: "待审核", 1: "待签字", 2: "已签字", 3: "已退房", [-1]: "已作废" } as const;
  const settlementModeLabelMap = { FIXED: "固定保底", SHARE_GROSS: "毛收分成", SHARE_NET: "净收分成", GUARANTEE_PLUS_SHARE: "保底加分成", AGENCY: "代收代付" } as const;
  const incomeBasisLabelMap = { RECEIVED: "按实收", RECEIVABLE: "按应收" } as const;
  const feeModeLabelMap = { RATIO: "按比例", FIXED: "固定金额" } as const;
  const bearTypeLabelMap = { PLATFORM: "平台承担", OWNER: "业主承担", SHARED: "共同承担" } as const;
  const freeTypeLabelMap = { BUILT_IN: "内置免租", OUTSIDE: "外置免租" } as const;
  const paymentFeeBearTypeLabelMap = { PLATFORM_ALL: "公司承担 100%", OWNER_ALL: "业主承担 100%", BY_INCOME_SHARE: "各自承担自己所得" } as const;
  const settlementTimingLabelMap = {
    TENANT_PAYMENT_REALTIME: "租客支付实时分账",
    LEASE_START_GENERATE_BILL: "起租日直接给业主生成账单"
  } as const;
  const prorateTypeLabelMap = { BY_DAYS: "按天折算", FULL_PERIOD: "整期计费" } as const;
  const rentDueTypeLabelMap = { 1: "提前付款", 2: "固定付款", 3: "延后付款" } as const;

  const detailOwnerName = computed(() => {
    if (!detailData.value) return "-";
    return detailData.value.ownerType === 1 ? detailData.value.ownerCompany?.name || "-" : detailData.value.ownerPersonal?.name || "-";
  });
  const isMasterLease = computed(() => detailData.value?.ownerContract?.cooperationMode === "MASTER_LEASE");
  const isLightManaged = computed(() => !isMasterLease.value);
  const detailTemplate = computed(() => contractTemplates.value.find(item => String(item.id || "") === String(detailData.value?.ownerContract?.contractTemplateId || "")));
  const detailTemplatePlaceholders = computed(() => extractTemplatePlaceholders(detailData.value?.ownerContract?.contractContent || detailTemplate.value?.templateContent));
  const detailTemplateTextLength = computed(() => getTemplateTextLength(detailData.value?.ownerContract?.contractContent || detailTemplate.value?.templateContent));
  const templateParamLabelMap = computed(() => templateParams.value.reduce<Record<string, string>>((acc, item) => ((acc[item.key] = item.label), acc), {}));
  const detailTemplatePreviewFields = computed(() => buildTemplatePreviewFields(detailTemplatePlaceholders.value));
  const detailTemplateResolvedCount = computed(() => detailTemplatePreviewFields.value.filter(item => item.value !== "签约时自动生成").length);
  const personalImageCards = computed(() => {
    const personal = detailData.value?.ownerPersonal;
    return [
      { label: "身份证国徽面", url: personal?.idCardFrontList?.[0] || "" },
      { label: "身份证人像面", url: personal?.idCardBackList?.[0] || "" },
      { label: "手持身份证照", url: personal?.idCardInHandList?.[0] || "" },
      { label: "其他附件", url: personal?.otherImageList?.[0] || "" }
    ];
  });

  function formatDate(value?: string | number | Date) {
    if (!value) return "-";
    if (typeof value === "string") return value.slice(0, 10);
    return String(value).slice(0, 10);
  }

  function formatMoney(value?: number | string | null) {
    if (value === null || value === undefined || value === "") return "-";
    return Number(value).toFixed(2);
  }

  function formatArea(value?: number | string | null) {
    if (value === null || value === undefined || value === "") return "0";
    return Number(value).toFixed(2);
  }

  function idTypeText(value?: number) {
    return Object.values(IdTypeEnumMeta).find(item => item.code === value)?.name || "-";
  }

  function genderText(value?: number) {
    return Object.values(GenderEnumMeta).find(item => item.code === value)?.name || "-";
  }

  function tagsText(value?: string[]) {
    return value?.length ? value.join("，") : "-";
  }

  function approvalStatusText(value?: number) {
    return Object.values(BizApprovalStatusEnumMeta).find(item => item.code === value)?.name || "-";
  }

  function contractNatureText(value?: number) {
    if (value === 2) return "续约";
    if (value === 1) return "新签";
    return "-";
  }

  function getRentDueTypeText(rule?: OwnerLeaseRuleDto) {
    if (!rule?.rentDueType) return "-";
    const rentDueType = rule.rentDueType as keyof typeof rentDueTypeLabelMap;
    const label = rentDueTypeLabelMap[rentDueType] || rule.rentDueType;
    if (rentDueType === 2) {
      return `${label}${rule.rentDueDay ? ` ${rule.rentDueDay} 日` : ""}`;
    }
    return `${label}${rule.rentDueOffsetDays ? ` ${rule.rentDueOffsetDays} 天` : " 0 天"}`;
  }

  function getTemplateLabel(key: string) {
    return templateParamLabelMap.value[key] || key.replace(/^\$\{|\}$/g, "");
  }

  function extractTemplatePlaceholders(content?: string) {
    if (!content) return [];
    return Array.from(new Set(content.match(/\$\{[^}]+\}/g) || []));
  }

  function getTemplateTextLength(content?: string) {
    if (!content) return 0;
    return content.replace(/<[^>]+>/g, "").replace(/\s+/g, "").length;
  }

  function buildTemplatePreviewFields(keys: string[]) {
    const houses = (detailData.value?.contractSubjectList || []) as any[];
    const ownerName = detailOwnerName.value === "-" ? "" : detailOwnerName.value;
    const houseNames = houses.map(item => item.subjectName).filter(Boolean).join("，");
    const totalArea = Number(detailData.value?.totalArea || 0);
    const mapping: Record<string, string> = {
      "${业主合同编号}": detailData.value?.ownerContract?.contractNo || "签约时自动生成",
      "${签约房源列表}": houseNames,
      "${小区/项目名称}": houseNames,
      "${房屋总面积}": totalArea > 0 ? totalArea.toFixed(2) : "",
      "${签约面积数}": totalArea > 0 ? totalArea.toFixed(2) : "",
      "${租客姓名}": ownerName
    };
    return keys.map(key => ({ key, label: getTemplateLabel(key), value: mapping[key] || "签约时自动生成" }));
  }

  onMounted(async () => {
    const [templatesResp, paramsResp] = await Promise.all([getMyAvailableContractTemplates({ contractType: 2 }), getContractTemplateParams({ contractType: 2 })]);
    contractTemplates.value = (templatesResp.data || []) as ContractTemplateListVo[];
    templateParams.value = (paramsResp.data || []).map((item: any) => ({ key: item.key || "", label: item.value || item.key || "" }));
  });

</script>

<style scoped lang="scss">
  .overview-bar,
  .template-preview-metrics,
  .template-token-list,
  .template-preview-grid {
    margin-bottom: 8px;
  }

  .overview-bar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
  }

  .overview-bar__section {
    display: flex;
    gap: 12px;
    align-items: center;
    min-width: 0;
  }

  .overview-bar__label {
    display: inline-flex;
    flex: none;
    align-items: center;
    min-width: 72px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .room-chip-list,
  .summary-strip {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .room-chip {
    max-width: 320px;
  }

  .summary-strip__item {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    min-height: 28px;
    padding-right: 14px;
    border-right: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-right: 0;
    }
  }

  .summary-strip__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .summary-strip__value {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .template-preview-metric,
  .template-preview-item {
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    background: var(--el-bg-color);
    padding: 16px;
  }

  .template-preview-metric__label,
  .template-preview-item__label {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .template-preview-metric__value {
    font-size: 24px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .detail-card {
    margin-bottom: 8px;
  }

  .template-preview-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .template-token-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .image-preview-group {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .image-preview-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    padding: 12px;
    background: var(--el-fill-color-extra-light);
  }

  .image-preview-card__label {
    margin-bottom: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .image-preview-card__image {
    width: 100%;
    height: 88px;
    border-radius: 8px;
    overflow: hidden;
  }

  .image-preview-card__empty {
    height: 88px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    color: var(--el-text-color-secondary);
  }

  .modern-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 8px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-radius: 10px;
    }

    :deep(.el-tabs__nav-wrap) {
      padding: 0 12px;

      &::after {
        height: 0;
      }
    }

    :deep(.pf-page) {
      padding: 0;
    }

    :deep(.summary-block) {
      margin-bottom: 8px;
    }

    :deep(.filter-card) {
      margin-bottom: 8px !important;
    }
  }
</style>
