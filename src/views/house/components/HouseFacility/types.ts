interface FacilityItemProps {
  name: string;
  count: number;
}

// 表单
interface FacilityFormProps {
  formInline: FacilityItemProps[];
}

export type { FacilityItemProps, FacilityFormProps };
