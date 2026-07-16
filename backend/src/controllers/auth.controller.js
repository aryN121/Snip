import * as authService from "../services/auth.service.js";
import { setRefreshCookie } from "../utils/jwt.js";


export const register = async (req, res , next) => {
    try {
      const result = await authService.registerUser(req.body);
      setRefreshCookie(res, result.refreshToken);

      res.status(201).json({
        accessToken:result.accessToken,
        user:result.user,
      });
    } catch (err){
      next(err);
    }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);

    setRefreshCookie(res, result.refreshToken);

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshUserToken(
      req.cookies.refresh_token
    );

    setRefreshCookie(res, result.refreshToken);

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res , next) => {
  await authService.logoutUser(req.cookies.refresh_token);

  res.clearCookie("refresh_token", {
    path: "/api/auth",
  });

  res.json({
    message: "Logged out",
  });
};
export const me = async (req, res ,next) => {
   try {
      const user = await authService.getCurrentUser(req.user.sub);
        res.json(user);
    } catch (err) {
        next(err);
    }
};
export const googleLogin = (req, res , next) => {
      try {
        const url = authService.getGoogleAuthUrl();
         res.redirect(url);
      } catch(err){
        next(err);
      }
};

export const googleCallback = async (req, res , next) => {

  const {code , error} = req.query;

  if(error || !code){
    return res.redirect("/?auth=error");
  }

  try {
      const result = await authService.loginWithGoogle(code);

      setRefreshCookie( res , result.refreshToken);
       res.redirect(
            `/?token=${result.accessToken}`
        );

    } catch (err) {
        next(err);
    }

};