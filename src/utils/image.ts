/**
 * @param imageList 图片列表，可能包含字符串（URL）或对象（包含URL属性）
 * @returns 转换后的字符串数组，所有元素都是URL字符串
 */
export function convertImage2string(imageList: any[]) {
  const converted: string[] = [];

  if (imageList) {
    imageList.forEach(item => {
      if (typeof item === "string") {
        converted.push(item);
      } else {
        converted.push(item.url || "");
      }
    });
  }

  return converted;
}
