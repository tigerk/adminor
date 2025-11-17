// rule.ts
import { reactive } from "vue";
import type { FormRules } from "element-plus";

// 手机号验证规则
const validatePhone = (rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error("请输入联系电话"));
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error("请输入正确的手机号码"));
  } else {
    callback();
  }
};

// 身份证验证规则
const validateIdNo = (rule: any, value: any, callback: any, formInline: any) => {
  if (!value) {
    callback(new Error("请输入证件号码"));
  } else if (formInline.idType === 0 && !/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(value)) {
    callback(new Error("请输入正确的身份证号码"));
  } else {
    callback();
  }
};

// 验证规则
export const tenantFormRules = (formInline: any) =>
  reactive<FormRules>({
    name: [
      { required: true, message: "请输入租客姓名或企业名称", trigger: "blur" },
      { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
    ],
    tenantType: [{ required: true, message: "请选择租客类型", trigger: "change" }],
    idType: [{ required: true, message: "请选择证件类型", trigger: "change" }],
    idNo: [{ required: true, validator: (rule, value, callback) => validateIdNo(rule, value, callback, formInline), trigger: "blur" }],
    phone: [{ required: true, validator: validatePhone, trigger: "blur" }]
  });
