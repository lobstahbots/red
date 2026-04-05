import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    if (request.headers.get("Cron-Token") !== process.env.CRON_TOKEN)
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    const matches = await prisma.match.findMany({
        where: {
            done: false,
            time: {
                gte: new Date(Date.now()),
                lte: new Date(Date.now() + 2 * 60 * 60 * 1000),
            },
        },
    });
    const promises: Promise<unknown>[] = [];
    for (const match of matches) {
        promises.push(
            (async () => {
                const response = await fetch(
                    `https://api.statbotics.io/v3/match/${match.key}`,
                    {
                        headers: {
                            Accept: "application/json",
                        },
                    },
                );
                if (!response.ok) return;
                const data = (await response.json()) as {
                    pred: {
                        red_score: number;
                        blue_score: number;
                    };
                };
                await prisma.match.update({
                    where: { id: match.id },
                    data: {
                        red_score: data.pred.red_score,
                        blue_score: data.pred.blue_score,
                    },
                });
            })(),
        );
    }
    await Promise.all(promises);
    return Response.json({ success: true, number: promises.length });
}
