
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    currentPage: number;
    totalPages: number;
  }

 