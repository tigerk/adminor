<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
    <div class="form-grid">
      <el-card shadow="never" class="form-card">
        <template #header>
          <div class="card-header">
            <span>业主信息</span>
            <el-space>
              <el-tag effect="plain">{{ ownerTypeLabelMap[form.ownerType] }}</el-tag>
              <el-tag :type="form.ownerContract.cooperationMode === 'MASTER_LEASE' ? 'warning' : 'success'" effect="plain">
                {{ cooperationModeLabelMap[form.ownerContract.cooperationMode] }}
              </el-tag>
            </el-space>
          </div>
        </template>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="业主类型" prop="ownerType">
              <el-segmented v-model="form.ownerType" :options="ownerTypeOptions" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合作模式" prop="ownerContract.cooperationMode">
              <el-segmented v-model="form.ownerContract.cooperationMode" :options="cooperationModeOptions" />
            </el-form-item>
          </el-col>
        </el-row>

        <template v-if="form.ownerType === 'PERSONAL'">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="姓名" prop="ownerPersonal.name">
                <el-input v-model="form.ownerPersonal.name" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="联系电话" prop="ownerPersonal.phone">
                <el-input v-model="form.ownerPersonal.phone" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="证件号码" prop="ownerPersonal.idNo">
                <el-input v-model="form.ownerPersonal.idNo" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
        <template v-else>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="企业名称" prop="ownerCompany.name">
                <el-input v-model="form.ownerCompany.name" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="联系电话" prop="ownerCompany.contactPhone">
                <el-input v-model="form.ownerCompany.contactPhone" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="统一信用代码" prop="ownerCompany.uscc">
                <el-input v-model="form.ownerCompany.uscc" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </el-card>

      <el-card shadow="never" class="form-card">
        <template #header>
          <div class="card-header">
            <span>合同信息</span>
            <el-button link type="primary" @click="handlePreview(form.ownerContract.id)">预览合同</el-button>
          </div>
        </template>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="合同模板" prop="ownerContract.contractTemplateId">
              <el-select v-model="form.ownerContract.contractTemplateId" class="w-full" placeholder="请选择业主合同模板">
                <el-option v-for="item in contractTemplates" :key="item.id" :label="item.templateName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="合同周期" prop="contractDateRange">
              <el-date-picker v-model="contractDateRange" type="daterange" value-format="YYYY-MM-DD" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="签署状态" prop="ownerContract.signStatus">
              <el-select v-model="form.ownerContract.signStatus" class="w-full">
                <el-option v-for="item in signStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="合同状态" prop="ownerContract.status">
              <el-select v-model="form.ownerContract.status" class="w-full">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="ownerContract.remark">
          <el-input v-model="form.ownerContract.remark" type="textarea" :rows="2" placeholder="选填，记录签约补充说明" />
        </el-form-item>

        <div class="template-preview-panel" v-loading="templateParamsLoading">
          <div class="template-preview-panel__header">
            <div>
              <div class="template-preview-panel__title">模板关键字段预览</div>
              <div class="template-preview-panel__desc">选择模板后，自动识别模板变量，并展示当前合同可回填的关键字段。</div>
            </div>
            <el-button link type="primary" :disabled="!selectedTemplate?.id || !form.ownerContract.id" @click="handlePreview(form.ownerContract.id)">预览生成合同</el-button>
          </div>

          <el-empty v-if="!selectedTemplate" description="请选择合同模板后查看关键字段预览" :image-size="70" />

          <template v-else>
            <div class="template-preview-metrics">
              <div class="template-preview-metric">
                <span class="template-preview-metric__label">模板名称</span>
                <span class="template-preview-metric__value">{{ selectedTemplate.templateName || "-" }}</span>
              </div>
              <div class="template-preview-metric">
                <span class="template-preview-metric__label">检测字段</span>
                <span class="template-preview-metric__value">{{ selectedTemplatePlaceholders.length }}</span>
              </div>
              <div class="template-preview-metric">
                <span class="template-preview-metric__label">当前可预览</span>
                <span class="template-preview-metric__value">{{ selectedTemplateResolvedCount }}</span>
              </div>
              <div class="template-preview-metric">
                <span class="template-preview-metric__label">正文长度</span>
                <span class="template-preview-metric__value">{{ selectedTemplateTextLength }}</span>
              </div>
            </div>

            <div class="template-token-list">
              <el-tag v-for="key in selectedTemplatePlaceholders" :key="key" effect="plain" class="template-token">
                {{ getTemplateLabel(key) }}
              </el-tag>
            </div>

            <div class="template-preview-grid">
              <div v-for="item in selectedTemplatePreviewFields" :key="item.key" class="template-preview-item">
                <div class="template-preview-item__label">{{ item.label }}</div>
                <div class="template-preview-item__value">{{ item.value }}</div>
              </div>
            </div>
          </template>
        </div>
      </el-card>
    </div>

    <el-card shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <span>签约房源</span>
          <el-button type="primary" link @click="roomPickerRef?.show(selectedRooms)">选择房源</el-button>
        </div>
      </template>

      <el-form-item label-width="0" prop="contractHouseList">
        <div class="selected-house-wrapper">
          <div class="selected-house-summary">
            <div class="summary-metric">
              <span class="summary-metric__label">已选房源</span>
              <span class="summary-metric__value">{{ form.contractHouseList.length }}</span>
              <span class="summary-metric__unit">套</span>
            </div>
            <div class="summary-metric">
              <span class="summary-metric__label">已配置</span>
              <span class="summary-metric__value">{{ configuredHouseCount }}</span>
              <span class="summary-metric__unit">套</span>
            </div>
          </div>
          <div v-if="form.contractHouseList.length" class="selected-house-list">
            <button
              v-for="item in form.contractHouseList"
              :key="item.houseId"
              type="button"
              :class="['selected-house-card', { active: item.houseId === activeHouseId }]"
              @click="activeHouseId = item.houseId"
            >
              <div class="selected-house-card__title">{{ item.houseName || '未命名房源' }}</div>
              <div class="selected-house-card__meta">
                <span v-if="form.ownerContract.cooperationMode === 'LIGHT_MANAGED'">{{ settlementModeLabelMap[item.settlementRule.settlementMode || 'FIXED'] }}</span>
                <span v-else>已纳入包租合同</span>
              </div>
              <div class="selected-house-card__footer">
                <el-tag size="small" effect="plain" type="success">{{ isHouseConfigured(item) ? "已配置" : "待配置" }}</el-tag>
                <el-button link type="danger" @click.stop="removeHouse(item.houseId)">移除</el-button>
              </div>
            </button>
          </div>
          <el-empty v-else description="请选择一个或多个房源" :image-size="90" />
        </div>
      </el-form-item>
    </el-card>

    <el-card v-if="form.ownerContract.cooperationMode === 'LIGHT_MANAGED'" shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <span>轻托管条款配置</span>
          <span class="card-tip">按房源单独配置结算和免租规则</span>
        </div>
      </template>

      <div v-if="activeContractHouse" class="rule-editor">
        <div class="rule-editor__header">
          <div>
            <div class="rule-editor__title">{{ activeContractHouse.houseName }}</div>
            <div class="rule-editor__desc">当前配置对象</div>
          </div>
          <el-tag effect="plain" type="primary">{{ settlementModeLabelMap[activeContractHouse.settlementRule.settlementMode || 'FIXED'] }}</el-tag>
        </div>

        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="结算模式">
              <el-select v-model="activeContractHouse.settlementRule.settlementMode" class="w-full">
                <el-option v-for="option in settlementModeOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="收入口径">
              <el-select v-model="activeContractHouse.settlementRule.incomeBasis" class="w-full">
                <el-option v-for="option in incomeBasisOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="保底租金">
              <el-input-number v-model="activeContractHouse.settlementRule.guaranteedRentAmount" :min="0" :precision="2" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="佣金值">
              <el-input-number v-model="activeContractHouse.settlementRule.commissionValue" :min="0" :precision="2" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="佣金方式">
              <el-select v-model="activeContractHouse.settlementRule.commissionMode" class="w-full">
                <el-option v-for="option in feeModeOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="服务费方式">
              <el-select v-model="activeContractHouse.settlementRule.serviceFeeMode" class="w-full">
                <el-option v-for="option in feeModeOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="服务费值">
              <el-input-number v-model="activeContractHouse.settlementRule.serviceFeeValue" :min="0" :precision="2" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="免租承担">
              <el-select v-model="activeContractHouse.rentFreeRule.bearType" class="w-full">
                <el-option v-for="option in bearTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="免租类型">
              <el-select v-model="activeContractHouse.rentFreeRule.freeType" class="w-full">
                <el-option v-for="option in freeTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="开始日期">
              <el-date-picker v-model="activeContractHouse.rentFreeRule.startDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="结束日期">
              <el-date-picker v-model="activeContractHouse.rentFreeRule.endDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="计算方式">
              <el-select v-model="activeContractHouse.rentFreeRule.calcMode" class="w-full">
                <el-option v-for="option in lightManagedCalcModeOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      <el-empty v-else description="请先选择房源后再配置条款" :image-size="100" />
    </el-card>

    <el-card v-else shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <span>包租条款</span>
          <span class="card-tip">按合同统一配置总月租金、总押金和付款方式</span>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="总月租金">
            <el-input-number v-model="form.ownerLeaseRule.rentAmount" :min="0" :precision="2" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="总押金">
            <el-input-number v-model="form.ownerLeaseRule.depositAmount" :min="0" :precision="2" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="押金月数">
            <el-input-number v-model="form.ownerLeaseRule.depositMonths" :min="0" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="付款月数">
            <el-input-number v-model="form.ownerLeaseRule.paymentMonths" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="付款方式">
            <el-input v-model="form.ownerLeaseRule.payWay" placeholder="如 押一付三" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="收租类型">
            <el-select v-model="form.ownerLeaseRule.rentDueType" class="w-full">
              <el-option v-for="item in rentDueTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="收租日">
            <el-input-number v-model="form.ownerLeaseRule.rentDueDay" :min="1" :max="31" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="首付日期">
            <el-date-picker v-model="form.ownerLeaseRule.firstPayDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="折算方式">
            <el-select v-model="form.ownerLeaseRule.prorateType" class="w-full">
              <el-option v-for="item in prorateTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <div class="sub-title">
        <span>包租免租规则</span>
        <el-button type="primary" link @click="addLeaseFreeRule">新增规则</el-button>
      </div>
      <el-table :data="form.ownerLeaseFreeRuleList" border>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-select v-model="row.freeType">
              <el-option v-for="item in freeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="开始日期" width="160">
          <template #default="{ row }">
            <el-date-picker v-model="row.startDate" type="date" value-format="YYYY-MM-DD" />
          </template>
        </el-table-column>
        <el-table-column label="结束日期" width="160">
          <template #default="{ row }">
            <el-date-picker v-model="row.endDate" type="date" value-format="YYYY-MM-DD" />
          </template>
        </el-table-column>
        <el-table-column label="计算方式" width="140">
          <template #default="{ row }">
            <el-select v-model="row.calcMode">
              <el-option v-for="item in leaseFreeCalcModeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.freeAmount" :min="0" :precision="2" />
          </template>
        </el-table-column>
        <el-table-column label="比例" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.freeRatio" :min="0" :max="1" :step="0.1" :precision="2" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ $index }">
            <el-button link type="danger" @click="form.ownerLeaseFreeRuleList.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <RoomPicker ref="roomPickerRef" @confirm="handleRoomConfirm" />

    <el-dialog v-model="previewVisible" top="10px" title="业主合同预览" width="80%" destroy-on-close append-to-body>
      <iframe v-if="pdfUrl" title="业主合同预览" :src="pdfUrl" style="width: 100%; height: 89vh; border: none" />
    </el-dialog>
  </el-form>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import { getContractTemplateParams, getMyAvailableContractTemplates } from "@/api/contract/template";
  import { previewOwnerContract } from "@/api/contract/owner";
  import RoomPicker from "@/shared/house/RoomPicker.vue";
  import { message } from "@/utils/message";
  import type {
    ContractTemplateListVo,
    OwnerBearTypeEnum,
    OwnerCompanyDto,
    OwnerContractDto,
    OwnerContractIdDto,
    OwnerContractHouseDto,
    OwnerCooperationModeEnum,
    OwnerDetailVo,
    OwnerFeeModeEnum,
    OwnerFreeCalcModeEnum,
    OwnerFreeTypeEnum,
    OwnerIncomeBasisEnum,
    OwnerLeaseFreeRuleDto,
    OwnerLeaseRuleDto,
    OwnerPersonalDto,
    OwnerProrateTypeEnum,
    OwnerRentFreeRuleDto,
    OwnerSettlementModeEnum,
    OwnerSettlementRuleDto,
    OwnerSignStatusEnum,
    OwnerTypeEnum,
    OwnerCreateDto,
    OwnerUpdateDto
  } from "@/types/generated";
  import {
    OwnerBearTypeEnumMeta,
    OwnerCooperationModeEnumMeta,
    OwnerFeeModeEnumMeta,
    OwnerFreeCalcModeEnumMeta,
    OwnerFreeTypeEnumMeta,
    OwnerIncomeBasisEnumMeta,
    OwnerProrateTypeEnumMeta,
    OwnerSettlementModeEnumMeta,
    OwnerSignStatusEnumMeta,
    OwnerTypeEnumMeta
  } from "@/types/generated/enum.meta";

  interface Props {
    formInline?: OwnerDetailVo | null;
    isEdit?: boolean;
  }

  type PickedRoom = {
    roomId?: string | number;
    houseId?: string | number;
    houseName?: string;
    area?: number | string;
    building?: string;
    unit?: string;
    doorNumber?: string;
    communityName?: string;
    communityAddress?: string;
    address?: string;
    certificateNo?: string;
  };

  type ContractTemplateParamItem = {
    key: string;
    label: string;
  };

  type ContractHouseFormItem = OwnerContractHouseDto & {
    houseId: string;
    houseName: string;
    settlementRule: OwnerSettlementRuleDto;
    rentFreeRule: OwnerRentFreeRuleDto;
  };

  type OwnerContractForm = {
    ownerType: OwnerTypeEnum;
    ownerPersonal: OwnerPersonalDto;
    ownerCompany: OwnerCompanyDto;
    ownerContract: OwnerContractDto;
    contractHouseList: ContractHouseFormItem[];
    ownerLeaseRule: OwnerLeaseRuleDto;
    ownerLeaseFreeRuleList: OwnerLeaseFreeRuleDto[];
  };

  const props = withDefaults(defineProps<Props>(), {
    formInline: null,
    isEdit: false
  });

  const formRef = ref<FormInstance>();
  const roomPickerRef = ref<InstanceType<typeof RoomPicker>>();
  const contractTemplates = ref<ContractTemplateListVo[]>([]);
  const templateParams = ref<ContractTemplateParamItem[]>([]);
  const templateParamsLoading = ref(false);
  const contractDateRange = ref<string[]>([]);
  const selectedRooms = ref<PickedRoom[]>([]);
  const activeHouseId = ref("");
  const previewVisible = ref(false);
  const pdfUrl = ref("");

  const ownerTypeLabelMap: Record<OwnerTypeEnum, string> = {
    PERSONAL: "个人",
    COMPANY: "企业"
  };
  const cooperationModeLabelMap: Record<OwnerCooperationModeEnum, string> = {
    LIGHT_MANAGED: "轻托管",
    MASTER_LEASE: "包租"
  };
  const signStatusLabelMap: Record<OwnerSignStatusEnum, string> = {
    PENDING: "待签字",
    SIGNED: "已签字"
  };
  const statusLabelMap: Record<"ACTIVE" | "DISABLED", string> = {
    ACTIVE: "启用",
    DISABLED: "停用"
  };
  const settlementModeLabelMap: Record<OwnerSettlementModeEnum, string> = {
    FIXED: "固定保底",
    SHARE_GROSS: "毛收分成",
    SHARE_NET: "净收分成",
    GUARANTEE_PLUS_SHARE: "保底加分成",
    AGENCY: "代收代付"
  };
  const incomeBasisLabelMap: Record<OwnerIncomeBasisEnum, string> = {
    RECEIVED: "按实收",
    RECEIVABLE: "按应收"
  };
  const feeModeLabelMap: Record<OwnerFeeModeEnum, string> = {
    RATIO: "按比例",
    FIXED: "固定金额"
  };
  const bearTypeLabelMap: Record<OwnerBearTypeEnum, string> = {
    PLATFORM: "平台承担",
    OWNER: "业主承担",
    SHARED: "共同承担"
  };
  const freeTypeLabelMap: Record<OwnerFreeTypeEnum, string> = {
    BUILT_IN: "内置免租",
    OUTSIDE: "外置免租"
  };
  const freeCalcModeLabelMap: Record<OwnerFreeCalcModeEnum, string> = {
    BY_DAYS: "按天分摊",
    FIXED: "固定金额",
    RATIO: "按比例"
  };
  const prorateTypeLabelMap: Record<OwnerProrateTypeEnum, string> = {
    BY_DAYS: "按天折算",
    FULL_PERIOD: "整期计费"
  };
  const rentDueTypeLabelMap = {
    EARLY: "提前收租",
    FIXED: "固定收租",
    LATE: "延后收租"
  } as const;

  const ownerTypeOptions = [
    { label: ownerTypeLabelMap.PERSONAL, value: OwnerTypeEnumMeta.PERSONAL.value as OwnerTypeEnum },
    { label: ownerTypeLabelMap.COMPANY, value: OwnerTypeEnumMeta.COMPANY.value as OwnerTypeEnum }
  ];
  const cooperationModeOptions = [
    { label: cooperationModeLabelMap.LIGHT_MANAGED, value: OwnerCooperationModeEnumMeta.LIGHT_MANAGED.value as OwnerCooperationModeEnum },
    { label: cooperationModeLabelMap.MASTER_LEASE, value: OwnerCooperationModeEnumMeta.MASTER_LEASE.value as OwnerCooperationModeEnum }
  ];
  const signStatusOptions = [
    { label: signStatusLabelMap.PENDING, value: OwnerSignStatusEnumMeta.PENDING.value as OwnerSignStatusEnum },
    { label: signStatusLabelMap.SIGNED, value: OwnerSignStatusEnumMeta.SIGNED.value as OwnerSignStatusEnum }
  ];
  const statusOptions = [
    { label: statusLabelMap.ACTIVE, value: "ACTIVE" as const },
    { label: statusLabelMap.DISABLED, value: "DISABLED" as const }
  ];
  const settlementModeOptions = Object.values(OwnerSettlementModeEnumMeta).map(item => ({
    label: settlementModeLabelMap[item.value as OwnerSettlementModeEnum],
    value: item.value as OwnerSettlementModeEnum
  }));
  const incomeBasisOptions = Object.values(OwnerIncomeBasisEnumMeta).map(item => ({
    label: incomeBasisLabelMap[item.value as OwnerIncomeBasisEnum],
    value: item.value as OwnerIncomeBasisEnum
  }));
  const feeModeOptions = Object.values(OwnerFeeModeEnumMeta).map(item => ({
    label: feeModeLabelMap[item.value as OwnerFeeModeEnum],
    value: item.value as OwnerFeeModeEnum
  }));
  const bearTypeOptions = Object.values(OwnerBearTypeEnumMeta).map(item => ({
    label: bearTypeLabelMap[item.value as OwnerBearTypeEnum],
    value: item.value as OwnerBearTypeEnum
  }));
  const freeTypeOptions = Object.values(OwnerFreeTypeEnumMeta).map(item => ({
    label: freeTypeLabelMap[item.value as OwnerFreeTypeEnum],
    value: item.value as OwnerFreeTypeEnum
  }));
  const lightManagedCalcModeOptions = Object.values(OwnerFreeCalcModeEnumMeta)
    .filter(item => item.value !== "RATIO")
    .map(item => ({ label: freeCalcModeLabelMap[item.value as OwnerFreeCalcModeEnum], value: item.value as OwnerFreeCalcModeEnum }));
  const leaseFreeCalcModeOptions = Object.values(OwnerFreeCalcModeEnumMeta)
    .filter(item => item.value !== "BY_DAYS")
    .map(item => ({ label: freeCalcModeLabelMap[item.value as OwnerFreeCalcModeEnum], value: item.value as OwnerFreeCalcModeEnum }));
  const prorateTypeOptions = Object.values(OwnerProrateTypeEnumMeta).map(item => ({
    label: prorateTypeLabelMap[item.value as OwnerProrateTypeEnum],
    value: item.value as OwnerProrateTypeEnum
  }));
  const rentDueTypeOptions = [
    { label: rentDueTypeLabelMap.EARLY, value: "EARLY" as const },
    { label: rentDueTypeLabelMap.FIXED, value: "FIXED" as const },
    { label: rentDueTypeLabelMap.LATE, value: "LATE" as const }
  ];

  const createDefaultSettlementRule = (): OwnerSettlementRuleDto => ({
    incomeBasis: "RECEIVED",
    settlementMode: "FIXED",
    guaranteedRentAmount: 0,
    commissionMode: "RATIO",
    commissionValue: 0,
    serviceFeeMode: "FIXED",
    serviceFeeValue: 0,
    bearTaxType: "PLATFORM",
    status: "ACTIVE"
  });
  const createDefaultRentFreeRule = (): OwnerRentFreeRuleDto => ({
    freeType: "BUILT_IN",
    bearType: "PLATFORM",
    ownerRatio: 0,
    platformRatio: 1,
    calcMode: "BY_DAYS",
    status: "ACTIVE"
  });
  const createDefaultLeaseFreeRule = (): OwnerLeaseFreeRuleDto => ({
    freeType: "BUILT_IN",
    calcMode: "FIXED",
    freeAmount: 0,
    freeRatio: 0,
    status: "ACTIVE"
  });
  const createHouseRule = (houseId: string, houseName: string): ContractHouseFormItem => ({
    houseId,
    houseName,
    remark: "",
    settlementRule: createDefaultSettlementRule(),
    rentFreeRule: createDefaultRentFreeRule()
  });
  const createDefaultForm = (): OwnerContractForm => ({
    ownerType: "PERSONAL",
    ownerPersonal: {
      name: "",
      phone: "",
      idType: "ID_CARD",
      idNo: "",
      gender: "MALE",
      tags: [],
      status: "ACTIVE"
    },
    ownerCompany: {
      name: "",
      contactPhone: "",
      uscc: "",
      contactName: "",
      legalPerson: "",
      legalPersonIdType: "ID_CARD",
      legalPersonIdNo: "",
      registeredAddress: "",
      tags: [],
      status: "ACTIVE"
    },
    ownerContract: {
      cooperationMode: "LIGHT_MANAGED",
      contractTemplateId: undefined,
      signStatus: "PENDING",
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      contractStart: "",
      contractEnd: "",
      remark: ""
    },
    contractHouseList: [],
    ownerLeaseRule: {
      rentAmount: 0,
      depositAmount: 0,
      depositMonths: 1,
      paymentMonths: 1,
      payWay: "",
      rentDueType: "FIXED",
      rentDueDay: 5,
      rentDueOffsetDays: 0,
      firstPayDate: "",
      billingStart: "",
      billingEnd: "",
      prorateType: "BY_DAYS",
      status: "ACTIVE"
    },
    ownerLeaseFreeRuleList: []
  });

  const form = reactive<OwnerContractForm>(createDefaultForm());

  const activeContractHouse = computed(() => form.contractHouseList.find(item => item.houseId === activeHouseId.value));
  const configuredHouseCount = computed(() => form.contractHouseList.filter(item => isHouseConfigured(item)).length);
  const selectedTemplate = computed(() =>
    contractTemplates.value.find(item => String(item.id || "") === String(form.ownerContract.contractTemplateId || ""))
  );
  const templateParamLabelMap = computed(() =>
    templateParams.value.reduce<Record<string, string>>((acc, item) => {
      acc[item.key] = item.label;
      return acc;
    }, {})
  );
  const selectedTemplatePlaceholders = computed(() => extractTemplatePlaceholders(selectedTemplate.value?.templateContent));
  const selectedTemplatePreviewFields = computed(() => buildTemplatePreviewFields(selectedTemplatePlaceholders.value));
  const selectedTemplateResolvedCount = computed(() => selectedTemplatePreviewFields.value.filter(item => item.value !== "签约时自动生成").length);
  const selectedTemplateTextLength = computed(() => getTemplateTextLength(selectedTemplate.value?.templateContent));

  const rules: FormRules = {
    ownerType: [{ required: true, message: "请选择业主类型", trigger: "change" }],
    "ownerContract.cooperationMode": [{ required: true, message: "请选择合作模式", trigger: "change" }],
    "ownerPersonal.name": [{ required: true, message: "请输入业主姓名", trigger: "blur" }],
    "ownerPersonal.phone": [{ required: true, message: "请输入联系电话", trigger: "blur" }],
    "ownerCompany.name": [{ required: true, message: "请输入企业名称", trigger: "blur" }],
    "ownerCompany.contactPhone": [{ required: true, message: "请输入联系电话", trigger: "blur" }],
    "ownerContract.contractTemplateId": [{ required: true, message: "请选择合同模板", trigger: "change" }],
    contractHouseList: [{ required: true, validator: (_, value, callback) => (value?.length ? callback() : callback(new Error("请选择房源"))), trigger: "change" }]
  };

  function isHouseConfigured(item: ContractHouseFormItem) {
    if (form.ownerContract.cooperationMode === "MASTER_LEASE") {
      return true;
    }
    return Boolean(item.settlementRule?.settlementMode || item.rentFreeRule?.startDate || item.rentFreeRule?.endDate);
  }

  async function loadTemplates() {
    const resp = await getMyAvailableContractTemplates({ contractType: 2 });
    contractTemplates.value = (resp.data || []) as ContractTemplateListVo[];
  }

  async function loadTemplateParams() {
    templateParamsLoading.value = true;
    try {
      const resp = await getContractTemplateParams({ contractType: 2 });
      templateParams.value = (resp.data || []).map((item: { key?: string; value?: string }) => ({
        key: item.key || "",
        label: item.value || item.key || ""
      }));
    } finally {
      templateParamsLoading.value = false;
    }
  }

  function resetForm() {
    Object.assign(form, createDefaultForm());
    contractDateRange.value = [];
    selectedRooms.value = [];
    activeHouseId.value = "";
  }

  function mapDetailToForm(detail?: OwnerDetailVo | null) {
    resetForm();
    if (!detail) return;
    form.ownerType = detail.ownerType || "PERSONAL";
    form.ownerPersonal = {
      ...createDefaultForm().ownerPersonal,
      ...(detail.ownerPersonal || {})
    };
    form.ownerCompany = {
      ...createDefaultForm().ownerCompany,
      ...(detail.ownerCompany || {})
    };
    form.ownerContract = {
      ...createDefaultForm().ownerContract,
      ...(detail.ownerContract || {})
    };
    contractDateRange.value = [detail.ownerContract?.contractStart || "", detail.ownerContract?.contractEnd || ""].filter(Boolean);
    form.contractHouseList = (detail.contractHouseList || []).map(item => ({
      ...item,
      id: item.id,
      houseId: String(item.houseId || ""),
      houseName: item.houseName || "",
      remark: item.remark || "",
      settlementRule: {
        ...createDefaultSettlementRule(),
        ...(item.settlementRule || {})
      },
      rentFreeRule: {
        ...createDefaultRentFreeRule(),
        ...(item.rentFreeRule || {})
      }
    }));
    selectedRooms.value = form.contractHouseList.map(item => ({
      houseId: item.houseId,
      houseName: item.houseName
    }));
    activeHouseId.value = form.contractHouseList[0]?.houseId || "";
    form.ownerLeaseRule = {
      ...createDefaultForm().ownerLeaseRule,
      ...(detail.ownerLeaseRule || {})
    };
    form.ownerLeaseFreeRuleList = (detail.ownerLeaseFreeRuleList || []).map(item => ({
      ...createDefaultLeaseFreeRule(),
      ...item
    }));
  }

  function handleRoomConfirm(rows: PickedRoom[]) {
    selectedRooms.value = rows || [];
    const houseMap = new Map<string, ContractHouseFormItem>();
    for (const row of rows || []) {
      const houseId = String(row.houseId || "");
      if (!houseId) continue;
      const existing = form.contractHouseList.find(item => item.houseId === houseId);
      houseMap.set(houseId, existing || createHouseRule(houseId, row.houseName || ""));
    }
    form.contractHouseList = Array.from(houseMap.values());
    if (!activeHouseId.value && form.contractHouseList.length) {
      activeHouseId.value = form.contractHouseList[0].houseId;
    }
    if (!form.contractHouseList.find(item => item.houseId === activeHouseId.value)) {
      activeHouseId.value = form.contractHouseList[0]?.houseId || "";
    }
  }

  function removeHouse(houseId: string) {
    form.contractHouseList = form.contractHouseList.filter(item => item.houseId !== houseId);
    selectedRooms.value = selectedRooms.value.filter(item => String(item.houseId || "") !== houseId);
    if (activeHouseId.value === houseId) {
      activeHouseId.value = form.contractHouseList[0]?.houseId || "";
    }
  }

  function addLeaseFreeRule() {
    form.ownerLeaseFreeRuleList.push(createDefaultLeaseFreeRule());
  }

  async function handlePreview(contractId?: string | number) {
    if (!contractId) {
      message("合同未保存，暂不支持预览", { type: "warning" });
      return;
    }
    const resp = await previewOwnerContract({ contractId } as OwnerContractIdDto);
    const blob = new Blob([resp], { type: "application/pdf" });
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
    }
    pdfUrl.value = URL.createObjectURL(blob);
    previewVisible.value = true;
  }

  function extractTemplatePlaceholders(content?: string) {
    if (!content) return [];
    const matches = content.match(/\$\{[^}]+\}/g) || [];
    return Array.from(new Set(matches));
  }

  function getTemplateTextLength(content?: string) {
    if (!content) return 0;
    return content.replace(/<[^>]+>/g, "").replace(/\s+/g, "").length;
  }

  function getTemplateLabel(key: string) {
    return templateParamLabelMap.value[key] || key.replace(/^\$\{|\}$/g, "");
  }

  function joinHouseField(rows: PickedRoom[], key: keyof PickedRoom, fallback?: () => string) {
    const values = rows
      .map(item => item[key])
      .filter(item => item !== null && item !== undefined && String(item).trim() !== "")
      .map(item => String(item).trim());
    if (values.length) {
      return Array.from(new Set(values)).join("，");
    }
    return fallback ? fallback() : "";
  }

  function getTemplatePreviewValue(key: string) {
    const houseRows = selectedRooms.value;
    const totalArea = houseRows
      .map(item => Number(item.area || 0))
      .filter(item => Number.isFinite(item) && item > 0)
      .reduce((sum, item) => sum + item, 0);
    const ownerName = form.ownerType === "COMPANY" ? form.ownerCompany.name || "" : form.ownerPersonal.name || "";
    const houseNames = joinHouseField(houseRows, "houseName");
    const mapping: Record<string, string> = {
      "${业主合同编号}": form.ownerContract.contractNo || "保存后自动生成",
      "${房屋地址}": joinHouseField(houseRows, "address", () => joinHouseField(houseRows, "communityAddress")),
      "${小区/项目名称}": joinHouseField(houseRows, "communityName", () => houseNames),
      "${楼栋号}": joinHouseField(houseRows, "building"),
      "${单元号}": joinHouseField(houseRows, "unit"),
      "${门牌号}": joinHouseField(houseRows, "doorNumber"),
      "${合租房间号}": "签约时自动生成",
      "${签约房源列表}": houseNames,
      "${房屋产权编号}": joinHouseField(houseRows, "certificateNo"),
      "${房屋类型}": "签约时自动生成",
      "${产权类型}": "签约时自动生成",
      "${房屋总面积}": totalArea > 0 ? totalArea.toFixed(2) : "",
      "${签约面积数}": totalArea > 0 ? totalArea.toFixed(2) : "",
      "${租客姓名}": ownerName
    };
    return mapping[key] || "签约时自动生成";
  }

  function buildTemplatePreviewFields(placeholders: string[]) {
    return placeholders.map(key => ({
      key,
      label: getTemplateLabel(key),
      value: getTemplatePreviewValue(key) || "签约时自动生成"
    }));
  }

  function buildSubmitPayload(): OwnerCreateDto | OwnerUpdateDto {
    const ownerContract: OwnerContractDto = {
      ...form.ownerContract,
      contractStart: contractDateRange.value[0],
      contractEnd: contractDateRange.value[1]
    };
    const payload: OwnerCreateDto = {
      ownerType: form.ownerType,
      ownerContract,
      contractHouseList: form.contractHouseList.map(item => ({
        id: item.id,
        houseId: item.houseId,
        houseName: item.houseName,
        remark: item.remark,
        settlementRule: form.ownerContract.cooperationMode === "LIGHT_MANAGED" ? item.settlementRule : undefined,
        rentFreeRule: form.ownerContract.cooperationMode === "LIGHT_MANAGED" ? item.rentFreeRule : undefined
      }))
    };
    if (form.ownerType === "PERSONAL") {
      payload.ownerPersonal = form.ownerPersonal;
    } else {
      payload.ownerCompany = form.ownerCompany;
    }
    if (form.ownerContract.cooperationMode === "MASTER_LEASE") {
      payload.ownerLeaseRule = {
        ...form.ownerLeaseRule,
        billingStart: contractDateRange.value[0],
        billingEnd: contractDateRange.value[1]
      };
      payload.ownerLeaseFreeRuleList = form.ownerLeaseFreeRuleList;
    } else {
      payload.ownerLeaseFreeRuleList = [];
    }
    return payload as OwnerCreateDto | OwnerUpdateDto;
  }

  async function validateAndBuildPayload() {
    if (!formRef.value) return null;
    await formRef.value.validate();
    if (contractDateRange.value.length !== 2) {
      throw new Error("请选择合同周期");
    }
    return buildSubmitPayload();
  }

  function getRef() {
    return formRef.value;
  }

  watch(
    () => props.formInline,
    value => {
      mapDetailToForm(value);
    },
    { immediate: true }
  );

  watch(
    () => form.ownerContract.cooperationMode,
    mode => {
      if (mode === "LIGHT_MANAGED" && !activeHouseId.value && form.contractHouseList.length) {
        activeHouseId.value = form.contractHouseList[0].houseId;
      }
    }
  );

  watch(previewVisible, value => {
    if (!value && pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = "";
    }
  });

  onMounted(async () => {
    await Promise.all([loadTemplates(), loadTemplateParams()]);
  });

  defineExpose({
    getRef,
    validateAndBuildPayload,
    form
  });
