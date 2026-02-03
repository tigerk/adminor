import { message } from "@/utils/message";
import { transformI18n } from "@/plugins/i18n";
import { onMounted, reactive, ref, toRaw } from "vue";
import { getFocusById, getFocusHouseOptions, getFocusList } from "@/api/house/focus";
import type { PaginationProps } from "@pureadmin/table";
import { useFocusEdit } from "@/views/house/components/FocusCreate/utils/hook";

export function useFocusHouse() {
  const { openFocusEditDialog } = useFocusEdit();

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive({
    keywords: "",
    leaseModeId: null,
    leaseMode: 1, // 集中式
    pageSize: 10,
    currentPage: 1
  });

  const curRow = ref();
  const focusList = ref([]);
  const focusOptions = ref([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();

  function handleDelete(row: any) {
    message(`您删除了角色名称为${row.name}的这条数据`, { type: "success" });
    onFocusHouseSearch();
  }

  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
    pagination.pageSize = val;
    onFocusHouseSearch();
  }

  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
    pagination.currentPage = val;
    onFocusHouseSearch();
  }

  async function onFocusHouseSearch() {
    loading.value = true;
    queryForm.currentPage = pagination.currentPage;
    queryForm.pageSize = pagination.pageSize;

    const { data, code, message: msg } = await getFocusList(toRaw(queryForm));
    if (code === 0) {
      focusList.value = data.list;
      pagination.total = Number(data.total);
      pagination.pageSize = Number(data.pageSize);
      pagination.currentPage = Number(data.currentPage);
    } else {
      message(msg, { type: "error" });
    }

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onFocusHouseSearch();
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
    onFocusHouseSearch();
    onFocusOptions();
  });

  function onFocusOptions() {
    getFocusHouseOptions().then(res => {
      focusOptions.value = res.data;
    });
  }

  // 管理小区
  const handleEditFocus = (focusId: string) => {
    if (focusId) {
      getFocusById({
        id: focusId
      }).then(res => {
        openFocusEditDialog("更新", res.data, (id: string) => {
          onFocusHouseSearch().then();
        });
      });
    }
  };

  return {
    queryForm,
    isShow,
    curRow,
    loading,
    rowStyle,
    focusList,
    focusOptions,
    isLinkage,
    pagination,
    treeSearchValue,
    onFocusHouseSearch,
    resetForm,
    handleDelete,
    filterMethod,
    transformI18n,
    handleSizeChange,
    handleCurrentChange,
    handleEditFocus
  };
}
