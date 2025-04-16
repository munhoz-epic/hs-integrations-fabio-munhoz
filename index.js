require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

const hubspotApiKey = process.env.HUBSPOT_API_KEY;
const hubspotBaseUrl = "https://api.hubapi.com";

const propertyList = ["name", "description", "status"];

app.get("/", async (req, res) => {
  try {
    const listResponse = await axios.get(
      `${hubspotBaseUrl}/crm/v3/objects/${process.env.CUSTOM_OBJECT_TYPE}`,
      {
        headers: {
          Authorization: `Bearer ${hubspotApiKey}`,
          "Content-Type": "application/json",
        },
        params: {
          limit: 100,
        },
      }
    );
    console.log(
      "List API Response:",
      JSON.stringify(listResponse.data, null, 2)
    );

    const records = listResponse.data.results || [];
    const inputs = records.map((record) => ({ id: record.id }));

    const batchPayload = {
      properties: propertyList,
      inputs: inputs,
    };

    const batchResponse = await axios.post(
      `${hubspotBaseUrl}/crm/v3/objects/${process.env.CUSTOM_OBJECT_TYPE}/batch/read`,
      batchPayload,
      {
        headers: {
          Authorization: `Bearer ${hubspotApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "Batch API Response:",
      JSON.stringify(batchResponse.data, null, 2)
    );

    const objects = batchResponse.data.results || [];

    res.render("homepage", {
      title: "Special Coffees! | HubSpot Integration",
      objects,
    });
  } catch (error) {
    console.error(
      "Error fetching custom objects:",
      error.response?.data || error
    );
    res.render("homepage", {
      title: "Special Coffees! | HubSpot Integration",
      objects: [],
      error: "Failed to fetch custom objects",
    });
  }
});

app.get("/update-cobj", (req, res) => {
  res.render("updates", {
    title: "Update Coffee List | Integrating With HubSpot I Practicum",
  });
});

app.post("/update-cobj", async (req, res) => {
  try {
    const { name, description, status } = req.body;
    console.log("Creating custom object with properties:", {
      name,
      description,
      status,
    });

    const response = await axios.post(
      `${hubspotBaseUrl}/crm/v3/objects/${process.env.CUSTOM_OBJECT_TYPE}`,
      {
        properties: {
          name,
          description,
          status,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${hubspotApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "Custom object created successfully:",
      JSON.stringify(response.data, null, 2)
    );
    res.redirect("/");
  } catch (error) {
    console.error(
      "Error creating custom object:",
      error.response?.data || error
    );
    res.render("updates", {
      title: "Update Coffee List | Integrating With HubSpot I Practicum",
      error: "Failed to create custom object",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
