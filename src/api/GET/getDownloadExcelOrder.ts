import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { ErrorStatusCode, OrderStatuses, OrderType, ValidatorType } from "@enum/index";
import { Config } from "@config/index";
import { Validator } from "@helper/validator";
import { SysConfigEntity } from "@entity/sysConfig.entity";
import { SysConfigService } from "@serviceInternal/sysConfig.service";
import { BusinessError } from "@helper/handleError";
import { OrderService } from "@serviceInternal/order.service";
import ExcelService, { ColumnConfig } from "@serviceExternal/excel.service";
import dayjs from "dayjs";
import { Op } from "sequelize";
import { CustomerService } from "@serviceInternal/customer.service";
import { CustomerEntity } from "@entity/customer.entity";
import { OrderDto } from "@dto/order.dto";
import { OrderEntity } from "@entity/order.entity";

const path = "/v1/download-report-order";
const method = "GET";
const auth = "guess";

const schemaValidation: Validation[] = [
    {
        name: "startAt",
        required: false,
        type: "string",
    },
    {
        name: "endAt",
        required: false,
        type: "string",
    },
];

const getStatuses = (status: OrderStatuses) => {
    let newStatus = "Transaksi Gagal";
    switch (status) {
        case OrderStatuses.EXPIRED:
            newStatus = "Pembayaran Kadaluarsa";
            break;
        case OrderStatuses.PENDING_ORDER:
            newStatus = "Transaksi Belum Diproses";
            break;
        case OrderStatuses.PENDING_PAYMENT:
            newStatus = "Menunggu Pembayaran";
            break;
        case OrderStatuses.PROCESSING:
            newStatus = "Transaksi Sedang Diproses";
            break;
        case OrderStatuses.SUCCESS:
            newStatus = "Transaksi Berhasil";
            break;
        default:
            newStatus = "Transaksi Gagal";
            break;
    }

    return newStatus;
};

const getUserType = (roleId: string, config: Config) => {
    let userType = "Guess";
    switch (roleId) {
        case config.roleReseller:
            userType = "Reseller";
            break;
        case config.roleUser:
            userType = "User";
            break;
        default:
            userType = "Guess";
            break;
    }

    return userType;
};

export const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        startAt: string;
        endAt: string;
    }>(schemaValidation, ValidatorType.QUERY);

    const orderService = new OrderService();
    const excelService = new ExcelService();
    const config = new Config();

    const batchSize = 100;
    let offset = 0;
    let allOrders: OrderEntity[] = [];

    try {
        while (true) {
            const ordersBatch = await orderService.model.findAll({
                where: {
                    createdAt: {
                        [Op.and]: [
                            { [Op.gte]: dayjs(query.startAt).toDate() },
                            { [Op.lte]: dayjs(query.endAt).toDate() },
                        ],
                    },
                    type: {
                        [Op.in]: [OrderType.TOPUP, null],
                    },
                },
                include: [
                    {
                        model: CustomerEntity,
                        required: true,
                        attributes: ["id", "name", "roleId", "mobileNumber"],
                    },
                ],
                limit: batchSize,
                offset,
            });

            if (ordersBatch.length === 0) {
                break;
            }

            allOrders = [...allOrders, ...ordersBatch];
            offset += batchSize;
        }

        const columnsConfig: ColumnConfig[] = [
            { header: "No", key: "no", width: 5 },
            { header: "Nama Game", key: "gameName", width: 25 },
            { header: "Nama Denom", key: "productName", width: 40 },
            { header: "Total Rupiah", key: "totalAmount", width: 15, numFmt: "Rp #,##0", centered: true },
            { header: "Status", key: "status", width: 25 },
            { header: "Nama Pembeli", key: "account", width: 30 },
            { header: "Tipe Pembeli", key: "accountType", width: 20 },
            { header: "NO Whatsapp", key: "mobileNumber", width: 15 },
            { header: "Tanggal Pembelian", key: "dateTime", width: 25 },
        ];

        const newData = allOrders.map((order, index) => {
            return {
                no: index + 1,
                gameName: order.game,
                productName: order.productName,
                totalAmount: order.totalAmt,
                status: getStatuses(order.status),
                account: order.customer.name || "Transaksi Tanpa Login",
                accountType: getUserType(order.customer.roleId, config),
                mobileNumber: order.customer.mobileNumber,
                dateTime: dayjs(order.createdAt).format("YYYY-MM-DD HH:mm:ss"),
            };
        });

        const dateNow = dayjs();
        const sheetName = "Orders";
        const filename = `Laporan Transaksi ${dateNow.format("YYYY-MM-DD HH_mm_ss")}.xlsx`;

        const buffer = await excelService.createExcel({
            data: newData,
            columnsConfig,
            sheetName,
            fileName: filename,
            startRowIndex: 7,
            createdAt: dateNow.toDate(),
            startAt: dayjs(query.startAt).toDate(),
            endAt: dayjs(query.endAt).toDate(),
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

export const getDownloadExcelOrder: IApiRouter = {
    path,
    method,
    main,
    auth,
};
