"use client";
import styles from "./page.module.css";
import Stream from "@/components/Stream";
import { useState } from "react";

export default function Home() {
    const [streamType, setStreamType] = useState<"TWITCH" | "YOUTUBE" | null>(
        null,
    );
    const [channel, setChannel] = useState<string>("");
    const [match, setMatch] = useState<{
        event: { name: string };
        key: string;
    } | null>(null);
    const loadMatch = async () => {
        const match = await fetch("/match", {
            method: "POST",
            body: "null",
        });
        const data = await match.json();
        if (data.status === "success") {
            setStreamType(data.webcasts[0].type);
            setChannel(data.webcasts[0].channel);
            setMatch(data);
        }
    };
    return (
        <div className={styles.page}>
            {streamType === null ? (
                <div className={styles.buttons}>
                    <button className={styles.button} onClick={loadMatch}>
                        Load match
                    </button>
                </div>
            ) : null}
            {streamType && match && (
                <>
                    <Stream type={streamType} channel={channel} />
                    <div className={styles.matchInfo}>
                        <h3>{match.event.name}</h3>
                        <p>{match.key}</p>
                        <button
                            className={`${styles.button} ${styles.secondaryButton}`}
                            onClick={loadMatch}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
