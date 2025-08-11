import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验 */
export const focusBasicInfoRules = reactive(<FormRules>{
  houseCode: [{ required: true, message: "项目编码为必填项", trigger: "blur" }],
  houseName: [{ required: true, message: "项目名称为必填项", trigger: "blur" }],
  address: [{ required: true, message: "项目地址为必填项", trigger: "blur" }],
  building: [{ required: true, message: "楼栋为必填项", trigger: "blur" }],
  floorTotal: [{ required: true, message: "楼层为必填项", trigger: "blur" }],
  roomCountPerFloor: [{ required: true, message: "每层房间数量为必填项", trigger: "blur" }]
});
