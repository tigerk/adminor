import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { APPROVAL_STATUS_META, CHECKOUT_FEE_TYPE_CODE_MAP, CHECKOUT_STATUS_META, FEE_DIRECTION_ENUM } from "@/constants";
import type { LeaseCheckoutVo, LeaseCheckoutDto, LeaseCheckoutInitVo } from "@/types";
import type { CheckoutFeeFormItem, CheckoutPageFormData } from "@/types/models/checkout";
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
  const form = reactive<CheckoutPageFormData>({
    id: undefined,
    tenantId: "",
    leaseId: "",
    checkoutType: null,
    breachReason: "",
    actualCheckoutDate: "",
    settlementMethod: 0,
    depositAmount: 0,
    feeList: [],
    remark: ""
  });

  // 计算扣款总额（收入方向）
  const deductionTotal = computed(() => {
    return form.feeList.filter(f => f.feeDirection === FEE_DIRECTION_ENUM.DEDUCTION).reduce((sum, f) => sum + (f.feeAmount ?? 0), 0);
  });

  // 计算退款总额（支出方向）
  const refundTotal = computed(() => {
    return form.feeList.filter(f => f.feeDirection === FEE_DIRECTION_ENUM.REFUND).reduce((sum, f) => sum + (f.feeAmount ?? 0), 0);
  });

  // 计算最终结算（正数=租客补缴，负数=退还租客）
  const finalAmount = computed(() => {
    return deductionTotal.value - refundTotal.value;
  });

  function syncDepositRefundFee(amount: number) {
    const targetIndex = form.feeList.findIndex(f => f.feeType === CHECKOUT_FEE_TYPE_CODE_MAP.DEPOSIT_REFUND);
    if (targetIndex > -1) {
      form.feeList[targetIndex].feeAmount = amount;
      return;
    }

    addFee({
      feeType: CHECKOUT_FEE_TYPE_CODE_MAP.DEPOSIT_REFUND,
      feeName: "押金退还",
      feeAmount: amount,
      feeDirection: FEE_DIRECTION_ENUM.REFUND
    });
  }

  // 是否可以编辑
  const canEdit = computed(() => {
    if (!checkoutDetail.value) return true;
    return checkoutDetail.value.status === CHECKOUT_STATUS_META.DRAFT.code || checkoutDetail.value.approvalStatus === APPROVAL_STATUS_META.REJECTED.code;
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
      const res = await getCheckoutInitData(leaseId.value || undefined);
      initData.value = res.data;

      form.tenantId = tenantId.value;
      form.leaseId = res.data.leaseId ?? leaseId.value;
      form.depositAmount = res.data.depositAmount ?? 0;
      form.actualCheckoutDate = new Date().toISOString().split("T")[0];

      syncDepositRefundFee(res.data.depositAmount ?? 0);

      if (res.data.unpaidBills && res.data.unpaidBills.length > 0) {
        res.data.unpaidBills.forEach(bill => {
          addFee({
            feeType: CHECKOUT_FEE_TYPE_CODE_MAP.RENT,
            feeName: `${bill.billTypeName ?? ""} (${bill.billPeriod ?? ""})`,
            feeAmount: bill.unpaidAmount ?? 0,
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

      form.id = res.data.id;
      form.tenantId = res.data.tenantId ?? "";
      form.leaseId = res.data.leaseId ?? "";
      form.checkoutType = res.data.checkoutType ?? null;
      form.breachReason = res.data.breachReason ?? "";
      form.actualCheckoutDate = res.data.actualCheckoutDate ?? "";
      form.depositAmount = res.data.depositAmount ?? 0;
      form.remark = res.data.remark ?? "";

      form.feeList = (res.data.feeList ?? []).map<CheckoutFeeFormItem>(f => ({
        id: f.id,
        feeType: f.feeType ?? null,
        feeSubName: f.feeSubName,
        feeAmount: f.feeAmount ?? null,
        feeDirection: f.feeDirection ?? FEE_DIRECTION_ENUM.DEDUCTION,
        feeStartDate: f.feeStartDate,
        feeEndDate: f.feeEndDate,
        billId: f.billId,
        remark: f.remark,
        feeTypeCascade: null
      }));

      initData.value = {
        tenantId: res.data.tenantId,
        leaseId: res.data.leaseId,
        tenantName: res.data.tenantName,
        tenantPhone: res.data.tenantPhone,
        roomAddress: res.data.roomAddress ?? "",
        leaseStart: res.data.leaseStart ?? "",
        leaseEnd: res.data.leaseEnd,
        rentPrice: res.data.rentPrice ?? 0,
        depositAmount: res.data.depositAmount ?? 0,
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

  /** 添加费用行 */
  function addFee(fee?: Partial<CheckoutFeeFormItem>) {
    form.feeList.push({
      feeType: fee?.feeType ?? null,
      feeName: fee?.feeName ?? "",
      feeAmount: fee?.feeAmount ?? null,
      feeDirection: fee?.feeDirection ?? FEE_DIRECTION_ENUM.DEDUCTION,
      billId: fee?.billId,
      remark: fee?.remark,
      feeTypeCascade: fee?.feeTypeCascade ?? null
    });
  }

  /** 删除费用行 */
  function removeFee(index: number) {
    form.feeList.splice(index, 1);
  }

  /** 构建提交用的 DTO */
  function buildSubmitDto(): LeaseCheckoutDto {
    return {
      ...form,
      checkoutType: form.checkoutType as number,
      feeList: form.feeList.map(f => ({
        id: f.id,
        feeType: Number(f.feeType),
        feeSubName: f.feeSubName,
        feeAmount: f.feeAmount ?? 0,
        feeDirection: f.feeDirection,
        feeStartDate: f.feeStartDate,
        feeEndDate: f.feeEndDate,
        billId: f.billId,
        remark: f.remark
      }))
    };
  }

  /** 保存退租单 */
  async function handleSave() {
    submitting.value = true;
    try {
      const res = await saveCheckout(buildSubmitDto());
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

  /** 提交审批（页面模式专用） */
  async function handleSubmit() {
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

  /** 初始化（页面模式） */
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
