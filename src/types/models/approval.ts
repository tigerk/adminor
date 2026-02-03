// ==================== 类型定义 ====================
import type { TenantDetailProps } from "@/types";

export interface ApprovalActionProps {
  id: string;
  nodeName: string;
  nodeOrder: number;
  approverName: string;
  approverId: string;
  action?: number;
  actionName?: string;
  remark?: string;
  operateTime?: string;
  status: number;
  statusName?: string;
}

export interface ApprovalInstanceProps {
  id: string;
  instanceNo: string; /** 审批实例编号 */
  bizType: string; /** 业务类型 */
  bizTypeName?: string; /** 业务类型名称 */
  bizId: string; /** 业务ID */
  title?: string; /** 审批标题 */
  applicantId: string; /** 申请人ID */
  applicantName: string; /** 申请人名称 */
  currentNodeOrder: number; /** 当前节点顺序 */
  currentNodeName: string; /** 当前节点名称 */
  status: number; /** 审批状态 */
  statusName: string; /** 审批状态名称 */
  resultRemark?: string; /** 审批结果备注 */
  finishTime?: string; /** 完成时间 */
  actions: ApprovalActionProps[]; /** 审批操作记录 */
  tenantDetail?: TenantDetailProps; /** 租户详情 */
  createTime: string; /** 创建时间 */
}

/**
 * 审批节点类型
 */
export interface ApprovalNodeProps {
  id?: string;
  nodeName: string;
  nodeOrder: number;
  approverType: number;
  approverIds: string[];
  multiApproveType: number;
}

/**
 * 表单项类型
 */
export interface ApprovalFormItemProps {
  id: string | null;
  flowName: string;
  bizType: string;
  enabled: boolean;
  remark: string;
  nodes: ApprovalNodeProps[];
}


