// 虽然字段很少 但是抽离出来 后续有扩展字段需求就很方便了

interface QueryFormItemProps {
  keywords: string;
  houseId: number;
  roomStatus: number;
}
interface FormProps {
  formInline: QueryFormItemProps;
}

export type { QueryFormItemProps, FormProps };
