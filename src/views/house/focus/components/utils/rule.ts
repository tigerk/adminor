import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验 */
export const focusBasicInfoRules = reactive(<FormRules>{
  houseCode: [{ required: true, message: "项目编码为必填项", trigger: "blur" }],
  houseName: [{ required: true, message: "项目名称为必填项", trigger: "blur" }],
  address: [{ required: true, message: "项目地址为必填项", trigger: "blur" }],
  building: [{ required: true, message: "楼栋为必填项", trigger: "blur" }],
  floorTotal: [
    { required: true, message: "楼层为必填项", trigger: "blur" },
    { type: "number", message: "楼层必须为数字", trigger: "blur", transform: value => Number(value) },
    { type: "number", min: 1, message: "楼层至少为1层", trigger: "blur", transform: value => Number(value) }
  ],
  roomCountPerFloor: [
    { required: true, message: "每层房间数量为必填项", trigger: "blur" },
    { type: "number", message: "房间数量必须为数字", trigger: "blur", transform: value => Number(value) },
    { type: "number", min: 1, message: "每层至少1个房间", trigger: "blur", transform: value => Number(value) }
  ],
  deptId: [
    { required: true, message: "归属部门为必填项", trigger: "change" },
    { type: "number", message: "请选择归属部门", trigger: "change", transform: value => Number(value) }
  ],
  salesmanId: [
    { required: true, message: "负责人为必填项", trigger: "change" },
    { type: "number", message: "请选择负责人", trigger: "change", transform: value => Number(value) }
  ]
});
