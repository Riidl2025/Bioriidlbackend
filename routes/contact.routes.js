const express = require("express");

const {
  submitContactForm,
  getAllContacts,
} = require("../controllers/contact.controller");

const router = express.Router();

router.post("/", submitContactForm);

router.get("/", getAllContacts);

module.exports = router;