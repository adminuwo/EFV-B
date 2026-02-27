const axios = require("axios");

// global token
global.nimbusToken = "";

// login function
async function generateNimbusToken() {
  try {
    const response = await axios.post(
      "https://api.nimbuspost.com/v1/users/login",
      {
        email: process.env.NIMBUS_EMAIL,
        password: process.env.NIMBUS_PASSWORD,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    global.nimbusToken = response.data.data;

    console.log("✅ Nimbus Token Generated Successfully");
    console.log(global.nimbusToken);

  } catch (error) {
    console.log("❌ Nimbus Login Error:", error.response?.data || error.message);
  }
}

module.exports = generateNimbusToken;