import { ListServerDto } from "@dto/listServer.dto";
import { APIAuth, APIMethod, ErrorType, ServerIdType, ValidatorType, VoucherType } from "@enum/index";
import { BusinessError } from "@helper/handleError";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { FirebaseService } from "@serviceExternal/firebase.service";
import { GameService } from "@serviceInternal/game.service";
import { GameCategoryService } from "@serviceInternal/gameCategory.service";
import { ListServerService } from "@serviceInternal/listServer.service";
import { MetaService } from "@serviceInternal/meta.service";
import { RequestHandler } from "express";
import { v4 as uuid } from "uuid";

const path = "/v1/game";
const method = APIMethod.POST;
const auth = APIAuth.ADMIN;

const schemaValidation: Validation[] = [
    {
        name: "name",
        type: "string",
        required: true,
    },
    {
        name: "type",
        type: "string",
        required: true,
    },
    {
        name: "slug",
        type: "string",
        required: true,
    },
    {
        name: "voucherType",
        type: "string",
        required: false,
    },
    {
        name: "needServerId",
        type: "string",
        required: false,
        enum: ["true", "false"],
    },
    {
        name: "typeServerId",
        type: "string",
        required: false,
    },
    {
        name: "categoryId",
        type: "string",
        required: true,
    },
    {
        name: "desc",
        type: "string",
        required: true,
    },
    {
        name: "keywords",
        type: "string",
        required: true,
    },
    {
        name: "listServerId",
        type: "string",
        required: false,
    },
];

const main: RequestHandler = async (req, res) => {
    const body = new Validator(req, res).process<{
        name: string;
        type: string;
        slug: string;
        voucherType?: VoucherType;
        needServerId?: "true" | "false";
        typeServerId?: string;
        categoryId: string;
        desc: string;
        keywords: string;
        listServerId: string;
    }>(schemaValidation, ValidatorType.BODY);
    const file = req.files;
    console.log(body);
    console.log(file);
    if (!file || !file["logoUrl"] || file["logoUrl"].length === 0) {
        throw new BusinessError("File gambar tidak valid", ErrorType.BadRequest);
    }

    const gameCategoryService = new GameCategoryService();
    const gameCategory = await gameCategoryService.findOneBy({
        column: "id",
        value: body.categoryId,
    });

    if (!gameCategory) {
        throw new BusinessError("Kategori Game tidak valid", ErrorType.BadRequest);
    }

    const firebaseService = new FirebaseService();
    const uploadLogoUrl = await firebaseService.uploadImg(
        file["logoUrl"][0].path,
        "game/" + file["logoUrl"][0].filename,
    );
    if (!uploadLogoUrl) {
        throw new BusinessError("Coba lagi beberapa saat lagi", ErrorType.Internal);
    }

    let uploadLogoDenom = null;
    if (file["logoDenom"] && file["logoDenom"].length !== 0) {
        uploadLogoDenom = await firebaseService.uploadImg(
            file["logoDenom"][0].path,
            "denom/" + file["logoDenom"][0].filename,
        );
        if (!uploadLogoDenom) {
            throw new BusinessError("Coba lagi beberapa saat lagi", ErrorType.Internal);
        }
    }

    const gameService = new GameService();
    const newGame = await gameService.create({
        id: uuid(),
        provider: "",
        categoryId: body.categoryId,
        name: body.name,
        logoUrl: uploadLogoUrl,
        isPopular: false,
        slug: body.slug,
        logoDenom: uploadLogoDenom,
        deleted: false,
        needServerId: (body.type === "topup" && body.needServerId && body.needServerId === "true") || null,
        typeServerId: body.typeServerId ? ServerIdType[body.typeServerId.toUpperCase()] : null,
        type: body.type,
        voucherType: body.voucherType ? VoucherType[body.voucherType.toUpperCase()] : null,
        description: body.desc,
        automatically: false,
        cd: "",
    });

    let dataBulk: ListServerDto[] = [];
    if (body.needServerId && body.typeServerId === "list" && body.listServerId) {
        for (const data of JSON.parse(body.listServerId)) {
            dataBulk.push({
                id: uuid(),
                gameId: newGame.id,
                label: data.label,
                value: data.value,
            });
        }
        const listServerService = new ListServerService();
        await listServerService.model.bulkCreate(dataBulk);
    }

    // const clearDesc = body.desc.replace(/<[^>]+>/g, "");
    // const metaService = new MetaService();
    // await metaService.create({
    //     id: uuid(),
    //     path: `/${body.slug}`,
    //     title: body.name,
    //     slug: body.slug,
    //     description: clearDesc,
    //     keywords: body.keywords,
    //     icon: uploadLogoUrl,
    //     image: uploadLogoUrl,
    // });

    res.send({
        ...newGame.dataValues,
        ...(body.needServerId && body.typeServerId === "list" && body.listServerId && { listServer: dataBulk }),
    });
};

export const createGame: IApiRouter = {
    path,
    method,
    main,
    auth,
    isUploadImage: true,
    dataImg: {
        single: false,
        field: ["logoUrl", "logoDenom"],
    },
};
