export default {
  path: "/my-notice",
  name: "NoticeMy",
  meta: {
    title: "我的消息",
    icon: "ep:bell",
    sortOrder: 199,
    showLink: true
  },
  children: [
    {
      path: "/my-notice/notice/index",
      name: "NoticeMyNotice",
      meta: {
        title: "系统公告",
        icon: "ri:notification-line",
        showParent: true
      }
    },
    {
      path: "/my-notice/message/index",
      name: "NoticeMyMessage",
      meta: {
        title: "个人消息",
        icon: "ri:message-3-line",
        showParent: true
      }
    },
    {
      path: "/my-notice/todo/index",
      name: "NoticeMyTodo",
      meta: {
        title: "我的待办",
        icon: "ri:todo-line",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
