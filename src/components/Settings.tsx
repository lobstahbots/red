import { Preferences } from "@/lib/preference";
import { useEffect, useRef } from "react";

export interface SettingsProps {
    setPreferences: (preferences: Preferences) => void;
    setOpen: (open: () => void) => void;
}

export default function Settings({ setPreferences, setOpen }: SettingsProps) {
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    useEffect(() => {
        setOpen(() => dialogRef.current?.showModal());
    }, [setOpen]);
    useEffect(() => {
        
    })
    return <dialog ref={dialogRef} closedby="any"></dialog>;
}
