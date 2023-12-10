import React, { useCallback, useEffect, useState } from "react";
import XLSX from "xlsx";
import type { GridCell, Item } from "@glideapps/glide-data-grid";
import {
  DataEditor,
  GridCellKind,
  GridColumnIcon,
} from "@glideapps/glide-data-grid";
import { ClientOnly } from "remix-utils";
import type { LinksFunction } from "@remix-run/node";
import glideappsStyles from "@glideapps/glide-data-grid/dist/index.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: glideappsStyles }];
};

export function DataTable({ fileUrl, colorCodeMin, colorCodeMax, colorColumns }: { fileUrl: string, colorCodeMin: string, colorCodeMax: string, colorColumns: Array<string> }) {
  // let data, columns
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

  // get maximum and minimum value of each column
  const extremeValues = Object.fromEntries(columns.map((col) => {
    const values = data.map((row) => parseFloat(row[col.title]));
    const max = Math.max(...values);
    const min = Math.min(...values);
    return [col.title, [min, max]];
  }));

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
      const [min, max] = extremeValues[columns[col].title];
      const color = displayData == max ? colorCodeMax : displayData == min ? colorCodeMin : "white";
      return {
        kind: GridCellKind.Markdown,
        allowOverlay: true,
        readonly: true,
        data: displayData,
        themeOverride: { // highlight based on value
          bgCell: !colorColumns.includes(columns[col].title) || isNaN(displayData as unknown as number) || max == min ? "white" : color,
        },
      };
    },
    [columns, data],
  );

  return (
    <ClientOnly fallback={<p>Loading...</p>}>
      {() => {
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
          <p>Loading...</p>
        );
      }}
    </ClientOnly>
  );
}
