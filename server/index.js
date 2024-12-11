import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { closeConnection, getConnection } from "./utils/Db_connection.js";

const app = express();
const LOGIC_APP_URL =
  "https://prod-49.eastus.logic.azure.com:443/workflows/0f37bde6b36341f4b2d3df230925251c/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=hb9T5V2_9ys2dqfkn6i_Ur0h9PRJ7MVEE4Zh4yKcr4A";
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("Root path");
});

app.get("/getSasUrl", async (req, res) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(
    process.env.AZURE_STORAGE_CONTAINER
  );
  const blobClient = containerClient.getBlobClient(req.query.fileName);

  const sharedKeyCredential = new StorageSharedKeyCredential(
    blobServiceClient.accountName,
    process.env.AZURE_STORAGE_ACCOUNT_KEY
  );

  const sasQueryParameters = generateBlobSASQueryParameters(
    {
      containerName: process.env.AZURE_STORAGE_CONTAINER,
      blobName: req.query.fileName,
      permissions: BlobSASPermissions.parse("w"), // Read permissions
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 86400), // Expires in 24 hours
    },
    sharedKeyCredential
  );

  const sasUrl = blobClient.url + "?" + sasQueryParameters.toString();

  res.json({ sasUrl });
});

app.get("/getListOfLanguages", async (req, res) => {
  let pool = null;
  try {
    pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM LANGUAGE");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    closeConnection();
  }
});

app.get("/getListOfUploadedFiles", async (req, res) => {
  let pool = null;
  try {
    pool = await getConnection();
    const result = await pool
      .request()
      .query(
        "SELECT * FROM INPUT_VIDEO_CONFIGURATION ORDER BY LAST_UPDATED DESC"
      );

    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    closeConnection();
  }
});

app.get("/getTranscriptions", async (req, res) => {
  const { FILEGUID } = req.query;
  let pool = null;
  try {
    pool = await getConnection();
    const result = await pool
      .request()
      .query(
        `SELECT * FROM VIDEO_TRANSCRIPTIONS WHERE FILEGUID = '${FILEGUID}' ORDER BY LAST_UPDATED DESC`
      );
    res.json(result.recordset);
  } catch (err) {
    console.log("err---", err);
    res.status(500).send(err.message);
  } finally {
    closeConnection();
  }
});

function parseTranslationDetails(translationDetails) {
  return translationDetails.map((item) => {
    const { VTTInfo } = item;
    const parsedVTTInfo = JSON.parse(VTTInfo);
    return {
      sequenceNumber: item.SequenceNumber,
      startTime: item?.StartTime
        ? item.StartTime.toISOString().split("T")[1].split(".")[0]
        : "",
      endTime: item?.EndTime
        ? item.EndTime.toISOString().split("T")[1].split(".")[0]
        : "",
      sourceText: parsedVTTInfo?.sourceLocaleText
        ? parsedVTTInfo.sourceLocaleText
        : "",
      score: parsedVTTInfo?.Translation ? parsedVTTInfo.Translation.Score : 0,
      translation: parsedVTTInfo?.Translation || {},
    };
  });
}

app.get("/getTranslationsDetails", async (req, res) => {
  const { fileGUID, offset } = req.query;
  let pool = null;
  try {
    pool = await getConnection();
    const result = await pool.request()
      .query(`SELECT * FROM WebVTT WHERE FileGuid = '${fileGUID}' ORDER BY SequenceNumber ASC OFFSET ${offset} ROWS
    FETCH NEXT 10 ROWS ONLY`);
    const parsedResult = parseTranslationDetails(result.recordset);
    res.json(parsedResult);
  } catch (err) {
    console.log("err---", err);
    res.status(500).send(err.message);
  } finally {
    closeConnection();
  }
});

app.get("/getTranslationsDetailsCount", async (req, res) => {
  const { fileGUID } = req.query;
  let pool = null;
  try {
    pool = await getConnection();
    const result = await pool
      .request()
      .query(`SELECT COUNT(*) FROM WebVTT WHERE FileGuid = '${fileGUID}'`);
    const count = result.recordset[0][""];
    res.json({ totalCount: count });
  } catch (err) {
    console.log("err---", err);
    res.status(500).send(err.message);
  } finally {
    closeConnection();
  }
});

