// AUTO GENERATED - DO NOT EDIT

export const BooleanEnumMeta = {
  FALSE: {"value":0},
  TRUE: {"value":1}
} as const;

export const DeletedEnumMeta = {
  NOT_DELETED: {"value":0},
  DELETED: {"value":1}
} as const;

export const GenderEnumMeta = {
  UNKNOWN: {"value":0},
  MALE: {"value":1},
  FEMALE: {"value":2}
} as const;

export const IdTypeEnumMeta = {
  ID_CARD: {"value":"ID_CARD","code":0,"name":"身份证"},
  PASSPORT: {"value":"PASSPORT","code":1,"name":"护照"},
  HONGKONG_MACAO: {"value":"HONGKONG_MACAO","code":2,"name":"港澳通行证"},
  TAIWAN: {"value":"TAIWAN","code":3,"name":"台胞证"}
} as const;

export const LimitTypeMeta = {
  DEFAULT: {"value":"DEFAULT"},
  IP: {"value":"IP"}
} as const;

export const MenuTypeEnumMeta = {
  MENU: {"value":"MENU","type":0,"typeStr":"菜单"},
  IFRAME: {"value":"IFRAME","type":1,"typeStr":"Iframe"},
  EXTERNAL_LINK: {"value":"EXTERNAL_LINK","type":2,"typeStr":"外链"},
  BUTTON: {"value":"BUTTON","type":3,"typeStr":"按钮"}
} as const;

export const NoticeTypeEnumMeta = {
  NOTIFICATION: {"value":"NOTIFICATION","type":1,"description":"通知"},
  PUBLIC: {"value":"PUBLIC","type":2,"description":"公告"}
} as const;

export const OperationTypeEnumMeta = {
  OTHER: {"value":"OTHER","code":0,"name":"其它"},
  INSERT: {"value":"INSERT","code":1,"name":"新增"},
  UPDATE: {"value":"UPDATE","code":2,"name":"修改"},
  DELETE: {"value":"DELETE","code":3,"name":"删除"},
  GRANT: {"value":"GRANT","code":4,"name":"授权"},
  EXPORT: {"value":"EXPORT","code":5,"name":"导出"},
  IMPORT: {"value":"IMPORT","code":6,"name":"导入"},
  FORCE: {"value":"FORCE","code":7,"name":"强退"},
  CLEAR: {"value":"CLEAR","code":8,"name":"清空数据"}
} as const;

export const OperatorTypeEnumMeta = {
  OTHER: {"value":0},
  MANAGE: {"value":1}
} as const;

export const ReadStatusEnumMeta = {
  UNREAD: {"value":"UNREAD","code":0,"description":"未读"},
  READ: {"value":"READ","code":1,"description":"已读"}
} as const;

export const RoleDefaultEnumMeta = {
  PLATFORM_SUPER_ADMIN: {"value":"PLATFORM_SUPER_ADMIN","id":1,"roleName":"公司管理员","roleCode":"platform-admin"},
  COMPANY_ADMIN: {"value":"COMPANY_ADMIN","id":2,"roleName":"公司管理员","roleCode":"company-admin"},
  USER: {"value":"USER","id":3,"roleName":"普通用户","roleCode":"user"}
} as const;

export const SaasUserTypeEnumMeta = {
  COMPANY_ADMIN: {"value":"COMPANY_ADMIN","type":20,"typeStr":"公司管理员"},
  COMPANY_USER: {"value":"COMPANY_USER","type":21,"typeStr":"公司用户"}
} as const;

export const StatusEnumMeta = {
  ACTIVE: {"value":1},
  DISABLED: {"value":0}
} as const;

export const TrialApplicationStatusEnumMeta = {
  PENDING: {"value":"PENDING","code":0,"name":"申请中"},
  APPROVED: {"value":"APPROVED","code":1,"name":"已通过"},
  REJECTED: {"value":"REJECTED","code":2,"name":"已拒绝"}
} as const;

export const ZoneEnumMeta = {
  SHANGHAI: {"value":"SHANGHAI","zone":"Asia/Shanghai","desc":"中国上海"}
} as const;

export const ApprovalActionStatusEnumMeta = {
  PENDING: {"value":"PENDING","code":0,"name":"待审批"},
  APPROVED: {"value":"APPROVED","code":1,"name":"已审批"},
  SKIPPED: {"value":"SKIPPED","code":2,"name":"已跳过"}
} as const;

