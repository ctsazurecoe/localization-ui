import {
  ColumnDef,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { Link } from "react-router-dom";

function Dashboard({ data }: any) {
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "NAME",
        cell: ({ row }) => (
          <u>
            <a href={row.original.INPUT_URL}>{row.original.NAME}</a>
          </u>
        ),
        header: () => "File Name",
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "LANGUAGE",
        size: 50,
        header: () => "Source Language",
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "LAST_UPDATED",
        size: 50,
        header: () => "Last Updated",
        cell: ({ row }) =>
          row?.original?.LAST_UPDATED
            ? new Date(row.original.LAST_UPDATED).toLocaleString("en-US", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "",
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "actions",
        size: 50,
        header: () => "Actions",
        cell: ({ row }) => (
          <Link to={`/localization`} state={{ ...row.original }}>
            <u>Transcribe</u>
          </Link>
        ),
        footer: (props) => props.column.id,
      },
    ],
    []
  );

  return (
    <MyTable
      {...{
        data,
        columns,
      }}
    />
  );
}

function MyTable({
  data,
  columns,
}: {
  data: any[];
  columns: ColumnDef<any>[];
}) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    columns,
    data,
    debugTable: true,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "auto",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    //no need to pass pageCount or rowCount with client-side pagination as it is calculated automatically
    state: {
      pagination,
      globalFilter,
    },
    // autoResetPageIndex: false, // turn off page index reset when sorting or filtering
  });

  return (
    <div className="p-2">
      <div className="search-all-columns">
        <DebouncedInput
          value={globalFilter ?? ""}
          onChange={(value: any) => setGlobalFilter(String(value))}
          className="search-input p-2 font-lg shadow border border-block"
          placeholder="Search"
        />
      </div>
      <div className="h-2" />
      <table className="file-upload-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() }}
                  >
                    <div
                      {...{
                        className: header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : "",
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {data?.length > 0 ? (
            table.getRowModel().rows.map((row) => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          ) : (
            <tr style={{ textAlign: "center" }}>
              <td colSpan={columns.length}>No data found</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="h-2" />
      {data?.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-boxes">
            <button
              className="border rounded p-1"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {"<"}
            </button>
            <button
              className="border rounded p-1"
              style={{ cursor: "default" }}
            >
              {table.getState().pagination.pageIndex + 1}
            </button>
            <button
              className="border rounded p-1"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {">"}
            </button>
          </div>
          <span className="flex items-center gap-1">
            <strong> of {table.getPageCount().toLocaleString()}</strong>
          </span>
          <div style={{ display: "none" }}>
            Showing {table.getRowModel().rows.length.toLocaleString()} of{" "}
            {table.getRowCount().toLocaleString()} Rows
          </div>
        </div>
      )}
    </div>
  );
}

// A typical debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

export default Dashboard;
