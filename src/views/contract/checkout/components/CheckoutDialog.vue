<template>
  <el-dialog
    v-model="visible"
    :show-close="false"
    width="1000px"
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
          <div class="header-icon">
            <el-icon :size="24"><Tickets /></el-icon>
          </div>
          <div class="header-text">
            <h3>租客退租</h3>
            <p>办理退租手续，结算相关费用</p>
          </div>
        </div>
        <el-button class="close-btn" :icon="Close" circle size="small" @click="handleClose" />
      </div>
    </template>

    <div v-loading="loading" class="checkout-body">
      <!-- 租客信息横幅 -->
      <div class="tenant-banner">
        <div class="tenant-main">
          <el-avatar :size="48" class="tenant-avatar">
            {{ initData?.tenantName?.charAt(0) || "?" }}
          </el-avatar>
          <div class="tenant-info">
            <div class="tenant-name">{{ initData?.tenantName || "-" }}</div>
            <div class="tenant-meta">
              <span class="meta-item">
                <el-icon><Phone /></el-icon>
                {{ initData?.tenantPhone || "-" }}
              </span>
              <span v-if="initData?.roomInfo" class="meta-item">
                <el-icon><House /></el-icon>
                {{ initData.roomInfo }}
              </span>
            </div>
          </div>
        </div>
        <div class="tenant-stats">
          <div class="stat-item">
            <span class="stat-value">{{ formatDate(initData?.leaseStart) }}</span>
            <span class="stat-label">入住日期</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-value warning">{{ formatDate(initData?.leaseEnd) }}</span>
            <span class="stat-label">合同到期</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-value">¥{{ formatMoney(initData?.rentPrice) }}</span>
            <span class="stat-label">月租金</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-value primary">¥{{ formatMoney(initData?.depositAmount) }}</span>
            <span class="stat-label">押金</span>
          </div>
        </div>
      </div>

      <!-- 主内容区 - 左右布局（表单在左，费用在右） -->
      <div class="main-content">
        <!-- 左侧：退租信息 + 备注 -->
        <div class="left-panel">
          <div class="panel-section">
            <div class="section-header">
              <el-icon class="section-icon"><Document /></el-icon>
              <span>退租信息</span>
            </div>
            <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" :disabled="!canEdit" class="checkout-form">
              <el-form-item label="退租类型" prop="checkoutType">
                <el-select v-model="form.checkoutType" placeholder="请选择退租类型" class="w-full">
                  <el-option v-for="item in CHECKOUT_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="实际退租日" prop="actualCheckoutDate">
                <el-date-picker v-model="form.actualCheckoutDate" type="date" placeholder="请选择日期" value-format="YYYY-MM-DD" class="w-full" :shortcuts="dateShortcuts" />
              </el-form-item>
              <el-form-item label="退租原因">
                <el-input v-model="form.checkoutReason" placeholder="请输入退租原因（选填）" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息（选填）" maxlength="500" show-word-limit />
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 右侧：费用结算 -->
        <div class="right-panel">
          <div class="panel-section">
            <div class="section-header">
              <div class="flex items-center gap-2">
                <el-icon class="section-icon"><Money /></el-icon>
                <span>费用结算</span>
              </div>
              <el-dropdown v-if="canEdit" trigger="click" @command="handleQuickAdd">
                <el-button type="primary" size="small">
                  <el-icon class="mr-1"><Plus /></el-icon>
                  添加费用
                  <el-icon class="ml-1"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :icon="Minus" command="deduction">添加扣款项</el-dropdown-item>
                    <el-dropdown-item :icon="Plus" command="refund">添加退款项</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <!-- 费用列表 -->
            <div class="fee-container">
              <!-- 扣款区域 -->
              <div class="fee-group">
                <div class="fee-group-header deduction">
                  <span class="group-title">
                    <el-icon><Minus /></el-icon>
                    扣款项目
                  </span>
                  <span class="group-total">¥{{ formatMoney(deductionTotal) }}</span>
                </div>
                <div class="fee-group-body">
                  <TransitionGroup name="fee-item">
                    <div v-for="(fee, index) in deductionFees" :key="'d-' + fee.feeName + index" class="fee-row">
                      <div class="fee-info">
                        <span class="fee-name">
                          {{ fee.feeName }}
                          <span v-if="fee.remark" class="fee-remark">{{ fee.remark }}</span>
                        </span>
                      </div>
                      <div class="fee-actions">
                        <span class="fee-amount deduction">-¥{{ formatMoney(fee.feeAmount) }}</span>
                        <el-button v-if="canEdit && !fee.billId" type="danger" link size="small" class="delete-btn" @click="handleRemoveFee(index, 'deduction')">
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </TransitionGroup>
                  <div v-if="deductionFees.length === 0" class="fee-empty">
                    <span>暂无扣款项目</span>
                  </div>
                </div>
              </div>

              <!-- 退款区域 -->
              <div class="fee-group">
                <div class="fee-group-header refund">
                  <span class="group-title">
                    <el-icon><Plus /></el-icon>
                    退款项目
                  </span>
                  <span class="group-total">¥{{ formatMoney(refundTotal) }}</span>
                </div>
                <div class="fee-group-body">
                  <TransitionGroup name="fee-item">
                    <div v-for="(fee, index) in refundFees" :key="'r-' + fee.feeName + index" class="fee-row">
                      <div class="fee-info">
                        <span class="fee-name">
                          {{ fee.feeName }}
                          <span v-if="fee.remark" class="fee-remark">{{ fee.remark }}</span>
                        </span>
                      </div>
                      <div class="fee-actions">
                        <span class="fee-amount refund">+¥{{ formatMoney(fee.feeAmount) }}</span>
                        <el-button
                          v-if="canEdit && fee.feeType !== CHECKOUT_FEE_TYPE_ENUM.DEPOSIT_REFUND"
                          type="danger"
                          link
                          size="small"
                          class="delete-btn"
                          @click="handleRemoveFee(index, 'refund')"
                        >
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </TransitionGroup>
                  <div v-if="refundFees.length === 0" class="fee-empty">
                    <span>暂无退款项目</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 结算汇总 -->
            <div class="settlement-card" :class="finalAmount >= 0 ? 'payable' : 'refundable'">
              <div class="settlement-label">{{ finalAmount >= 0 ? "租客应补缴" : "应退还租客" }}</div>
              <div class="settlement-amount">
                <span class="currency">¥</span>
                <span class="number">{{ formatMoney(Math.abs(finalAmount)) }}</span>
              </div>
              <div class="settlement-formula">
                <span>扣款 {{ formatMoney(deductionTotal) }}</span>
                <span class="operator">-</span>
                <span>退款 {{ formatMoney(refundTotal) }}</span>
                <span class="operator">=</span>
                <span class="result">{{ finalAmount >= 0 ? "+" : "-" }}{{ formatMoney(Math.abs(finalAmount)) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <el-button @click="handleClose">取 消</el-button>
      <el-button v-if="canSubmit" type="primary" :loading="submitting" @click="handleSubmit">
        <el-icon class="mr-1"><Promotion /></el-icon>
        提交
      </el-button>
    </template>

    <!-- 添加费用弹窗 -->
    <el-dialog v-model="quickAddVisible" :title="quickAddTitle" width="420px" append-to-body :close-on-click-modal="false">
      <div class="quick-add-content">
        <!-- 快捷选项 -->
        <div v-if="!showCustomForm" class="quick-options">
          <div v-for="option in quickAddOptions" :key="option.type" class="quick-option-item" @click="selectQuickOption(option)">
            <el-icon :size="20"><component :is="option.icon" /></el-icon>
            <span>{{ option.label }}</span>
          </div>
          <div class="quick-option-item custom" @click="showCustomForm = true">
            <el-icon :size="20"><Edit /></el-icon>
            <span>自定义</span>
          </div>
        </div>

        <!-- 自定义表单 -->
        <el-form v-else ref="quickFormRef" :model="quickForm" :rules="quickFormRules" label-position="top">
          <el-form-item label="费用名称" prop="feeName">
            <el-input v-model="quickForm.feeName" placeholder="请输入费用名称" />
          </el-form-item>
          <el-form-item label="金额" prop="feeAmount">
            <el-input v-model.number="quickForm.feeAmount" placeholder="请输入金额" type="number">
              <template #prefix>¥</template>
            </el-input>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="quickForm.remark" placeholder="备注（选填）" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button v-if="showCustomForm" @click="showCustomForm = false">返回</el-button>
        <el-button @click="quickAddVisible = false">取消</el-button>
        <el-button v-if="showCustomForm" type="primary" @click="confirmQuickAdd">确认添加</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from "vue";
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
  import {
    ArrowDown,
    Brush,
    Close,
    Coin,
    Delete,
    Document,
    Edit,
    House,
    Minus,
    Money,
    More,
    Phone,
    Plus,
    Promotion,
    Refresh,
    Tickets,
    Tools
  } from "@element-plus/icons-vue";
  import {
    APPROVAL_STATUS_ENUM,
    CHECKOUT_FEE_TYPE_ENUM,
    CHECKOUT_STATUS_ENUM,
    CHECKOUT_TYPE_OPTIONS,
    type CheckoutDetailProps,
    type CheckoutFeeProps,
    type CheckoutFormProps,
    CheckoutInitDataProps,
    FEE_DIRECTION_ENUM
  } from "@/types";
  import { getCheckoutByTenantId, getCheckoutInitData, saveCheckout, submitCheckout } from "@/api/contract/checkout";

  /** 账单类型映射 */
  const BILL_TYPE_MAP: Record<number, string> = {
    1: "租金",
    2: "押金",
    3: "优惠减免",
    4: "水费",
    5: "电费",
    6: "燃气费",
    7: "物业费",
    8: "其他费用"
  };

  interface UnpaidBill {
    billId: string;
    billCode: string | null;
    billType: number;
    billPeriod: string;
    totalAmount: number;
    payAmount: number;
    unpaidAmount: number;
  }

  interface QuickOption {
    type: number;
    label: string;
    icon: any;
  }

  const emit = defineEmits<{ (e: "success"): void }>();

  const visible = ref(false);
  const loading = ref(false);
  const submitting = ref(false);
  const formRef = ref<FormInstance>();
  const quickFormRef = ref<FormInstance>();

  const initData = ref<CheckoutInitDataProps | null>(null);
  const checkoutDetail = ref<CheckoutDetailProps | null>(null);

  // 表单数据
  const form = reactive<CheckoutFormProps>({
    id: undefined,
    tenantId: "",
    checkoutType: null,
    checkoutReason: "",
    actualCheckoutDate: "",
    depositAmount: 0,
    feeList: [],
    remark: ""
  });

  const formRules = reactive<FormRules>({
    checkoutType: [{ required: true, message: "请选择退租类型", trigger: "change" }],
    actualCheckoutDate: [{ required: true, message: "请选择实际退租日", trigger: "change" }]
  });

  // 日期快捷选项
  const dateShortcuts = [
    { text: "今天", value: new Date() },
    {
      text: "明天",
      value: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
      }
    },
    {
      text: "本月底",
      value: () => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1, 0);
        return d;
      }
    }
  ];

  // 快捷添加相关
  const quickAddVisible = ref(false);
  const quickAddDirection = ref<"deduction" | "refund">("deduction");
  const showCustomForm = ref(false);
  const quickForm = reactive({ feeName: "", feeAmount: null as number | null, remark: "" });
  const quickFormRules = reactive<FormRules>({
    feeName: [{ required: true, message: "请输入费用名称", trigger: "blur" }],
    feeAmount: [
      { required: true, message: "请输入金额", trigger: "blur" },
      { type: "number", min: 0.01, message: "金额必须大于0", trigger: "blur" }
    ]
  });

  const quickAddTitle = computed(() => (quickAddDirection.value === "deduction" ? "添加扣款项目" : "添加退款项目"));

  const deductionQuickOptions: QuickOption[] = [
    { type: CHECKOUT_FEE_TYPE_ENUM.UTILITY, label: "水电费", icon: Coin },
    { type: CHECKOUT_FEE_TYPE_ENUM.CLEANING, label: "清洁费", icon: Brush },
    { type: CHECKOUT_FEE_TYPE_ENUM.DAMAGE, label: "物品损坏", icon: Tools },
    { type: CHECKOUT_FEE_TYPE_ENUM.OTHER_DEDUCTION, label: "其他扣款", icon: More }
  ];

  const refundQuickOptions: QuickOption[] = [
    { type: CHECKOUT_FEE_TYPE_ENUM.RENT_REFUND, label: "租金退还", icon: Refresh },
    { type: CHECKOUT_FEE_TYPE_ENUM.OTHER_REFUND, label: "其他退款", icon: More }
  ];

  const quickAddOptions = computed(() => (quickAddDirection.value === "deduction" ? deductionQuickOptions : refundQuickOptions));

  // 计算属性
  const deductionFees = computed(() => form.feeList.filter(f => f.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION));
  const refundFees = computed(() => form.feeList.filter(f => f.feeDirection === FEE_DIRECTION_ENUM.REFUND));
  const deductionTotal = computed(() => deductionFees.value.reduce((sum, f) => sum + (f.feeAmount || 0), 0));
  const refundTotal = computed(() => refundFees.value.reduce((sum, f) => sum + (f.feeAmount || 0), 0));
  const finalAmount = computed(() => deductionTotal.value - refundTotal.value);

  const canEdit = computed(() => {
    if (!checkoutDetail.value) return true;
    return checkoutDetail.value.status === CHECKOUT_STATUS_ENUM.DRAFT || checkoutDetail.value.approvalStatus === APPROVAL_STATUS_ENUM.REJECTED;
  });
  const canSubmit = computed(() => canEdit.value && form.checkoutType !== null);

  // 工具函数
  function formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "-";
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    } catch {
      return "-";
    }
  }

  function formatMoney(amount: number | undefined | null): string {
    if (amount === undefined || amount === null) return "0.00";
    return Math.abs(amount).toFixed(2);
  }

  function formatBillPeriod(period: string): string {
    if (!period) return "";
    const parts = period.split(" ~ ");
    if (parts.length !== 2) return period;
    const formatPart = (part: string): string => {
      try {
        const date = new Date(part);
        if (isNaN(date.getTime())) return part;
        return `${date.getMonth() + 1}/${date.getDate()}`;
      } catch {
        return part;
      }
    };
    return `${formatPart(parts[0])} ~ ${formatPart(parts[1])}`;
  }

  // 快捷添加
  function handleQuickAdd(command: string) {
    quickAddDirection.value = command as "deduction" | "refund";
    showCustomForm.value = false;
    quickForm.feeName = "";
    quickForm.feeAmount = null;
    quickForm.remark = "";
    quickAddVisible.value = true;
  }

  function selectQuickOption(option: QuickOption) {
    quickForm.feeName = option.label;
    showCustomForm.value = true;
  }

  async function confirmQuickAdd() {
    if (!quickFormRef.value) return;
    await quickFormRef.value.validate(valid => {
      if (valid) {
        addFee({
          feeType: CHECKOUT_FEE_TYPE_ENUM.OTHER_DEDUCTION,
          feeName: quickForm.feeName,
          feeAmount: quickForm.feeAmount || 0,
          feeDirection: quickAddDirection.value === "deduction" ? FEE_DIRECTION_ENUM.DEDUCTION : FEE_DIRECTION_ENUM.REFUND,
          remark: quickForm.remark
        });
        quickAddVisible.value = false;
        ElMessage.success("添加成功");
      }
    });
  }

  // 费用管理
  function addFee(fee: Partial<CheckoutFeeProps>) {
    form.feeList.push({
      feeType: fee.feeType || 0,
      feeName: fee.feeName || "",
      feeAmount: fee.feeAmount || 0,
      feeDirection: fee.feeDirection || FEE_DIRECTION_ENUM.DEDUCTION,
      billId: fee.billId,
      remark: fee.remark
    });
  }

  function handleRemoveFee(index: number, type: "deduction" | "refund") {
    const fees = type === "deduction" ? deductionFees.value : refundFees.value;
    const fee = fees[index];
    const realIndex = form.feeList.findIndex(f => f.feeType === fee.feeType && f.feeName === fee.feeName && f.feeAmount === fee.feeAmount && f.feeDirection === fee.feeDirection);
    if (realIndex > -1) form.feeList.splice(realIndex, 1);
  }

  // 打开对话框
  async function open(tenantId: string | number) {
    visible.value = true;
    loading.value = true;
    resetForm();

    try {
      const existRes = await getCheckoutByTenantId(String(tenantId));
      if (existRes.data?.id) {
        await loadCheckoutDetail(existRes.data);
      } else {
        await loadInitData(String(tenantId));
      }
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.code === 404 || !error?.data?.id) {
        try {
          await loadInitData(String(tenantId));
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

  async function loadInitData(tenantId: string) {
    const res = await getCheckoutInitData(tenantId);
    initData.value = res.data;
    form.tenantId = tenantId;
    form.depositAmount = res.data.depositAmount;
    form.actualCheckoutDate = new Date().toISOString().split("T")[0];

    addFee({ feeType: CHECKOUT_FEE_TYPE_ENUM.DEPOSIT_REFUND, feeName: "押金退还", feeAmount: res.data.depositAmount, feeDirection: FEE_DIRECTION_ENUM.REFUND });

    if (res.data.unpaidBills?.length > 0) {
      res.data.unpaidBills.forEach(bill => {
        const billTypeName = BILL_TYPE_MAP[bill.feeType] || "其他费用";
        const periodStr = formatBillPeriod(bill.billPeriod);
        if (bill.unpaidAmount > 0) {
          addFee({
            feeType: bill.feeType === 1 ? CHECKOUT_FEE_TYPE_ENUM.UNPAID_RENT : CHECKOUT_FEE_TYPE_ENUM.UNPAID_FEE,
            feeName: billTypeName,
            feeAmount: bill.unpaidAmount,
            feeDirection: FEE_DIRECTION_ENUM.DEDUCTION,
            billId: bill.billId,
            remark: periodStr ? `账期: ${periodStr}` : undefined
          });
        } else if (bill.unpaidAmount < 0) {
          addFee({
            feeType: CHECKOUT_FEE_TYPE_ENUM.RENT_REFUND,
            feeName: billTypeName,
            feeAmount: Math.abs(bill.unpaidAmount),
            feeDirection: FEE_DIRECTION_ENUM.REFUND,
            billId: bill.billId,
            remark: periodStr ? `账期: ${periodStr}` : undefined
          });
        }
      });
    }
  }

  async function loadCheckoutDetail(detail: CheckoutDetailProps) {
    checkoutDetail.value = detail;
    form.id = detail.id;
    form.tenantId = detail.tenantId;
    form.checkoutType = detail.checkoutType;
    form.checkoutReason = detail.checkoutReason;
    form.actualCheckoutDate = detail.actualCheckoutDate;
    form.depositAmount = detail.depositAmount;
    form.remark = detail.remark;
    form.feeList = detail.feeList.map(f => ({ ...f }));

    initData.value = {
      tenantId: detail.tenantId,
      tenantName: detail.tenantName,
      tenantPhone: detail.tenantPhone,
      roomInfo: detail.roomInfo,
      leaseStart: "",
      leaseEnd: detail.leaseEnd,
      rentPrice: 0,
      depositAmount: detail.depositAmount,
      unpaidBills: [],
      unpaidAmount: 0
    };
  }

  async function handleSave() {
    if (!formRef.value) return;
    formRef.value.validate(async valid => {
      if (!valid) return;
      submitting.value = true;
      try {
        const res = await saveCheckout(form);
        form.id = res.data;
        ElMessage.success("保存成功");
      } catch (error) {
        console.error("保存失败", error);
        ElMessage.error("保存失败");
      } finally {
        submitting.value = false;
      }
    });
  }

  async function handleSubmit() {
    if (!formRef.value) return;
    formRef.value.validate(async valid => {
      if (!valid) return;
      submitting.value = true;
      try {
        const res = await saveCheckout(form);
        form.id = res.data;
      } catch (error) {
        console.error("保存失败", error);
        ElMessage.error("保存失败");
        submitting.value = false;
        return;
      }

      ElMessageBox.confirm("确定提交退租审批吗？提交后将进入审批流程。", "提交确认", {
        confirmButtonText: "确定提交",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(async () => {
          try {
            await submitCheckout(form.id!);
            ElMessage.success("提交成功");
            visible.value = false;
            emit("success");
          } catch (error) {
            console.error("提交失败", error);
            ElMessage.error("提交失败");
          } finally {
            submitting.value = false;
          }
        })
        .catch(() => {
          submitting.value = false;
        });
    });
  }

  function resetForm() {
    form.id = undefined;
    form.tenantId = "";
    form.checkoutType = null;
    form.checkoutReason = "";
    form.actualCheckoutDate = "";
    form.depositAmount = 0;
    form.feeList = [];
    form.remark = "";
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
  .checkout-dialog {
    :deep(.el-dialog__header) {
      padding: 0;
      margin: 0;
    }
    :deep(.el-dialog__body) {
      padding: 0;
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-fill-color-light) 100%);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-8);
      border-radius: 10px;
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      p {
        margin: 2px 0 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .close-btn {
      border: none;
      background: transparent;
    }
  }

  .checkout-body {
    height: calc(85vh - 140px);
    overflow-y: auto;
  }

  // 租客横幅
  .tenant-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .tenant-main {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tenant-avatar {
      background: var(--el-color-primary);
      font-weight: 600;
    }

    .tenant-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .tenant-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 6px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: var(--el-text-color-secondary);

        .el-icon {
          font-size: 14px;
        }
      }
    }

    .tenant-stats {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      &.warning {
        color: var(--el-color-warning);
      }
      &.primary {
        color: var(--el-color-primary);
      }
    }

    .stat-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 2px;
    }

    .stat-divider {
      width: 1px;
      height: 32px;
      background: var(--el-border-color);
    }
  }

  // 主内容区
  .main-content {
    display: grid;
    grid-template-columns: 320px 1fr;
  }

  .left-panel {
    padding: 20px;
    background: var(--el-fill-color-blank);
    border-right: 1px solid var(--el-border-color-lighter);
  }

  .right-panel {
    padding: 20px;
    background: var(--el-bg-color);
  }

  .panel-section {
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .section-icon {
        margin-right: 6px;
        color: var(--el-color-primary);
      }
    }
  }

  .checkout-form {
    :deep(.el-form-item) {
      margin-bottom: 18px;
    }
    :deep(.el-form-item__label) {
      font-weight: 500;
    }
  }

  // 费用区域
  .fee-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 16px;
  }

  .fee-group {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    overflow: hidden;
  }

  .fee-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    font-weight: 600;
    font-size: 13px;

    &.deduction {
      background: var(--el-color-danger-light-9);
      color: var(--el-color-danger);
    }

    &.refund {
      background: var(--el-color-success-light-9);
      color: var(--el-color-success);
    }

    .group-title {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .group-total {
      font-size: 15px;
    }
  }

  .fee-group-body {
    padding: 8px;
    background: var(--el-fill-color-blank);
  }

  .fee-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 6px;
    transition: background-color 0.2s;

    &:hover {
      background: var(--el-fill-color-light);

      .delete-btn {
        opacity: 1;
      }
    }
  }

  .fee-info {
    flex: 1;
    min-width: 0;

    .fee-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .fee-remark {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-left: 8px;
    }
  }

  .fee-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .fee-amount {
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;

    &.deduction {
      color: var(--el-color-danger);
    }
    &.refund {
      color: var(--el-color-success);
    }
  }

  .delete-btn {
    opacity: 0;
    transition: opacity 0.2s;
  }

  .fee-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: var(--el-text-color-placeholder);
    font-size: 13px;
  }

  // 结算卡片
  .settlement-card {
    padding: 20px;
    border-radius: 10px;
    text-align: center;

    &.payable {
      background: linear-gradient(135deg, var(--el-color-danger-light-9) 0%, var(--el-color-danger-light-8) 100%);
      .settlement-amount {
        color: var(--el-color-danger);
      }
      .result {
        color: var(--el-color-danger);
      }
    }

    &.refundable {
      background: linear-gradient(135deg, var(--el-color-success-light-9) 0%, var(--el-color-success-light-8) 100%);
      .settlement-amount {
        color: var(--el-color-success);
      }
      .result {
        color: var(--el-color-success);
      }
    }

    .settlement-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin-bottom: 8px;
    }

    .settlement-amount {
      font-weight: 700;
      margin-bottom: 12px;

      .currency {
        font-size: 20px;
        vertical-align: top;
      }

      .number {
        font-size: 36px;
        line-height: 1;
      }
    }

    .settlement-formula {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);

      .operator {
        color: var(--el-text-color-placeholder);
      }
      .result {
        font-weight: 600;
      }
    }
  }

  // 快捷添加
  .quick-add-content {
    .quick-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .quick-option-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 20px 12px;
      border: 1px solid var(--el-border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;

      &:hover {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }

      &.custom {
        border-style: dashed;
      }
    }
  }

  // 动画
  .fee-item-enter-active,
  .fee-item-leave-active {
    transition: all 0.3s ease;
  }

  .fee-item-enter-from,
  .fee-item-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }
</style>
