import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { checkFocusCodeExist } from "@/api/house/focus";
import { debounce } from "@pureadmin/utils";

// 异步校验函数
const validateFocusCode = debounce(async (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error("项目编号不能为空"));
    return;
  }

  try {
    const res = await checkFocusCodeExist({ focusCode: value });
    if (res.data) {
      callback(new Error("项目编号已存在"));
    } else {
      callback();
    }
  } catch (_error) {
    console.error(_error);
    callback(new Error("校验服务异常，请稍后再试"));
  }
}, 500);

/** 基础表单规则校验 */
export const focusBasicInfoRules = reactive(<FormRules>{
  focusCode: [
    { required: true, message: "项目编码为必填项", trigger: "blur" },
    { validator: validateFocusCode, trigger: "blur" }
  ],
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
