import { h, ref } from "vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import HouseLayoutManageDialog from "./HouseLayoutManageDialog.vue";
import type { FacilityItemProps, HouseLayoutProps } from "@/types";

export function useHouseLayoutManage() {
  const layoutManageFormRef = ref();

  /**
   * 打开房型管理对话框
   * @param title 对话框标题前缀
   * @param row 房型数据
   * @param onConfirm 确认回调函数
   */
  function openHouseLayoutManageDialog(title: "创建" | "编辑" = "创建", row?: HouseLayoutProps, onConfirm?: (data: HouseLayoutProps) => void) {
    // 将 HouseLayoutProps 转换为表单需要的格式
    const formInline = row
      ? {
          id: row.id,
          name: row.layoutName,
          layout: `${row.bedroom}室${row.livingRoom}厅${row.kitchen}厨${row.bathroom}卫`,
          tags: row.tags || [],
          facilities: row.facilities || []
        }
      : {
          id: "",
          name: "",
          layout: "",
          tags: [],
          facilities: []
        };

    addDialog({
      title: `${title}房型`,
      props: {
        formInline
      },
      top: "1%",
      width: "800px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () =>
        h(HouseLayoutManageDialog, {
          ref: layoutManageFormRef,
          formInline
        }),
      beforeSure: async done => {
        try {
          const result = await layoutManageFormRef.value.getRef();

          if (onConfirm) {
            onConfirm(result);
          }

          done(); // 关闭对话框
          message(`房型${title}成功`, { type: "success" });
        } catch (error) {
          console.error("表单验证失败:", error);
          message(error.message || "请完善表单信息", { type: "warning" });
        }
      }
    });
  }

  return {
    layoutManageFormRef,
    openHouseLayoutManageDialog
  };
}
