<template>
  <el-card shadow="never" class="form-card">
    <template #header>
      <div class="card-header">
        <div class="header-inline">
          <span class="card-title">业主信息</span>
          <span class="card-desc card-desc--inline">录入业主主体信息、证件材料和收款人信息。</span>
        </div>
        <div class="card-header-form">
          <el-space spacer=" ｜ ">
            <el-form-item label="" prop="ownerType" class="card-header-form__item">
              <el-segmented v-model="form.ownerType" :options="OWNER_TYPE_OPTIONS" />
            </el-form-item>
            <el-form-item prop="ownerContract.cooperationMode" class="card-header-form__item">
              <el-segmented v-model="form.ownerContract.cooperationMode" :options="COOPERATION_MODE_OPTIONS" :disabled="masterLeaseBillLocked" />
            </el-form-item>
          </el-space>
        </div>
      </div>
    </template>

    <div class="owner-info-grid">
      <div class="info-panel">
        <div class="info-panel__header">
          <div class="header-inline">
            <span class="info-panel__title">业主主体信息</span>
            <span class="info-panel__desc info-panel__desc--inline">优先录入主体身份信息和证件材料。</span>
          </div>
        </div>

        <template v-if="form.ownerType === 0">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="姓名" prop="ownerPersonal.name">
                <el-autocomplete
                  v-model="form.ownerPersonal.name"
                  :fetch-suggestions="queryOwnerSuggestions"
                  value-key="value"
                  placeholder="请输入业主姓名"
                  clearable
                  @select="handleOwnerSuggestionSelect"
                >
                  <template #default="{ item }">
                    <div class="owner-suggestion">
                      <div class="owner-suggestion__title">{{ item.value }} - {{ item.ownerPhone || "无联系电话" }}</div>
                    </div>
                  </template>
                </el-autocomplete>
              </el-form-item>
              <div class="field-tip">输入姓名后可带出历史录入的业主资料和收款信息。</div>
            </el-col>
            <el-col :span="4">
              <el-form-item label="性别">
                <el-segmented v-model="form.ownerPersonal.gender" :options="GENDER_OPTIONS" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="联系电话" prop="ownerPersonal.phone">
                <el-input v-model="form.ownerPersonal.phone" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="业主标签">
                <el-select v-model="form.ownerPersonal.tags" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
                  <el-option v-for="item in ownerTagOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="证件信息" prop="ownerPersonal.idNo">
                <el-input v-model="form.ownerPersonal.idNo" placeholder="请输入证件号码">
                  <template #prepend>
                    <el-select v-model="form.ownerPersonal.idType" style="width: 128px">
                      <el-option v-for="item in ID_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <div class="upload-section">
            <div class="upload-section__title">证件材料</div>
            <el-space wrap alignment="start">
              <el-form-item prop="ownerPersonal.idCardFrontList" class="upload-form-item">
                <UploadImage v-model="form.ownerPersonal.idCardFrontList" :limit="1" :width="124" :height="76">
                  <template #tip><div class="upload-tip">身份证国徽面</div></template>
                </UploadImage>
              </el-form-item>
              <el-form-item prop="ownerPersonal.idCardBackList" class="upload-form-item">
                <UploadImage v-model="form.ownerPersonal.idCardBackList" :limit="1" :width="124" :height="76">
                  <template #tip><div class="upload-tip">身份证人像面</div></template>
                </UploadImage>
              </el-form-item>
              <UploadImage v-model="form.ownerPersonal.idCardInHandList" :limit="1" :width="124" :height="76">
                <template #tip><div class="upload-tip">手持身份证照</div></template>
              </UploadImage>
              <UploadImage v-model="form.ownerPersonal.otherImageList" :limit="4" :width="124" :height="76">
                <template #tip><div class="upload-tip">其他材料，最多 4 张</div></template>
              </UploadImage>
            </el-space>
          </div>
        </template>

        <template v-else>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="企业名称" prop="ownerCompany.name">
                <el-autocomplete
                  v-model="form.ownerCompany.name"
                  :fetch-suggestions="queryOwnerSuggestions"
                  value-key="value"
                  placeholder="请输入企业名称"
                  clearable
                  @select="handleOwnerSuggestionSelect"
                >
                  <template #default="{ item }">
                    <div class="owner-suggestion">
                      <div class="owner-suggestion__title">{{ item.value }}</div>
                      <div class="owner-suggestion__meta">{{ item.ownerPhone || "无联系电话" }}</div>
                    </div>
                  </template>
                </el-autocomplete>
              </el-form-item>
              <div class="field-tip">输入企业名称后可带出历史录入的主体和收款信息。</div>
            </el-col>
            <el-col :span="8">
              <el-form-item label="统一社会信用代码" prop="ownerCompany.uscc">
                <el-input v-model="form.ownerCompany.uscc" placeholder="请输入统一社会信用代码" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="业主标签">
                <el-select v-model="form.ownerCompany.tags" class="w-full" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1">
                  <el-option v-for="item in ownerTagOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="联系人" prop="ownerCompany.contactName">
                <el-input v-model="form.ownerCompany.contactName" placeholder="请输入联系人" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="联系电话" prop="ownerCompany.contactPhone">
                <el-input v-model="form.ownerCompany.contactPhone" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="法定代表人">
                <el-input v-model="form.ownerCompany.legalPerson" placeholder="请输入法定代表人" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="法人证件信息">
                <el-input v-model="form.ownerCompany.legalPersonIdNo" placeholder="请输入法人证件号码">
                  <template #prepend>
                    <el-select v-model="form.ownerCompany.legalPersonIdType" style="width: 128px">
                      <el-option v-for="item in ID_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="注册地址">
                <el-input v-model="form.ownerCompany.registeredAddress" placeholder="请输入注册地址" />
              </el-form-item>
            </el-col>
          </el-row>
          <div class="upload-section">
            <div class="upload-section__title">企业资质</div>
            <el-space wrap alignment="start">
              <UploadImage v-model="form.ownerCompany.businessLicenseUrls" :limit="1" :width="124" :height="76">
                <template #tip><div class="upload-tip">营业执照</div></template>
              </UploadImage>
            </el-space>
          </div>
        </template>
      </div>

      <div class="info-panel info-panel--payee">
        <div class="info-panel__header">
          <div class="header-inline">
            <span class="info-panel__title">收款人信息</span>
            <span class="info-panel__desc info-panel__desc--inline">用于后续提现和打款，可与业主主体不一致。</span>
          </div>
          <el-space wrap>
            <el-button plain @click="emit('fillPayeeFromOwner')">收款人同业主</el-button>
            <el-button v-if="form.ownerType === 1" plain @click="emit('fillPayeeFromContact')">收款人同联系人</el-button>
          </el-space>
        </div>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="收款人姓名" :prop="form.ownerType === 0 ? 'ownerPersonal.payeeName' : 'ownerCompany.payeeName'">
              <el-input v-model="currentPayeeForm.payeeName" placeholder="请输入收款人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收款人电话" :prop="form.ownerType === 0 ? 'ownerPersonal.payeePhone' : 'ownerCompany.payeePhone'">
              <el-input v-model="currentPayeeForm.payeePhone" placeholder="请输入收款人电话" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收款人证件信息" :prop="form.ownerType === 0 ? 'ownerPersonal.payeeIdNo' : 'ownerCompany.payeeIdNo'">
              <el-input v-model="currentPayeeForm.payeeIdNo" placeholder="请输入收款人证件号码">
                <template #prepend>
                  <el-select v-model="currentPayeeForm.payeeIdType" style="width: 128px">
                    <el-option v-for="item in ID_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="银行卡开户名" :prop="form.ownerType === 0 ? 'ownerPersonal.bankAccountName' : 'ownerCompany.bankAccountName'">
              <el-input v-model="currentPayeeForm.bankAccountName" placeholder="请输入开户名" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="银行卡号" :prop="form.ownerType === 0 ? 'ownerPersonal.bankAccountNo' : 'ownerCompany.bankAccountNo'">
              <el-input v-model="currentPayeeForm.bankAccountNo" placeholder="请输入银行卡号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开户行">
              <el-input v-model="currentPayeeForm.bankName" placeholder="请输入开户行名称" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import UploadImage from "@/components/upload/UploadImage.vue";
  import { COOPERATION_MODE_OPTIONS, GENDER_OPTIONS, ID_TYPE_OPTIONS, OWNER_TYPE_OPTIONS } from "../model/ownerContractFormOptions";
  import type { OwnerCompanyForm, OwnerContractForm, OwnerPersonalForm, OwnerSuggestionItem } from "../model/ownerContractFormTypes";

  const form = defineModel<OwnerContractForm>("form", { required: true });

  defineProps<{
    masterLeaseBillLocked: boolean;
    ownerTagOptions: { label: string; value: string }[];
    queryOwnerSuggestions: (q: string, cb: (items: OwnerSuggestionItem[]) => void) => void;
    handleOwnerSuggestionSelect: (item: OwnerSuggestionItem) => void;
  }>();

  const currentPayeeForm = computed<OwnerPersonalForm | OwnerCompanyForm>(() => (form.value.ownerType === 0 ? form.value.ownerPersonal : form.value.ownerCompany));

  const emit = defineEmits<{
    fillPayeeFromOwner: [];
    fillPayeeFromContact: [];
  }>();
</script>
