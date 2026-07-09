const base = require("../config/airtable");
const sendEmail = require("../utils/sendEmail");

const submitContactForm = async (req, res) => {
  try {

    const { name, email, subject, message, phone } = req.body;

    const record = await base(
      process.env.AIRTABLE_TABLE_NAME
    ).create([
      {
        fields: {
          Name: name,
          Email: email,
          Subject: subject,
          Message: message,
          Phone: phone,
        },
      },
    ]);

    await sendEmail(
      email, name
    );

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("Contact Form Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const records = await base(
      process.env.AIRTABLE_TABLE_NAME
    )
      .select({
        view: "Grid view",
      })
      .all();

    const contacts = records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("Get Contacts Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  submitContactForm,
  getAllContacts,
};