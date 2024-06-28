import { Config } from "@config/index";
import { IDI } from "@interfaces/index";
import { MinioService } from "@serviceExternal/minio.service";
import { RedisService } from "@serviceExternal/redis.service";
import { WhatsAppService } from "@serviceExternal/whatsapp.service";
import { AdminService } from "@serviceInternal/admin.service";
import { AdminRoleService } from "@serviceInternal/adminRole.service";
import { AdminUserRoleService } from "@serviceInternal/adminUserRole";
import { ArticleService } from "@serviceInternal/article.service";
import { ArticleButtonService } from "@serviceInternal/articleButton.service";
import { ArticleCategoryService } from "@serviceInternal/articleCategory.service";
import { ArticleCategoryArticleService } from "@serviceInternal/articleCategoryArticle.service";
import { ArticleImageService } from "@serviceInternal/articleImage.service";
import { CommentService } from "@serviceInternal/comment.service";
import { Request, Response, NextFunction } from "express";
import requestIp from "request-ip";
import { Server } from "socket.io";

export const setupDI = (client: WhatsAppService, io: Server) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const di: IDI = {
            config: new Config(),
            adminService: new AdminService(),
            adminUserRoleService: new AdminUserRoleService(),
            adminRoleService: new AdminRoleService(),
            minioService: new MinioService(),
            redisService: new RedisService(),
            articleService: new ArticleService(),
            articleCategoryService: new ArticleCategoryService(),
            articleCategoryArticleService: new ArticleCategoryArticleService(),
            articleButtonService: new ArticleButtonService(),
            articleImageService: new ArticleImageService(),
            commentService: new CommentService(),
        };

        const clientIp = requestIp.getClientIp(req);
        req.clientIp = clientIp;
        req.io = io;
        req.client = client;
        req.di = di;
        next();
    };
};
