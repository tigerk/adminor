import { reactive } from "vue";
import type { FormRules } from "element-plus";
import type { RoomLockFormItemProps } from "./types";

export function createRoomLockRules(formData: RoomLockFormItemProps) {
  return reactive<FormRules>({
    lockReason: [{ required: true, message: "请选择锁房原因", trigger: "change" }],
    startAt: [
      {
        validator: (_rule, value, callback) => {
          if (formData.lockReason !== 2) return callback();
          if (!value) return callback(new Error("请选择开始时间"));
          callback();
        },
        trigger: "change"
      }
    ],
    endAt: [
      {
        validator: (_rule, value, callback) => {
          if (formData.lockReason !== 2) return callback();
          if (!value) return callback(new Error("请选择结束时间"));
          if (formData.startAt && value < formData.startAt) {
            return callback(new Error("结束时间不能早于开始时间"));
          }
          callback();
        },
        trigger: "change"
      }
    ]
  });
}
