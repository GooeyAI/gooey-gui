import type { GridCell, Item } from "@glideapps/glide-data-grid";
import {
  DataEditor,
  GridCellKind,
  GridColumnIcon,
} from "@glideapps/glide-data-grid";
import glideappsStyles from "@glideapps/glide-data-grid/dist/index.css";
import type { LinksFunction } from "@remix-run/node";
import { useCallback, useEffect, useState } from "react";
import XLSX from "xlsx";
import LoadingFallback from "./loadingfallback";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: glideappsStyles }];
};

const maxColWidth = 300;

export function DataTableRaw({ cells }: { cells: Array<any> }) {
  let [data, setData] = useState<Array<any>>([]);
  let [columns, setColumns] = useState<Array<any>>([]);

  useEffect(() => {
    setData(cells.slice(1));
    setColumns(
      Array.from(
        cells[0].map((colName: any, idx: number) => {
          if (typeof colName === "object") {
            colName = colName.data;
          }
          const width = Math.min(
            Math.max(
              ...cells.map(
                (row: any) => `${row[idx].data || row[idx] || ""}`.length * 8
              ),
              colName.length * 20
            ),
            maxColWidth
          );
          return {
            title: colName,
            id: colName,
            icon: GridColumnIcon.HeaderString,
            width: width,
          };
        })
      )
    );
  }, [cells]);

  const getContent = useCallback(
    ([col, row]: Item): GridCell => {
      let cell = data[row] && data[row][col];
      if (!cell) {
        return {
          kind: GridCellKind.Loading,
          allowOverlay: false,
        };
      }
      if (typeof cell !== "object") {
        cell = {
          data: `${cell ?? ""}`,
        };
      }
      return {
        kind: GridCellKind.Text,
        allowOverlay: true,
        readonly: true,
        displayData: cell.data,
        ...cell,
      };
    },
    [data]
  );

  return DataTableComponent(data, getContent, columns, setColumns, setData);
}

export function DataTable({ fileUrl }: { fileUrl: string }) {
  let [data, setData] = useState<Array<any>>([]);
  let [columns, setColumns] = useState<Array<any>>([]);

  useEffect(() => {
    (async () => {
      const response = await fetch(fileUrl);
      const data = await response.arrayBuffer();
      const workbook = XLSX.read(data, { codepage: 65001 });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      let range = sheet["!ref"]!;
      if (typeof sheet["A1"] === "undefined") {
        range = XLSX.utils.encode_range({
          s: { c: 1, r: 1 },
          e: XLSX.utils.decode_range(range).e,
        });
      }
      const rows: Array<any> = XLSX.utils.sheet_to_json(sheet, {
        range: range,
        raw: false,
      });
      if (!rows.length) return;
      setColumns(
        Array.from(
          Object.keys(rows[0]).map((colName) => {
            const width = Math.min(
              Math.max(
                ...rows.map((row) => `${row[colName] || ""}`.length * 8),
                colName.length * 20
              ),
              maxColWidth
            );
            return {
              title: colName,
              id: colName,
              icon: GridColumnIcon.HeaderString,
              width: width,
            };
          })
        )
      );
      setData(Array.from(rows));
    })();
  }, [fileUrl]);

  const getContent = useCallback(
    (cell: Item): GridCell => {
      const [col, row] = cell;
      const dataRow = data[row];
      if (!dataRow) {
        return {
          kind: GridCellKind.Loading,
          allowOverlay: false,
        };
      }
      const displayData = `${dataRow[columns[col].title] ?? ""}`;
      return {
        kind: GridCellKind.Text,
        allowOverlay: true,
        readonly: true,
        displayData: displayData,
        data: displayData,
      };
    },
    [columns, data]
  );

  return DataTableComponent(data, getContent, columns, setColumns, setData);
}

function DataTableComponent(
  data: Array<any>,
  getContent: (cell: Item) => GridCell,
  columns: Array<any>,
  setColumns: (
    value: ((prevState: Array<any>) => Array<any>) | Array<any>
  ) => void,
  setData: (value: ((prevState: Array<any>) => Array<any>) | Array<any>) => void
) {
  return data.length ? (
    <div style={{ border: "1px solid gray" }}>
      <DataEditor
        getCellContent={getContent}
        keybindings={{ search: true }}
        getCellsForSelection={true}
        width={"100%"}
        columns={columns}
        smoothScrollX={true}
        smoothScrollY={true}
        overscrollX={200}
        overscrollY={200}
        rowMarkers={"both"}
        verticalBorder={true}
        rows={data.length}
        height={"300px"}
        onColumnResize={(col: any, width) => {
          col.width = width;
          setColumns([...columns]);
        }}
        onCellEdited={(cell, newValue) => {
          const [col, row] = cell;
          const dataRow = data[row];
          dataRow[columns[col].title] = newValue.data;
          setData([...data]);
        }}
      />
    </div>
  ) : (
    <LoadingFallback />
  );
}
