import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, ref } from "vue";
import { message } from "@/utils/message";
import { type OtherFeeDto, type PriceConfigDto, PriceMethodEnumMeta } from "@/types";
import PriceConfigDialog from "@/views/house/components/PriceConfig/PriceConfigDialog.vue";

function getDefaultOtherFee(): OtherFeeDto {
  return {
    roomId: "",
    dictDataId: null,
    name: null,
    paymentMethod: 0,
    /** 价格计算方式 */
    priceMethod: 1,
    /** 价格输入值 */
    priceInput: null
  };
}

export function usePriceConfigEdit() {
  const priceConfigFormRef = ref();

  function openPriceConfigDialog(title = "配置", row?: PriceConfigDto, onConfirm?: (data: any) => void) {
    // ✅ 先补默认值，再传给组件
    addDialog({
      title: `${title}租金配置`,
      props: {
        formInline: {
          floorPriceMethod: PriceMethodEnumMeta.RATIO.code, // 默认值兜底
          floorPriceInput: 0,
          otherFees: [],
          pricePlans: [],
          ...row // row 中有值时覆盖默认值
        }
      },
      top: "4%",
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
