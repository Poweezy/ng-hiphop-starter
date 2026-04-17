"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, AnimatePresence } from 'framer-motion';

export default function CustomCursor() {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [hoverText, setHoverText] = useState("");

    const cursorX = useSpring(0, { stiffness: 400, damping: 28, mass: 0.5 });
    const cursorY = useSpring(0, { stiffness: 400, damping: 28, mass: 0.5 });
    
    // Secondary outer ring for trailing effect
    const cursorX2 = useSpring(0, { stiffness: 150, damping: 25, mass: 1 });
    const cursorY2 = useSpring(0, { stiffness: 150, damping: 25, mass: 1 });

    useEffect(() => {
        // Only show on desktop (coarse pointers like touch screens shouldn't have custom cursor)
        if (window.matchMedia("(pointer: coarse)").matches) return;

        setIsVisible(true);
        // Hide default cursor
        document.body.style.cursor = 'none';

        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX - 6);
            cursorY.set(e.clientY - 6);
            cursorX2.set(e.clientX - 20);
            cursorY2.set(e.clientY - 20);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            
            // Check if hovering over clickable elements
            const isClickable = !!target.closest('a, button, input, [role="button"]');
            
            if (isClickable) {
                setIsHovering(true);
                // Can detect specific classes to change text
                if (target.closest('.play-btn') || target.closest('audio')) {
                    setHoverText("PLAY");
                } else if (target.closest('.graffiti-card')) {
                    setHoverText("ZOOM");
                } else {
                    setHoverText("");
                }
            } else {
                setIsHovering(false);
                setHoverText("");
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
            document.body.style.cursor = '';
        };
    }, [cursorX, cursorY, cursorX2, cursorY2]);

    if (!isVisible) return null;

    return (
        <>
            {/* Inner Dot */}
            <motion.div
                className="cursor-dot"
                style={{
                    x: cursorX,
                    y: cursorY,
                }}
            />

            {/* Outer Ring */}
            <motion.div
                className="cursor-ring"
                animate={{
                    scale: isHovering ? 1.5 : 1,
                    backgroundColor: isHovering ? "rgba(139, 92, 246, 0.1)" : "transparent",
                    borderColor: isHovering ? "rgba(168, 85, 247, 0.4)" : "rgba(168, 85, 247, 0.8)",
                }}
                style={{
                    x: cursorX2,
                    y: cursorY2,
                }}
            >
                {/* Dynamically show text inside the ring if applicable */}
                <AnimatePresence>
                    {hoverText && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="cursor-text"
                        >
                            {hoverText}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.div>

            <style jsx global>{`
                /* Hide cursor on all clickable elements too, since we apply it globally to body */
                body, a, button, input, [role="button"] {
                    cursor: none !important;
                }

                .cursor-dot {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 12px;
                    height: 12px;
                    background: var(--color-purple);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 10000;
                    box-shadow: 0 0 10px var(--color-purple);
                }

                .cursor-ring {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 40px;
                    height: 40px;
                    border: 1.5px solid var(--color-purple);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: border-color 0.2s, background-color 0.2s;
                    backdrop-filter: blur(2px);
                }
                
                .cursor-text {
                    font-size: 8px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    color: white;
                }
            `}</style>
        </>
    );
}
