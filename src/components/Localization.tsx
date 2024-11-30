import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./Header";
import LanguageSelection from "./LanguageSelection";
import Loader from "./Loader";

function Localization() {
  const location = useLocation();
  const {
    GUID: FILEGUID,
    NAME: fileName,
    LANGUAGE: SOURCE_LANGUAGE,
    LOCALE: SOURCE_LOCALE,
    INPUT_URL,
  } = location?.state || {};
  const languageRef = useRef<any>();
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const [transcriptions, setTranscriptions] = useState([]);
  const [selectedTranscription, setSelectedTranscription] = useState(-1);
  const [videoUrl, setVideoUrl] = useState("");
  const [fileGUID, setFileGUID] = useState("");
  const [reloadList, setReloadList] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // get transcriptions from server with filename
      try {
        const response = await axios.get(
          "http://localhost:3001/getTranscriptions",
          {
            params: {
              fileName,
            },
          }
        );
        if (response?.data) {
          setTranscriptions(response?.data);
        }
      } catch (error) {
        console.error("Error fetching transcriptions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [reloadList]);

  const onTranscribe = async () => {
    const TARGET_LANGUAGE = languageRef.current.Language;
    const TARGET_LOCALE = languageRef.current.Locale;
    if (!TARGET_LANGUAGE || TARGET_LANGUAGE === "Select Language") {
      toast("Please select a target language");
      return;
    }
    try {
      setIsLoading(true);
      toast("Translations initiated and it will take some time to complete");
      await axios.post("http://localhost:3001/initiateTranslation", {
        FILEGUID,
        NAME: fileName,
        SOURCE_LANGUAGE,
        SOURCE_LOCALE,
        TARGET_LANGUAGE,
        TARGET_LOCALE,
        INPUT_URL,
      });
      setReloadList(!reloadList);
    } catch (error) {
      console.error("Error transcribing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onTranscriptionSelection = (index: number) => {
    setSelectedTranscription(index);
    const transcriptionData: any = transcriptions[index];
    const videoUrl = transcriptionData.OUTPUT_URL;
    const fileGUID = transcriptionData.FILEGUID;
    const status = transcriptionData.STATUS;
    setVideoUrl(videoUrl);
    setFileGUID(fileGUID);
    setTranscriptionStatus(status);
  };

  const convertUTCDateToLocalDate = (date: any) => {
    var newDate = new Date(date);
    newDate.setMinutes(newDate.getMinutes() - newDate.getTimezoneOffset());
    return newDate.toLocaleString();
  };

  return (
    <>
      <Header />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            textAlign: "left",
          }}
        >
          <div className="header-text">{fileName}</div>
          <label style={{ marginTop: "5px" }}>
            Please select the target language of your video content to be
            translated
          </label>
          <LanguageSelection ref={languageRef} type="Target" />
          <button className="button_transcribe" onClick={onTranscribe}>
            Transcribe
          </button>
        </div>
        <div>
          <button>
            <Link style={{ color: "#fff" }} to="/">
              Back
            </Link>
          </button>
        </div>
      </div>
      <div className="localization-wrapper">
        {isLoading && <Loader />}
        <ToastContainer autoClose={5000} />
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <h3>Transcribe List</h3>
            <div className="transcribe-list">
              {transcriptions.map((transcription: any, index) => (
                <div
                  key={index}
                  className={`transcribe-item${
                    selectedTranscription === index ? "-selected" : ""
                  }`}
                  onClick={() => onTranscriptionSelection(index)}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <div style={{ textAlign: "left" }}>
                      <p>{transcription.NAME}</p>
                      <p style={{ fontFamily: "Gellix-bold" }}>
                        <strong>{`${transcription.SOURCE_LANGUAGE} - To - ${transcription.TARGET_LANGUAGE}`}</strong>
                      </p>
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <p>
                        {transcription?.LAST_UPDATED
                          ? convertUTCDateToLocalDate(
                              transcription.LAST_UPDATED
                            ).toString()
                          : ""}
                      </p>
                      <p>
                        {transcription.STATUS === "InProgress" ? (
                          <img src="/src/assets/circle_yellow.svg" />
                        ) : (
                          <img src="/src/assets/circle_green.svg" />
                        )}
                        <text style={{ paddingLeft: "5px" }}>
                          {transcription.STATUS}
                        </text>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h3>Preview</h3>
            <div className="video-preview">
              <video
                src={videoUrl}
                controls
                style={{ width: "100%", objectFit: "fill" }}
              />
            </div>
          </div>
        </div>
        {fileGUID &&
          transcriptionStatus &&
          transcriptionStatus !== "InProgress" && (
            <Link to="/translations" state={{ fileName, fileGUID, videoUrl }}>
              <button className="edit-translations">Edit Translations</button>
            </Link>
          )}
      </div>
    </>
  );
}

export default Localization;
