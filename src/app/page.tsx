"use client";
import styles from "./page.module.css";
import Stream from "@/components/Stream";
import { DEFAULT } from "@/lib/preference";
import { RealtimeChannel, RealtimeClient } from "@supabase/realtime-js";
import { useEffect, useRef, useState } from "react";

const supabase = new RealtimeClient(
    "wss://" + process.env.NEXT_PUBLIC_SUPABASE_URL + "/realtime/v1",
    {
        params: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_PUB_KEY,
        },
    },
);

export default function Home() {
    const [data, setData] = useState<{
        event: { name: string };
        match: { key: string };
        webcasts: { type: "TWITCH" | "YOUTUBE"; channel: string }[];
    } | null>(null);
    const [idx, setIdx] = useState(0);
    const toSkip = useRef<string[]>([]);
    const loadMatch = async () => {
        const match = await fetch("/match", {
            method: "POST",
            body: JSON.stringify({ ...DEFAULT, skipMatches: toSkip.current }),
        });
        const data = await match.json();
        if (data.status === "success") {
            setData(data);
            setIdx(0);
        }
    };
    const channelRef = useRef<RealtimeChannel | null>(null);
    useEffect(() => {
        supabase.removeAllChannels();
        if (data) {
            channelRef.current = supabase.channel(data.match.key.split("_")[0]);
            channelRef.current.on("broadcast", { event: "match_done" }, (payload) => {
                console.log(payload);
                if (payload.key === data.match.key) {
                    loadMatch();
                }
            }).subscribe();
        }
    }, [data])
    const key = data?.match.key.split("_")[1];
    return (
        <div className={styles.page}>
            {data === null ? (
                <div className={styles.buttons}>
                    <button className={styles.button} onClick={loadMatch}>
                        Load match
                    </button>
                </div>
            ) : null}
            {data && (
                <>
                    <Stream
                        type={data.webcasts[idx].type}
                        channel={data.webcasts[idx].channel}
                    />
                    <div className={styles.matchInfo}>
                        <h3>
                            {data.event.name}{" "}
                            {key!.startsWith("qm")
                                ? "Qualification " + key!.slice(2)
                                : key!.startsWith("sf")
                                  ? "Playoffs " + key!.slice(2, key!.length - 2)
                                  : "Finals " + key!.slice(4)}
                        </h3>
                        {data.webcasts.length > 1 && (
                            <button
                                className={styles.button}
                                onClick={() =>
                                    setIdx((idx + 1) % data.webcasts.length)
                                }
                            >
                                Switch stream
                            </button>
                        )}
                        <button
                            className={`${styles.button} ${styles.secondaryButton}`}
                            onClick={async () => {
                                if (!toSkip.current.includes(data.match.key)) {
                                    toSkip.current.unshift(data.match.key);
                                    toSkip.current.splice(5);
                                }
                                await loadMatch();
                            }}
                        >
                            New Match
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
