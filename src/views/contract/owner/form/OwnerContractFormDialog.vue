<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" label-width="100px" class="owner-contract-form mb-4">
    <!-- ═══ 签约房源 ════════════════════════════════════════════════════════ -->
    <el-card shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <div class="header-inline">
            <span class="card-title">签约房源</span>
            <span class="card-desc card-desc--inline">先确认本次合同按房源还是集中式签约，再打开对应选择器。</span>
          </div>
          <div class="card-header-form">
            <el-tag effect="plain">类型：{{ currentSubjectTypeLabel }}</el-tag>
            <el-tag effect="plain">已选：{{ form.contractSubjectList.length }} {{ currentSubjectUnit }}</el-tag>
            <el-tag effect="plain">已配置：{{ configuredSubjectCount }} {{ currentSubjectUnit }}</el-tag>
            <el-button type="primary" size="small" @click="openSubjectPicker">
              <Plus />
              选择{{ currentSubjectTypeLabel }}
            </el-button>
          </div>
        </div>
      </template>

      <el-form-item label-width="0" prop="contractSubjectList">
        <div class="selected-house-wrapper">
          <div class="subject-type-grid">
            <button
              v-for="option in subjectTypeOptions"
              :key="option.value"
              type="button"
              :class="['subject-type-card', { 'is-active': selectedSubjectType === option.value }]"
              @click="handleSubjectTypeChange(option.value)"
            >
              <div class="subject-type-card__title">{{ option.label }}</div>
              <div class="subject-type-card__desc">{{ option.desc }}</div>
            </button>
          </div>

          <div class="subject-selection-summary">
            <div class="subject-selection-summary__left">
              <div class="subject-selection-summary__title">当前按{{ currentSubjectTypeLabel }}签约</div>
              <div class="subject-selection-summary__desc">{{ currentSubjectTypeDesc }}</div>
            </div>
            <div class="subject-selection-summary__actions">
              <el-button plain @click="openSubjectPicker">选择{{ currentSubjectTypeLabel }}</el-button>
              <el-button v-if="form.contractSubjectList.length" text type="danger" @click="clearSubjectSelection">清空已选</el-button>
            </div>
          </div>

          <div v-if="form.contractSubjectList.length" class="selected-house-panel">
            <div class="selected-house-tags">
              <div v-for="item in form.contractSubjectList" :key="`${item.subjectType}-${item.subjectId}`" class="selected-house-chip">
                <div class="selected-house-chip__body">
                  <el-tag size="small" effect="plain" class="selected-house-chip__type">{{ getSubjectTypeShortLabel(item.subjectType) }}</el-tag>
                  <div class="selected-house-chip__title">{{ item.subjectName || "未命名房源" }}</div>
                </div>
                <el-button link type="danger" @click="removeSubject(item.subjectType, item.subjectId)">移除</el-button>
              </div>
            </div>
          </div>
          <el-empty v-else :description="`请选择一个或多个${currentSubjectTypeLabel}`" :image-size="90" />
        </div>
      </el-form-item>
    </el-card>

    <!-- ═══ 业主信息 ════════════════════════════════════════════════════════ -->
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
                <el-segmented v-model="form.ownerType" :options="ownerTypeOptions" />
              </el-form-item>
              <el-form-item prop="ownerContract.cooperationMode" class="card-header-form__item">
                <el-segmented v-model="form.ownerContract.cooperationMode" :options="cooperationModeOptions" />
              </el-form-item>
            </el-space>
          </div>
        </div>
      </template>

      <div class="owner-info-grid">
        <!-- 业主主体信息 -->
        <div class="info-panel">
          <div class="info-panel__header">
            <div class="header-inline">
              <span class="info-panel__title">业主主体信息</span>
              <span class="info-panel__desc info-panel__desc--inline">优先录入主体身份信息和证件材料。</span>
            </div>
          </div>

          <template v-if="form.ownerType === 'PERSONAL'">
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
                  <el-segmented v-model="form.ownerPersonal.gender" :options="genderOptions" />
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
                        <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
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
                        <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
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

        <!-- 收款人信息 -->
        <div class="info-panel info-panel--payee">
          <div class="info-panel__header">
            <div class="header-inline">
              <span class="info-panel__title">收款人信息</span>
              <span class="info-panel__desc info-panel__desc--inline">用于后续提现和打款，可与业主主体不一致。</span>
            </div>
            <el-space wrap>
              <el-button plain @click="fillPayeeFromOwner">收款人同业主</el-button>
              <el-button v-if="form.ownerType === 'COMPANY'" plain @click="fillPayeeFromContact">收款人同联系人</el-button>
            </el-space>
          </div>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="收款人姓名" :prop="form.ownerType === 'PERSONAL' ? 'ownerPersonal.payeeName' : 'ownerCompany.payeeName'">
                <el-input v-model="currentPayeeForm.payeeName" placeholder="请输入收款人姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="收款人电话" :prop="form.ownerType === 'PERSONAL' ? 'ownerPersonal.payeePhone' : 'ownerCompany.payeePhone'">
                <el-input v-model="currentPayeeForm.payeePhone" placeholder="请输入收款人电话" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="收款人证件信息" :prop="form.ownerType === 'PERSONAL' ? 'ownerPersonal.payeeIdNo' : 'ownerCompany.payeeIdNo'">
                <el-input v-model="currentPayeeForm.payeeIdNo" placeholder="请输入收款人证件号码">
                  <template #prepend>
                    <el-select v-model="currentPayeeForm.payeeIdType" style="width: 128px">
                      <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="银行卡开户名" :prop="form.ownerType === 'PERSONAL' ? 'ownerPersonal.bankAccountName' : 'ownerCompany.bankAccountName'">
                <el-input v-model="currentPayeeForm.bankAccountName" placeholder="请输入开户名" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="银行卡号" :prop="form.ownerType === 'PERSONAL' ? 'ownerPersonal.bankAccountNo' : 'ownerCompany.bankAccountNo'">
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

    <!-- ═══ 合同信息 ════════════════════════════════════════════════════════ -->
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
        <!-- 签约摘要 -->
        <div class="info-panel">
          <div class="info-panel__header">
            <div class="header-inline">
              <span class="info-panel__title">签约摘要</span>
              <span class="info-panel__desc info-panel__desc--inline">核心合同信息集中在这里，方便快速核对。</span>
            </div>
          </div>
          <div class="summary-tag-group">
            <el-tag effect="plain">签约类型：{{ signTypeLabelMap[form.ownerContract.signType || "NEW"] }}</el-tag>
            <el-tag effect="plain">合同类型：{{ contractMediumLabelMap[form.ownerContract.contractMedium || "PAPER"] }}</el-tag>
            <el-tag effect="plain">短信通知：{{ form.ownerContract.notifyOwner ? "通知业主" : "不通知" }}</el-tag>
            <el-tag effect="plain">签署状态：{{ signStatusLabelMap[form.ownerContract.signStatus || "PENDING"] }}</el-tag>
          </div>
        </div>

        <!-- 合同录入 -->
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
                <el-segmented v-model="form.ownerContract.signType" :options="signTypeOptions" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="合同类型">
                <el-segmented v-model="form.ownerContract.contractMedium" :options="contractMediumOptions" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="签署状态">
                <el-segmented v-model="form.ownerContract.signStatus" :options="signStatusOptions" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- ✅ 修复：合同周期 + 快捷按钮对齐 -->
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
              <!-- 用 el-form-item 包裹但不显示 label，使高度与左侧对齐 -->
              <el-form-item label=" ">
                <el-button-group>
                  <el-button plain @click="applyYearShortcut(1)">1 年</el-button>
                  <el-button plain @click="applyYearShortcut(3)">3 年</el-button>
                  <el-button plain @click="applyYearShortcut(5)">5 年</el-button>
                </el-button-group>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="24">
              <div class="contract-remark-field">
                <el-form-item label="合同备注">
                  <el-input v-model="form.ownerContract.remark" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="请输入合同备注" />
                </el-form-item>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- ═══ 轻托管条款 ══════════════════════════════════════════════════════ -->
    <el-card v-if="form.ownerContract.cooperationMode === 'LIGHT_MANAGED'" shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <div class="header-inline">
            <span class="card-title">轻托管条款配置</span>
            <span class="card-desc card-desc--inline">所有已选房源统一使用同一套分账规则、管理费、免租与费用科目配置。</span>
          </div>
          <span class="card-tip">统一配置后自动应用到全部房源</span>
        </div>
      </template>

      <div v-if="sharedContractSubject" class="rule-editor">
        <!-- 模式引导 -->
        <div class="mode-guide">
          <div class="mode-guide__header">
            <div>
              <div class="mode-guide__title">先选结算方式，再补充对应条款</div>
              <div class="mode-guide__desc">轻托管里最关键的是先明确你和业主怎么结算。不同结算方式只展示自己需要填写的字段。</div>
            </div>
            <el-tag effect="plain" type="primary">{{ settlementModeLabelMap[sharedContractSubject.settlementRule.settlementMode || "FIXED"] }}</el-tag>
          </div>
        </div>

        <!-- 结算方式 -->
        <div class="sub-panel">
          <div class="sub-panel__title">
            结算方式
            <div class="sub-panel__desc">选择后，页面只展示该方式下真正需要填写的字段。</div>
          </div>

          <el-form-item label="">
            <div class="settlement-mode-grid">
              <button
                v-for="option in settlementModeOptions"
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

          <!-- 固定结算 -->
          <el-row v-if="sharedContractSubject.settlementRule.settlementMode === 'FIXED'" :gutter="20">
            <el-col :span="8">
              <el-form-item label="固定给业主金额">
                <el-input-number v-model="sharedContractSubject.settlementRule.guaranteedRentAmount" :min="0" :precision="2" class="w-full" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 保底 + 分成 -->
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
                    <el-radio-button v-for="option in incomeBasisOptions" :key="option.value" :label="option.label" :value="option.value" />
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <!-- 其他分成 -->
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
                    <el-radio-button v-for="option in incomeBasisOptions" :key="option.value" :label="option.label" :value="option.value" />
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="rule-hint">
              {{
                sharedContractSubject.settlementRule.settlementMode === "AGENCY"
                  ? "业主结转比例：平台代收代付后，剩余金额按约定比例结给业主。"
                  : "业主分成比例：业主从可分账收入中拿多少。管理费比例：平台额外向业主收取多少服务管理费用。"
              }}
            </div>
          </template>
        </div>

        <!-- ✅ 优化：config-card-grid 改为三列 -->
        <div class="config-card-grid">
          <!-- ✅ 优化：管理费卡片 -->
          <div class="config-card">
            <div class="config-card__header">
              <div class="config-card__header-left">
                <div class="config-card__title">管理费</div>
                <div class="config-card__desc">按租金比例向业主额外收取管理费。</div>
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
                      按业主实收租金的
                      <strong>{{ sharedContractSubject.settlementRule.managementFeeValue ?? 0 }}%</strong>
                      向业主收取管理费。
                    </el-form-item>
                  </div>
                </div>
              </template>
              <div v-else class="config-card__empty">当前不向业主收取管理费。</div>
            </div>
          </div>

          <!-- ✅ 优化：免租规则卡片 -->
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
                <!-- 三个选项组 -->
                <el-row class="mb-4" :gutter="16">
                  <re-col :value="8" :xs="24" :sm="24">
                    <div class="choice-group__label">是否算在合同期内</div>
                    <el-segmented v-model="sharedContractSubject.rentFreeRule.freeType" :options="freeTypeOptions" size="small" />
                    <div class="choice-group__desc">
                      {{
                        sharedContractSubject.rentFreeRule.freeType === "BUILT_IN"
                          ? "免租天数算在正式合同期内，合同总时长不变。"
                          : "免租天数不算在正式合同期内，更像额外赠送的免租时间。"
                      }}
                    </div>
                  </re-col>
                  <re-col :value="8" :xs="24" :sm="24">
                    <div class="choice-group choice-group--compact">
                      <div class="choice-group__label">免租损失承担方</div>
                      <el-segmented v-model="sharedContractSubject.rentFreeRule.bearType" :options="bearTypeOptions" size="small" />
                      <div class="choice-group__desc">{{ bearTypeDescriptionMap[sharedContractSubject.rentFreeRule.bearType || "PLATFORM"] }}</div>
                    </div>
                  </re-col>

                  <re-col :value="8" :xs="24" :sm="24">
                    <div class="choice-group choice-group--compact">
                      <div class="choice-group__label">免租金额计算方式</div>
                      <el-segmented v-model="sharedContractSubject.rentFreeRule.calcMode" :options="lightManagedCalcModeOptions" size="small" />
                      <div class="choice-group__desc">{{ freeCalcModeDescriptionMap[sharedContractSubject.rentFreeRule.calcMode || "BY_DAYS"] }}</div>
                    </div>
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
                          <el-button plain @click="applyRentFreeMonthShortcut(sharedContractSubject.rentFreeRule, 1)">1 个月</el-button>
                          <el-button plain @click="applyRentFreeMonthShortcut(sharedContractSubject.rentFreeRule, 2)">2 个月</el-button>
                          <el-button plain @click="applyRentFreeMonthShortcut(sharedContractSubject.rentFreeRule, 3)">3 个月</el-button>
                        </el-button-group>
                      </div>
                    </el-space>
                  </re-col>
                </el-row>
              </template>
              <div v-else class="config-card__empty">当前不启用免租规则。</div>
            </div>
          </div>

          <!-- ✅ 优化：结算时间与手续费 — 两个字段同行 -->
          <div class="config-card">
            <div class="config-card__header">
              <div class="config-card__header-left">
                <div class="config-card__title">结算时间与手续费</div>
                <div class="config-card__desc">明确什么时候给业主出账，以及支付手续费谁承担。</div>
              </div>
              <el-tag effect="plain" type="info">统一配置</el-tag>
            </div>
            <div class="config-card__content">
              <!-- ✅ 两个字段放在同一行 -->
              <el-row>
                <re-col :value="12" :xs="24" :sm="24">
                  <el-form-item label="给业主出账时间">
                    <el-radio-group v-model="sharedContractSubject.settlementRule.settlementTiming">
                      <el-radio-button v-for="option in settlementTimingOptions" :key="option.value" :label="option.label" :value="option.value" />
                    </el-radio-group>
                  </el-form-item>
                </re-col>
                <re-col :value="12" :xs="24" :sm="24">
                  <el-form-item label="支付手续费承担方式">
                    <el-radio-group v-model="sharedContractSubject.settlementRule.paymentFeeBearType">
                      <el-radio-button v-for="option in paymentFeeBearTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
                    </el-radio-group>
                  </el-form-item>
                </re-col>
              </el-row>
            </div>
          </div>
        </div>

        <!-- ✅ 优化：分账费用科目 -->
        <div class="config-card config-card--full">
          <div class="config-card__header">
            <div class="config-card__header-left">
              <div class="config-card__title">分账费用科目</div>
              <div class="config-card__desc">先选收支和费用类型，再填写转给业主的比例。每一条都是一张独立费用卡片。</div>
            </div>
            <el-button type="primary" plain size="small" @click="addSettlementItem(sharedContractSubject)">
              <Plus />
              添加费用科目
            </el-button>
          </div>
          <div class="config-card__content">
            <div v-if="!sharedContractSubject.settlementRule.settlementItemList?.length" class="config-card__empty">暂无分账费用科目，点击右上角"添加费用科目"新增。</div>
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
                    <tr v-if="!sharedContractSubject.settlementRule.settlementItemList?.length" class="empty-row">
                      <td colspan="5"><div class="empty-state">暂无分账费用科目，点击右上角"添加费用科目"新增。</div></td>
                    </tr>
                    <tr v-for="(item, index) in sharedContractSubject.settlementRule.settlementItemList" :key="index" class="fee-row">
                      <td>
                        <el-radio-group v-model="item.feeDirection" class="direction-radio-group" size="small">
                          <el-radio-button label="IN">收</el-radio-button>
                          <el-radio-button label="OUT">支</el-radio-button>
                        </el-radio-group>
                      </td>
                      <td>
                        <el-cascader
                          v-model="settlementFeeCascaderValues[`shared-${index}`]"
                          :options="otherFeeTypeOptions"
                          :props="{ emitPath: true, checkStrictly: false }"
                          clearable
                          filterable
                          class="w-full"
                          @change="value => handleSettlementFeeTypeChange(value, sharedContractSubject, index)"
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
    </el-card>

    <!-- ═══ 包租条款 ════════════════════════════════════════════════════════ -->
    <el-card v-else shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <div class="header-inline">
            <span class="card-title">包租条款</span>
            <span class="card-desc card-desc--inline">包租按合同统一配置总月租金、押付方式、交房日期和其他费用科目。</span>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="4">
          <el-form-item label="总月租金">
            <el-input-number v-model="form.ownerLeaseRule.rentAmount" :min="0" :precision="2" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item label="总押金">
            <el-input-number v-model="form.ownerLeaseRule.depositAmount" :min="0" :precision="2" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item label="押金月数">
            <el-input-number v-model="form.ownerLeaseRule.depositMonths" :min="0" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item label="付款月数">
            <el-input-number v-model="form.ownerLeaseRule.paymentMonths" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item label="交房日期">
            <el-date-picker v-model="form.ownerLeaseRule.handoverDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item label="承租用途">
            <el-input v-model="form.ownerLeaseRule.usageType" placeholder="请输入承租用途" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="4">
          <el-form-item label="付款方式">
            <el-input v-model="form.ownerLeaseRule.payWay" placeholder="如 押一付三" />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item label="付款日设置">
            <el-select v-model="form.ownerLeaseRule.rentDueType" class="w-full">
              <el-option v-for="item in rentDueTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item label="每月付款日">
            <el-input-number v-model="form.ownerLeaseRule.rentDueDay" :min="1" :max="31" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item label="首付日期">
            <el-date-picker v-model="form.ownerLeaseRule.firstPayDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item label="折算方式">
            <el-select v-model="form.ownerLeaseRule.prorateType" class="w-full">
              <el-option v-for="item in prorateTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <div class="sub-panel">
        <div class="sub-panel__header">
          <div>
            <div class="sub-panel__title">其他费用</div>
            <div class="sub-panel__desc">参考退租费用，支持前置选择收 / 支和金额方式。</div>
          </div>
          <el-button type="primary" plain @click="addLeaseFee">添加费用</el-button>
        </div>
        <div class="fee-table-wrapper">
          <table class="fee-table fee-table--master-lease">
            <thead>
              <tr>
                <th style="width: 96px">收支</th>
                <th style="width: 240px">费用类型</th>
                <th style="width: 170px">付款方式</th>
                <th style="width: 360px">金额</th>
                <th style="width: 76px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!form.ownerLeaseRule.otherFeeList?.length" class="empty-row">
                <td colspan="5"><div class="empty-state">暂无其他费用，点击右上角"添加费用"新增。</div></td>
              </tr>
              <tr v-for="(fee, index) in form.ownerLeaseRule.otherFeeList" :key="index">
                <td>
                  <el-radio-group v-model="fee.feeDirection" class="direction-radio-group" size="small">
                    <el-radio-button label="IN">收</el-radio-button>
                    <el-radio-button label="OUT">支</el-radio-button>
                  </el-radio-group>
                </td>
                <td>
                  <el-cascader
                    v-model="leaseFeeCascaderValues[index]"
                    :options="otherFeeTypeOptions"
                    :props="{ emitPath: true, checkStrictly: false }"
                    clearable
                    filterable
                    class="w-full"
                    @change="value => handleLeaseFeeTypeChange(value, index)"
                  />
                </td>
                <td>
                  <el-select v-model="fee.paymentMethod" class="w-full">
                    <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </td>
                <td>
                  <el-input v-model.number="fee.priceInput" type="number" class="w-full" placeholder="请输入">
                    <template #prepend>
                      <el-select v-model="fee.priceMethod" style="width: 140px">
                        <el-option v-for="item in priceMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </template>
                    <template #append>{{ fee.priceMethod === 1 ? "元" : "%" }}</template>
                  </el-input>
                </td>
                <td class="text-center">
                  <el-button link type="danger" @click="form.ownerLeaseRule.otherFeeList?.splice(index, 1)">删除</el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="sub-panel">
        <div class="sub-panel__header">
          <div>
            <div class="sub-panel__title">包租免租规则</div>
            <div class="sub-panel__desc">按合同级统一设置，非必填。</div>
          </div>
          <el-button type="primary" plain @click="addLeaseFreeRule">新增规则</el-button>
        </div>
        <div class="fee-table-wrapper">
          <table class="fee-table fee-table--master-lease lease-free-table">
            <thead>
              <tr>
                <th style="width: 190px">类型</th>
                <th style="width: 170px">开始日期</th>
                <th style="width: 170px">结束日期</th>
                <th style="width: 360px">金额配置</th>
                <th style="width: 76px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!form.ownerLeaseFreeRuleList.length" class="empty-row">
                <td colspan="5"><div class="empty-state">暂无免租规则，点击右上角“新增规则”添加。</div></td>
              </tr>
              <tr v-for="(row, index) in form.ownerLeaseFreeRuleList" :key="index">
                <td>
                  <el-select v-model="row.freeType" class="w-full">
                    <el-option v-for="item in freeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </td>
                <td><el-date-picker v-model="row.startDate" type="date" value-format="YYYY-MM-DD" class="w-full" /></td>
                <td><el-date-picker v-model="row.endDate" type="date" value-format="YYYY-MM-DD" class="w-full" /></td>
                <td>
                  <template v-if="row.calcMode === 'RATIO'">
                    <el-input v-model.number="row.freeRatio" type="number" class="w-full" placeholder="请输入">
                      <template #prepend>
                        <el-select v-model="row.calcMode" style="width: 140px">
                          <el-option v-for="item in leaseFreeCalcModeOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                      </template>
                      <template #append>%</template>
                    </el-input>
                  </template>
                  <template v-else>
                    <el-input v-model.number="row.freeAmount" type="number" class="w-full" placeholder="请输入">
                      <template #prepend>
                        <el-select v-model="row.calcMode" style="width: 140px">
                          <el-option v-for="item in leaseFreeCalcModeOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                      </template>
                      <template #append>元</template>
                    </el-input>
                  </template>
                </td>
                <td class="text-center">
                  <el-button link type="danger" @click="form.ownerLeaseFreeRuleList.splice(index, 1)">删除</el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </el-card>

    <HousePicker ref="housePickerRef" @confirm="handleHouseConfirm" />
    <FocusSubjectPicker ref="focusSubjectPickerRef" @confirm="handleFocusSubjectConfirm" />

    <el-dialog v-model="previewVisible" top="10px" title="业主合同预览" width="80%" destroy-on-close append-to-body>
      <iframe v-if="pdfUrl" title="业主合同预览" :src="pdfUrl" style="width: 100%; height: 89vh; border: none" />
    </el-dialog>
  </el-form>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from "vue";
  import { ElMessageBox } from "element-plus";
  import type { FormInstance } from "element-plus";
  import { getContractTemplateParams, getMyAvailableContractTemplates } from "@/api/contract/template";
  import { getOwnerContractDetail, getOwnerContractList, previewOwnerContract } from "@/api/contract/owner";
  import UploadImage from "@/components/upload/UploadImage.vue";
  import FocusSubjectPicker from "@/shared/house/FocusSubjectPicker.vue";
  import HousePicker from "@/shared/house/HousePicker.vue";
  import { getDictDataByDictCode, getDictDataByParentCode } from "@/api/sys/dict";
  import { PAYMENT_METHOD_OPTIONS, PRICE_METHOD_OPTIONS } from "@/constants";
  import { message } from "@/utils/message";
  import Plus from "~icons/ep/plus";

  import type {
    ContractTemplateListVo,
    OwnerBearTypeEnum,
    OwnerContractIdDto,
    OwnerCooperationModeEnum,
    OwnerContractSubjectTypeEnum,
    OwnerDetailVo,
    OwnerFreeCalcModeEnum,
    OwnerFreeTypeEnum,
    OwnerIncomeBasisEnum,
    OwnerLeaseFreeRuleDto,
    OwnerProrateTypeEnum,
    OwnerSettlementModeEnum,
    OwnerSignStatusEnum,
    OwnerTypeEnum,
    OwnerCreateDto,
    OwnerListVo,
    OwnerUpdateDto
  } from "@/types/generated";
  import {
    OwnerBearTypeEnumMeta,
    OwnerCooperationModeEnumMeta,
    OwnerContractSubjectTypeEnumMeta,
    OwnerFreeCalcModeEnumMeta,
    OwnerFreeTypeEnumMeta,
    OwnerIncomeBasisEnumMeta,
    OwnerProrateTypeEnumMeta,
    OwnerSignStatusEnumMeta,
    OwnerTypeEnumMeta
  } from "@/types/generated/enum.meta";

  // ── 从拆分文件导入 ────────────────────────────────────────────────────────────
  import type {
    ContractSubjectFormItem,
    ContractTemplateParamItem,
    OwnerCompanyForm,
    OwnerContractForm,
    OwnerContractFormDto,
    OwnerLeaseFeeForm,
    OwnerLeaseRuleForm,
    OwnerPersonalForm,
    OwnerRentFreeRuleForm,
    OwnerSettlementItemForm,
    OwnerSettlementRuleForm,
    OwnerSettlementTimingValue,
    OwnerContractMediumValue,
    OwnerPaymentFeeBearTypeValue,
    OwnerSignTypeValue,
    OwnerSuggestionItem,
    PickedRoom,
    IdTypeValue,
    StatusValue,
    ApprovalStatusValue,
    GenderValue
  } from "./ownerContractFormTypes";
  import {
    BEAR_TYPE_DESCRIPTION_MAP,
    FREE_CALC_MODE_DESCRIPTION_MAP,
    SETTLEMENT_MODE_LABEL_MAP,
    SIGN_TYPE_LABEL_MAP,
    CONTRACT_MEDIUM_LABEL_MAP,
    SIGN_STATUS_LABEL_MAP,
    INCOME_BASIS_LABEL_MAP,
    BEAR_TYPE_LABEL_MAP,
    FREE_TYPE_LABEL_MAP,
    FREE_CALC_MODE_LABEL_MAP,
    PRORATE_TYPE_LABEL_MAP,
    PAYMENT_FEE_BEAR_TYPE_LABEL_MAP,
    SETTLEMENT_TIMING_LABEL_MAP,
    COOPERATION_MODE_LABEL_MAP,
    OWNER_TYPE_LABEL_MAP
  } from "./ownerContractFormTypes";
  import { createOwnerContractRules } from "./ownerContractFormRules";
  import ReCol from "@/components/ReCol";

  defineOptions({ name: "OwnerContractFormDialog" });

  interface Props {
    formInline?: OwnerDetailVo | null;
    isEdit?: boolean;
  }

  type SubjectSelectionRow = {
    subjectType: OwnerContractSubjectTypeEnum;
    subjectId: string;
    subjectName: string;
    address?: string;
    focusId?: string;
    focusName?: string;
    floorTotal?: number;
    houseCountPerFloor?: number;
  };

  const props = withDefaults(defineProps<Props>(), {
    formInline: null,
    isEdit: false
  });

  // ─── 响应式状态 ────────────────────────────────────────────────────────────────
  const formRef = ref<FormInstance>();
  const housePickerRef = ref<InstanceType<typeof HousePicker>>();
  const focusSubjectPickerRef = ref<InstanceType<typeof FocusSubjectPicker>>();
  const contractTemplates = ref<ContractTemplateListVo[]>([]);
  const templateParams = ref<ContractTemplateParamItem[]>([]);
  const templateParamsLoading = ref(false);
  const otherFeeTypeOptions = ref<any[]>([]);
  const leaseFeeCascaderValues = ref<Record<number, any[]>>({});
  const settlementFeeCascaderValues = ref<Record<string, any[]>>({});
  const contractDateRange = ref<string[]>([]);
  const selectedSubjects = ref<SubjectSelectionRow[]>([]);
  const previewVisible = ref(false);
  const pdfUrl = ref("");
  const ownerTagOptions = ref<{ label: string; value: string }[]>([]);
  const selectedSubjectType = ref<OwnerContractSubjectTypeEnum>(OwnerContractSubjectTypeEnumMeta.HOUSE.value as OwnerContractSubjectTypeEnum);

  // ─── Label maps（从 types 导入后本地绑定，便于模板访问） ──────────────────────
  const signTypeLabelMap = SIGN_TYPE_LABEL_MAP;
  const contractMediumLabelMap = CONTRACT_MEDIUM_LABEL_MAP;
  const signStatusLabelMap = SIGN_STATUS_LABEL_MAP;
  const bearTypeDescriptionMap = BEAR_TYPE_DESCRIPTION_MAP;
  const freeCalcModeDescriptionMap = FREE_CALC_MODE_DESCRIPTION_MAP;
  const settlementModeLabelMap = SETTLEMENT_MODE_LABEL_MAP;

  // ─── 静态选项 ──────────────────────────────────────────────────────────────────
  const idTypeOptions = [
    { label: "身份证", value: "ID_CARD" as IdTypeValue },
    { label: "护照", value: "PASSPORT" as IdTypeValue },
    { label: "港澳通行证", value: "HONGKONG_MACAO" as IdTypeValue },
    { label: "台胞证", value: "TAIWAN" as IdTypeValue }
  ];
  const genderOptions = [
    { label: "未知", value: "UNKNOWN" as GenderValue },
    { label: "男", value: "MALE" as GenderValue },
    { label: "女", value: "FEMALE" as GenderValue }
  ];
  const ownerTypeOptions = [
    { label: OWNER_TYPE_LABEL_MAP.PERSONAL, value: OwnerTypeEnumMeta.PERSONAL.value as OwnerTypeEnum },
    { label: OWNER_TYPE_LABEL_MAP.COMPANY, value: OwnerTypeEnumMeta.COMPANY.value as OwnerTypeEnum }
  ];
  const cooperationModeOptions = [
    { label: COOPERATION_MODE_LABEL_MAP.LIGHT_MANAGED, value: OwnerCooperationModeEnumMeta.LIGHT_MANAGED.value as OwnerCooperationModeEnum },
    { label: COOPERATION_MODE_LABEL_MAP.MASTER_LEASE, value: OwnerCooperationModeEnumMeta.MASTER_LEASE.value as OwnerCooperationModeEnum }
  ];
  const signStatusOptions = [
    { label: SIGN_STATUS_LABEL_MAP.PENDING, value: OwnerSignStatusEnumMeta.PENDING.value as OwnerSignStatusEnum },
    { label: SIGN_STATUS_LABEL_MAP.SIGNED, value: OwnerSignStatusEnumMeta.SIGNED.value as OwnerSignStatusEnum }
  ];
  const settlementModeOptions = [
    {
      label: SETTLEMENT_MODE_LABEL_MAP.FIXED,
      value: "FIXED" as OwnerSettlementModeEnum,
      desc: "平台按固定金额给业主，适合托管报价已经谈死的场景。",
      features: ["固定金额", "平台承担波动"]
    },
    {
      label: SETTLEMENT_MODE_LABEL_MAP.SHARE_NET,
      value: "SHARE_NET" as OwnerSettlementModeEnum,
      desc: "先扣约定费用，再把净额按比例分给业主。",
      features: ["先扣费用", "再做分成"]
    },
    {
      label: SETTLEMENT_MODE_LABEL_MAP.GUARANTEE_PLUS_SHARE,
      value: "GUARANTEE_PLUS_SHARE" as OwnerSettlementModeEnum,
      desc: "先给业主保底金额，超出部分再按比例分成。",
      features: ["保底金额", "超额再分"]
    },
    {
      label: SETTLEMENT_MODE_LABEL_MAP.AGENCY,
      value: "AGENCY" as OwnerSettlementModeEnum,
      desc: "平台负责代收代付，最后按约定把剩余款项结给业主。",
      features: ["代收代付", "结余转业主"]
    }
  ];
  const incomeBasisOptions = Object.values(OwnerIncomeBasisEnumMeta).map(item => ({
    label: INCOME_BASIS_LABEL_MAP[item.value as OwnerIncomeBasisEnum],
    value: item.value as OwnerIncomeBasisEnum
  }));
  const bearTypeOptions = Object.values(OwnerBearTypeEnumMeta).map(item => ({
    label: BEAR_TYPE_LABEL_MAP[item.value as OwnerBearTypeEnum],
    value: item.value as OwnerBearTypeEnum
  }));
  const freeTypeOptions = Object.values(OwnerFreeTypeEnumMeta).map(item => ({
    label: FREE_TYPE_LABEL_MAP[item.value as OwnerFreeTypeEnum],
    value: item.value as OwnerFreeTypeEnum
  }));
  const lightManagedCalcModeOptions = Object.values(OwnerFreeCalcModeEnumMeta).map(item => ({
    label: FREE_CALC_MODE_LABEL_MAP[item.value as OwnerFreeCalcModeEnum],
    value: item.value as OwnerFreeCalcModeEnum
  }));
  const leaseFreeCalcModeOptions = Object.values(OwnerFreeCalcModeEnumMeta)
    .filter(item => item.value !== "BY_DAYS")
    .map(item => ({
      label: FREE_CALC_MODE_LABEL_MAP[item.value as OwnerFreeCalcModeEnum],
      value: item.value as OwnerFreeCalcModeEnum
    }));
  const prorateTypeOptions = Object.values(OwnerProrateTypeEnumMeta).map(item => ({
    label: PRORATE_TYPE_LABEL_MAP[item.value as OwnerProrateTypeEnum],
    value: item.value as OwnerProrateTypeEnum
  }));
  const signTypeOptions = [
    { label: SIGN_TYPE_LABEL_MAP.NEW, value: "NEW" as OwnerSignTypeValue },
    { label: SIGN_TYPE_LABEL_MAP.RENEW, value: "RENEW" as OwnerSignTypeValue }
  ];
  const contractMediumOptions = [
    { label: CONTRACT_MEDIUM_LABEL_MAP.ELECTRONIC, value: "ELECTRONIC" as OwnerContractMediumValue },
    { label: CONTRACT_MEDIUM_LABEL_MAP.PAPER, value: "PAPER" as OwnerContractMediumValue }
  ];
  const paymentFeeBearTypeOptions = [
    { label: PAYMENT_FEE_BEAR_TYPE_LABEL_MAP.PLATFORM_ALL, value: "PLATFORM_ALL" as OwnerPaymentFeeBearTypeValue },
    { label: PAYMENT_FEE_BEAR_TYPE_LABEL_MAP.OWNER_ALL, value: "OWNER_ALL" as OwnerPaymentFeeBearTypeValue },
    { label: PAYMENT_FEE_BEAR_TYPE_LABEL_MAP.BY_INCOME_SHARE, value: "BY_INCOME_SHARE" as OwnerPaymentFeeBearTypeValue }
  ];
  const settlementTimingOptions = [
    { label: SETTLEMENT_TIMING_LABEL_MAP.TENANT_PAYMENT_REALTIME, value: "TENANT_PAYMENT_REALTIME" as OwnerSettlementTimingValue },
    { label: SETTLEMENT_TIMING_LABEL_MAP.LEASE_START_GENERATE_BILL, value: "LEASE_START_GENERATE_BILL" as OwnerSettlementTimingValue }
  ];
  const subjectTypeOptions = [
    {
      label: "房源",
      value: OwnerContractSubjectTypeEnumMeta.HOUSE.value as OwnerContractSubjectTypeEnum,
      desc: "逐套选择，适合分散式和单套托管。"
    },
    {
      label: "集中式",
      value: OwnerContractSubjectTypeEnumMeta.FOCUS.value as OwnerContractSubjectTypeEnum,
      desc: "可直接选整项目，也可进入项目勾选多个楼栋。"
    }
  ];
  const rentDueTypeOptions = [
    { label: "提前收租", value: "EARLY" as const },
    { label: "固定日期付款", value: "FIXED" as const },
    { label: "延后付款", value: "LATE" as const }
  ];
  const paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
  const priceMethodOptions = PRICE_METHOD_OPTIONS;

  // ─── 工厂函数 ──────────────────────────────────────────────────────────────────
  const createSettlementItem = (): OwnerSettlementItemForm => ({
    feeDirection: "IN",
    feeType: "",
    itemName: "",
    transferEnabled: true,
    transferRatio: 100,
    sortOrder: 0,
    remark: ""
  });
  const createLeaseFee = (): OwnerLeaseFeeForm => ({
    feeDirection: "IN",
    paymentMethod: paymentMethodOptions[0]?.value,
    priceMethod: priceMethodOptions[0]?.value,
    priceInput: undefined,
    remark: ""
  });
  const createDefaultSettlementRule = (): OwnerSettlementRuleForm => ({
    incomeBasis: "RECEIVED",
    settlementMode: "FIXED",
    guaranteedRentAmount: 0,
    hasGuaranteedRent: false,
    commissionMode: "RATIO",
    commissionValue: 0,
    serviceFeeMode: "FIXED",
    serviceFeeValue: 0,
    managementFeeEnabled: false,
    managementFeeMode: "RATIO",
    managementFeeValue: 0,
    bearTaxType: "PLATFORM",
    paymentFeeBearType: "PLATFORM_ALL",
    settlementTiming: "TENANT_PAYMENT_REALTIME",
    rentFreeEnabled: false,
    settlementItemList: [],
    status: "ACTIVE"
  });
  const createDefaultRentFreeRule = (): OwnerRentFreeRuleForm => ({
    enabled: false,
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

  function cloneSettlementRule(rule?: OwnerSettlementRuleForm): OwnerSettlementRuleForm {
    return {
      ...createDefaultSettlementRule(),
      ...(rule || {}),
      settlementItemList: ((rule?.settlementItemList || []) as OwnerSettlementItemForm[]).map(item => ({ ...createSettlementItem(), ...item }))
    };
  }
  function cloneRentFreeRule(rule?: OwnerRentFreeRuleForm): OwnerRentFreeRuleForm {
    return { ...createDefaultRentFreeRule(), ...(rule || {}) };
  }
  const createSubjectRule = (subjectType: OwnerContractSubjectTypeEnum, subjectId: string, subjectName: string, base?: ContractSubjectFormItem): ContractSubjectFormItem => ({
    subjectType,
    subjectId,
    subjectName,
    remark: "",
    settlementRule: cloneSettlementRule(base?.settlementRule),
    rentFreeRule: cloneRentFreeRule(base?.rentFreeRule)
  });
  const createDefaultForm = (): OwnerContractForm => ({
    ownerType: "PERSONAL",
    ownerPersonal: {
      name: "",
      phone: "",
      idType: "ID_CARD",
      idNo: "",
      gender: "MALE",
      idCardFrontList: [],
      idCardBackList: [],
      idCardInHandList: [],
      otherImageList: [],
      tags: [],
      payeeName: "",
      payeePhone: "",
      payeeIdType: "ID_CARD",
      payeeIdNo: "",
      bankAccountName: "",
      bankAccountNo: "",
      bankName: "",
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
      businessLicenseUrls: [],
      payeeName: "",
      payeePhone: "",
      payeeIdType: "ID_CARD",
      payeeIdNo: "",
      bankAccountName: "",
      bankAccountNo: "",
      bankName: "",
      status: "ACTIVE"
    },
    ownerContract: {
      cooperationMode: "LIGHT_MANAGED",
      contractTemplateId: undefined,
      contractMedium: "PAPER",
      signType: "NEW",
      notifyOwner: false,
      signStatus: "PENDING",
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      contractStart: "",
      contractEnd: "",
      remark: ""
    },
    contractSubjectList: [],
    ownerLeaseRule: {
      rentAmount: 0,
      depositAmount: 0,
      depositMonths: 1,
      paymentMonths: 1,
      payWay: "",
      rentDueType: "FIXED",
      rentDueDay: 4,
      rentDueOffsetDays: 0,
      firstPayDate: "",
      handoverDate: "",
      usageType: "",
      billingStart: "",
      billingEnd: "",
      prorateType: "BY_DAYS",
      otherFeeList: [],
      status: "ACTIVE"
    },
    ownerLeaseFreeRuleList: []
  });

  const form = reactive<OwnerContractForm>(createDefaultForm());

  // ─── 校验规则（从 ownerContractFormRules.ts 生成） ─────────────────────────────────────────────
  const rules = createOwnerContractRules(() => form);

  // ─── 计算属性 ──────────────────────────────────────────────────────────────────
  const sharedContractSubject = computed(() => form.contractSubjectList[0]);
  const configuredSubjectCount = computed(() => form.contractSubjectList.filter(item => isHouseConfigured(item)).length);
  const currentPayeeForm = computed(() => (form.ownerType === "PERSONAL" ? form.ownerPersonal : form.ownerCompany));
  const selectedTemplate = computed(() => contractTemplates.value.find(item => String(item.id || "") === String(form.ownerContract.contractTemplateId || "")));
  const templateParamLabelMap = computed(() => templateParams.value.reduce<Record<string, string>>((acc, item) => ((acc[item.key] = item.label), acc), {}));
  const currentSubjectTypeLabel = computed(() => getSubjectTypeLabel(selectedSubjectType.value));
  const currentSubjectTypeDesc = computed(() => {
    if (selectedSubjectType.value === OwnerContractSubjectTypeEnumMeta.FOCUS.value) {
      return "集中式下既可以直接选择整项目，也可以进入项目后勾选多个楼栋。";
    }
    return "适合分散式场景，逐套选择房源后纳入合同。";
  });
  const currentSubjectUnit = computed(() => (selectedSubjectType.value === OwnerContractSubjectTypeEnumMeta.FOCUS.value ? "项" : "套"));

  // ─── 业务函数 ──────────────────────────────────────────────────────────────────
  function isHouseConfigured(item: ContractSubjectFormItem) {
    if (form.ownerContract.cooperationMode === "MASTER_LEASE") return true;
    const source = sharedContractSubject.value || item;
    return Boolean(
      Number(source.settlementRule?.guaranteedRentAmount || 0) > 0 ||
      Number(source.settlementRule?.commissionValue || 0) > 0 ||
      source.settlementRule?.settlementItemList?.length ||
      source.rentFreeRule?.enabled ||
      source.settlementRule?.hasGuaranteedRent ||
      source.settlementRule?.managementFeeEnabled
    );
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

  async function loadFeeTypeOptions() {
    const res = await getDictDataByParentCode({ dictCode: "fee_type" });
    otherFeeTypeOptions.value = (res.data || []).map((dict: any) => ({
      label: dict.dictName,
      value: dict.dictCode,
      children: (dict.dictDataList || []).map((item: any) => ({ label: item.name, value: item.id }))
    }));
  }

  async function loadOwnerTagOptions() {
    const res = await getDictDataByDictCode({ dictCode: "owner_tag" });
    ownerTagOptions.value = (res.data || []).map((item: any) => ({
      label: item.name || item.dictName || "",
      value: item.dictCode || item.code || item.value || ""
    }));
  }

  function resetForm() {
    Object.assign(form, createDefaultForm());
    contractDateRange.value = [];
    selectedSubjects.value = [];
    selectedSubjectType.value = OwnerContractSubjectTypeEnumMeta.HOUSE.value as OwnerContractSubjectTypeEnum;
  }

  function mapDetailToForm(detail?: OwnerDetailVo | null) {
    resetForm();
    if (!detail) return;
    const raw = detail as any;
    form.ownerType = detail.ownerType || "PERSONAL";
    form.ownerPersonal = { ...createDefaultForm().ownerPersonal, ...(raw.ownerPersonal || {}) };
    form.ownerCompany = { ...createDefaultForm().ownerCompany, ...(raw.ownerCompany || {}) };
    form.ownerContract = { ...createDefaultForm().ownerContract, ...(raw.ownerContract || {}) };
    contractDateRange.value = [raw.ownerContract?.contractStart || "", raw.ownerContract?.contractEnd || ""].filter(Boolean);
    form.contractSubjectList = (raw.contractSubjectList || []).map((item: any) => ({
      ...item,
      id: item.id,
      subjectType: item.subjectType || (OwnerContractSubjectTypeEnumMeta.HOUSE.value as OwnerContractSubjectTypeEnum),
      subjectId: String(item.subjectId || ""),
      subjectName: item.subjectName || "",
      remark: item.remark || "",
      settlementRule: cloneSettlementRule(item.settlementRule),
      rentFreeRule: cloneRentFreeRule(item.rentFreeRule)
    }));
    selectedSubjectType.value =
      form.contractSubjectList[0]?.subjectType === OwnerContractSubjectTypeEnumMeta.HOUSE.value
        ? (OwnerContractSubjectTypeEnumMeta.HOUSE.value as OwnerContractSubjectTypeEnum)
        : (OwnerContractSubjectTypeEnumMeta.FOCUS.value as OwnerContractSubjectTypeEnum);
    selectedSubjects.value = form.contractSubjectList.map(item => ({
      subjectType: item.subjectType,
      subjectId: String(item.subjectId || ""),
      subjectName: item.subjectName || ""
    }));
    form.ownerLeaseRule = { ...createDefaultForm().ownerLeaseRule, ...(raw.ownerLeaseRule || {}) };
    form.ownerLeaseFreeRuleList = (raw.ownerLeaseFreeRuleList || []).map((item: any) => ({ ...createDefaultLeaseFreeRule(), ...item }));
    syncLeaseFeeCascaderValues();
    syncSettlementFeeCascaderValues();
  }

  function syncContractSubjects(rows: SubjectSelectionRow[]) {
    selectedSubjects.value = rows || [];
    const houseMap = new Map<string, ContractSubjectFormItem>();
    const sharedRule = form.contractSubjectList[0];
    for (const row of rows || []) {
      const subjectId = String(row.subjectId || "");
      if (!subjectId) continue;
      const key = `${row.subjectType}-${subjectId}`;
      const existing = form.contractSubjectList.find(item => item.subjectType === row.subjectType && item.subjectId === subjectId);
      houseMap.set(key, existing || createSubjectRule(row.subjectType, subjectId, row.subjectName || "", sharedRule));
    }
    form.contractSubjectList = Array.from(houseMap.values());
    if (form.ownerContract.cooperationMode === "LIGHT_MANAGED" && form.contractSubjectList.length > 1) {
      const shared = form.contractSubjectList[0];
      form.contractSubjectList = form.contractSubjectList.map(item => ({
        ...item,
        settlementRule: cloneSettlementRule(shared.settlementRule),
        rentFreeRule: cloneRentFreeRule(shared.rentFreeRule)
      }));
    }
  }

  function handleHouseConfirm(rows: PickedRoom[]) {
    syncContractSubjects(
      (rows || []).map(row => ({
        subjectType: OwnerContractSubjectTypeEnumMeta.HOUSE.value as OwnerContractSubjectTypeEnum,
        subjectId: String(row.houseId || ""),
        subjectName: row.houseName || "",
        address: row.address || ""
      }))
    );
  }

  function removeSubject(subjectType?: OwnerContractSubjectTypeEnum, subjectId?: string | number) {
    const currentId = String(subjectId || "");
    form.contractSubjectList = form.contractSubjectList.filter(item => !(item.subjectType === subjectType && String(item.subjectId || "") === currentId));
    selectedSubjects.value = selectedSubjects.value.filter(item => !(item.subjectType === subjectType && item.subjectId === currentId));
  }

  function clearSubjectSelection() {
    form.contractSubjectList = [];
    selectedSubjects.value = [];
  }

  async function handleSubjectTypeChange(nextType: OwnerContractSubjectTypeEnum) {
    if (selectedSubjectType.value === nextType) return;
    if (!form.contractSubjectList.length) {
      selectedSubjectType.value = nextType;
      return;
    }
    try {
      await ElMessageBox.confirm("切换合同房源类型后，当前已选内容会被清空。是否继续？", "切换合同房源类型", {
        type: "warning",
        confirmButtonText: "继续切换",
        cancelButtonText: "取消"
      });
      clearSubjectSelection();
      selectedSubjectType.value = nextType;
    } catch {
      return;
    }
  }

  function getSubjectTypeLabel(subjectType?: OwnerContractSubjectTypeEnum) {
    if (subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS.value) return "集中式";
    return "整/合租";
  }

  function getSubjectTypeShortLabel(subjectType?: OwnerContractSubjectTypeEnum) {
    if (subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS.value) return "项目";
    if (subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS_BUILDING.value) return "楼栋";
    return "整/合租";
  }

  function openSubjectPicker() {
    if (selectedSubjectType.value === OwnerContractSubjectTypeEnumMeta.FOCUS.value) {
      focusSubjectPickerRef.value?.show({
        selected: selectedSubjects.value.filter(
          item =>
            item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS.value ||
            item.subjectType === OwnerContractSubjectTypeEnumMeta.FOCUS_BUILDING.value
        )
      });
      return;
    }
    housePickerRef.value?.show({
      selected: selectedSubjects.value.map(item => ({ houseId: item.subjectId, houseName: item.subjectName })),
      excludeOwnerContractId: form.ownerContract.id
    });
  }

  function handleFocusSubjectConfirm(rows: SubjectSelectionRow[]) {
    syncContractSubjects(rows || []);
  }

  function addSettlementItem(house: ContractSubjectFormItem) {
    if (!house.settlementRule.settlementItemList) house.settlementRule.settlementItemList = [];
    house.settlementRule.settlementItemList.push(createSettlementItem());
  }

  function handleSettlementFeeTypeChange(value: any, house: ContractSubjectFormItem, index: number) {
    const target = house.settlementRule.settlementItemList?.[index];
    if (!target || !Array.isArray(value) || value.length < 2) return;
    const parent = otherFeeTypeOptions.value.find((item: any) => item.value === value[0]);
    const child = parent?.children?.find((item: any) => item.value === value[1]);
    if (!child) return;
    target.feeType = String(child.value);
    target.itemName = child.label;
    target.transferEnabled = true;
  }

  function queryOwnerSuggestions(queryString: string, cb: (items: OwnerSuggestionItem[]) => void) {
    const keyword = queryString.trim();
    if (!keyword) {
      cb([]);
      return;
    }
    void getOwnerContractList({ currentPage: 1, pageSize: 10, ownerType: form.ownerType, ownerName: keyword } as any)
      .then(resp => {
        const list = (resp.data?.list || []) as OwnerListVo[];
        const dedupMap = new Map<string, OwnerSuggestionItem>();
        list.forEach(item => {
          const key = String(item.ownerId || item.contractId || "");
          if (!key || dedupMap.has(key)) return;
          dedupMap.set(key, { value: item.ownerName || "", ownerId: item.ownerId, contractId: item.contractId, ownerPhone: item.ownerPhone || "" });
        });
        cb(Array.from(dedupMap.values()));
      })
      .catch(() => cb([]));
  }

  async function handleOwnerSuggestionSelect(item: OwnerSuggestionItem) {
    if (!item.contractId) return;
    const resp = await getOwnerContractDetail({ contractId: item.contractId });
    const detail = resp.data;
    if (!detail) return;
    if (form.ownerType === "PERSONAL" && detail.ownerPersonal) {
      form.ownerPersonal = { ...form.ownerPersonal, ...detail.ownerPersonal };
    }
    if (form.ownerType === "COMPANY" && detail.ownerCompany) {
      form.ownerCompany = { ...form.ownerCompany, ...detail.ownerCompany };
    }
  }

  function fillPayeeFromOwner() {
    if (form.ownerType === "PERSONAL") {
      form.ownerPersonal.payeeName = form.ownerPersonal.name;
      form.ownerPersonal.payeePhone = form.ownerPersonal.phone;
      form.ownerPersonal.payeeIdType = form.ownerPersonal.idType;
      form.ownerPersonal.payeeIdNo = form.ownerPersonal.idNo;
      form.ownerPersonal.bankAccountName = form.ownerPersonal.name;
      return;
    }
    form.ownerCompany.payeeName = form.ownerCompany.name || form.ownerCompany.legalPerson;
    form.ownerCompany.payeePhone = form.ownerCompany.contactPhone;
    form.ownerCompany.payeeIdType = form.ownerCompany.legalPersonIdType;
    form.ownerCompany.payeeIdNo = form.ownerCompany.legalPersonIdNo;
    form.ownerCompany.bankAccountName = form.ownerCompany.name;
  }

  function fillPayeeFromContact() {
    if (form.ownerType !== "COMPANY") return;
    form.ownerCompany.payeeName = form.ownerCompany.contactName || form.ownerCompany.legalPerson;
    form.ownerCompany.payeePhone = form.ownerCompany.contactPhone;
    form.ownerCompany.payeeIdType = form.ownerCompany.legalPersonIdType;
    form.ownerCompany.payeeIdNo = form.ownerCompany.legalPersonIdNo;
    form.ownerCompany.bankAccountName = form.ownerCompany.contactName || form.ownerCompany.name;
  }

  function addLeaseFreeRule() {
    form.ownerLeaseFreeRuleList.push(createDefaultLeaseFreeRule());
  }
  function addLeaseFee() {
    if (!form.ownerLeaseRule.otherFeeList) form.ownerLeaseRule.otherFeeList = [];
    form.ownerLeaseRule.otherFeeList.push(createLeaseFee());
  }
  function handleLeaseFeeTypeChange(value: any, index: number) {
    const target = form.ownerLeaseRule.otherFeeList?.[index];
    if (!target || !Array.isArray(value) || value.length < 2) return;
    const parent = otherFeeTypeOptions.value.find((item: any) => item.value === value[0]);
    const child = parent?.children?.find((item: any) => item.value === value[1]);
    if (!child) return;
    target.feeType = String(child.value);
    target.feeName = child.label;
  }

  function syncLeaseFeeCascaderValues() {
    const values: Record<number, any[]> = {};
    (form.ownerLeaseRule.otherFeeList || []).forEach((fee, index) => {
      if (!fee.feeType || !otherFeeTypeOptions.value.length) return;
      for (const parent of otherFeeTypeOptions.value) {
        const child = parent.children?.find((item: any) => String(item.value) === String(fee.feeType));
        if (child) {
          values[index] = [parent.value, child.value];
          break;
        }
      }
    });
    leaseFeeCascaderValues.value = values;
  }

  function syncSettlementFeeCascaderValues() {
    const values: Record<string, any[]> = {};
    (sharedContractSubject.value?.settlementRule.settlementItemList || []).forEach((item, index) => {
      if (!item.feeType || !otherFeeTypeOptions.value.length) return;
      for (const parent of otherFeeTypeOptions.value) {
        const child = parent.children?.find((option: any) => String(option.value) === String(item.feeType));
        if (child) {
          values[`shared-${index}`] = [parent.value, child.value];
          break;
        }
      }
    });
    settlementFeeCascaderValues.value = values;
  }

  function applyYearShortcut(years: number) {
    const start = contractDateRange.value[0] || new Date().toISOString().slice(0, 10);
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) return;
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + years);
    endDate.setDate(endDate.getDate() - 1);
    contractDateRange.value = [formatDateValue(startDate), formatDateValue(endDate)];
  }

  /** ✅ 新增：免租日期快捷填写 */
  function applyRentFreeMonthShortcut(rule: OwnerRentFreeRuleForm, months: number) {
    const baseStr = rule.startDate || "";
    const base = baseStr ? new Date(baseStr) : new Date();
    if (Number.isNaN(base.getTime())) return;

    // 如果没有开始日期，将 base 也作为开始日期写入
    if (!rule.startDate) {
      rule.startDate = formatDateValue(base);
    }

    const end = new Date(base);
    end.setMonth(end.getMonth() + months);
    end.setDate(end.getDate() - 1);
    rule.endDate = formatDateValue(end);
  }

  async function handlePreview(contractId?: string | number) {
    if (!contractId) {
      message("合同未保存，暂不支持预览", { type: "warning" });
      return;
    }
    const resp = await previewOwnerContract({ contractId } as OwnerContractIdDto);
    const blob = new Blob([resp], { type: "application/pdf" });
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = URL.createObjectURL(blob);
    previewVisible.value = true;
  }

  function formatDateValue(value: Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, "0");
    const day = `${value.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function normalizeLightManagedRule(rule: OwnerSettlementRuleForm): OwnerSettlementRuleForm {
    const next = { ...rule };
    next.commissionMode = "RATIO";
    next.managementFeeMode = "RATIO";
    next.serviceFeeMode = "FIXED";
    next.serviceFeeValue = 0;
    switch (next.settlementMode) {
      case "FIXED":
        next.hasGuaranteedRent = false;
        next.incomeBasis = "RECEIVED";
        next.commissionValue = 0;
        break;
      case "GUARANTEE_PLUS_SHARE":
        next.hasGuaranteedRent = true;
        if (!next.incomeBasis) next.incomeBasis = "RECEIVED";
        break;
      case "SHARE_GROSS":
        next.settlementMode = "SHARE_NET";
        next.hasGuaranteedRent = false;
        next.incomeBasis = "RECEIVABLE";
        break;
      case "SHARE_NET":
        next.hasGuaranteedRent = false;
        next.incomeBasis = "RECEIVABLE";
        break;
      case "AGENCY":
        next.hasGuaranteedRent = false;
        next.incomeBasis = "RECEIVABLE";
        break;
      default:
        next.hasGuaranteedRent = false;
        next.incomeBasis = "RECEIVED";
        break;
    }
    next.rentFreeEnabled = Boolean(next.rentFreeEnabled);
    return next;
  }

  function buildSubmitPayload(): OwnerCreateDto | OwnerUpdateDto {
    const ownerContract: OwnerContractFormDto = {
      ...form.ownerContract,
      contractStart: contractDateRange.value[0],
      contractEnd: contractDateRange.value[1]
    };
    const sharedSettlementRule = sharedContractSubject.value?.settlementRule ? normalizeLightManagedRule(sharedContractSubject.value.settlementRule) : undefined;
    const sharedRentFreeRule = sharedContractSubject.value?.rentFreeRule ? { ...sharedContractSubject.value.rentFreeRule } : undefined;
    const payload: any = {
      ownerType: form.ownerType,
      ownerContract,
      contractSubjectList: form.contractSubjectList.map(item => ({
        id: item.id,
        subjectType: item.subjectType,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        remark: item.remark,
        settlementRule:
          form.ownerContract.cooperationMode === "LIGHT_MANAGED"
            ? {
                ...(sharedSettlementRule || {}),
                guaranteedRentAmount: sharedSettlementRule?.settlementMode === "FIXED" || sharedSettlementRule?.hasGuaranteedRent ? sharedSettlementRule?.guaranteedRentAmount : 0,
                managementFeeValue: sharedSettlementRule?.managementFeeEnabled ? sharedSettlementRule?.managementFeeValue : 0,
                rentFreeEnabled: Boolean(sharedRentFreeRule?.enabled),
                settlementItemList: ((sharedSettlementRule?.settlementItemList || []) as OwnerSettlementItemForm[]).map(si => ({
                  feeDirection: si.feeDirection,
                  feeType: si.feeType,
                  itemName: si.itemName,
                  transferEnabled: si.transferEnabled,
                  transferRatio: si.transferRatio,
                  sortOrder: si.sortOrder,
                  remark: si.remark
                }))
              }
            : undefined,
        rentFreeRule:
          form.ownerContract.cooperationMode === "LIGHT_MANAGED"
            ? {
                ...(sharedRentFreeRule || {}),
                startDate: sharedRentFreeRule?.enabled ? sharedRentFreeRule.startDate : undefined,
                endDate: sharedRentFreeRule?.enabled ? sharedRentFreeRule.endDate : undefined
              }
            : undefined
      }))
    };
    if (form.ownerType === "PERSONAL") payload.ownerPersonal = { ...form.ownerPersonal };
    else payload.ownerCompany = { ...form.ownerCompany };
    if (form.ownerContract.cooperationMode === "MASTER_LEASE") {
      payload.ownerLeaseRule = {
        ...form.ownerLeaseRule,
        otherFeeList: form.ownerLeaseRule.otherFeeList || [],
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
    if (contractDateRange.value.length !== 2) throw new Error("请选择合同周期");
    return buildSubmitPayload();
  }

  function getRef() {
    return formRef.value;
  }

  // ─── Watchers ──────────────────────────────────────────────────────────────────
  watch(
    () => props.formInline,
    value => {
      mapDetailToForm(value);
    },
    { immediate: true }
  );
  watch(previewVisible, value => {
    if (!value && pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = "";
    }
  });
  watch(
    [() => form.ownerLeaseRule.otherFeeList, otherFeeTypeOptions],
    () => {
      syncLeaseFeeCascaderValues();
    },
    { deep: true }
  );
  watch(
    [() => form.contractSubjectList, otherFeeTypeOptions],
    () => {
      syncSettlementFeeCascaderValues();
    },
    { deep: true }
  );

  onMounted(async () => {
    await Promise.all([loadTemplates(), loadTemplateParams(), loadFeeTypeOptions(), loadOwnerTagOptions()]);
    syncLeaseFeeCascaderValues();
    syncSettlementFeeCascaderValues();
  });

  defineExpose({ getRef, validateAndBuildPayload, form });
</script>

<style scoped lang="scss">
  .owner-contract-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-card {
    border-radius: 12px;
  }

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .header-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .card-desc,
  .card-tip,
  .sub-panel__desc,
  .rule-editor__desc {
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  .card-desc--inline,
  .info-panel__desc--inline {
    margin-top: 0;
    background: #fff7ed;
    color: #9a3412;
    padding: 0 5px;
  }

  .upload-section {
    margin-top: 8px;
  }

  .upload-section__title,
  .sub-panel__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
  }

  .field-tip {
    margin-top: -4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .owner-suggestion__title {
    color: var(--el-text-color-primary);
  }
  .owner-suggestion__meta {
    margin-top: 2px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .upload-tip {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
  }

  .upload-section :deep(.el-upload),
  .upload-section :deep(.upload-wrap) {
    width: 112px !important;
    height: 72px !important;
  }

  .upload-form-item {
    margin-bottom: 0;
  }
  .upload-form-item :deep(.el-form-item__content) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .owner-info-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 12px;
  }
  .contract-info-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-panel {
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-fill-color-extra-light);
  }

  .info-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .card-header-form {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 12px 16px;
  }

  .card-header-form__item {
    margin-bottom: 0;
    flex-shrink: 0;
  }
  .card-header-form__item :deep(.el-form-item__label) {
    padding-bottom: 0;
    margin-right: 8px;
    color: var(--el-text-color-regular);
  }
  .card-header-form__item :deep(.el-form-item__content) {
    min-height: auto;
  }

  .header-switch-row {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-shrink: 0;
    min-height: 32px;
  }

  .header-switch-row__label {
    font-size: 13px;
    color: var(--el-text-color-regular);
    min-width: 56px;
    text-align: right;
  }

  .info-panel__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .info-panel__desc {
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  .summary-tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .subject-type-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .subject-type-card {
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    background: #fff;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .subject-type-card:hover {
    border-color: #fdba74;
    box-shadow: 0 10px 24px rgb(249 115 22 / 0.08);
  }

  .subject-type-card.is-active {
    border-color: var(--el-color-primary);
    background: #fff7ed;
    box-shadow: 0 10px 24px rgb(249 115 22 / 0.12);
  }

  .subject-type-card__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .subject-type-card__desc {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }

  .subject-selection-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-extra-light);
  }

  .subject-selection-summary__left {
    min-width: 0;
  }

  .subject-selection-summary__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .subject-selection-summary__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }

  .subject-selection-summary__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .contract-remark-field {
    margin-top: 4px;
  }

  .sub-panel {
    margin-top: 12px;
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-fill-color-extra-light);
  }

  .sub-panel__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  .rule-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .mode-guide {
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
  }

  .mode-guide__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .mode-guide__title {
    font-size: 15px;
    font-weight: 600;
    color: #1d4ed8;
  }
  .mode-guide__desc {
    margin-top: 4px;
    line-height: 1.7;
    color: #1e3a8a;
  }

  /* ─── config-card-grid：三列 ─────────────────────────────────────── */
  .config-card-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 12px;
    align-items: start;
  }

  .config-card {
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    background: #fff;
    overflow: hidden;
  }

  .config-card--full {
    margin-top: 12px;
  }

  .config-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    background: var(--el-fill-color-extra-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .config-card__header-left {
    flex: 1;
    min-width: 0;
  }
  .config-card__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .config-card__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  .config-card__content {
    flex: 1;
    padding: 14px 16px;
  }

  .config-card__empty {
    display: flex;
    align-items: center;
    color: var(--el-text-color-secondary);
    line-height: 1.7;
  }

  /* ─── 管理费：输入框 + 提示同行 ─────────────────────────────────── */
  .fee-inline-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .fee-inline-item {
    margin-bottom: 0;
  }
  .fee-inline-item :deep(.el-form-item__label) {
    font-size: 13px;
  }

  .fee-inline-hint {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }

  .fee-inline-hint strong {
    color: var(--el-color-primary);
    font-weight: 600;
  }

  /* ─── 免租规则 ────────────────────────────────────────────────────── */
  .config-card--rent-free .config-card__content {
    padding: 14px 16px;
  }

  .rent-free-options-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .rent-free-date-section {
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .rent-free-date-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 10px;
  }

  .rent-free-date-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .rent-free-shortcuts {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .rent-free-shortcuts__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }

  /* ─── 结算时间与手续费：两字段同行 ──────────────────────────────── */
  .settlement-timing-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .settlement-timing-item {
    flex: 1;
    min-width: 180px;
    margin-bottom: 0;
  }

  .settlement-timing-item :deep(.el-form-item__label) {
    font-size: 13px;
  }

  /* ─── 结算方式 ────────────────────────────────────────────────────── */
  .settlement-mode-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .settlement-mode-card {
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    background: #fff;
    text-align: left;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .settlement-mode-card:hover {
    border-color: #93c5fd;
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.08);
  }
  .settlement-mode-card.is-active {
    border-color: var(--el-color-primary);
    background: #eff6ff;
    box-shadow: 0 10px 24px rgba(59, 130, 246, 0.12);
  }
  .settlement-mode-card__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .settlement-mode-card__desc {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }
  .settlement-mode-card__features {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* ─── 分账费用科目：现代表格样式 ────────────────────────────────── */
  .fee-table-modern {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
  }

  .fee-table-modern__head {
    display: grid;
    grid-template-columns: 80px 1fr 200px 1fr 64px;
    gap: 0;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 0 12px;
  }

  .fee-table-modern__row {
    display: grid;
    grid-template-columns: 80px 1fr 140px 1fr 64px;
    gap: 0;
    align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid var(--el-border-color-extra-light);
    transition: background 0.15s;
  }

  .fee-table-modern__row:last-child {
    border-bottom: none;
  }
  .fee-table-modern__row:hover {
    background: var(--el-fill-color-extra-light);
  }

  .fee-col {
    padding: 8px 8px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    font-weight: 500;
    display: flex;
    align-items: center;
  }

  /* 表头列 */
  .fee-table-modern__head .fee-col {
    padding: 10px 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-weight: 600;
  }

  .fee-col--direction {
    justify-content: center;
  }
  .fee-col--type {
    min-width: 0;
  }
  .fee-col--ratio {
    min-width: 0;
  }
  .fee-col--remark {
    min-width: 0;
  }
  .fee-col--action {
    justify-content: center;
  }

  .direction-radio-group {
    --income-bg: #f97316;
    --income-border: #ea580c;
    --income-color: #fff7ed;
    --expense-bg: #ef4444;
    --expense-border: #dc2626;
    --expense-color: #fff5f5;
    --neutral-bg: #f3f4f6;
    --neutral-border: #d1d5db;
    --neutral-color: #9ca3af;
    display: inline-flex;
    white-space: nowrap;
  }
  .direction-radio-group :deep(.el-radio-button) {
    flex: 0 0 auto;
  }
  .direction-radio-group :deep(.el-radio-button__inner) {
    min-width: 34px;
    padding: 7px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    box-shadow: none;
    transition: all 0.18s ease;
  }
  .direction-radio-group :deep(.el-radio-button:first-child .el-radio-button__inner) {
    border-radius: 12px 0 0 12px;
  }
  .direction-radio-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
    border-radius: 0 12px 12px 0;
  }
  .direction-radio-group :deep(.el-radio-button__original-radio[value="IN"] + .el-radio-button__inner) {
    color: var(--neutral-color);
    background: var(--neutral-bg);
    border-color: var(--neutral-border);
  }
  .direction-radio-group :deep(.el-radio-button__original-radio[value="IN"]:checked + .el-radio-button__inner) {
    color: var(--income-color);
    background: var(--income-bg);
    border-color: var(--income-border);
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.08);
  }
  .direction-radio-group :deep(.el-radio-button__original-radio[value="OUT"] + .el-radio-button__inner) {
    color: var(--neutral-color);
    background: var(--neutral-bg);
    border-color: var(--neutral-border);
  }
  .direction-radio-group :deep(.el-radio-button__original-radio[value="OUT"]:checked + .el-radio-button__inner) {
    color: var(--expense-color);
    background: var(--expense-bg);
    border-color: var(--expense-border);
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.08);
  }

  .rule-hint {
    border-radius: 10px;
    background: #f8fafc;
    color: var(--el-text-color-regular);
    line-height: 1.7;
  }

  /* ─── choice group ──────────────────────────────────────────────── */
  .choice-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .choice-group--compact {
    gap: 6px;
  }
  .choice-group__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    padding-bottom: 5px;
  }
  .choice-group__label--compact {
    margin-bottom: 4px;
  }
  .choice-group__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }

  /* ─── house picker ──────────────────────────────────────────────── */
  .selected-house-wrapper {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }
  .selected-house-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }
  .selected-house-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }

  .selected-house-wrapper :deep(.el-empty) {
    width: 100%;
    min-height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .selected-house-chip {
    min-width: 180px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-light);
    background: #fff;
  }

  .selected-house-chip__body {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .selected-house-chip__type {
    flex-shrink: 0;
  }

  .selected-house-chip__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ─── fee table (包租其他费用) ──────────────────────────────────── */
  .fee-table-wrapper {
    overflow-x: auto;
  }

  .fee-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .fee-table--master-lease {
    table-layout: fixed;
  }

  .fee-table thead tr {
    background: var(--el-fill-color-light);
  }
  .fee-table th {
    padding: 10px 12px;
    font-weight: 600;
    text-align: left;
    border-bottom: 1px solid var(--el-border-color-lighter);
    color: var(--el-text-color-secondary);
  }
  .fee-table td {
    padding: 10px 8px;
    border-bottom: 1px solid var(--el-border-color-extra-light);
    vertical-align: middle;
  }
  .lease-free-table :deep(.el-input-number),
  .lease-free-table :deep(.el-date-editor),
  .lease-free-table :deep(.el-select) {
    width: 100%;
  }
  .fee-table--master-lease :deep(.el-input),
  .fee-table--master-lease :deep(.el-select),
  .fee-table--master-lease :deep(.el-cascader),
  .fee-table--master-lease :deep(.el-date-editor) {
    width: 100%;
  }
  .fee-table--master-lease td:last-child,
  .fee-table--master-lease th:last-child {
    text-align: center;
  }
  .fee-table tbody tr:last-child td {
    border-bottom: none;
  }
  .fee-table tbody tr:hover td {
    background: var(--el-fill-color-extra-light);
  }

  .empty-row td {
    border-bottom: none;
  }
  .empty-state {
    padding: 20px 0;
    text-align: center;
    color: var(--el-text-color-secondary);
  }
</style>
