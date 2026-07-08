'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

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
            // Optimize image server-side first
            const formData = new FormData();
            formData.append('image', file);
            formData.append('folder', 'graffiti');

            const optimizeRes = await fetch('/api/uploads/optimize', { method: 'POST', body: formData });
            if (!optimizeRes.ok) {
                const err = await optimizeRes.json();
                setMessage(err.message || 'Upload failed');
                setSubmitting(false);
                return;
            }
            const { url: imageUrl } = await optimizeRes.json();

            // Submit graffiti with optimized image URL
            const res = await fetch('/api/graffiti', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl, artistName }),
            });
            const data = await res.json();
            setMessage(data.message);
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
            <div className="container">
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
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        key="lightbox"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="graffiti-modal-content graffiti-lightbox"
                        >
                            <Image
                                src={selectedImage}
                                alt="Graffiti large view"
                                width={1200}
                                height={800}
                                style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                            />
                            <button className="close-btn" onClick={() => setSelectedImage(null)}>✕</button>
                        </motion.div>
                    </motion.div>
                )}

                {showSubmit && (
                    <motion.div
                        key="submit-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            id="graffiti-form-modal"
                            className="graffiti-modal-content"
                            style={{ width: '440px', maxWidth: '92vw', margin: 'auto' }}
                        >
                            <div className="form-header">
                                <h3 className="modal-title">Tag the Wall</h3>
                                <button onClick={() => setShowSubmit(false)} className="close-btn-text">Cancel</button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="tag-form">
                                <div className="input-group">
                                    <label>Artist Name</label>
                                    <input
                                        type="text"
                                        placeholder="Your Tag..."
                                        value={artistName}
                                        onChange={(e) => setArtistName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Artwork File</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={submitting} className="btn btn-primary full-width">
                                    {submitting ? 'Uploading...' : 'Submit Tag'}
                                </button>
                                {message && <p className={`form-message ${message.includes('error') ? 'error' : 'success'}`}>{message}</p>}
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .graffiti-section {
                    background: #08080c;
                    position: relative;
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
                    color: rgba(255, 255, 255, 0.4);
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
                    color: rgba(255, 255, 255, 0.35);
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

                .tag-form input[type="text"]:focus {
                    border-color: var(--color-purple);
                    background: rgba(139, 92, 246, 0.05);
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                }

                .tag-form input[type="file"] {
                    padding: 8px 12px;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.4);
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
