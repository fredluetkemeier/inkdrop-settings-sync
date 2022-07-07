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
};

export default function StatusBanner() {
    const [status, setStatus] = useState(store.get(keys.syncStatus));

    useEffect(() => {
        const cmdRef = inkdrop.commands.add(document.body, {
            [commands.needsAuth]: () => setStatus(statuses.needsAuth),
            [commands.synced]: () => setStatus(statuses.synced),
            [commands.syncing]: () => setStatus(statuses.syncing),
            [commands.error]: () => setStatus(statuses.error),
        });

        return () => cmdRef.dispose();
    }, []);

    return (
        <div
            style={{
                padding: "10px 16px",
                borderTop: "var(--sidebar-sync-status-view-border-top)",
                display: "flex",
                justifyContent: "space-between",
            }}
        >
            <span
                style={{
                    fontSize: "12px",
                    color: "var(--sidebar-menu-section-color)",
                    display: "inline-flex",
                    alignItems: "center",
                }}
            >
                Settings Sync
            </span>
            {!!status ? <StatusLabel status={status} /> : <></>}
        </div>
    );
}

function StatusLabel({ status }) {
    const { style, text, onClick = () => {} } = getStatusInfo(status);

    return (
        <div
            style={{
                padding: "0px 4px",
                borderRadius: "8px",
                fontSize: "10px",
                fontWeight: "bold",
                ...style,
            }}
            onClick={onClick}
        >
            {text}
        </div>
    );
}

function getStatusInfo(status) {
    if (status == statuses.needsAuth)
        return {
            style: {
                background: "transparent",
                border: "1px solid #f5cc00",
                color: "#f5cc00",
                cursor: "pointer",
            },
            text: "Auth Needed",
            onClick: () => {
                inkdrop.commands.dispatch(document.body, welcomeCmds.show);
            },
        };
    if (status == statuses.syncing)
        return {
            style: {
                background:
                    "linear-gradient(90deg, rgba(134,0,217,1) 0%, rgba(0,62,215,1) 100%)",
            },
            text: "Syncing",
        };
    if (status == statuses.synced)
        return {
            style: {
                background:
                    "linear-gradient(90deg, rgba(36,200,0,1) 0%, rgba(0,196,193,1) 100%)",
                color: "#000",
            },
            text: "Synced",
        };
    if (status == statuses.error)
        return {
            style: {
                background: "transparent",
                border: "1px solid #c80000",
                color: "#c80000",
            },
            text: "Error",
        };
}
