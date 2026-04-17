"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Prevent scrolling while splash is visible
        document.body.style.overflow = 'hidden';
        
        const timeout = setTimeout(() => {
            setIsVisible(false);
            document.body.style.overflow = '';
        }, 2200);

        return () => {
            clearTimeout(timeout);
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="splash-container"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, filter: 'blur(20px)' }}
                        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                        exit={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="splash-logo"
                    >
                        NG
                    </motion.div>
                    
                    <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1.8, ease: "easeInOut" }}
                        className="splash-progress" 
                    />

                    <style jsx>{`
                        .splash-container {
                            position: fixed;
                            inset: 0;
                            z-index: 9999;
                            background: #030305;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            backdrop-filter: blur(40px);
                            -webkit-backdrop-filter: blur(40px);
                        }

                        .splash-logo {
                            font-family: var(--font-cursive);
                            font-size: clamp(6rem, 15vw, 10rem);
                            font-weight: 800;
                            background: linear-gradient(135deg, var(--color-purple-light), var(--color-accent));
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            filter: drop-shadow(0 0 50px rgba(139, 92, 246, 0.8));
                        }

                        .splash-progress {
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            height: 2px;
                            background: linear-gradient(90deg, transparent, var(--color-purple), transparent);
                            transform-origin: center;
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
