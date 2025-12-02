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

// 个人租客验证规则
export const tenantFormRules = (formInline: any) =>
  reactive<FormRules>({
    "contract.roomIds": [{ required: true, message: "请选择房间", trigger: "change" }],
    "tenant.name": [
      { required: true, message: "请输入租客姓名", trigger: "blur" },
      { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
    ],
    "tenant.tenantType": [{ required: true, message: "请选择租客类型", trigger: "change" }],
    "tenant.idType": [{ required: true, message: "请选择证件类型", trigger: "change" }],
    "tenant.idNo": [{ required: true, validator: (rule, value, callback) => validateIdNo(rule, value, callback, formInline), trigger: "blur" }],
    "tenant.phone": [{ required: true, validator: validatePhone, trigger: "blur" }],
    "contract.deptId": [{ required: true, message: "请选择部门", trigger: "change" }],
    "contract.salesmanId": [{ required: true, message: "请选择业务员", trigger: "change" }],
    "contract.rentDueType": [{ required: true, message: "请选择收租设置", trigger: "change" }]
  });

// 企业租客验证规则
export const tenantCompanyFormRules = (formInline: any) =>
  reactive<FormRules>({
    "contract.roomIds": [{ required: true, message: "请选择房间", trigger: "change" }],
    "tenantCompany.companyName": [
      { required: true, message: "请输入企业名称", trigger: "blur" },
      { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
    ],
    "tenantCompany.uscc": [{ required: true, message: "请输入统一社会信用代码", trigger: "blur" }],
    "tenantCompany.legalPerson": [{ required: true, message: "请输入法定代表人", trigger: "blur" }],
    "tenantCompany.contactPhone": [{ required: true, validator: validatePhone, trigger: "blur" }],
    "contract.deptId": [{ required: true, message: "请选择部门", trigger: "change" }],
    "contract.salesmanId": [{ required: true, message: "请选择业务员", trigger: "change" }],
    "contract.rentDueType": [{ required: true, message: "请选择收租设置", trigger: "change" }]
  });
