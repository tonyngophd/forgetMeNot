var express = require("express");

var router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../db/models");
const { check, validationResult } = require("express-validator");
const { csrfProtection, asyncHandler } = require("../routes/utils");
const { loginUser, logoutUser, requireAuth } = require("../auth");
const { Op } = require("sequelize");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const tags = await db.Tag.findAll();
    res.json({ tags });
  })
);
const tagValidator = [
  check("name")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for tag name")
    .isLength({ max: 20 })
    .withMessage("Tag name must not be more than 20 characters long")
    .custom((value) => !/\s/.test(value))
    .withMessage("No spaces are allowed in the tag name")
    .custom((value) => {
      return db.Tag.findOne({ where: { name: value } }).then((tag) => {
        if (tag) {
          return Promise.reject("The provided tag name already exists");
        }
      });
    }),
];
router.post(
  "/",
  requireAuth,
  // csrfProtection,
  tagValidator,
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    const tag = db.Tag.build({
      name,
    });

    const validatorErrors = validationResult(req);

    if (validatorErrors.isEmpty()) {
      await tag.save();
      const tags = await db.Tag.findAll();
      res.json({ tags });
    } else {
      const errors = validatorErrors.array().map((error) => error.msg);
      res.status(400).json({ errors });
    }
  })
);
router.delete(
  "/:id",
  requireAuth,
  // csrfProtection,
  // tagValidator,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tag = await db.Tag.findOne({
      where: {
        id,
      },
    });
    await tag.destroy();
    res.json({ id });
  })
);

module.exports = router;
