import { OrderEntity } from "@entity/order.entity";
import { ResponseCodeDigiflazzOrder } from "@enum/index";
import fetch from "node-fetch";
import { getSn, getStatus } from "./sellerDigiflazz";
import { OrderService } from "@serviceInternal/order.service";
import { ProductEntity } from "@entity/product.entity";
import { OrderDetailEntity } from "@entity/orderDetail.entity";
import { GameEntity } from "@entity/game.entity";

export const sendResponseOrderDigiflazz = async (
    invoiceId: string,
    rc: ResponseCodeDigiflazzOrder,
    errMessage?: string,
) => {
    const orderService = new OrderService();
    const order = await orderService.model.findOne({
        where: {
            invoiceId,
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
        ],
    });
    const webhookUrl = "https://api.digiflazz.com/v1/seller/callback";

    console.log("SEND WEBHOOK TO DIGIFLAZZ SELLER");
    console.log({
        data: {
            ref_id: order.extTrxId,
            status: getStatus(order),
            code: order.orderDetail.product.code,
            hp: order.orderDetail.userId + (order.orderDetail.serverId || "") || "",
            price: order.totalAmt,
            message: order.remark || errMessage || "",
            balance: "0",
            tr_id: order.id,
            rc,
            sn: getSn(order),
        },
    });
    const sendMessage = await fetch(webhookUrl, {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            data: {
                ref_id: order.extTrxId,
                status: getStatus(order),
                code: order.orderDetail.product.code,
                hp: order.orderDetail.userId + (order.orderDetail.serverId || "") || "",
                price: order.totalAmt.toString(),
                message: order.remark || errMessage || "",
                balance: "0",
                tr_id: order.id,
                rc,
                sn: getSn(order),
            },
        }),
    });

    console.log(sendMessage.text());
};
