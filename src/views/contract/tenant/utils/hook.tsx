// src/views/contract/tenant/utils/hook.tsx
import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import { computed, h, onMounted, reactive, ref, toRaw } from "vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { createTenant, deleteTenant, getLeaseDetail, getTenantList, getTenantTotal, updateTenant, updateTenantStatus } from "@/api/contract/tenant";
import { getOptionByCode, LEASE_CONTRACT_NATURE_ENUM, LEASE_SIGN_STATUS_OPTIONS, LEAST_STATUS_OPTIONS } from "@/constants";
import { usePublicHooks } from "@/utils/publicHooks";
import { ElMessageBox } from "element-plus";
import type {
  TenantMateVo,
  TenantPersonalVo,
  LeaseQueryDto,
  LeaseListVo,
  TenantsCreateFormProps,
  LeaseDetailVo,
  LeaseDto,
  TenantCompanyDto,
  TenantCompanyVo,
  TenantPersonalDto,
  LeaseProps
} from "@/types";
import { getDictDataByDictCode } from "@/api/sys/dict";
import TenantCreateForm from "@/views/contract/tenant/form/tenantCreateForm.vue";
import TenantMateForm from "@/views/contract/tenant/form/tenantMateForm.vue";
import ViewTenantDialog from "@/views/contract/tenant/view/ViewTenantDialog.vue";
import { calculateMonthsDifference } from "@/utils/yeah";
import { convertImage2string } from "@/utils/image";
import { addDays, addMonth } from "@/utils/date";
import { getRoomList } from "@/api/house/room";

