<template>
  <div v-if="sharedContractSubject" class="rule-editor">
    <div class="mode-guide">
      <div class="mode-guide__header">
        <div>
          <div class="mode-guide__title">先选结算方式，再补充对应条款</div>
          <div class="mode-guide__desc">轻托管里最关键的是先明确你和业主怎么结算。不同结算方式只展示自己需要填写的字段。</div>
        </div>
        <el-tag effect="plain" type="primary">
          {{ SETTLEMENT_MODE_LABEL_MAP[sharedContractSubject.settlementRule.settlementMode || "FIXED"] }}
        </el-tag>
      </div>
    </div>

    <div class="sub-panel">
      <div class="sub-panel__title">
        结算方式
        <div class="sub-panel__desc">选择后，页面只展示该方式下真正需要填写的字段。</div>
      </div>

      <el-form-item label="">
        <div class="settlement-mode-grid">
          <button
            v-for="option in SETTLEMENT_MODE_OPTIONS"
            :key="option.value"
            type="button"
            :class="['settlement-mode-card', { 'is-active': sharedContractSubject.settlementRule.settlementMode === option.value }]"
            @click="sharedContractSubject.settlementRule.settlementMode = option.value"
          >
            <div class="settlement-mode-card__title">{{ option.label }}</div>
            <div class="settlement-mode-card__desc">{{ option.desc }}</div>
            <div class="settlement-mode-card__features">
              <el-tag v-for="feature in option.features" :key="feature" size="small" effect="plain">{{ feature }}</el-tag>
            </div>
          </button>
        </div>
      </el-form-item>

      <el-row v-if="sharedContractSubject.settlementRule.settlementMode === 'FIXED'" :gutter="20">
        <el-col :span="8">
          <el-form-item label="固定给业主金额">
            <el-input-number v-model="sharedContractSubject.settlementRule.guaranteedRentAmount" :min="0" :precision="2" class="w-full" />
          </el-form-item>
        </el-col>
      </el-row>

      <template v-else-if="sharedContractSubject.settlementRule.settlementMode === 'GUARANTEE_PLUS_SHARE'">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="保底金额">
              <el-input-number v-model="sharedContractSubject.settlementRule.guaranteedRentAmount" :min="0" :precision="2" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="业主分成比例">
              <el-input v-model.number="sharedContractSubject.settlementRule.commissionValue" type="number" class="w-full" placeholder="请输入">
                <template #append>%</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分账基数">
              <el-radio-group v-model="sharedContractSubject.settlementRule.incomeBasis">
                <el-radio-button v-for="option in INCOME_BASIS_OPTIONS" :key="option.value" :label="option.label" :value="option.value" />
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <template v-else>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item :label="sharedContractSubject.settlementRule.settlementMode === 'AGENCY' ? '业主结转比例' : '业主分成比例'">
              <el-input v-model.number="sharedContractSubject.settlementRule.commissionValue" type="number" class="w-full" placeholder="请输入">
                <template #append>%</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分账基数">
              <el-radio-group v-model="sharedContractSubject.settlementRule.incomeBasis">
                <el-radio-button v-for="option in INCOME_BASIS_OPTIONS" :key="option.value" :label="option.label" :value="option.value" />
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="rule-hint">
          {{
            sharedContractSubject.settlementRule.settlementMode === "AGENCY"
              ? "业主结转比例：平台代收代付后，剩余金额按约定比例结给业主。"
              : "业主分成比例：租金先按该比例结给业主。管理费比例：再按业主租金收入扣取管理费。"
          }}
        </div>
      </template>
    </div>

    <div class="config-card-grid">
      <div class="config-card">
        <div class="config-card__header">
          <div class="config-card__header-left">
            <div class="config-card__title">管理费</div>
            <div class="config-card__desc">按业主租金收入向业主额外收取管理费。</div>
          </div>
          <el-switch v-model="sharedContractSubject.settlementRule.managementFeeEnabled" />
        </div>
        <div class="config-card__content">
          <template v-if="sharedContractSubject.settlementRule.managementFeeEnabled">
            <div class="fee-inline-row">
              <el-form-item label="管理费比例" class="fee-inline-item">
                <el-input v-model.number="sharedContractSubject.settlementRule.managementFeeValue" type="number" placeholder="请输入" style="width: 160px">
                  <template #append>%</template>
                </el-input>
              </el-form-item>
              <div class="fee-inline-hint">
                <el-form-item label="&nbsp;" class="fee-inline-item">
                  按业主租金收入的
                  <strong>{{ sharedContractSubject.settlementRule.managementFeeValue ?? 0 }}%</strong>
                  向业主收取管理费。
                </el-form-item>
              </div>
            </div>
          </template>
          <div v-else class="config-card__empty">当前不向业主收取管理费。</div>
        </div>
      </div>

      <div class="config-card config-card--rent-free">
        <div class="config-card__header">
          <div class="config-card__header-left">
            <div class="config-card__title">免租规则</div>
            <div class="config-card__desc">明确免租是否算合同期内、损失谁承担、金额怎么计算。</div>
          </div>
          <el-switch v-model="sharedContractSubject.rentFreeRule.enabled" />
        </div>
        <div class="config-card__content">
          <template v-if="sharedContractSubject.rentFreeRule.enabled">
            <el-row class="mb-4" :gutter="16">
              <re-col :value="8" :xs="24" :sm="24">
                <div class="choice-group__label">是否算在合同期内</div>
                <el-segmented v-model="sharedContractSubject.rentFreeRule.freeType" :options="FREE_TYPE_OPTIONS" size="small" />
                <div class="choice-group__desc">
                  {{
                    sharedContractSubject.rentFreeRule.freeType === "BUILT_IN"
                      ? "免租天数算在正式合同期内，合同总时长不变。"
                      : "免租天数不算在正式合同期内，更像额外赠送的免租时间。"
                  }}
                </div>
              </re-col>
              <re-col :value="8" :xs="24" :sm="24">
                <div class="choice-group__label">免租损失承担方</div>
                <el-segmented v-model="sharedContractSubject.rentFreeRule.bearType" :options="BEAR_TYPE_OPTIONS" size="small" />
                <div class="choice-group__desc">{{ BEAR_TYPE_DESCRIPTION_MAP[sharedContractSubject.rentFreeRule.bearType || "PLATFORM"] }}</div>
              </re-col>
              <re-col :value="8" :xs="24" :sm="24">
                <div class="choice-group__label">免租金额计算方式</div>
                <el-segmented v-model="sharedContractSubject.rentFreeRule.calcMode" :options="LIGHT_MANAGED_CALC_MODE_OPTIONS" size="small" />
                <div class="choice-group__desc">{{ FREE_CALC_MODE_DESCRIPTION_MAP[sharedContractSubject.rentFreeRule.calcMode || "BY_DAYS"] }}</div>
              </re-col>
            </el-row>
            <el-row class="mb-4">
              <re-col :value="8" :xs="24" :sm="24">
                <div class="rent-free-date-field">
                  <div class="choice-group__label choice-group__label--compact">免租开始日期</div>
                  <el-date-picker v-model="sharedContractSubject.rentFreeRule.startDate" type="date" value-format="YYYY-MM-DD" placeholder="选择开始日期" class="w-full" />
                </div>
              </re-col>
              <re-col :value="16" :xs="24" :sm="24">
                <el-space>
                  <div class="rent-free-date-field">
                    <div class="choice-group__label choice-group__label--compact">免租结束日期</div>
                    <el-date-picker v-model="sharedContractSubject.rentFreeRule.endDate" type="date" value-format="YYYY-MM-DD" placeholder="选择结束日期" class="w-full" />
                  </div>
                  <div class="rent-free-date-field">
                    <div class="choice-group__label choice-group__label--compact">&nbsp;</div>
                    <el-button-group>
                      <el-button plain @click="emit('applyRentFreeShortcut', sharedContractSubject.rentFreeRule, 1)">1 个月</el-button>
                      <el-button plain @click="emit('applyRentFreeShortcut', sharedContractSubject.rentFreeRule, 2)">2 个月</el-button>
                      <el-button plain @click="emit('applyRentFreeShortcut', sharedContractSubject.rentFreeRule, 3)">3 个月</el-button>
                    </el-button-group>
                  </div>
                </el-space>
              </re-col>
            </el-row>
          </template>
          <div v-else class="config-card__empty">当前不启用免租规则。</div>
        </div>
      </div>

      <div class="config-card">
        <div class="config-card__header">
          <div class="config-card__header-left">
            <div class="config-card__title">结算时间与手续费</div>
            <div class="config-card__desc">明确什么时候给业主出账，以及支付手续费谁承担。</div>
          </div>
          <el-tag effect="plain" type="info">统一配置</el-tag>
        </div>
        <div class="config-card__content">
          <el-row>
            <re-col :value="12" :xs="24" :sm="24">
              <el-form-item label="给业主出账时间">
                <el-radio-group v-model="sharedContractSubject.settlementRule.settlementTiming">
                  <el-radio-button v-for="option in SETTLEMENT_TIMING_OPTIONS" :key="option.value" :label="option.label" :value="option.value" />
                </el-radio-group>
              </el-form-item>
            </re-col>
            <re-col :value="12" :xs="24" :sm="24">
              <el-form-item label="支付手续费承担方式">
                <el-radio-group v-model="sharedContractSubject.settlementRule.paymentFeeBearType">
                  <el-radio-button v-for="option in PAYMENT_FEE_BEAR_TYPE_OPTIONS" :key="option.value" :label="option.label" :value="option.value" />
                </el-radio-group>
              </el-form-item>
            </re-col>
          </el-row>
        </div>
      </div>
    </div>

    <div class="config-card config-card--full">
      <div class="config-card__header">
        <div class="config-card__header-left">
          <div class="config-card__title">押金及其他费用分账规则</div>
          <div class="config-card__desc">不含租金，租金按上方业主分成比例自动结算。这里配置押金和其他费用是否转给业主。</div>
        </div>
        <el-button type="primary" plain size="small" @click="emit('addSettlementItem', sharedContractSubject)">
          <Plus />
          添加费用规则
        </el-button>
      </div>
      <div class="config-card__content">
        <el-alert
          v-if="sharedContractSubject.settlementRule.settlementTiming === 'TENANT_PAYMENT_REALTIME'"
          class="settlement-fee-alert"
          type="warning"
          show-icon
          :closable="false"
          title="租金由业主分成比例自动结算；押金和其他费用需要在这里单独配置，未配置则不结给业主。"
        />
        <div v-if="!sharedContractSubject.settlementRule.settlementItemList?.length" class="config-card__empty">暂无押金及其他费用分账规则，点击右上角"添加费用规则"新增。</div>
        <template v-else>
          <div class="fee-table-wrapper">
            <table class="fee-table settlement-fee-table">
              <thead>
                <tr>
                  <th style="width: 92px">收支</th>
                  <th style="width: 300px">费用类型</th>
                  <th style="width: 130px">转给比例</th>
                  <th>备注</th>
                  <th style="width: 56px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in sharedContractSubject.settlementRule.settlementItemList" :key="index" class="fee-row">
                  <td>
                    <el-radio-group v-model="item.feeDirection" class="direction-radio-group" size="small">
                      <el-radio-button label="IN">收</el-radio-button>
                      <el-radio-button label="OUT">支</el-radio-button>
                    </el-radio-group>
                  </td>
                  <td>
                    <el-cascader
                      v-model="localSettlementFeeCascaderValues[`shared-${index}`]"
                      :options="settlementFeeTypeOptions"
                      :props="{ expandTrigger: 'hover' }"
                      clearable
                      filterable
                      class="w-full"
                      @change="value => emit('settlementFeeTypeChange', value, sharedContractSubject, index)"
                    />
                  </td>
                  <td>
                    <el-input v-model.number="item.transferRatio" type="number" class="w-full" placeholder="请输入">
                      <template #append>%</template>
                    </el-input>
                  </td>
                  <td>
                    <el-input v-model="item.remark" placeholder="备注（选填）" />
                  </td>
                  <td class="text-center">
                    <el-button link type="danger" @click="sharedContractSubject.settlementRule.settlementItemList?.splice(index, 1)">删除</el-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>
  </div>
  <el-empty v-else description="请先选择房源后再配置条款" :image-size="100" />
