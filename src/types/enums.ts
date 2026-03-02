/** 布尔枚举 */
export enum BooleanEnum {
  FALSE = 0,
  TRUE = 1
}

/** 删除枚举 */
export enum DeletedEnum {
  NOT_DELETED = 0,
  DELETED = 1
}

/** 性别枚举 */
export enum GenderEnum {
  UNKNOWN = 0, // 未知
  MALE = 1, // 男
  FEMALE = 2 // 女
}

/** 证件类型枚举 */
export enum IdTypeEnum {
  ID_CARD = 0, // 身份证
  PASSPORT = 1, // 护照
  HONGKONG_MACAO = 2, // 港澳通行证
  TAIWAN = 3 // 台胞证
}

/** 限流类型 */
export enum LimitType {
  DEFAULT = "DEFAULT", // 默认策略全局限流
  IP = "IP" // 根据请求者IP进行限流
}

/** 菜单类型 */
export enum MenuTypeEnum {
  MENU = 0, // 菜单
  IFRAME = 1, // Iframe
  EXTERNAL_LINK = 2, // 外链
  BUTTON = 3 // 按钮
}

/** 通知类型 */
export enum NoticeTypeEnum {
  NOTIFICATION = 1, // 通知
  PUBLIC = 2 // 公告
}

/** 业务操作类型 */
export enum OperationTypeEnum {
  OTHER = 0, // 其它
  INSERT = 1, // 新增
  UPDATE = 2, // 修改
  DELETE = 3, // 删除
  GRANT = 4, // 授权
  EXPORT = 5, // 导出
  IMPORT = 6, // 导入
  FORCE = 7, // 强退
  CLEAR = 8 // 清空数据
}

/** 操作人类别 */
export enum OperatorTypeEnum {
  OTHER = 0, // 其它
  MANAGE = 1 // 后台用户
}

/** 公告通知已读未读状态 */
export enum ReadStatusEnum {
  UNREAD = 0, // 未读
  READ = 1 // 已读
}

/** 初始角色枚举 */
export enum RoleDefaultEnum {
  PLATFORM_SUPER_ADMIN = 1,
  COMPANY_ADMIN = 2,
  USER = 3
}

/** 用户类型（SaaS） */
export enum SaasUserTypeEnum {
  COMPANY_ADMIN = 20, // 公司管理员
  COMPANY_USER = 21 // 公司用户
}

/** 状态枚举 */
export enum StatusEnum {
  DISABLED = 0, // 停用
  ACTIVE = 1 // 正常，生效中
}

/** 时区枚举 */
export enum ZoneEnum {
  SHANGHAI = "Asia/Shanghai"
}

// ==================== 审批相关 ====================

/** 审批动作状态枚举 */
export enum ApprovalActionStatusEnum {
  PENDING = 0, // 待审批
  APPROVED = 1, // 已审批
  SKIPPED = 2 // 已跳过
}

/** 审批操作类型枚举 */
export enum ApprovalActionTypeEnum {
  APPROVE = 1, // 通过
  REJECT = 2, // 驳回
  TRANSFER = 3 // 转交
}

/** 审批业务类型枚举 */
export enum ApprovalBizTypeEnum {
  TENANT_CHECKIN = "TENANT_CHECKIN", // 租客入住
  TENANT_CHECKOUT = "TENANT_CHECKOUT", // 租客退租
  HOUSE_CREATE = "HOUSE_CREATE" // 房源录入
}

/** 审批实例状态枚举 */
export enum ApprovalInstanceStatusEnum {
  DRAFT = 0, // 待提交
  PENDING = 1, // 审批中
  APPROVED = 2, // 已通过
  REJECTED = 3, // 已驳回
  WITHDRAWN = 4, // 已撤回
  CANCELLED = 5 // 已取消
}

/** 审批人类型枚举 */
export enum ApproverTypeEnum {
  SPECIFIC_USER = 1, // 指定用户
  SPECIFIC_ROLE = 2, // 指定角色
  DEPARTMENT_SUPERVISOR = 3, // 部门主管
  SELF_OPTION = 4 // 发起人自选
}

/** 业务审批状态枚举 */
export enum BizApprovalStatusEnum {
  PENDING = 1, // 审批中
  APPROVED = 2, // 已通过
  REJECTED = 3, // 已驳回
  WITHDRAWN = 4 // 已撤回
}

/** 多人审批枚举 */
export enum MultiApproveEnum {
  OR_SIGN = 1, // 或签（一人通过即可）
  AND_SIGN = 2 // 会签（所有人通过）
}

// ==================== 预定相关 ====================

