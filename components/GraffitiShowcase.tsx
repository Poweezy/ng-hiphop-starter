'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import Modal from './Modal';

interface Graffiti {
    id: string;
    image_url: string;
    artist_name: string;
}

interface GraffitiShowcaseProps {
    graffiti: Graffiti[];
}

function GraffitiCardComponent({ piece, onClick }: { piece: Graffiti, onClick: () => void }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-150, 150], [10, -10]);
    const rotateY = useTransform(x, [-150, 150], [-10, 10]);

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(e.clientX - centerX);
        y.set(e.clientY - centerY);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    }

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
            }}
            className="graffiti-card"
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`View graffiti by ${piece.artist_name}`}
        >
            <div className="card-image-wrapper">
                <Image
                    src={piece.image_url}
                    alt={`Graffiti by ${piece.artist_name}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="graffiti-image"
                />
                <div className="card-overlay" style={{ transform: "translateZ(30px)" }}>
                    <p className="artist-tag">Artist: {piece.artist_name}</p>
                    <span className="view-text">View Large</span>
                </div>
            </div>
        </motion.div>
    );
}

export default function GraffitiShowcase({ graffiti = [] }: GraffitiShowcaseProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showSubmit, setShowSubmit] = useState(false);
    const [artistName, setArtistName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const mountedRef = useRef(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !artistName) return;

        setSubmitting(true);
        try {
            // Submit the artwork directly; the API scans + optimizes server-side.
            const formData = new FormData();
            formData.append('image', file);
            formData.append('artistName', artistName);

            const res = await fetch('/api/graffiti', { method: 'POST', body: formData });
            const data = await res.json();
            setMessage(res.ok ? 'Thanks! Your tag is pending approval.' : (data.error?.message || 'Upload failed'));
            if (res.ok) {
                setArtistName('');
                setFile(null);
                if (mountedRef.current) {
                    setTimeout(() => {
                        setShowSubmit(false);
                        setMessage('');
                    }, 1500);
                }
            }
        } catch {
            setMessage('Something went wrong');
        } finally {
            if (mountedRef.current) {
                setSubmitting(false);
            }
        }
    };

    useEffect(() => () => { mountedRef.current = false; }, []);

    return (
        <section id="graffiti" className="section graffiti-section">
            <div className="graffiti-bg-blur" aria-hidden="true" />
            <div className="graffiti-bg-overlay" aria-hidden="true" />
            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                <div className="section-header">
                    <div>
                        <div className="section-badge">Gallery</div>
                        <h2 className="section-title">Graffiti Wall</h2>
                        <p className="section-subtitle">Urban art from the NG community.</p>
                    </div>
                    <button onClick={() => setShowSubmit(true)} className="btn btn-primary submit-btn">
                        <span>✍️</span> Tag the Wall
                    </button>
                </div>

                {graffiti.length > 0 ? (
                    <motion.div 
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: { staggerChildren: 0.1 }
                            }
                        }}
                        className="graffiti-grid"
                    >
                        {graffiti.map((piece) => (
                            <GraffitiCardComponent
                                key={piece.id}
                                piece={piece}
                                onClick={() => setSelectedImage(piece.image_url)}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <div className="empty-wall">
                        <p>The wall is empty. Be the first to tag it!</p>
                    </div>
                )}
            </div>

            {/* Lightbox / Modal */}
            <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} titleId="graffiti-lightbox-title">
                <Image
                    src={selectedImage!}
                    alt="Graffiti large view"
                    width={1200}
                    height={800}
                    style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                />
                <button className="close-btn" onClick={() => setSelectedImage(null)} aria-label="Close image preview">✕</button>
            </Modal>

            {showSubmit && (
                <Modal isOpen={showSubmit} onClose={() => setShowSubmit(false)} titleId="graffiti-form-title">
                    <div className="form-header">
                        <h3 className="modal-title" id="graffiti-form-title">Tag the Wall</h3>
                        <button onClick={() => setShowSubmit(false)} className="close-btn-text">Cancel</button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="tag-form">
                        <div className="input-group">
                            <label htmlFor="graffiti-artist-name">Artist Name</label>
                            <input
                                id="graffiti-artist-name"
                                type="text"
                                placeholder="Your Tag..."
                                value={artistName}
                                onChange={(e) => setArtistName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="graffiti-artwork-file">Artwork File</label>
                            <input
                                id="graffiti-artwork-file"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                required
                            />
                        </div>
                        <button type="submit" disabled={submitting} className="btn btn-primary full-width">
                            {submitting ? 'Uploading...' : 'Submit Tag'}
                        </button>
                        <div role="status" aria-live="polite">
                            {message && <p className={`form-message ${message.includes('error') ? 'error' : 'success'}`}>{message}</p>}
                        </div>
                    </form>
                </Modal>
            )}

            <style jsx>{`
                .graffiti-section {
                    background: var(--color-black);
                    position: relative;
                    overflow: hidden;
                }

                .graffiti-bg-blur {
                    position: absolute;
                    inset: -50px;
                    background-image: url('/images/gallery section.png');
                    background-size: cover;
                    background-position: center;
                    filter: blur(25px) saturate(1.2);
                    opacity: 0.55;
                    pointer-events: none;
                    z-index: 1;
                }

                .graffiti-bg-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(3,3,5,0.85) 0%, rgba(3,3,5,0.95) 100%);
                    z-index: 2;
                    pointer-events: none;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 60px;
                    gap: 24px;
                }

                @media (max-width: 640px) {
                    .section-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }

                .submit-btn {
                    padding: 12px 32px;
                    transition: all 0.3s ease;
                }

                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
                }

                .submit-btn:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
                }

                .graffiti-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 32px;
                    perspective: 1000px;
                }

                .graffiti-card {
                    cursor: pointer;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 20px;
                    padding: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(16px);
                }

                .graffiti-card:hover {
                    border-color: rgba(139, 92, 246, 0.3);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(139, 92, 246, 0.15);
                    transform: translateY(-8px);
                }

                .graffiti-card:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
                    border-color: rgba(139, 92, 246, 0.5);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(139, 92, 246, 0.25);
                }

                .card-image-wrapper {
                    position: relative;
                    aspect-ratio: 4/3;
                    border-radius: 14px;
                    overflow: hidden;
                }

                .card-image-wrapper :global(.graffiti-image) {
                    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .graffiti-card:hover :global(.graffiti-image) {
                    transform: scale(1.1);
                }

                .card-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(10,10,15,0.9) 0%, rgba(10,10,15,0.2) 60%, transparent 100%);
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 24px;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .graffiti-card:hover .card-overlay {
                    opacity: 1;
                    transform: translateY(0);
                }

                .artist-tag {
                    color: var(--color-purple-light);
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin-bottom: 4px;
                }

                .view-text {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .empty-wall {
                    text-align: center;
                    padding: 120px 40px;
                    color: rgba(255, 255, 255, 0.55);
                    border: 1px dashed rgba(255, 255, 255, 0.1);
                    border-radius: 40px;
                    background: rgba(255, 255, 255, 0.01);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 24px;
                }

                .empty-wall p {
                    font-size: 1.1rem;
                    font-weight: 500;
                    max-width: 300px;
                    line-height: 1.5;
                }

                /* Modals - Base */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    backdrop-filter: blur(12px);
                }

                .graffiti-modal-content {
                    background: rgba(10, 10, 15, 0.6);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 28px;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
                    margin: auto;
                    display: block;
                }

                /* Lightbox - For viewing images */
                .graffiti-modal-content.graffiti-lightbox {
                    max-width: 900px;
                    width: 100%;
                    background: transparent;
                    border: none;
                    box-shadow: none;
                    overflow: visible;
                }

                /* Tag the Wall - Definitive ID-based fix for proportion */
                #graffiti-form-modal {
                    padding: 40px 32px;
                    border-radius: 32px;
                    display: flex;
                    flex-direction: column;
                    background: rgba(13, 13, 20, 0.8);
                    backdrop-filter: blur(40px);
                    box-shadow: 0 40px 120px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(139, 92, 246, 0.1);
                    border: 1px solid rgba(139, 92, 246, 0.3);
                }

                .form-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    width: 100%;
                }

                .modal-title {
                    font-family: var(--font-cursive);
                    font-size: 1.4rem;
                    color: var(--color-white);
                    margin: 0;
                }

                .close-btn {
                    position: absolute;
                    top: -36px;
                    right: 0;
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 1.2rem;
                    cursor: pointer;
                    transition: color 0.2s;
                }

                .close-btn:hover {
                    color: white;
                }

                .close-btn-text {
                    background: none;
                    border: none;
                    color: rgba(139, 92, 246, 0.6);
                    cursor: pointer;
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    transition: all 0.2s;
                    padding: 4px 8px;
                    border-radius: 4px;
                }

                .close-btn-text:hover {
                    color: var(--color-purple-light);
                    background: rgba(139, 92, 246, 0.1);
                }

                .tag-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    width: 100%;
                }

                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .input-group label {
                    display: block;
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    color: rgba(255, 255, 255, 0.55);
                }

                .tag-form input[type="text"],
                .tag-form input[type="file"] {
                    width: 100%;
                    padding: 11px 14px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 10px;
                    color: white;
                    font-size: 0.9rem;
                    outline: none;
                    transition: all 0.2s;
                }

                .tag-form input[type="text"]:focus,
                .tag-form input[type="file"]:focus {
                    border-color: var(--color-purple);
                    background: rgba(139, 92, 246, 0.05);
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                }

                .tag-form input[type="text"]:focus-visible,
                .tag-form input[type="file"]:focus-visible {
                    outline: 2px solid var(--color-purple);
                    outline-offset: 2px;
                }

                .tag-form input[type="file"] {
                    padding: 8px 12px;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.55);
                    cursor: pointer;
                }

                .form-message {
                    text-align: center;
                    font-size: 0.8rem;
                    padding: 8px 12px;
                    border-radius: 8px;
                    margin-top: 4px;
                }

                .form-message.success {
                    color: #10b981;
                    background: rgba(16, 185, 129, 0.08);
                }

                .form-message.error {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.08);
                }

                .full-width {
                    width: 100%;
                    margin-top: 12px;
                    justify-content: center;
                    font-size: 0.9rem;
                    padding: 12px;
                }
            `}</style>
        </section>
    );
}