export const ApprovalActionTypeEnumMeta = {
  APPROVE: {"value":"APPROVE","code":1,"name":"通过"},
  REJECT: {"value":"REJECT","code":2,"name":"驳回"},
  TRANSFER: {"value":"TRANSFER","code":3,"name":"转交"}
} as const;

export const ApprovalBizTypeEnumMeta = {
  TENANT_CHECKIN: {"value":"TENANT_CHECKIN","code":"TENANT_CHECKIN","name":"租客入住","tableName":"tenant","pkField":"id"},
  TENANT_CHECKOUT: {"value":"TENANT_CHECKOUT","code":"TENANT_CHECKOUT","name":"租客退租","tableName":"lease_checkout","pkField":"id"},
  HOUSE_CREATE: {"value":"HOUSE_CREATE","code":"HOUSE_CREATE","name":"房源录入","tableName":"house","pkField":"id"},
  PAYMENT_FLOW: {"value":"PAYMENT_FLOW","code":"PAYMENT_FLOW","name":"支付流水","tableName":"payment_flow","pkField":"id"}
} as const;

export const ApprovalInstanceStatusEnumMeta = {
  DRAFT: {"value":"DRAFT","code":0,"name":"待提交"},
  PENDING: {"value":"PENDING","code":1,"name":"审批中"},
  APPROVED: {"value":"APPROVED","code":2,"name":"已通过"},
  REJECTED: {"value":"REJECTED","code":3,"name":"已驳回"},
  WITHDRAWN: {"value":"WITHDRAWN","code":4,"name":"已撤回"},
  CANCELLED: {"value":"CANCELLED","code":5,"name":"已取消"}
} as const;

export const ApproverTypeEnumMeta = {
  SPECIFIC_USER: {"value":"SPECIFIC_USER","code":1,"name":"指定用户"},
  SPECIFIC_ROLE: {"value":"SPECIFIC_ROLE","code":2,"name":"指定角色"},
  DEPARTMENT_SUPERVISOR: {"value":"DEPARTMENT_SUPERVISOR","code":3,"name":"部门负责人"},
  SELF_OPTION: {"value":"SELF_OPTION","code":4,"name":"发起人自选"}
} as const;

export const BizApprovalStatusEnumMeta = {
  PENDING: {"value":"PENDING","code":1,"name":"审批中"},
  APPROVED: {"value":"APPROVED","code":2,"name":"已通过"},
  REJECTED: {"value":"REJECTED","code":3,"name":"已驳回"},
  WITHDRAWN: {"value":"WITHDRAWN","code":4,"name":"已撤回"}
} as const;

export const MultiApproveEnumMeta = {
  OR_SIGN: {"value":"OR_SIGN","code":1,"name":"或签（一人通过即可）"},
  AND_SIGN: {"value":"AND_SIGN","code":2,"name":"会签（所有人通过）"}
} as const;

export const BookingStatusEnumMeta = {
  BOOKING: {"value":"BOOKING","code":1,"name":"预定中","sortOrder":1},
  CONTRACTED: {"value":"CONTRACTED","code":2,"name":"已转合同","sortOrder":2},
  TENANT_DEFAULTED: {"value":"TENANT_DEFAULTED","code":3,"name":"客户违约","sortOrder":3},
  OWNER_DEFAULTED: {"value":"OWNER_DEFAULTED","code":4,"name":"业主违约","sortOrder":4},
  CANCELLED_EXPIRED: {"value":"CANCELLED_EXPIRED","code":5,"name":"已取消/过期","sortOrder":5}
} as const;

