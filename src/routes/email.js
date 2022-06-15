const Email = require("../models").Email;
const Queue = require("bull");
const logger = require("../../utils/logger");
const client = require("../../utils/redis_connect");
require("dotenv").config();
var cron = require("node-cron");
const transporter = require("../../utils/sendMail").transporter;

async function sendMails(req, res) {
  if (!req.body.from || !req.body.to) {
    res.status(400).send({ msg: "Please pass email address" });
  } else {
    Email.create({
      from: req.body.from,
      to: req.body.to,
      subject: req.body.subject,
      body: req.body.body,
    })
      .then((email) => {
        res.status(201).send(email);
        const sendMailQueue = new Queue("sendMail");

        const data = {
          sender: req.body.from,
          receiver: req.body.to,
          subject: req.body.subject,
          body: req.body.body,
        };

        const options = {
          delay: 60000, // 1 min in ms
          attempts: 2,
        };

        sendMailQueue.add(data, options);
        cron.schedule("0 0 * * *", function () {
          sendMailQueue.process(async (job) => {
            return await sendMail(
              job.data.sender,
              job.data.receiver,
              job.data.subject,
              job.data.body
            );
          });
        });
      })
      .catch((error) => {
        logger.error(error);
        res.status(400).send(error);
      });
  }
}

async function getMails(req, res) {
  Email.findAll()
    .then(async (emails) => {
      const reply = await client.get("email");
      if (reply) {
        logger.info("using cached data");
        // res.status(200).send(techs);
        logger.info(reply);
        res.send(JSON.parse(reply));
        return;
      }

      const saveResult = await client.setEx(
        "email",
        30,
        JSON.stringify(emails)
      );

      logger.info(`new data cached ${saveResult}`);
      res.status(200).send(emails);
    })
    .catch((error) => {
      res.status(400).send(error);
    });
}

function sendMail(sender, receiver, subject, body) {
  return new Promise((resolve, reject) => {
    let mailOptions = {
      from: sender,
      to: receiver,
      subject: subject,
      html: `<h1>${body}</h1>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        logger.info(JSON.stringify(info, null, 3));
        resolve(info);
      }
    });
  });
}

module.exports = {
  getMails,
  sendMails,
};
