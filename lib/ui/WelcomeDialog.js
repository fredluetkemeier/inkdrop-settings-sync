"use babel";

import React, { useEffect, useState } from "react";

export default function WelcomeDialog(props) {
    const [isOpen, setIsOpen] = useState(false);

    const { Dialog, AppControlView } = inkdrop.components.classes;

    useEffect(() => {
        const showCmd = inkdrop.commands.add(document.body, {
            "inkdrop-settings-sync:welcome-modal:show": () => setIsOpen(true),
        });

        inkdrop.commands.dispatch(
            document.body,
            "inkdrop-settings-sync:welcome-modal:ready"
        );

        return () => showCmd.dispose();
    }, []);

    return (
        <Dialog
            className="large"
            visible={isOpen}
            onBackdropClick={() => setIsOpen(false)}
        >
            <Dialog.Title>Welcome to Settings Sync!</Dialog.Title>
            <Dialog.Content>
                <p>Let's get you signed into GitHub.</p>
                <p>
                    <strong>Settings Sync</strong> uses a GitHub Gist to store
                    your settings files.
                </p>
            </Dialog.Content>
            <Dialog.Actions>
                <button className="ui button" onClick={() => {}}>
                    <span>Next</span>
                </button>
            </Dialog.Actions>
        </Dialog>
    );
}
