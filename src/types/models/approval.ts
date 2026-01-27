// ==================== 类型定义 ====================
export interface ApprovalActionProps {
  id: bigint;
  nodeName: string;
  nodeOrder: number;
  approverName: string;
  approverId: bigint;
  action?: number;
  actionName?: string;
  remark?: string;
  operateTime?: string;
  status: number;
  statusName?: string;
}

export interface ApprovalInstanceProps {
  id: bigint;
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
  id?: bigint;
  nodeName: string;
  nodeOrder: number;
  approverType: number;
  approverIds: bigint[];
  multiApproveType: number;
}

/**
 * 表单项类型
 */
export interface ApprovalFormItemProps {
  id: bigint | null;
  flowName: string;
  bizType: string;
  enabled: boolean;
  remark: string;
  nodes: ApprovalNodeProps[];
}