</template>

<script setup lang="ts">
  import { reactive, toRefs, watch } from "vue";
  import ReCol from "@/components/ReCol";
  import Plus from "~icons/ep/plus";
  import {
    BEAR_TYPE_OPTIONS,
    FREE_TYPE_OPTIONS,
    INCOME_BASIS_OPTIONS,
    LIGHT_MANAGED_CALC_MODE_OPTIONS,
    PAYMENT_FEE_BEAR_TYPE_OPTIONS,
    SETTLEMENT_MODE_OPTIONS,
    SETTLEMENT_TIMING_OPTIONS
  } from "../model/ownerContractFormOptions";
  import { BEAR_TYPE_DESCRIPTION_MAP, FREE_CALC_MODE_DESCRIPTION_MAP, SETTLEMENT_MODE_LABEL_MAP } from "../model/ownerContractFormTypes";
  import type { ContractSubjectFormItem, OwnerRentFreeRuleForm } from "../model/ownerContractFormTypes";

  const props = defineProps<{
    settlementFeeTypeOptions: any[];
    settlementFeeCascaderValues: Record<string, any[]>;
  }>();
  const { settlementFeeTypeOptions, settlementFeeCascaderValues } = toRefs(props);

  const sharedContractSubject = defineModel<ContractSubjectFormItem | undefined>("sharedContractSubject", { required: true });
  const localSettlementFeeCascaderValues = reactive<Record<string, any[]>>({});

  const emit = defineEmits<{
    addSettlementItem: [house: ContractSubjectFormItem];
    settlementFeeTypeChange: [value: any, house: ContractSubjectFormItem, index: number];
    applyRentFreeShortcut: [rule: OwnerRentFreeRuleForm, months: number];
  }>();

  watch(
    settlementFeeCascaderValues,
    value => {
      Object.keys(localSettlementFeeCascaderValues).forEach(key => delete localSettlementFeeCascaderValues[key]);
      Object.assign(localSettlementFeeCascaderValues, value || {});
    },
    { immediate: true, deep: true }
  );
</script>

<style scoped>
  .settlement-fee-alert {
    margin-bottom: 12px;
  }
</style>
