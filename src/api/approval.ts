import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import { ApiListResponse, ApiResponse, CodeNameProps } from "@/types";

/** 审批流程相关 API */

// 获取审批流程列表
export const getApprovalFlowList = () => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/flow/list"), { data: {} });
};

// 获取审批流程详情
export const getApprovalFlowDetail = (flowId: number) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/flow/detail"), { data: { flowId } });
};

// 保存审批流程
export const saveApprovalFlow = (data: any) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/flow/save"), { data });
};

// 删除审批流程
export const deleteApprovalFlow = (flowId: number) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/flow/delete"), { data: { flowId } });
};

// 启用/停用审批流程
export const toggleApprovalFlowStatus = (flowId: number) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/flow/toggle"), { data: { flowId } });
};

// 获取业务类型选项
export const getBizTypeOptions = () => {
  return http.request<ApiListResponse<CodeNameProps>>("post", baseUrlApi("approval/flow/biz-types"));
};

/** 审批操作相关 API */

// 检查业务是否需要审批
export const checkNeedApproval = (data: { bizType: string }) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/check"), { data });
};

// 提交审批
export const submitApproval = (data: any) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/submit"), { data });
};

// 处理审批（通过/驳回）
export const handleApproval = (data: any) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/handle"), { data });
};

// 撤回审批
export const withdrawApproval = (instanceId: number) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/withdraw"), { data: { instanceId } });
};

/** 审批查询相关 API */

// 获取业务的审批实例
export const getApprovalInstance = (bizType: string, bizId: number) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/instance/biz"), { data: { bizType, bizId } });
};

// 获取审批实例详情
export const getApprovalInstanceDetail = (instanceId: number) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/instance/detail"), { data: { instanceId } });
};

// 获取我的待办列表
export const getTodoList = (params: any) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/todo/list"), { data: params });
};

// 获取我的待办数量
export const getTodoCount = () => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/todo/count"));
};

// 获取我的已办列表
export const getDoneList = (params: any) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/done/list"), { data: params });
};

// 获取我发起的审批列表
export const getApplyList = (params: any) => {
  return http.request<ApiResponse>("post", baseUrlApi("approval/apply/list"), { data: params });
};
