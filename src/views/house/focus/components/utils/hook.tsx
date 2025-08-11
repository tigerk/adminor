import FocusCreateForm from "../FocusCreateForm.vue";
import { addDialog } from "@/components/ReDialog/index";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import { message } from "@/utils/message";
import type { FormItemProps } from "@/views/house/focus/components/utils/types";
import { createFocusHouse } from "@/api/house/focus";

export function useFocusEdit() {
  const form = reactive({
    name: "",
    code: "",
    status: ""
  });

  const formRef = ref();

  function openFocusEditDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}项目`,
      props: {
        formInline: {
          houseName: row?.houseName ?? ""
        }
      },
      top: "1%",
      width: "85%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      footerRenderer: () => null,
      contentRenderer: () => h(FocusCreateForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;

        function chores() {
          message(`您${title}了角色名称为${curData.houseName}的这条数据`, {
            type: "success"
          });
          done(); // 关闭弹框
        }

        FormRef.validate(valid => {
          if (valid) {
            console.log("curData", curData);
            // 表单规则校验通过
            if (title === "新增") {
              // 实际开发先调用新增接口，再进行下面操作
              chores();
            } else {
              // 实际开发先调用修改接口，再进行下面操作
              chores();
            }
          }
        });
      }
    });
  }

  function saveFocusHouse(row?: FormItemProps) {
    // 创建一个可序列化的数据副本
    const requestData = {
      ...row,
      roomList: []
    };

    // 将 Map 转换为普通对象
    if (row.roomsStatusOfFloors instanceof Map) {
      row.roomsStatusOfFloors.forEach((roomMap, floor) => {
        if (roomMap instanceof Map) {
          roomMap.forEach((roomStatus, index) => {
            requestData.roomList.push({
              roomNumber: formatRoomNumber(row.roomPrefix, row.roomNumberLength, floor, roomStatus.roomNumber),
              locked: roomStatus.locked,
              floorLevel: floor
            });
          });
        }
      });
    }

    let id: number = 0;
    createFocusHouse(requestData).then(resp => {
      if (resp.code === 0) {
        message(`您保存了项目名称为${row.houseName}的这条数据，请您配置房间！`, {
          type: "success"
        });

        id = resp.data;
      }
    });

    return id;
  }

  // 格式化房间编号
  const formatRoomNumber = (roomPrefix: string, roomNumberLength: number, selectedFloor: number, num: string) => {
    const tmp = Math.min(2, num.toString().length);

    const prefix = roomNumberLength - tmp;
    return (roomPrefix ? roomPrefix : "") + String(selectedFloor).padEnd(prefix, "0") + num.padStart(tmp, "0");
  };

  return {
    form,
    formRef,
    openFocusEditDialog,
    saveFocusHouse,
    formatRoomNumber
  };
}
