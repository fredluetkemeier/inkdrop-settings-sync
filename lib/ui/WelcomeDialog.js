"use babel";

import React, { useEffect, useState } from "react";

const STEPS = {
    Welcome: "Welcome",
    GithubAuth: "GithubAuth",
};

export default function WelcomeDialog(props) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(STEPS.Welcome);

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

    const handleNext = () => {
        const nextStep = getNextStep(step);
        setStep(nextStep);
    };

    return (
        <Dialog
            className="large"
            visible={isOpen}
            onBackdropClick={() => setIsOpen(false)}
        >
            <Dialog.Title>Settings Sync</Dialog.Title>
            <Dialog.Content>
                <Step step={step} />
            </Dialog.Content>
            <Dialog.Actions>
                <button className="ui button" onClick={handleNext}>
                    <span>Next</span>
                </button>
            </Dialog.Actions>
        </Dialog>
    );
}

function getNextStep(currentStep) {
    switch (currentStep) {
        case STEPS.Welcome:
            return STEPS.GithubAuth;
        default:
            return STEPS.Welcome;
    }
}

function Step({ step }) {
    switch (step) {
        case STEPS.Welcome:
            return <Welcome />;
        case STEPS.GithubAuth:
            return <GithubAuth />;
        default:
            return <Welcome />;
    }
}

function Welcome() {
    return (
        <div>
            <p>Let's get you signed into GitHub.</p>
            <p>
                <strong>Settings Sync</strong> uses a GitHub Gist to store your
                settings files.
            </p>
        </div>
    );
}

function GithubAuth() {
    return <div className="settings-sync-auth-container"></div>;
}
