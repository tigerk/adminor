import dayjs from "dayjs";
import editForm from "../form.vue";
import { message } from "@/utils/message";
import { deleteApprovalFlow, getApprovalFlowList, getBizTypeOptions, saveApprovalFlow, toggleApprovalFlowStatus } from "@/api/approval";
import { addDialog } from "@/components/ReDialog";
import { h, onMounted, reactive, ref } from "vue";
import { cloneDeep, deviceDetection } from "@pureadmin/utils";
import { ElMessageBox } from "element-plus";
import type { ApprovalFormItemProps } from "@/types";

export function useApprovalFlow() {
  const formRef = ref();
  const dataList = ref([]);
  const loading = ref(true);
  const bizTypeOptions = ref<Array<{ label: string; value: string }>>([]);
  const tableSize = ref("default");

  const queryForm = reactive({
    flowName: "",
    bizType: "",
    enabled: undefined as boolean | undefined
  });

  const columns: TableColumnList = [
    {
      label: "流程名称",
      prop: "flowName",
      minWidth: 150
    },
    {
      label: "业务类型",
      prop: "bizTypeName",
      minWidth: 120,
      cellRenderer: ({ row }) => <el-tag>{row.bizTypeName}</el-tag>
    },
    {
      label: "审批节点",
      prop: "nodes",
      minWidth: 300,
      cellRenderer: ({ row }) => (
        <div class="node-flow">
          <el-space size={0}>
            {row.nodes?.map((node, index) => (
              <>
                <el-tag type="info">{node.nodeName}</el-tag>
                {index < row.nodes.length - 1 && <span class="node-arrow mx-1">→</span>}
              </>
            ))}
          </el-space>
        </div>
      )
    },
    {
      label: "状态",
      prop: "enabled",
      width: 100,
      cellRenderer: ({ row }) => <el-switch v-model={row.enabled} inline-prompt active-text="启用" inactive-text="停用" onChange={() => handleToggleStatus(row)} />
    },
    {
      label: "创建时间",
      prop: "createTime",
      minWidth: 180,
      formatter: ({ createTime }) => (createTime ? dayjs(createTime).format("YYYY-MM-DD HH:mm:ss") : "")
    },
    {
      label: "操作",
      fixed: "right",
      width: 140,
      slot: "operation"
    }
  ];

  async function onSearch() {
    loading.value = true;
    try {
      const { data } = await getApprovalFlowList();
      let list = data || [];

      // 前端过滤
      if (queryForm.flowName) {
        list = list.filter(item => item.flowName?.includes(queryForm.flowName));
      }
      if (queryForm.bizType) {
        list = list.filter(item => item.bizType === queryForm.bizType);
      }
      if (queryForm.enabled !== undefined) {
        list = list.filter(item => item.enabled === queryForm.enabled);
      }

      dataList.value = list;
    } finally {
      loading.value = false;
    }
  }

  async function loadBizTypeOptions() {
    const { data } = await getBizTypeOptions();
    bizTypeOptions.value = data.map(item => ({ label: item.name, value: item.code }));
  }

  function resetQueryForm() {
    queryForm.flowName = "";
    queryForm.bizType = "";
    queryForm.enabled = undefined;
    onSearch();
  }

  function openDialog(title = "新增", row?: ApprovalFormItemProps) {
    addDialog({
      title: `${title}审批流程`,
      props: {
        formInline: {
          id: row?.id ?? null,
          flowName: row?.flowName ?? "",
          bizType: row?.bizType ?? "",
          enabled: row?.enabled ?? true,
          remark: row?.remark ?? "",
          nodes: row?.nodes ? cloneDeep(row.nodes) : []
        },
        bizTypeOptions: bizTypeOptions.value
      },
      width: "680px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null, bizTypeOptions: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as ApprovalFormItemProps;

        FormRef.validate(valid => {
          if (valid) {
            if (curData.nodes.length === 0) {
              message("请至少添加一个审批节点", { type: "warning" });
              return;
            }

            for (const node of curData.nodes) {
              if (!node.nodeName) {
                message("请填写节点名称", { type: "warning" });
                return;
              }
              if (node.approverType !== 3 && (!node.approverIds || node.approverIds.length === 0)) {
                message(`请为节点「${node.nodeName}」选择审批人`, { type: "warning" });
                return;
              }
            }

            curData.nodes.forEach((node, index) => {
              node.nodeOrder = index + 1;
            });

            saveApprovalFlow(curData).then(resp => {
              if (resp.code === 0) {
                message(`${title}成功`, { type: "success" });
                done();
                onSearch();
              } else {
                message(resp.message, { type: "error" });
              }
            });
          }
        });
      }
    });
  }

  function handleConfirmDelete(row: ApprovalFormItemProps) {
    ElMessageBox.confirm(`确认删除流程「${row.flowName}」吗？`, "删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(() => {
        deleteApprovalFlow(row.id).then(resp => {
          if (resp.code === 0) {
            message("删除成功", { type: "success" });
            onSearch();
          }
        });
      })
      .catch(() => {});
  }

  function handleToggleStatus(row: ApprovalFormItemProps) {
    toggleApprovalFlowStatus(row.id).then(resp => {
      if (resp.code === 0) {
        message(row.enabled ? "已启用" : "已停用", { type: "success" });
      } else {
        row.enabled = !row.enabled;
      }
    });
  }

  onMounted(() => {
    onSearch();
    loadBizTypeOptions();
  });

  return {
    queryForm,
    loading,
    columns,
    dataList,
    tableSize,
    bizTypeOptions,
    onSearch,
    resetQueryForm,
    openDialog,
    handleConfirmDelete,
    handleToggleStatus
  };
}
