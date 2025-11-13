import { message } from "@/utils/message";
import { transformI18n } from "@/plugins/i18n";
import type { PaginationProps } from "@pureadmin/table";
import { computed, h, onMounted, reactive, ref, toRaw } from "vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import ContractTemplateForm from "@/views/contract/settings/form/contractTemplateForm.vue";
import { createContractTemplate, getContractTemplateList, updateContractTemplateStatus } from "@/api/contract/template";
import { CONTRACT_TEMPLATE_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS, getOptionByCode } from "@/constants";
import { usePublicHooks } from "@/utils/publicHooks";
import { ElMessageBox } from "element-plus";
import type { ContractTemplateQueryFormProps } from "@/views/contract/settings/utils/types";
import type { ContractTemplateProps } from "@/types";

function useContractSettings() {
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive<ContractTemplateQueryFormProps>({
    templateName: "",
    contractType: 1,
    status: null,
    pageSize: 15,
    currentPage: 1
  });

  const curRow = ref();
  const contractTemplateList = ref([]);
  const houseOptions = ref([]);
  const tenantStatusTotal = ref([]);
  const treeData = ref([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();
  const tableSize = ref("default");
  const higherDeptOptions = ref();
  const formRef = ref();
  const switchLoadMap = ref({});
  const { switchStyle } = usePublicHooks();

  const mutableContractTemplateStatusOptions = [...CONTRACT_TEMPLATE_STATUS_OPTIONS] as any[];
  const mutableContractTypeOptions = [...CONTRACT_TYPE_OPTIONS] as any[];

  // 计算当前页的起始索引
  const startIndex = computed(() => (pagination.currentPage - 1) * pagination.pageSize + 1);
  // 渲染序号列
  const renderIndexCell = ({ index }) => <span>{startIndex.value + index}</span>;

  /** 切换合同模板状态 */
  function onChange({ row, index }) {
    ElMessageBox.confirm(`确认要<strong>${row.status === 1 ? "启用" : "停用"}</strong>“${row.templateName}”吗?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      dangerouslyUseHTMLString: true,
      draggable: true
    })
      .then(() => {
        switchLoadMap.value[index] = { ...switchLoadMap.value[index], loading: true };

        updateContractTemplateStatus(row).then(resp => {
          if (resp.code === 0) {
            switchLoadMap.value[index] = { ...switchLoadMap.value[index], loading: false };
            message(`已成功${row.status === 1 ? "启用" : "停用"}“${row.templateName}”`, {
              type: "success"
            });
          }
        });

        setTimeout(() => {}, 300);
      })
      .catch(() => {
        row.status === 0 ? (row.status = 0) : (row.status = -1);
      });
  }

  const columns: TableColumnList = [
    {
      label: "序号",
      prop: "index",
      width: 60,
      cellRenderer: renderIndexCell
    },
    {
      label: "模板名称",
      prop: "templateName",
      minWidth: 250
    },
    {
      label: "合同类型",
      prop: "contractType",
      minWidth: 120,
      cellRenderer: ({ row }) => <span>{getOptionByCode(mutableContractTypeOptions, row.contractType)?.label}</span>
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 90,
      cellRenderer: scope => (
        <el-switch
          size={scope.props.size === "small" ? "small" : "default"}
          loading={switchLoadMap.value[scope.index]?.loading}
          v-model={scope.row.status}
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
      label: "创建时间",
      prop: "createTime",
      minWidth: 180
    },
    {
      label: "操作",
      fixed: "right",
      minWidth: 80,
      slot: "operation"
    }
  ];

  function handleDelete(row: any) {
    message(`您删除了角色名称为${row.name}的这条数据`, { type: "success" });
    onContractTemplateSearch();
  }

  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
    pagination.pageSize = val;
    onContractTemplateSearch();
  }

  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
    pagination.currentPage = val;
    onContractTemplateSearch();
  }

  function onContractTemplateSearch() {
    loading.value = true;
    queryForm.currentPage = pagination.currentPage;
    queryForm.pageSize = pagination.pageSize;

    getContractTemplateList(toRaw(queryForm)).then(resp => {
      if (resp.code === 0) {
        contractTemplateList.value = resp.data.list;
        pagination.total = Number(resp.data.total);
        pagination.pageSize = Number(resp.data.pageSize);
        pagination.currentPage = Number(resp.data.currentPage);
      }
    });

    loading.value = false;
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onContractTemplateSearch();
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
    onContractTemplateSearch();
  });

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

  function openContractTemplateDialog(title = "新增", row?: ContractTemplateProps) {
    addDialog({
      title: `${title}合同模板`,
      props: {
        formInline: {
          title,
          ...row
        }
      },
      top: "2%",
      width: "66%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(ContractTemplateForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as ContractTemplateProps;
        FormRef.validate(valid => {
          if (valid) {
            console.log("保存的curData", curData);
            // 表单规则校验通过
            createContractTemplate(curData).then(resp => {
              if (resp.code === 0) {
                message(`您${title}了合同模板名称为${curData.templateName}的这条数据`, {
                  type: "success"
                });
                done(); // 关闭弹框
                onContractTemplateSearch(); // 刷新表格数据
              } else {
                message(resp.message, {
                  type: "error"
                });
              }
            });
          }
        });
      }
    });
  }

  return {
    queryForm,
    tableSize,
    isShow,
    curRow,
    loading,
    columns,
    rowStyle,
    contractTemplateList,
    houseOptions,
    tenantStatusTotal,
    treeData,
    isLinkage,
    pagination,
    treeSearchValue,
    openContractTemplateDialog,
    onContractTemplateSearch,
    resetForm,
    handleDelete,
    filterMethod,
    transformI18n,
    handleSizeChange,
    handleCurrentChange
  };
}

export default useContractSettings;
