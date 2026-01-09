import type { PaginationProps } from "@pureadmin/table";
import { reactive } from "vue";
import type { BookingQueryParams } from "@/types";

export function useContractBooking() {
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 15,
    currentPage: 1,
    background: true
  });

  const queryForm = reactive<BookingQueryParams>({});
}
