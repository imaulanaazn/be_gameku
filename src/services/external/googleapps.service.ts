interface IUpdateData {
    cd: string;
    data: {
        denom: string;
        cd: string;
        priceBuy: string;
        priceSell: string;
    }[];
}

export class GoogleAppsScript {
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    async sendUpdateData(data: IUpdateData[]): Promise<any> {
        return await this.requestData<IUpdateData[]>("update", data);
    }

    private async requestData<T>(type: "generate" | "update" | "create", data: T): Promise<any> {
        console.log(`@@ START REQUEST ${type.toUpperCase()}`);
        console.log(data);
        const url = `${this.url}?type=${type}`;
        console.log(url);
        const req = await fetch(url, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const res = await req.text();
        console.log(`@@ END REQUEST ${type.toUpperCase()}`);
        return res;
    }
}
