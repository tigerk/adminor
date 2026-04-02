interface QueryFormItemProps {
  keywords?: string;
  houseId?: string;
  leaseModeId?: string;
  occupancyStatus?: number;
  locked?: boolean;
  closed?: boolean;
  vacancyDaysMin?: number;
  vacancyDaysMax?: number;
}

interface FormProps {
  formInline: QueryFormItemProps;
}

export type { QueryFormItemProps, FormProps };
