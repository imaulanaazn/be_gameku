import { RequestHandler } from "express";
import { IApiRouter, Validation } from "@interfaces/index";
import { Validator } from "@helper/validator";
import { OrderStatuses, ValidatorType } from "@enum/index";
import { OrderService } from "@serviceInternal/order.service";
import { InvoiceService } from "@serviceInternal/invoice.service";
import dayjs from "dayjs";
import { Op } from "sequelize";
import { createLogCronjobInternal } from "@helper/logger";
import { APIAuth, APIMethod } from "@enum/index";

const path = "/v1/set-expired-payment";
const method = APIMethod.GET;
const auth = APIAuth.GUEST;

const schemaValidation: Validation[] = [];

const main: RequestHandler = async (req, res) => {
    const logging = createLogCronjobInternal();
    logging.log("@@ RUNNING START CRONJOB SET EXPIRED");
    const query = new Validator(req, res).process(schemaValidation, ValidatorType.QUERY, true);
    const orderService = new OrderService();
    const orders = await orderService.findManyBy({
        column: "status",
        value: OrderStatuses.PENDING_PAYMENT,
    });

    const invoiceService = new InvoiceService();
    const invoices = await invoiceService.findManyBy({
        column: "id",
        value: orders.map((item) => item.invoiceId),
        operator: "in",
    });

    const invoiceId = [];
    for (const invoice of invoices) {
        if (dayjs(invoice.expiredAt).isBefore(dayjs())) {
            invoiceId.push(invoice.id);
        }
    }

    if (invoiceId.length > 0) {
        const updated = await orderService.model.update(
            { status: OrderStatuses.EXPIRED },
            {
                where: {
                    invoiceId: {
                        [Op.in]: invoiceId,
                    },
                },
            },
        );

        logging.log(updated);
    }

    logging.log(`AFFECTED ${invoiceId.length} ${invoiceId.length > 0 && "WITH DATA = " + JSON.stringify(invoiceId)}`);
    logging.log("@@ RUNNING END CRONJOB SET EXPIRED");
    return res.sendStatus(200);
};

export const cronjobSetExpiredPayment: IApiRouter = {
    path,
    method,
    main,
    auth,
};