export const CheckoutFeeTypeEnumMeta = {
  RENT: {"value":"RENT","code":1,"name":"租金","direction":1},
  DEPOSIT: {"value":"DEPOSIT","code":2,"name":"押金","direction":1},
  WATER: {"value":"WATER","code":3,"name":"水费","direction":1},
  ELECTRIC: {"value":"ELECTRIC","code":4,"name":"电费","direction":1},
  GAS: {"value":"GAS","code":5,"name":"燃气费","direction":1},
  PROPERTY_FEE: {"value":"PROPERTY_FEE","code":6,"name":"物业费","direction":1},
  CLEANING: {"value":"CLEANING","code":7,"name":"清洁费","direction":1},
  DAMAGE: {"value":"DAMAGE","code":8,"name":"物品损坏","direction":1},
  PENALTY: {"value":"PENALTY","code":9,"name":"违约金","direction":1},
  OTHER: {"value":"OTHER","code":10,"name":"其他费用","direction":1},
  RENT_REFUND: {"value":"RENT_REFUND","code":51,"name":"租金","direction":2},
  DEPOSIT_REFUND: {"value":"DEPOSIT_REFUND","code":52,"name":"押金","direction":2},
  OTHER_REFUND: {"value":"OTHER_REFUND","code":53,"name":"其他退款","direction":2}
} as const;

export const CheckoutSettlementMethodEnumMeta = {
  GENERATE_BILL: {"value":"GENERATE_BILL","code":1,"name":"生成待付账单"},
  OFFLINE_PAYMENT: {"value":"OFFLINE_PAYMENT","code":2,"name":"线下付款"},
  APPLY_PAYMENT: {"value":"APPLY_PAYMENT","code":3,"name":"申请付款"},
  BAD_DEBT: {"value":"BAD_DEBT","code":4,"name":"标记坏账"}
} as const;

export const CheckoutStatusEnumMeta = {
  DRAFT: {"value":"DRAFT","code":0,"name":"草稿"},
  PENDING: {"value":"PENDING","code":1,"name":"待确认"},
  COMPLETED: {"value":"COMPLETED","code":2,"name":"已完成"},
  CANCELLED: {"value":"CANCELLED","code":3,"name":"已取消"}
} as const;

export const CheckoutTypeEnumMeta = {
  NORMAL: {"value":"NORMAL","code":1,"name":"正常退"},
  BREACH: {"value":"BREACH","code":2,"name":"违约退"}
} as const;

export const CompanyNatureEnumMeta = {
  ENTERPRISE: {"value":"ENTERPRISE","code":1,"message":"企业"},
  PERSONAL: {"value":"PERSONAL","code":2,"message":"个人"}
} as const;

export const BookingParamsEnumMeta = {
  CONTRACT_NUMBER: {"value":"${预定合同编号}","key":"${预定合同编号}"},
  HOUSE_ADDRESS: {"value":"${房屋地址}","key":"${房屋地址}"},
  PROJECT_NAME: {"value":"${小区/项目名称}","key":"${小区/项目名称}"},
  BUILDING_NUMBER: {"value":"${楼栋号}","key":"${楼栋号}"},
  UNIT_NUMBER: {"value":"${单元号}","key":"${单元号}"},
  HOUSE_NUMBER: {"value":"${门牌号}","key":"${门牌号}"},
  SHARED_ROOM_NUMBER: {"value":"${合租房间号}","key":"${合租房间号}"},
  SIGNED_HOUSE_LIST: {"value":"${签约房源列表}","key":"${签约房源列表}"},
  HOUSE_PROPERTY_NUMBER: {"value":"${房屋产权编号}","key":"${房屋产权编号}"},
  HOUSE_TYPE: {"value":"${房屋类型}","key":"${房屋类型}"},
  PROPERTY_TYPE: {"value":"${产权类型}","key":"${产权类型}"},
  TOTAL_AREA: {"value":"${房屋总面积}","key":"${房屋总面积}"},
  SIGNED_AREA: {"value":"${签约面积数}","key":"${签约面积数}"},
  TENANT_NAME: {"value":"${租客姓名}","key":"${租客姓名}"}
} as const;

export const ContractNatureEnumMeta = {
  NEW_SIGN: {"value":"NEW_SIGN","code":1,"name":"新签"},
  RENEWAL: {"value":"RENEWAL","code":2,"name":"续签"},
  SUBLET: {"value":"SUBLET","code":3,"name":"转租"},
  RELOCATION: {"value":"RELOCATION","code":4,"name":"换房"}
} as const;

export const ContractSealSourceEnumMeta = {
  SELF: {"value":"SELF","code":1,"name":"自有图片"},
  FADADA: {"value":"FADADA","code":2,"name":"法大大"},
  EQIBAO: {"value":"EQIBAO","code":3,"name":"E签宝"},
  OTHER: {"value":"OTHER","code":4,"name":"其他第三方"}
} as const;

