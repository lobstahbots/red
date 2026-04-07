import styles from "./Stream.module.css";

export interface StreamProps {
    type: "TWITCH" | "YOUTUBE";
    channel: string;
}

export default function Stream({ type, channel }: StreamProps) {
    return (
        <div>
            <iframe
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className={styles.videoPlayer}
                src={
                    type === "YOUTUBE"
                        ? `https://www.youtube.com/embed/${channel}?autoplay=1`
                        : `https://player.twitch.tv/?channel=${channel}&parent=red.lobstahbots.com&autoplay=true`
                }
            />
        </div>
    );
}
