import { h, ref } from "vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { lockRoom } from "@/api/house/room";
import { message } from "@/utils/message";
import type { RoomListVo } from "@/types";
import editForm from "./form.vue";
import type { RoomLockFormItemProps } from "./utils/types";

export function useRoomLock() {
  const formRef = ref();

  function openRoomLockDialog(room: RoomListVo, onSuccess?: () => void) {
    addDialog({
      title: "锁定房间",
      props: {
        formInline: {
          roomId: String(room.roomId ?? ""),
          roomNumber: room.roomNumber ?? "",
          houseName: room.houseName ?? "",
          lockReason: 1,
          startAt: "",
          endAt: "",
          remark: ""
        }
      },
      width: "520px",
      top: "8vh",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const formInstance = formRef.value.getRef();
        const curData = options.props.formInline as RoomLockFormItemProps;

        formInstance.validate(async valid => {
          if (!valid) return;

          const resp = await lockRoom({
            roomId: curData.roomId,
            lockReason: curData.lockReason,
            startAt: curData.lockReason === 2 ? curData.startAt : undefined,
            endAt: curData.lockReason === 2 ? curData.endAt : undefined,
            remark: curData.remark
          });

          if (resp.code === 0) {
            message(`房间 ${curData.roomNumber} 已锁定`, { type: "success" });
            done();
            onSuccess?.();
          } else {
            message(resp.message || "锁房失败", { type: "error" });
          }
        });
      }
    });
  }

  return {
    openRoomLockDialog
  };
}
