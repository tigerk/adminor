import { ElLoading } from "element-plus";

let loading: any;

export function showLoading(text = "加载中...") {
  loading = ElLoading.service({
    lock: true,
    text,
    background: "rgba(0,0,0,0.6)"
  });
}

export function hideLoading() {
  loading?.close();
}
