<template>
  <div v-loading="loading" class="checkout-body">
    <!-- ====== 步骤指示器 ====== -->
    <div class="steps-bar">
      <div class="step" :class="{ active: currentStep >= 1, done: currentStep > 1 }" @click="scrollToSection('contract')">
        <span class="step-num">1</span>
        <span class="step-label">合同信息</span>
      </div>
      <div class="step-line" />
      <div class="step" :class="{ active: currentStep >= 2, done: currentStep > 2 }" @click="scrollToSection('checkout')">
        <span class="step-num">2</span>
        <span class="step-label">退租信息</span>
      </div>
      <div class="step-line" />
      <div class="step" :class="{ active: currentStep >= 3, done: currentStep > 3 }" @click="scrollToSection('fees')">
        <span class="step-num">3</span>
        <span class="step-label">费用清算</span>
      </div>
      <div class="step-line" />
      <div class="step" :class="{ active: currentStep >= 4 }" @click="scrollToSection('payee')">
        <span class="step-num">4</span>
        <span class="step-label">收款信息</span>
      </div>
    </div>

    <div ref="scrollContainerRef" class="scroll-container" @scroll="handleScroll">
      <!-- ====== 合同信息 ====== -->
      <div ref="contractRef" class="section-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-dot" />
            <span class="card-title">合同信息</span>
          </div>
        </div>
        <div class="contract-grid">
          <div class="contract-cell full-width">
            <span class="cell-label">房源地址</span>
            <span class="cell-value address-value">{{ initData?.roomAddress || "-" }}</span>
          </div>
          <div class="contract-cell">
            <span class="cell-label">合同周期</span>
            <span class="cell-value">{{ formatDate(initData?.leaseStart) }} ~ {{ formatDate(initData?.leaseEnd) }}</span>
          </div>
          <div class="contract-cell">
            <span class="cell-label">承租人</span>
            <span class="cell-value">
              {{ initData?.tenantName || "-" }}
              <span v-if="initData?.agentInfo" class="agent-tag">委托：{{ initData.agentInfo }}</span>
            </span>
          </div>
          <div class="contract-cell">
            <span class="cell-label">租金</span>
            <span class="cell-value highlight-value">
              {{ formatMoney(initData?.rentPrice) }}
              <span class="unit">元/月</span>
            </span>
          </div>
          <div class="contract-cell">
            <span class="cell-label">押金</span>
            <span class="cell-value highlight-value">
              {{ formatMoney(initData?.depositAmount) }}
              <span class="unit">元</span>
            </span>
          </div>
        </div>
      </div>

      <!-- ====== 退租信息 ====== -->
      <div ref="checkoutRef" class="section-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-dot" />
            <span class="card-title">退租信息</span>
          </div>
          <el-button type="primary" plain size="small" @click="handleOpenDelivery">
            <el-icon class="mr-1"><Plus /></el-icon>
            退房交割单
          </el-button>
        </div>
        <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" :disabled="!canEdit" class="checkout-form">
          <el-row>
            <el-col :span="6">
              <el-form-item label="实际离房日期" prop="actualCheckoutDate">
                <el-date-picker v-model="form.actualCheckoutDate" type="date" placeholder="请选择日期" value-format="YYYY-MM-DD" />
              </el-form-item>
            </el-col>
            <el-col :span="18">
              <el-form-item label="退租类型" prop="checkoutType">
                <el-radio-group v-model="form.checkoutType" @change="handleCheckoutTypeChange">
                  <el-radio-button :value="CHECKOUT_TYPE_META.NORMAL.code">
                    <el-icon class="mr-1"><CircleCheck /></el-icon>
                    正常退
                  </el-radio-button>
                  <el-radio-button :value="CHECKOUT_TYPE_META.BREACH.code">
                    <el-icon class="mr-1"><Warning /></el-icon>
                    违约退
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <!-- 违约退时显示解约原因 -->
          <transition name="slide-fade">
            <el-form-item v-if="form.checkoutType === CHECKOUT_TYPE_META.BREACH.code" label="解约原因">
              <el-input v-model="form.breachReason" type="textarea" :rows="2" placeholder="请输入解约原因（选填）" maxlength="300" show-word-limit :disabled="!canEdit" />
            </el-form-item>
          </transition>
        </el-form>
      </div>

      <!-- ====== 退租费用清算 ====== -->
      <div ref="feesRef" class="section-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-dot" />
            <span class="card-title">退租费用清算</span>
          </div>
        </div>
        <!-- 清洁费选项 -->
        <div class="cleaning-fee-bar">
          <span class="cleaning-label">加收房屋清洁费</span>
          <el-switch v-model="form.addCleaningFee" :disabled="!canEdit" @change="handleCleaningFeeChange" />
          <transition name="slide-fade">
            <div v-if="form.addCleaningFee" class="cleaning-amount">
              <el-input-number v-model="form.cleaningFeeAmount" :min="0" :precision="2" :disabled="!canEdit" controls-position="right" placeholder="金额" style="width: 160px">
                <template #prefix>
                  <span>￥</span>
                </template>
              </el-input-number>
              <span class="unit-text">元</span>
            </div>
          </transition>
        </div>

        <!-- 费用表格 -->
        <div class="fee-table-wrapper">
          <table class="fee-table">
            <thead>
              <tr>
                <th style="width: 70px">收支</th>
                <th style="width: 180px">
                  费用类型
                  <span class="required">*</span>
                </th>
                <th style="width: 160px">
                  金额(元)
                  <span class="required">*</span>
                </th>
                <th style="width: 280px">
                  费用周期
                  <span class="required">*</span>
                </th>
                <th>备注</th>
                <th style="width: 40px" />
              </tr>
            </thead>
            <tbody>
              <tr v-if="form.feeList.length === 0" class="empty-row">
                <td colspan="6">
                  <div class="empty-state">
                    <el-icon :size="28"><Tickets /></el-icon>
                    <span>暂无费用明细，点击下方"添加费用"新增</span>
                  </div>
                </td>
              </tr>
              <tr v-for="(fee, index) in form.feeList" :key="index" class="fee-row">
                <!-- 收支类型 -->
                <td>
                  <div class="direction-chip" :class="fee.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION ? 'chip-income' : 'chip-expense'" @click="canEdit && toggleDirection(fee)">
                    {{ fee.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION ? "收入" : "支出" }}
                  </div>
                </td>
                <!-- 费用类型（级联） -->
                <td>
                  <el-cascader
                    v-model="fee.feeTypeCascade"
                    :options="feeTypeCascadeOptions"
                    :props="{ expandTrigger: 'hover' }"
                    placeholder="请选择费用类型"
                    :disabled="!canEdit"
                    clearable
                    size="default"
                    class="w-full"
                    @change="(val: any) => handleFeeTypeCascadeChange(val, fee)"
                  />
                </td>
                <!-- 金额 -->
                <td>
                  <el-input-number v-model="fee.feeAmount" :min="0" :precision="2" :disabled="!canEdit" controls-position="right" placeholder="0.00" class="w-full">
                    <template #prefix>
                      <span>￥</span>
                    </template>
                  </el-input-number>
                </td>
                <!-- 费用周期 -->
                <td>
                  <div class="period-picker">
                    <el-date-picker
                      v-model="fee.feeStartDate"
                      type="date"
                      placeholder="开始日期"
                      value-format="YYYY-MM-DD"
                      format="YYYY-MM-DD"
                      :disabled="!canEdit"
                      style="width: 130px"
                    />
                    <span class="period-sep">至</span>
                    <el-date-picker
                      v-model="fee.feeEndDate"
                      type="date"
                      placeholder="结束日期"
                      value-format="YYYY-MM-DD"
                      format="YYYY-MM-DD"
                      :disabled="!canEdit"
                      style="width: 130px"
                    />
                  </div>
                </td>
                <!-- 备注 -->
                <td>
                  <el-input v-model="fee.remark" placeholder="选填" :disabled="!canEdit" />
                </td>
                <!-- 操作 -->
                <td class="text-center">
                  <el-button v-if="canEdit" type="danger" link :icon="Delete" size="small" @click="handleRemoveFee(index)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="canEdit" class="add-fee-bar">
          <el-button type="primary" text size="small" @click="handleAddFee">
            <el-icon class="mr-1"><CirclePlus /></el-icon>
            添加费用
          </el-button>
        </div>

        <!-- 费用汇总卡片 -->
        <div class="summary-card">
          <!-- 第一行: 收支计算 -->
          <div class="summary-row">
            <div class="summary-item">
              <span class="summary-label">收入合计</span>
              <span class="summary-val income-color">+{{ formatMoney(incomeTotal) }}</span>
            </div>
            <span class="summary-op">−</span>
            <div class="summary-item">
              <span class="summary-label">支出合计</span>
              <span class="summary-val expense-color">−{{ formatMoney(expenseTotal) }}</span>
            </div>
            <span class="summary-eq">=</span>
            <div class="summary-item result">
              <span class="summary-label">结算金额</span>
              <span class="summary-val" :class="finalAmount >= 0 ? 'income-color' : 'expense-color'">
                {{ finalAmount >= 0 ? "+" : "−" }}{{ formatMoney(Math.abs(finalAmount)) }}元
              </span>
              <span class="summary-hint">{{ finalAmount >= 0 ? "租客补缴" : "应退租客" }}</span>
            </div>
          </div>
          <!-- 第二行: 付款时间 + 账单方式 -->
          <div class="summary-row-2">
            <div class="summary-field">
              <span class="field-label">
                结算截止日
                <span class="required">*</span>
              </span>
              <el-date-picker v-model="form.dueDate" type="date" placeholder="请选择" value-format="YYYY-MM-DD" :disabled="!canEdit" style="width: 160px" />
            </div>
            <div class="summary-field">
              <span class="field-label">账单处理方式</span>
              <el-radio-group v-model="form.settlementMethod" :disabled="!canEdit" @change="handleSettlementMethodChange">
                <el-radio :value="SETTLEMENT_METHOD_META.GENERATE_BILL.code">生成待付账单</el-radio>
                <el-radio :value="SETTLEMENT_METHOD_META.OFFLINE_PAYMENT.code">线下付款</el-radio>
                <el-radio :value="SETTLEMENT_METHOD_META.APPLY_PAYMENT.code">申请付款</el-radio>
                <el-radio :value="SETTLEMENT_METHOD_META.BAD_DEBT.code">标记坏账</el-radio>
              </el-radio-group>
            </div>
          </div>

          <!-- 标记坏账时必须录入坏账原因 -->
          <transition name="slide-fade">
            <div v-if="form.settlementMethod === SETTLEMENT_METHOD_META.BAD_DEBT.code" class="bad-debt-reason">
              <el-icon class="bad-debt-icon"><Warning /></el-icon>
              <div class="bad-debt-input">
                <span class="field-label">
                  坏账原因
                  <span class="required">*</span>
                </span>
                <el-input v-model="form.badDebtReason" type="textarea" :rows="2" placeholder="请输入坏账原因（必填）" maxlength="300" show-word-limit :disabled="!canEdit" />
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- ====== 退租备注 & 凭证 ====== -->
      <div class="section-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-dot" />
            <span class="card-title">退租备注 & 凭证</span>
          </div>
        </div>
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入退租备注信息（选填）" maxlength="500" show-word-limit :disabled="!canEdit" class="mb-3" />
        <div class="upload-area">
          <span class="upload-label">退租凭证</span>
          <UploadImage v-model="form.attachmentFiles" :limit="3" :width="90" :height="90">
            <template #tip="{ limit }">最多{{ limit }}张，单个≤2MB，jpg/png/gif</template>
          </UploadImage>
        </div>
      </div>

      <!-- ====== 收款人信息 ====== -->
      <div ref="payeeRef" class="section-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-dot" />
            <span class="card-title">退租租客收款人信息</span>
          </div>
        </div>

        <div class="payee-grid">
          <div class="payee-cell">
            <span class="cell-label">收款人姓名</span>
            <span class="cell-value">{{ form.payeeName || "-" }}</span>
          </div>
          <div class="payee-cell">
            <span class="cell-label">收款人电话</span>
            <span class="cell-value">{{ form.payeePhone || "-" }}</span>
          </div>
          <div class="payee-cell">
            <span class="cell-label">证件信息</span>
            <div class="inline-fields">
              <el-select v-model="form.payeeIdType" placeholder="证件类型" :disabled="!canEdit" style="width: 110px" size="default">
                <el-option v-for="item in payeeIdTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <el-input v-model="form.payeeIdNo" placeholder="证件号码" :disabled="!canEdit" style="width: 200px" />
            </div>
          </div>
        </div>

        <!-- 收款银行 -->
        <div class="bank-section">
          <span class="bank-section-title">收款银行及账号</span>
          <div class="bank-fields">
            <el-select v-model="form.bankType" placeholder="收款方式" :disabled="!canEdit" style="width: 100px" @change="handleBankTypeChange">
              <el-option v-for="item in bankTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <template v-if="form.bankType === 'UNIONPAY'">
              <el-select v-model="form.bankCardType" placeholder="银行卡类型" :disabled="!canEdit" style="width: 96px">
                <el-option v-for="item in bankCardTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <el-input v-model="form.bankAccount" placeholder="银行账号" :disabled="!canEdit" style="width: 200px" />
              <el-input v-model="form.bankName" placeholder="银行名称" :disabled="!canEdit" style="width: 140px" />
              <el-input v-model="form.bankBranch" placeholder="支行名称" :disabled="!canEdit" style="width: 140px" />
            </template>
            <template v-else>
              <el-input v-model="form.bankAccount" :placeholder="form.bankType === 'ALIPAY' ? '支付宝账号' : '微信账号'" :disabled="!canEdit" style="width: 260px" />
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== 底部操作栏 ====== -->
    <div class="dialog-footer">
      <div class="footer-left">
        <el-checkbox v-model="form.sendConfirmation" :disabled="!canEdit">发送退租确认单给租客</el-checkbox>
        <el-select v-if="form.sendConfirmation" v-model="form.confirmationTemplate" :disabled="!canEdit" style="width: 160px" size="small">
          <el-option v-for="item in confirmationTemplateOptions" :key="item.id" :label="item.templateName" :value="item.id" />
        </el-select>
      </div>
      <div class="footer-right">
        <el-button v-if="canEdit" type="primary" :loading="submitting" @click="() => handleSubmit()">
          <el-icon v-if="!submitting" class="mr-1"><Check /></el-icon>
          确 定
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from "vue";
  import { ElMessage, type FormInstance, type FormRules } from "element-plus";
  import { Check, CircleCheck, CirclePlus, Delete, Plus, Tickets, Warning } from "@element-plus/icons-vue";
  import {
    APPROVAL_STATUS_META,
    CHECKOUT_FEE_TYPE_CODE_MAP,
    CHECKOUT_STATUS_META,
    CHECKOUT_TYPE_META,
    CONTRACT_TYPE_META,
    FEE_DIRECTION_ENUM,
    LEASE_BILL_TYPE_META,
    SETTLEMENT_METHOD_META
  } from "@/constants";
  import { CheckoutBankCardTypeEnumMeta, CheckoutBankTypeEnumMeta, IdTypeEnumMeta } from "@/types/generated/enum.meta";
  import type { LeaseCheckoutVo, LeaseCheckoutInitVo } from "@/types";
  import type { CheckoutFeeFormItem, CheckoutDialogFormData } from "@/types/models/checkout";
  import { getCheckoutByLeaseId, getCheckoutInitData, saveCheckout, submitCheckout } from "@/api/contract/checkout";
  import { getMyAvailableContractTemplates } from "@/api/contract/template";
  import { getDictDataByParentCode } from "@/api/sys/dict";
  import UploadImage from "@/components/upload/UploadImage.vue";

  // ──────────────────────────────────────────────
  // 注意：此组件不再自己管理 el-dialog，
  // 由外部通过 addDialog 的 contentRenderer 渲染，
  // 提交逻辑通过 addDialog 的 beforeSure 调用 handleSubmit()
  // ──────────────────────────────────────────────

  const emit = defineEmits<(e: "success") => void>();

  const loading = ref(false);
  const submitting = ref(false);
  const formRef = ref<FormInstance>();
  const currentStep = ref(1);

  // section refs for scroll tracking
  const scrollContainerRef = ref<HTMLElement>();
  const contractRef = ref<HTMLElement>();
  const checkoutRef = ref<HTMLElement>();
  const feesRef = ref<HTMLElement>();
  const payeeRef = ref<HTMLElement>();

  const initData = ref<LeaseCheckoutInitVo | null>(null);
  const checkoutDetail = ref<LeaseCheckoutVo | null>(null);

  const confirmationTemplateOptions = ref<{ id: string; templateName: string }[]>([]);

  // ===== 费用类型字典数据 =====
  interface DictDataItem {
    id: string;
    feeName?: string;
    name: string;
    value: string;
    color?: string;
  }
  interface DictGroup {
    dictCode: string;
    dictName: string;
    dictDataList: DictDataItem[];
  }
  const feeTypeDictList = ref<DictGroup[]>([]);

  async function loadConfirmationTemplates() {
    if (confirmationTemplateOptions.value.length > 0) return;
    const res = await getMyAvailableContractTemplates({ contractType: CONTRACT_TYPE_META.CHECKOUT.code });
    if (res.code === 0) {
      confirmationTemplateOptions.value = res.data || [];
    }
  }

  async function loadFeeTypeDict() {
    try {
      const res = await getDictDataByParentCode({ dictCode: "fee_type" });
      if (res?.code === 0 && Array.isArray(res.data)) {
        feeTypeDictList.value = res.data;
      }
    } catch (e) {
      console.error("加载费用类型字典失败", e);
    }
  }

  const feeTypeCascadeOptions = computed(() => {
    const otherFeeChildren = feeTypeDictList.value.map(group => ({
      label: group.dictName,
      value: group.dictCode,
      children: group.dictDataList.map(item => ({
        value: item.id,
        label: item.feeName || item.name
      }))
    }));

    return [
      { label: "租金", value: "RENTAL" },
      { label: "押金", value: "DEPOSIT" },
      { label: "其他费用", value: "OTHER_FEE", children: otherFeeChildren }
    ];
  });

  const payeeIdTypeOptions = Object.values(IdTypeEnumMeta).map(item => ({
    label: item.name,
    value: item.code
  }));

  const bankTypeOptions = Object.values(CheckoutBankTypeEnumMeta).map(item => ({
    label: item.name,
    value: item.code
  }));

  const bankCardTypeOptions = Object.values(CheckoutBankCardTypeEnumMeta).map(item => ({
    label: item.name,
    value: item.code
  }));

  function resolveFeeTypeFromName(feeName?: string | null) {
    const text = `${feeName ?? ""}`.trim();
    if (!text) return null;
    if (text.includes("租金")) return LEASE_BILL_TYPE_META.RENT.code;
    if (text.includes("押金")) return LEASE_BILL_TYPE_META.DEPOSIT.code;
    return LEASE_BILL_TYPE_META.OTHER_FEE.code;
  }

  function handleFeeTypeCascadeChange(val: string[] | null, fee: CheckoutFeeFormItem) {
    if (!val || val.length === 0) {
      fee.feeType = null;
      fee.dictDataId = undefined;
      fee.feeName = "";
      return;
    }

    const [feeType, dictCode, dictDataId] = val;
    if (feeType === "RENTAL") {
      fee.feeType = LEASE_BILL_TYPE_META.RENT.code;
      fee.dictDataId = undefined;
      fee.feeName = "租金";
      return;
    }

    if (feeType === "DEPOSIT") {
      fee.feeType = LEASE_BILL_TYPE_META.DEPOSIT.code;
      fee.dictDataId = undefined;
      fee.feeName = "押金";
      return;
    }

    fee.feeType = LEASE_BILL_TYPE_META.OTHER_FEE.code;
    fee.dictDataId = undefined;
    fee.feeName = "";
    if (!dictCode || !dictDataId) {
      return;
    }
    const group = feeTypeDictList.value.find(g => g.dictCode === dictCode);
    const child = group?.dictDataList.find(c => c.id === dictDataId);
    if (!child) return;
    fee.dictDataId = child.id;
    fee.feeName = child.feeName || child.name || "";
  }

  function resolveFeeCascadeValue(fee: CheckoutFeeFormItem): string[] | null {
    if (fee.feeType === LEASE_BILL_TYPE_META.RENT.code) {
      return ["RENTAL"];
    }

    if (fee.feeType === LEASE_BILL_TYPE_META.DEPOSIT.code) {
      return ["DEPOSIT"];
    }

    if (!feeTypeDictList.value.length) {
      return fee.feeType === LEASE_BILL_TYPE_META.OTHER_FEE.code ? ["OTHER_FEE"] : null;
    }

    if (fee.feeType === LEASE_BILL_TYPE_META.OTHER_FEE.code && fee.dictDataId) {
      for (const group of feeTypeDictList.value) {
        for (const item of group.dictDataList) {
          if (item.id === fee.dictDataId) {
            return ["OTHER_FEE", group.dictCode, item.id];
          }
        }
      }
      return ["OTHER_FEE"];
    }

    if (!fee.feeName) return null;

    if (fee.feeType === LEASE_BILL_TYPE_META.OTHER_FEE.code) {
      for (const group of feeTypeDictList.value) {
        for (const item of group.dictDataList) {
          if (item.name === fee.feeName) {
            return ["OTHER_FEE", group.dictCode, item.id];
          }
        }
      }
    }

    const resolvedByName = resolveFeeTypeFromName(fee.feeName);
    if (resolvedByName === LEASE_BILL_TYPE_META.RENT.code) {
      return ["RENTAL"];
    }
    if (resolvedByName === LEASE_BILL_TYPE_META.DEPOSIT.code) {
      return ["DEPOSIT"];
    }

    for (const group of feeTypeDictList.value) {
      for (const item of group.dictDataList) {
        if (item.name === fee.feeName) {
          return ["OTHER_FEE", group.dictCode, item.id];
        }
      }
    }

    return null;
  }

  const form = reactive<CheckoutDialogFormData>({
    id: undefined,
    tenantId: "",
    leaseId: "",
    checkoutType: CHECKOUT_TYPE_META.NORMAL.code,
    actualCheckoutDate: "",
    breachReason: "",
    addCleaningFee: false,
    cleaningFeeAmount: null,
    feeList: [],
    dueDate: "",
    settlementMethod: SETTLEMENT_METHOD_META.GENERATE_BILL.code,
    remark: "",
    attachmentIds: [],
    attachmentFiles: [],
    payeeName: "",
    payeePhone: "",
    payeeIdType: 0,
    payeeIdNo: "",
    bankType: "UNIONPAY",
    bankCardType: "DEBIT",
    bankAccount: "",
    bankName: "",
    bankBranch: "",
    sendConfirmation: false,
    confirmationTemplate: "",
    badDebtReason: ""
  });

  const formRules = reactive<FormRules>({
    checkoutType: [{ required: true, message: "请选择退租类型", trigger: "change" }],
    actualCheckoutDate: [{ required: true, message: "请选择实际离房日期", trigger: "change" }]
  });

  const incomeTotal = computed(() => {
    const feeIncome = form.feeList.filter(f => f.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION).reduce((sum, f) => sum + (f.feeAmount || 0), 0);
    const cleaningIncome = form.addCleaningFee ? Number(form.cleaningFeeAmount || 0) : 0;
    return feeIncome + cleaningIncome;
  });
  const expenseTotal = computed(() => form.feeList.filter(f => f.feeDirection === FEE_DIRECTION_ENUM.REFUND).reduce((sum, f) => sum + (f.feeAmount || 0), 0));
  const finalAmount = computed(() => incomeTotal.value - expenseTotal.value);

  const canEdit = computed(() => {
    if (!checkoutDetail.value) return true;
    return checkoutDetail.value.status === CHECKOUT_STATUS_META.DRAFT.code || checkoutDetail.value.approvalStatus === APPROVAL_STATUS_META.REJECTED.code;
  });

  function handleScroll() {
    const container = scrollContainerRef.value;
    if (!container) return;
    const scrollTop = container.scrollTop + 60;
    const sections = [
      { ref: contractRef.value, step: 1 },
      { ref: checkoutRef.value, step: 2 },
      { ref: feesRef.value, step: 3 },
      { ref: payeeRef.value, step: 4 }
    ];
    for (let i = sections.length - 1; i >= 0; i--) {
      if (sections[i].ref && sections[i].ref!.offsetTop <= scrollTop) {
        currentStep.value = sections[i].step;
        break;
      }
    }
  }

  function scrollToSection(section: string) {
    const map: Record<string, any> = {
      contract: contractRef,
      checkout: checkoutRef,
      fees: feesRef,
      payee: payeeRef
    };
    const el = map[section]?.value;
    if (el && scrollContainerRef.value) {
      scrollContainerRef.value.scrollTo({ top: el.offsetTop - 10, behavior: "smooth" });
    }
  }

  function formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "-";
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}.${m}.${d}`;
    } catch {
      return "-";
    }
  }

  function formatMoney(amount: number | undefined | null): string {
    if (amount === undefined || amount === null) return "0.00";
    return Math.abs(amount).toFixed(2);
  }

  function getTodayStr(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  function toggleDirection(fee: CheckoutFeeFormItem) {
    fee.feeDirection = fee.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION ? FEE_DIRECTION_ENUM.REFUND : FEE_DIRECTION_ENUM.DEDUCTION;
  }

  function handleCheckoutTypeChange(val: number) {
    if (val === CHECKOUT_TYPE_META.BREACH.code) {
      form.feeList = form.feeList.filter(f => !(f.feeDirection === FEE_DIRECTION_ENUM.REFUND && f.feeType === CHECKOUT_FEE_TYPE_CODE_MAP.DEPOSIT_REFUND));
    } else if (val === CHECKOUT_TYPE_META.NORMAL.code) {
      form.breachReason = "";
      const hasDepositRefund = form.feeList.some(f => f.feeDirection === FEE_DIRECTION_ENUM.REFUND && f.feeType === CHECKOUT_FEE_TYPE_CODE_MAP.DEPOSIT_REFUND);
      if (!hasDepositRefund && initData.value && initData.value.depositAmount && initData.value.depositAmount > 0) {
        const newFee: CheckoutFeeFormItem = {
          feeDirection: FEE_DIRECTION_ENUM.REFUND,
          feeType: CHECKOUT_FEE_TYPE_CODE_MAP.DEPOSIT_REFUND,
          feeName: "房屋押金",
          feeAmount: initData.value.depositAmount ?? null,
          feeStartDate: formatDate(initData.value.leaseStart).replace(/\./g, "-"),
          feeEndDate: formatDate(initData.value.leaseEnd).replace(/\./g, "-"),
          remark: "",
          feeTypeCascade: null
        };
        newFee.feeTypeCascade = resolveFeeCascadeValue(newFee);
        form.feeList.push(newFee);
      }
    }
  }

  function handleCleaningFeeChange(val: boolean) {
    if (!val) {
      form.cleaningFeeAmount = null;
    }
  }

  function handleSettlementMethodChange(val: number) {
    if (val !== SETTLEMENT_METHOD_META.BAD_DEBT.code) {
      form.badDebtReason = "";
    }
  }

  function handleAddFee() {
    const today = getTodayStr();
    const newFee: CheckoutFeeFormItem = {
      feeDirection: FEE_DIRECTION_ENUM.DEDUCTION,
      feeType: null,
      feeName: "",
      feeAmount: null,
      feeStartDate: today,
      feeEndDate: today,
      remark: "",
      feeTypeCascade: null
    };
    form.feeList.push(newFee);
  }

  function handleRemoveFee(index: number) {
    form.feeList.splice(index, 1);
  }

  function handleOpenDelivery() {
    ElMessage.info("退房交割单功能待实现");
  }

  function handleBankTypeChange(val: string) {
    if (val !== "UNIONPAY") {
      form.bankCardType = undefined;
      form.bankName = "";
      form.bankBranch = "";
    } else {
      form.bankCardType = "DEBIT";
    }
  }

  // ── 对外暴露的初始化方法，由 addDialog 调用前先 open ──
  async function open(leaseId: string | number) {
    loading.value = true;
    currentStep.value = 1;
    resetForm();

    if (feeTypeDictList.value.length === 0) {
      await loadFeeTypeDict();
    }
    await loadConfirmationTemplates();

    try {
      const existRes = await getCheckoutByLeaseId(String(leaseId));
      if (existRes.data?.id) {
        await loadCheckoutDetail(existRes.data);
      } else {
        await loadInitData(String(leaseId));
      }
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.code === 404 || !error?.data?.id) {
        try {
          await loadInitData(String(leaseId));
        } catch (initError) {
          console.error("加载初始化数据失败", initError);
          ElMessage.error("加载数据失败");
        }
      } else {
        console.error("加载数据失败", error);
        ElMessage.error("加载数据失败");
      }
    } finally {
      loading.value = false;
    }
  }

  async function loadInitData(leaseId: string) {
    const res = await getCheckoutInitData(leaseId);
    initData.value = res.data;
    form.tenantId = res.data.tenantId ?? "";
    form.leaseId = leaseId;
    form.actualCheckoutDate = getTodayStr();
    form.dueDate = getTodayStr();
    form.checkoutType = CHECKOUT_TYPE_META.NORMAL.code;

    if (res.data.payeeInfo) {
      form.payeeName = res.data.payeeInfo.payeeName || "";
      form.payeePhone = res.data.payeeInfo.payeePhone || "";
      form.payeeIdType = res.data.payeeInfo.payeeIdType ?? 0;
      form.payeeIdNo = res.data.payeeInfo.payeeIdNo || "";
    }

    if (!form.confirmationTemplate && confirmationTemplateOptions.value.length > 0) {
      form.confirmationTemplate = confirmationTemplateOptions.value[0].id;
    }

    if (res.data.presetFees && res.data.presetFees.length > 0) {
      form.feeList = res.data.presetFees.map<CheckoutFeeFormItem>(pf => {
        const fee: CheckoutFeeFormItem = {
          feeDirection: pf.feeDirection ?? FEE_DIRECTION_ENUM.DEDUCTION,
          feeType: pf.feeType ?? null,
          feeName: pf.feeName ?? "",
          feeAmount: pf.feeAmount ?? null,
          feeStartDate: pf.feeStartDate?.split("T")[0] ?? getTodayStr(),
          feeEndDate: pf.feeEndDate?.split("T")[0] ?? getTodayStr(),
          remark: pf.remark ?? "",
          leaseBillId: pf.leaseBillId,
          feeTypeCascade: null
        };
        fee.feeTypeCascade = resolveFeeCascadeValue(fee);
        return fee;
      });
    }
  }

  async function loadCheckoutDetail(detail: LeaseCheckoutVo) {
    checkoutDetail.value = detail;
    form.id = detail.id;
    form.tenantId = detail.tenantId ?? "";
    form.leaseId = detail.leaseId ?? "";
    form.checkoutType = detail.checkoutType ?? null;
    form.actualCheckoutDate = detail.actualCheckoutDate ?? "";
    form.breachReason = detail.breachReason ?? "";
    form.addCleaningFee = detail.addCleaningFee ?? false;
    form.cleaningFeeAmount = detail.cleaningFeeAmount ?? null;
    form.dueDate = detail.dueDate ?? "";
    form.settlementMethod = detail.settlementMethod ?? SETTLEMENT_METHOD_META.GENERATE_BILL.code;
    form.remark = detail.remark ?? "";

    if (!form.confirmationTemplate && confirmationTemplateOptions.value.length > 0) {
      form.confirmationTemplate = confirmationTemplateOptions.value[0].id;
    }

    form.feeList = (detail.feeList ?? []).map<CheckoutFeeFormItem>(f => {
      const fee: CheckoutFeeFormItem = {
        id: f.id,
        feeDirection: f.feeDirection ?? FEE_DIRECTION_ENUM.DEDUCTION,
        feeType: f.feeType ?? null,
        dictDataId: f.dictDataId,
        feeName: f.feeName,
        feeAmount: f.feeAmount ?? null,
        feeStartDate: f.feeStartDate,
        feeEndDate: f.feeEndDate,
        remark: f.remark,
        leaseBillId: f.leaseBillId,
        feeTypeCascade: null
      };
      fee.feeTypeCascade = resolveFeeCascadeValue(fee);
      return fee;
    });

    form.payeeName = detail.payeeName ?? "";
    form.payeePhone = detail.payeePhone ?? "";
    form.payeeIdType = detail.payeeIdType ?? 0;
    form.payeeIdNo = detail.payeeIdNo ?? "";
    form.bankType = detail.bankType ?? "UNIONPAY";
    form.bankCardType = detail.bankCardType ?? "DEBIT";
    form.bankAccount = detail.bankAccount ?? "";
    form.bankName = detail.bankName ?? "";
    form.bankBranch = detail.bankBranch ?? "";

    if (detail.attachmentUrls && detail.attachmentUrls.length > 0) {
      form.attachmentFiles = detail.attachmentUrls;
    }

    initData.value = {
      tenantId: detail.tenantId,
      roomAddress: detail.roomAddress,
      leaseStart: detail.leaseStart,
      leaseEnd: detail.leaseEnd,
      tenantName: detail.tenantName,
      tenantPhone: detail.tenantPhone,
      agentInfo: detail.agentInfo,
      rentPrice: detail.rentPrice,
      depositAmount: detail.depositAmount,
      depositMonths: 0,
      unpaidBills: [],
      unpaidAmount: 0,
      presetFees: [],
      payeeInfo: {
        payeeName: detail.payeeName,
        payeePhone: detail.payeePhone,
        payeeIdType: detail.payeeIdType,
        payeeIdNo: detail.payeeIdNo
      }
    };
  }

  // ── 提交逻辑：由 addDialog beforeSure 调用，done() 关闭弹框 ──
  async function handleSubmit(done?: () => void) {
    if (!formRef.value) return;

    formRef.value.validate(async valid => {
      if (!valid) return;

      if (!form.dueDate) {
        ElMessage.warning("请选择结算截止日");
        return;
      }
      if (!form.feeList.length && !form.addCleaningFee) {
        ElMessage.warning("请至少添加一条费用明细或加收房屋清洁费");
        return;
      }
      if (form.addCleaningFee && (!form.cleaningFeeAmount || Number(form.cleaningFeeAmount) <= 0)) {
        ElMessage.warning("请输入有效的房屋清洁费金额");
        return;
      }
      for (const fee of form.feeList) {
        if (!fee.feeType) {
          ElMessage.warning("请选择费用类型");
          return;
        }
        if (fee.feeType === LEASE_BILL_TYPE_META.OTHER_FEE.code && !fee.dictDataId) {
          ElMessage.warning("请选择其他费用类型");
          return;
        }
        if (!fee.feeAmount || Number(fee.feeAmount) <= 0) {
          ElMessage.warning("费用金额必须大于0");
          return;
        }
        if (!fee.feeStartDate || !fee.feeEndDate) {
          ElMessage.warning("请完善费用周期");
          return;
        }
      }
      if (form.settlementMethod === SETTLEMENT_METHOD_META.BAD_DEBT.code && !form.badDebtReason?.trim()) {
        ElMessage.warning("标记坏账时必须填写坏账原因");
        return;
      }

      const attachmentIds = [...form.attachmentFiles];

      submitting.value = true;
      try {
        const submitData = {
          ...form,
          checkoutType: form.checkoutType as number,
          addCleaningFee: form.addCleaningFee,
          cleaningFeeAmount: form.addCleaningFee ? form.cleaningFeeAmount : undefined,
          attachmentIds,
          remark: form.settlementMethod === SETTLEMENT_METHOD_META.BAD_DEBT.code ? `${form.remark || ""}${form.remark ? "\n" : ""}【坏账原因】${form.badDebtReason}` : form.remark,
          feeList: form.feeList.map(f => ({
            id: f.id,
            feeDirection: f.feeDirection,
            feeType: Number(f.feeType),
            dictDataId: f.dictDataId,
            feeName: f.feeName,
            feeAmount: f.feeAmount ?? 0,
            feeStartDate: f.feeStartDate,
            feeEndDate: f.feeEndDate,
            remark: f.remark,
            leaseBillId: f.leaseBillId
          }))
        };
        const res = await saveCheckout(submitData);
        form.id = res.data;
        await submitCheckout(form.id!);
        ElMessage.success("退租并结账提交成功");
        emit("success");
        // 由 addDialog 的 beforeSure 传入 done，关闭弹框
        done?.();
      } catch (error) {
        console.error("提交失败", error);
        ElMessage.error("提交失败");
      } finally {
        submitting.value = false;
      }
    });
  }

  function resetForm() {
    form.id = undefined;
    form.tenantId = "";
    form.leaseId = "";
    form.checkoutType = CHECKOUT_TYPE_META.NORMAL.code;
    form.actualCheckoutDate = "";
    form.breachReason = "";
    form.addCleaningFee = false;
    form.cleaningFeeAmount = null;
    form.feeList = [];
    form.dueDate = "";
    form.settlementMethod = SETTLEMENT_METHOD_META.GENERATE_BILL.code;
    form.remark = "";
    form.attachmentIds = [];
    form.attachmentFiles = [];
    form.payeeName = "";
    form.payeePhone = "";
    form.payeeIdType = 0;
    form.payeeIdNo = "";
    form.bankType = "UNIONPAY";
    form.bankCardType = "DEBIT";
    form.bankAccount = "";
    form.bankName = "";
    form.bankBranch = "";
    form.sendConfirmation = false;
    form.confirmationTemplate = "";
    form.badDebtReason = "";
    initData.value = null;
    checkoutDetail.value = null;
  }

  // 暴露给外部（addDialog contentRenderer 中的 ref）
  defineExpose({ open, handleSubmit });
</script>

<style lang="scss" scoped>
  /* ===== Steps Bar ===== */
  .steps-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    background: var(--el-bg-color-page);
    border-bottom: 1px solid var(--el-border-color-lighter);
    gap: 0;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    padding: 4px 12px;
    border-radius: 20px;
    transition: all 0.2s;
    user-select: none;

    .step-num {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--el-border-color);
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .step-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
      transition: all 0.2s;
    }

    &.active {
      background: var(--el-color-primary-light-9);

      .step-num {
        background: var(--el-color-primary);
        color: #fff;
      }

      .step-label {
        color: var(--el-color-primary);
        font-weight: 500;
      }
    }

    &.done {
      .step-num {
        background: var(--el-color-success);
        color: #fff;
      }
    }

    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  .step-line {
    width: 32px;
    height: 1px;
    background: var(--el-border-color);
    margin: 0 4px;
  }

  /* ===== Body & Scroll ===== */
  .checkout-body {
    display: flex;
    flex-direction: column;
    height: calc(90vh - 120px);
    overflow: hidden;
  }

  .scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px 0;
    scroll-behavior: smooth;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-border-color);
      border-radius: 3px;

      &:hover {
        background-color: var(--el-border-color-darker);
      }
    }

    scrollbar-width: thin;
    scrollbar-color: var(--el-border-color) transparent;
  }

  /* ===== Section Card ===== */
  .section-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 14px;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .card-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-dot {
    width: 4px;
    height: 16px;
    border-radius: 2px;
    background: var(--el-color-primary);
  }

  .card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  /* ===== Contract Grid ===== */
  .contract-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 24px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    padding: 14px 16px;
  }

  .contract-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;

    &.full-width {
      grid-column: 1 / -1;
    }
  }

  .cell-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .cell-value {
    font-size: 13px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  .address-value {
    font-size: 14px;
  }

  .highlight-value {
    color: var(--el-color-primary);
    font-size: 15px;
    font-weight: 600;

    .unit {
      font-size: 12px;
      font-weight: 400;
      color: var(--el-text-color-secondary);
      margin-left: 2px;
    }
  }

  .agent-tag {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
    padding: 1px 6px;
    border-radius: 3px;
    margin-left: 6px;
  }

  /* ===== Form ===== */
  .checkout-form {
    :deep(.el-form-item) {
      margin-bottom: 10px;
    }

    :deep(.el-form-item__label) {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-regular);
      padding-bottom: 4px;
    }
  }

  /* ===== Transitions ===== */
  .slide-fade-enter-active {
    transition: all 0.25s ease-out;
  }

  .slide-fade-leave-active {
    transition: all 0.15s ease-in;
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }

  /* ===== Cleaning Fee ===== */
  .cleaning-fee-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    margin-bottom: 14px;

    .cleaning-label {
      font-size: 13px;
      color: var(--el-text-color-regular);
      font-weight: 500;
    }

    .cleaning-amount {
      display: flex;
      align-items: center;
      gap: 4px;

      .unit-text {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  /* ===== Fee Table ===== */
  .fee-table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  .fee-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    th {
      background: var(--el-fill-color-light);
      padding: 9px 10px;
      text-align: left;
      font-weight: 500;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      border-bottom: 1px solid var(--el-border-color-lighter);
      white-space: nowrap;
    }

    td {
      padding: 7px 8px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      vertical-align: middle;
    }

    .required {
      color: var(--el-color-danger);
    }
  }

  .empty-row td {
    padding: 0 !important;
    border: none !important;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 28px 0;
    color: var(--el-text-color-placeholder);
    font-size: 13px;
  }

  .fee-row {
    transition: background 0.15s;

    &:hover {
      background: var(--el-fill-color-lighter);
    }

    &:last-child td {
      border-bottom: none;
    }
  }

  .add-fee-bar {
    display: flex;
    justify-content: flex-end;
    padding: 8px 0;
  }

  /* ===== Direction Chip ===== */
  .direction-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;

    &.chip-income {
      background: var(--el-color-warning-light-8);
      color: var(--el-color-warning-dark-2);
      border: 1px solid var(--el-color-warning-light-5);
    }

    &.chip-expense {
      background: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
      border: 1px solid var(--el-color-primary-light-5);
    }

    &:hover {
      transform: scale(1.05);
    }
  }

  /* ===== Period Picker ===== */
  .period-picker {
    display: flex;
    align-items: center;
    gap: 4px;

    .period-sep {
      color: var(--el-text-color-placeholder);
      font-size: 12px;
      flex-shrink: 0;
    }
  }

  /* ===== Summary Card ===== */
  .summary-card {
    background: var(--el-fill-color-lighter);
    border-radius: 10px;
    padding: 16px;
  }

  .summary-row {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 80px;

    &.result {
      padding: 8px 16px;
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px dashed var(--el-border-color);
    }
  }

  .summary-label {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  .summary-val {
    font-size: 16px;
    font-weight: 700;
  }

  .income-color {
    color: var(--el-color-warning-dark-2);
  }

  .expense-color {
    color: var(--el-color-primary);
  }

  .summary-hint {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  .summary-op,
  .summary-eq {
    font-size: 18px;
    font-weight: 300;
    color: var(--el-text-color-placeholder);
  }

  .summary-row-2 {
    display: flex;
    align-items: flex-start;
    gap: 32px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--el-border-color-lighter);
    flex-wrap: wrap;
  }

  .summary-field {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .field-label {
      font-size: 13px;
      color: var(--el-text-color-regular);
      font-weight: 500;
    }
  }

  /* ===== Bad Debt ===== */
  .bad-debt-reason {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 14px;
    padding: 12px;
    background: var(--el-color-danger-light-9);
    border: 1px solid var(--el-color-danger-light-5);
    border-radius: 8px;

    .bad-debt-icon {
      color: var(--el-color-danger);
      margin-top: 2px;
      flex-shrink: 0;
    }

    .bad-debt-input {
      flex: 1;

      .field-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--el-color-danger-dark-2);
        margin-bottom: 6px;
        display: block;
      }
    }
  }

  .required {
    color: var(--el-color-danger);
  }

  /* ===== Upload ===== */
  .upload-area {
    .upload-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-regular);
      margin-bottom: 8px;
      display: block;
    }
  }

  /* ===== Payee ===== */
  .payee-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 14px;
  }

  .payee-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .inline-fields {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .bank-section {
    padding-top: 14px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .bank-section-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    margin-bottom: 10px;
    display: block;
  }

  .bank-fields {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* ===== Footer ===== */
  .dialog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-page);
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* Utility */
  .mb-3 {
    margin-bottom: 12px;
  }

  .mr-1 {
    margin-right: 4px;
  }

  .w-full {
    width: 100%;
  }

  .text-center {
    text-align: center;
  }

  /* ===== Dark mode ===== */
  :global(html.dark) {
    .section-card:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }

    .add-fee-bar {
      :deep(.el-button--text) {
        border: 1px dashed var(--el-border-color);
        border-radius: 6px;
        padding: 5px 16px;

        &:hover {
          border-color: var(--el-color-primary);
        }
      }
    }

    .summary-item.result {
      border-color: var(--el-border-color);
    }

    .summary-row-2 {
      border-top-color: var(--el-border-color);
    }
  }
</style>
