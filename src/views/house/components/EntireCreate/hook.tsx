import EntireCreateForm from "./EntireCreateForm.vue";
import { addDialog, closeAllDialog, closeDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import type { ScatterCreateDto, ScatterHouseDto, HouseDetailVo, RoomDetailVo, RoomCreateDto } from "@/types";
import { createEntireHouse, getEntireHouseDetailById } from "@/api/house/scatter";
import { message } from "@/utils/message";

export function useEntireEdit() {
  const entireForm = reactive({
    name: "",
    community: null,
    code: "",
    status: ""
  });

  const entireFormRef = ref();

  /**
   * 将 RoomDetailVo 转换为 RoomCreateDto
   */
  const convertRoomDetailToCreateDto = (room: RoomDetailVo): RoomCreateDto => {
    return {
      id: room.id,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      area: room.area,
      direction: room.direction,
      price: room.price,
      availableDate: room.availableDate,
      vacancyStartTime: room.vacancyStartTime,
      remark: room.remark,
      facilities: room.facilities ?? [],
      tags: room.tags ?? [],
      imageList: room.imageList ?? [],
      videoList: room.videoList ?? [],
      priceConfig: room.priceConfig
    };
  };

  /**
   * 将 HouseDetailVo 转换为 ScatterHouseDto（单个房源）
   */
  const convertToScatterHouseDto = (data: HouseDetailVo): ScatterHouseDto => {
    return {
      id: data.id,
      houseCode: data.houseCode,
      rentalType: data.rentalType,
      building: data.building,
      unit: data.unit,
      doorNumber: data.doorNumber,
      floor: data.floor,
      floorTotal: data.floorTotal,
      direction: data.direction,
      area: data.area, // number | undefined，类型一致
      decorationType: data.decorationType, // number | undefined，类型一致
      propertyFee: data.propertyFee,
      houseLayout: data.houseLayout ?? {
        livingRoom: 0,
        bedroom: 0,
        bathroom: 0,
        kitchen: 0,
        imageList: [],
        tags: [],
        facilities: []
      },
      roomList: (data.roomList ?? []).map(convertRoomDetailToCreateDto),
      locked: data.locked,
      closed: data.closed
    };
  };

  /**
   * 将 HouseDetailVo 转换为 ScatterCreateDto（整租表单数据）
   * 注意：ScatterCreateDto 本身不含 id 字段，id 保存在 houseList[0].id 中
   */
  const convertToScatterCreateDto = (data: HouseDetailVo): ScatterCreateDto => {
    return {
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
      houseList: [convertToScatterHouseDto(data)]
    };
  };

  /** 默认的整租表单初始值 */
  const getDefaultFormData = (): ScatterCreateDto => ({
    leaseMode: 2, // 分散式
    rentalType: 1, // 整租
    community: undefined,
    water: "residential",
    electricity: "residential",
    heating: "central",
    hasGas: true,
    hasElevator: false,
    deptId: undefined,
    salesmanId: undefined,
    houseList: []
  });

  /**
   * 打开整租房源新增/编辑对话框
   * @param title 对话框标题（"新增" 或 "编辑"）
   * @param id    房源 ID（可选）。传入则进入编辑模式，从后端拉取数据；不传则初始化空表单。
   */
  async function openEntireEditDialog(title = "新增", id?: string, onConfirm?: () => void) {
    let formInlineData: ScatterCreateDto = getDefaultFormData();

    // 编辑模式：通过 id 从后端获取完整数据
    if (id) {
      try {
        const { data, code } = await getEntireHouseDetailById({ id });
        if (code === 0 && data) {
          formInlineData = convertToScatterCreateDto(data);
        } else {
          message("获取房源数据失败", { type: "error" });
          return;
        }
      } catch (error) {
        console.error("获取房源数据失败:", error);
        message("获取房源数据失败", { type: "error" });
        return;
      }
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
              if (!entireFormRef.value) return;

              const isValid = await entireFormRef.value.validateForm();
              if (!isValid) return;

              // 整租：将门牌号/面积/朝向同步到房间信息
              const houseList: ScatterHouseDto[] = entireFormRef.value.houseList;
              houseList.forEach(house => {
                house.roomList?.forEach(room => {
                  room.roomNumber = house.doorNumber;
                  room.area = house.area;
                  room.direction = house.direction;
                });
              });

              const formData: ScatterCreateDto = entireFormRef.value.entireForm;
              console.log("整租房源的表单数据:", formData);
              console.log("整租房源的房源列表:", houseList);

              await createEntireHouse({ ...formData, houseList }).then(resp => {
                if (resp.code === 0) {
                  message(title === "新增" ? "新增成功" : "修改成功", { type: "success" });
                  closeDialog(options, index);
                  onConfirm?.();
                } else {
                  message(resp.message, { type: "error" });
                }
              });
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
