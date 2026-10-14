export default function Pagination({ page, totalPages, total, pageSize, onPageChange, onPageSizeChange }) {
  if (totalPages <= 0) return null

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  const canPrev = page > 1
  const canNext = page < totalPages

  // Build a compact page list: 1 ... 4 5 [6] 7 8 ... 20
  const pages = []
  const add = (n) => pages.push(n)
  const range = (a, b) => { for (let i = a; i <= b; i++) add(i) }

  if (totalPages <= 7) {
    range(1, totalPages)
  } else {
    add(1)
    if (page > 4) add('…')
    range(Math.max(2, page - 1), Math.min(totalPages - 1, page + 1))
    if (page < totalPages - 3) add('…')
    add(totalPages)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50">
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>
          Showing <span className="font-medium">{startItem}</span>–<span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{total}</span>
        </span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(parseInt(e.target.value, 10))}
          className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[10, 25, 50, 100].map(n => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {pages.map((p, i) => {
          if (p === '…') {
            return <span key={`gap-${i}`} className="px-2 text-gray-400 text-sm">…</span>
          }
          const active = p === page
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                active
                  ? 'bg-blue-600 border-blue-600 text-white font-medium'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}