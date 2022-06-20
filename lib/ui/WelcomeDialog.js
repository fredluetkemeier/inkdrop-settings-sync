"use babel";

import React, { useEffect, useState } from "react";

export default function WelcomeDialog(props) {
    const [isOpen, setIsOpen] = useState(false);

    console.log(isOpen);

    const { Dialog } = inkdrop.components.classes;

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
        <Dialog visible={isOpen} onBackdropClick={() => setIsOpen(false)}>
            <Dialog.Title>Welcome!</Dialog.Title>
            <Dialog.Content>InkdropSettingsSync was toggled!</Dialog.Content>
            <Dialog.Actions>
                <button className="ui button" onClick={() => setIsOpen(false)}>
                    Close
                </button>
            </Dialog.Actions>
        </Dialog>
    );
}
