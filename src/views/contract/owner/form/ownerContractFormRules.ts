import type { FormRules } from "element-plus";
import type { OwnerContractForm } from "./ownerContractFormTypes";

/**
 * 生成业主合同表单校验规则。
 *
 * 接收响应式 form 对象的 getter，使得校验器内部可以动态读取当前 ownerType，
 * 做到个人/企业字段按需校验，避免切换类型时误报。
 */
export function createOwnerContractRules(getForm: () => OwnerContractForm): FormRules {
  return {
    // ─── 顶层字段 ────────────────────────────────────────────────────────────
    ownerType: [{ required: true, message: "请选择业主类型", trigger: "change" }],

    "ownerContract.cooperationMode": [{ required: true, message: "请选择委托模式", trigger: "change" }],

    contractHouseList: [
      {
        required: true,
        validator: (_, value, callback) => (value?.length ? callback() : callback(new Error("请选择房源"))),
        trigger: "change"
      }
    ],

    "ownerContract.contractTemplateId": [{ required: true, message: "请选择合同模板", trigger: "change" }],

    // ─── 个人业主主体信息 ─────────────────────────────────────────────────────
    "ownerPersonal.name": [
      {
        trigger: "blur",
        validator: (_, value, callback) => {
          if (getForm().ownerType !== "PERSONAL") return callback();
          return value ? callback() : callback(new Error("请输入业主姓名"));
        }
      }
    ],

    "ownerPersonal.phone": [
      {
        trigger: "blur",
        validator: (_, value, callback) => {
          if (getForm().ownerType !== "PERSONAL") return callback();
          return value ? callback() : callback(new Error("请输入联系电话"));
        }
      }
    ],

    "ownerPersonal.idNo": [
      {
        trigger: "blur",
        validator: (_, value, callback) => {
          if (getForm().ownerType !== "PERSONAL") return callback();
          return value ? callback() : callback(new Error("请输入证件号"));
        }
      }
    ],

    "ownerPersonal.idCardFrontList": [
      {
        trigger: "change",
        validator: (_, value, callback) => {
          if (getForm().ownerType !== "PERSONAL") return callback();
          return value?.length ? callback() : callback(new Error("请上传身份证国徽面"));
        }
      }
    ],

    "ownerPersonal.idCardBackList": [
      {
        trigger: "change",
        validator: (_, value, callback) => {
          if (getForm().ownerType !== "PERSONAL") return callback();
          return value?.length ? callback() : callback(new Error("请上传身份证人像面"));
        }
      }
    ],

    // ─── 企业业主主体信息 ─────────────────────────────────────────────────────
    "ownerCompany.name": [
      {
        trigger: "blur",
        validator: (_, value, callback) => {
          if (getForm().ownerType !== "COMPANY") return callback();
          return value ? callback() : callback(new Error("请输入企业名称"));
        }
      }
    ],

    "ownerCompany.uscc": [
      {
        trigger: "blur",
        validator: (_, value, callback) => {
          if (getForm().ownerType !== "COMPANY") return callback();
          return value ? callback() : callback(new Error("请输入统一社会信用代码"));
        }
      }
    ],

    "ownerCompany.contactName": [
      {
        trigger: "blur",
        validator: (_, value, callback) => {
          if (getForm().ownerType !== "COMPANY") return callback();
          return value ? callback() : callback(new Error("请输入联系人"));
        }
      }
    ],

    "ownerCompany.contactPhone": [
      {
        trigger: "blur",
        validator: (_, value, callback) => {
          if (getForm().ownerType !== "COMPANY") return callback();
          return value ? callback() : callback(new Error("请输入联系电话"));
        }
      }
    ],

    // ─── 个人业主收款信息 ─────────────────────────────────────────────────────
    "ownerPersonal.payeeName": [{ required: true, message: "请输入收款人姓名", trigger: "blur" }],
    "ownerPersonal.payeePhone": [{ required: true, message: "请输入收款人电话", trigger: "blur" }],
    "ownerPersonal.payeeIdNo": [{ required: true, message: "请输入收款人证件号码", trigger: "blur" }],
    "ownerPersonal.bankAccountName": [{ required: true, message: "请输入银行卡开户名", trigger: "blur" }],
    "ownerPersonal.bankAccountNo": [{ required: true, message: "请输入银行卡号", trigger: "blur" }],

    // ─── 企业业主收款信息 ─────────────────────────────────────────────────────
    "ownerCompany.payeeName": [{ required: true, message: "请输入收款人姓名", trigger: "blur" }],
    "ownerCompany.payeePhone": [{ required: true, message: "请输入收款人电话", trigger: "blur" }],
    "ownerCompany.payeeIdNo": [{ required: true, message: "请输入收款人证件号码", trigger: "blur" }],
    "ownerCompany.bankAccountName": [{ required: true, message: "请输入银行卡开户名", trigger: "blur" }],
    "ownerCompany.bankAccountNo": [{ required: true, message: "请输入银行卡号", trigger: "blur" }]
  };
}
