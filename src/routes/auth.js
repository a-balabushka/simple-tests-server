import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { sendResetPasswordEmail } from "../mailer";

const router = express.Router();

router.post("/", async function (req, res) {
  const { credentials } = req.body;

  try {
    const user = await User.findOne({ email: credentials.email });
    if (user) {
      (await user.isValidPassword(credentials.password))
        ? await res.json({ user: user.toAuthJSON() })
        : await res
            .status(400)
            .json({ error: { password: "Not correct password" } });
    } else {
      await res
        .status(400)
        .json({ error: { email: "No user with this email" } });
    }
  } catch (e) {
    await res
      .status(500)
      .json({ error: { global: "Error. Something went wrong..." } });
  }
});

router.post("/confirmation", async function (req, res) {
  const { token } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { confirmationToken: token },
      { confirmationToken: "", confirmed: true },
      { new: true }
    );
    user
      ? await res.json({ user: user.toAuthJSON() })
      : await res.status(400).json({ error: { token: "Invalid token" } });
  } catch (e) {
    await res
      .status(500)
      .json({ error: { global: "Error. Something went wrong..." } });
  }
});

router.post("/reset_password_request", async function (req, res) {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      sendResetPasswordEmail(user);
      res.json({});
    } else {
      res.status(400).json({
        errors: {
          global: "There is no user with such email",
        },
      });
    }
  } catch (e) {
    res.status(500).json({
      errors: {
        global: "Server error",
      },
    });
  }
});

router.post("/validate_token", async function (req, res) {
  const { token } = req.body;

  try {
    await jwt.verify(token, process.env.JWT_SECRET, async function (err) {
      err
        ? await res.status(401).json({ error: { global: "Invalid token" } })
        : await res.json({});
    });
  } catch (e) {
    await res
      .status(500)
      .json({ error: { global: "Error. Something went wrong..." } });
  }
});

router.post("/reset_password", async function (req, res) {
  const { password, token } = req.body.data;

  try {
    await jwt.verify(token, process.env.JWT_SECRET, async function (
      err,
      decoded
    ) {
      if (err) {
        await res.status(401).json({ error: { global: "Invalid token" } });
      } else {
        const user = await User.findOne({ _id: decoded._id });
        if (user) {
          await user.setPassword(password);
          await user.save();
          await res.json({});
        } else {
          await res.status(404).json({ error: { global: "Invalid token" } });
        }
      }
    });
  } catch (e) {
    await res
      .status(500)
      .json({ error: { global: "Error. Something went wrong..." } });
  }
});

export default router;
