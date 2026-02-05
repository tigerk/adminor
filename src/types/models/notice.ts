// 系统通知相关模型

export interface SysMessageProps {
  id?: number;
  title?: string;
  content?: string;
  msgType?: number;
  bizType?: string;
  bizId?: number;
  isRead?: boolean;
  createTime?: string;
}

export interface SysNoticeProps {
  id?: number;
  title?: string;
  content?: string;
  noticeType?: number;
  status?: number;
  publishTime?: string;
}

export interface SysTodoProps {
  id?: number;
  title?: string;
  content?: string;
  todoType?: number;
  status?: number;
  deadline?: string;
  createTime?: string;
}
