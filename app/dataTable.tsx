import React, { useCallback, useEffect, useState } from "react";
import XLSX from "xlsx";
import {
  DataEditor,
  GridCell,
  GridCellKind,
  GridColumnIcon,
  Item,
} from "@glideapps/glide-data-grid";
import { ClientOnly } from "remix-utils";
import { LinksFunction } from "@remix-run/node";
import glideappsStyles from "@glideapps/glide-data-grid/dist/index.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: glideappsStyles }];
};

export function DataTable({ fileUrl }: { fileUrl: string }) {
  // let data, columns
  let [data, setData] = useState<Array<any>>([]);
  let [columns, setColumns] = useState<Array<any>>([]);

  useEffect(() => {
    (async () => {
      const response = await fetch(fileUrl);
      const file = await response.arrayBuffer();
      const workbook = XLSX.read(file);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Array<any> = XLSX.utils.sheet_to_json(sheet);
      if (!rows.length) return;
      setColumns(
        Array.from(
          Object.keys(rows[0]).map((key) => {
            const width = Math.min(
              Math.max(
                ...rows.map((row) => `${row[key] || ""}`.length * 8),
                key.length * 12,
              ),
              400,
            );
            return {
              title: key,
              id: key,
              icon: GridColumnIcon.HeaderString,
              width: width,
            };
          }),
        ),
      );
      setData(Array.from(rows));
    })();
  }, [fileUrl]);

  const getContent = useCallback(
    (cell: Item) => {
      const [col, row] = cell;
      const dataRow = data[row];
      if (dataRow === undefined) return;
      let displayData = `${dataRow[columns[col].title] ?? ""}`;
      return {
        kind: GridCellKind.Text,
        allowOverlay: true,
        readonly: true,
        displayData: displayData,
        data: displayData,
      };
    },
    [columns, data],
  );

  return (
    <ClientOnly fallback={<p>Loading...</p>}>
      {() => {
        return (
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
        );
      }}
    </ClientOnly>
  );
}
