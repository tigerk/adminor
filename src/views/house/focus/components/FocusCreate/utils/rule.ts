import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 基础表单规则校验 */
export const focusBasicInfoRules = reactive(<FormRules>{
  houseCode: [{ required: true, message: "项目编码为必填项", trigger: "blur" }],
  houseName: [{ required: true, message: "项目名称为必填项", trigger: "blur" }],
  address: [{ required: true, message: "项目地址为必填项", trigger: "blur" }],
  deptId: [
    { required: true, message: "归属部门为必填项", trigger: "change" },
    { type: "number", message: "请选择归属部门", trigger: "change", transform: value => Number(value) }
  ],
  salesmanId: [
    { required: true, message: "负责人为必填项", trigger: "change" },
    { type: "number", message: "请选择负责人", trigger: "change", transform: value => Number(value) }
  ]
});

/** 楼栋验证规则 - 用于动态添加 */
export const buildingRules = {
  building: [{ required: true, message: "楼栋号为必填项", trigger: "blur" }],
  floorTotal: [
    { required: true, message: "楼层为必填项", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value === null || value === undefined || value === "") {
          callback(new Error("楼层为必填项"));
        } else if (isNaN(Number(value))) {
          callback(new Error("楼层必须为数字"));
        } else if (Number(value) < 1) {
          callback(new Error("楼层至少为1层"));
        } else if (Number(value) > 100) {
          callback(new Error("楼层不能超过100层"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  houseCountPerFloor: [
    { required: true, message: "每层房源数量为必填项", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value === null || value === undefined || value === "") {
          callback(new Error("每层房源数量为必填项"));
        } else if (isNaN(Number(value))) {
          callback(new Error("房源数量必须为数字"));
        } else if (Number(value) < 1) {
          callback(new Error("每层至少1间房源"));
        } else if (Number(value) > 100) {
          callback(new Error("每层房源数量不能超过100间"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};
