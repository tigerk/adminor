// useFocusEdit.ts
import EntireCreateForm from "./EntireCreateForm.vue";
import { addDialog, closeAllDialog, closeDialog } from "@/components/ReDialog/index";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import type { EntireFormItemProps } from "@/views/house/components/EntireCreate/types";
import { options } from "@/views/table/edit/data";

export function useEntireEdit() {
  const entireForm = reactive({
    name: "",
    community: null,
    code: "",
    status: ""
  });

  const entireFormRef = ref();

  function openEntireEditDialog(title = "新增", row?: EntireFormItemProps) {
    addDialog({
      title: `${title} 整租房源`,
      props: {
        formInline: {
          id: row?.id ?? null,
          businessMode: row?.businessMode ?? 1,
          focusCode: "",
          focusName: "",
          address: "string",
          community: null,
          water: "residential",
          electricity: "residential",
          heating: "central",
          hasGas: true,
          hasElevator: false,
          facilities: []
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
          <el-button type="primary" onClick={() => closeDialog(options, index)}>
            保存并关闭
          </el-button>
        </div>
      ),
      contentRenderer: () =>
        h(EntireCreateForm, {
          ref: entireFormRef,
          formInline: null,
          onCreateSuccess: () => {
            closeAllDialog();
          }
        })
    });
  }

  const dataList = ref([]);

  const columns: TableColumnList = [
    {
      label: "房源编号",
      prop: "houseCode",
      headerRenderer: ({ column, $index }) => {
        return h("div", { style: "padding: 10px;" }, "房源编号");
      },
      cellRenderer: ({ row }) => <el-input v-model={row.houseCode} />
    },
    {
      label: "座/栋",
      prop: "building",
      cellRenderer: ({ row }) => <el-input v-model={row.building} />
    },
    {
      label: "单元",
      prop: "unit",
      cellRenderer: ({ row }) => <el-input v-model={row.unit} />
    },
    {
      label: "房间号",
      prop: "doorNumber",
      cellRenderer: ({ row }) => <el-input v-model={row.doorNumber} />
    },
    {
      label: "所在楼层",
      prop: "floor",
      cellRenderer: ({ row }) => <el-input v-model={row.floor} />
    },
    {
      label: "总楼层数",
      prop: "floorTotal",
      cellRenderer: ({ row }) => <el-input v-model={row.floorTotal} />
    },
    {
      label: "户型",
      prop: "houseLayoutId",
      cellRenderer: ({ row }) => <el-input v-model={row.houseLayoutId} />
    },
    {
      label: "朝向",
      prop: "direction",
      cellRenderer: ({ row }) => <el-input v-model={row.direction} />
    },
    {
      label: "面积",
      prop: "area",
      cellRenderer: ({ row }) => <el-input v-model={row.area} />
    },
    {
      label: "物业费",
      prop: "propertyFee",
      cellRenderer: ({ row }) => <el-input v-model={row.propertyFee} />
    },
    {
      label: "装修类型",
      prop: "renovationType",
      cellRenderer: ({ row }) => <el-input v-model={row.renovationType} />
    },
    {
      label: "出租价格",
      prop: "price",
      cellRenderer: ({ row }) => <el-input v-model={row.price} />
    },
    {
      label: "房源特色",
      prop: "highlights",
      cellRenderer: ({ row }) => <el-input v-model={row.highlights} />
    },
    {
      label: "产权信息",
      prop: "ownership",
      cellRenderer: ({ row }) => <el-input v-model={row.ownership} />
    },
    {
      label: "房源图片",
      prop: "imageList",
      cellRenderer: ({ row }) => <el-input v-model={row.imageList} />
    },
    {
      label: "更多信息",
      prop: "extension",
      cellRenderer: ({ row }) => <el-input v-model={row.extension} />
    },
    {
      label: "操作",
      fixed: "right",
      width: 90,
      slot: "operation"
    }
  ];

  function onAdd() {
    dataList.value.push({
      id: dataList.value.length + 1,
      name: "",
      sex: 0,
      hobby: "",
      date: ""
    });
  }

  function onDel(row) {
    const index = dataList.value.indexOf(row);
    if (index !== -1) dataList.value.splice(index, 1);
  }

  return {
    entireForm,
    entireFormRef,
    openEntireEditDialog,
    columns,
    dataList,
    onAdd,
    onDel
  };
}
