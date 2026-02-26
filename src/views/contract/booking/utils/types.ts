import type { LeaseDto } from "@/types";

export interface LeaseProps extends LeaseDto {
  leaseDate: string[];
  checkDate: string[];
}
