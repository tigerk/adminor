import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 基础表单规则校验 */
export const focusBasicInfoRules = reactive(<FormRules>{
  focusCode: [{ required: true, message: "项目编码为必填项", trigger: "blur" }],
  focusName: [{ required: true, message: "项目名称为必填项", trigger: "blur" }],
  ["community.name"]: [{ required: true, message: "项目地址为必填项", trigger: "blur" }],
  deptId: [
    { required: true, message: "归属部门为必填项", trigger: "change" },
    { type: "number", message: "请选择归属部门", trigger: "change", transform: value => Number(value) }
  ],
  salesmanId: [
    { required: true, message: "负责人为必填项", trigger: "change" },
    { type: "number", message: "请选择负责人", trigger: "change", transform: value => Number(value) }
  ]
});
