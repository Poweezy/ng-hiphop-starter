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
        ],
    },
};

module.exports = nextConfig;