export const ContractSealTypeEnumMeta = {
  COMPANY: {"value":"COMPANY","code":1,"name":"企业"},
  PERSONAL: {"value":"PERSONAL","code":2,"name":"个人"}
} as const;

export const ContractTemplateStatusEnumMeta = {
  UNEFFECTIVE: {"value":"UNEFFECTIVE","code":0,"name":"未启用"},
  EFFECTIVE: {"value":"EFFECTIVE","code":1,"name":"已启用"}
} as const;

export const ContractTypeEnumMeta = {
  TENANT: {"value":"TENANT","code":1,"name":"租客"},
  OWNER: {"value":"OWNER","code":2,"name":"房东"},
  BOOKING: {"value":"BOOKING","code":3,"name":"预定"},
  CHECKOUT: {"value":"CHECKOUT","code":4,"name":"退租"}
} as const;

export const LandlordParamsEnumMeta = {
  CONTRACT_NUMBER: {"value":"${房东合同编号}","key":"${房东合同编号}"},
  HOUSE_ADDRESS: {"value":"${房屋地址}","key":"${房屋地址}"},
  PROJECT_NAME: {"value":"${小区/项目名称}","key":"${小区/项目名称}"},
  BUILDING_NUMBER: {"value":"${楼栋号}","key":"${楼栋号}"},
  UNIT_NUMBER: {"value":"${单元号}","key":"${单元号}"},
  HOUSE_NUMBER: {"value":"${门牌号}","key":"${门牌号}"},
  SHARED_ROOM_NUMBER: {"value":"${合租房间号}","key":"${合租房间号}"},
  SIGNED_HOUSE_LIST: {"value":"${签约房源列表}","key":"${签约房源列表}"},
  HOUSE_PROPERTY_NUMBER: {"value":"${房屋产权编号}","key":"${房屋产权编号}"},
  HOUSE_TYPE: {"value":"${房屋类型}","key":"${房屋类型}"},
  PROPERTY_TYPE: {"value":"${产权类型}","key":"${产权类型}"},
  TOTAL_AREA: {"value":"${房屋总面积}","key":"${房屋总面积}"},
  SIGNED_AREA: {"value":"${签约面积数}","key":"${签约面积数}"},
  TENANT_NAME: {"value":"${租客姓名}","key":"${租客姓名}"}
} as const;

export const TenantParamsEnumMeta = {
  CONTRACT_CODE: {"value":"${租客合同编号}","key":"${租客合同编号}"},
  SIGNED_HOUSE_LIST: {"value":"${签约房源}","key":"${签约房源}"},
  TOTAL_AREA: {"value":"${房屋总面积}","key":"${房屋总面积}"},
  OWNER_NAME: {"value":"${房东姓名}","key":"${房东姓名}"},
  OWNER_PHONE: {"value":"${房东手机号}","key":"${房东手机号}"},
  OWNER_ID_CARD: {"value":"${房东身份证号}","key":"${房东身份证号}"},
  TENANT_NAME: {"value":"${租客姓名}","key":"${租客姓名}"},
  TENANT_PHONE: {"value":"${租客手机号}","key":"${租客手机号}"},
  TENANT_ID_CARD: {"value":"${租客身份证号}","key":"${租客身份证号}"},
  LEASE_START: {"value":"${合同开始日期}","key":"${合同开始日期}"},
  LEASE_END: {"value":"${合同结束日期}","key":"${合同结束日期}"},
  LEASE_DAYS: {"value":"${租赁天数}","key":"${租赁天数}"},
  RENT_PRICE: {"value":"${月租金}","key":"${月租金}"},
  PAYMENT_MONTHS: {"value":"${支付周期（月）}","key":"${支付周期}（月）"},
  DEPOSIT_MONTHS: {"value":"${押金月数}","key":"${押金月数}"},
  TENANT_REMARK: {"value":"${租客备注}","key":"${租客备注}"},
  OWNER_SIGNATURE: {"value":"${房东签字}","key":"${房东签字}"},
  TENANT_SIGNATURE: {"value":"${租客签字}","key":"${租客签字}"},
  COMPANY_SEAL: {"value":"${公司盖章}","key":"${公司盖章}"},
  CONTRACT_DATE: {"value":"${合同时间}","key":"${合同时间}"}
} as const;