</script>

<style scoped lang="scss">
  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-card {
    margin-bottom: 16px;
    border-radius: 12px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-weight: 600;
  }

  .card-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-weight: 400;
  }

  .template-preview-panel {
    padding: 16px;
    background: linear-gradient(180deg, #fafcff 0%, #f8fafc 100%);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
  }

  .template-preview-panel__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }

  .template-preview-panel__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .template-preview-panel__desc {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }

  .template-preview-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .template-preview-metric {
    padding: 14px 16px;
    background: #fff;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .template-preview-metric__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .template-preview-metric__value {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    word-break: break-word;
  }

  .template-token-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .template-preview-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .template-preview-item {
    padding: 14px 16px;
    background: #fff;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .template-preview-item__label {
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .template-preview-item__value {
    color: var(--el-text-color-primary);
    line-height: 1.6;
    word-break: break-word;
  }

  .selected-house-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .selected-house-summary {
    display: flex;
    gap: 16px;
  }

  .summary-metric {
    display: flex;
    align-items: baseline;
    gap: 4px;
    padding: 12px 16px;
    border-radius: 10px;
    background: var(--el-fill-color-light);
  }

  .summary-metric__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .summary-metric__value {
    font-size: 24px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .summary-metric__unit {
    color: var(--el-text-color-secondary);
  }

  .selected-house-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .selected-house-card {
    border: 1px solid var(--el-border-color-lighter);
    background: #fff;
    border-radius: 12px;
    padding: 14px;
    text-align: left;
    transition: all 0.2s;
  }

  .selected-house-card.active {
    border-color: var(--el-color-primary);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.08);
  }

  .selected-house-card__title {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .selected-house-card__meta {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .selected-house-card__footer {
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .rule-editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rule-editor__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--el-fill-color-light);
    margin-bottom: 8px;
  }

  .rule-editor__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .rule-editor__desc {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .sub-title {
    margin: 16px 0 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
  }
</style>
