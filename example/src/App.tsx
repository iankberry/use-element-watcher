import React from "react";
import { useElementWatcher } from "../../src";

export const App = () => {
    const [step, setStep] = React.useState(1);
    const { watchElement } = useElementWatcher();

    watchElement(".first-step", {
        onWatch: (element) => {
            element.style.backgroundColor = "red";
        }
    });

    watchElement(".second-step", {
        onWatch: (element) => {
            element.style.backgroundColor = "teal";
        }
    });

    watchElement(".third-step", {
        onWatch: (element) => {
            element.style.backgroundColor = "green";
        }
    });

    return (
        <div className="container">
            {step === 1 && <div className="first-step">First step!</div>}
            {step === 2 && <div className="second-step">Second step!</div>}
            {step === 3 && <div className="third-step">Third step!</div>}

            <button
                onClick={() => setStep((step) => (step >= 3 ? 1 : step + 1))}
                style={{ marginTop: "20px" }}
            >
                Next step
            </button>
        </div>
    );
}
