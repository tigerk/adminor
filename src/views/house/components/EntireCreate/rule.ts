import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { checkFocusCodeExist } from "@/api/house/focus";
import { debounce } from "@pureadmin/utils";

// 创建规则的工厂函数
export const createFocusBasicInfoRules = (form: any) => {
  const validateFocusCode = debounce(async (rule: any, value: string, callback: any) => {
    if (!value) {
      callback(new Error("项目编号不能为空"));
      return;
    }

    // 现在可以访问 form 的所有字段
    console.log("表单数据:", form);
    console.log("项目名称:", form.focusName);

    try {
      const res = await checkFocusCodeExist({ id: form.value.id, focusCode: value });
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

  return reactive(<FormRules>{
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
};
