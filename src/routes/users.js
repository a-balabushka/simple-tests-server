import express from "express";
import User from "../models/user";

const router = express.Router();

router.post("/", (req, res) => {
  const { email, password } = req.body.user;
  const user = new User({ email });
  user.setPassword(password);
  user
    .save()
    .then((user) => res.json({ user: user.toAuthJSON() }))
    .catch((error) => res.status(400).json({ error }));
});

export default router;
