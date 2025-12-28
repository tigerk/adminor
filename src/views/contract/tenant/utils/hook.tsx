// src/views/contract/tenant/utils/hook.tsx
import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import { computed, h, onMounted, reactive, ref, toRaw } from "vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { createTenant, deleteTenant, getTenantList, getTenantTotal, updateTenant, updateTenantStatus } from "@/api/contract/tenant";
import { GENDER_OPTIONS, getOptionByCode, ID_TYPE_OPTIONS, TENANT_CONTRACT_SIGN_STATUS_OPTIONS, TENANT_TYPE_OPTIONS } from "@/constants";
import { usePublicHooks } from "@/utils/publicHooks";
import { ElMessageBox } from "element-plus";
import type { TenantMateProps, TenantPersonalProps, TenantQueryFormProps, TenantRowProps, TenantsCreateFormProps } from "@/types";
import { getDictDataByDictCode } from "@/api/sys/dict";
import TenantCreateForm from "@/views/contract/tenant/form/tenantCreateForm.vue";
import TenantMateForm from "@/views/contract/tenant/form/tenantMateForm.vue";
import ViewTenantDialog from "@/views/contract/tenant/view/viewTenantDialog.vue";

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
  // 租客状态统计
  const tenantStatusTotal = ref([]);
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
  const tenantContractSignStatusOptions = [...TENANT_CONTRACT_SIGN_STATUS_OPTIONS] as any[];
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
      label: "状态",
      prop: "signStatus",
      width: 120,
      cellRenderer: ({ row }) => <span>{getOptionByCode(tenantContractSignStatusOptions, row.tenantType)?.label}</span>
    },
    {
      label: "房间",
      prop: "roomList",
      width: 300,
      showOverflowTooltip: false,
      cellRenderer: ({ row }) => (
        <el-tooltip placement="top" effect="dark" popper-class="room-tooltip">
          {{
            // 👇 悬浮内容（自定义）
            content: () => (
              <el-space wrap>
                {row.roomList.map(room => (
                  <el-tag key={room.roomId} type="primary">
                    {`${room.houseName}-${room.roomNumber}`}
                  </el-tag>
                ))}
              </el-space>
            ),
            // 👇 单元格显示内容
            default: () => (
              <div>
                <el-space>
                  <el-text
                    truncated
                    style={{
                      width: "220px",
                      display: "inline-block"
                    }}
                  >
                    {row.roomList.map(room => `${room.communityName} ${room.doorNumber} -${room.roomNumber}`).join(" | ")}
                  </el-text>
                  <el-tag type="primary" class="mr-1">
                    共 {row.roomList.length} 间
                  </el-tag>
                </el-space>
              </div>
            )
          }}
        </el-tooltip>
      )
    },
    {
      label: "合同周期",
      prop: "leaseDate",
      minWidth: 200,
      cellRenderer: ({ row }) => (
        <span>
          {row.leaseStart} - {row.leaseEnd}
        </span>
      )
    },
    {
      label: "租金（元/月）",
      prop: "rentPrice",
      minWidth: 120,
      cellRenderer: ({ row }) => <span>{row.rentPrice} 元/月</span>
    },
    {
      label: "租客姓名",
      prop: "tenantName",
      minWidth: 120
    },
    {
      label: "租客电话",
      prop: "tenantPhone",
      minWidth: 120
    },
    {
      label: "部门",
      prop: "deptName",
      minWidth: 120
    },
    {
      label: "签约人",
      prop: "salesmanName",
      minWidth: 120
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

    getTenantTotal(toRaw(queryForm)).then(res => {
      tenantStatusTotal.value = res.data?.statusList || [];

      let total = 0;
      res.data.statusList.forEach(item => {
        total += item.total;
      });

      tenantStatusTotal.value.unshift({ status: undefined, statusName: "全部", total: total });
    });
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
        const FormInstance = formRef.value;
        const getFormRuleRef = FormInstance?.getRef?.();
        const curData = FormInstance?.formInline;

        getFormRuleRef.validate(valid => {
          if (valid) {
            const apiCall = curData?.tenant?.id == null ? createTenant : updateTenant;

            curData.tenant.leaseStart = curData.tenant.leaseDate[0];
            curData.tenant.leaseEnd = curData.tenant.leaseDate[1];
            curData.tenant.checkInTime = curData.tenant.checkDate[0];
            curData.tenant.checkOutTime = curData.tenant.checkDate[1];

            // 处理房间ID数组，将对象转换为ID字符串数组
            curData.tenant.roomIds = curData.tenant.roomIds.map(item => item.value);

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
  function openTenantMateDialog(title = "添加", row?: TenantMateProps[], onConfirm?: (data: TenantMateProps[]) => void) {
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
        const FormInstance = tenantMateFormRef.value;
        const getFormRuleRef = FormInstance?.getRef?.();
        const formInlines = FormInstance?.formInlines;

        debugger;
        if (getFormRuleRef) {
          getFormRuleRef.validate((valid: boolean) => {
            if (valid) {
              // 过滤掉空的同住人记录（只有默认值的记录）
              const validMates = formInlines.filter((mate: TenantMateProps) => {
                return mate.name && mate.name.trim() !== "";
              });

              // 调用回调函数将数据返回给父组件
              if (onConfirm) {
                onConfirm(validMates);
              }

              message(`已成功${title}同住人`, { type: "success" });
              done(); // 关闭弹框
            } else {
              message("请完善同住人信息", { type: "error" });
            }
          });
        } else {
          // 如果没有表单验证，直接返回数据
          const validMates = formInlines.filter((mate: TenantMateProps) => {
            return mate.name && mate.name.trim() !== "";
          });

          if (onConfirm) {
            onConfirm(validMates);
          }
          done();
        }
      }
    });
  }

  function handleDeleteTenant(row: TenantPersonalProps) {
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
  const resetQueryForm = (formEl: any) => {
    // 重置表单验证状态
    formEl?.value?.resetFields();

    // 手动重置 queryForm 的值到初始状态
    Object.assign(queryForm, {
      name: "",
      phone: "",
      idNo: "",
      tenantType: undefined,
      status: undefined,
      pageSize: 15,
      currentPage: 1
    });

    // 重新搜索
    onTenantSearch();
  };

  function openTenantViewDialog(title = "查看", row?: TenantRowProps) {
    addDialog({
      title: `${title} ${row.tenantName}`,
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
      contentRenderer: () => h(ViewTenantDialog, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {}
    });
  }

  return {
    resetQueryForm,
    queryForm,
    tableSize,
    curRow,
    loading,
    columns,
    rowStyle,
    tenantStatusTotal,
    tenantList,
    tenantSourceOptions,
    dealChannelOptions,
    tenantTagOptions,
    pagination,
    openTenantDialog,
    openTenantViewDialog,
    onTenantSearch,
    handleDeleteTenant,
    handleSizeChange,
    handleCurrentChange,
    openTenantMateDialog
  };
}

export default useTenant;
