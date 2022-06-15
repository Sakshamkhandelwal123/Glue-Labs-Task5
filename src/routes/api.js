const express = require("express");
const email = require("./email");
const router = express.Router();

router.get("/mails", email.getMails);
router.post("/mails", email.sendMails);

module.exports = router;
