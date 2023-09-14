import { useState, useEffect } from "react";

interface CountdownTimerProps {
    durationInSeconds: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ durationInSeconds }) => {
    const [seconds, setSeconds] = useState(durationInSeconds);
    const [isComplete, setIsComplete] = useState(false);

    const handleCountdownComplete = () => {
        setIsComplete(true);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (seconds > 0) {
                setSeconds((prevSeconds) => prevSeconds - 1);
            }
        }, 1000);

        if (seconds <= 0) {
            clearInterval(interval);
            handleCountdownComplete();
        }

        return () => clearInterval(interval);
    }, [seconds]);

    return (
        isComplete ? (
            <div>Time's up! Please wait a bit until the model run completes.</div>
        ) : (
            <div style={{ fontSize: 28 }}>{seconds}s left</div>
        )
    );
};

export default CountdownTimer;
