// src/views/contract/tenant/utils/hook.tsx
import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import { computed, h, onMounted, reactive, ref, toRaw } from "vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { createTenant, deleteTenant, getTenantList, updateTenant, updateTenantStatus } from "@/api/contract/tenant";
import { GENDER_OPTIONS, getOptionByCode, ID_TYPE_OPTIONS, TENANT_TYPE_OPTIONS } from "@/constants";
import { usePublicHooks } from "@/utils/publicHooks";
import { ElMessageBox } from "element-plus";
import type { TenantMateProps, TenantProps, TenantQueryFormProps, TenantsCreateFormProps } from "@/types";
import { getDictDataByDictCode } from "@/api/sys/dict";
import TenantCreateForm from "@/views/contract/tenant/form/tenantCreateForm.vue";
import TenantMateForm from "@/views/contract/tenant/form/tenantMateForm.vue";

function useTenant() {
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive<TenantQueryFormProps>({
    name: "",
    phone: "",
    idNo: "",
    tenantType: undefined,
    status: undefined,
    pageSize: 15,
    currentPage: 1
  });

  const curRow = ref();
  const tenantList = ref([]);
  const tenantSourceOptions = ref([]);
  const dealChannelOptions = ref([]);
  const tenantTagOptions = ref([]);
  const loading = ref(true);
  const tableSize = ref("default");
  const formRef = ref();
  const switchLoadMap = ref({});
  const { switchStyle } = usePublicHooks();

  const mutableTenantTypeOptions = [...TENANT_TYPE_OPTIONS] as any[];
  const mutableIdTypeOptions = [...ID_TYPE_OPTIONS] as any[];
  const mutableGenderOptions = [...GENDER_OPTIONS] as any[];

  // 计算当前页的起始索引
  const startIndex = computed(() => (pagination.currentPage - 1) * pagination.pageSize + 1);

  // 渲染序号列
  const renderIndexCell = ({ index }) => <span>{startIndex.value + index}</span>;

  /** 切换租客状态 */
  function onChange({ row, index }) {
    ElMessageBox.confirm(`确认要<strong>${row.status === 1 ? "停用" : "启用"}</strong>"${row.name}"吗?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      dangerouslyUseHTMLString: true,
      draggable: true
    })
      .then(() => {
        switchLoadMap.value[index] = { ...switchLoadMap.value[index], loading: true };

        updateTenantStatus({ id: row.id, status: row.status }).then(resp => {
          if (resp.code === 0) {
            switchLoadMap.value[index] = { ...switchLoadMap.value[index], loading: false };
            message(`已成功${row.status === 1 ? "启用" : "停用"}"${row.name}"`, {
              type: "success"
            });
          }
        });
      })
      .catch(() => {
        row.status = row.status === 1 ? 0 : 1;
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
      label: "租客姓名",
      prop: "name",
      minWidth: 120
    },
    {
      label: "性别",
      prop: "gender",
      width: 80,
      cellRenderer: ({ row }) => <span>{getOptionByCode(mutableGenderOptions, row.gender)?.label || "-"}</span>
    },
    {
      label: "租客类型",
      prop: "tenantType",
      width: 100,
      cellRenderer: ({ row }) => <span>{getOptionByCode(mutableTenantTypeOptions, row.tenantType)?.label}</span>
    },
    {
      label: "证件类型",
      prop: "idType",
      width: 120,
      cellRenderer: ({ row }) => <span>{getOptionByCode(mutableIdTypeOptions, row.idType)?.label}</span>
    },
    {
      label: "证件号码",
      prop: "idNo",
      minWidth: 180
    },
    {
      label: "联系电话",
      prop: "phone",
      minWidth: 130
    },
    {
      label: "租客来源",
      prop: "tenantSource",
      width: 120,
      cellRenderer: ({ row }) => {
        const source = tenantSourceOptions.value.find(item => item.value === row.tenantSource);
        return <span>{source?.label || "-"}</span>;
      }
    },
    {
      label: "成交渠道",
      prop: "dealChannel",
      width: 120,
      cellRenderer: ({ row }) => {
        const channel = dealChannelOptions.value.find(item => item.value === row.dealChannel);
        return <span>{channel?.label || "-"}</span>;
      }
    },
    {
      label: "租客标签",
      prop: "tags",
      minWidth: 150,
      cellRenderer: ({ row }) => {
        if (!row.tags || row.tags.length === 0) return <span>-</span>;
        return (
          <div class="flex flex-wrap gap-1">
            {row.tags.map((tagId, index) => {
              const tag = tenantTagOptions.value.find(item => item.value === tagId);
              return tag ? (
                <el-tag key={index} size="small">
                  {tag.label}
                </el-tag>
              ) : null;
            })}
          </div>
        );
      }
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      cellRenderer: scope => (
        <el-switch
          size={scope.props.size === "small" ? "small" : "default"}
          loading={switchLoadMap.value[scope.index]?.loading}
          v-model={scope.row.status}
          active-value={1}
          inactive-value={0}
          active-text="启用"
          inactive-text="停用"
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
      width: 160,
      slot: "operation"
    }
  ];

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onTenantSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onTenantSearch();
  }

  function onTenantSearch() {
    loading.value = true;
    queryForm.currentPage = pagination.currentPage;
    queryForm.pageSize = pagination.pageSize;

    getTenantList(toRaw(queryForm))
      .then(resp => {
        if (resp.code === 0) {
          tenantList.value = resp.data.list;
          pagination.total = Number(resp.data.total);
          pagination.pageSize = Number(resp.data.pageSize);
          pagination.currentPage = Number(resp.data.currentPage);
        }
      })
      .finally(() => {
        loading.value = false;
      });
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

  // 加载字典数据
  async function loadDictData() {
    try {
      // 加载租客来源
      const sourceResp = await getDictDataByDictCode({ dictCode: "tenant_source" });
      if (sourceResp.code === 0) {
        tenantSourceOptions.value = sourceResp.data.map(item => ({
          label: item.name,
          value: item.id
        }));
      }

      // 加载成交渠道
      const channelResp = await getDictDataByDictCode({ dictCode: "deal_channel" });
      if (channelResp.code === 0) {
        dealChannelOptions.value = channelResp.data.map(item => ({
          label: item.name,
          value: item.id
        }));
      }

      // 加载租客标签
      const tagResp = await getDictDataByDictCode({ dictCode: "tenant_tags" });
      if (tagResp.code === 0) {
        tenantTagOptions.value = tagResp.data.map(item => ({
          label: item.name,
          value: item.id
        }));
      }
    } catch (error) {
      console.error("加载字典数据失败:", error);
    }
  }

  onMounted(async () => {
    await loadDictData();
    onTenantSearch();
  });

  function openTenantDialog(title = "添加", row?: TenantsCreateFormProps) {
    addDialog({
      title: `${title}租客`,
      props: {
        formInline: {
          title,
          tenantSourceOptions: tenantSourceOptions.value,
          dealChannelOptions: dealChannelOptions.value,
          tenantTagOptions: tenantTagOptions.value,
          ...row
        }
      },
      top: "1vh",
      width: "70vw",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(TenantCreateForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormInstance = formRef.value as any;
        const getFormRuleRef = FormInstance?.getRef?.();
        const curData = FormInstance?.formInline;

        getFormRuleRef.validate(valid => {
          if (valid) {
            const apiCall = title === "添加" ? createTenant : updateTenant;

            apiCall(curData).then(resp => {
              if (resp.code === 0) {
                message(`您${title}了租客"${curData.name}"`, {
                  type: "success"
                });
                done();
                onTenantSearch();
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

  const tenantMateFormRef = ref();
  function openTenantMateDialog(title = "添加", row?: TenantMateProps[]) {
    addDialog({
      title: `${title}同住人`,
      props: {
        formInline: {
          tenantSourceOptions: tenantSourceOptions.value,
          tenantMateList: row || []
        }
      },
      top: "1vh",
      width: "70vw",
      // 锁定滚动
      lockScroll: true,
      // 居中显示
      alignCenter: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(TenantMateForm, { ref: tenantMateFormRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormInstance = tenantMateFormRef.value as any;
        const getFormRuleRef = FormInstance?.getRef?.();
        const curData = FormInstance?.formInline;
      }
    });
  }

  function handleDeleteTenant(row: TenantProps) {
    deleteTenant({ id: row.id }).then(resp => {
      if (resp.code === 0) {
        message(`您删除了租客"${row.name}"`, { type: "success" });
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
    curRow,
    loading,
    columns,
    rowStyle,
    tenantList,
    tenantSourceOptions,
    dealChannelOptions,
    tenantTagOptions,
    pagination,
    openTenantDialog,
    onTenantSearch,
    resetForm,
    handleDeleteTenant,
    handleSizeChange,
    handleCurrentChange,
    openTenantMateDialog
  };
}

export default useTenant;
