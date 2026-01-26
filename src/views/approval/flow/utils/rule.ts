import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 表单校验规则 */
export const formRules = reactive(<FormRules>{
  flowName: [{ required: true, message: "流程名称为必填项", trigger: "blur" }],
  bizType: [{ required: true, message: "请选择业务类型", trigger: "change" }]
});
