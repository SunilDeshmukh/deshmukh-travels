// Only job: run database queries for users. No business logic here.
const prisma = require('../lib/prisma');

const safeSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    createdAt: true
};

// Find a user by email — used in auth (login + register check)
const findByEmail = async (email) => {
    return prisma.user.findUnique({ where: {email}});
};