/** 预定状态枚举 */
export enum BookingStatusEnum {
  BOOKING = 1, // 预定中
  CONTRACTED = 2, // 已转合同
  TENANT_DEFAULTED = 3, // 客户违约
  OWNER_DEFAULTED = 4, // 业主违约
  CANCELLED_EXPIRED = 5 // 已取消/过期
}

// ==================== 退租相关 ====================

/** 退租费用类型枚举 */
export enum CheckoutFeeTypeEnum {
  // 收入（扣款）方向
  RENT = 1, // 租金
  DEPOSIT = 2, // 押金
  WATER = 3, // 水费
  ELECTRIC = 4, // 电费
  GAS = 5, // 燃气费
  PROPERTY_FEE = 6, // 物业费
  CLEANING = 7, // 清洁费
  DAMAGE = 8, // 物品损坏
  PENALTY = 9, // 违约金
  OTHER = 10, // 其他费用
  // 支出（退款）方向
  RENT_REFUND = 51, // 租金退款
  DEPOSIT_REFUND = 52, // 押金退款
  OTHER_REFUND = 53 // 其他退款
}

/** 退租账单处理方式枚举 */
export enum CheckoutSettlementMethodEnum {
  GENERATE_BILL = 1, // 生成待付账单
  OFFLINE_PAYMENT = 2, // 线下付款
  APPLY_PAYMENT = 3, // 申请付款
  BAD_DEBT = 4 // 标记坏账
}

/** 退租单状态枚举 */
export enum CheckoutStatusEnum {
  DRAFT = 0, // 草稿
  PENDING = 1, // 待确认
  COMPLETED = 2, // 已完成
  CANCELLED = 3 // 已取消
}

/** 退租类型枚举 */
export enum CheckoutTypeEnum {
  NORMAL = 1, // 正常退
  BREACH = 2 // 违约退
}

// ==================== 企业相关 ====================

/** 企业性质枚举 */
export enum CompanyNatureEnum {
  ENTERPRISE = 1, // 企业
  PERSONAL = 2 // 个人
}

// ==================== 合同相关 ====================

/** 合同性质枚举 */
export enum ContractNatureEnum {
  NEW_SIGN = 1, // 新签
  RENEWAL = 2, // 续签
  SUBLET = 3, // 转租
  RELOCATION = 4 // 换房
}

/** 合同模板状态枚举 */
export enum ContractTemplateStatusEnum {
  UNEFFECTIVE = 0, // 未启用
  EFFECTIVE = 1 // 已启用
}

/** 合同模板类型枚举 */
export enum ContractTypeEnum {
  TENANT = 1, // 租客
  OWNER = 2, // 房东
  BOOKING = 3, // 预定
  CHECKOUT = 4 // 退租
}

// ==================== 交割单相关 ====================

/** 交割单状态枚举 */
export enum DeliveryStatusEnum {
  CANCELLED = -1, // 作废
  DRAFT = 0, // 待填写
  COMPLETED = 1, // 已填写
  SIGNED = 2 // 已签署
}

// ==================== 文件相关 ====================

/** 文件类型枚举 */
export enum FileTypeEnum {
  IMAGE = 0,
  VIDEO = 1,
  PDF = 2
}

// ==================== 房源相关 ====================

/** 装修类型枚举 */
export enum DecorationTypeEnum {
  LUXURY = 1, // 豪华装
  SIMPLE = 2, // 简装
  DETAILED = 3, // 精装
  RAW = 4, // 毛坯
  WATER = 5, // 清水
  SIMPLEST = 6, // 简约
  UNDECORATED = 7 // 未装修
}

/** 运营模式枚举 */
export enum LeaseModeEnum {
  UNKNOWN = 0, // 未知
  FOCUS = 1, // 集中式
  SCATTER = 2 // 分散式
}

/** 租赁类型枚举 */
export enum RentalTypeEnum {
  ENTIRE = 1, // 整租
  SHARED = 2 // 合租
}

// ==================== 租约相关 ====================

/** 账单类型枚举 */
export enum LeaseBillTypeEnum {
  RENT = 1, // 租金
  DEPOSIT = 2, // 押金
  OTHER_FEE = 3, // 杂费
  RELEASE = 4, // 退租结算
  DEPOSIT_CARRY_IN = 5, // 押金结转入
  DEPOSIT_CARRY_OUT = 6 // 押金结转出
}

/** 租户退租状态枚举 */
export enum LeaseCheckOutStatusEnum {
  UN_CHECK_OUT = 0, // 未退租
  NORMAL_CHECK_OUT = 1, // 正常退
  BREAK_CHECK_OUT = 2, // 违约退
  RENEW_CHECK_OUT = 3, // 续约退
  RELOCATION_CHECK_OUT = 4, // 换房退
  SUBLET_CHECK_OUT = 5 // 转租退
}

