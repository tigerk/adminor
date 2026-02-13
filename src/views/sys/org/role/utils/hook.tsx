import dayjs from "dayjs";
import editForm from "../form.vue";
import { handleTree } from "@/utils/tree";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { usePublicHooks } from "@/utils/publicHooks";
import { transformI18n } from "@/plugins/i18n";
import { addDialog } from "@/components/ReDialog";
import type { FormItemProps } from "../utils/types";
import type { PaginationProps } from "@pureadmin/table";
import { deviceDetection, getKeyList } from "@pureadmin/utils";
import { assignRoleMenu, createRole, deleteRole, getRoleList, getRoleMenuIds } from "@/api/sys/user";
import { computed, h, onMounted, reactive, type Ref, ref, toRaw, watch } from "vue";
import { getMenuList } from "@/api/sys/menu";

export function useRole(treeRef: Ref) {
  const form = reactive({
    name: "",
    code: "",
    status: ""
  });
  const curRow = ref();
  const formRef = ref();
  const dataList = ref([]);
  const treeIds = ref([]);
  const treeData = ref([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();
  const switchLoadMap = ref({});
  const isExpandAll = ref(false);
  const isSelectAll = ref(false);
  const { switchStyle } = usePublicHooks();
  const treeProps = {
    value: "id",
    label: "title",
    children: "children"
  };
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });
  const columns: TableColumnList = [
    {
      label: "角色编号",
      prop: "id",
      width: 100,
      hide: true
    },
    {
      label: "角色名称",
      prop: "name"
    },
    {
      label: "角色标识",
      prop: "code"
    },
    {
      label: "用户数量",
      prop: "userCount",
      width: 80
    },
    {
      label: "状态",
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
      ),
      minWidth: 90
    },
    {
      label: "备注",
      prop: "remark",
      minWidth: 160
    },
    {
      label: "创建人",
      prop: "createByName",
      minWidth: 100
    },
    {
      label: "创建时间",
      prop: "createTime",
      minWidth: 160,
      formatter: ({ createTime }) => dayjs(createTime).format("YYYY-MM-DD HH:mm:ss")
    },
    {
      label: "操作",
      fixed: "right",
      width: 500,
      slot: "operation"
    }
  ];
  const buttonClass = computed(() => {
    return ["h-[20px]!", "reset-margin", "text-gray-500!", "dark:text-white!", "dark:hover:text-primary!"];
  });

  function onChange({ row, index }) {
    ElMessageBox.confirm(`确认要<strong>${row.status === 0 ? "停用" : "启用"}</strong><strong style='color:var(--el-color-primary)'>${row.name}</strong>吗?`, "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      dangerouslyUseHTMLString: true,
      draggable: true
    })
      .then(() => {
        switchLoadMap.value[index] = Object.assign({}, switchLoadMap.value[index], {
          loading: true
        });
        setTimeout(() => {
          switchLoadMap.value[index] = Object.assign({}, switchLoadMap.value[index], {
            loading: false
          });
          message(`已${row.status === 0 ? "停用" : "启用"}${row.name}`, {
            type: "success"
          });
        }, 300);
      })
      .catch(() => {
        row.status === 0 ? (row.status = 1) : (row.status = 0);
      });
  }

  /** 删除角色 */
  function handleDelete(row) {
    deleteRole({ id: row.id }).then(resp => {
      if (resp.code === 0) {
        message(`您删除了角色名称为${row.name}的这条数据`, { type: "success" });
        onRoleSearch().then(() => {});
      } else {
        message(resp.message, { type: "error" });
      }
    });
  }

  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
  }

  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
  }

  function handleSelectionChange(val) {
    console.log("handleSelectionChange", val);
  }

  async function onRoleSearch() {
    loading.value = true;
    const { data } = await getRoleList(toRaw(form));
    dataList.value = data.list;
    pagination.total = Number(data.total);
    pagination.pageSize = Number(data.pageSize);
    pagination.currentPage = Number(data.currentPage);

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onRoleSearch();
  };

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}角色`,
      props: {
        formInline: {
          id: row?.id ?? null,
          name: row?.name ?? "",
          code: row?.code ?? "",
          remark: row?.remark ?? ""
        }
      },
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        function chores() {
          createRole(curData).then(resp => {
            if (resp.code === 0) {
              message(`您${title}了角色名称为${curData.name}的这条数据`, {
                type: "success"
              });
              // 关闭弹框
              done();
              // 刷新表格数据
              onRoleSearch().then();
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
            chores();
          }
        });
      }
    });
  }

  /** 菜单权限 */
  async function handleMenu(row?: any) {
    const { id } = row;
    if (id) {
      curRow.value = row;
      isShow.value = true;
      const { data } = await getRoleMenuIds({ id });
      treeRef.value.setCheckedKeys(data);
    } else {
      curRow.value = null;
      isShow.value = false;
    }
  }

  /** 高亮当前权限选中行 */
  function rowStyle({ row: { id } }) {
    return {
      cursor: "pointer",
      background: id === curRow.value?.id ? "var(--el-fill-color-light)" : ""
    };
  }

  /** 菜单权限-保存 */
  function handleSave() {
    const { id, name } = curRow.value;
    // 根据用户 id 调用实际项目中菜单权限修改接口
    const checkedKeys = treeRef.value.getCheckedKeys();

    console.log(id, checkedKeys);
    if (checkedKeys.length === 0) {
      message("请选择给角色分配的菜单权限", {
        type: "warning"
      });
      return;
    }

    assignRoleMenu({
      roleId: id,
      menuIds: checkedKeys
    }).then(resp => {
      if (resp.code === 0) {
        message(`角色名称为${name}的菜单权限修改成功`, {
          type: "success"
        });
      } else {
        message(resp.message, {
          type: "error"
        });
      }
    });
  }

  const onQueryChanged = (query: string) => {
    treeRef.value!.filter(query);
  };

  const filterMethod = (query: string, node) => {
    return transformI18n(node.title)!.includes(query);
  };

  onMounted(async () => {
    onRoleSearch();
    const { data } = await getMenuList();
    treeIds.value = getKeyList(data, "id");
    treeData.value = handleTree(data);
  });

  watch(isExpandAll, val => {
    val ? treeRef.value.setExpandedKeys(treeIds.value) : treeRef.value.setExpandedKeys([]);
  });

  watch(isSelectAll, val => {
    val ? treeRef.value.setCheckedKeys(treeIds.value) : treeRef.value.setCheckedKeys([]);
  });

  /** 数据权限 可自行开发 */
  function handleDatabase() {}

  // 在 useRole 函数中添加以下状态
  const showUserDrawer = ref(false);
  const currentRoleInfo = ref<{ id: number | string; name: string } | null>(null);

  // 修改 handleRoleUser 函数
  function handleRoleUser(row?: any) {
    const { id, name } = row;
    if (id) {
      currentRoleInfo.value = { id, name };
      showUserDrawer.value = true;
    } else {
      message("请选择角色", {
        type: "error"
      });
    }
  }

  return {
    form,
    isShow,
    curRow,
    loading,
    columns,
    rowStyle,
    dataList,
    treeData,
    treeProps,
    isLinkage,
    pagination,
    isExpandAll,
    isSelectAll,
    treeSearchValue,
    buttonClass,
    onRoleSearch,
    resetForm,
    openDialog,
    handleMenu,
    handleSave,
    handleDelete,
    filterMethod,
    transformI18n,
    onQueryChanged,
    handleDatabase,
    handleSizeChange,
    handleCurrentChange,
    handleSelectionChange,
    handleRoleUser,
    showUserDrawer, // 新增
    currentRoleInfo // 新增
  };
}
