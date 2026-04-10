/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'open.spotify.com',
            },
            {
                protocol: 'https',
                hostname: 'music.apple.com',
            },
            {
                protocol: 'https',
                hostname: 'actions.google.com',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
        ],
    },
};

module.exports = nextConfig;