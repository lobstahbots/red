"use client";
import styles from "./page.module.css";
import Stream from "@/components/Stream";
import { DEFAULT, Preferences } from "@/lib/preference";
import {
    REALTIME_SUBSCRIBE_STATES,
    RealtimeChannel,
    RealtimeClient,
} from "@supabase/realtime-js";
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
    const [previous, setPrevious] = useState<{
        event: { name: string };
        match: { key: string };
        webcasts: { type: "TWITCH" | "YOUTUBE"; channel: string }[];
    } | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>(
        "Load a match to start!",
    );
    const preferenceRef = useRef<Preferences>(DEFAULT);
    const setPreferences = (preferences: Preferences) => {
        preferenceRef.current = { ...preferenceRef.current, ...preferences };
    };
    const [idx, setIdx] = useState(0);
    const toSkip = useRef<string[]>([]);
    const loadMatch = async () => {
        const match = await fetch("/match", {
            method: "POST",
            body: JSON.stringify({
                ...preferenceRef.current,
                skipMatches: toSkip.current,
            }),
        });
        const newData = await match.json();
        if (newData.status === "success") {
            setPrevious(data);
            setData(newData);
            setIdx(0);
        } else if (newData.status === "noMatch") {
            if (toSkip.current.length !== 0) {
                toSkip.current = [];
                await loadMatch();
                return;
            }
            setData(null);
            setStatusMessage(
                "No matches found. The system will try to fetch new matches periodically, or do so manually below.",
            );
            setTimeout(loadMatch, 10000);
        }
    };
    const subToChannel = async () => {
        await supabase.removeAllChannels();
        if (data) {
            supabase
                .channel(data.match.key.split("_")[0])
                .on("broadcast", { event: "match_done" }, async (payload) => {
                    console.log(payload);
                    if (payload.payload.key === data.match.key) {
                        await loadMatch();
                    }
                })
                .subscribe((status, error) => {
                    console.log(status);
                    if (error) {
                        console.error(error);
                    }
                    if (
                        status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
                        status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
                    ) {
                        setTimeout(subToChannel, 1000);
                    }
                });
        }
    };
    useEffect(() => {
        subToChannel();
    }, [data]);
    const key = data?.match.key.split("_")[1];
    return (
        <div className={styles.page}>
            {data === null ? (
                <div className={styles.buttons}>
                    <div>{statusMessage}</div>
                    <button className={styles.button} onClick={loadMatch}>
                        Load match
                    </button>
                    {previous && (
                        <button
                            className={`${styles.button} ${styles.secondaryButton}`}
                            onClick={async () => {
                                setData(previous);
                                setPrevious(null);
                            }}
                        >
                            Previous
                        </button>
                    )}
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
                                  : "Finals " + key!.slice(3)}
                        </h3>
                        <div className={styles.buttonSpacer} />
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
                        {
                            previous && (
                                <button
                                    className={`${styles.button} ${styles.secondaryButton}`}
                                    onClick={async () => {
                                        setData(previous);
                                        setPrevious(null);
                                    }}
                                >
                                    Previous
                                </button>
                            )
                        }
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