export const DeliveryStatusEnumMeta = {
  CANCELLED: {"value":"CANCELLED","code":-1,"name":"作废"},
  DRAFT: {"value":"DRAFT","code":0,"name":"待填写"},
  COMPLETED: {"value":"COMPLETED","code":1,"name":"已填写"},
  SIGNED: {"value":"SIGNED","code":2,"name":"已签署"}
} as const;

export const FileAttachBizTypeEnumMeta = {
  USER_AVATAR: {"value":"USER_AVATAR","bizType":"user_avatar"},
  HOUSE_IMAGE: {"value":"HOUSE_IMAGE","bizType":"house_image"},
  ROOM_IMAGE: {"value":"ROOM_IMAGE","bizType":"room_image"},
  TENANT_ID_CARD_FRONT: {"value":"TENANT_ID_CARD_FRONT","bizType":"tenant_id_card_front"},
  TENANT_ID_CARD_BACK: {"value":"TENANT_ID_CARD_BACK","bizType":"tenant_id_card_back"},
  TENANT_ID_CARD_IN_HAND: {"value":"TENANT_ID_CARD_IN_HAND","bizType":"tenant_id_card_in_hand"},
  TENANT_OTHER_IMAGE: {"value":"TENANT_OTHER_IMAGE","bizType":"tenant_other_image"},
  CONTRACT_FILE: {"value":"CONTRACT_FILE","bizType":"contract_file"},
  TENANT_IMAGE: {"value":"TENANT_IMAGE","bizType":"tenant_image"},
  BUSINESS_LICENSE: {"value":"BUSINESS_LICENSE","bizType":"business_license"},
  TENANT_MATE_ID_CARD_FRONT: {"value":"TENANT_MATE_ID_CARD_FRONT","bizType":"tenant_mate_id_card_front"},
  TENANT_MATE_ID_CARD_BACK: {"value":"TENANT_MATE_ID_CARD_BACK","bizType":"tenant_mate_id_card_back"},
  TENANT_MATE_ID_CARD_IN_HAND: {"value":"TENANT_MATE_ID_CARD_IN_HAND","bizType":"tenant_mate_id_card_in_hand"},
  TENANT_MATE_OTHER_IMAGE: {"value":"TENANT_MATE_OTHER_IMAGE","bizType":"tenant_mate_other_image"},
  DELIVERY_IMAGE: {"value":"DELIVERY_IMAGE","bizType":"delivery_image"},
  CONTRACT_SEAL_IMAGE: {"value":"CONTRACT_SEAL_IMAGE","bizType":"contract_seal_image"}
} as const;

export const FileTypeEnumMeta = {
  IMAGE: {"value":"IMAGE","code":0},
  VIDEO: {"value":"VIDEO","code":1},
  PDF: {"value":"PDF","code":2}
} as const;

export const FinanceBizTypeEnumMeta = {
  LEASE_BILL_FEE: {"value":"LEASE_BILL_FEE","code":"LEASE_BILL_FEE","label":"租客账单费用项"}
} as const;

export const FinanceFlowDirectionEnumMeta = {
  IN: {"value":"IN","code":"IN","label":"收入"},
  OUT: {"value":"OUT","code":"OUT","label":"支出"}
} as const;

export const FinanceFlowStatusEnumMeta = {
  PENDING: {"value":"PENDING","code":0,"label":"入账中"},
  SUCCESS: {"value":"SUCCESS","code":1,"label":"已入账"},
  VOIDED: {"value":"VOIDED","code":2,"label":"已作废"}
} as const;

export const FinanceFlowTypeEnumMeta = {
  RECEIVE: {"value":"RECEIVE","code":"RECEIVE","label":"收款"},
  PAY: {"value":"PAY","code":"PAY","label":"付款"},
  REFUND: {"value":"REFUND","code":"REFUND","label":"退款"},
  VOID: {"value":"VOID","code":"VOID","label":"作废"},
  ADJUST: {"value":"ADJUST","code":"ADJUST","label":"调整"}
} as const;

export const PaymentFlowBizTypeEnumMeta = {
  LEASE_BILL: {"value":"LEASE_BILL","code":"LEASE_BILL","label":"租客账单"}
} as const;

