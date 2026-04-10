"use client";
import styles from "./page.module.css";
import Stream from "@/components/Stream";
import { DEFAULT } from "@/lib/preference";
import { useState } from "react";

export default function Home() {
    const [match, setMatch] = useState<{
        event: { name: string };
        key: string;
        webcasts: { type: "TWITCH" | "YOUTUBE"; channel: string }[];
    } | null>(null);
    const [idx, setIdx] = useState(0);
    const [toSkip, setToSkip] = useState<string[]>([]);
    const loadMatch = async () => {
        console.log(toSkip);
        const match = await fetch("/match", {
            method: "POST",
            body: JSON.stringify({ ...DEFAULT, skipMatches: toSkip }),
        });
        const data = await match.json();
        if (data.status === "success") {
            setMatch(data);
            setIdx(0);
        }
    };
    return (
        <div className={styles.page}>
            {match === null ? (
                <div className={styles.buttons}>
                    <button className={styles.button} onClick={loadMatch}>
                        Load match
                    </button>
                </div>
            ) : null}
            {match && match && (
                <>
                    <Stream
                        type={match.webcasts[idx].type}
                        channel={match.webcasts[idx].channel}
                    />
                    <div className={styles.matchInfo}>
                        <h3>{match.event.name}</h3>
                        <p>{match.key}</p>
                        {match.webcasts.length > 1 && (
                            <button
                                className={styles.button}
                                onClick={() =>
                                    setIdx((idx + 1) % match.webcasts.length)
                                }
                            >
                                Switch stream
                            </button>
                        )}
                        <button
                            className={`${styles.button} ${styles.secondaryButton}`}
                            onClick={async () => {
                                if (!toSkip.includes(match.key))
                                    setToSkip((existing) => [
                                        match.key,
                                        ...existing.slice(
                                            0,
                                            Math.min(4, existing.length),
                                        ),
                                    ]);
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
