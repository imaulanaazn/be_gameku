import fetch from "node-fetch";

export class KiosGamerService {
    async getAllGames() {
        const appIds = ["100070", "100067", "100082", "100105", "100130", "100056"];
        const data = await Promise.all(
            appIds.map(async (item) => {
                const req = await fetch(
                    `https://kiosgamer.co.id/api/shop/apps/channels?app_id=${item}&packed_role_id=0&region=CO.ID&language=id`,
                );
                const res = await req.json();
                const getListByGarenaShell = res.channels.find((item) => item.category === 1);
                return {
                    ...res,
                    channels: getListByGarenaShell,
                };
            }),
        );

        return data;
    }
}
