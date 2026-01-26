// ==================== 类型定义 ====================
export interface ApprovalActionProps {
  id: number;
  nodeName: string;
  nodeOrder: number;
  approverName: string;
  approverId: number;
  action?: number;
  actionName?: string;
  remark?: string;
  operateTime?: string;
  status: number;
  statusName?: string;
}

export interface ApprovalInstanceProps {
  id: number;
  instanceNo: string;
  status: number;
  statusName: string;
  currentNodeOrder: number;
  currentNodeName: string;
  applicantName: string;
  createTime: string;
  finishTime?: string;
  resultRemark?: string;
  actions: ApprovalActionProps[];
}

/**
 * 审批节点类型
 */
export interface ApprovalNodeProps {
  id?: number;
  nodeName: string;
  nodeOrder: number;
  approverType: number;
  approverIds: number[];
  multiApproveType: number;
}

/**
 * 表单项类型
 */
export interface ApprovalFormItemProps {
  id: number | null;
  flowName: string;
  bizType: string;
  enabled: boolean;
  remark: string;
  nodes: ApprovalNodeProps[];
}