/** 首期账单收租日枚举 */
export enum LeaseFirstBillDayEnum {
  FOLLOW_CONTRACT_START = 0, // 跟随合同起租日
  FOLLOW_CONTRACT_CREATE = 1 // 跟随合同创建日
}

/** 收租类型枚举 */
export enum LeaseRentDueTypeEnum {
  EARLY = 1, // 提前
  FIXED = 2, // 固定
  LATE = 3 // 延后
}

/** 租客状态枚举 */
export enum LeaseStatusEnum {
  PENDING_APPROVAL = 0, // 待审批
  TO_SIGN = 1, // 待签字
  EFFECTIVE = 2, // 在租中
  TERMINATED = 3, // 已退租
  CANCELLED = -1 // 已作废
}

// ==================== 支付相关 ====================

/** 支付状态枚举 */
export enum PayStatusEnum {
  UNPAID = 0, // 未支付
  PARTIALLY_PAID = 1, // 部分支付
  PAID = 2 // 已支付
}

/** 支付方式枚举 */
export enum PaymentMethodEnum {
  RENT = 0, // 随房租付
  ALL = 1, // 一次性全支付
  MONTH = 2, // 月付
  BI_MONTH = 3, // 2月付
  QUARTER = 4, // 季付
  HALF_YEAR = 5, // 半年付
  YEAR = 6 // 年付
}

/** 计算方式枚举 */
export enum PriceMethodEnum {
  FIXED = 1, // 按固定金额
  RATIO = 2 // 按租金比例
}

/** 价格方案枚举 */
export enum PricePlanEnum {
  MONTH = 0, // 月付
  TWO_MONTH = 1, // 2月付
  QUARTER = 2, // 季付
  HALF_YEAR = 3, // 半年付
  YEAR = 4 // 年付
}

// ==================== 平台用户相关 ====================

/** 平台用户类型枚举 */
export enum PlatformUserTypeEnum {
  SUPER_USER = 10, // 超级管理员
  REGULAR_USER = 20 // 普通用户
}

// ==================== 房间相关 ====================

/** 房间状态枚举 */
export enum OccupancyStatusEnum {
  AVAILABLE = 0, // 空置
  LEASED = 1, // 已租
  BOOKED = 2, // 已预定
  PREPARING = 3 // 配置中
}

/** 房间类型枚举 */
export enum RoomTypeEnum {
  MASTER_BEDROOM = 1, // 主卧
  SECOND_BEDROOM = 2, // 次卧
  BREAK = 3, // 隔断
  HALF_LIVING = 4, // 厅隔
  SINGLE_SUIT = 5, // 单间配套
  SINGLE = 6, // 单间
  DOUBLE = 7, // 双人间
  MULTI = 8 // 多人间
}

// ==================== 系统消息/通知/待办相关 ====================

/** 个人消息类型枚举 */
export enum SysMessageTypeEnum {
  SYSTEM = 1, // 系统消息
  CONTRACT_REMIND = 2, // 租约提醒
  BILL_REMIND = 3, // 缴费提醒
  REPAIR_NOTIFY = 4, // 报修通知
  PRIVATE_CHAT = 5 // 私信
}

/** 系统公告发布范围枚举 */
export enum SysNoticeTargetScopeEnum {
  ALL = 1, // 全员
  LANDLORD = 2, // 房东
  TENANT = 3, // 租客
  SPECIFIED_ROLE = 4 // 指定角色
}

/** 系统公告类型枚举 */
export enum SysNoticeTypeEnum {
  SYSTEM = 1, // 系统公告
  OPERATION = 2 // 运营通知
}

/** 待办类型枚举 */
export enum SysTodoTypeEnum {
  CONTRACT_EXPIRE = 1, // 租约到期
  BILL_COLLECTION = 2, // 账单催收
  REPAIR_HANDLE = 3, // 报修处理
  CONTRACT_RENEW = 4, // 合同续签
  CHECKOUT_HANDLE = 5, // 退房办理
  OTHER = 6 // 其他
}

/** 待办优先级枚举 */
export enum SysTodoPriorityEnum {
  HIGH = 1, // 高
  MEDIUM = 2, // 中
  LOW = 3 // 低
}

/** 待办状态枚举 */
export enum SysTodoStatusEnum {
  PENDING = 0, // 待处理
  DONE = 1, // 已处理
  IGNORED = 2, // 已忽略
  EXPIRED = 3 // 已过期
}

// ==================== 租客相关 ====================

/** 租客类型枚举 */
export enum TenantTypeEnum {
  PERSONAL = 0, // 个人租户
  ENTERPRISE = 1 // 企业租户
}
