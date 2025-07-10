import { useEffect, useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
} from "ag-grid-community";
import * as XLSX from "xlsx";
import * as cptable from "codepage";

const theme = themeQuartz.withParams({
  borderRadius: 6,
  browserColorScheme: "light",
  fontFamily: "inherit",
  headerFontSize: 14,
  spacing: 4,
  wrapperBorderRadius: 6,
  columnBorder: true,
  headerColumnBorder: true,
  headerFontWeight: 700,
  headerBackgroundColor: "#f7f7f7",
});

XLSX.set_cptable(cptable);

// Register all community modules for AG Grid v34+
ModuleRegistry.registerModules([AllCommunityModule]);

function decodeHTMLEntities(text: string) {
  if (typeof text !== "string") return text;
  const txt = document.createElement("textarea");
  txt.innerHTML = text;
  return txt.value;
}

export function DataTable({
  fileUrl,
  cells,
  headerSelect,
  onChange,
  state,
}: {
  fileUrl?: string;
  cells?: Array<any>;
  headerSelect?: Record<string, any>;
  onChange?: (value: any) => void;
  state?: Record<string, any>;
}) {
  const [rowData, setRowData] = useState<Array<any>>([]);
  const [colHeaders, setColHeaders] = useState<Array<string>>([]);
  const [loading, setLoading] = useState<boolean>(!!fileUrl);

  useEffect(() => {
    if (cells && cells.length > 1) {
      let rows = cells.map((row: any) =>
        row.map((cell: any) => {
          if (!cell) {
            cell = { value: "" };
          } else if (typeof cell !== "object") {
            cell = { value: cell };
          }
          cell.value = decodeHTMLEntities(cell.value);
          return cell;
        })
      );
      setColHeaders(rows[0].map((col: any) => col.value));
      setRowData(
        rows
          .slice(1)
          .map((row: any) =>
            Object.fromEntries(
              rows[0].map((col: any, idx: number) => [col.value, row[idx]])
            )
          )
      );
      setLoading(false);
    } else if (fileUrl) {
      (async () => {
        setLoading(true);
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
        const filteredColumns = Object.keys(rows[0]).filter(
          (colName) => !colName.startsWith("__EMPTY")
        );
        if (rows.length >= 1) {
          setColHeaders(filteredColumns.map(decodeHTMLEntities));
          setRowData(
            rows.map((row) => {
              const obj: Record<string, any> = {};
              filteredColumns.forEach((col) => {
                obj[decodeHTMLEntities(col)] = {
                  value: decodeHTMLEntities(row[col]),
                };
              });
              return obj;
            })
          );
        }
        setLoading(false);
      })();
    }
  }, [cells, fileUrl]);

  const columnDefs = useMemo(() => {
    let cols = [
      {
        headerName: "",
        field: "__rowNum__",
        valueGetter: (params: any) =>
          params.node ? params.node.rowIndex + 1 : "",
        pinned: "left" as const,
        width: 35,
        suppressMovable: true,
        suppressMenu: true,
        suppressColumnsToolPanel: true,
        suppressFiltersToolPanel: true,
        suppressAutoSize: true,
        sortable: false,
        filter: false,
        cellStyle: {
          backgroundColor: "#f7f7f7",
          color: "#989898",
        },
      },
      ...colHeaders.map((header) => ({
        field: header,
        headerName: header,
        editable: true,
        cellEditor: "agLargeTextCellEditor",
        cellEditorPopup: true,
        valueGetter: (params: any) => {
          // Always expect an object with a value property
          const cell = params.data?.[header];
          if (cell && typeof cell === "object" && "value" in cell) {
            return cell.value;
          }
          return "";
        },
        cellStyle: (params: any) => {
          const cell = params.data?.[header];
          if (cell && typeof cell === "object" && cell.style) {
            return cell.style;
          }
          return undefined;
        },
      })),
    ];
    return cols;
  }, [colHeaders]);

  if (loading) return <div>Loading...</div>;

  return (
    <div
      style={{ height: 300 }}
      // style={{ maxHeight: 300, overflow: "auto" }}
    >
      <AgGridReact
        theme={theme}
        rowData={rowData}
        // domLayout="autoHeight"
        autoSizeStrategy={{
          type: "fitCellContents",
          defaultMaxWidth: 300,
        }}
        readOnlyEdit={true}
        columnDefs={columnDefs}
        defaultColDef={
          headerSelect
            ? {
                headerComponent: HeaderWithSelect,
                headerComponentParams: { headerSelect, onChange, state },
              }
            : {}
        }
      />
    </div>
  );
}

function HeaderWithSelect({
  displayName,
  headerSelect,
  onChange,
  state,
  className = "d-flex align-items-center justify-content-center gap-2 w-100",
}: {
  displayName: string;
  headerSelect: Record<string, any>;
  onChange: (value: any) => void;
  state: Record<string, any>;
  className?: string;
}) {
  if (!displayName) return null;
  let { name, options, ...args } = headerSelect;
  name = name?.replace("{col}", displayName);

  let labelWidget = <span>{displayName}</span>;
  if (!options || options.length === 0) {
    return labelWidget;
  }

  let optionWidgets = [];
  for (let option of options) {
    if (option.value === displayName) {
      return (
        <div className={className}>
          <input type="hidden" name={name} value={displayName} />
          {labelWidget}
        </div>
      );
    }
    optionWidgets.push(
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    );
  }

  return (
    <div className={className}>
      {labelWidget}
      <select
        name={name}
        onChange={onChange}
        style={{ maxWidth: "150px" }}
        defaultValue={state[name]}
        {...args}
      >
        {optionWidgets}
      </select>
    </div>
  );
}
