<template>
  <div v-if="detailData" class="owner-detail-view">
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

    <div class="tabs-wrapper">
      <el-tabs v-model="activeTab" class="modern-tabs">
        <el-tab-pane name="owner">
          <template #label>
            <el-space>
              <el-icon><User /></el-icon>
              <span>业主信息</span>
            </el-space>
          </template>
          <div class="tab-content">
            <section class="info-section">
              <el-descriptions :column="5" class="info-descriptions" size="default">
                <template #title>
                  <el-space>
                    <span>基本信息</span>
                    <el-tag :type="detailData.ownerType === 0 ? 'success' : 'warning'" size="default">
                      {{ ownerTypeLabelMap[detailData.ownerType as keyof typeof ownerTypeLabelMap] || "-" }}
                    </el-tag>
                  </el-space>
                </template>
                <template v-if="detailData.ownerType === 0">
                  <el-descriptions-item label="姓名" label-align="right">
                    <span class="text-value">{{ detailData.ownerPersonal?.name || "-" }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="性别" label-align="right">{{ genderText(detailData.ownerPersonal?.gender) }}</el-descriptions-item>
                  <el-descriptions-item label="联系电话" label-align="right">
                    <span class="text-value">{{ detailData.ownerPersonal?.phone || "-" }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="证件类型" label-align="right">
                    <span class="text-value">{{ idTypeText(detailData.ownerPersonal?.idType) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="证件号码" label-align="right">
                    <span class="text-value">{{ detailData.ownerPersonal?.idNo || "-" }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="业主标签" label-align="right" :span="2">
                    <span class="text-value">{{ tagsText(detailData.ownerPersonal?.tags) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="备注" label-align="right" :span="3">
                    <span class="text-value">{{ detailData.ownerPersonal?.remark || "-" }}</span>
                  </el-descriptions-item>
                </template>
                <template v-else>
                  <el-descriptions-item label="企业名称" label-align="right">
                    <span class="text-value">{{ detailData.ownerCompany?.name || "-" }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="统一信用代码" label-align="right">
                    <span class="text-value">{{ detailData.ownerCompany?.uscc || "-" }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="法定代表人" label-align="right">
                    <span class="text-value">{{ detailData.ownerCompany?.legalPerson || "-" }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="法人证件类型" label-align="right">
                    <span class="text-value">{{ idTypeText(detailData.ownerCompany?.legalPersonIdType) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="法人证件号码" label-align="right">
                    <span class="text-value">{{ detailData.ownerCompany?.legalPersonIdNo || "-" }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="联系人姓名" label-align="right">
                    <span class="text-value">{{ detailData.ownerCompany?.contactName || "-" }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="联系人电话" label-align="right">
                    <span class="text-value">{{ detailData.ownerCompany?.contactPhone || "-" }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="注册地址" label-align="right" :span="2">
                    <span class="text-value">{{ detailData.ownerCompany?.registeredAddress || "-" }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="业主标签" label-align="right">
                    <span class="text-value">{{ tagsText(detailData.ownerCompany?.tags) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="备注" label-align="right" :span="5">
                    <span class="text-value">{{ detailData.ownerCompany?.remark || "-" }}</span>
                  </el-descriptions-item>
                </template>
              </el-descriptions>

              <div v-if="hasOwnerPhotos" class="photo-wall photo-wall--grouped">
                <div v-for="group in ownerPhotoGroups" :key="group.key" class="photo-group">
                  <div class="photo-group__title">
                    <span>{{ group.label }}</span>
                    <el-tag size="small" type="info" effect="plain">{{ group.urls.length }} 张</el-tag>
                  </div>
                  <div class="photo-group__list">
                    <div v-for="(url, index) in group.urls" :key="`${group.key}-${url}-${index}`" class="photo-item">
                      <el-image
                        style="width: 100px; height: 100px; border-radius: 10px"
                        :src="url"
                        :zoom-rate="1.2"
                        :max-scale="7"
                        :min-scale="0.2"
                        :preview-src-list="group.urls"
                        :initial-index="index"
                        fit="cover"
                        loading="lazy"
                        preview-teleported
                      />
                      <div class="photo-item__label">{{ group.label }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无证件照片" :image-size="72" />
            </section>

            <section class="info-section">
              <el-descriptions title="收款信息" :column="4" class="info-descriptions" size="default">
                <el-descriptions-item label="收款人姓名" label-align="right">
                  <span class="text-value">{{ ownerPayeeInfo.payeeName || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="收款人电话" label-align="right">
                  <span class="text-value">{{ ownerPayeeInfo.payeePhone || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="收款人证件类型" label-align="right">
                  <span class="text-value">{{ idTypeText(ownerPayeeInfo.payeeIdType) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="收款人证件号码" label-align="right">
                  <span class="text-value">{{ ownerPayeeInfo.payeeIdNo || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="银行卡开户名" label-align="right">
                  <span class="text-value">{{ ownerPayeeInfo.bankAccountName || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="银行卡号" label-align="right">
                  <span class="text-value">{{ ownerPayeeInfo.bankAccountNo || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="开户行" label-align="right" :span="2">
                  <span class="text-value">{{ ownerPayeeInfo.bankName || "-" }}</span>
                </el-descriptions-item>
              </el-descriptions>
            </section>

            <section class="info-section">
              <el-descriptions title="合同信息" :column="4" class="info-descriptions" size="default">
                <el-descriptions-item label="合同模板" label-align="right">
                  <span class="text-value">{{ detailData.contractTemplateName || detailTemplate?.templateName || detailData.ownerContract?.contractTemplateId || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="合同周期" label-align="right">
                  <span class="text-value">{{ formatDate(detailData.ownerContract?.contractStart) }} 至 {{ formatDate(detailData.ownerContract?.contractEnd) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="合同状态" label-align="right">
                  <span class="text-value">{{ statusLabelMap[detailData.ownerContract?.status ?? 1] }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="签署状态" label-align="right">
                  <span class="text-value">{{ signStatusLabelMap[detailData.ownerContract?.signStatus ?? 0] }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="签约类型" label-align="right">
                  <span class="text-value">{{ signTypeLabelMap[detailData.ownerContract?.signType || "NEW"] }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="合同性质" label-align="right">
                  <span class="text-value">{{ contractNatureText(detailData.ownerContract?.contractNature) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="合同介质" label-align="right">
                  <span class="text-value">{{ contractMediumLabelMap[detailData.ownerContract?.contractMedium || "PAPER"] }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="审批状态" label-align="right">
                  <span class="text-value">{{ approvalStatusText(detailData.ownerContract?.approvalStatus) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="通知业主" label-align="right">
                  <span class="text-value">{{ detailData.ownerContract?.notifyOwner ? "是" : "否" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="来源合同" label-align="right">
                  <span class="text-value">{{ detailData.ownerContract?.renewFromContractNo || detailData.ownerContract?.parentContractId || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="退房状态" label-align="right">
                  <span class="text-value">{{ detailData.ownerContract?.checkoutStatus === 1 ? "已退房" : "未退房" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="退房日期" label-align="right">
                  <span class="text-value">{{ formatDate(detailData.ownerContract?.checkoutDate) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="退房操作人" label-align="right">
                  <span class="text-value">{{ detailData.ownerContract?.checkoutByName || detailData.ownerContract?.checkoutBy || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="退房操作时间" label-align="right">
                  <span class="text-value">{{ detailData.ownerContract?.checkoutAt || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间" label-align="right">
                  <span class="text-value">{{ detailData.createAt || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="更新时间" label-align="right">
                  <span class="text-value">{{ detailData.updateAt || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="退房原因" label-align="right" :span="2">
                  <span class="text-value">{{ detailData.ownerContract?.checkoutReason || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="备注" label-align="right" :span="2">
                  <span class="text-value">{{ detailData.ownerContract?.remark || "-" }}</span>
                </el-descriptions-item>
              </el-descriptions>
            </section>

            <section class="info-section">
              <div class="section-title">条款信息</div>
              <template v-if="detailData.ownerContract?.cooperationMode === 'LIGHT_MANAGED'">
                <div class="settlement-mode-summary-list">
                  <div v-for="item in settlementModeDescriptionList" :key="item.value" class="settlement-mode-summary">
                    <div class="settlement-mode-summary__main">
                      <span class="settlement-mode-summary__label">{{ item.label }}</span>
                      <span class="settlement-mode-summary__desc">{{ item.desc }}</span>
                    </div>
                    <div v-if="item.features.length" class="settlement-mode-summary__features">
                      <el-tag v-for="feature in item.features" :key="feature" size="small" effect="plain">{{ feature }}</el-tag>
                    </div>
                  </div>
                </div>
                <el-table :data="detailData.contractSubjectList || []" border stripe>
                  <el-table-column prop="subjectName" label="合同房源" min-width="300" />
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
                    <template #default="{ row }">
                      {{ feeModeLabelMap[row.settlementRule?.commissionMode || "RATIO"] }} / {{ formatMoney(row.settlementRule?.commissionValue) }}
                    </template>
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
                </el-table>
              </template>
              <template v-else>
                <el-descriptions :column="4" class="info-descriptions" size="default">
                  <el-descriptions-item label="总月租金" label-align="right">
                    <span class="text-value">{{ formatMoney(detailData.ownerLeaseRule?.rentAmount) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="总押金" label-align="right">
                    <span class="text-value">{{ formatMoney(detailData.ownerLeaseRule?.depositAmount) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="押金月数" label-align="right">{{ detailData.ownerLeaseRule?.depositMonths || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="付款月数" label-align="right">{{ detailData.ownerLeaseRule?.paymentMonths || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="付款方式" label-align="right">{{ detailData.ownerLeaseRule?.payWay || "-" }}</el-descriptions-item>
                  <el-descriptions-item label="付款设置" label-align="right">{{ getRentDueTypeText(detailData.ownerLeaseRule) }}</el-descriptions-item>
                  <el-descriptions-item label="折算方式" label-align="right">{{ prorateTypeLabelMap[detailData.ownerLeaseRule?.prorateType || "BY_DAYS"] }}</el-descriptions-item>
                  <el-descriptions-item label="交房日期" label-align="right">{{ formatDate(detailData.ownerLeaseRule?.handoverDate) }}</el-descriptions-item>
                  <el-descriptions-item label="承租用途" label-align="right">{{ detailData.ownerLeaseRule?.usageType || "-" }}</el-descriptions-item>
                </el-descriptions>
                <el-table v-if="detailData.ownerLeaseRule?.otherFeeList?.length" :data="detailData.ownerLeaseRule.otherFeeList" border stripe class="mt-3">
                  <el-table-column prop="name" label="费用名称" min-width="160" />
                  <el-table-column prop="paymentMethod" label="收支方向" min-width="120" />
                  <el-table-column prop="priceMethod" label="金额方式" min-width="120" />
                  <el-table-column prop="priceInput" label="金额/比例" min-width="120" />
                </el-table>
              </template>
            </section>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="isLightManaged" name="settlementBill">
          <template #label>
            <el-space>
              <el-icon><Money /></el-icon>
              <span>业主结算单</span>
            </el-space>
          </template>
          <div class="tab-content">
            <OwnerSettlementBillTab :owner-id="detailData.ownerId" :contract-id="detailData.ownerContract?.id" />
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="isLightManaged" name="withdraw">
          <template #label>
            <el-space>
              <el-icon><Wallet /></el-icon>
              <span>业主提现</span>
            </el-space>
          </template>
          <div class="tab-content">
            <OwnerWithdrawTab
              :owner-id="detailData.ownerId"
              :contract-id="detailData.ownerContract?.id"
              :default-payee-name="ownerPayeeInfo.payeeName || ownerPayeeInfo.bankAccountName"
              :default-payee-account-no="ownerPayeeInfo.bankAccountNo"
              :default-payee-bank-name="ownerPayeeInfo.bankName"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="isMasterLease" name="payableBill">
          <template #label>
            <el-space>
              <el-icon><Money /></el-icon>
              <span>包租应付账单</span>
            </el-space>
          </template>
          <div class="tab-content">
            <OwnerPayableBillTab :owner-id="detailData.ownerId" :contract-id="detailData.ownerContract?.id" />
          </div>
        </el-tab-pane>

        <el-tab-pane name="operateLog">
          <template #label>
            <el-space>
              <el-icon><Clock /></el-icon>
              <span>操作记录</span>
            </el-space>
          </template>
          <div class="tab-content">
            <BizOperateLogPanel
              v-if="activeTab === 'operateLog'"
              :query="ownerOperateLogQuery"
              :field-config="ownerOperateLogFieldConfig"
              :fallback-label-map="ownerOperateLogFallbackLabelMap"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import { getMyAvailableContractTemplates } from "@/api/contract/template";
  import { getDictDataByDictCode } from "@/api/sys/dict";
  import OwnerSettlementBillTab from "./OwnerSettlementBillTab.vue";
  import OwnerWithdrawTab from "./OwnerWithdrawTab.vue";
  import OwnerPayableBillTab from "./OwnerPayableBillTab.vue";
  import BizOperateLogPanel from "@/shared/biz-operate-log/BizOperateLogPanel.vue";
  import { SETTLEMENT_MODE_OPTIONS } from "@/views/contract/owner/form/ownerContractForm/model/ownerContractFormOptions";
  import { Clock, Money, User, Wallet } from "@element-plus/icons-vue";
  import { BizApprovalStatusEnumMeta, GenderEnumMeta, IdTypeEnumMeta } from "@/types/generated/enum.meta";
  import type { ContractTemplateListVo, OwnerContractDto, OwnerContractSubjectDto, OwnerDetailVo, OwnerLeaseRuleDto } from "@/types/generated";

  type OwnerDetailData = OwnerDetailVo & {
    contractTemplateName?: string;
    contractSubjectList?: Array<
      OwnerContractSubjectDto & {
        subjectType?: OwnerContractSubjectDto["subjectType"];
        settlementRule?: any;
        rentFreeRule?: any;
      }
    >;
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
  type OwnerPayeeInfo = Partial<NonNullable<OwnerDetailData["ownerPersonal"]> & NonNullable<OwnerDetailData["ownerCompany"]>>;
  const props = defineProps<{ formInline?: OwnerDetailData | null }>();
  const detailData = computed(() => props.formInline as OwnerDetailData | null | undefined);
  const activeTab = ref("owner");
  const contractTemplates = ref<ContractTemplateListVo[]>([]);
  const ownerTagLabelMap = ref<Record<string, string>>({});

  const ownerTypeLabelMap = { 0: "个人", 1: "企业" } as const;
  const cooperationModeLabelMap = { LIGHT_MANAGED: "轻托管", MASTER_LEASE: "包租" } as const;
  const signStatusLabelMap = { 0: "待签字", 1: "已签字" } as const;
  const signTypeLabelMap = { NEW: "新签", RENEW: "续签" } as const;
  const contractMediumLabelMap = { ELECTRONIC: "电子合同", PAPER: "纸质合同" } as const;
  const statusLabelMap = { 0: "待审核", 1: "待签字", 2: "已签字", 3: "已退房", [-1]: "已作废" } as const;
  const settlementModeLabelMap = { FIXED: "固定保底", SHARE_GROSS: "毛收分成", SHARE_NET: "净收分成", GUARANTEE_PLUS_SHARE: "保底加分成", AGENCY: "代收代付" } as const;
  const incomeBasisLabelMap = { RECEIVED: "按实收", RECEIVABLE: "按应收" } as const;
  const feeModeLabelMap = { RATIO: "按比例", FIXED: "固定金额" } as const;
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
  const ownerOperateLogQuery = computed(() => ({
    bizType: "OWNER_CONTRACT",
    bizId: detailData.value?.ownerContract?.id,
    sourceType: "OWNER_CONTRACT",
    sourceId: detailData.value?.ownerContract?.id
  }));
  const ownerPayeeInfo = computed<OwnerPayeeInfo>(() => {
    if (detailData.value?.ownerType === 1) {
      return detailData.value?.ownerCompany || {};
    }
    return detailData.value?.ownerPersonal || {};
  });
  const ownerPhotoGroups = computed(() => {
    if (detailData.value?.ownerType === 1) {
      const company = detailData.value?.ownerCompany;
      return [{ key: "businessLicense", label: "营业执照", urls: company?.businessLicenseUrls || [] }].filter(item => item.urls.length > 0);
    }
    const personal = detailData.value?.ownerPersonal;
    return [
      { key: "idCardBack", label: "身份证人像面", urls: personal?.idCardBackList || [] },
      { key: "idCardFront", label: "身份证国徽面", urls: personal?.idCardFrontList || [] },
      { key: "idCardInHand", label: "手持身份证", urls: personal?.idCardInHandList || [] },
      { key: "otherImage", label: "其他材料", urls: personal?.otherImageList || [] }
    ].filter(item => item.urls.length > 0);
  });
  const hasOwnerPhotos = computed(() => ownerPhotoGroups.value.length > 0);
  const settlementModeDescriptionList = computed(() => {
    const modes = Array.from(new Set((detailData.value?.contractSubjectList || []).map(item => item.settlementRule?.settlementMode || "FIXED").filter(Boolean)));
    const effectiveModes = modes.length ? modes : ["FIXED"];
    return effectiveModes.map(mode => {
      const option = SETTLEMENT_MODE_OPTIONS.find(item => item.value === mode);
      return {
        value: mode,
        label: option?.label || settlementModeLabelMap[mode as keyof typeof settlementModeLabelMap] || String(mode),
        desc: option?.desc || "当前结算方式暂无说明。",
        features: option?.features || []
      };
    });
  });

  const formatOwnerType = (value: unknown) => {
    if (value === 0 || value === "0") return "个人业主";
    if (value === 1 || value === "1") return "企业业主";
    return formatSnapshotValue(value);
  };

  const formatOwnerGender = (value: unknown) => {
    const code = Number(value);
    return Number.isFinite(code) ? genderText(code) : formatSnapshotValue(value);
  };

  const formatOwnerIdType = (value: unknown) => {
    const code = Number(value);
    return Number.isFinite(code) ? idTypeText(code) : formatSnapshotValue(value);
  };

  const formatOwnerTags = (value: unknown) => {
    return Array.isArray(value) ? tagsText(value as string[]) : formatSnapshotValue(value);
  };

  const formatContractStatus = (value: unknown) => {
    const code = Number(value);
    return Number.isFinite(code) ? statusLabelMap[code as keyof typeof statusLabelMap] || formatSnapshotValue(value) : formatSnapshotValue(value);
  };

  const ownerOperateLogFieldConfig = [
    { path: "ownerType", label: "业主类型", formatter: formatOwnerType },
    { path: "ownerPersonal.name", label: "业主姓名" },
    { path: "ownerPersonal.gender", label: "性别", formatter: formatOwnerGender },
    { path: "ownerPersonal.phone", label: "联系电话" },
    { path: "ownerPersonal.idType", label: "证件类型", formatter: formatOwnerIdType },
    { path: "ownerPersonal.idNo", label: "证件号码" },
    { path: "ownerPersonal.tags", label: "业主标签", formatter: formatOwnerTags },
    { path: "ownerPersonal.idCardFrontList", label: "身份证国徽面" },
    { path: "ownerPersonal.idCardBackList", label: "身份证人像面" },
    { path: "ownerPersonal.idCardInHandList", label: "手持身份证" },
    { path: "ownerCompany.name", label: "企业名称" },
    { path: "ownerCompany.uscc", label: "统一信用代码" },
    { path: "ownerCompany.legalPerson", label: "法定代表人" },
    { path: "ownerCompany.contactPhone", label: "联系人电话" },
    { path: "ownerCompany.tags", label: "业主标签", formatter: formatOwnerTags },
    { path: "ownerContract.contractNo", label: "合同编号" },
    { path: "ownerContract.status", label: "合同状态", formatter: formatContractStatus },
    { path: "ownerContract.contractStart", label: "合同开始日" },
    { path: "ownerContract.contractEnd", label: "合同结束日" },
    { path: "ownerContract.checkoutReason", label: "退房原因" },
    { path: "ownerContract.voidReason", label: "作废原因" },
    { path: "remark", label: "备注" }
  ];

  const ownerOperateLogFallbackLabelMap: Record<string, string> = {
    name: "名称",
    phone: "联系电话",
    gender: "性别",
    idType: "证件类型",
    idNo: "证件号码",
    tags: "业主标签",
    remark: "备注",
    status: "状态",
    contractNo: "合同编号",
    checkoutReason: "退房原因",
    voidReason: "作废原因"
  };

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
    return value?.length ? value.map(item => ownerTagLabelMap.value[item] || item).join("，") : "-";
  }

  function formatSnapshotValue(value: unknown) {
    if (value === undefined || value === null || value === "") return "—";
    if (Array.isArray(value)) {
      if (!value.length) return "—";
      if (value.every(item => ["string", "number", "boolean"].includes(typeof item))) return value.join("、");
      return `${value.length} 项`;
    }
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
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

  onMounted(async () => {
    const [templatesResp, ownerTagResp] = await Promise.all([getMyAvailableContractTemplates({ contractType: 2 }), getDictDataByDictCode({ dictCode: "owner_tag" })]);
    contractTemplates.value = (templatesResp.data || []) as ContractTemplateListVo[];
    ownerTagLabelMap.value = (ownerTagResp.data || []).reduce<Record<string, string>>((acc: Record<string, string>, item: any) => {
      const code = item.dictCode || item.code || item.value;
      if (code) acc[code] = item.name || item.dictName || code;
      return acc;
    }, {});
  });
</script>

<style scoped lang="scss">
  .owner-detail-view {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .template-preview-metrics,
  .template-token-list,
  .template-preview-grid {
    margin-bottom: 8px;
  }

  .tabs-wrapper {
    padding: 14px 16px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
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

  .tab-content {
    min-height: 810px;
  }

  .info-section {
    margin-bottom: 12px;
    padding: 14px 16px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;

    &:last-child {
      margin-bottom: 0;
    }

    :deep(.el-descriptions__header) {
      margin-bottom: 12px;
    }

    :deep(.el-descriptions__body) {
      background: transparent;
    }

    :deep(.el-descriptions__table) {
      --el-descriptions-table-border: transparent;
    }

    :deep(.el-descriptions__cell) {
      padding-bottom: 10px;
    }

    .section-title {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 10px;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    :deep(.el-table__header) th {
      font-weight: 600;
      color: var(--el-text-color-primary);
      background: var(--el-fill-color-light);
    }
  }

  .settlement-mode-summary-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .settlement-mode-summary {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;

    &__main {
      display: flex;
      gap: 8px;
      align-items: baseline;
      min-width: 0;
    }

    &__label {
      flex: none;
      font-size: var(--el-font-size-base);
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__desc {
      min-width: 0;
      font-size: var(--el-font-size-small);
      line-height: 1.6;
      color: var(--el-text-color-secondary);
    }

    &__features {
      display: flex;
      flex: none;
      gap: 6px;
      align-items: center;
    }
  }

  .text-value {
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  .photo-wall {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;

    &--grouped {
      align-items: flex-start;
    }
  }

  .photo-group {
    min-width: 0;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;

    &__title {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .photo-item {
    position: relative;
    padding: 4px;
    line-height: 0;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 9px;

    &__label {
      position: absolute;
      bottom: 8px;
      left: 8px;
      max-width: calc(100% - 16px);
      padding: 3px 6px;
      overflow: hidden;
      font-size: 11px;
      font-weight: 600;
      line-height: 1;
      color: #fff;
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
      background: rgba(0, 0, 0, 0.55);
      border-radius: 999px;
    }
  }

  .modern-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 14px;
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
