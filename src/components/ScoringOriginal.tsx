import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useEffect, useState } from "react";

function ScoringOriginal({
  fileGUID,
  translationsCount,
  setSelectedRowData,
  selectedSequence,
  data,
  setData,
  fetchDataOnScroll,
}: any) {
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "sequenceNumber",
        size: 50,
        header: () => "Sequence",
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "Timestamp",
        size: 100,
        header: () => "Timestamp",
        cell: ({ row }) =>
          `${row?.original?.startTime || ""} - ${row?.original?.endTime || ""}`,
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "score",
        size: 50,
        header: () => "Score",
        cell: ({ row }) =>
          row?.original?.score ? row.original.score.toFixed(2) : 0,
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "sourceText",
        size: 300,
        header: () => "Source Text",
        footer: (props) => props.column.id,
        enableSorting: false,
      },
    ],
    []
  );

  return (
    <MyTable
      {...{
        fileGUID,
        translationsCount,
        columns,
        setSelectedRowData,
        selectedSequence,
        data,
        setData,
        fetchDataOnScroll,
      }}
    />
  );
}

function MyTable({
  translationsCount,
  columns,
  setSelectedRowData,
  selectedSequence,
  data,
  setData,
  fetchDataOnScroll,
}: any) {
  const [page, setPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const table = useReactTable({
    columns,
    data,
    initialState: data,
    debugTable: true,
    enableMultiRowSelection: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    pageCount: page,
    manualPagination: true,
  });

  useEffect(() => {
    const loadMoreData = async () => {
      setIsLoading(true);
      const newData = await fetchDataOnScroll(offset);
      setData((prevData: any) => [...prevData, ...newData]);
      setIsLoading(false);
    };
    loadMoreData();
  }, [page, offset]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const maxPage = Math.ceil(translationsCount / 10);
    if (page < maxPage) {
      const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
      if (scrollHeight - Math.ceil(scrollTop) === clientHeight && !isLoading) {
        setPage((prevPage) => prevPage + 1);
        setOffset((prev) => prev + 10);
      }
    }
  };

  const onRowSelection = (row: any) => {
    setSelectedRowData(row);
  };

  return (
    <div className="p-2" onScroll={handleScroll} style={{ overflowY: "auto" }}>
      <div className="h-2" />
      <table className="scoring-table" style={{ cursor: "pointer" }}>
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
          {table.getRowModel().rows.map((row: any) => {
            return (
              <tr
                className={
                  row.original.sequenceNumber === selectedSequence
                    ? "sequence-item-selected"
                    : ""
                }
                key={row.id}
                onClick={() => onRowSelection(row.original)}
              >
                {row.getVisibleCells().map((cell: any) => {
                  return (
                    <td key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="h-2" />
    </div>
  );
}

export default ScoringOriginal;
