import express from "express";
import User from "../models/user";
import { sendConfirmationEmail } from "../mailer";

const router = express.Router();

router.post("/", async function (req, res) {
  const { username, email, firstName, lastName, password } = req.body.user;

  try {
    const uniqueError = {};

    let user = await User.findOne({ email });
    user ? (uniqueError.email = "Email already exists") : null;

    user = await User.findOne({ username });
    user ? (uniqueError.username = "Username already exists") : null;

    if (!!Object.keys(uniqueError).length) {
      res.status(400).json({ error: uniqueError });
    } else {
      const user = await new User({ email, username, firstName, lastName });
      await user.setPassword(password);
      await user.setConfirmationToken();
      await user
        .save()
        .then((user) => {
          sendConfirmationEmail(user);
          res.json({ user: user.toAuthJSON() });
        })
        .catch((error) => res.status(400).json(error));
    }
  } catch (e) {
    await res
      .status(500)
      .json({ error: { global: "Error. Something went wrong..." } });
  }
});

export default router;
