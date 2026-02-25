import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { APPROVAL_STATUS_ENUM, CHECKOUT_FEE_TYPE_ENUM, CHECKOUT_STATUS_ENUM, FEE_DIRECTION_ENUM } from "@/constants";
import type { LeaseCheckoutVo, CheckoutFeeProps, LeaseCheckoutDto, LeaseCheckoutInitVo } from "@/types";
import { getCheckoutDetail, getCheckoutInitData, saveCheckout, submitCheckout } from "@/api/contract/checkout";

export function useCheckout() {
  const route = useRoute();
  const router = useRouter();

  const loading = ref(false);
  const submitting = ref(false);

  // 租客ID
  const tenantId = computed(() => String(route.query.tenantId) || "");
  // 租约ID
  const leaseId = computed(() => String(route.query.leaseId) || "");
  // 退租单ID（编辑时）
  const checkoutId = computed(() => String(route.query.id) || "");
  // 是否编辑模式
  const isEdit = computed(() => !!checkoutId.value);

  // 初始化数据
  const initData = ref<LeaseCheckoutInitVo | null>(null);

  // 退租单详情（编辑时）
  const checkoutDetail = ref<LeaseCheckoutVo | null>(null);

  // 表单数据
  const form = reactive<LeaseCheckoutDto>({
    id: undefined,
    tenantId: "",
    leaseId: "",
    checkoutType: null,
    checkoutReason: "",
    actualCheckoutDate: "",
    depositAmount: 0,
    feeList: [],
    remark: ""
  });

  // 计算扣款总额
  const deductionTotal = computed(() => {
    return form.feeList.filter(f => f.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION).reduce((sum, f) => sum + (f.feeAmount || 0), 0);
  });

  // 计算退款总额
  const refundTotal = computed(() => {
    return form.feeList.filter(f => f.feeDirection === FEE_DIRECTION_ENUM.REFUND).reduce((sum, f) => sum + (f.feeAmount || 0), 0);
  });

  // 计算最终结算（正数=租客补缴，负数=退还租客）
  const finalAmount = computed(() => {
    return deductionTotal.value - refundTotal.value;
  });

  function syncDepositRefundFee(amount: number) {
    const targetIndex = form.feeList.findIndex(f => f.feeType === CHECKOUT_FEE_TYPE_ENUM.DEPOSIT_REFUND);
    if (targetIndex > -1) {
      form.feeList[targetIndex].feeAmount = amount;
      return;
    }

    addFee({
      feeType: CHECKOUT_FEE_TYPE_ENUM.DEPOSIT_REFUND,
      feeName: "押金退还",
      feeAmount: amount,
      feeDirection: FEE_DIRECTION_ENUM.REFUND
    });
  }

  // 是否可以编辑
  const canEdit = computed(() => {
    if (!checkoutDetail.value) return true;
    return checkoutDetail.value.status === CHECKOUT_STATUS_ENUM.DRAFT || checkoutDetail.value.approvalStatus === APPROVAL_STATUS_ENUM.REJECTED;
  });

  // 是否可以提交
  const canSubmit = computed(() => {
    return canEdit.value && form.checkoutType !== null;
  });

  /** 加载初始化数据 */
  async function loadInitData() {
    if (!tenantId.value) {
      ElMessage.error("租客ID不能为空");
      return;
    }

    loading.value = true;
    try {
      const res = await getCheckoutInitData(tenantId.value, leaseId.value || undefined);
      initData.value = res.data;

      // 设置表单默认值
      form.tenantId = tenantId.value;
      form.leaseId = res.data.leaseId || leaseId.value;
      form.depositAmount = res.data.depositAmount;
      form.actualCheckoutDate = new Date().toISOString().split("T")[0];

      // 自动添加押金退还
      syncDepositRefundFee(res.data.depositAmount);

      // 自动添加未付账单作为扣款
      if (res.data.unpaidBills && res.data.unpaidBills.length > 0) {
        res.data.unpaidBills.forEach(bill => {
          addFee({
            feeType: CHECKOUT_FEE_TYPE_ENUM.RENT,
            feeName: `${bill.billTypeName} (${bill.billPeriod})`,
            feeAmount: bill.unpaidAmount,
            feeDirection: FEE_DIRECTION_ENUM.DEDUCTION,
            billId: bill.billId
          });
        });
      }
    } catch (error) {
      console.error("加载初始化数据失败", error);
      ElMessage.error("加载数据失败");
    } finally {
      loading.value = false;
    }
  }

  /** 加载退租单详情（编辑时） */
  async function loadCheckoutDetail() {
    if (!checkoutId.value) return;

    loading.value = true;
    try {
      const res = await getCheckoutDetail(checkoutId.value);
      checkoutDetail.value = res.data;

      // 填充表单
      form.id = res.data.id;
      form.tenantId = res.data.tenantId;
      form.leaseId = res.data.leaseId || "";
      form.checkoutType = res.data.checkoutType;
      form.checkoutReason = res.data.checkoutReason;
      form.actualCheckoutDate = res.data.actualCheckoutDate;
      form.depositAmount = res.data.depositAmount;
      form.remark = res.data.remark;

      // 填充费用列表
      form.feeList = res.data.feeList.map(f => ({
        id: f.id,
        feeType: f.feeType,
        feeName: f.feeName,
        feeAmount: f.feeAmount,
        feeDirection: f.feeDirection,
        billId: f.billId,
        remark: f.remark
      }));

      // 设置初始化数据
      initData.value = {
        tenantId: res.data.tenantId,
        leaseId: res.data.leaseId,
        tenantName: res.data.tenantName,
        tenantPhone: res.data.tenantPhone,
        roomAddress: res.data.roomAddress || "",
        roomInfo: res.data.roomInfo,
        leaseStart: res.data.leaseStart || "",
        leaseEnd: res.data.leaseEnd,
        rentPrice: res.data.rentPrice || 0,
        depositAmount: res.data.depositAmount || 0,
        depositMonths: 0,
        unpaidBills: [],
        unpaidAmount: 0,
        presetFees: [],
        payeeInfo: {
          payeeName: res.data.tenantName,
          payeePhone: res.data.tenantPhone
        }
      };
    } catch (error) {
      console.error("加载退租单详情失败", error);
      ElMessage.error("加载数据失败");
    } finally {
      loading.value = false;
    }
  }

  /** 添加费用 */
  function addFee(fee?: Partial<CheckoutFeeProps>) {
    form.feeList.push({
      feeType: fee?.feeType || 0,
      feeName: fee?.feeName || "",
      feeAmount: fee?.feeAmount || 0,
      feeDirection: fee?.feeDirection || FEE_DIRECTION_ENUM.DEDUCTION,
      billId: fee?.billId,
      remark: fee?.remark
    });
  }

  /** 删除费用 */
  function removeFee(index: number) {
    form.feeList.splice(index, 1);
  }

  /** 保存退租单 */
  async function handleSave() {
    submitting.value = true;
    try {
      const res = await saveCheckout(form);
      form.id = res.data;
      ElMessage.success("保存成功");
      return res.data;
    } catch (error) {
      console.error("保存失败", error);
      ElMessage.error("保存失败");
      return null;
    } finally {
      submitting.value = false;
    }
  }

  /** 提交审批 */
  async function handleSubmit() {
    // 先保存
    const savedId = await handleSave();
    if (!savedId) return;

    ElMessageBox.confirm("确定提交退租审批吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        submitting.value = true;
        try {
          await submitCheckout(savedId);
          ElMessage.success("提交成功");
          // 返回列表
          router.push("/tenant/list");
        } catch (error) {
          console.error("提交失败", error);
          ElMessage.error("提交失败");
        } finally {
          submitting.value = false;
        }
      })
      .catch(() => {});
  }

  /** 返回 */
  function handleBack() {
    router.back();
  }

  /** 初始化 */
  onMounted(() => {
    if (isEdit.value) {
      loadCheckoutDetail();
    } else {
      loadInitData();
    }
  });

  watch(
    () => form.depositAmount,
    value => {
      if (!initData.value) return;
      if (typeof value !== "number") return;
      initData.value.depositAmount = value;
      syncDepositRefundFee(value);
    }
  );

  return {
    loading,
    submitting,
    tenantId,
    checkoutId,
    isEdit,
    initData,
    checkoutDetail,
    form,
    deductionTotal,
    refundTotal,
    finalAmount,
    canEdit,
    canSubmit,
    addFee,
    removeFee,
    handleSave,
    handleSubmit,
    handleBack
  };
}
