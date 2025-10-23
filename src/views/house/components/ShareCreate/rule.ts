import { reactive } from "vue";
import type { FormRules } from "element-plus";

// 创建整租表单验证规则（小区信息 + 负责人信息）
export const createShareFormRules = (form: any) => {
  return reactive(<FormRules>{
    // 小区信息验证
    ["community.name"]: [{ required: true, message: "小区地址为必填项", trigger: "blur" }],
    water: [{ required: true, message: "用水为必填项", trigger: "change" }],
    electricity: [{ required: true, message: "用电为必填项", trigger: "change" }],
    heating: [{ required: true, message: "供暖信息为必填项", trigger: "change" }],

    // 负责人信息验证
    deptId: [
      { required: true, message: "归属部门为必填项", trigger: "change" },
      { type: "number", message: "请选择归属部门", trigger: "change", transform: value => Number(value) }
    ],
    salesmanId: [
      { required: true, message: "负责人为必填项", trigger: "change" },
      { type: "number", message: "请选择负责人", trigger: "change", transform: value => Number(value) }
    ]
  });
};
