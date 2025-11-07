// useFocusEdit.ts
import ShareCreateForm from "./ShareCreateForm.vue";
import { addDialog, closeAllDialog, closeDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, ref } from "vue";
import { createShareHouse } from "@/api/house/scatter";
import { message } from "@/utils/message";
import type { HouseInfoProps, HouseLayoutProps, OtherFeeProps, PriceConfigProps, PricePlanProps, RoomInfoProps, ShareFormItemProps } from "@/types";

function getScatterDefaultHouseItem(): HouseInfoProps {
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
    } as HouseLayoutProps,
    rentalType: 2,
    direction: "",
    area: "",
    decorationType: "",
    price: "",
    propertyFee: "",
    moreInfo: null,
    roomList: roomList
  };
}

function getDefaultPriceConfigItem(): PriceConfigProps {
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
    otherFees: [] as OtherFeeProps[],
    pricePlans: [] as PricePlanProps[]
  };
}

function getDefaultRoomItem(defaultRoomNumber = ""): RoomInfoProps {
  return {
    roomNumber: defaultRoomNumber,
    roomType: "",
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

  function openShareEditDialog(title = "新增", row?: ShareFormItemProps) {
    addDialog({
      title: `${title}合租房源`,
      props: {
        formInline: {
          id: row?.id ?? null,
          businessMode: row?.businessMode ?? 1,
          community: null,
          water: "residential",
          electricity: "residential",
          heating: "central",
          hasGas: true,
          hasElevator: false
        }
      },
      top: "1%",
      width: "85%",
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
              debugger;
              // 调用表单验证
              if (shareFormRef.value) {
                const isValid = await shareFormRef.value.validateForm();
                if (isValid) {
                  // 验证通过，执行保存逻辑
                  const formData = shareFormRef.value.shareForm;
                  formData.rentalType = 2;
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
