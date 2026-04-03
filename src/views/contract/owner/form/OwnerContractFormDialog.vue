<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" label-width="100px" class="owner-contract-form">
    <el-card shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-title">业主信息</div>
            <div class="card-desc">录入业主主体信息、证件材料和收款人信息。</div>
          </div>
          <el-space>
            <el-tag effect="plain">{{ ownerTypeLabelMap[form.ownerType] }}</el-tag>
            <el-tag :type="form.ownerContract.cooperationMode === 'MASTER_LEASE' ? 'warning' : 'success'" effect="plain">
              {{ cooperationModeLabelMap[form.ownerContract.cooperationMode] }}
            </el-tag>
          </el-space>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="业主类型" prop="ownerType">
            <el-segmented v-model="form.ownerType" :options="ownerTypeOptions" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="委托模式" prop="ownerContract.cooperationMode">
            <el-segmented v-model="form.ownerContract.cooperationMode" :options="cooperationModeOptions" />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="owner-info-grid">
        <div class="info-panel">
          <div class="info-panel__header">
            <div>
              <div class="info-panel__title">业主主体信息</div>
              <div class="info-panel__desc">优先录入主体身份信息和证件材料。</div>
            </div>
          </div>

          <template v-if="form.ownerType === 'PERSONAL'">
            <el-row :gutter="16">
              <el-col :span="10">
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
              <el-col :span="6">
                <el-form-item label="性别">
                  <el-segmented v-model="form.ownerPersonal.gender" :options="genderOptions" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="联系电话" prop="ownerPersonal.phone">
                  <el-input v-model="form.ownerPersonal.phone" placeholder="请输入联系电话" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="证件类型">
                  <el-select v-model="form.ownerPersonal.idType" class="w-full">
                    <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="10">
                <el-form-item label="证件号码" prop="ownerPersonal.idNo">
                  <el-input v-model="form.ownerPersonal.idNo" placeholder="请输入证件号码" />
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

            <div class="upload-section">
              <div class="upload-section__title">证件信息</div>
              <el-space wrap alignment="start">
                <UploadImage v-model="form.ownerPersonal.idCardFrontList" :limit="1" :width="124" :height="76">
                  <template #tip>
                    <div class="upload-tip">身份证国徽面</div>
                  </template>
                </UploadImage>
                <UploadImage v-model="form.ownerPersonal.idCardBackList" :limit="1" :width="124" :height="76">
                  <template #tip>
                    <div class="upload-tip">身份证人像面</div>
                  </template>
                </UploadImage>
                <UploadImage v-model="form.ownerPersonal.idCardInHandList" :limit="1" :width="124" :height="76">
                  <template #tip>
                    <div class="upload-tip">手持身份证照</div>
                  </template>
                </UploadImage>
                <UploadImage v-model="form.ownerPersonal.otherImageList" :limit="4" :width="124" :height="76">
                  <template #tip>
                    <div class="upload-tip">其他材料，最多 4 张</div>
                  </template>
                </UploadImage>
              </el-space>
            </div>
          </template>

          <template v-else>
            <el-row :gutter="16">
              <el-col :span="12">
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
              <el-col :span="12">
                <el-form-item label="统一社会信用代码" prop="ownerCompany.uscc">
                  <el-input v-model="form.ownerCompany.uscc" placeholder="请输入统一社会信用代码" />
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
                <el-form-item label="联系电话" prop="ownerCompany.contactPhone">
                  <el-input v-model="form.ownerCompany.contactPhone" placeholder="请输入联系电话" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="联系人">
                  <el-input v-model="form.ownerCompany.contactName" placeholder="请输入联系人" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="法人证件类型">
                  <el-select v-model="form.ownerCompany.legalPersonIdType" class="w-full">
                    <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="法人证件号码">
                  <el-input v-model="form.ownerCompany.legalPersonIdNo" placeholder="请输入法人证件号码" />
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
            <el-form-item label="注册地址">
              <el-input v-model="form.ownerCompany.registeredAddress" placeholder="请输入注册地址" />
            </el-form-item>

            <div class="upload-section">
              <div class="upload-section__title">企业资质</div>
              <el-space wrap alignment="start">
                <UploadImage v-model="form.ownerCompany.businessLicenseUrls" :limit="1" :width="124" :height="76">
                  <template #tip>
                    <div class="upload-tip">营业执照</div>
                  </template>
                </UploadImage>
              </el-space>
            </div>
          </template>
        </div>

        <div class="info-panel info-panel--payee">
          <div class="info-panel__header">
            <div>
              <div class="info-panel__title">收款人信息</div>
              <div class="info-panel__desc">用于后续提现和打款，可与业主主体不一致。</div>
            </div>
            <el-space wrap>
              <el-button plain @click="fillPayeeFromOwner">收款人同业主</el-button>
              <el-button v-if="form.ownerType === 'COMPANY'" plain @click="fillPayeeFromContact">收款人同联系人</el-button>
            </el-space>
          </div>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="收款人姓名">
                <el-input v-model="currentPayeeForm.payeeName" placeholder="请输入收款人姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收款人电话">
                <el-input v-model="currentPayeeForm.payeePhone" placeholder="请输入收款人电话" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="收款人证件类型">
                <el-select v-model="currentPayeeForm.payeeIdType" class="w-full">
                  <el-option v-for="item in idTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收款人证件号码">
                <el-input v-model="currentPayeeForm.payeeIdNo" placeholder="请输入收款人证件号码" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="银行卡开户名">
                <el-input v-model="currentPayeeForm.bankAccountName" placeholder="请输入开户名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="银行卡号">
                <el-input v-model="currentPayeeForm.bankAccountNo" placeholder="请输入银行卡号" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="开户行">
            <el-input v-model="currentPayeeForm.bankName" placeholder="请输入开户行名称" />
          </el-form-item>
        </div>
      </div>
    </el-card>
    <el-card shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-title">签约房源</div>
            <div class="card-desc">先选择签约房源，再按当前委托模式配置对应条款。</div>
          </div>
          <el-button
            type="primary"
            link
            @click="
              housePickerRef?.show({
                selected: selectedHouses,
                excludeOwnerContractId: form.ownerContract.id
              })
            "
          >
            选择房源
          </el-button>
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

          <div v-if="form.contractHouseList.length" class="selected-house-panel">
            <div class="selected-house-tags">
              <div v-for="item in form.contractHouseList" :key="item.houseId" class="selected-house-chip">
                <div class="selected-house-chip__title">{{ item.houseName || "未命名房源" }}</div>
                <el-button link type="danger" @click="removeHouse(item.houseId)">移除</el-button>
              </div>
            </div>

            <div class="house-highlight">
              <template v-if="form.ownerContract.cooperationMode === 'LIGHT_MANAGED'">
                <div>当前所有已选房源统一使用同一套轻托管分账规则。</div>
                <div>后续如需修改，只需改一次，保存时会同步到全部房源。</div>
              </template>
              <template v-else>
                <div>当前所有已选房源统一纳入同一包租合同。</div>
                <div>金额、押付方式和其他费用统一在下方包租条款中配置。</div>
              </template>
            </div>
          </div>
          <el-empty v-else description="请选择一个或多个房源" :image-size="90" />
        </div>
      </el-form-item>
    </el-card>

    <el-card v-if="form.ownerContract.cooperationMode === 'LIGHT_MANAGED'" shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-title">轻托管条款配置</div>
            <div class="card-desc">所有已选房源统一使用同一套分账规则、管理费、免租与费用科目配置。</div>
          </div>
          <span class="card-tip">统一配置后自动应用到全部房源</span>
        </div>
      </template>

      <div v-if="sharedContractHouse" class="rule-editor">
        <div class="mode-guide">
          <div class="mode-guide__header">
            <div>
              <div class="mode-guide__title">先选结算方式，再补充对应条款</div>
              <div class="mode-guide__desc">
                轻托管里最关键的是先明确你和业主怎么结算。不同结算方式只展示自己需要填写的字段。
              </div>
            </div>
            <el-tag effect="plain" type="primary">{{ settlementModeLabelMap[sharedContractHouse.settlementRule.settlementMode || "FIXED"] }}</el-tag>
          </div>
        </div>

        <div class="sub-panel">
          <div class="sub-panel__title">结算方式</div>
          <div class="sub-panel__desc">选择后，页面只展示该方式下真正需要填写的字段。</div>

          <el-form-item label="结算方式">
            <div class="settlement-mode-grid">
              <button
                v-for="option in settlementModeOptions"
                :key="option.value"
                type="button"
                :class="['settlement-mode-card', { 'is-active': sharedContractHouse.settlementRule.settlementMode === option.value }]"
                @click="sharedContractHouse.settlementRule.settlementMode = option.value"
              >
                <div class="settlement-mode-card__title">{{ option.label }}</div>
                <div class="settlement-mode-card__desc">{{ option.desc }}</div>
                <div class="settlement-mode-card__features">
                  <el-tag
                    v-for="feature in option.features"
                    :key="feature"
                    size="small"
                    effect="plain"
                  >
                    {{ feature }}
                  </el-tag>
                </div>
              </button>
            </div>
          </el-form-item>

          <el-row v-if="sharedContractHouse.settlementRule.settlementMode === 'FIXED'" :gutter="20">
            <el-col :span="8">
              <el-form-item label="固定给业主金额">
                <el-input-number v-model="sharedContractHouse.settlementRule.guaranteedRentAmount" :min="0" :precision="2" class="w-full" />
              </el-form-item>
            </el-col>
          </el-row>

          <template v-else-if="sharedContractHouse.settlementRule.settlementMode === 'GUARANTEE_PLUS_SHARE'">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="保底金额">
                  <el-input-number v-model="sharedContractHouse.settlementRule.guaranteedRentAmount" :min="0" :precision="2" class="w-full" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="业主分成比例">
                  <el-input v-model.number="sharedContractHouse.settlementRule.commissionValue" type="number" class="w-full" placeholder="请输入">
                    <template #append>%</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分账基数">
                  <el-radio-group v-model="sharedContractHouse.settlementRule.incomeBasis">
                    <el-radio-button v-for="option in incomeBasisOptions" :key="option.value" :label="option.label" :value="option.value" />
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <template v-else>
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item :label="sharedContractHouse.settlementRule.settlementMode === 'AGENCY' ? '业主结转比例' : '业主分成比例'">
                  <el-input v-model.number="sharedContractHouse.settlementRule.commissionValue" type="number" class="w-full" placeholder="请输入">
                    <template #append>%</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col v-if="sharedContractHouse.settlementRule.settlementMode !== 'SHARE_GROSS'" :span="12">
                <el-form-item label="分账基数">
                  <el-radio-group v-model="sharedContractHouse.settlementRule.incomeBasis">
                    <el-radio-button v-for="option in incomeBasisOptions" :key="option.value" :label="option.label" :value="option.value" />
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="rule-hint">
              {{ sharedContractHouse.settlementRule.settlementMode === "AGENCY" ? "业主结转比例：平台代收代付后，剩余金额按约定比例结给业主。管理费比例：平台额外向业主收取多少服务管理费用。" : "业主分成比例：业主从可分账收入中拿多少。管理费比例：平台额外向业主收取多少服务管理费用。" }}
            </div>
          </template>
        </div>

        <div class="switch-grid">
          <div class="switch-card">
            <div class="switch-card__head">
              <span>管理费</span>
              <el-switch v-model="sharedContractHouse.settlementRule.managementFeeEnabled" />
            </div>
            <div class="switch-card__body">
              <div class="card-tip">按租金比例向业主收取管理费。</div>
              <el-row v-if="sharedContractHouse.settlementRule.managementFeeEnabled" :gutter="12">
                <el-col :span="24">
                  <el-input v-model.number="sharedContractHouse.settlementRule.managementFeeValue" type="number" class="w-full" placeholder="请输入">
                    <template #append>%</template>
                  </el-input>
                </el-col>
              </el-row>
            </div>
          </div>

          <div class="switch-card">
            <div class="switch-card__head">
              <span>免租规则</span>
              <el-switch v-model="sharedContractHouse.rentFreeRule.enabled" />
            </div>
            <div v-if="sharedContractHouse.rentFreeRule.enabled" class="switch-card__body">
              <div class="choice-group">
                <div class="choice-group__label">免租是否算在正式合同期内</div>
                <el-radio-group v-model="sharedContractHouse.rentFreeRule.freeType">
                  <el-radio-button v-for="option in freeTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
                </el-radio-group>
                <div class="choice-group__desc">
                  {{ sharedContractHouse.rentFreeRule.freeType === "BUILT_IN" ? "免租天数算在正式合同期内，合同总时长不变。" : "免租天数不算在正式合同期内，更像额外赠送的免租时间。" }}
                </div>
              </div>

              <div class="choice-group">
                <div class="choice-group__label">免租损失由谁承担</div>
                <el-radio-group v-model="sharedContractHouse.rentFreeRule.bearType">
                  <el-radio-button v-for="option in bearTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
                </el-radio-group>
                <div class="choice-group__desc">
                  {{ bearTypeDescriptionMap[sharedContractHouse.rentFreeRule.bearType || "PLATFORM"] }}
                </div>
              </div>

              <div class="choice-group">
                <div class="choice-group__label">免租金额怎么计算</div>
                <el-radio-group v-model="sharedContractHouse.rentFreeRule.calcMode">
                  <el-radio-button v-for="option in lightManagedCalcModeOptions" :key="option.value" :label="option.label" :value="option.value" />
                </el-radio-group>
                <div class="choice-group__desc">
                  {{ freeCalcModeDescriptionMap[sharedContractHouse.rentFreeRule.calcMode || "BY_DAYS"] }}
                </div>
              </div>

              <el-row :gutter="12">
                <el-col :span="12">
                  <div class="choice-group__label choice-group__label--compact">免租开始日期</div>
                  <el-date-picker v-model="sharedContractHouse.rentFreeRule.startDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
                </el-col>
                <el-col :span="12">
                  <div class="choice-group__label choice-group__label--compact">免租结束日期</div>
                  <el-date-picker v-model="sharedContractHouse.rentFreeRule.endDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
                </el-col>
              </el-row>
            </div>
          </div>
        </div>

        <div class="sub-panel">
          <div class="sub-panel__title">结算时间与手续费</div>
          <div class="sub-panel__desc">这两项一般由公司统一约定，尽量直接选业务口径。</div>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="给业主出账时间">
                <el-radio-group v-model="sharedContractHouse.settlementRule.settlementTiming">
                  <el-radio-button v-for="option in settlementTimingOptions" :key="option.value" :label="option.label" :value="option.value" />
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="支付手续费承担方式">
                <el-radio-group v-model="sharedContractHouse.settlementRule.paymentFeeBearType">
                  <el-radio-button v-for="option in paymentFeeBearTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="sub-panel">
          <div class="sub-panel__header">
            <div>
              <div class="sub-panel__title">分账费用科目</div>
              <div class="sub-panel__desc">参考退租费用的录入方式，先选择收支和费用项，再填写转给业主的比例。</div>
            </div>
            <el-button type="primary" plain @click="addSettlementItem(sharedContractHouse)">添加费用科目</el-button>
          </div>

          <div class="fee-table-wrapper">
            <table class="fee-table">
              <thead>
                <tr>
                  <th style="width: 70px">收支</th>
                  <th style="width: 220px">费用类型</th>
                  <th style="width: 180px">转给比例</th>
                  <th>备注</th>
                  <th style="width: 56px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!sharedContractHouse.settlementRule.settlementItemList?.length" class="empty-row">
                  <td colspan="5">
                    <div class="empty-state">暂无分账费用科目，点击右上角“添加费用科目”新增。</div>
                  </td>
                </tr>
                <tr v-for="(item, index) in sharedContractHouse.settlementRule.settlementItemList" :key="index">
                  <td>
                    <div class="direction-chip" :class="item.feeDirection === 'IN' ? 'chip-income' : 'chip-expense'" @click="toggleSettlementItemDirection(item)">
                      {{ item.feeDirection === "IN" ? "收入" : "支出" }}
                    </div>
                  </td>
                  <td>
                    <el-cascader
                      v-model="settlementFeeCascaderValues[`shared-${index}`]"
                      :options="otherFeeTypeOptions"
                      :props="{ emitPath: true, checkStrictly: false }"
                      clearable
                      filterable
                      class="w-full"
                      @change="value => handleSettlementFeeTypeChange(value, sharedContractHouse, index)"
                    />
                  </td>
                  <td>
                    <el-input v-model.number="item.transferRatio" type="number" class="w-full" placeholder="请输入">
                      <template #append>%</template>
                    </el-input>
                  </td>
                  <td>
                    <el-input v-model="item.remark" placeholder="备注" />
                  </td>
                  <td class="text-center">
                    <el-button link type="danger" @click="sharedContractHouse.settlementRule.settlementItemList?.splice(index, 1)">删除</el-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <el-empty v-else description="请先选择房源后再配置条款" :image-size="100" />
    </el-card>

    <el-card v-else shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-title">包租条款</div>
            <div class="card-desc">包租按合同统一配置总月租金、押付方式、交房日期和其他费用科目。</div>
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
          <table class="fee-table">
            <thead>
              <tr>
                <th style="width: 70px">收支</th>
                <th style="width: 180px">费用类型</th>
                <th style="width: 150px">付款方式</th>
                <th style="width: 260px">金额</th>
                <th>备注</th>
                <th style="width: 56px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!form.ownerLeaseRule.otherFeeList?.length" class="empty-row">
                <td colspan="6">
                  <div class="empty-state">暂无其他费用，点击右上角“添加费用”新增。</div>
                </td>
              </tr>
              <tr v-for="(fee, index) in form.ownerLeaseRule.otherFeeList" :key="index">
                <td>
                  <div class="direction-chip" :class="fee.feeDirection === 'IN' ? 'chip-income' : 'chip-expense'" @click="toggleLeaseFeeDirection(fee)">
                    {{ fee.feeDirection === "IN" ? "收入" : "支出" }}
                  </div>
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
                <td>
                  <el-input v-model="fee.remark" placeholder="备注" />
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
        <el-table :data="form.ownerLeaseFreeRuleList" border empty-text="未配置免租规则">
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
      </div>
    </el-card>

    <HousePicker ref="housePickerRef" @confirm="handleHouseConfirm" />

    <el-dialog v-model="previewVisible" top="10px" title="业主合同预览" width="80%" destroy-on-close append-to-body>
      <iframe v-if="pdfUrl" title="业主合同预览" :src="pdfUrl" style="width: 100%; height: 89vh; border: none" />
    </el-dialog>
  </el-form>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from "vue";
  import type { FormInstance, FormRules } from "element-plus";
  import { getContractTemplateParams, getMyAvailableContractTemplates } from "@/api/contract/template";
  import { getOwnerContractDetail, getOwnerContractList, previewOwnerContract } from "@/api/contract/owner";
  import UploadImage from "@/components/upload/UploadImage.vue";
  import HousePicker from "@/shared/house/HousePicker.vue";
  import { getDictDataByParentCode } from "@/api/sys/dict";
  import { PAYMENT_METHOD_OPTIONS, PRICE_METHOD_OPTIONS } from "@/constants";
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
    OwnerListVo,
    OwnerUpdateDto
  } from "@/types/generated";
  import {
    OwnerBearTypeEnumMeta,
    OwnerCooperationModeEnumMeta,
    OwnerFreeCalcModeEnumMeta,
    OwnerFreeTypeEnumMeta,
    OwnerIncomeBasisEnumMeta,
    OwnerProrateTypeEnumMeta,
    OwnerSignStatusEnumMeta,
    OwnerTypeEnumMeta
  } from "@/types/generated/enum.meta";

  defineOptions({ name: "OwnerContractFormDialog" });

  interface Props {
    formInline?: OwnerDetailVo | null;
    isEdit?: boolean;
  }

  type IdTypeValue = "ID_CARD" | "PASSPORT" | "HONGKONG_MACAO" | "TAIWAN";
  type GenderValue = "UNKNOWN" | "MALE" | "FEMALE";
  type StatusValue = "ACTIVE" | "DISABLED";
  type ApprovalStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  type OwnerSignTypeValue = "NEW" | "RENEW";
  type OwnerContractMediumValue = "ELECTRONIC" | "PAPER";
  type OwnerPaymentFeeBearTypeValue = "PLATFORM_ALL" | "OWNER_ALL" | "BY_INCOME_SHARE";
  type OwnerSettlementTimingValue = "TENANT_PAYMENT_REALTIME" | "LEASE_START_GENERATE_BILL";

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

  type OwnerSuggestionItem = {
    value: string;
    contractId?: string;
    ownerId?: string;
    ownerPhone?: string;
  };

  type OwnerSettlementItemForm = {
    id?: string | number;
    feeDirection?: "IN" | "OUT";
    feeType?: string;
    itemName?: string;
    transferEnabled?: boolean;
    transferRatio?: number;
    sortOrder?: number;
    feeTypeCascade?: any[];
    remark?: string;
  };

  type OwnerPersonalForm = OwnerPersonalDto & {
    payeeName?: string;
    payeePhone?: string;
    payeeIdType?: IdTypeValue;
    payeeIdNo?: string;
    bankAccountName?: string;
    bankAccountNo?: string;
    bankName?: string;
    idCardFrontList?: string[];
    idCardBackList?: string[];
    idCardInHandList?: string[];
    otherImageList?: string[];
  };

  type OwnerCompanyForm = OwnerCompanyDto & {
    payeeName?: string;
    payeePhone?: string;
    payeeIdType?: IdTypeValue;
    payeeIdNo?: string;
    bankAccountName?: string;
    bankAccountNo?: string;
    bankName?: string;
    businessLicenseUrls?: string[];
  };

  type OwnerContractFormDto = OwnerContractDto & {
    signType?: OwnerSignTypeValue;
    contractMedium?: OwnerContractMediumValue;
    notifyOwner?: boolean;
    status?: StatusValue;
    approvalStatus?: ApprovalStatusValue;
  };

  type OwnerSettlementRuleForm = OwnerSettlementRuleDto & {
    hasGuaranteedRent?: boolean;
    managementFeeEnabled?: boolean;
    managementFeeMode?: OwnerFeeModeEnum;
    managementFeeValue?: number;
    paymentFeeBearType?: OwnerPaymentFeeBearTypeValue;
    settlementTiming?: OwnerSettlementTimingValue;
    rentFreeEnabled?: boolean;
    settlementItemList?: OwnerSettlementItemForm[];
    status?: StatusValue;
  };

  type OwnerRentFreeRuleForm = OwnerRentFreeRuleDto & {
    enabled?: boolean;
    status?: StatusValue;
  };

  type OwnerLeaseRuleForm = OwnerLeaseRuleDto & {
    handoverDate?: string;
    usageType?: string;
    otherFeeList?: OwnerLeaseFeeForm[];
    status?: StatusValue;
  };

  type OwnerLeaseFeeForm = {
    feeType?: string;
    feeName?: string;
    feeDirection?: "IN" | "OUT";
    paymentMethod?: number;
    priceMethod?: number;
    priceInput?: number;
    sortOrder?: number;
    remark?: string;
  };

  type ContractHouseFormItem = OwnerContractHouseDto & {
    houseId: string;
    houseName: string;
    settlementRule: OwnerSettlementRuleForm;
    rentFreeRule: OwnerRentFreeRuleForm;
  };

  type OwnerContractForm = {
    ownerType: OwnerTypeEnum;
    ownerPersonal: OwnerPersonalForm;
    ownerCompany: OwnerCompanyForm;
    ownerContract: OwnerContractFormDto;
    contractHouseList: ContractHouseFormItem[];
    ownerLeaseRule: OwnerLeaseRuleForm;
    ownerLeaseFreeRuleList: OwnerLeaseFreeRuleDto[];
  };

  const props = withDefaults(defineProps<Props>(), {
    formInline: null,
    isEdit: false
  });

  const formRef = ref<FormInstance>();
  const housePickerRef = ref<InstanceType<typeof HousePicker>>();
  const contractTemplates = ref<ContractTemplateListVo[]>([]);
  const templateParams = ref<ContractTemplateParamItem[]>([]);
  const templateParamsLoading = ref(false);
  const otherFeeTypeOptions = ref<any[]>([]);
  const leaseFeeCascaderValues = ref<Record<number, any[]>>({});
  const settlementFeeCascaderValues = ref<Record<string, any[]>>({});
  const contractDateRange = ref<string[]>([]);
  const selectedHouses = ref<PickedRoom[]>([]);
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
  const incomeBasisLabelMap: Record<OwnerIncomeBasisEnum, string> = {
    RECEIVED: "按租客实际支付金额",
    RECEIVABLE: "按账单应收金额"
  };
  const bearTypeLabelMap: Record<OwnerBearTypeEnum, string> = {
    PLATFORM: "公司承担",
    OWNER: "业主承担",
    SHARED: "双方共同承担"
  };
  const freeTypeLabelMap: Record<OwnerFreeTypeEnum, string> = {
    BUILT_IN: "算在合同期内",
    OUTSIDE: "不算在合同期内"
  };
  const freeCalcModeLabelMap: Record<OwnerFreeCalcModeEnum, string> = {
    BY_DAYS: "按天分摊",
    FIXED: "固定金额",
    RATIO: "按比例"
  };
  const bearTypeDescriptionMap: Record<OwnerBearTypeEnum, string> = {
    PLATFORM: "免租造成的损失由公司承担，不冲减业主收益。",
    OWNER: "免租造成的损失由业主承担，会影响业主应收。",
    SHARED: "公司和业主共同承担免租损失，后续按约定比例分摊。"
  };
  const freeCalcModeDescriptionMap: Record<OwnerFreeCalcModeEnum, string> = {
    BY_DAYS: "按免租天数折算，适合按天核算的场景。",
    FIXED: "直接按固定金额减免，适合合同中明确写死金额。",
    RATIO: "按比例减免，适合按租金比例分摊。"
  };
  const prorateTypeLabelMap: Record<OwnerProrateTypeEnum, string> = {
    BY_DAYS: "按天折算",
    FULL_PERIOD: "整期计费"
  };
  const rentDueTypeLabelMap = {
    EARLY: "提前收租",
    FIXED: "固定日期付款",
    LATE: "延后付款"
  } as const;
  const signTypeLabelMap: Record<OwnerSignTypeValue, string> = {
    NEW: "新签",
    RENEW: "续签"
  };
  const contractMediumLabelMap: Record<OwnerContractMediumValue, string> = {
    ELECTRONIC: "电子合同",
    PAPER: "纸质合同"
  };
  const paymentFeeBearTypeLabelMap: Record<OwnerPaymentFeeBearTypeValue, string> = {
    PLATFORM_ALL: "公司承担 100%",
    OWNER_ALL: "业主承担 100%",
    BY_INCOME_SHARE: "各自承担自己所得"
  };
  const settlementTimingLabelMap: Record<OwnerSettlementTimingValue, string> = {
    TENANT_PAYMENT_REALTIME: "租客支付实时分账",
    LEASE_START_GENERATE_BILL: "起租日直接给业主生成账单"
  };
  const settlementModeLabelMap: Record<OwnerSettlementModeEnum, string> = {
    FIXED: "固定结算",
    SHARE_GROSS: "毛收分成",
    SHARE_NET: "净收分成",
    GUARANTEE_PLUS_SHARE: "保底 + 分成",
    AGENCY: "代收代付"
  };
  const settlementModeDescriptionMap: Record<OwnerSettlementModeEnum, string> = {
    FIXED: "适合平台按固定金额给业主，出租溢价和空置风险主要由平台承担。",
    SHARE_GROSS: "按租客收到的收入直接与业主分成，不先扣平台成本。",
    SHARE_NET: "先按约定扣掉成本或费用，再把净额与业主分成。",
    GUARANTEE_PLUS_SHARE: "先给业主一个保底金额，超过部分再按比例分成。",
    AGENCY: "平台代收租金、代扣约定费用后，再把剩余部分结给业主。"
  };

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
  const ownerTagOptions = [
    { label: "重点业主", value: "KEY" },
    { label: "高净值", value: "VIP" },
    { label: "企业客户", value: "COMPANY" }
  ];
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
  const settlementModeOptions = [
    {
      label: settlementModeLabelMap.FIXED,
      value: "FIXED" as OwnerSettlementModeEnum,
      desc: "平台按固定金额给业主，适合托管报价已经谈死的场景。",
      features: ["固定金额", "平台承担波动"]
    },
    {
      label: settlementModeLabelMap.SHARE_GROSS,
      value: "SHARE_GROSS" as OwnerSettlementModeEnum,
      desc: "按租客实际收到的租金直接分成，不先扣平台成本。",
      features: ["按实收分成", "逻辑最直接"]
    },
    {
      label: settlementModeLabelMap.SHARE_NET,
      value: "SHARE_NET" as OwnerSettlementModeEnum,
      desc: "先扣约定费用，再把净额按比例分给业主。",
      features: ["先扣费用", "再做分成"]
    },
    {
      label: settlementModeLabelMap.GUARANTEE_PLUS_SHARE,
      value: "GUARANTEE_PLUS_SHARE" as OwnerSettlementModeEnum,
      desc: "先给业主保底金额，超出部分再按比例分成。",
      features: ["保底金额", "超额再分"]
    },
    {
      label: settlementModeLabelMap.AGENCY,
      value: "AGENCY" as OwnerSettlementModeEnum,
      desc: "平台负责代收代付，最后按约定把剩余款项结给业主。",
      features: ["代收代付", "结余转业主"]
    }
  ];
  const incomeBasisOptions = Object.values(OwnerIncomeBasisEnumMeta).map(item => ({
    label: incomeBasisLabelMap[item.value as OwnerIncomeBasisEnum],
    value: item.value as OwnerIncomeBasisEnum
  }));
  const bearTypeOptions = Object.values(OwnerBearTypeEnumMeta).map(item => ({
    label: bearTypeLabelMap[item.value as OwnerBearTypeEnum],
    value: item.value as OwnerBearTypeEnum
  }));
  const freeTypeOptions = Object.values(OwnerFreeTypeEnumMeta).map(item => ({
    label: freeTypeLabelMap[item.value as OwnerFreeTypeEnum],
    value: item.value as OwnerFreeTypeEnum
  }));
  const lightManagedCalcModeOptions = Object.values(OwnerFreeCalcModeEnumMeta).map(item => ({
    label: freeCalcModeLabelMap[item.value as OwnerFreeCalcModeEnum],
    value: item.value as OwnerFreeCalcModeEnum
  }));
  const leaseFreeCalcModeOptions = Object.values(OwnerFreeCalcModeEnumMeta)
    .filter(item => item.value !== "BY_DAYS")
    .map(item => ({
      label: freeCalcModeLabelMap[item.value as OwnerFreeCalcModeEnum],
      value: item.value as OwnerFreeCalcModeEnum
    }));
  const prorateTypeOptions = Object.values(OwnerProrateTypeEnumMeta).map(item => ({
    label: prorateTypeLabelMap[item.value as OwnerProrateTypeEnum],
    value: item.value as OwnerProrateTypeEnum
  }));
  const signTypeOptions = [
    { label: signTypeLabelMap.NEW, value: "NEW" as OwnerSignTypeValue },
    { label: signTypeLabelMap.RENEW, value: "RENEW" as OwnerSignTypeValue }
  ];
  const contractMediumOptions = [
    { label: contractMediumLabelMap.ELECTRONIC, value: "ELECTRONIC" as OwnerContractMediumValue },
    { label: contractMediumLabelMap.PAPER, value: "PAPER" as OwnerContractMediumValue }
  ];
  const paymentFeeBearTypeOptions = [
    { label: paymentFeeBearTypeLabelMap.PLATFORM_ALL, value: "PLATFORM_ALL" as OwnerPaymentFeeBearTypeValue },
    { label: paymentFeeBearTypeLabelMap.OWNER_ALL, value: "OWNER_ALL" as OwnerPaymentFeeBearTypeValue },
    { label: paymentFeeBearTypeLabelMap.BY_INCOME_SHARE, value: "BY_INCOME_SHARE" as OwnerPaymentFeeBearTypeValue }
  ];
  const settlementTimingOptions = [
    { label: settlementTimingLabelMap.TENANT_PAYMENT_REALTIME, value: "TENANT_PAYMENT_REALTIME" as OwnerSettlementTimingValue },
    { label: settlementTimingLabelMap.LEASE_START_GENERATE_BILL, value: "LEASE_START_GENERATE_BILL" as OwnerSettlementTimingValue }
  ];
  const rentDueTypeOptions = [
    { label: rentDueTypeLabelMap.EARLY, value: "EARLY" as const },
    { label: rentDueTypeLabelMap.FIXED, value: "FIXED" as const },
    { label: rentDueTypeLabelMap.LATE, value: "LATE" as const }
  ];
  const paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
  const priceMethodOptions = PRICE_METHOD_OPTIONS;

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
      settlementItemList: ((rule?.settlementItemList || []) as OwnerSettlementItemForm[]).map(item => ({
        ...createSettlementItem(),
        ...item
      }))
    };
  }

  function cloneRentFreeRule(rule?: OwnerRentFreeRuleForm): OwnerRentFreeRuleForm {
    return {
      ...createDefaultRentFreeRule(),
      ...(rule || {})
    };
  }

  const createHouseRule = (houseId: string, houseName: string, base?: ContractHouseFormItem): ContractHouseFormItem => ({
    houseId,
    houseName,
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
    contractHouseList: [],
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

  const sharedContractHouse = computed(() => form.contractHouseList[0]);
  const configuredHouseCount = computed(() => form.contractHouseList.filter(item => isHouseConfigured(item)).length);
  const selectedTemplate = computed(() => contractTemplates.value.find(item => String(item.id || "") === String(form.ownerContract.contractTemplateId || "")));
  const templateParamLabelMap = computed(() => templateParams.value.reduce<Record<string, string>>((acc, item) => ((acc[item.key] = item.label), acc), {}));
  const selectedTemplatePlaceholders = computed(() => extractTemplatePlaceholders(selectedTemplate.value?.templateContent));
  const selectedTemplatePreviewFields = computed(() => buildTemplatePreviewFields(selectedTemplatePlaceholders.value));
  const selectedTemplateResolvedCount = computed(() => selectedTemplatePreviewFields.value.filter(item => item.value !== "签约时自动生成").length);
  const selectedTemplateTextLength = computed(() => getTemplateTextLength(selectedTemplate.value?.templateContent));
  const currentPayeeForm = computed(() => (form.ownerType === "PERSONAL" ? form.ownerPersonal : form.ownerCompany));

  const rules: FormRules = {
    ownerType: [{ required: true, message: "请选择业主类型", trigger: "change" }],
    "ownerContract.cooperationMode": [{ required: true, message: "请选择委托模式", trigger: "change" }],
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
    const source = sharedContractHouse.value || item;
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
      children: (dict.dictDataList || []).map((item: any) => ({
        label: item.name,
        value: item.id
      }))
    }));
  }

  function resetForm() {
    Object.assign(form, createDefaultForm());
    contractDateRange.value = [];
    selectedHouses.value = [];
  }

  function mapDetailToForm(detail?: OwnerDetailVo | null) {
    resetForm();
    if (!detail) return;
    const raw = detail as any;
    form.ownerType = detail.ownerType || "PERSONAL";
    form.ownerPersonal = {
      ...createDefaultForm().ownerPersonal,
      ...(raw.ownerPersonal || {})
    };
    form.ownerCompany = {
      ...createDefaultForm().ownerCompany,
      ...(raw.ownerCompany || {})
    };
    form.ownerContract = {
      ...createDefaultForm().ownerContract,
      ...(raw.ownerContract || {})
    };
    contractDateRange.value = [raw.ownerContract?.contractStart || "", raw.ownerContract?.contractEnd || ""].filter(Boolean);
    form.contractHouseList = (raw.contractHouseList || []).map((item: any) => ({
      ...item,
      id: item.id,
      houseId: String(item.houseId || ""),
      houseName: item.houseName || "",
      remark: item.remark || "",
      settlementRule: cloneSettlementRule(item.settlementRule),
      rentFreeRule: cloneRentFreeRule(item.rentFreeRule)
    }));
    selectedHouses.value = form.contractHouseList.map(item => ({
      houseId: item.houseId,
      houseName: item.houseName
    }));
    form.ownerLeaseRule = {
      ...createDefaultForm().ownerLeaseRule,
      ...(raw.ownerLeaseRule || {})
    };
    form.ownerLeaseFreeRuleList = (raw.ownerLeaseFreeRuleList || []).map((item: any) => ({
      ...createDefaultLeaseFreeRule(),
      ...item
    }));
    syncLeaseFeeCascaderValues();
    syncSettlementFeeCascaderValues();
  }

  function handleHouseConfirm(rows: PickedRoom[]) {
    selectedHouses.value = rows || [];
    const houseMap = new Map<string, ContractHouseFormItem>();
    const sharedRule = form.contractHouseList[0];
    for (const row of rows || []) {
      const houseId = String(row.houseId || "");
      if (!houseId) continue;
      const existing = form.contractHouseList.find(item => item.houseId === houseId);
      houseMap.set(houseId, existing || createHouseRule(houseId, row.houseName || "", sharedRule));
    }
    form.contractHouseList = Array.from(houseMap.values());
    if (form.ownerContract.cooperationMode === "LIGHT_MANAGED" && form.contractHouseList.length > 1) {
      const shared = form.contractHouseList[0];
      form.contractHouseList = form.contractHouseList.map(item => ({
        ...item,
        settlementRule: cloneSettlementRule(shared.settlementRule),
        rentFreeRule: cloneRentFreeRule(shared.rentFreeRule)
      }));
    }
  }

  function removeHouse(houseId: string) {
    form.contractHouseList = form.contractHouseList.filter(item => item.houseId !== houseId);
    selectedHouses.value = selectedHouses.value.filter(item => String(item.houseId || "") !== houseId);
  }

  function addSettlementItem(house: ContractHouseFormItem) {
    if (!house.settlementRule.settlementItemList) {
      house.settlementRule.settlementItemList = [];
    }
    house.settlementRule.settlementItemList.push(createSettlementItem());
  }

  function toggleSettlementItemDirection(item: OwnerSettlementItemForm) {
    item.feeDirection = item.feeDirection === "IN" ? "OUT" : "IN";
  }

  function handleSettlementFeeTypeChange(value: any, house: ContractHouseFormItem, index: number) {
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
    void getOwnerContractList({
      currentPage: 1,
      pageSize: 10,
      ownerType: form.ownerType,
      ownerName: keyword
    } as any).then(resp => {
      const list = (resp.data?.list || []) as OwnerListVo[];
      const dedupMap = new Map<string, OwnerSuggestionItem>();
      list.forEach(item => {
        const key = String(item.ownerId || item.contractId || "");
        if (!key || dedupMap.has(key)) return;
        dedupMap.set(key, {
          value: item.ownerName || "",
          ownerId: item.ownerId,
          contractId: item.contractId,
          ownerPhone: item.ownerPhone || ""
        });
      });
      cb(Array.from(dedupMap.values()));
    }).catch(() => {
      cb([]);
    });
  }

  async function handleOwnerSuggestionSelect(item: OwnerSuggestionItem) {
    if (!item.contractId) return;
    const resp = await getOwnerContractDetail({ contractId: item.contractId });
    const detail = resp.data;
    if (!detail) return;
    if (form.ownerType === "PERSONAL" && detail.ownerPersonal) {
      form.ownerPersonal = {
        ...form.ownerPersonal,
        ...detail.ownerPersonal
      };
    }
    if (form.ownerType === "COMPANY" && detail.ownerCompany) {
      form.ownerCompany = {
        ...form.ownerCompany,
        ...detail.ownerCompany
      };
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
    if (!form.ownerLeaseRule.otherFeeList) {
      form.ownerLeaseRule.otherFeeList = [];
    }
    form.ownerLeaseRule.otherFeeList.push(createLeaseFee());
  }

  function toggleLeaseFeeDirection(fee: OwnerLeaseFeeForm) {
    fee.feeDirection = fee.feeDirection === "IN" ? "OUT" : "IN";
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
    (sharedContractHouse.value?.settlementRule.settlementItemList || []).forEach((item, index) => {
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
    return Array.from(new Set(content.match(/\$\{[^}]+\}/g) || []));
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
    const houseRows = selectedHouses.value;
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
      "${签约房源列表}": houseNames,
      "${房屋产权编号}": joinHouseField(houseRows, "certificateNo"),
      "${房屋总面积}": totalArea > 0 ? totalArea.toFixed(2) : "",
      "${签约面积数}": totalArea > 0 ? totalArea.toFixed(2) : "",
      "${租客姓名}": ownerName,
      "${业主姓名}": ownerName
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
        if (!next.incomeBasis) {
          next.incomeBasis = "RECEIVED";
        }
        break;
      case "SHARE_NET":
        next.hasGuaranteedRent = false;
        next.incomeBasis = "RECEIVABLE";
        break;
      case "AGENCY":
        next.hasGuaranteedRent = false;
        next.incomeBasis = "RECEIVABLE";
        break;
      case "SHARE_GROSS":
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
    const sharedSettlementRule = sharedContractHouse.value?.settlementRule ? normalizeLightManagedRule(sharedContractHouse.value.settlementRule) : undefined;
    const sharedRentFreeRule = sharedContractHouse.value?.rentFreeRule ? { ...sharedContractHouse.value.rentFreeRule } : undefined;

    const payload: any = {
      ownerType: form.ownerType,
      ownerContract,
      contractHouseList: form.contractHouseList.map(item => ({
        id: item.id,
        houseId: item.houseId,
        houseName: item.houseName,
        remark: item.remark,
        settlementRule:
          form.ownerContract.cooperationMode === "LIGHT_MANAGED"
            ? {
                ...(sharedSettlementRule || {}),
                guaranteedRentAmount:
                  sharedSettlementRule?.settlementMode === "FIXED" || sharedSettlementRule?.hasGuaranteedRent ? sharedSettlementRule?.guaranteedRentAmount : 0,
                managementFeeValue: sharedSettlementRule?.managementFeeEnabled ? sharedSettlementRule?.managementFeeValue : 0,
                rentFreeEnabled: Boolean(sharedRentFreeRule?.enabled),
                settlementItemList: (((sharedSettlementRule?.settlementItemList || []) as OwnerSettlementItemForm[])).map(settlementItem => ({
                  feeDirection: settlementItem.feeDirection,
                  feeType: settlementItem.feeType,
                  itemName: settlementItem.itemName,
                  transferEnabled: settlementItem.transferEnabled,
                  transferRatio: settlementItem.transferRatio,
                  sortOrder: settlementItem.sortOrder,
                  remark: settlementItem.remark
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

    if (form.ownerType === "PERSONAL") {
      payload.ownerPersonal = { ...form.ownerPersonal };
    } else {
      payload.ownerCompany = { ...form.ownerCompany };
    }

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

  watch(previewVisible, value => {
    if (!value && pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = "";
    }
  });

  onMounted(async () => {
    await Promise.all([loadTemplates(), loadTemplateParams(), loadFeeTypeOptions()]);
    syncLeaseFeeCascaderValues();
    syncSettlementFeeCascaderValues();
  });

  watch(
    [() => form.ownerLeaseRule.otherFeeList, otherFeeTypeOptions],
    () => {
      syncLeaseFeeCascaderValues();
    },
    { deep: true }
  );

  watch(
    [() => form.contractHouseList, otherFeeTypeOptions],
    () => {
      syncSettlementFeeCascaderValues();
    },
    { deep: true }
  );

  defineExpose({
    getRef,
    validateAndBuildPayload,
    form
  });
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

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
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
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
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

  .owner-info-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
    gap: 16px;
    margin-top: 12px;
  }

  .info-panel {
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-fill-color-extra-light);
  }

  .info-panel__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .info-panel__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .info-panel__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
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

  .date-range-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .date-shortcuts {
    display: flex;
    gap: 8px;
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

  .selected-house-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .selected-house-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .selected-house-chip {
    min-width: 220px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-light);
    background: #fff;
  }

  .selected-house-chip__title {
    font-weight: 600;
    color: var(--el-text-color-primary);
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

  .house-layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 16px;
  }

  .house-sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .house-side-card {
    border: 1px solid var(--el-border-color-lighter);
    background: #fff;
    border-radius: 12px;
    padding: 14px;
    text-align: left;
    transition: all 0.2s;
  }

  .house-side-card.active {
    border-color: var(--el-color-primary);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.08);
  }

  .house-side-card__title {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .house-side-card__meta {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .house-side-card__footer {
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .house-detail {
    min-height: 116px;
  }

  .rule-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .rule-editor__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--el-fill-color-light);
  }

  .rule-editor__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .house-highlight {
    margin-top: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #fff7ed;
    color: #9a3412;
    line-height: 1.7;
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

  .mode-guide__fields {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .switch-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .switch-card {
    padding: 14px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    background: #fff;
  }

  .switch-card__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-weight: 600;
  }

  .switch-card__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rule-hint {
    margin-top: 4px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #f8fafc;
    color: var(--el-text-color-regular);
    line-height: 1.7;
  }

  .settlement-mode-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .choice-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .choice-group__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .choice-group__label--compact {
    margin-bottom: 4px;
  }

  .choice-group__desc {
    font-size: 12px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }

  .fee-table-wrapper {
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
  }

  .fee-table {
    width: 100%;
    border-collapse: collapse;
  }

  .fee-table th,
  .fee-table td {
    padding: 14px 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    vertical-align: middle;
  }

  .fee-table th {
    text-align: left;
    font-weight: 600;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-extra-light);
  }

  .fee-table tbody tr:last-child td {
    border-bottom: none;
  }

  .empty-row td {
    padding: 24px 12px;
  }

  .empty-state {
    text-align: center;
    color: var(--el-text-color-secondary);
  }

  .direction-chip {
    width: 72px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid transparent;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
  }

  .chip-income {
    color: #d97706;
    background: #fff7ed;
    border-color: #fdba74;
  }

  .chip-expense {
    color: #ea580c;
    background: #fff7ed;
    border-color: #fdba74;
  }

  @media (max-width: 1200px) {
    .owner-info-grid,
    .house-layout,
    .settlement-mode-grid,
    .switch-grid,
    .template-preview-metrics,
    .template-preview-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
