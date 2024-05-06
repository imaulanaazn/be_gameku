import { Config } from "@config/index";
import { CustomerEntity } from "@entity/customer.entity";
import { GameEntity } from "@entity/game.entity";
import { InvoiceEntity } from "@entity/invoice.entity";
import { OrderEntity } from "@entity/order.entity";
import { OrderDetailEntity } from "@entity/orderDetail.entity";
import { ProductEntity } from "@entity/product.entity";
import { OrderStatuses, OrderType, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { OrderService } from "@serviceInternal/order.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import { Op } from "sequelize";

const path = "/v1/latest-order";
const method = "GET";
const auth = "admin";

const schemaValidation: Validation[] = [];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{}>(schemaValidation, ValidatorType.QUERY, true);
    const orderService = new OrderService();
    const config = new Config();
    const orders = await orderService.find<OrderEntity[]>({
        order: [[query.sort, query.order]],
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        where: {
            type: { [Op.in]: [OrderType.TOPUP, null] },
        },
        include: [
            {
                model: OrderDetailEntity,
                required: true,
                include: [
                    {
                        model: ProductEntity,
                        required: true,
                        include: [
                            {
                                model: GameEntity,
                                required: true,
                            },
                        ],
                    },
                ],
            },
            {
                model: CustomerEntity,
                required: true,
            },
            {
                model: InvoiceEntity,
                required: true,
            },
        ],
    });

    const newData = orders.map((order) => {
        let status = order.status;

        if (status === OrderStatuses.PENDING_PAYMENT && dayjs().isAfter(dayjs(order.invoice.expiredAt))) {
            status = OrderStatuses.EXPIRED;
        }

        return {
            id: order.id,
            invoiceId: order.invoiceId,
            status,
            gameName: order.game,
            productName: order.productName,
            paymentMethod: order.paymentMethod,
            totalAmt: order.totalAmt,
            fee: order.feeAmt || 0,
            discount: order.discAmt || 0,
            amount: order.orderDetail.amount,
            quantity: order.orderDetail.quantity,
            promoCd: order.promoCd,
            ipAddress: order.ipAddress,
            gameLogo: order.orderDetail.product.game.logoUrl,
            userType:
                order.customer.roleId === config.roleReseller
                    ? "Reseller"
                    : order.customer.roleId === config.roleUser
                    ? "User"
                    : "Guest",
            mobileNumber: order.customer.mobileNumber,
            createdAt: order.createdAt,
        };
    });

    res.send(newData);
};

export const getLatestOrder: IApiRouter = {
    main,
    path,
    method,
    auth,
};
