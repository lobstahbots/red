"use client";
import Image from "next/image";
import styles from "./page.module.css";
import Stream from "@/components/Stream";
import { useState } from "react";

export default function Home() {
    const [streamType, setStreamType] = useState<"TWITCH" | "YOUTUBE" | null>(
        null,
    );
    const [channel, setChannel] = useState<string>("");
    return (
        <div className={styles.page}>
            {streamType === null ? (
                <div className={styles.buttons}>
                    <button
                        className={styles.button}
                        onClick={async () => {
                            const match = await fetch("/match");
                            const data = await match.json();
                            if (data.status === "success") {
                                setStreamType(data.webcasts[0].type);
                                setChannel(data.webcasts[0].channel);
                            }
                        }}
                    >
                        Load match
                    </button>
                </div>
            ) : null}
            {streamType && <Stream type={streamType} channel={channel} />}
        </div>
    );
}
