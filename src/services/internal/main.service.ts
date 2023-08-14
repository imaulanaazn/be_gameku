import { IPagination } from "@helper/validator";
import { Op } from "sequelize";
import { Model, ModelCtor } from "sequelize-typescript";
import { CreationAttributes, DestroyOptions, UpdateOptions, WhereOptions } from "sequelize/types/model";

type ColumnKeys<T> = keyof T;
type OperatorString = "like" | "and" | "or" | "in";
type OperatorNumber = "lt" | "lte" | "gt" | "gte" | "in";
type ConditionOperator<T> = T extends string ? OperatorString : T extends number ? OperatorNumber : never;
interface FindDto<K, T, Dto> {
    column: K;
    value: T | Array<T>;
    operator?: ConditionOperator<T>;
    only?: Array<ColumnKeys<Dto>>;
}
interface UpdateDto<K, V, Dto> {
    by: K;
    value: V;
    data: Partial<Dto>;
}
interface DeleteDto<K, V, Dto> {
    by: K;
    value: V;
}
const operators = {
    eq: Op.eq,
    ne: Op.ne,
    lt: Op.lt,
    lte: Op.lte,
    gt: Op.gt,
    gte: Op.gte,
    like: Op.like,
    or: Op.or,
    and: Op.and,
    in: Op.in,
};

export interface IBaseService<T extends Model, Dto> {
    create(data: Partial<Dto>): Promise<T>;
    findOneBy<K extends ColumnKeys<Dto>>(filterCriteria: FindDto<K, Dto[K], Dto>): Promise<T | null>;
    findManyBy<K extends ColumnKeys<Dto>>(filterCriteria: FindDto<K, Dto[K], Dto>): Promise<T[]>;
    findManyByPagination<K extends ColumnKeys<Dto>>(
        filterCriteria: FindDto<K, Dto[K], Dto>,
        pagination: IPagination,
    ): Promise<T[]>;
    findAll(): Promise<T[]>;
    findAllPagination(pagination: IPagination): Promise<{ total: number; data: T[] }>;
    updateBy<K extends ColumnKeys<Dto>>(updateData: UpdateDto<K, Dto[K], Dto>): Promise<[number]>;
    deleteBy<K extends ColumnKeys<Dto>>(id: Dto[K]): Promise<number>;
}

export class MainService<T extends Model, Dto extends CreationAttributes<T>> implements IBaseService<T, Dto> {
    protected model: ModelCtor<T>;

    constructor(model: ModelCtor<T>) {
        this.model = model;
    }

    public async create(data: Partial<Dto>): Promise<T> {
        return await this.model.create(data as Dto);
    }

    public async findOneBy<K extends ColumnKeys<Dto>>(filterCriteria: FindDto<K, Dto[K], Dto>): Promise<T | null> {
        let whereOptions: WhereOptions;
        if (Array.isArray(filterCriteria.value)) {
            let arrVal = [];
            for (const filterValue of filterCriteria.value) {
                arrVal.push({ [filterCriteria.column]: filterValue });
            }

            whereOptions = {
                [operators[filterCriteria.operator || "eq"]]: arrVal,
            };
        } else {
            whereOptions = {
                [filterCriteria.column]: {
                    [operators[filterCriteria.operator || "eq"]]: filterCriteria.value,
                },
            };
        }

        if (filterCriteria.only && filterCriteria.only.length) {
            return await this.model.findOne({ where: whereOptions, attributes: filterCriteria.only as any });
        } else {
            return await this.model.findOne({ where: whereOptions });
        }
    }

    public async findManyBy<K extends ColumnKeys<Dto>>(filterCriteria: FindDto<K, Dto[K], Dto>): Promise<T[]> {
        let whereOptions: WhereOptions;
        if (Array.isArray(filterCriteria.value)) {
            let arrVal = [];
            for (const filterValue of filterCriteria.value) {
                arrVal.push({ [filterCriteria.column]: filterValue });
            }

            whereOptions = {
                [operators[filterCriteria.operator || "eq"]]: arrVal,
            };
        } else {
            whereOptions = {
                [filterCriteria.column]: {
                    [operators[filterCriteria.operator || "eq"]]: filterCriteria.value,
                },
            };
        }
        if (filterCriteria.only && filterCriteria.only.length) {
            return await this.model.findAll({ where: whereOptions, attributes: filterCriteria.only as any });
        } else {
            return await this.model.findAll({ where: whereOptions });
        }
    }

    public async findManyByPagination<K extends ColumnKeys<Dto>>(
        filterCriteria: FindDto<K, Dto[K], Dto>,
        pagination: IPagination,
    ): Promise<T[]> {
        let whereOptions: WhereOptions;
        if (Array.isArray(filterCriteria.value)) {
            let arrVal = [];
            for (const filterValue of filterCriteria.value) {
                arrVal.push({ [filterCriteria.column]: filterValue });
            }

            whereOptions = {
                [operators[filterCriteria.operator || "eq"]]: arrVal,
            };
        } else {
            whereOptions = {
                [filterCriteria.column]: {
                    [operators[filterCriteria.operator || "eq"]]: filterCriteria.value,
                },
            };
        }
        if (filterCriteria.only && filterCriteria.only.length) {
            return await this.model.findAll({
                where: whereOptions,
                offset: (pagination.page - 1) * pagination.limit,
                limit: pagination.limit,
                order: [[pagination.sort, pagination.order]],
                attributes: filterCriteria.only as any,
            });
        } else {
            return await this.model.findAll({
                where: whereOptions,
                offset: (pagination.page - 1) * pagination.limit,
                limit: pagination.limit,
                order: [[pagination.sort, pagination.order]],
            });
        }
    }

    public async findAll(): Promise<T[]> {
        return this.model.findAll({
            order: [["createdAt", "DESC"]],
        });
    }

    public async findAllPagination(pagination: IPagination): Promise<{ total: number; data: T[] }> {
        const data = await this.model.findAndCountAll({
            offset: (pagination.page - 1) * pagination.limit,
            limit: pagination.limit,
            order: [[pagination.sort, pagination.order]],
        });

        return {
            total: data.count,
            data: data.rows,
        };
    }

    public async updateBy<K extends ColumnKeys<Dto>>(updateData: UpdateDto<K, Dto[K], Dto>): Promise<[number]> {
        const whereOptions: WhereOptions = {
            [updateData.by]: updateData.value,
        };

        return await this.model.update(updateData.data, {
            where: whereOptions,
        });
    }

    public async deleteBy<K extends ColumnKeys<Dto>>(deleteData: DeleteDto<K, Dto[K], Dto>): Promise<number> {
        const whereOptions: WhereOptions = {
            [deleteData.by]: deleteData.value,
        };
        return await this.model.destroy({
            where: whereOptions,
        });
    }
}
