interface FormItemProps {
  id: number | null;
  higherDeptOptions: Record<string, unknown>[];
  parentId: number;
  name: string;
  supervisorId: string;
  supervisorOptions: Array<{ label: string; value: string }>;
  supervisorName?: string;
  sortOrder: number;
  status: number;
  remark: string;
  isStore: boolean;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
