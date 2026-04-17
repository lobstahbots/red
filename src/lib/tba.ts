import { Prisma, WebcastType } from "@/generated/prisma/client";
import { prisma } from "./prisma";

const TBA_API_KEY: string = process.env["TBA_API_KEY"]!;

function cleanName(name: string): string {
    return name
        .split(" presented by ")[0]
        .replace(/FIRST in ([a-z])[a-z]*/gi, (match, firstLetter) => {
            return "Fi" + firstLetter.toUpperCase();
        }).replace("District Championship", "DCMP");
}

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
                name: cleanName(eventData.name),
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
    } else if (event.updatedAt.getTime() < Date.now() - 3 * 60 * 60 * 1000) {
        const res = await fetch(
            `https://www.thebluealliance.com/api/v3/event/${eventKey}`,
            {
                headers: {
                    "X-TBA-Auth-Key": TBA_API_KEY,
                },
            },
        );
        const eventData = await res.json();
        let deleted;
        [deleted, event] = await prisma.$transaction([
            prisma.webcast.deleteMany({ where: { eventId: event.id } }),
            prisma.event.update({
                where: { id: event.id },
                data: {
                    key: eventData.key,
                    name: cleanName(eventData.name),
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
                                date: webcast.date
                                    ? new Date(webcast.date)
                                    : null,
                            }),
                        ),
                    },
                },
                include: {
                    webcasts: true,
                },
            }),
        ]);
    }
    return event;
}
