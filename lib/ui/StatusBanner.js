"use babel";

import React, { useState, useEffect } from "react";
import statuses from "../sync-statuses.json";
import { cmd } from "../utils/command";
import { store } from "../store";
import { commands as welcomeCmds } from "./WelcomeDialog";

import keys from "../keys.json";

export const commands = {
    needsAuth: cmd("status-banner:needsAuth"),
    synced: cmd("status-banner:synced"),
    syncing: cmd("status-banner:syncing"),
    error: cmd("status-banner:error"),
    offline: cmd("status-banner:offline"),
};

export default function StatusBanner() {
    const [status, setStatus] = useState(store.get(keys.syncStatus));

    useEffect(() => {
        const cmdRef = inkdrop.commands.add(document.body, {
            [commands.needsAuth]: () => setStatus(statuses.needsAuth),
            [commands.synced]: () => setStatus(statuses.synced),
            [commands.syncing]: () => setStatus(statuses.syncing),
            [commands.error]: () => setStatus(statuses.error),
            [commands.offline]: () => setStatus(statuses.offline),
        });

        return () => cmdRef.dispose();
    }, []);

    return (
        <div className="sync-banner">
            <span className="sync-banner-text">Settings Sync</span>
            {!!status ? <StatusLabel status={status} /> : <></>}
        </div>
    );
}

function StatusLabel({ status }) {
    const { className, text, onClick = () => {} } = getStatusInfo(status);

    return (
        <div onClick={onClick} className={`status ${className}`}>
            {text}
        </div>
    );
}

function getStatusInfo(status) {
    if (status == statuses.needsAuth)
        return {
            className: "auth-needed",
            text: "Auth Needed",
            onClick: () => {
                inkdrop.commands.dispatch(document.body, welcomeCmds.show);
            },
        };
    if (status == statuses.syncing)
        return {
            className: "syncing",
            text: "Syncing",
        };
    if (status == statuses.synced)
        return {
            className: "synced",
            text: "Synced",
        };
    if (status == statuses.error)
        return {
            className: "error",
            text: "Error",
        };
    if (status == statuses.offline)
        return {
            style: {
                background: "transparent",
                border: "1px solid #a1a1a1",
                color: "#a1a1a1",
            },
            text: "Offline",
        };
}
