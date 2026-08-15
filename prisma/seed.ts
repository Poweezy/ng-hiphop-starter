import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding NG Hip Hop Platform...');

    // Create default slogan
    await prisma.slogan.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            text: 'Built From Bars. Raised By Beats.',
        },
    });
    console.log('✅ Slogan seeded');

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail) {
        throw new Error('ADMIN_EMAIL environment variable is required');
    }
    if (!adminPassword) {
        throw new Error('ADMIN_PASSWORD environment variable is required');
    }

    const password_hash = await bcrypt.hash(adminPassword, 12);

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password_hash,
            role: 'ADMIN',
        },
    });
    console.log(`✅ Admin user seeded: ${adminEmail}`);

    // Seed sample lyric game entries (only on first run)
    const lyricCount = await prisma.lyricGame.count();
    if (lyricCount === 0) {
        await prisma.lyricGame.createMany({
            data: [
                {
                    lyric_text: "I be the nearest, I be the furthest, I be the truest",
                    correct_artist: 'Sarkodie',
                    is_active: true,
                },
                {
                    lyric_text: "Ye dbe3 s3 me nfa wo ho a, wo nso nfa wo ho",
                    correct_artist: 'M.anifest',
                    is_active: true,
                },
                {
                    lyric_text: "Sho Madjozi in the building, John Cena",
                    correct_artist: 'Sho Madjozi',
                    is_active: true,
                },
                {
                    lyric_text: "Gbese Gbese, I carry your load",
                    correct_artist: 'Falz',
                    is_active: true,
                },
            ],
        });
        console.log('✅ Lyric game entries seeded');
    } else {
        console.log('✅ Lyric game entries already present, skipping');
    }

    // Create default song (idempotent upsert)
    await prisma.song.upsert({
        where: { id: 'seed-default-song' },
        update: {},
        create: {
            id: 'seed-default-song',
            title: 'First Light',
            description: 'The opening chapter of the NG vault — where bars meet beats and the culture speaks first.',
            file_url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
            cover_url: '/images/cover.png',
            is_active: true,
        },
    });
    console.log('✅ Default song seeded');

    console.log('🎵 Seed complete!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
