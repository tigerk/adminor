import EntireCreateForm from "./EntireCreateForm.vue";
import { addDialog, closeAllDialog, closeDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import type { ScatterCreateFormProps, ScatterHouseDetailProps } from "@/types";
import { createEntireHouse, getEntireHouseById } from "@/api/house/scatter";
import { message } from "@/utils/message";

export function useEntireEdit() {
  const entireForm = reactive({
    name: "",
    community: null,
    code: "",
    status: ""
  });

  const entireFormRef = ref();

  // 将 ScatterHouseDetailProps 转换为 ScatterCreateFormProps
  const convertToScatterCreateForm = (data: ScatterHouseDetailProps): ScatterCreateFormProps => {
    return {
      id: data.id,
      leaseMode: data.leaseMode,
      rentalType: data.rentalType,
      community: data.community,
      deptId: data.deptId,
      salesmanId: data.salesmanId,
      water: data.water,
      electricity: data.electricity,
      heating: data.heating,
      hasGas: data.hasGas,
      hasElevator: data.hasElevator,
      // 将完整的房源详情转换为 ScatterHouseProps 并放入 houseList
      houseList: [
        {
          id: data.id,
          companyId: data.companyId,
          leaseMode: data.leaseMode,
          rentalType: data.rentalType,
          community: data.community,
          houseCode: data.houseCode,
          building: data.building,
          unit: data.unit,
          doorNumber: data.doorNumber,
          floor: data.floor,
          floorTotal: data.floorTotal,
          direction: data.direction,
          area: data.area,
          decorationType: data.decorationType,
          propertyFee: data.propertyFee,
          water: data.water,
          electricity: data.electricity,
          heating: data.heating,
          hasElevator: data.hasElevator,
          hasGas: data.hasGas,
          houseLayout: data.houseLayout,
          deptId: data.deptId,
          salesmanId: data.salesmanId,
          roomList: data.roomList
        }
      ]
    };
  };

  /**
   * 打开整租房源编辑对话框
   * @param title 对话框标题（"新增" 或 "编辑"）
   * @param row 房源数据（如果是编辑模式则传入，新增模式则不传）
   */
  async function openEntireEditDialog(title = "新增", row?: { id?: string } | ScatterCreateFormProps) {
    let formInlineData: Partial<ScatterCreateFormProps> = {
      id: undefined,
      leaseMode: 2, // 分散式
      rentalType: 1, // 整租
      community: null,
      water: "residential",
      electricity: "residential",
      heating: "central",
      hasGas: true,
      hasElevator: false,
      deptId: undefined,
      salesmanId: undefined,
      houseList: []
    };

    // 如果是编辑模式（传入了 row 且有 id）
    if (row && "id" in row && row.id) {
      try {
        // 从后端获取完整数据
        const { data, code } = await getEntireHouseById({ id: row.id });

        if (code === 0 && data) {
          // 使用转换函数将 ScatterHouseDetailProps 转换为 ScatterCreateFormProps
          formInlineData = convertToScatterCreateForm(data);
        } else {
          message("获取房源数据失败", { type: "error" });
          return;
        }
      } catch (error) {
        console.error("获取房源数据失败:", error);
        message("获取房源数据失败", { type: "error" });
        return;
      }
    } else if (row && "houseList" in row) {
      // 如果传入了完整的数据对象（比如复制功能），直接使用
      formInlineData = {
        ...formInlineData,
        ...row,
        id: undefined // 新增时清除 id
      };
    }

    // 打开对话框
    addDialog({
      title: `${title}整租房源`,
      props: {
        formInline: formInlineData
      },
      top: "1%",
      width: "85%",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      footerRenderer: ({ options, index }) => (
        <div class="pt-4">
          <el-button plain onClick={() => closeDialog(options, index)}>
            取消
          </el-button>
          <el-button
            type="primary"
            onClick={async () => {
              // 调用表单验证
              if (entireFormRef.value) {
                const isValid = await entireFormRef.value.validateForm();
                if (isValid) {
                  // 整租：门牌号作为房间号
                  entireFormRef.value.houseList.forEach(house => {
                    house.roomList.forEach(room => {
                      room.roomNumber = house.doorNumber;
                      room.area = house.area;
                      room.direction = house.direction;
                    });
                  });

                  // 验证通过，执行保存逻辑
                  const formData = entireFormRef.value.entireForm;
                  const houseList = entireFormRef.value.houseList;

                  console.log("整租房源的表单数据:", formData);
                  console.log("整租房源的房源列表:", houseList);

                  // 调用API保存数据
                  await createEntireHouse({ ...formData, houseList }).then(resp => {
                    if (resp.code === 0) {
                      message(title === "新增" ? "新增成功" : "修改成功", { type: "success" });
                      closeDialog(options, index);
                    } else {
                      message(resp.message, { type: "error" });
                    }
                  });
                }
              }
            }}
          >
            保存并关闭
          </el-button>
        </div>
      ),
      contentRenderer: () =>
        h(EntireCreateForm, {
          ref: entireFormRef,
          formInline: formInlineData,
          onCreateSuccess: () => {
            closeAllDialog();
          }
        })
    });
  }

  return {
    entireForm,
    entireFormRef,
    openEntireEditDialog
  };
}
