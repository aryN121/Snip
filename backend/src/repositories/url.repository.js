
import prisma from "../config/prisma.js"

export const findByCode = async (code) => {
    return prisma.url.findUnique({
        where : { shortCode :  code,},
    });
};

export const findByUrlAndUser = async (url, userId) => {
    return prisma.url.findFirst({
        where : { original : url , userId ,},
    });
};

export const create = async ({
  userId,
  shortCode,
  originalUrl,
  customSlug,
}) => {
  return prisma.url.create({
    data: {
      userId,
      shortCode,
      original: originalUrl,
      customSlug,
    },
  });
};

export const getByUser = async (userId) => {
  return prisma.url.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },

    take:100
  });
};

export const searchByUser = async (userId, search) => {
  return prisma.url.findMany({
    where: {
      userId,
      OR: [
        {
          original: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          shortCode: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },

    take:100
  });
};

export const deleteByCode = async (code, userId) => {
  return prisma.url.deleteMany({
    where: {
      shortCode: code,
      userId,
    },
  });
};

export const incrementClick = async (code) => {
  return prisma.url.update({
    where: {
      shortCode: code,
    },
    data: {
      clicks: {
        increment: 1,
      },
    },
  });
};
export const logClick = async (code, referrer, userAgent) => {
  return prisma.click.create({
    data: {
      referrer,
      userAgent,
      url: {
        connect: {
          shortCode: code,
        },
      },
    },
  });
};

export const getStats = async (code, userId) => {
  return prisma.url.findFirst({
    where: {
      shortCode: code,
      userId,
    },
    include: {
      clickHistory: true,
    },
  });
};

export const getClicksOverTime = async (code) => {
  return prisma.click.findMany({
    where: {
      url: {
        shortCode: code,
      },
    },
    orderBy: {
      clickedAt: "asc",
    },

    take:100
  });
};