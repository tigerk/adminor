import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

type Result = {
  code: number;
  message: string;
  data: string;
};

/** 上传文件 */
export const uploadFile = (data?: object, onProgress?: (progress: number) => void) => {
  return http.request<Result>(
    "post",
    baseUrlApi("file/upload"),
    { data },
    {
      headers: {
        "Content-Type": "multipart/form-data"
      },
      // 添加上传进度回调
      onUploadProgress: progressEvent => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    }
  );
};
