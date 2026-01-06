// src/types/models/tenant.ts

/** 用户信息 */
export interface SysUserProps {
  companyUserId?: string; // 如果id不能同时代表userId和companyUserId，则需要额外添加
  userId?: string; // 同上
  deptId?: string; // 部门ID
  dept?: DeptSimpleProps; // 部门详情
  userType?: number; // 用户类型
  userTypeName?: string; // 用户类型名称
  username?: string; // 用户名（登录名）
  email?: string; // 邮箱号
  nickname?: string; // 昵称
  avatar?: string; // 头像
  birthday?: Date; // 出生日期，使用Date类型代替LocalDateTime
  status?: number; // 状态
  createTime?: Date; // 创建时间
  createBy?: string; // 创建人
  lastLoginTime?: Date; // 上次登录时间
  ipAddress?: string; // 最后登录IP地址
  ipSource?: string; // 最后登录IP来源
  registerSource?: string; // 注册来源
}

export interface DeptSimpleProps {
  id?: string; // 部门ID
  name?: string; // 部门名称
}
