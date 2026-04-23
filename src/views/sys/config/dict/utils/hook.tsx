import dayjs from "dayjs";
import editForm from "../form/index.vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { usePublicHooks } from "@/utils/publicHooks";
import { h, onMounted, reactive, ref } from "vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import type { FormItemProps } from "../utils/types";
import type { PaginationProps } from "@pureadmin/table";
import { createDictData, deleteDictData, getDictData, getDictTree, toggleDictDataStatus } from "@/api/sys/dict";

export function useDict() {
  // 左侧字典树的id
  const dictId = ref("");
  const formRef = ref();
  const dataList = ref([]);
  const loading = ref(true);
  const switchLoadMap = ref({});
  const { switchStyle } = usePublicHooks();
  const treeData = ref([]);
  const treeLoading = ref(true);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true
  });
  const columns: TableColumnList = [
    {
      label: "字典标签",
      prop: "name",
      width: 200,
      cellRenderer: scope => (
        <el-button size="small" color={scope.row.color}>
          {scope.row.name}
        </el-button>
      )
    },
    {
      label: "备注",
      minWidth: 90,
      prop: "remark"
    },
    {
      label: "状态",
      prop: "status",
      width: 120,
      cellRenderer: scope => (
        <el-switch
          size={scope.props.size === "small" ? "small" : "default"}
          loading={switchLoadMap.value[scope.index]?.loading}
          v-model={scope.row.status}
          disabled={scope.row.deletable === false}
          active-value={1}
          inactive-value={0}
          active-text="已启用"
          inactive-text="已停用"
          inline-prompt
          style={switchStyle.value}
          onChange={() => onChange(scope as any)}
        />
      )
    },
    {
      sortable: true,
      label: "排序",
      width: 90,
      prop: "sortOrder"
    },
    {
      label: "创建时间",
      width: 180,
      prop: "createAt",
      formatter: ({ createAt }) => dayjs(createAt).format("YYYY-MM-DD HH:mm:ss")
    },
    {
      label: "操作",
      fixed: "right",
      width: 180,
      slot: "operation"
    }
  ];

  function onChange({ row, index }) {
    ElMessageBox.confirm(`确定要<strong>${row.status === 0 ? "停用" : "启用"}</strong><strong style='color:var(--el-color-primary)'>${row.name}</strong>字典标签吗?`, "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      dangerouslyUseHTMLString: true,
      draggable: true
    })
      .then(() => {
        switchLoadMap.value[index] = { ...switchLoadMap.value[index], loading: true };

        toggleDictDataStatus(row).then(resp => {
          switchLoadMap.value[index] = { ...switchLoadMap.value[index], loading: false };
          message("已成功修改状态", {
            type: "success"
          });
        });
      })
      .catch(() => {
        row.status === 0 ? (row.status = 1) : (row.status = 0);
      });
  }

  function handleDelete(row) {
    if (row.deletable === 0) {
      message("该字典项不允许删除", { type: "error" });
      return;
    }
    deleteDictData([row.id]).then(resp => {
      message(`您删除了字典标签为${row.name}的这条数据`, { type: "success" });
      onSearch();
    });
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  async function onSearch() {
    let data: any = {
      list: [],
      total: 0,
      pageSize: pagination.pageSize,
      currentPage: pagination.currentPage
    };

    if (dictId.value != null && dictId.value !== "") {
      const resp = await getDictData({
        dictId: dictId.value,
        pageSize: pagination.pageSize,
        currentPage: pagination.currentPage
      });
      data = resp.data;
    }

    loading.value = true;
    dataList.value = data.list;
    pagination.total = Number(data.total);
    pagination.pageSize = Number(data.pageSize);
    pagination.currentPage = Number(data.currentPage);

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  function onTreeSelect({ id, selected }) {
    dictId.value = selected ? id : "";
    onSearch();
  }

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}字典详情`,
      props: {
        formInline: {
          title,
          id: row?.id ?? "",
          dictId: dictId.value,
          name: row?.name ?? "",
          value: row?.value ?? "",
          color: row?.color ?? "#e84749",
          sortOrder: row?.sortOrder ?? 1,
          status: row?.status ?? 1,
          remark: row?.remark ?? ""
        }
      },
      width: "32%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;

        function chores() {
          createDictData(curData).then(resp => {
            if (resp.code === 0) {
              message(`您${title}了字典标签为${curData.name}的这条数据`, {
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

  /** 字典管理-左侧树数据 */
  async function getDictTreeData() {
    treeLoading.value = true;
    const { data } = await getDictTree();
    setTimeout(() => {
      treeData.value = data;
      treeLoading.value = false;
    }, 200);
  }

  onMounted(() => {
    getDictTreeData();
    onSearch();
  });

  return {
    dictId,
    loading,
    columns,
    dataList,
    treeData,
    treeLoading,
    pagination,
    deviceDetection,
    onSearch,
    openDialog,
    onTreeSelect,
    handleDelete,
    getDictTreeData,
    handleSizeChange,
    handleCurrentChange
  };
}
