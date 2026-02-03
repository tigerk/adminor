import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 退租单表单验证规则 */
export const checkoutFormRules = reactive<FormRules>({
  checkoutType: [{ required: true, message: "请选择退租类型", trigger: "change" }],
  actualCheckoutDate: [{ required: true, message: "请选择实际退租日", trigger: "change" }],
  depositAmount: [{ required: true, message: "请输入押金金额", trigger: "blur" }]
});

/** 费用明细验证规则 */
export const feeFormRules = reactive<FormRules>({
  feeType: [{ required: true, message: "请选择费用类型", trigger: "change" }],
  feeAmount: [{ required: true, message: "请输入费用金额", trigger: "blur" }]
});
