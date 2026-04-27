const express = require("express");

const { recommendRestaurants } = require("../controllers/recommendation.controller");

const router = express.Router();

router.post("/", recommendRestaurants);

module.exports = router;
