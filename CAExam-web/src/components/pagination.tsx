import { PAGE_SIZE } from "../api";

interface Props {
  pageSize?: number;
  totalCount: number;
  pageNumber: number;
  onPageChange: (value: React.SetStateAction<number>) => void;
}

export const PageList = ({
  pageSize = PAGE_SIZE,
  totalCount,
  pageNumber,
  onPageChange,
}: Props) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="join mx-auto">
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          onClick={() => onPageChange(index + 1)}
          className={`join-item btn btn-square ${index + 1 === pageNumber ? 'btn-active' : ''}`}
          type="button"
          aria-label={`Page ${index + 1}`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
};