export const PaymentFlowChannelEnumMeta = {
  CASH: {"value":"CASH","code":"CASH","label":"现金"},
  TRANSFER: {"value":"TRANSFER","code":"TRANSFER","label":"转账"},
  ALIPAY: {"value":"ALIPAY","code":"ALIPAY","label":"支付宝"},
  WECHAT: {"value":"WECHAT","code":"WECHAT","label":"微信"},
  YEEPAY: {"value":"YEEPAY","code":"YEEPAY","label":"易宝"},
  POS: {"value":"POS","code":"POS","label":"POS"},
  OTHER: {"value":"OTHER","code":"OTHER","label":"其他"}
} as const;

export const PaymentFlowDirectionEnumMeta = {
  IN: {"value":"IN","code":"IN","label":"入账"},
  OUT: {"value":"OUT","code":"OUT","label":"出账"}
} as const;

export const PaymentFlowStatusEnumMeta = {
  PENDING: {"value":"PENDING","code":0,"label":"待支付"},
  PENDING_APPROVAL: {"value":"PENDING_APPROVAL","code":1,"label":"待审批"},
  SUCCESS: {"value":"SUCCESS","code":2,"label":"支付成功"},
  FAILED: {"value":"FAILED","code":3,"label":"支付失败"},
  CLOSED: {"value":"CLOSED","code":4,"label":"已关闭"},
  REFUNDING: {"value":"REFUNDING","code":5,"label":"退款中"},
  REFUNDED: {"value":"REFUNDED","code":6,"label":"已退款"}
} as const;

export const DecorationTypeEnumMeta = {
  LUXURY: {"value":"LUXURY","code":1,"name":"豪华装"},
  SIMPLE: {"value":"SIMPLE","code":2,"name":"简装"},
  DETAILED: {"value":"DETAILED","code":3,"name":"精装"},
  RAW: {"value":"RAW","code":4,"name":"毛坯"},
  WATER: {"value":"WATER","code":5,"name":"清水"},
  SIMPLEST: {"value":"SIMPLEST","code":6,"name":"简约"},
  UNDECORATED: {"value":"UNDECORATED","code":7,"name":"未装修"}
} as const;

export const LeaseModeEnumMeta = {
  UNKNOWN: {"value":"UNKNOWN","code":0,"name":"未知"},
  FOCUS: {"value":"FOCUS","code":1,"name":"集中式"},
  SCATTER: {"value":"SCATTER","code":2,"name":"分散式"}
} as const;

export const RentalTypeEnumMeta = {
  ENTIRE: {"value":"ENTIRE","code":1,"name":"整租"},
  SHARED: {"value":"SHARED","code":2,"name":"合租"}
} as const;

export const LeaseBillFeeTypeEnumMeta = {
  RENTAL: {"value":"RENTAL","code":"RENTAL","label":"租金"},
  DEPOSIT: {"value":"DEPOSIT","code":"DEPOSIT","label":"押金"},
  OTHER_FEE: {"value":"OTHER_FEE","code":"OTHER_FEE","label":"其他费用"}
} as const;

export const LeaseBillStatusEnumMeta = {
  NORMAL: {"value":"NORMAL","code":1,"name":"正常"},
  VOIDED: {"value":"VOIDED","code":2,"name":"已作废"}
} as const;

export const LeaseBillTypeEnumMeta = {
  RENT: {"value":"RENT","code":1,"name":"租金"},
  DEPOSIT: {"value":"DEPOSIT","code":2,"name":"押金"},
  OTHER_FEE: {"value":"OTHER_FEE","code":3,"name":"杂费"},
  RELEASE: {"value":"RELEASE","code":4,"name":"退租结算"},
  DEPOSIT_CARRY_IN: {"value":"DEPOSIT_CARRY_IN","code":5,"name":"押金结转入"},
  DEPOSIT_CARRY_OUT: {"value":"DEPOSIT_CARRY_OUT","code":6,"name":"押金结转出"}
} as const;

export const LeaseCheckOutStatusEnumMeta = {
  UN_CHECK_OUT: {"value":"UN_CHECK_OUT","code":0,"name":"未退租"},
  NORMAL_CHECK_OUT: {"value":"NORMAL_CHECK_OUT","code":1,"name":"正常退"},
  BREAK_CHECK_OUT: {"value":"BREAK_CHECK_OUT","code":2,"name":"违约退"},
  RENEW_CHECK_OUT: {"value":"RENEW_CHECK_OUT","code":3,"name":"续约退"},
  RELOCATION_CHECK_OUT: {"value":"RELOCATION_CHECK_OUT","code":4,"name":"换房退"},
  SUBLET_CHECK_OUT: {"value":"SUBLET_CHECK_OUT","code":5,"name":"转租退"}
} as const;

