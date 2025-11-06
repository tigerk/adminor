interface QueryFormItemProps {
  keywords: string;
  houseId: number;
  roomStatus: number;
}

interface FormProps {
  formInline: QueryFormItemProps;
}

export type { QueryFormItemProps, FormProps };
