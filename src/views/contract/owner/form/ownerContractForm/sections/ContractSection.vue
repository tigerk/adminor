<template>
  <el-card shadow="never" class="form-card">
    <template #header>
      <div class="card-header">
        <div class="header-inline">
          <span class="card-title">合同信息</span>
          <span class="card-desc card-desc--inline">房源确认后，再补充合同模板、签约方式、合同周期和备注。</span>
        </div>
      </div>
    </template>

    <div class="contract-info-grid">
      <div class="info-panel">
        <div class="info-panel__header">
          <div class="header-inline">
            <span class="info-panel__title">签约摘要</span>
            <span class="info-panel__desc info-panel__desc--inline">核心合同信息集中在这里，方便快速核对。</span>
          </div>
        </div>
        <div class="summary-tag-group">
          <el-tag effect="plain">签约类型：{{ SIGN_TYPE_LABEL_MAP[form.ownerContract.signType || "NEW"] }}</el-tag>
          <el-tag effect="plain">合同类型：{{ CONTRACT_MEDIUM_LABEL_MAP[form.ownerContract.contractMedium || "PAPER"] }}</el-tag>
          <el-tag effect="plain">短信通知：{{ form.ownerContract.notifyOwner ? "通知业主" : "不通知" }}</el-tag>
          <el-tag effect="plain">签署状态：{{ SIGN_STATUS_LABEL_MAP[form.ownerContract.signStatus || "PENDING"] }}</el-tag>
        </div>
      </div>

      <div class="info-panel">
        <div class="info-panel__header">
          <div class="header-inline">
            <span class="info-panel__title">合同录入</span>
            <span class="info-panel__desc info-panel__desc--inline">常用字段做成一屏可完成，减少来回切换。</span>
          </div>
          <div class="header-switch-row">
            <span class="header-switch-row__label">通知业主</span>
            <el-switch v-model="form.ownerContract.notifyOwner" />
          </div>
        </div>

        <el-row :gutter="16" class="contract-entry-row">
          <el-col :span="8">
            <el-form-item label="合同模板" prop="ownerContract.contractTemplateId">
              <el-select v-model="form.ownerContract.contractTemplateId" class="w-full" filterable placeholder="请选择合同模板">
                <el-option v-for="item in contractTemplates" :key="item.id" :label="item.templateName || `模板#${item.id}`" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="签约类型">
              <el-segmented v-model="form.ownerContract.signType" :options="SIGN_TYPE_OPTIONS" />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="合同类型">
              <el-segmented v-model="form.ownerContract.contractMedium" :options="CONTRACT_MEDIUM_OPTIONS" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="签署状态">
              <el-segmented v-model="form.ownerContract.signStatus" :options="SIGN_STATUS_OPTIONS" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="contract-entry-row" align="bottom">
          <el-col :span="8">
            <el-form-item label="合同周期">
              <el-date-picker
                v-model="contractDateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label=" ">
              <el-button-group>
                <el-button plain @click="emit('applyYearShortcut', 1)">1 年</el-button>
                <el-button plain @click="emit('applyYearShortcut', 3)">3 年</el-button>
                <el-button plain @click="emit('applyYearShortcut', 5)">5 年</el-button>
              </el-button-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="合同备注">
              <el-input v-model="form.ownerContract.remark" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="请输入合同备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import type { ContractTemplateListVo } from "@/types/generated";
  import { CONTRACT_MEDIUM_OPTIONS, SIGN_STATUS_OPTIONS, SIGN_TYPE_OPTIONS } from "../model/ownerContractFormOptions";
  import { CONTRACT_MEDIUM_LABEL_MAP, SIGN_STATUS_LABEL_MAP, SIGN_TYPE_LABEL_MAP } from "../model/ownerContractFormTypes";
  import type { OwnerContractForm } from "../model/ownerContractFormTypes";

  const form = defineModel<OwnerContractForm>("form", { required: true });

  const props = defineProps<{
    contractTemplates: ContractTemplateListVo[];
    contractDateRange: string[];
  }>();

  const emit = defineEmits<{
    applyYearShortcut: [years: number];
    "update:contractDateRange": [value: string[]];
  }>();

  const contractDateRange = computed({
    get: () => props.contractDateRange,
    set: value => emit("update:contractDateRange", value)
  });
</script>
