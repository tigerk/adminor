// useShareEdit.ts
import ShareCreateForm from "./ShareCreateForm.vue";
import { addDialog, closeAllDialog, closeDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, ref } from "vue";
import { createShareHouse, getShareHouseDetailById } from "@/api/house/scatter";
import { message } from "@/utils/message";
import type { ScatterHouseDto, HouseLayoutDto, OtherFeeDto, PriceConfigDto, PricePlanDto, RoomCreateDto, RoomDetailVo, ScatterCreateDto, HouseDetailVo } from "@/types";

function getDefaultPriceConfigItem(): PriceConfigDto {
  return {
    roomId: null,
    price: null,
    floorPrice: null,
    floorPriceMethod: 0,
    floorPriceInput: null,
    otherFees: [] as OtherFeeDto[],
    pricePlans: [] as PricePlanDto[]
  };
}

function getDefaultRoomItem(defaultRoomNumber = ""): RoomCreateDto {
  return {
    id: undefined,
    roomNumber: defaultRoomNumber,
    roomType: undefined, // number | undefined，与 RoomCreateDto 一致
    direction: "",
    area: undefined, // number | undefined，与 RoomCreateDto 一致
    price: undefined, // number | undefined，与 RoomCreateDto 一致
    imageList: [],
    videoList: [],
    facilities: [],
    tags: [],
    priceConfig: getDefaultPriceConfigItem()
  };
}

function getScatterDefaultHouseItem(): ScatterHouseDto {
  return {
    id: undefined,
    houseCode: "",
    building: "",
    unit: "",
    doorNumber: "",
    floor: undefined, // number | undefined，与 ScatterHouseDto 一致
    floorTotal: undefined, // number | undefined，与 ScatterHouseDto 一致
    houseLayout: {
      layoutName: undefined,
      bedroom: undefined,
      livingRoom: undefined,
      kitchen: undefined,
      bathroom: undefined,
      imageList: [],
      tags: [],
      facilities: []
    } as HouseLayoutDto,
    rentalType: 2, // 合租
    direction: "",
    area: undefined, // number | undefined，与 ScatterHouseDto 一致
    decorationType: undefined, // number | undefined，与 ScatterHouseDto 一致
    propertyFee: undefined, // number | undefined，与 ScatterHouseDto 一致
    roomList: [getDefaultRoomItem("A"), getDefaultRoomItem("B"), getDefaultRoomItem("C")]
  };
}

/** 将 RoomDetailVo 转换为 RoomCreateDto */
function convertRoomDetailToCreateDto(room: RoomDetailVo): RoomCreateDto {
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
}

/** 将 HouseDetailVo 转换为 ScatterCreateDto（合租表单数据） */
function convertToScatterCreateDto(data: HouseDetailVo): ScatterCreateDto {
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
    houseList: [
      {
        id: data.id,
        houseCode: data.houseCode,
        rentalType: data.rentalType,
        building: data.building,
        unit: data.unit,
        doorNumber: data.doorNumber,
        floor: data.floor,
        floorTotal: data.floorTotal,
        direction: data.direction,
        area: data.area,
        decorationType: data.decorationType,
        propertyFee: data.propertyFee,
        houseLayout: data.houseLayout ?? {
          imageList: [],
          tags: [],
          facilities: []
        },
        roomList: (data.roomList ?? []).map(convertRoomDetailToCreateDto),
        locked: data.locked,
        closed: data.closed
      } as ScatterHouseDto
    ]
  };
}

/** 默认的合租表单初始值 */
function getDefaultFormData(): ScatterCreateDto {
  return {
    leaseMode: 2, // 分散式
    rentalType: 2, // 合租
    community: undefined,
    water: "residential",
    electricity: "residential",
    heating: "central",
    hasGas: true,
    hasElevator: false,
    deptId: undefined,
    salesmanId: undefined,
    houseList: [getScatterDefaultHouseItem()]
  };
}

export function useShareEdit() {
  const shareFormRef = ref();

  /**
   * 打开合租房源新增/编辑对话框
   * @param title 对话框标题（"新增" 或 "编辑"）
   * @param id    房源 ID（可选）。传入则进入编辑模式，从后端拉取数据；不传则初始化空表单。
   */
  async function openShareEditDialog(title = "新增", id?: string, onConfirm?: () => void) {
    let formInlineData: ScatterCreateDto = getDefaultFormData();

    // 编辑模式：通过 id 从后端获取完整数据
    if (id) {
      try {
        const { data, code } = await getShareHouseDetailById({ id });
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

    addDialog({
      title: `${title}合租房源`,
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
              if (!shareFormRef.value) return;

              const isValid = await shareFormRef.value.validateForm();
              if (!isValid) return;

              const formData: ScatterCreateDto = shareFormRef.value.shareForm;
              console.log("合租房源的表单数据:", formData);

              await createShareHouse({ ...formData }).then(resp => {
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
        h(ShareCreateForm, {
          ref: shareFormRef,
          formInline: formInlineData,
          onCreateSuccess: () => {
            closeAllDialog();
          }
        })
    });
  }

  return {
    shareFormRef,
    openShareEditDialog,
    getScatterDefaultHouseItem,
    getDefaultPriceConfigItem,
    getDefaultRoomItem
  };
}
