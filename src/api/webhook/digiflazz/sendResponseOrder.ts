import { OrderEntity } from "@entity/order.entity";
import { ResponseCodeDigiflazzOrder } from "@enum/index";
import fetch from "node-fetch";
import { getSn, getStatus } from "./sellerDigiflazz";
import { OrderService } from "@serviceInternal/order.service";

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
    });
    const webhookUrl = "https://api.digiflazz.com/v1/seller/callback";
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
                price: order.totalAmt,
                message: order.remark || errMessage || "",
                balance: "0",
                tr_id: order.id,
                rc,
                sn: getSn(order),
            },
        }),
    });
    console.log(sendMessage?.json());
};
