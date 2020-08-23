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
    await res.status(500).json({ error: { global: "Error. Something went wrong..." } } );
  }
});

router.post("/confirmation", (req, res) => {
  const { token } = req.body;
  User.findOneAndUpdate(
    { confirmationToken: token },
    { confirmationToken: "", confirmed: true },
    { new: true }
  ).then((user) =>
    user ? res.json({ user: user.toAuthJSON() }) : res.status(400).json({})
  );
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

router.post("/validate_token", (req, res) => {
  const { token } = req.body;
  jwt.verify(token, process.env.JWT_SECRET, (err) => {
    if (err) {
      res.status(401).json({});
    } else {
      res.json({});
    }
  });
});

router.post("/reset_password", (req, res) => {
  const { password, token } = req.body.data;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({ errors: { global: "Invalid token" } });
    } else {
      User.findOne({ _id: decoded._id }).then((user) => {
        if (user) {
          user.setPassword(password);
          user.save().then(() => res.json({}));
        } else {
          res.status(404).json({ errors: { global: "Invalid token" } });
        }
      });
    }
  });
});

export default router;
