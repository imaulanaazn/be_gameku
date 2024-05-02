import dayjs from "dayjs";
import ExcelJS, { Column } from "exceljs";
import fetch from "node-fetch";

export interface ColumnConfig {
    header: string;
    key: string;
    width?: number;
    numFmt?: string;
    centered?: boolean;
    startRowIndex?: number;
}

interface CreateExcel {
    data: DataItem[];
    columnsConfig: ColumnConfig[];
    sheetName: string;
    fileName: string;
    startRowIndex: number;
    createdAt: Date;
    startAt: Date;
    endAt: Date;
}

interface DataItem {
    [key: string]: any;
}

export default class ExcelService<T> {
    async createExcel({
        data,
        columnsConfig,
        sheetName,
        fileName,
        startRowIndex = 1,
        createdAt,
        startAt,
        endAt,
    }: CreateExcel): Promise<ExcelJS.Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName, {
            views: [
                {
                    showGridLines: false,
                },
            ],
        });

        // @ts-ignore
        const columns: Partial<Column>[] = columnsConfig.map((config) => ({
            header: config.header,
            key: config.key as keyof DataItem,
            width: config.width || 15,
            ...(config.centered ? { alignment: { horizontal: "center", vertikal: "center" } } : {}),
        }));
        worksheet.columns = columns as Column[];

        columnsConfig.forEach((columnConfig) => {
            const column = worksheet.getColumn(columnConfig.key);
            if (columnConfig.numFmt) {
                column.numFmt = columnConfig.numFmt; // Set format rupiah tanpa desimal
            }
        });

        worksheet.duplicateRow(1, startRowIndex, true);
        worksheet.getRow(1).values = [];
        worksheet.getRow(startRowIndex).values = [];

        const headerRow = worksheet.getRow(startRowIndex + 1);
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFD9EAD3" }, // Background color
            };

            cell.alignment = { horizontal: "center", vertical: "middle" };
        });
        headerRow.height = 30;

        for (let i = 1; i < startRowIndex; i++) {
            const row = worksheet.getRow(i);
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.value = undefined;
                cell.style = {};
            });
            row.height = undefined;
        }

        data.forEach((item) => {
            worksheet.addRow(item);
        });

        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: "dotted" },
                    left: { style: "dotted" },
                    bottom: { style: "dotted" },
                    right: { style: "dotted" },
                };
            });
        });

        const response = await fetch(
            "https://firebasestorage.googleapis.com/v0/b/gasskeun-topup.appspot.com/o/assets%2Fconfig%2Fba2c0309-5452-4e18-9e4b-dfe95d96c712.png?alt=media&token=1ff6550c-f0df-4672-99b3-0af079507de5",
        );
        const buffer = await response.buffer();
        const imageId = workbook.addImage({
            buffer: buffer,
            extension: "png",
        });
        worksheet.addImage(imageId, {
            tl: { col: 1, row: 1 }, // Top left corner of image
            ext: { width: 150, height: 100 }, // Image dimensions
        });

        const metadata = [
            { label: "Nama File", value: fileName },
            { label: "Tanggal Generate", value: dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss") },
            {
                label: "Periode",
                value: `${dayjs(startAt).format("YYYY-MM-DD HH:mm:ss")} - ${dayjs(endAt).format(
                    "YYYY-MM-DD HH:mm:ss",
                )}`,
            },
        ];

        metadata.forEach((item, index) => {
            worksheet.getCell(`C${index + 2}`).value = item.label;
            worksheet.getCell(`D${index + 2}`).value = `: ${item.value}`;
        });

        return await workbook.xlsx.writeBuffer();
    }
}
