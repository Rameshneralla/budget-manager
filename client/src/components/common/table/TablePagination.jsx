/** "Showing 1-25 of 40" + rows-per-page + previous/next page controls. */
import Form from 'react-bootstrap/Form';
import Pagination from 'react-bootstrap/Pagination';
import { PAGE_SIZE_OPTIONS } from '../../../constants';

export default function TablePagination({
  page,
  totalPages,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
}) {
  const firstShown = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastShown = Math.min(page * pageSize, totalRecords);

  return (
    <div className="table-footer">
      <span aria-live="polite">
        Showing {firstShown}–{lastShown} of {totalRecords}
      </span>
      <div className="d-flex flex-wrap align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <Form.Label htmlFor="page-size" className="mb-0">
            Rows
          </Form.Label>
          <Form.Select
            id="page-size"
            size="sm"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Form.Select>
        </div>
        {totalPages > 1 && (
          <Pagination size="sm" aria-label="Table pages">
            <Pagination.Prev
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            />
            <Pagination.Item active aria-current="page">
              {page} / {totalPages}
            </Pagination.Item>
            <Pagination.Next
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            />
          </Pagination>
        )}
      </div>
    </div>
  );
}
