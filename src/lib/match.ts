import { RealtimeClient } from "@supabase/realtime-js";

const client = new RealtimeClient(
    "wss://" + process.env.NEXT_PUBLIC_SUPABASE_URL + "/realtime/v1",
    {
        params: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_PUB_KEY,
        },
    },
);

client.connect();

export async function markDone(matchKey: string) {
    client.connect();
    await client
        .channel(matchKey.split("_")[0])
        .httpSend("match_done", { key: matchKey });
}
