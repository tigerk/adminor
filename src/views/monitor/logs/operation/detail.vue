<script setup lang="tsx">
  import { ref } from "vue";
  import "vue-json-pretty/lib/styles.css";
  import VueJsonPretty from "vue-json-pretty";
  import PureDescriptions from "@pureadmin/descriptions";

  const props = defineProps({
    data: {
      type: Array,
      default: () => []
    }
  });

  const columns = [
    {
      label: "IP 地址",
      prop: "ipAddress"
    },
    {
      label: "地点",
      prop: "location"
    },
    {
      label: "操作系统",
      prop: "os"
    },
    {
      label: "浏览器类型",
      prop: "browser"
    },
    {
      label: "所属模块",
      prop: "title"
    },
    {
      label: "请求时间",
      prop: "requestTime"
    },
    {
      label: "请求方法",
      prop: "method"
    },
    {
      label: "请求耗时",
      prop: "costTime"
    },
    {
      label: "请求接口",
      prop: "requestUrl",
      copy: true
    },
    {
      label: "TraceId",
      prop: "traceId",
      copy: true
    }
  ];

  const dataList = ref([
    {
      title: "响应体",
      name: "responseBody",
      data: parseStr2Json((props.data[0] as any).jsonResult)
    },
    {
      title: "请求体",
      name: "requestBody",
      data: parseStr2Json((props.data[0] as any).param)
    }
  ]);

  function parseStr2Json(str: string) {
    try {
      const obj = JSON.parse(str);
      console.log(obj);

      return obj;
    } catch (err) {
      console.error("解析失败：", err.message);
    }

    return str;
  }
</script>

<template>
  <div>
    <el-scrollbar>
      <PureDescriptions border :data="data" :columns="columns" :column="5" />
    </el-scrollbar>
    <el-tabs :modelValue="'responseBody'" type="border-card" class="mt-4">
      <el-tab-pane
        v-for="(item, index) in dataList"
        :key="index"
        :name="item.name"
        :label="item.title"
      >
        <el-scrollbar max-height="calc(100vh - 240px)">
          <vue-json-pretty v-model:data="item.data" />
        </el-scrollbar>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
