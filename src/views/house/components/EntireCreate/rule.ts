import { reactive } from "vue";
import type { FormRules } from "element-plus";

// 创建整租表单验证规则（小区信息 + 负责人信息）
export const createEntireFormRules = (form: any) => {
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

// 房源信息验证规则（用于单个房源的验证）
export const houseItemRules = {
  building: { required: true, message: "座/栋不能为空" },
  doorNumber: { required: true, message: "房间号不能为空" },
  floor: { required: true, message: "所在楼层不能为空" },
  totalFloor: { required: true, message: "总楼层数不能为空" },
  houseLayout: { required: true, message: "户型不能为空" },
  direction: { required: true, message: "朝向不能为空" },
  decorationType: { required: true, message: "装修类型不能为空" },
  price: { required: true, message: "出租价格不能为空" }
};

// 验证单个房源的工具函数
export const validateSingleHouse = (house: any, index: number): string[] => {
  const errors: string[] = [];
  const houseNum = index + 1;

  if (!house.building?.trim()) {
    errors.push(`房源${houseNum}：座/栋不能为空`);
  }
  if (!house.doorNumber?.trim()) {
    errors.push(`房源${houseNum}：房间号不能为空`);
  }
  if (house.floor === null || house.floor === undefined || house.floor === "") {
    errors.push(`房源${houseNum}：所在楼层不能为空`);
  }
  if (house.totalFloor === null || house.totalFloor === undefined || house.totalFloor === "") {
    errors.push(`房源${houseNum}：总楼层数不能为空`);
  }
  if (!house.houseLayout) {
    errors.push(`房源${houseNum}：户型不能为空`);
  }
  if (!house.direction?.trim()) {
    errors.push(`房源${houseNum}：朝向不能为空`);
  }
  if (!house.decorationType?.trim()) {
    errors.push(`房源${houseNum}：装修类型不能为空`);
  }
  if (!house.price?.toString().trim()) {
    errors.push(`房源${houseNum}：出租价格不能为空`);
  }

  return errors;
};

// 验证所有房源的工具函数
export const validateAllHouses = (houseList: any[]): { valid: boolean; errors: string[] } => {
  const allErrors: string[] = [];

  houseList.forEach((house, index) => {
    const errors = validateSingleHouse(house, index);
    allErrors.push(...errors);
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
};
