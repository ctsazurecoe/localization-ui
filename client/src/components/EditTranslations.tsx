import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Header from "./Header";
import Loader from "./Loader";
import ScoringOriginal from "./ScoringOriginal";
import ScoringTranslated from "./ScoringTranslated";
import BASE_URL from "../baseUrl";

function EditTranslations() {
  const videoRef = useRef<any>();
  const location = useLocation();
  const [data, setData] = useState<any[]>([]);
  const {
    fileName,
    transcriptionGUID: fileGUID,
    videoUrl,
  } = location?.state || {};
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const [translationsCount, setTranslationsCount] = useState(0);
  const [translatedTexts, setTranslatedTexts] = useState({});
  const [selectedSequence, setSelectedSequence] = useState<number>(0);

  const convertTimestampToSeconds = (timestamp: string) => {
    const [hours, minutes, seconds] = timestamp.split(":");
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
  };
  const setSelectedRowData = (rowData: any) => {
    setSelectedSequence(rowData.sequenceNumber);
    setTranslatedTexts(rowData.translation);
    const videoPlayer = videoRef.current;
    if (!videoPlayer || !rowData.startTime || !rowData.endTime) return;
    const startTimeInSeconds = convertTimestampToSeconds(rowData.startTime);
    const endTimeInSeconds = convertTimestampToSeconds(rowData.endTime);
    videoPlayer.currentTime = startTimeInSeconds;
    if (videoPlayer.paused) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
    var pausing_function = function () {
      if (videoPlayer.currentTime >= endTimeInSeconds) {
        videoPlayer.pause();
        videoPlayer.removeEventListener("timeupdate", pausing_function);
      }
    };
    videoPlayer.addEventListener("timeupdate", pausing_function);
  };
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${BASE_URL}/getTranslationsDetailsCount`,
          {
            params: {
              fileGUID,
            },
          }
        );
        if (response?.data) {
          setTranslationsCount(response?.data?.totalCount);
        }
      } catch (error) {
        console.error("Error fetching transcriptions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchDataOnScroll = async (offset: number) => {
    setIsLoading(true);
    let newData: any[] = [];
    // get translations from server with filename
    try {
      const response = await axios.get(`${BASE_URL}/getTranslationsDetails`, {
        params: {
          fileGUID,
          offset,
        },
      });
      if (response?.data) {
        newData = response?.data;
      }
    } catch (error) {
      console.error("Error fetching transcriptions:", error);
    } finally {
      setIsLoading(false);
    }
    return newData;
  };

  const onFinalTranslation = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/translationReprocessing`, {
        fileGUID,
      });
      console.log("Final translation updated successfully", response);
    } catch (error) {
      console.error("Failed to update final translation", error);
    } finally {
      setIsLoading(false);
    }
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
        <div className="header-text">{fileName}</div>
        <div>
          <button>
            <Link style={{ color: "#fff" }} to="/">
              Go Home
            </Link>
          </button>
        </div>
      </div>
      <div className="localization-wrapper">
        {isLoading && <Loader />}
        <ToastContainer autoClose={5000} />
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <h3>Original</h3>
            <div className="scoring-original">
              {translationsCount > 0 && (
                <ScoringOriginal
                  fileGUID={fileGUID}
                  translationsCount={translationsCount}
                  setSelectedRowData={setSelectedRowData}
                  selectedSequence={selectedSequence}
                  data={data}
                  setData={setData}
                  fetchDataOnScroll={fetchDataOnScroll}
                />
              )}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h3>Translated</h3>
            <div className="scoring-translated">
              <ScoringTranslated
                fileGUID={fileGUID}
                selectedSequence={selectedSequence}
                data={translatedTexts}
                setTranslatedData={setData}
                setIsLoading={setIsLoading}
              />
            </div>
            <div>
              <button
                style={{ margin: "10px auto auto auto", float: "right" }}
                onClick={onFinalTranslation}
              >
                Translation Reprocess
              </button>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h3>Preview</h3>
            <div className="video-preview">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                style={{ width: "100%", objectFit: "fill" }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditTranslations;
