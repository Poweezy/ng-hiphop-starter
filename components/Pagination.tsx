'use client';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
    }

    return (
        <nav className="pagination" aria-label="Pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn pagination-btn--prev"
                aria-label="Previous page"
            >
                ‹ Prev
            </button>
            {pages.map((page, idx) =>
                typeof page === 'number' ? (
                    <button
                        key={idx}
                        onClick={() => onPageChange(page)}
                        className={`pagination-btn ${currentPage === page ? 'pagination-btn--active' : ''}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={idx} className="pagination-ellipsis">{page}</span>
                )
            )}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn pagination-btn--next"
                aria-label="Next page"
            >
                Next ›
            </button>
        </nav>
    );
}
