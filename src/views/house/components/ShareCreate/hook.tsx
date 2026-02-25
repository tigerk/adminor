// useFocusEdit.ts
import ShareCreateForm from "./ShareCreateForm.vue";
import { addDialog, closeAllDialog, closeDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, ref } from "vue";
import { createShareHouse } from "@/api/house/scatter";
import { message } from "@/utils/message";
import type { ScatterHouseDto, HouseLayoutDto, OtherFeeDto, PriceConfigDto, PricePlanDto, RoomCreateDto, ScatterCreateDto } from "@/types";

function getScatterDefaultHouseItem(): ScatterHouseDto {
  const roomList = [getDefaultRoomItem("A"), getDefaultRoomItem("B"), getDefaultRoomItem("C")];
  return {
    houseCode: "",
    building: "",
    unit: "",
    doorNumber: "",
    floor: null,
    floorTotal: null,
    houseLayout: {
      layoutName: null,
      bedroom: null,
      livingRoom: null,
      kitchen: null,
      bathroom: null,
      newly: true
    } as HouseLayoutDto,
    rentalType: 2,
    direction: "",
    area: "",
    decorationType: "",
    propertyFee: null,
    roomList: roomList
  };
}

function getDefaultPriceConfigItem(): PriceConfigDto {
  return {
    /** 房间ID */
    roomId: null,
    /** 出房价格（单位：元/月） */
    price: null,
    /** 底价（单位：元/月） */
    floorPrice: null,
    /** 底价方式：0=固定金额，1=按比例 */
    floorPriceMethod: 0,
    /** 底价录入值（金额或比例，具体由 low_price_method 决定） */
    floorPriceInput: null,
    /** 其他费用列表 */
    otherFees: [] as OtherFeeDto[],
    pricePlans: [] as PricePlanDto[]
  };
}

function getDefaultRoomItem(defaultRoomNumber = ""): RoomCreateDto {
  return {
    roomNumber: defaultRoomNumber,
    roomType: null,
    direction: "",
    area: null,
    price: null,
    imageList: [],
    facilities: [],
    tags: [],
    priceConfig: getDefaultPriceConfigItem()
  };
}

export function useShareEdit() {
  const shareFormRef = ref();

  async function openShareEditDialog(title = "新增", row?: ScatterCreateDto) {
    addDialog({
      title: `${title}合租房源`,
      props: {
        formInline: {
          ...row
        }
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
              if (shareFormRef.value) {
                const isValid = await shareFormRef.value.validateForm();
                if (isValid) {
                  // 验证通过，执行保存逻辑
                  const formData = shareFormRef.value.shareForm;
                  console.log("合租房源的表单数据:", formData);

                  // 调用API保存数据
                  await createShareHouse({ ...formData }).then(resp => {
                    if (resp.code === 0) {
                      message("保存成功", { type: "success" });
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
        h(ShareCreateForm, {
          ref: shareFormRef,
          formInline: null,
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