app.post("/createDbRecordForUploadedFile", async (req, res) => {
  // Extract data from the request body
  const { NAME, LANGUAGE, LOCALE, INPUT_URL } = req.body;
  const LAST_UPDATED = new Date();
  let pool = null;
  try {
    pool = await getConnection();
    const result = await pool
      .request()
      .input("NAME", NAME)
      .input("LANGUAGE", LANGUAGE)
      .input("LOCALE", LOCALE)
      .input("INPUT_URL", INPUT_URL)
      .input("LAST_UPDATED", LAST_UPDATED).query(`
        INSERT INTO INPUT_VIDEO_CONFIGURATION (NAME, LANGUAGE, LOCALE, INPUT_URL, LAST_UPDATED)
        VALUES (@NAME, @LANGUAGE, @LOCALE, @INPUT_URL, @LAST_UPDATED)
      `);
    // Send a response back to the client
    res.json({
      message: "DB record for uploaded file created successfully",
      result,
    });
  } catch (error) {
    console.log("error----", error);
    res.status(500).send(error.message);
  } finally {
    // Release the connection pool
    closeConnection();
  }
});

app.post("/initiateTranslation", async (req, res) => {
  // Extract data from the request body
  const {
    FILEGUID,
    NAME,
    SOURCE_LANGUAGE,
    SOURCE_LOCALE,
    TARGET_LANGUAGE,
    TARGET_LOCALE,
    INPUT_URL,
  } = req.body;
  const STATUS = "InProgress";
  const LAST_UPDATED = new Date();
  let pool = null;
  // Make an API call using the request body
  const requestBody = {
    fileGUID: FILEGUID,
    fileName: NAME,
    sourceLocale: SOURCE_LOCALE,
    targetLocale: TARGET_LOCALE,
    reProcess: false,
  };
  try {
    const response = await axios.post(LOGIC_APP_URL, requestBody);
    // Handle the API response
    console.log("Initiate translation response", response);
    if (response) {
      pool = await getConnection();
      const result = await pool
        .request()
        .input("FILEGUID", FILEGUID)
        .input("NAME", NAME)
        .input("SOURCE_LANGUAGE", SOURCE_LANGUAGE)
        .input("SOURCE_LOCALE", SOURCE_LOCALE)
        .input("TARGET_LANGUAGE", TARGET_LANGUAGE)
        .input("TARGET_LOCALE", TARGET_LOCALE)
        .input("INPUT_URL", INPUT_URL)
        .input("STATUS", STATUS)
        .input("START_TIME", LAST_UPDATED)
        .input("LAST_UPDATED", LAST_UPDATED).query(`
              INSERT INTO VIDEO_TRANSCRIPTIONS (FILEGUID, NAME, SOURCE_LANGUAGE, SOURCE_LOCALE, TARGET_LANGUAGE, TARGET_LOCALE, INPUT_URL, STATUS, LAST_UPDATED, START_TIME)
              VALUES (@FILEGUID, @NAME, @SOURCE_LANGUAGE, @SOURCE_LOCALE, @TARGET_LANGUAGE, @TARGET_LOCALE, @INPUT_URL, @STATUS, @LAST_UPDATED, @LAST_UPDATED)
            `);
      if (result) {
        res.json({
          message: "DB record created successfully",
          result,
        });
      } else {
        res.json({
          message: "Failed to create DB record for uploaded file",
          result,
        });
      }
    } else {
      res.json({ message: "Initiate translation is unsuccessful" });
    }
  } catch (error) {
    console.error("API call error:", error);
    res.status(500).send(error.message);
  } finally {
    // Release the connection pool
    closeConnection();
  }
});

app.post("/translationReprocessing", async (req, res) => {
  const { fileGUID } = req.body;
  try {
    // Trigger Logic App
    const response = await axios.post(LOGIC_APP_URL, {
      fileGUID,
      reProcess: true,
    });
    if (response) {
      res.json({
        message: "Logic App triggered successfully",
        data: response?.data,
      });
    } else {
      res.json({ message: "Reprocessing is unsuccessful" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/updateTranslatedText", async (req, res) => {
  // Extract data from the request body
  const { fileGUID, selectedSequence, finalTranslatedText } = req.body;
  const LAST_UPDATED = new Date();
  let pool = null;
  try {
    pool = await getConnection();
    const result = await pool
      .request()
      .input("fileGUID", fileGUID)
      .input("selectedSequence", selectedSequence)
      .input("finalTranslatedText", finalTranslatedText)
      .input("LAST_UPDATED", LAST_UPDATED).query(`
        UPDATE WebVTT
        SET VTTInfo = JSON_MODIFY(VTTInfo, '$.Translation.Final', @finalTranslatedText), ModifiedDate = @LAST_UPDATED
        WHERE FileGuid = @fileGUID AND SequenceNumber = @selectedSequence
      `);
    // Send a response back to the client
    res.json({ message: "Translated text updated successfully", result });
  } catch (error) {
    console.log("error----", error);
    res.status(500).send(error.message);
  } finally {
    // Release the connection pool
    closeConnection();
  }
});

app.listen(port, () => console.log("Server started", port));
