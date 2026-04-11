import { markDone } from "@/lib/match";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const content = await request.json();
    if (typeof content.message_type !== "string")
        return Response.json(
            { error: "Invalid message_type" },
            { status: 400 },
        );
    if (content.message_type === "ping")
        return Response.json({ message_type: "pong" });
    if (content.message_type === "verification")
        await prisma.verificationKey.create({
            data: { key: content.message_data.key },
        });
    if (content.message_type === "match_score") {
        const key = content.message_data.match.key;
        await prisma.match.update({
            where: { key },
            data: {
                done: true,
            },
        });
        markDone(key);
    }
    return Response.json({ success: true });
}
