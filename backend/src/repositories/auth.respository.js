
import prisma from "../config/prisma.js";

export const findUserByEmail = async (email) => {
    return prisma.user.findUnique({
        where : {email},
    });
};

export const findUserById = async (id) => {
    return prisma.user.findUnique({
        where : { id },
    })
};

export const createUser = async ({
    email,
    passwordHash,
    name,
    provider,
}) => {
    return prisma.user.create({
        data : {email , passwordHash, name, provider}
    });
};

export const findRefreshToken = async (hash) => {
     return prisma.refreshToken.findUnique({
        where : {tokenHash : hash}
    });
};

export const deleteRefreshToken = async (hash) => {
    return prisma.refreshToken.deleteMany({
        where : {tokenHash : hash}
    });
};

export const findUserByGoogle = async (googleId) => {
    return prisma.user.findUnique({
        where :{googleId ,}
    })
};

export const updateGoogleUser = async ({
  googleId,
  picture,
  email,
}) => {
  return prisma.user.update({
    where: { email,
    },
    data: {
     googleId,
      avatar: picture,
      provider : "google",
    },
  });
};

export const createOAuthUser = async ({
  email,
  name,
  picture,
  googleId,
}) => {
  return prisma.user.create({
    data: {
      email,
      name,
      avatar: picture,
      googleId,
      provider: "google",
    },
  });
};