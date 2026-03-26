'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface Graffiti {
    id: string;
    image_url: string;
    artist_name: string;
}

interface GraffitiShowcaseProps {
    graffiti: Graffiti[];
}

export default function GraffitiShowcase({ graffiti = [] }: GraffitiShowcaseProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showSubmit, setShowSubmit] = useState(false);
    const [artistName, setArtistName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !artistName) return;

        setSubmitting(true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('artistName', artistName);

        try {
            const res = await fetch('/api/graffiti', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            setMessage(data.message);
            if (res.ok) {
                setArtistName('');
                setFile(null);
                setTimeout(() => {
                    setShowSubmit(false);
                    setMessage('');
                }, 2000);
            }
        } catch (err) {
            setMessage('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

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
                            <motion.div
                                key={piece.id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    show: { opacity: 1, y: 0 }
                                }}
                                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                className="graffiti-card"
                                onClick={() => setSelectedImage(piece.image_url)}
                            >
                                <div className="card-image-wrapper">
                                    <Image
                                        src={piece.image_url}
                                        alt={`Graffiti by ${piece.artist_name}`}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                    <div className="card-overlay">
                                        <p className="artist-tag">Artist: {piece.artist_name}</p>
                                        <span className="view-text">View Large</span>
                                    </div>
                                </div>
                            </motion.div>
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
                            className="modal-content lightbox"
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="modal-content form-modal"
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
                }

                .graffiti-card {
                    cursor: pointer;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 20px;
                    padding: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.3s ease;
                }

                .card-image-wrapper {
                    position: relative;
                    aspect-ratio: 4/3;
                    border-radius: 14px;
                    overflow: hidden;
                }

                .card-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 20px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .graffiti-card:hover .card-overlay {
                    opacity: 1;
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
                    padding: 100px 0;
                    color: rgba(255, 255, 255, 0.3);
                    border: 2px dashed rgba(255, 255, 255, 0.05);
                    border-radius: 30px;
                }

                /* Modals */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    backdrop-filter: blur(10px);
                }

                .modal-content {
                    background: #11111a;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 32px;
                    max-width: 900px;
                    width: 100%;
                    max-height: 90vw;
                    position: relative;
                    box-shadow: 0 50px 100px rgba(0, 0, 0, 0.5);
                }

                .lightbox {
                    background: transparent;
                    border: none;
                }

                .form-modal {
                    max-width: 480px;
                    padding: 40px;
                }

                .form-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                }

                .modal-title {
                    font-family: var(--font-cursive);
                    font-size: 1.8rem;
                    color: var(--color-white);
                }

                .close-btn {
                    position: absolute;
                    top: -40px;
                    right: 0;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                }

                .close-btn-text {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    font-size: 0.9rem;
                }

                .tag-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .input-group label {
                    display: block;
                    font-family: var(--font-condensed);
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: var(--color-grey-blue);
                    margin-bottom: 8px;
                }

                .tag-form input {
                    width: 100%;
                    padding: 14px 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 14px;
                    color: white;
                    outline: none;
                }

                .tag-form input:focus {
                    border-color: var(--color-purple);
                    box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
                }

                .form-message {
                    text-align: center;
                    font-size: 0.9rem;
                }

                .full-width {
                    width: 100%;
                    margin-top: 12px;
                }
            `}</style>
        </section>
    );
}
