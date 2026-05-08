import { h, ref } from "vue";
import dayjs from "dayjs";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { checkoutOwnerContract, createOwnerContract, getOwnerContractDetail, renewOwnerContract, updateOwnerContract } from "@/api/contract/owner";
import OwnerContractFormDialog from "@/views/contract/owner/form/OwnerContractFormDialog.vue";
import OwnerContractCheckoutDialog from "@/views/contract/owner/form/OwnerContractCheckoutDialog.vue";
import type { OwnerContractIdDto, OwnerDetailVo, OwnerListVo, OwnerUpdateDto } from "@/types/generated";

function useOwnerContract() {
  const formRef = ref();

  function resolveSubmitErrorMessage(error: any) {
    if (!error) return "请检查表单必填项后再提交";
    if (typeof error === "string") return error;
    if (typeof error?.message === "string" && error.message) return error.message;

    const fieldErrors = error?.fields;
    if (fieldErrors && typeof fieldErrors === "object") {
      const firstFieldKey = Object.keys(fieldErrors)[0];
      const firstFieldErrors = firstFieldKey ? fieldErrors[firstFieldKey] : undefined;
      const firstMessage = Array.isArray(firstFieldErrors) ? firstFieldErrors[0]?.message : firstFieldErrors?.message;
      if (firstMessage) return firstMessage;
    }

    return "请检查表单必填项后再提交";
  }

  function hasRealtimeRentSettlementItem(rule: any) {
    return Boolean(
      rule?.settlementItemList?.some(
        (item: any) => item?.transferEnabled === true && item?.feeDirection === "IN" && item?.feeType === "RENTAL" && Number(item?.transferRatio || 0) > 0
      )
    );
  }

  function validateRealtimeSettlementItems(payload: any) {
    if (payload?.ownerContract?.cooperationMode !== "LIGHT_MANAGED") return;
    const subjectList = Array.isArray(payload?.contractSubjectList) ? payload.contractSubjectList : [];
    for (const subject of subjectList) {
      const rule = subject?.settlementRule;
      if (!rule) throw new Error("请配置轻托管结算规则");
      if (rule.settlementTiming !== "TENANT_PAYMENT_REALTIME") continue;
      if (!hasRealtimeRentSettlementItem(rule)) {
        throw new Error("租客支付实时分账需要添加“租金”收入分账费用科目，管理费比例只用于扣减管理费");
      }
    }
  }

  function openOwnerDialog(title = "添加业主合同", row?: { contractId?: string | number; isEdit?: boolean } | OwnerDetailVo | null, onSuccess?: () => void) {
    const isEdit = Boolean((row as { isEdit?: boolean } | undefined)?.isEdit);

    if ((row as { contractId?: string | number } | undefined)?.contractId && !("ownerContract" in (row || {}))) {
      getOwnerContractDetail({ contractId: (row as { contractId?: string | number }).contractId } as OwnerContractIdDto).then(resp => {
        if (resp.code === 0) {
          innerOpenOwnerDialog(title, (resp.data || null) as OwnerDetailVo | null, isEdit, onSuccess);
        } else {
          message(resp.message || "获取业主合同详情失败", { type: "error" });
        }
      });
      return;
    }

    innerOpenOwnerDialog(title, (row as OwnerDetailVo | null) || null, isEdit, onSuccess);
  }

  function innerOpenOwnerDialog(title = "添加业主合同", row?: OwnerDetailVo | null, isEdit = false, onSuccess?: () => void) {
    addDialog({
      title,
      props: {
        formInline: row,
        isEdit
      },
      top: "1vh",
      width: "1180px",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      destroyOnClose: true,
      contentRenderer: () => h(OwnerContractFormDialog, { ref: formRef, formInline: row || null, isEdit }),
      beforeSure: async done => {
        const formInstance = formRef.value;
        try {
          if (!formInstance?.validateAndBuildPayload) {
            message("表单未初始化完成，请稍后再试", { type: "warning" });
            return;
          }
          const payload = await formInstance?.validateAndBuildPayload?.();
          if (!payload) {
            message("请填写完整信息", { type: "warning" });
            return;
          }
          validateRealtimeSettlementItems(payload);

          const resp = isEdit ? await updateOwnerContract(payload as OwnerUpdateDto) : await createOwnerContract(payload);
          if (resp.code === 0) {
            const cooperationMode = formInstance?.form?.ownerContract?.cooperationMode;
            const successText =
              cooperationMode === "MASTER_LEASE"
                ? isEdit
                  ? "业主合同更新成功，包租账单计划已自动重建"
                  : "业主合同创建成功，包租账单计划已自动生成"
                : isEdit
                  ? "业主合同更新成功"
                  : "业主合同创建成功";
            message(successText, { type: "success" });
            onSuccess?.();
            done();
          } else {
            message(resp.message || (isEdit ? "业主合同更新失败" : "业主合同创建失败"), { type: "error" });
          }
        } catch (error: any) {
          const formEl = formInstance?.getRef?.();
          const firstFieldKey = error?.fields ? Object.keys(error.fields)[0] : "";
          if (firstFieldKey) formEl?.scrollToField?.(firstFieldKey);
          message(resolveSubmitErrorMessage(error), { type: "warning" });
        }
      }
    });
  }

  function openOwnerRenewDialog(row?: { contractId?: string | number } | null, onSuccess?: () => void) {
    if (!row?.contractId) return;
    getOwnerContractDetail({ contractId: row.contractId } as OwnerContractIdDto).then(resp => {
      if (resp.code !== 0 || !resp.data) {
        message(resp.message || "获取业主合同详情失败", { type: "error" });
        return;
      }
      const sourceContractId = row.contractId;
      const detail = resp.data as OwnerDetailVo;
      const contract = (detail.ownerContract || {}) as any;
      const renewStart = contract.contractEnd ? dayjs(contract.contractEnd).add(1, "day").format("YYYY-MM-DD") : "";
      const renewEnd = contract.contractEnd ? dayjs(contract.contractEnd).add(1, "year").format("YYYY-MM-DD") : "";
      const renewDetail = {
        ...detail,
        ownerContract: {
          ...contract,
          contractStart: renewStart,
          contractEnd: renewEnd,
          contractNature: 2,
          signStatus: 0,
          status: 1
        }
      } as OwnerDetailVo;

      addDialog({
        title: "业主续约",
        props: {
          formInline: renewDetail,
          isEdit: false
        },
        top: "1vh",
        width: "1180px",
        lockScroll: true,
        alignCenter: true,
        draggable: true,
        fullscreen: deviceDetection(),
        fullscreenIcon: true,
        closeOnClickModal: false,
        destroyOnClose: true,
        contentRenderer: () => h(OwnerContractFormDialog, { ref: formRef, formInline: renewDetail, isEdit: false }),
        beforeSure: async done => {
          const formInstance = formRef.value;
          try {
            const payload = await formInstance?.validateAndBuildPayload?.();
            if (!payload) {
              message("请填写完整信息", { type: "warning" });
              return;
            }
            validateRealtimeSettlementItems(payload);
            const result = await renewOwnerContract({ ...(payload as any), sourceContractId });
            if (result.code === 0) {
              message("业主续约成功", { type: "success" });
              onSuccess?.();
              done();
            } else {
              message(result.message || "业主续约失败", { type: "error" });
            }
          } catch (error: any) {
            const formEl = formInstance?.getRef?.();
            const firstFieldKey = error?.fields ? Object.keys(error.fields)[0] : "";
            if (firstFieldKey) formEl?.scrollToField?.(firstFieldKey);
            message(resolveSubmitErrorMessage(error), { type: "warning" });
          }
        }
      });
    });
  }

  /**
   * @description 打开业主退房对话框
   * @param row
   * @param onSuccess
   */
  function openOwnerCheckoutDialog(row?: (OwnerListVo & { contractId?: string | number }) | null, onSuccess?: () => void) {
    if (!row?.contractId) return;
    const checkoutFormRef = ref();
    addDialog({
      title: "业主退房",
      props: {
        formInline: row
      },
      width: "720px",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreenIcon: true,
      closeOnClickModal: false,
      destroyOnClose: true,
      contentRenderer: () => h(OwnerContractCheckoutDialog, { ref: checkoutFormRef, formInline: row }),
      beforeSure: async done => {
        try {
          const payload = await checkoutFormRef.value?.validateAndBuildPayload?.();
          const resp = await checkoutOwnerContract(payload);
          if (resp.code === 0) {
            message("业主退房已完成", { type: "success" });
            onSuccess?.();
            done();
          } else {
            message(resp.message || "业主退房失败", { type: "error" });
          }
        } catch (error: any) {
          message(resolveSubmitErrorMessage(error), { type: "warning" });
        }
      }
    });
  }

  return {
    openOwnerDialog,
    openOwnerRenewDialog,
    openOwnerCheckoutDialog
  };
}

export default useOwnerContract;
