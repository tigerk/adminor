<template>
  <el-dialog
    v-model="visible"
    :show-close="false"
    width="1020px"
    :close-on-click-modal="false"
    :lock-scroll="true"
    :align-center="true"
    :destroy-on-close="true"
    class="checkout-dialog"
    @close="handleClose"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="dialog-header">
        <div class="header-left">
          <div>
            <span class="header-title">租客退租</span>
            <span v-if="checkoutDetail?.checkoutCode" class="header-code">{{ checkoutDetail.checkoutCode }}</span>
          </div>
        </div>
        <el-button class="close-btn" :icon="Close" circle size="small" @click="handleClose" />
      </div>
    </template>

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
                    <el-radio-button :value="CHECKOUT_TYPE_ENUM.NORMAL">
                      <el-icon class="mr-1"><CircleCheck /></el-icon>
                      正常退
                    </el-radio-button>
                    <el-radio-button :value="CHECKOUT_TYPE_ENUM.BREACH">
                      <el-icon class="mr-1"><Warning /></el-icon>
                      违约退
                    </el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
            <!-- 违约退时显示解约原因 -->
            <transition name="slide-fade">
              <el-form-item v-if="form.checkoutType === CHECKOUT_TYPE_ENUM.BREACH" label="解约原因">
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
            <!-- 改动1: 原按钮位置移除 -->
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
                    <div
                      class="direction-chip"
                      :class="fee.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION ? 'chip-income' : 'chip-expense'"
                      @click="canEdit && toggleDirection(fee)"
                    >
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
                        v-model="fee.feePeriodStart"
                        type="date"
                        placeholder="开始日期"
                        value-format="YYYY-MM-DD"
                        format="YYYY-MM-DD"
                        :disabled="!canEdit"
                        style="width: 130px"
                      />
                      <span class="period-sep">至</span>
                      <el-date-picker
                        v-model="fee.feePeriodEnd"
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

          <!-- 改动1: 添加费用按钮移到表格下方 -->
          <div v-if="canEdit" class="add-fee-bar">
            <el-button type="primary" text size="small" @click="handleAddFee">
              <el-icon class="mr-1"><CirclePlus /></el-icon>
              添加费用
            </el-button>
          </div>

          <!-- 改动2: 费用汇总卡片 — 上下两行布局 -->
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
                  预计收/付款时间
                  <span class="required">*</span>
                </span>
                <el-date-picker v-model="form.expectedPaymentDate" type="date" placeholder="请选择" value-format="YYYY-MM-DD" :disabled="!canEdit" style="width: 160px" />
              </div>
              <div class="summary-field">
                <span class="field-label">账单处理方式</span>
                <el-radio-group v-model="form.settlementMethod" :disabled="!canEdit" @change="handleSettlementMethodChange">
                  <el-radio :value="SETTLEMENT_METHOD_ENUM.GENERATE_BILL">生成待付账单</el-radio>
                  <el-radio :value="SETTLEMENT_METHOD_ENUM.OFFLINE_PAYMENT">线下付款</el-radio>
                  <el-radio :value="SETTLEMENT_METHOD_ENUM.APPLY_PAYMENT">申请付款</el-radio>
                  <el-radio :value="SETTLEMENT_METHOD_ENUM.BAD_DEBT">标记坏账</el-radio>
                </el-radio-group>
              </div>
            </div>

            <!-- 标记坏账时必须录入坏账原因 -->
            <transition name="slide-fade">
              <div v-if="form.settlementMethod === SETTLEMENT_METHOD_ENUM.BAD_DEBT" class="bad-debt-reason">
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
                <el-select v-model="form.payeeIdType" placeholder="身份证" :disabled="!canEdit" style="width: 100px" size="default">
                  <el-option label="身份证" value="ID_CARD" />
                  <el-option label="护照" value="PASSPORT" />
                  <el-option label="营业执照" value="BUSINESS_LICENSE" />
                </el-select>
                <el-input v-model="form.payeeIdNumber" placeholder="证件号码" :disabled="!canEdit" style="width: 200px" />
              </div>
            </div>
          </div>

          <!-- 收款银行 -->
          <div class="bank-section">
            <span class="bank-section-title">收款银行及账号</span>
            <div class="bank-fields">
              <el-select v-model="form.bankType" placeholder="银联" :disabled="!canEdit" style="width: 100px" @change="handleBankTypeChange">
                <el-option label="银联" value="UNIONPAY" />
                <el-option label="支付宝" value="ALIPAY" />
                <el-option label="微信" value="WECHAT" />
              </el-select>
              <template v-if="form.bankType === 'UNIONPAY'">
                <el-select v-model="form.bankCardType" placeholder="借记卡" :disabled="!canEdit" style="width: 96px">
                  <el-option label="借记卡" value="DEBIT" />
                  <el-option label="信用卡" value="CREDIT" />
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
    </div>

    <!-- 底部 -->
    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-checkbox v-model="form.sendConfirmation" :disabled="!canEdit">发送退租确认单给租客</el-checkbox>
          <el-select v-if="form.sendConfirmation" v-model="form.confirmationTemplate" :disabled="!canEdit" style="width: 160px" size="small">
            <el-option v-for="item in confirmationTemplateOptions" :key="item.id" :label="item.templateName" :value="item.id" />
          </el-select>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">取 消</el-button>
          <el-button v-if="canEdit" type="primary" :loading="submitting" @click="handleSubmit">
            <el-icon v-if="!submitting" class="mr-1"><Check /></el-icon>
            确 定
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from "vue";
  import { ElMessage, type FormInstance, type FormRules } from "element-plus";
  import { Check, CircleCheck, CirclePlus, Close, Delete, Plus, Tickets, Warning } from "@element-plus/icons-vue";
  import {
    APPROVAL_STATUS_ENUM,
    CHECKOUT_FEE_TYPE_ENUM,
    CHECKOUT_STATUS_ENUM,
    CHECKOUT_TYPE_ENUM,
    CONTRACT_TYPE_ENUM,
    FEE_DIRECTION_ENUM,
    SETTLEMENT_METHOD_ENUM
  } from "@/constants";
  import type { LeaseCheckoutVo, CheckoutFeeProps, LeaseCheckoutDto, LeaseCheckoutInitVo } from "@/types";
  import { getCheckoutByTenantId, getCheckoutInitData, saveCheckout, submitCheckout } from "@/api/contract/checkout";
  import { getMyAvailableContractTemplates } from "@/api/contract/template";
  import { getDictDataByParentCode } from "@/api/sys/dict";
  import UploadImage from "@/components/Business/UploadImage.vue";

  const emit = defineEmits<(e: "success") => void>();

  const visible = ref(false);
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
    const res = await getMyAvailableContractTemplates({ contractType: CONTRACT_TYPE_ENUM.CHECKOUT });
    if (res.code === 0) {
      confirmationTemplateOptions.value = res.data || [];
    }
  }

  /** 从字典接口加载费用类型 */
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

  /** 构建级联选项：大类 → 子类 */
  const feeTypeCascadeOptions = computed(() => {
    return feeTypeDictList.value.map(group => ({
      value: group.dictCode,
      label: group.dictName,
      children: group.dictDataList.map(item => ({
        value: item.id,
        label: item.name
      }))
    }));
  });

  /** 级联选择变更时，回填 feeType / feeSubName */
  function handleFeeTypeCascadeChange(val: [string, string] | null, fee: any) {
    if (!val || val.length < 2) {
      fee.feeType = null;
      fee.feeSubName = "";
      return;
    }
    const [parentCode, childId] = val;
    fee.feeType = childId;
    const group = feeTypeDictList.value.find(g => g.dictCode === parentCode);
    if (group) {
      const child = group.dictDataList.find(c => c.id === childId);
      fee.feeSubName = child?.name || "";
    }
  }

  /**
   * FIX #2: 根据 feeSubName 自动匹配级联选择值
   */
  function resolveFeeCascadeValue(fee: CheckoutFeeProps): [string, string] | null {
    if (!feeTypeDictList.value.length || !fee.feeSubName) return null;

    for (const group of feeTypeDictList.value) {
      for (const item of group.dictDataList) {
        if (item.name === fee.feeSubName) {
          return [group.dictCode, item.id];
        }
      }
    }

    const keywordMap: Record<string, string> = {
      租金: "fangwuzujin",
      房屋租金: "fangwuzujin",
      押金: "fangwuyajin",
      房屋押金: "fangwuyajin",
      水费: "shuifei",
      电费: "dianfei",
      燃气费: "ranqifei",
      物业费: "wuyefei",
      清洁费: "qingjiefei"
    };

    const targetId = keywordMap[fee.feeSubName];
    if (targetId) {
      for (const group of feeTypeDictList.value) {
        for (const item of group.dictDataList) {
          if (item.id === targetId || item.value === targetId) {
            return [group.dictCode, item.id];
          }
        }
      }
    }

    return null;
  }

  // 表单数据
  const form = reactive<LeaseCheckoutDto & { badDebtReason: string }>({
    id: undefined,
    tenantId: "",
    leaseId: "",
    checkoutType: CHECKOUT_TYPE_ENUM.NORMAL,
    actualCheckoutDate: "",
    breachReason: "",
    addCleaningFee: false,
    cleaningFeeAmount: null,
    feeList: [],
    expectedPaymentDate: "",
    settlementMethod: SETTLEMENT_METHOD_ENUM.GENERATE_BILL,
    remark: "",
    attachmentIds: [],
    attachmentFiles: [],
    payeeName: "",
    payeePhone: "",
    payeeIdType: "ID_CARD",
    payeeIdNumber: "",
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

  // 计算属性
  const incomeTotal = computed(() => form.feeList.filter(f => f.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION).reduce((sum, f) => sum + (f.feeAmount || 0), 0));
  const expenseTotal = computed(() => form.feeList.filter(f => f.feeDirection === FEE_DIRECTION_ENUM.REFUND).reduce((sum, f) => sum + (f.feeAmount || 0), 0));
  const finalAmount = computed(() => incomeTotal.value - expenseTotal.value);

  const canEdit = computed(() => {
    if (!checkoutDetail.value) return true;
    return checkoutDetail.value.status === CHECKOUT_STATUS_ENUM.DRAFT || checkoutDetail.value.approvalStatus === APPROVAL_STATUS_ENUM.REJECTED;
  });

  // Scroll tracking for step indicator
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

  // 工具函数
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

  function toggleDirection(fee: CheckoutFeeProps) {
    fee.feeDirection = fee.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION ? FEE_DIRECTION_ENUM.REFUND : FEE_DIRECTION_ENUM.DEDUCTION;
  }

  // 退租类型变更
  function handleCheckoutTypeChange(val: number) {
    if (val === CHECKOUT_TYPE_ENUM.BREACH) {
      form.feeList = form.feeList.filter(f => !(f.feeDirection === FEE_DIRECTION_ENUM.REFUND && f.feeType === CHECKOUT_FEE_TYPE_ENUM.DEPOSIT_REFUND));
    } else if (val === CHECKOUT_TYPE_ENUM.NORMAL) {
      form.breachReason = "";
      const hasDepositRefund = form.feeList.some(f => f.feeDirection === FEE_DIRECTION_ENUM.REFUND && f.feeType === CHECKOUT_FEE_TYPE_ENUM.DEPOSIT_REFUND);
      if (!hasDepositRefund && initData.value && initData.value.depositAmount > 0) {
        const newFee: CheckoutFeeProps = {
          feeDirection: FEE_DIRECTION_ENUM.REFUND,
          feeType: CHECKOUT_FEE_TYPE_ENUM.DEPOSIT_REFUND,
          feeSubName: "房屋押金",
          feeAmount: initData.value.depositAmount,
          feePeriodStart: formatDate(initData.value.leaseStart).replace(/\./g, "-"),
          feePeriodEnd: formatDate(initData.value.leaseEnd).replace(/\./g, "-"),
          remark: "",
          feeTypeCascade: null
        };
        newFee.feeTypeCascade = resolveFeeCascadeValue(newFee);
        form.feeList.push(newFee);
      }
    }
  }

  // 清洁费变更
  function handleCleaningFeeChange(val: boolean) {
    if (val && form.cleaningFeeAmount && form.cleaningFeeAmount > 0) {
      addCleaningFeeRow();
    } else if (!val) {
      form.feeList = form.feeList.filter(f => f.feeType !== CHECKOUT_FEE_TYPE_ENUM.CLEANING);
    }
  }

  function addCleaningFeeRow() {
    const today = getTodayStr();
    const exists = form.feeList.some(f => f.feeType === CHECKOUT_FEE_TYPE_ENUM.CLEANING);
    if (!exists) {
      form.feeList.push({
        feeDirection: FEE_DIRECTION_ENUM.DEDUCTION,
        feeType: CHECKOUT_FEE_TYPE_ENUM.CLEANING,
        feeSubName: "清洁费",
        feeAmount: form.cleaningFeeAmount || 0,
        feePeriodStart: today,
        feePeriodEnd: today,
        remark: "",
        feeTypeCascade: null
      });
    }
  }

  // 账单处理方式变更
  function handleSettlementMethodChange(val: number) {
    if (val !== SETTLEMENT_METHOD_ENUM.BAD_DEBT) {
      form.badDebtReason = "";
    }
  }

  // 添加费用行
  function handleAddFee() {
    const today = getTodayStr();
    form.feeList.push({
      feeDirection: FEE_DIRECTION_ENUM.DEDUCTION,
      feeType: null,
      feeSubName: "",
      feeAmount: null,
      feePeriodStart: today,
      feePeriodEnd: today,
      remark: "",
      feeTypeCascade: null
    });
  }

  function handleRemoveFee(index: number) {
    form.feeList.splice(index, 1);
  }

  function handleOpenDelivery() {
    ElMessage.info("退房交割单功能待实现");
  }

  function handleBankTypeChange(val: string) {
    if (val !== "UNIONPAY") {
      form.bankCardType = "";
      form.bankName = "";
      form.bankBranch = "";
    } else {
      form.bankCardType = "DEBIT";
    }
  }

  // 打开对话框
  async function open(tenantId: string | number, leaseId?: string | number) {
    visible.value = true;
    loading.value = true;
    currentStep.value = 1;
    resetForm();

    if (feeTypeDictList.value.length === 0) {
      await loadFeeTypeDict();
    }
    await loadConfirmationTemplates();

    try {
      const existRes = await getCheckoutByTenantId(String(tenantId), leaseId ? String(leaseId) : undefined);
      if (existRes.data?.id) {
        await loadCheckoutDetail(existRes.data);
      } else {
        await loadInitData(String(tenantId), leaseId ? String(leaseId) : undefined);
      }
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.code === 404 || !error?.data?.id) {
        try {
          await loadInitData(String(tenantId), leaseId ? String(leaseId) : undefined);
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

  async function loadInitData(tenantId: string, leaseId?: string) {
    const res = await getCheckoutInitData(tenantId, leaseId);
    initData.value = res.data;
    form.tenantId = tenantId;
    form.leaseId = leaseId || res.data.leaseId || "";
    form.actualCheckoutDate = getTodayStr();
    form.expectedPaymentDate = getTodayStr();
    form.checkoutType = CHECKOUT_TYPE_ENUM.NORMAL;

    if (res.data.payeeInfo) {
      form.payeeName = res.data.payeeInfo.payeeName || "";
      form.payeePhone = res.data.payeeInfo.payeePhone || "";
    }

    if (!form.confirmationTemplate && confirmationTemplateOptions.value.length > 0) {
      form.confirmationTemplate = confirmationTemplateOptions.value[0].id;
    }

    if (res.data.presetFees?.length > 0) {
      form.feeList = res.data.presetFees.map(pf => {
        const fee: CheckoutFeeProps = {
          feeDirection: pf.feeDirection,
          feeType: pf.feeType,
          feeSubName: pf.feeSubName || "",
          feeAmount: pf.feeAmount,
          feePeriodStart: pf.feePeriodStart?.split("T")[0] || getTodayStr(),
          feePeriodEnd: pf.feePeriodEnd?.split("T")[0] || getTodayStr(),
          remark: pf.remark || "",
          billId: pf.billId,
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
    form.tenantId = detail.tenantId;
    form.leaseId = detail.leaseId || "";
    form.checkoutType = detail.checkoutType;
    form.actualCheckoutDate = detail.actualCheckoutDate;
    form.breachReason = detail.breachReason || "";
    form.expectedPaymentDate = detail.expectedPaymentDate;
    form.settlementMethod = detail.settlementMethod;
    form.remark = detail.remark;

    if (!form.confirmationTemplate && confirmationTemplateOptions.value.length > 0) {
      form.confirmationTemplate = confirmationTemplateOptions.value[0].id;
    }

    form.feeList = detail.feeList.map(f => {
      const fee = { ...f, feeTypeCascade: null as [string, string] | null };
      fee.feeTypeCascade = resolveFeeCascadeValue(fee);
      return fee;
    });

    form.payeeName = detail.payeeName || "";
    form.payeePhone = detail.payeePhone || "";
    form.payeeIdType = detail.payeeIdType || "ID_CARD";
    form.payeeIdNumber = detail.payeeIdNumber || "";
    form.bankType = detail.bankType || "UNIONPAY";
    form.bankCardType = detail.bankCardType || "DEBIT";
    form.bankAccount = detail.bankAccount || "";
    form.bankName = detail.bankName || "";
    form.bankBranch = detail.bankBranch || "";

    if (detail.attachmentUrls?.length > 0) {
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
        payeePhone: detail.payeePhone
      }
    };
  }

  async function handleSubmit() {
    if (!formRef.value) return;
    formRef.value.validate(async valid => {
      if (!valid) return;

      if (!form.expectedPaymentDate) {
        ElMessage.warning("请选择预计收/付款时间");
        return;
      }
      if (form.feeList.length === 0) {
        ElMessage.warning("请至少添加一条费用明细");
        return;
      }

      if (form.settlementMethod === SETTLEMENT_METHOD_ENUM.BAD_DEBT && !form.badDebtReason?.trim()) {
        ElMessage.warning("标记坏账时必须填写坏账原因");
        return;
      }

      const attachmentIds: string[] = [];
      if (form.attachmentFiles?.length > 0) {
        for (const file of form.attachmentFiles) {
          if (typeof file === "string") {
            attachmentIds.push(file);
          } else if (file?.url) {
            attachmentIds.push(file.url);
          }
        }
      }

      submitting.value = true;
      try {
        const submitData = {
          ...form,
          attachmentIds,
          remark: form.settlementMethod === SETTLEMENT_METHOD_ENUM.BAD_DEBT ? `${form.remark || ""}${form.remark ? "\n" : ""}【坏账原因】${form.badDebtReason}` : form.remark
        };
        const res = await saveCheckout(submitData);
        form.id = res.data;
        await submitCheckout(form.id!);
        ElMessage.success("退租并结账提交成功");
        visible.value = false;
        emit("success");
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
    form.checkoutType = CHECKOUT_TYPE_ENUM.NORMAL;
    form.actualCheckoutDate = "";
    form.breachReason = "";
    form.addCleaningFee = false;
    form.cleaningFeeAmount = null;
    form.feeList = [];
    form.expectedPaymentDate = "";
    form.settlementMethod = SETTLEMENT_METHOD_ENUM.GENERATE_BILL;
    form.remark = "";
    form.attachmentIds = [];
    form.attachmentFiles = [];
    form.payeeName = "";
    form.payeePhone = "";
    form.payeeIdType = "ID_CARD";
    form.payeeIdNumber = "";
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

  function handleClose() {
    visible.value = false;
    resetForm();
  }

  defineExpose({ open });
</script>

<style lang="scss" scoped>
  /* ===== Dialog Shell ===== */
  .checkout-dialog {
    :deep(.el-dialog) {
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }
    :deep(.el-dialog__header) {
      padding: 0;
      margin: 0;
    }
    :deep(.el-dialog__body) {
      padding: 0;
    }
    :deep(.el-dialog__footer) {
      padding: 0;
      border-top: none;
    }
  }

  /* ===== Header ===== */
  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 7px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .header-code {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-left: 8px;
      background: var(--el-fill-color);
      padding: 1px 8px;
      border-radius: 4px;
    }

    .close-btn {
      border: none;
      background: transparent;
    }
  }

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

  /* ===== Scroll Container ===== */
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

  /* ===== Checkout Form ===== */
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

  .form-row {
    display: flex;
    gap: 24px;

    > .el-form-item {
      flex: 1;
      min-width: 0;
    }
  }

  /* ===== Transition ===== */
  .slide-fade-enter-active {
    transition: all 0.25s ease-out;
  }
  .slide-fade-leave-active {
    transition: all 0.15s ease-in;
  }
  .slide-fade-enter-from {
    opacity: 0;
    transform: translateY(-6px);
  }
  .slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }

  /* ===== Fee Section ===== */
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
    margin-bottom: 0;
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

  /* ===== 改动1: 添加费用按钮移至表格下方、右对齐 ===== */
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

  /* ===== 改动2: Summary Card — 上下两行布局 ===== */
  .summary-card {
    background: var(--el-fill-color-lighter);
    border-radius: 10px;
    padding: 16px;
  }

  /* 第一行：收支计算公式 */
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

  /* 第二行：付款时间 + 账单处理方式 */
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

  /* ===== Bad Debt Reason ===== */
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

  /* ===== Upload Area ===== */
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

  /* ================================================================
 * 改动3: 深色主题适配
 *
 * vue-pure-admin 暗色模式会在 <html> 加 class="dark"，
 * 同时 Element Plus 的 CSS 变量会自动切换（如 --el-bg-color、
 * --el-text-color-primary 等），所以上面使用 var(--el-xxx) 的部分
 * 已经自动适配。
 *
 * 下面仅针对「写死了具体色值」或「Element Plus 暗色变量对比度不够」
 * 的地方做补充覆盖，保持最小改动量。
 * ================================================================ */
  :global(html.dark) {
    .checkout-dialog {
      :deep(.el-dialog) {
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
      }
    }

    /* section-card hover 阴影适配暗色 */
    .section-card:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }

    /* 添加费用按钮在暗色下边框加强可见性 */
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

    /* 汇总卡片 result 项边框 */
    .summary-item.result {
      border-color: var(--el-border-color);
    }

    /* 第二行分割线 */
    .summary-row-2 {
      border-top-color: var(--el-border-color);
    }
  }
</style>