export const LeaseFirstBillDayEnumMeta = {
  FOLLOW_CONTRACT_START: {"value":"FOLLOW_CONTRACT_START","code":0,"name":"跟随合同起租日"},
  FOLLOW_CONTRACT_CREATE: {"value":"FOLLOW_CONTRACT_CREATE","code":1,"name":"跟随合同创建日"}
} as const;

export const LeaseRentDueTypeEnumMeta = {
  EARLY: {"value":"EARLY","code":1,"name":"提前"},
  FIXED: {"value":"FIXED","code":2,"name":"固定"},
  LATE: {"value":"LATE","code":3,"name":"延后"}
} as const;

export const LeaseStatusEnumMeta = {
  PENDING_APPROVAL: {"value":"PENDING_APPROVAL","code":0,"name":"待审批","color":"#FF2800","sortOrder":0},
  TO_SIGN: {"value":"TO_SIGN","code":1,"name":"待签字","color":"#FF2800","sortOrder":1},
  EFFECTIVE: {"value":"EFFECTIVE","code":2,"name":"在租中","color":"#52C41A","sortOrder":2},
  TERMINATED: {"value":"TERMINATED","code":3,"name":"已退租","color":"#EAA212","sortOrder":3},
  CANCELLED: {"value":"CANCELLED","code":-1,"name":"已作废","color":"#DBDBDB","sortOrder":4}
} as const;

export const PayStatusEnumMeta = {
  UNPAID: {"value":"UNPAID","code":0,"name":"未支付"},
  PARTIALLY_PAID: {"value":"PARTIALLY_PAID","code":1,"name":"部分支付"},
  PAID: {"value":"PAID","code":2,"name":"已支付"}
} as const;

export const PlatformUserTypeEnumMeta = {
  SUPER_USER: {"value":"SUPER_USER","type":10,"typeStr":"超级管理员"},
  REGULAR_USER: {"value":"REGULAR_USER","type":20,"typeStr":"普通用户"}
} as const;

export const PaymentMethodEnumMeta = {
  RENT: {"value":"RENT","code":0,"name":"随房租付"},
  ALL: {"value":"ALL","code":1,"name":"一次性全支付"},
  MONTH: {"value":"MONTH","code":2,"name":"月付"},
  BI_MONTH: {"value":"BI_MONTH","code":3,"name":"2月付"},
  QUARTER: {"value":"QUARTER","code":4,"name":"季付"},
  HALF_YEAR: {"value":"HALF_YEAR","code":5,"name":"半年付"},
  YEAR: {"value":"YEAR","code":6,"name":"年付"}
} as const;

export const PriceMethodEnumMeta = {
  FIXED: {"value":"FIXED","code":1,"name":"按固定金额"},
  RATIO: {"value":"RATIO","code":2,"name":"按租金比例"}
} as const;

export const PricePlanEnumMeta = {
  MONTH: {"value":"MONTH","code":0,"name":"月付"},
  TWO_MONTH: {"value":"TWO_MONTH","code":1,"name":"2月付"},
  QUARTER: {"value":"QUARTER","code":2,"name":"季付"},
  HALF_YEAR: {"value":"HALF_YEAR","code":3,"name":"半年付"},
  YEAR: {"value":"YEAR","code":4,"name":"年付"}
} as const;

export const OccupancyStatusEnumMeta = {
  AVAILABLE: {"value":"AVAILABLE","code":0,"name":"空置","color":"#FF2800"},
  LEASED: {"value":"LEASED","code":1,"name":"已租","color":"#52C41A"},
  BOOKED: {"value":"BOOKED","code":2,"name":"已预定","color":"#EAA212"},
  PREPARING: {"value":"PREPARING","code":3,"name":"配置中","color":"#4B50AD"}
} as const;

export const RoomFilterTypeEnumMeta = {
  BY_STATUS: {"value":"BY_STATUS","code":0,"desc":"按业务状态筛选"},
  BY_LOCKED: {"value":"BY_LOCKED","code":1,"desc":"按锁定状态筛选"},
  BY_CLOSED: {"value":"BY_CLOSED","code":2,"desc":"按关闭状态筛选"}
} as const;

