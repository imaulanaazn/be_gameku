import { PromotionDto } from "@dto/promotion.dto";
import { PromotionEntity } from "@entity/index";
import { OrderEntity } from "@entity/order.entity";
import { OrderStatuses, ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { GameService } from "@serviceInternal/game.service";
import { OrderService } from "@serviceInternal/order.service";
import { ProductService } from "@serviceInternal/product.service";
import { PromotionService } from "@serviceInternal/promotion.service";
import dayjs from "dayjs";
import { RequestHandler } from "express";
import { fn, col, where, Op, literal, Order, OrderItem } from "sequelize";
import sequelize from "../../../database/index";

const path = "/v1/promo-code";
const method = "GET";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
        required: false,
    },
    {
        name: "code",
        type: "string",
        required: false,
    },
    {
        name: "status",
        type: "string",
        required: false,
        enum: ["active", "expired"],
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        name?: string;
        status?: string;
        code?: "active" | "expired";
    }>(schemaValidation, ValidatorType.QUERY, true);
    const clearQuery = JSON.parse(JSON.stringify(query));
    delete clearQuery.status;
    delete clearQuery.page;
    delete clearQuery.sort;
    delete clearQuery.order;
    delete clearQuery.limit;

    const promotionService = new PromotionService();
    const orderService = new OrderService();
    const column = Object.keys(query);

    if (query.sort === "usedStock") {
        let where = [];
        if (query.status) {
            where.push(
                `end_at ${query.status === "active" ? ">" : "<="} '${dayjs().utc().format("YYYY-MM-DD HH:mm:ss")}'`,
            );
        }

        for (const key of Object.keys(clearQuery)) {
            where.push(`${key} LIKE '%${query[key]}%'`);
        }

        const data = (await sequelize.query(
            `
    SELECT COUNT(orders.promo_id) as used, promotions.*
    from promotions
    left join orders on orders.promo_id = promotions.id
    where deleted = false ${where.length > 0 ? "AND" : ""} ${where.join(" AND ")}
    group by promotions.id
    order by used ${query.order}
    limit ${(query.page - 1) * query.limit}, ${query.limit}
    `,
            { model: PromotionEntity, mapToModel: true },
        )) as any;

        const count = (await sequelize.query(`
        SELECT COUNT(id) as totalData
        FROM promotions
        where deleted = false ${where.length > 0 ? "AND" : ""} ${where.join(" AND ")}`)) as any;

        return res.send({
            data,
            page: query.page,
            total: count[0][0].totalData,
            totalPage: Math.ceil(count[0][0].totalData / query.limit),
            order: query.order,
            sort: query.sort,
            limit: query.limit,
        });
    }

    let where: any = {};

    if (column.length > 4) {
        if (query.status) {
            where.endAt = {
                [query.status === "active" ? Op.gt : Op.lt]: dayjs().toDate(),
            };
        }

        for (const key of Object.keys(clearQuery)) {
            where[key] = { [Op.like]: `%${clearQuery[key]}%` };
        }
    }

    const data = await promotionService.model.findAndCountAll({
        where: {
            ...where,
            deleted: false,
        },
        order: [[query.sort, query.order]],
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
    });

    // @ts-ignore

    const countVoucher: { dataValues: { promoId: string; used: number } }[] = await orderService.model.findAll({
        attributes: ["promoId", [fn("COUNT", "promoId"), "used"]],
        where: {
            promoId: {
                [Op.in]: data.rows.map((item) => item.id),
            },
            status: {
                [Op.in]: [OrderStatuses.PENDING_ORDER, OrderStatuses.SUCCESS],
            },
        },
        group: ["promoId"],
    });

    const dataWithCount = data.rows.map((item) => {
        const count = countVoucher.find((count) => count.dataValues.promoId === item.id);
        return {
            ...item.toJSON(),
            used: count ? count.dataValues.used : 0,
            remain: count ? item.stock - count.dataValues.used : 0,
        };
    });

    return res.send({
        data: dataWithCount,
        page: query.page,
        total: data.count,
        totalPage: Math.ceil(data.count / query.limit),
        order: query.order,
        sort: query.sort,
        limit: query.limit,
    });
};

export const getAllPromoCodePagination: IApiRouter = {
    main,
    path,
    method,
    auth,
};
