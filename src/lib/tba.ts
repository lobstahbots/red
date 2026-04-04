import { Prisma, WebcastType } from "@/generated/prisma/client";
import { prisma } from "./prisma";

const TBA_API_KEY: string = process.env["TBA_API_KEY"]!;

export async function ensureExists(eventKey: string) {
    let event = await prisma.event.findFirst({
        where: { key: eventKey },
        include: { webcasts: true },
    });
    if (!event) {
        const res = await fetch(
            `https://www.thebluealliance.com/api/v3/event/${eventKey}`,
            {
                headers: {
                    "X-TBA-Auth-Key": TBA_API_KEY,
                },
            },
        );
        const eventData = await res.json();
        event = await prisma.event.create({
            data: {
                key: eventData.key,
                name: eventData.name,
                webcasts: {
                    create: eventData.webcasts.map(
                        (webcast: {
                            type: string;
                            channel: string;
                            date: string | null;
                        }): Prisma.WebcastCreateManyEventInput => ({
                            type: WebcastType[
                                webcast.type.toUpperCase() as keyof typeof WebcastType
                            ],
                            channel: webcast.channel,
                            date: webcast.date ? new Date(webcast.date) : null,
                        }),
                    ),
                },
            },
            include: {
                webcasts: true,
            },
        });
    }
    return event;
}