export const RoomLockReasonEnumMeta = {
  PERMANENT: {"value":"PERMANENT","code":1,"name":"永久锁房"},
  SPECIFIED_TIME: {"value":"SPECIFIED_TIME","code":2,"name":"指定时间锁房"}
} as const;

export const RoomTypeEnumMeta = {
  MASTER_BEDROOM: {"value":"MASTER_BEDROOM","code":1,"name":"主卧","color":"#FF2800"},
  SECOND_BEDROOM: {"value":"SECOND_BEDROOM","code":2,"name":"次卧","color":"#52C41A"},
  BREAK: {"value":"BREAK","code":3,"name":"隔断","color":"#EAA212"},
  HALF_LIVING: {"value":"HALF_LIVING","code":4,"name":"厅隔","color":"#4B50AD"},
  SINGLE_SUIT: {"value":"SINGLE_SUIT","code":5,"name":"单间配套","color":"#DBDBDB"},
  SINGLE: {"value":"SINGLE","code":6,"name":"单间","color":"#DBDBDB"},
  DOUBLE: {"value":"DOUBLE","code":7,"name":"双人间","color":"#DBDBDB"},
  MULTI: {"value":"MULTI","code":8,"name":"多人间","color":"#DBDBDB"}
} as const;

export const SysMessageTypeEnumMeta = {
  SYSTEM: {"value":"SYSTEM","code":1,"name":"系统消息"},
  CONTRACT_REMIND: {"value":"CONTRACT_REMIND","code":2,"name":"租约提醒"},
  BILL_REMIND: {"value":"BILL_REMIND","code":3,"name":"缴费提醒"},
  REPAIR_NOTIFY: {"value":"REPAIR_NOTIFY","code":4,"name":"报修通知"},
  PRIVATE_CHAT: {"value":"PRIVATE_CHAT","code":5,"name":"私信"}
} as const;

export const SysNoticeTargetScopeEnumMeta = {
  ALL: {"value":"ALL","code":1,"name":"全员"},
  LANDLORD: {"value":"LANDLORD","code":2,"name":"房东"},
  TENANT: {"value":"TENANT","code":3,"name":"租客"},
  SPECIFIED_ROLE: {"value":"SPECIFIED_ROLE","code":4,"name":"指定角色"}
} as const;

export const SysNoticeTypeEnumMeta = {
  SYSTEM: {"value":"SYSTEM","code":1,"name":"系统公告"},
  OPERATION: {"value":"OPERATION","code":2,"name":"运营通知"}
} as const;

export const SysTodoTypeEnumMeta = {
  CONTRACT_EXPIRE: {"value":"CONTRACT_EXPIRE","code":1,"name":"租约到期"},
  BILL_COLLECTION: {"value":"BILL_COLLECTION","code":2,"name":"账单催收"},
  REPAIR_HANDLE: {"value":"REPAIR_HANDLE","code":3,"name":"报修处理"},
  CONTRACT_RENEW: {"value":"CONTRACT_RENEW","code":4,"name":"合同续签"},
  CHECKOUT_HANDLE: {"value":"CHECKOUT_HANDLE","code":5,"name":"退房办理"},
  OTHER: {"value":"OTHER","code":6,"name":"其他"}
} as const;

export const SysTodoPriorityEnumMeta = {
  HIGH: {"value":"HIGH","code":1,"name":"高"},
  MEDIUM: {"value":"MEDIUM","code":2,"name":"中"},
  LOW: {"value":"LOW","code":3,"name":"低"}
} as const;

export const SysTodoStatusEnumMeta = {
  PENDING: {"value":"PENDING","code":0,"name":"待处理"},
  DONE: {"value":"DONE","code":1,"name":"已处理"},
  IGNORED: {"value":"IGNORED","code":2,"name":"已忽略"},
  EXPIRED: {"value":"EXPIRED","code":3,"name":"已过期"}
} as const;

export const TenantTypeEnumMeta = {
  PERSONAL: {"value":"PERSONAL","code":0,"name":"个人租户"},
  ENTERPRISE: {"value":"ENTERPRISE","code":1,"name":"企业租户"}
} as const;
