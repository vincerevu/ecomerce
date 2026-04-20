/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "plus.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
            },
            {
                protocol: "https",
                hostname: "buggy.yodycdn.com",
            },
            {
                protocol: "https",
                hostname: "**.yodycdn.com",
            },
            {
                protocol: "http",
                hostname: "localhost",
                port: "8888",
            },
            {
                protocol: "http",
                hostname: "127.0.0.1",
                port: "8888",
            },
        ],
    },
};

module.exports = nextConfig;
