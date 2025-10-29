import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, ref } from "vue";
import { message } from "@/utils/message";
import type { OtherFeeProps, PriceConfigProps } from "@/types";
import PriceConfigDialog from "@/views/house/components/PriceConfig/PriceConfigDialog.vue";

function getDefaultOtherFee(): OtherFeeProps {
  return {
    dicDataId: null,
    name: null,
    paymentMethod: 1,
    /** 价格计算方式 */
    priceMethod: 1,
    /** 价格输入值 */
    priceInput: null
  };
}

export function usePriceConfigEdit() {
  const priceConfigFormRef = ref();

  function openPriceConfigDialog(title = "配置", row?: PriceConfigProps, onConfirm?: (data: any) => void) {
    addDialog({
      title: `${title}租金配置`,
      props: {
        formInline: row ?? {}
      },
      top: "2%",
      width: "900px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(PriceConfigDialog, { ref: priceConfigFormRef, formInline: row }),
      beforeSure: (done, { options }) => {
        const result = priceConfigFormRef.value.getRef();

        console.log("租金配置结果:", result);

        // 调用回调函数，将结果传回父组件
        if (onConfirm) {
          onConfirm(result);
        }

        done(); // 关闭弹框

        message("保存成功", { type: "success" });
      }
    });
  }

  return {
    priceConfigFormRef,
    openPriceConfigDialog,
    getDefaultOtherFee
  };
}
