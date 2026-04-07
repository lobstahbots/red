import { WebcastType } from "@/generated/prisma/client";
import { DEFAULT, get, Preferences } from "@/lib/preference";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const preferences = ((await request.json()) ?? DEFAULT) as Preferences;
    const time = new Date();
    const matches = await prisma.match.findMany({
        where: {
            // done: false,
            time: {
                gte: time,
                lte: new Date(time.getTime() + preferences.maxTime),
            },
        },
        include: {
            event: {
                include: {
                    webcasts: true,
                },
            },
        },
    });
    if (matches.length === 0)
        return Response.json({ status: "noMatch", match: null });
    const selectedMatch = get(matches, preferences, time);
    const webcasts: { type: WebcastType; channel: string }[] = [];
    for (const webcast of selectedMatch.event.webcasts) {
        if (
            webcast.date === null ||
            (webcast.date.getUTCDate() === time.getUTCDate() &&
                webcast.date.getUTCMonth() === time.getUTCMonth() &&
                webcast.date.getUTCFullYear() === time.getUTCFullYear())
        )
            webcasts.push({ type: webcast.type, channel: webcast.channel });
    }
    const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        event: { webcasts: _, id: __, updatedAt: ___, ...event },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        id: ____,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        eventId: _____,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        asOfTime: ______,
        ...match
    } = selectedMatch;
    return Response.json({ status: "success", match, webcasts, event });
}