function useTenant() {
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive<LeaseQueryDto>({
    name: "",
    phone: "",
    tenantType: undefined,
    status: undefined,
    expiringDaysWithin: undefined,
    pageSize: "15",
    currentPage: "1"
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

  const leaseContractSignStatusOptions = [...LEASE_SIGN_STATUS_OPTIONS] as any[];
  const mutableTenantStatusOptions = [...LEAST_STATUS_OPTIONS] as any[];
  const leaseContractNatureOptions = Object.values(LEASE_CONTRACT_NATURE_ENUM);

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

        updateTenantStatus({ id: row.tenantId, status: row.status }).then(resp => {
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

  // 根据状态获取颜色
  const getStatusColor = (status: number) => {
    const statusInfo = tenantStatusTotal.value.find(item => item.status === status);
    return statusInfo?.statusColor || "#409eff";
  };

  const columns: TableColumnList = [
    {
      label: "序号",
      prop: "index",
      width: 60,
      fixed: "left",
      cellRenderer: renderIndexCell
    },
    {
      label: "状态",
      prop: "status",
      width: 90,
      fixed: "left",
      cellRenderer: ({ row }) => {
        const statusColor = getStatusColor(row.status);
        const statusLabel = getOptionByCode(mutableTenantStatusOptions, row.status)?.label;

        return (
          <el-tag
            style={{
              borderColor: statusColor,
              backgroundColor: "var(--el-bg-color)", // 跟随主题的背景色
              color: statusColor
            }}
          >
            {statusLabel}
          </el-tag>
        );
      }
    },
    {
      label: "房间",
      prop: "roomList",
      width: 200,
      showOverflowTooltip: false,
      cellRenderer: ({ row }) => (
        <el-tooltip placement="top" effect="light" popper-class="room-tooltip">
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
                      width: "100px",
                      display: "inline-block"
                    }}
                  >
                    {row.roomList.map(room => `${room.communityName} ${room.doorNumber} -${room.roomNumber}`).join(" | ")}
                  </el-text>
                  <el-tag size="small" type="info">
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
      label: "合同类型",
      prop: "contractNature",
      minWidth: 100,
      cellRenderer: ({ row }) => {
        const nature = leaseContractNatureOptions.find(item => item.code === row.contractNature);
        return (
          <el-tag
            style={{
              borderColor: nature?.color,
              backgroundColor: "var(--el-bg-color)",
              color: nature?.color
            }}
          >
            {nature?.name}
          </el-tag>
        );
      }
    },
    {
      label: "合同周期",
      prop: "leaseDate",
      minWidth: 250,
      cellRenderer: ({ row }) => (
        <el-space spacer={" | "}>
          <el-text>
            {row.leaseStart} - {row.leaseEnd}
          </el-text>
          <el-text type="primary" size="small">
            {calculateMonthsDifference(row.leaseStart, row.leaseEnd)} 月
          </el-text>
        </el-space>
      )
    },
    {
      label: "租金（元/月）",
      prop: "rentPrice",
      minWidth: 120,
      cellRenderer: ({ row }) => <span>{row.rentPrice} 元/月</span>
    },
    {
      label: "收款方式",
      prop: "",
      minWidth: 120,
      cellRenderer: ({ row }) => (
        <span>
          押 {row.depositMonths} 付 {row.paymentMonths}
        </span>
      )
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
    queryForm.currentPage = pagination.currentPage + "";
    queryForm.pageSize = pagination.pageSize + "";

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
  function rowStyle({ row: { leaseId } }) {
    return {
      cursor: "pointer",
      background: leaseId === curRow.value?.leaseId ? "var(--el-fill-color-light)" : ""
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

  function openTenantDialog(title = "添加租客", row?: TenantsCreateFormProps, onSuccess?: (leaseId: string) => void) {
    // 如果只有 roomIds, 但是没有 roomList 时，从接口先获取 roomList，然后再调用 addDialog
    if (row?.lease?.roomIds && !row?.lease?.roomList) {
      getRoomList({ roomIds: row.lease.roomIds, currentPage: "1", pageSize: "1000" }).then(res => {
        if (res.code === 0) {
          row.lease.roomList = res.data.list;
          innerOpenTenantDialog(title, row, onSuccess);
        }
      });
    } else {
      innerOpenTenantDialog(title, row, onSuccess);
    }
  }

  // 内部方法，不对外暴露
  function innerOpenTenantDialog(title = "添加租客", row?: TenantsCreateFormProps, onSuccess?: (leaseId: string) => void) {
    addDialog({
      title: `${title}`,
      props: {
        formInline: {
          title,
          tenantSourceOptions: tenantSourceOptions.value,
          dealChannelOptions: dealChannelOptions.value,
          tenantTagOptions: tenantTagOptions.value,
          ...row
        },
        isEdit: row?.isEdit || false
      },
      top: "1vh",
      width: "70vw",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(TenantCreateForm, { ref: formRef, formInline: null, roomSelection: null }),
      beforeSure: (done, { options }) => {
        // 获取defineExpose的Instance
        const FormInstance = formRef.value;
        const getFormRuleRef = FormInstance?.getRef?.();
        const curData = FormInstance?.formInline;

        // ✅ 关键修改：在验证之前先给 roomIds 赋值
        if (FormInstance?.roomSelection) {
          curData.lease.roomIds = FormInstance.roomSelection.map(item => item.value);
        }

        getFormRuleRef.validate(valid => {
          if (valid) {
            const apiCall = curData?.lease?.id == null ? createTenant : updateTenant;

            // 处理 imageList 字段，图片对象时，提取 url 字段，字符串时，直接添加
            curData.tenantPersonal.idCardBackList = convertImage2string(curData.tenantPersonal.idCardBackList);
            curData.tenantPersonal.idCardFrontList = convertImage2string(curData.tenantPersonal.idCardFrontList);
            curData.tenantPersonal.idCardInHandList = convertImage2string(curData.tenantPersonal.idCardInHandList);
            curData.tenantPersonal.otherImageList = convertImage2string(curData.tenantPersonal.otherImageList);

            const leaseDate = curData.lease.leaseDate || [];
            const checkDate = curData.lease.checkDate || [];
            curData.lease.leaseStart = leaseDate[0];
            curData.lease.leaseEnd = leaseDate[1];
            curData.lease.checkInTime = checkDate[0];
            curData.lease.checkOutTime = checkDate[1];

            apiCall(curData).then(resp => {
              if (resp.code === 0) {
                const tenantName = curData.lease.tenantType === 0 ? curData.tenantPersonal.name : curData.tenantCompany.companyName;
                message(`您${title}了租客"${tenantName}"`, {
                  type: "success"
                });
                onSuccess?.(resp.data);
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
  function openTenantMateDialog(title = "添加", row?: TenantMateVo[], onConfirm?: (data: TenantMateVo[]) => void) {
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

        if (getFormRuleRef) {
          getFormRuleRef.validate((valid: boolean) => {
            if (valid) {
              // 过滤掉空的同住人记录（只有默认值的记录）
              const validMates = formInlines.filter((mate: TenantMateVo) => {
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
          const validMates = formInlines.filter((mate: TenantMateVo) => {
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

  function handleDeleteTenant(row: TenantPersonalVo) {
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
      expiringDaysWithin: undefined,
      pageSize: 15,
      currentPage: 1
    });

    // 重新搜索
    onTenantSearch();
  };

  /**
   * 打开租客详情弹窗
   * @param title - 弹窗标题，默认 "查看"
   * @param row - 要查看的租客数据行
   * @param options - 可选配置项，包含只读模式、合同签署回调、合同更新回调
   */
  function openTenantViewDialog(
    title = "查看",
    row?: { leaseId: string },
    options?: { readonly?: boolean; onContractSigned?: (leaseId: string) => void; onContractUpdated?: () => void }
  ) {
    // 设置 loading 状态为 true
    loading.value = true;

    // 从 API 获取租客详情
    getLeaseDetail({ leaseId: row.leaseId })
      .then(resp => {
        loading.value = false;

        if (resp.code === 0) {
          const tenantDetail = resp.data;
          // 合并 row 数据和 API 返回的详情数据
          addDialog({
            title: `${title} ${tenantDetail?.tenantName}`,
            props: {
              formInline: {
                title,
                ...tenantDetail
              },
              readonly: options?.readonly || false, // 传递只读标志
              // 传递事件处理器
              onContractSigned:
                options?.onContractSigned ||
                ((leaseId: string) => {
                  updateTenantRowStatus(leaseId, 1);
                }),
              onContractUpdated:
                options?.onContractUpdated ||
                (() => {
                  onTenantSearch();
                })
            },
            top: "1vh",
            width: "70vw",
            lockScroll: true,
            alignCenter: true,
            draggable: true,
            fullscreen: false,
            fullscreenIcon: true,
            closeOnClickModal: false,
            hideFooter: true,
            contentRenderer: () => h(ViewTenantDialog, { ref: formRef, formInline: null }),
            beforeSure: (done, { options }) => {}
          });
        } else {
          message(resp.message, {
            type: "error"
          });
        }
      })
      .catch(error => {
        // 异常情况下也要设置 loading 状态为 false
        loading.value = false;
        message("获取租客详情失败", {
          type: "error"
        });
      });
  }

  // 辅助函数：只更新指定租客的状态（可选，更高效）
  function updateTenantRowStatus(leaseId: string, signStatus: number) {
    const tenant = tenantList.value.find(t => t.leaseId === leaseId);
    if (tenant) {
      // 修改为在租状态
      tenant.status = signStatus;
    }
  }

  /** 租客续约 */
  const openTenantRenewDialog = (row: LeaseListVo) => {
    if (!row?.leaseId) {
      message("租约信息不完整，无法续约", { type: "warning" });
      return;
    }
    getLeaseDetail({ leaseId: row.leaseId })
      .then(resp => {
        if (resp.code !== 0) {
          message(resp.message || "获取租约详情失败", { type: "error" });
          return;
        }

        // 续约时过滤掉预定租金
        resp.data.otherFees = resp.data.otherFees?.filter(fee => fee.dictDataId !== "0") || [];

        const detail = resp.data;
        // 续约开始时间默认是当前租约结束时间的后一天
        const renewStart = addDays(detail.leaseEnd, 1);
        const renewEnd = addMonth(detail.leaseEnd, 12);

        const renewData: TenantsCreateFormProps = {
          tenantPersonal: toTenantPersonalDto(detail.tenantPersonal), // Vo → Dto
          tenantCompany: toTenantCompanyDto(detail.tenantCompany), // Vo → Dto
          tenantMateList: detail.tenantMateList || [],
          lease: {
            ...toLeaseDto(detail), // Vo → Dto 基础字段
            id: undefined,
            tenantId: detail.tenantId,
            parentLeaseId: detail.leaseId,
            contractNature: 2, // 续约
            leaseStart: renewStart,
            leaseEnd: renewEnd,
            leaseDate: [renewStart, renewEnd],
            checkDate: detail.checkOutTime ? [detail.checkOutTime, null] : undefined
          },
          otherFees: detail.otherFees || []
        };
        openTenantDialog("续签租约 " + detail.tenantName, renewData);
      })
      .catch(() => {
        message("获取租约详情失败", { type: "error" });
      });
  };

  /** TenantPersonalVo → TenantPersonalDto */
  function toTenantPersonalDto(vo?: TenantPersonalVo): TenantPersonalDto | undefined {
    if (!vo) return undefined;
    return {
      id: vo.id,
      companyId: vo.companyId ? Number(vo.companyId) : undefined,
      name: vo.name,
      gender: vo.gender,
      idType: vo.idType,
      idNo: vo.idNo,
      phone: vo.phone,
      tags: vo.tags,
      remark: vo.remark,
      idCardFrontList: vo.idCardFrontList,
      idCardBackList: vo.idCardBackList,
      idCardInHandList: vo.idCardInHandList,
      otherImageList: vo.otherImageList
    };
  }

  /** TenantCompanyVo → TenantCompanyDto */
  function toTenantCompanyDto(vo?: TenantCompanyVo): TenantCompanyDto | undefined {
    if (!vo) return undefined;
    return {
      id: vo.id,
      companyName: vo.companyName,
      uscc: vo.uscc,
      legalPerson: vo.legalPerson,
      legalPersonIdType: vo.legalPersonIdType,
      legalPersonIdNo: vo.legalPersonIdNo,
      contactName: vo.contactName,
      contactPhone: vo.contactPhone,
      registeredAddress: vo.registeredAddress,
      // Vo 是 businessLicenseList（数组），Dto 是 businessLicenseUrl（单个字符串）
      businessLicenseUrls: vo.businessLicenseList,
      tags: vo.tags,
      remark: vo.remark,
      status: vo.status
    };
  }

  /** LeaseDetailVo（铺展形式）→ LeaseDto 的基础字段（续约专用） */
  function toLeaseDto(vo: LeaseDetailVo): LeaseProps {
    return {
      tenantId: vo.tenantId,
      companyId: vo.companyId,
      deptId: vo.deptId,
      // Vo 中 roomIds 是逗号拼接的字符串，Dto 需要数组
      roomIds: vo.roomIds,
      roomList: vo.roomList || [],
      tenantType: vo.tenantType,
      rentPrice: vo.rentPrice,
      depositMonths: vo.depositMonths,
      paymentMonths: vo.paymentMonths,
      // firstBillDay: vo.firstBillDay,
      rentDueType: vo.rentDueType,
      rentDueDay: vo.rentDueDay,
      rentDueOffsetDays: vo.rentDueOffsetDays,
      salesmanId: vo.salesmanId,
      helperId: vo.helperId,
      tenantSource: vo.tenantSource,
      dealChannel: vo.dealChannel,
      remark: vo.remark
      // leaseStart/leaseEnd/checkDate 由续约逻辑单独覆盖，不在这里设置
    };
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
    openTenantMateDialog,
    openTenantRenewDialog
  };
}

export default useTenant;
