import dayjs from "dayjs";
import { message } from "@/utils/message";
import { getOnlineUsers, offlineUser } from "@/api/monitor";
import { reactive, ref, onMounted, toRaw } from "vue";

export function useRole() {
  const form = reactive({
    username: ""
  });
  const dataList = ref([]);
  const loading = ref(true);
  const columns: TableColumnList = [
    {
      label: "序号",
      prop: "id",
      minWidth: 60
    },
    {
      label: "用户名",
      prop: "username",
      minWidth: 100
    },
    {
      label: "登录 IP",
      prop: "ipAddress",
      minWidth: 140
    },
    {
      label: "登录地点",
      prop: "loginLocation",
      minWidth: 140
    },
    {
      label: "操作系统",
      prop: "os",
      minWidth: 100
    },
    {
      label: "浏览器类型",
      prop: "browser",
      minWidth: 100
    },
    {
      label: "登录时间",
      prop: "loginTime",
      minWidth: 180,
      formatter: ({ loginTime }) =>
        dayjs(loginTime).format("YYYY-MM-DD HH:mm:ss")
    },
    {
      label: "操作",
      fixed: "right",
      slot: "operation"
    }
  ];

  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
  }

  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
  }

  function handleSelectionChange(val) {
    console.log("handleSelectionChange", val);
  }

  function handleOffline(row) {
    offlineUser(row).then(res => {
      if (res.code === 0) {
        message(`${row.username}已被强制下线`, { type: "success" });
        onSearch();
      }
    });
  }

  async function onSearch(username?: string) {
    loading.value = true;
    const { data } = await getOnlineUsers(toRaw(form));
    dataList.value = data;
    if (username != null && username != "") {
      dataList.value = data.filter(item => item.username.includes(username));
    }

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  onMounted(() => {
    onSearch();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    onSearch,
    resetForm,
    handleOffline,
    handleSizeChange,
    handleCurrentChange,
    handleSelectionChange
  };
}
