interface IBaseRequest {
    "voucherPricePoint.id": number;
    "voucherPricePoint.price": number;
    "voucherPricePoint.variablePrice": number;
    n: string;
    email: string;
    userVariablePrice: number;
    "order.data.profile": string;
    "user.userId": string;
    "user.zoneId": string;
    msisdn: string;
    voucherTypeName: string;
    shopLang: string;
    voucherTypeId: number;
    gvtId: number;
    checkoutId: string;
    affiliateTrackingId: string;
    impactClickId: string;
    anonymousId: string;
}

interface IChekingUserGame {
    gameCd: string;
    userId: string;
    serverId: string;
}
// fetch("https://order-sg.codashop.com/initPayment.action", {
//   "headers": {
//     "accept": "application/json, text/plain, */*",
//     "accept-language": "id-ID",
//     "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
//     "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"Windows\"",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-site",
//     "x-expt-context": "{\"libraryVersion\":\"0.27.1\",\"codaCookieId\":\"a9f65bb3-8b88-47da-b89c-e559d8117f70\",\"domainName\":\"www.codashop.com\",\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36\",\"os\":\"Windows\",\"mobile\":false,\"browser\":\"Chromium:122/Not(A:Brand:24/Google Chrome:122\",\"ip\":\"114.122.107.49\",\"exptToken\":\"eyJraWQiOiIyMDIzMTAzMSIsImFsZyI6IkVTMjU2In0.eyJpZCI6IjAxOGNkZGQ4LTUyOTgtNzUwOC05NmI2LTdlYWNhMzQzM2YzYiJ9.A2ZY9jsRmaJYxH_UY_6NiTy11D_Q_GBjLw6TnUAhnB05AxV12dqrPALyQ9BoqInD1NqIgyPjdvuiV57i9_7NEA\",\"deviceId\":\"3c275497-e02f-445d-b605-7e08c0d7c780\",\"platformId\":1,\"lvtId\":1321,\"lastUsedPcId\":240,\"emailSaved\":true,\"country\":\"id\",\"loginStatus\":0,\"userType\":1,\"whiteLabelId\":null,\"gvtId\":139,\"appVersion\":\"vue2\",\"vue3ExperimentVariation\":null,\"pageTypeName\":\"ProductDetail\"}",
//     "x-expt-token": "eyJraWQiOiIyMDIzMTAzMSIsImFsZyI6IkVTMjU2In0.eyJpZCI6IjAxOGNkZGQ4LTUyOTgtNzUwOC05NmI2LTdlYWNhMzQzM2YzYiJ9.A2ZY9jsRmaJYxH_UY_6NiTy11D_Q_GBjLw6TnUAhnB05AxV12dqrPALyQ9BoqInD1NqIgyPjdvuiV57i9_7NEA",
//     "x-session-country2name": "ID",
//     "x-session-key": "",
//     "x-xsrf-token": "null",
//     "Referer": "https://www.codashop.com/",
//     "Referrer-Policy": "strict-origin-when-cross-origin"
//   },
//   "body": "voucherPricePoint.id=115689&voucherPricePoint.price=15000.0&voucherPricePoint.variablePrice=0&n=16%2F3%2F2024-1354&email=HAHAHA%40GMAIL.COM&userVariablePrice=0&order.data.profile=eyJuYW1lIjoiICIsImRhdGVvZmJpcnRoIjoiIiwiaWRfbm8iOiIifQ%3D%3D&user.userId=Demon1%23Bryx&user.zoneId=&msisdn=&voucherTypeName=VALORANT&voucherTypeId=109&gvtId=139&lvtId=1321&pcId=240&shopLang=id_ID&checkoutId=5dcd7c91-3763-432e-9e7b-e93012a0138f&affiliateTrackingId=&impactClickId=&anonymousId=&absoluteUrl=https%3A%2F%2Fwww.codashop.com%2Fid-id%2Fvalorant&utmParameters=&userSessionId=SEFIQUhBQEdNQUlMLkNPTQ%3D%3D&userEmailConsent=false&userMobileConsent=false&userCustomCommerceEmailConsent=false&verifiedMsisdn=&promoId=&promoCode=&clevertapId=&promotionReferralCode=&isReferredUser=false&deviceId=3c275497-e02f-445d-b605-7e08c0d7c780",
//   "method": "POST"
// });
export class CheckingGameIdService {
    private url = "https://order-sg.codashop.com/initPayment.action";

    async checking(data: IChekingUserGame): Promise<any> {
        const baseBody = {
            "voucherPricePoint.id": 0,
            "voucherPricePoint.price": 0,
            "voucherPricePoint.variablePrice": 0,
            n: "",
            email: "",
            userVariablePrice: 0,
            "order.data.profile": "eyJuYW1lIjoiICIsImRhdGVvZmJpcnRoIjoiIiwiaWRfbm8iOiIifQ==",
            "user.userId": data.userId,
            "user.zoneId": data.serverId ? data.serverId : "",
            msisdn: "",
            voucherTypeName: "",
            shopLang: "id_ID",
            voucherTypeId: 5,
            gvtId: 19,
            checkoutId: "",
            affiliateTrackingId: "",
            impactClickId: "",
            anonymousId: "",
        };

        if (data.gameCd === "FF") {
            baseBody["voucherPricePoint.id"] = 8159;
            baseBody["voucherPricePoint.price"] = 300000.0;
            baseBody["n"] = "12/7/2022-208";
            baseBody["voucherTypeName"] = "FREEFIRE";
        } else if (data.gameCd === "ML") {
            baseBody["voucherPricePoint.id"] = 27670;
            baseBody["voucherPricePoint.price"] = 242535.0;
            baseBody["n"] = "12/7/2022-2046";
            baseBody["voucherTypeName"] = "MOBILE_LEGENDS";
        } else if (data.gameCd === "VALORANT") {
            baseBody["voucherPricePoint.id"] = 115689;
            baseBody["voucherPricePoint.price"] = 15000.0;
            baseBody["n"] = "16/3/2024-1354";
            baseBody["voucherTypeId"] = 109;
            baseBody["gvtId"] = 139;
            baseBody["voucherTypeName"] = "VALORANT";
        } else {
            return undefined;
        }

        try {
            const request = await this.baseRequest(baseBody);
            console.log(request);
            if (request && request.success) {
                let username;
                if (data.gameCd === "FF") {
                    username = request.confirmationFields.roles[0].role;
                } else if (data.gameCd === "ML") {
                    username = request.confirmationFields.username;
                }

                return username;
            } else {
                return undefined;
            }
        } catch (error) {
            throw error;
        }
    }

    private async baseRequest(body: IBaseRequest): Promise<any> {
        const req = await fetch(this.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Origin: "https://www.codashop.com",
                Referer: "https://www.codashop.com/",
                "User-Agent":
                    "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Mobile Safari/537.36",
            },
            body: JSON.stringify(body),
        });

        const res = await req.json();
        return res;
    }
}
