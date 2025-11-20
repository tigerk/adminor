export function useToolUtils() {
  /**
   * 格式化部门树结构，用于上级部门级联选择器的展示
   */
  const formatHigherDeptOptions = (treeList: any) => {
    // 根据返回数据的status字段值判断追加是否禁用disabled字段，返回处理后的树结构，用于上级部门级联选择器的展示（实际开发中也是如此，不可能前端需要的每个字段后端都会返回，这时需要前端自行根据后端返回的某些字段做逻辑处理）
    if (!treeList?.length) {
      return;
    }
    const newTreeList = [];
    for (const element of treeList) {
      element.disabled = element.status === 0;
      formatHigherDeptOptions(element.children);
      newTreeList.push(element);
    }
    return newTreeList;
  };

  return {
    formatHigherDeptOptions
  };
}
