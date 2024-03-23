import { RequestHandler } from "express";
import { IApiRouter } from "@interfaces/index";
import { OrderService } from "@serviceInternal/order.service";
import { OrderStatuses, OrderType } from "@enum/index";
import { Op } from "sequelize";
import dayjs from "dayjs";

const path = "/v1/reseller/statistic";
const method = "GET";
const auth = "reseller";

const main: RequestHandler = async (req, res) => {
    const session = req.reseller.data;

    const orderService = new OrderService();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Bulan ini
    const startOfCurrentMonth = dayjs().startOf("month");
    const endOfCurrentMonth = dayjs().endOf("month");

    // Bulan kemarin
    const startOfLastMonth = dayjs().add(-1, "month").startOf("month");
    const endOfLastMonth = dayjs().add(-1, "month").endOf("month");
    // const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    // const endOfLastMonth = new Date(currentYear, currentMonth, 0);

    const totalSalesThisMonth = await orderService.model.sum("totalAmt", {
        where: {
            customerId: session.id,
            [Op.or]: [{ type: null }, { type: OrderType.TOPUP }],
            status: [OrderStatuses.SUCCESS, OrderStatuses.PROCESSING, OrderStatuses.PENDING_ORDER],
            createdAt: {
                [Op.gte]: startOfCurrentMonth.toDate(),
                [Op.lte]: endOfCurrentMonth.toDate(),
            },
        },
    });

    const totalSalesLastMonth = await orderService.model.sum("totalAmt", {
        where: {
            customerId: session.id,
            [Op.or]: [{ type: null }, { type: OrderType.TOPUP }],
            status: [OrderStatuses.SUCCESS, OrderStatuses.PROCESSING, OrderStatuses.PENDING_ORDER],
            createdAt: {
                [Op.gte]: startOfLastMonth.toDate(),
                [Op.lte]: endOfLastMonth.toDate(),
            },
        },
    });

    // Hitung persentase perubahan
    const percentageChange = ((totalSalesThisMonth - totalSalesLastMonth) / totalSalesLastMonth) * 100;

    // Tentukan apakah naik atau turun
    let trend: string;
    if (percentageChange > 0) {
        trend = "naik";
    } else if (percentageChange < 0) {
        trend = "turun";
    } else {
        trend = "tetap";
    }

    const salesSuccess = await orderService.model.sum("totalAmt", {
        where: {
            customerId: session.id,
            [Op.or]: [{ type: null }, { type: OrderType.TOPUP }],
            status: OrderStatuses.SUCCESS,
            createdAt: {
                [Op.gte]: startOfCurrentMonth.toDate(),
                [Op.lte]: endOfCurrentMonth.toDate(),
            },
        },
    });

    const salesProcessing = await orderService.model.sum("totalAmt", {
        where: {
            customerId: session.id,
            [Op.or]: [{ type: null }, { type: OrderType.TOPUP }],
            status: [OrderStatuses.PROCESSING, OrderStatuses.PENDING_ORDER],
            createdAt: {
                [Op.gte]: startOfCurrentMonth.toDate(),
                [Op.lte]: endOfCurrentMonth.toDate(),
            },
        },
    });

    const salesFailed = await orderService.model.sum("totalAmt", {
        where: {
            customerId: session.id,
            [Op.or]: [{ type: null }, { type: OrderType.TOPUP }],
            status: [OrderStatuses.EXPIRED, OrderStatuses.FAILED],
            createdAt: {
                [Op.gte]: startOfCurrentMonth.toDate(),
                [Op.lte]: endOfCurrentMonth.toDate(),
            },
        },
    });
    return res.send({
        totalSalesThisMonth,
        totalSalesLastMonth,
        salesFailed,
        salesProcessing,
        salesSuccess,
        trend,
        percentageChange,
        startAt: startOfCurrentMonth.toISOString(),
        endAt: endOfCurrentMonth.toISOString(),
    });
};

export const getStatistic: IApiRouter = {
    path,
    method,
    main,
    auth,
};
