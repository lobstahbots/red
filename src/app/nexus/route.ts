import { MatchStatus } from "@/generated/prisma/browser";
import { Match, Prisma } from "@/generated/prisma/client";
import { markDone } from "@/lib/match";
import { prisma } from "@/lib/prisma";
import { ensureExists } from "@/lib/tba";

const NEXUS_TOKEN: string = process.env["NEXUS_TOKEN"]!;

const matchStatusMap = {
    "Queuing soon": MatchStatus.QUEUING_SOON,
    "Now queuing": MatchStatus.NOW_QUEUING,
    "On deck": MatchStatus.ON_DECK,
    "On field": MatchStatus.ON_FIELD,
};

export async function POST(request: Request) {
    if (request.headers.get("Nexus-Token") !== NEXUS_TOKEN)
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    const data = (await request.json()) as {
        eventKey: string;
        dataAsOfTime: number;
        nowQueuing: string | null;
        matches: {
            label: string;
            status: "Queuing soon" | "Now queuing" | "On deck" | "On field";
            redTeams: (string | null)[] | null;
            blueTeams: (string | null)[] | null;
            times: {
                scheduledStartTime: number | null;
                estimatedQueueTime: number | null;
                estimatedOnDeckTime: number | null;
                estimatedOnFieldTime: number | null;
                estimatedStartTime: number | null;
                actualQueueTime: number | null;
                actualOnDeckTime: number | null;
                actualOnFieldTime: number | null;
            };
            breakAfter: string | null;
            replayOf: string | null;
        }[];
    };
    const event = await ensureExists(data.eventKey);
    const existingMatches = await prisma.match.findMany({
        where: { eventId: event.id },
    });
    const existingMatchMap = new Map(
        existingMatches.map((match) => [match.key, match]),
    );
    let hasOnField = false;
    const create: Prisma.MatchCreateManyInput[] = [];
    const update: Promise<Match>[] = [];
    for (const match of data.matches.toReversed()) {
        if (match.label.startsWith("Practice")) continue;
        const matchNumber = parseInt(match.label.match(/\d+/)?.[0] ?? "0");
        const matchKey =
            data.eventKey +
            "_" +
            (match.label.startsWith("Final")
                ? `f1m${matchNumber}`
                : match.label.startsWith("Playoff")
                  ? `sf${matchNumber}m1`
                  : `qm${matchNumber}`);
        const existingMatch = existingMatchMap.get(matchKey);
        if (
            existingMatch &&
            (existingMatch.done ||
                existingMatch.asOfTime.getTime() >= data.dataAsOfTime)
        )
            continue;
        const wasDone = existingMatch?.done ?? false;
        const status = matchStatusMap[match.status];
        const teams = [
            ...(match.redTeams ?? []),
            ...(match.blueTeams ?? []),
        ].map((t) => parseInt(t ?? "0"));
        if (existingMatch)
            update.push(
                prisma.match.update({
                    where: { key: matchKey },
                    data: {
                        asOfTime: new Date(data.dataAsOfTime),
                        done: wasDone || hasOnField,
                        status,
                        teams,
                        time: new Date(
                            match.times.estimatedStartTime
                                ? match.times.estimatedStartTime
                                : 0,
                        ),
                    },
                }),
            );
        else {
            create.push({
                key: matchKey,
                eventId: event.id,
                asOfTime: new Date(data.dataAsOfTime),
                done: hasOnField,
                status,
                teams,
                blue_score: 0,
                red_score: 0,
                time: new Date(
                    match.times.estimatedStartTime
                        ? match.times.estimatedStartTime
                        : 0,
                ),
            });
        }
        if (!wasDone && hasOnField) markDone(matchKey);
        hasOnField ||= status === MatchStatus.ON_FIELD;
    }
    await Promise.all([...update, create.length > 0 ? prisma.match.createMany({ data: create }): Promise.resolve()]);

    return Response.json({});
}
