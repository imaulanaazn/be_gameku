import { ValidatorType } from "@enum/index";
import { Validator } from "@helper/validator";
import { IApiRouter, Validation } from "@interfaces/index";
import { RequestHandler } from "express";
import { readFileSync, readdirSync } from "fs";

const path = "/v1/whatsapp";
const method = "GET";
const auth = "admin";

const schemaValidation: Validation[] = [
    {
        name: "withContent",
        type: "string",
        required: false,
        enum: ["true", "false"],
    },
];

const main: RequestHandler = async (req, res) => {
    const query = new Validator(req, res).process<{
        withContent: boolean;
    }>(schemaValidation, ValidatorType.QUERY);
    query["withContent"] = (query.withContent as any) === "true";

    const pathDir = "template/whatsapp";
    const getFiles = readdirSync(pathDir);

    let files = [];
    for (const file of getFiles) {
        const baseText = file.split(".")[0];
        const value = baseText.toUpperCase();
        const label = baseText
            .split("_")
            .map((str) => {
                return str.charAt(0).toUpperCase() + str.slice(1);
            })
            .join(" ");
        let content;
        if (query.withContent) {
            content = readFileSync(pathDir + "/" + file, { encoding: "utf-8" });
        }
        files.push({
            value,
            label,
            content,
        });
        console.log(baseText);
    }

    res.send(files);
};

export const getAllTemplateWhatsapp: IApiRouter = {
    main,
    path,
    method,
    auth,
};
