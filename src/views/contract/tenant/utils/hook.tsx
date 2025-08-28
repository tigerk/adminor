import { message } from "@/utils/message";
import { transformI18n } from "@/plugins/i18n";
import type { PaginationProps } from "@pureadmin/table";
import { reactive, ref, onMounted, toRaw, h } from "vue";
import router from "@/router";
import { getRoomList, getRoomTotal } from "@/api/house/room";
import { getFocusHouseOptions } from "@/api/house/focus";
import type { HouseLayoutProps } from "@/views/house/focus/components/FocusCreate/utils/types";
import type { FormItemProps } from "@/views/system/user/utils/types";
import { addDialog } from "@/components/ReDialog/index";
import { deviceDetection } from "@pureadmin/utils";
import createTenant from "@/views/contract/tenant/form/createTenant.vue";
import { createUser } from "@/api/system";

export function useContractTenant() {
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive({
    keywords: "",
    houseId: null,
    roomStatus: null,
    pageSize: 15,
    currentPage: 1
  });

  const curRow = ref();
  const tenantTableList = ref([]);
  const houseOptions = ref([]);
  const tenantStatusTotal = ref([]);
  const treeData = ref([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();
  const displayModeToList = ref(true);
  const displayModeText = ref("列表模式");
  const tableSize = ref("default");
  const higherDeptOptions = ref();
  const formRef = ref();

  const columns: TableColumnList = [
    {
      label: "状态",
      prop: "roomStatusName",
      width: 100,
      cellRenderer: ({ row }) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            textAlign: "center"
          }}
        >
          <span
            class="status-dot"
            style={{
              backgroundColor: row.roomStatusColor,
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              flexShrink: 0,
              marginRight: "8px"
            }}
          ></span>
          <span>{row.roomStatusName}</span>
        </div>
      )
    },
    {
      label: "项目",
      prop: "houseName",
      width: 120
    },
    {
      label: "房型 / 门牌号",
      prop: "houseLayout.layoutName",
      cellRenderer: ({ row }) => (
        <span>
          {row.houseLayout?.layoutName ?? ""} {row.roomNumber}
        </span>
      )
    },
    {
      label: "价格(元/月)",
      prop: "price",
      width: 120
    },
    {
      label: "户型",
      cellRenderer: ({ row }) => <span>{formatHouseLayout(row.houseLayout)}</span>
    },
    {
      label: "面积",
      prop: "area",
      cellRenderer: ({ row }) => <span>{row.area}㎡</span>
    },
    {
      label: "朝向",
      prop: "direction"
    },
    {
      label: "负责人",
      prop: "salesmanName",
      cellRenderer: ({ row }) => (
        <span>
          {row.salesmanName} - {row.salesmanPhone}
        </span>
      )
    },
    {
      label: "操作",
      fixed: "right",
      width: 80,
      slot: "operation"
    }
  ];

  function handleDelete(row: any) {
    message(`您删除了角色名称为${row.name}的这条数据`, { type: "success" });
    onSearch();
  }

  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
    pagination.pageSize = val;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
    pagination.currentPage = val;
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    queryForm.currentPage = pagination.currentPage;
    queryForm.pageSize = pagination.pageSize;

    const { data } = await getRoomList(toRaw(queryForm));
    if (data) {
      tenantTableList.value = data.list;
      pagination.total = Number(data.total);
      pagination.pageSize = Number(data.pageSize);
      pagination.currentPage = Number(data.currentPage);
    }

    setTimeout(() => {
      loading.value = false;
    }, 500);

    getRoomTotal(toRaw(queryForm)).then(res => {
      tenantStatusTotal.value = res.data.statusList;

      let total = 0;
      res.data.statusList.forEach(item => {
        total += item.total;
      });

      tenantStatusTotal.value.unshift({ roomStatus: "", roomStatusName: "全部", total: total });
    });
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  /** 高亮当前权限选中行 */
  function rowStyle({ row: { id } }) {
    return {
      cursor: "pointer",
      background: id === curRow.value?.id ? "var(--el-fill-color-light)" : ""
    };
  }

  const filterMethod = (query: string, node) => {
    return transformI18n(node.title)!.includes(query);
  };

  onMounted(async () => {
    onSearch();
    onHouseOptions();
  });

  function onHouseOptions() {
    getFocusHouseOptions().then(res => {
      houseOptions.value = res.data;
    });
  }

  function onBack() {
    // 检查是否有历史记录可以返回
    if (window.history.length <= 1) {
      // 如果没有历史记录，跳转到默认页面
      router.push("/"); // 或者其他默认页面
    } else {
      router.go(-1);
    }
  }

  function formatHouseLayout(layout: HouseLayoutProps): string {
    if (!layout) return "";
    const { bedroom, livingRoom, kitchen, bathroom } = layout;
    return `${bedroom || 0}室${livingRoom || 0}厅${kitchen || 0}厨${bathroom || 0}卫`;
  }

  function handleDisplayClick() {
    displayModeToList.value = !displayModeToList.value;
    displayModeText.value = displayModeToList.value ? "列表模式" : "房态模式";
  }

  function formatHigherDeptOptions(treeList) {
    // 根据返回数据的status字段值判断追加是否禁用disabled字段，返回处理后的树结构，用于上级部门级联选择器的展示（实际开发中也是如此，不可能前端需要的每个字段后端都会返回，这时需要前端自行根据后端返回的某些字段做逻辑处理）
    if (!treeList || !treeList.length) return;
    const newTreeList = [];
    for (let i = 0; i < treeList.length; i++) {
      treeList[i].disabled = treeList[i].status === 0;
      formatHigherDeptOptions(treeList[i].children);
      newTreeList.push(treeList[i]);
    }
    return newTreeList;
  }

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}租客`,
      props: {
        formInline: {
          title,
          id: row?.id,
          deptId: row?.dept.id ?? "",
          higherDeptOptions: formatHigherDeptOptions(higherDeptOptions.value),
          nickname: row?.nickname ?? "",
          username: row?.username ?? "",
          password: row?.password ?? null,
          phone: row?.phone ?? "",
          email: row?.email ?? "",
          gender: row?.gender ?? "",
          status: row?.status ?? 1,
          remark: row?.remark ?? ""
        }
      },
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(createTenant, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;

        function chores() {
          createUser(curData).then(resp => {
            if (resp.code === 0) {
              message(`您${title}了租客名称为${curData.username}的这条数据`, {
                type: "success"
              });
              done(); // 关闭弹框
              onSearch(); // 刷新表格数据
            } else {
              message(resp.message, {
                type: "error"
              });
            }
          });
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

  return {
    queryForm,
    onBack,
    tableSize,
    isShow,
    curRow,
    loading,
    columns,
    rowStyle,
    tenantTableList,
    houseOptions,
    tenantStatusTotal,
    displayModeToList,
    displayModeText,
    handleDisplayClick,
    treeData,
    isLinkage,
    pagination,
    treeSearchValue,
    openDialog,
    onSearch,
    resetForm,
    handleDelete,
    filterMethod,
    transformI18n,
    handleSizeChange,
    handleCurrentChange
  };
}
