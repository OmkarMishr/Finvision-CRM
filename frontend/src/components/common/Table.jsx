const Table = ({ columns, data, loading = false, onRowClick, className = '' }) => {
    return (
      <div className={cn('overflow-hidden rounded-2xl border border-gray-200', className)}>
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 p-6 font-semibold text-gray-700 border-b border-gray-100">
            {columns.map((column, index) => (
              <div key={index} className="truncate font-medium">
                {column.label}
              </div>
            ))}
          </div>
        </div>
  
        {/* Body */}
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-gray-400">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No data found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            data.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={cn(
                  'grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 p-6 hover:bg-gray-50 cursor-pointer transition-colors',
                  onRowClick && 'hover:shadow-sm'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column, colIndex) => (
                  <div key={colIndex} className="truncate">
                    {column.render ? column.render(row) : row[column.key]}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }
  
  export default Table
  