"use client";
import { useState } from 'react';
const RateLimit = () => {
    const [isOpen, setIsOpen] = useState(true);
    const handleClose = () => {
        setIsOpen(false);
    };
    const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
            handleClose();
        }
    };
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 flex items-center justify-center px-4 z-50 backdrop-blur-sm bg-black bg-opacity-50 modal-overlay rate-limit-modal"
            onClick={handleClickOutside}
        >
            <div className="bg-background dark:bg-backgroundsecond p-6 shadow-2xl shadow-black/10 rounded-xl max-w-md mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold dark:text-white text-black">
                        Rate Limit Reached
                    </h2>
                    <button
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        onClick={handleClose}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    You have reached the rate limit for the current period. Please try again soon!
                </p>
            </div>
        </div>
    );
};
export default RateLimit;