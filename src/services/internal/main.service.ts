import { IPagination } from "@helper/validator";
import dayjs from "dayjs";
import { Op } from "sequelize";
import { Model, ModelCtor } from "sequelize-typescript";
import { CreationAttributes, DestroyOptions, FindOptions, UpdateOptions, WhereOptions } from "sequelize/types/model";

type ColumnKeys<T> = keyof T;
type OperatorString = "like" | "and" | "or" | "in";
type OperatorNumber = "lt" | "lte" | "gt" | "gte" | "in";
type ConditionOperator<T> = T extends string ? OperatorString : T extends number ? OperatorNumber : never;
export interface FindDto<K, T, Dto> {
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
    find(options: FindOptions<T>): Promise<T[]>;
    findOneBy<K extends ColumnKeys<Dto>>(filterCriteria: FindDto<K, Dto[K], Dto>): Promise<T | null>;
    findManyBy<K extends ColumnKeys<Dto>>(filterCriteria: FindDto<K, Dto[K], Dto>): Promise<T[]>;
    findManyByPagination<K extends ColumnKeys<Dto>>(
        filterCriteria: FindDto<K, Dto[K], Dto>,
        pagination: IPagination,
        additional?: { column: K; value: Dto[K] },
    ): Promise<{ rows: T[]; count: number }>;
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

    public async create(data: Dto): Promise<T> {
        return await this.model.create({ ...data, createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss") });
    }

    public async find(options: FindOptions<T>): Promise<T[]> {
        return await this.model.findAll(options);
    }

    public async findOneBy<K extends ColumnKeys<Dto>>(filterCriteria: FindDto<K, Dto[K], Dto>): Promise<T | null> {
        let whereOptions: WhereOptions;
        if (Array.isArray(filterCriteria.value) && filterCriteria.operator !== "in") {
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

        try {
            if (filterCriteria.only && filterCriteria.only.length) {
                return await this.model.findOne({ where: whereOptions, attributes: filterCriteria.only as any });
            } else {
                return await this.model.findOne({ where: whereOptions });
            }
        } catch (error) {
            throw error;
        }
    }

    public async findManyBy<K extends ColumnKeys<Dto>>(filterCriteria: FindDto<K, Dto[K], Dto>): Promise<T[]> {
        let whereOptions: WhereOptions;
        if (Array.isArray(filterCriteria.value) && filterCriteria.operator !== "in") {
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
        try {
            if (filterCriteria.only && filterCriteria.only.length) {
                return await this.model.findAll({ where: whereOptions, attributes: filterCriteria.only as any });
            } else {
                return await this.model.findAll({ where: whereOptions });
            }
        } catch (error) {
            throw error;
        }
    }

    public async findManyByPagination<K extends ColumnKeys<Dto>, M extends ColumnKeys<Dto>>(
        filterCriteria: FindDto<K, Dto[K], Dto>,
        pagination: IPagination,
        additional?: { column: M; value: Dto[M] },
    ): Promise<{ rows: T[]; count: number }> {
        let whereOptions: WhereOptions;
        if (Array.isArray(filterCriteria.value) && filterCriteria.operator !== "in") {
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

        if (additional) {
            whereOptions = { ...whereOptions, [additional.column]: additional.value };
        }

        try {
            if (filterCriteria.only && filterCriteria.only.length) {
                return await this.model.findAndCountAll({
                    where: whereOptions,
                    offset: (pagination.page - 1) * pagination.limit,
                    limit: pagination.limit,
                    order: [[pagination.sort, pagination.order]],
                    attributes: filterCriteria.only as any,
                });
            } else {
                return await this.model.findAndCountAll({
                    where: whereOptions,
                    offset: (pagination.page - 1) * pagination.limit,
                    limit: pagination.limit,
                    order: [[pagination.sort, pagination.order]],
                });
            }
        } catch (error) {
            throw error;
        }
    }

    public async findAll(): Promise<T[]> {
        try {
            return this.model.findAll({
                order: [["createdAt", "DESC"]],
            });
        } catch (error) {
            throw error;
        }
    }

    public async findAllPagination<K extends ColumnKeys<Dto>>(
        pagination: IPagination,
        additional?: { column: K; value: Dto[K] },
    ): Promise<{ total: number; data: T[] }> {
        try {
            let where;
            if (additional) {
                where = {
                    [additional.column]: additional.value,
                };
            }
            const data = await this.model.findAndCountAll({
                where: where && where,
                offset: (pagination.page - 1) * pagination.limit,
                limit: pagination.limit,
                order: [[pagination.sort, pagination.order]],
            });

            return {
                total: data.count,
                data: data.rows,
            };
        } catch (error) {
            throw error;
        }
    }

    public async updateBy<K extends ColumnKeys<Dto>>(updateData: UpdateDto<K, Dto[K], Dto>): Promise<[number]> {
        const whereOptions: WhereOptions = {
            [updateData.by]: updateData.value,
        };

        try {
            return await this.model.update(
                { ...updateData.data, updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss") },
                {
                    where: whereOptions,
                },
            );
        } catch (error) {
            throw error;
        }
    }

    public async deleteBy<K extends ColumnKeys<Dto>>(deleteData: DeleteDto<K, Dto[K], Dto>): Promise<number> {
        const whereOptions: WhereOptions = {
            [deleteData.by]: deleteData.value,
        };
        try {
            return await this.model.destroy({
                where: whereOptions,
            });
        } catch (error) {
            throw error;
        }
    }
}
