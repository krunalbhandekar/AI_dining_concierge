// const fs = require("fs");
// const axios = require("axios");
// const path = require("path");

// const DATA_URL =
//   "https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation/resolve/main/zomato.csv"; // update if needed

// const outputPath = path.resolve(__dirname, "../../../data/zomato.csv");

// async function downloadCSV() {
//   try {
//     // ensure directory exists
//     fs.mkdirSync(path.dirname(outputPath), { recursive: true });

//     const writer = fs.createWriteStream(outputPath);

//     const response = await axios({
//       url: DATA_URL,
//       method: "GET",
//       responseType: "stream",
//     });

//     response.data.pipe(writer);

//     return new Promise((resolve, reject) => {
//       writer.on("finish", () => {
//         console.log("CSV downloaded successfully");
//         resolve();
//       });

//       writer.on("error", (err) => {
//         console.error("Error writing file:", err);
//         reject(err);
//       });
//     });
//   } catch (error) {
//     console.error("Csv Download failed:", error.message);
//   }
// }

// module.exports = { downloadCSV };

const fs = require("fs");
const axios = require("axios");
const path = require("path");

const DATA_URL =
  "https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation/resolve/main/zomato.csv"; // update if needed

const outputPath = path.resolve(__dirname, "../../../data/zomato.csv");

async function downloadCSV() {
  try {
    // ensure directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // delete old file if exists
    if (fs.existsSync(outputPath)) {
      console.log("🗑️ Deleting old CSV...");
      fs.unlinkSync(outputPath);
    }

    const writer = fs.createWriteStream(outputPath);

    const response = await axios({
      url: DATA_URL,
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log("CSV downloaded successfully");
        resolve();
      });

      writer.on("error", (err) => {
        console.error("Error writing file:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Csv Download failed:", error.message);
  }
}

module.exports = { downloadCSV };
