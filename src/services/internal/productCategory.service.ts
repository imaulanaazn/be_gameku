import { MainService } from "./main.service";
import { ProductCategoryDto } from "src/dtos/index";
import { ProductCategoryEntity } from "@entity/index";

export class ProductCategoryService extends MainService<ProductCategoryEntity, ProductCategoryDto> {
    constructor() {
        super(ProductCategoryEntity);
    }
}
