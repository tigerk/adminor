import { message } from "@/utils/message";
import { transformI18n } from "@/plugins/i18n";
import type { PaginationProps } from "@pureadmin/table";
import { computed, h, onMounted, reactive, ref, toRaw } from "vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { getOptionByCode } from "@/constants";
import { usePublicHooks } from "@/utils/publicHooks";
import type { TenantQueryFormProps } from "@/views/contract/tenant/utils/types";
import { getDeptList } from "@/api/sys/dept";
import { getTenantList } from "@/api/contract/tenant";
import TenantCreateForm from "@/views/contract/tenant/form/tenantCreateForm.vue";

function useTenant() {
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive<TenantQueryFormProps>({
    tenantName: "",
    tenantPhone: "",
    pageSize: 15,
    currentPage: 1
  });

  const curRow = ref();
  const contractTemplateList = ref([]);
  const houseOptions = ref([]);
  const tenantStatusTotal = ref([]);
  const deptData = ref([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();
  const tableSize = ref("default");
  const formRef = ref();
  const switchLoadMap = ref({});
  const { switchStyle } = usePublicHooks();

  const mutableContractTypeOptions = [...CONTRACT_TYPE_OPTIONS] as any[];

  // 计算当前页的起始索引
  const startIndex = computed(() => (pagination.currentPage - 1) * pagination.pageSize + 1);
  // 渲染序号列
  const renderIndexCell = ({ index }) => <span>{startIndex.value + index}</span>;

  const columns: TableColumnList = [
    {
      label: "序号",
      prop: "index",
      width: 60,
      cellRenderer: renderIndexCell
    },
    {
      label: "合同类型",
      prop: "contractType",
      minWidth: 120,
      cellRenderer: ({ row }) => <span>{getOptionByCode(mutableContractTypeOptions, row.contractType)?.label}</span>
    },
    {
      label: "模板名称",
      prop: "templateName",
      minWidth: 250
    },
    {
      label: "生效部门",
      prop: "deptIds",
      width: 250,
      cellRenderer: ({ row }) => {
        const deptIds = row.deptIds || [];
        return deptIds
          .map(id => {
            const dept = deptData.value.find(item => item.id === id);
            return dept?.name || "";
          })
          .join("  |  ");
      }
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 90
    },
    {
      label: "创建时间",
      prop: "createTime",
      minWidth: 180
    },
    {
      label: "操作",
      fixed: "right",
      width: 200,
      slot: "operation"
    }
  ];

  function handleDelete(row: any) {
    message(`您删除了角色名称为${row.name}的这条数据`, { type: "success" });
    onTenantSearch();
  }

  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
    pagination.pageSize = val;
    onTenantSearch();
  }

  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
    pagination.currentPage = val;
    onTenantSearch();
  }

  function onTenantSearch() {
    loading.value = true;
    queryForm.currentPage = pagination.currentPage;
    queryForm.pageSize = pagination.pageSize;

    getTenantList(toRaw(queryForm)).then(resp => {
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
    onTenantSearch();
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
    onTenantSearch();

    // 归属部门
    const { data } = await getDeptList({});
    deptData.value = data;
  });

  function openContractTemplateDialog(title = "新增", row?: ContractTemplateProps) {
    addDialog({
      title: `${title}合同模板`,
      props: {
        formInline: {
          title,
          ...row
        }
      },
      top: "1%",
      width: "88%",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(TenantCreateForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const getFormRuleRef = formRef.value.getRef();
        const curData = formRef.value.formInline;
        debugger;
        getFormRuleRef.validate(valid => {
          if (valid) {
            console.log("保存的curData", curData);
            // 表单规则校验通过
            createContractTemplate(curData).then(resp => {
              if (resp.code === 0) {
                message(`您${title}了合同模板名称为${curData.templateName}的这条数据`, {
                  type: "success"
                });
                done(); // 关闭弹框
                onTenantSearch(); // 刷新表格数据
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

  function handleDeleteTemplate(row: any) {
    deleteContractTemplate({ id: row.id }).then(resp => {
      if (resp.code === 0) {
        message(`您删除了合同模板名称为${row.templateName}的这条数据`, { type: "success" });
        onTenantSearch();
      } else {
        message(resp.message, {
          type: "error"
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
    treeData: deptData,
    isLinkage,
    pagination,
    treeSearchValue,
    openContractTemplateDialog,
    onContractTemplateSearch: onTenantSearch,
    resetForm,
    handleDeleteTemplate,
    filterMethod,
    transformI18n,
    handleSizeChange,
    handleCurrentChange
  };
}

export default useTenant;
