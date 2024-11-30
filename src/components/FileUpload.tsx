import axios, { AxiosProgressEvent } from "axios";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Dashboard from "./Dashbord";
import Header from "./Header";
import LanguageSelection from "./LanguageSelection";
import Loader from "./Loader";

const FileUpload: React.FC = () => {
  const [cancelSignals, setCancelSignals] = useState<{
    [key: string]: AbortController;
  }>({});
  const languageRef = useRef<any>();
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const [reloadTable, setReloadTable] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [currentFiles, setCurrentFiles] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [fileListdata, setFileListData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Get list of uploaded files from sql db
      try {
        const filesData = await axios.get(
          "http://localhost:3001/getListOfUploadedFiles"
        );
        filesData?.data && setFileListData(filesData?.data);
      } catch (error) {
        console.log("Failed to fetch list of uploaded files", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [reloadTable]);

  useEffect(() => {
    if (currentFiles && currentFiles.length > 0) onFileUpload();
  }, [currentFiles]);

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const Language = languageRef.current.Language;
    if (!Language || Language === "Select Language") {
      toast("Please select a source language");
      return;
    }
    const newFiles = Array.from(e.target.files || []);
    setCurrentFiles(newFiles);
    setFiles([...files, ...newFiles]);
  };

  // Create Azure SQL DB record for uploaded file with data
  const createDbRecordForUploadedFile = async (
    file: File,
    uploadedFileUrl: string | undefined
  ) => {
    try {
      // Make API call to create the record in Azure SQL DB
      const response = await axios.post(
        "http://localhost:3001/createDbRecordForUploadedFile",
        {
          NAME: file.name,
          LANGUAGE: languageRef?.current?.Language,
          LOCALE: languageRef?.current?.Locale,
          INPUT_URL: uploadedFileUrl,
        }
      );
      console.log("DB record created successfully", response);
      return response;
    } catch (error) {
      console.log("Failed to create DB record", error);
      return "error";
    }
  };

  const onFileCancel = (file: any) => {
    const fileToCancel = file;
    cancelSignals[fileToCancel]?.abort();
    setCancelSignals((prev) => {
      const { [fileToCancel]: _, ...rest } = prev;
      return rest;
    });
    setFiles(files.filter((f) => f.name !== fileToCancel));
    setCurrentFiles(currentFiles.filter((f) => f.name !== fileToCancel));
    setUploadProgress((prev) => {
      const { [fileToCancel]: _, ...rest } = prev;
      return rest;
    });
    localStorage.removeItem(file.name);
  };

  const onFileUpload = async () => {
    const Language = languageRef.current.Language;
    if (!Language || Language === "Select Language") {
      toast("Please select a source language");
      return;
    }

    currentFiles.forEach(async (file) => {
      // Request a SAS URL from the server
      const sasResponse = await axios.get(
        `http://localhost:3001/getSasUrl?fileName=${file.name}`
      );
      console.log("response", sasResponse);
      const { sasUrl } = sasResponse?.data;

      // Use the SAS URL to upload the file to Azure Blob Storage
      try {
        const controller = new AbortController();
        const signalValue = controller.signal;
        setCancelSignals((prev) => ({
          ...prev,
          [file.name]: controller,
        }));
        const uploadResponse = await axios.put(sasUrl, file, {
          signal: signalValue,
          headers: { "x-ms-blob-type": "BlockBlob" },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const progress = Math.round(
              progressEvent.total
                ? (progressEvent.loaded / progressEvent.total) * 100
                : 0
            );
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: progress,
            }));
            localStorage.setItem(file.name, progress.toString());
            console.log("progress", progress);
          },
        });
        if (uploadResponse) {
          /**
           * Create a record in Azure SQL DB for the uploaded file
           * Remove the progress from local storage
           * Remove the progress from the state
           * Show a toast message that the file has been uploaded successfully
           * Remove the file from the list of files to upload
           * Reload the uploaded files list
           */
          setIsLoading(true);
          const uploadedFileUrl = uploadResponse?.config?.url;
          const recordCreationStatus = await createDbRecordForUploadedFile(
            file,
            uploadedFileUrl
          );
          localStorage.removeItem(file.name);
          setUploadProgress((prev) => {
            const { [file.name]: _, ...rest } = prev;
            return rest;
          });
          if (recordCreationStatus !== "error") {
            setFiles(files.filter((f) => f.name !== file.name));
            setCurrentFiles(currentFiles.filter((f) => f.name !== file.name));
            setReloadTable(!reloadTable);
            toast(`${file.name} uploaded successfully`);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.log("Failed to upload file", file.name, error);
        toast(`Failed to upload file - ${file.name}`);
      } finally {
        setIsLoading(false);
      }
    });
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const Language = languageRef.current.Language;
    if (!Language || Language === "Select Language") {
      toast("Please select a source language");
      return;
    }
    const dropFiles = event?.dataTransfer?.files || [];
    if (dropFiles) {
      const newFiles = Array.from(dropFiles);
      setCurrentFiles(newFiles);
      setFiles([...files, ...newFiles]);
    }
  };

  return (
    <>
      <Header />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          textAlign: "left",
        }}
      >
        <div className="header-text">Upload File</div>
        <label style={{ marginTop: "5px" }}>
          Please select the source language of your video content before
          uploading
        </label>
        <LanguageSelection ref={languageRef} type="Source" />
      </div>
      <div
        className="file-upload-container"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {isLoading && <Loader />}
        <ToastContainer autoClose={5000} />
        <img src="/src/assets/cloud-upload.svg" alt="File upload" />
        <button style={{ display: "none" }} onClick={onFileUpload}>
          Upload
        </button>
        <div>
          <input
            type="file"
            hidden
            multiple
            onChange={onFileChange}
            id="file-input"
          />
          <label htmlFor="file-input" className="file-upload-label">
            <u>Click to Upload</u>
          </label>
          <span> or drag and drop files here</span>
        </div>
        <div style={{ fontSize: "12px" }}>
          <span>Supported format: MP3, MP4</span>
        </div>
      </div>
      <div className="file-upload-progress-container">
        {currentFiles.length > 0 &&
          currentFiles.map((file) => (
            <div className="file-upload-progress-wrapper">
              <div className="file-upload-progress" key={file.name}>
                <span>
                  <label>{file.name}</label>
                </span>
                <div className="progress-container">
                  <div className="pogress-bar-wrapper">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${uploadProgress[file.name]}%` || "0px",
                      }}
                    ></div>
                  </div>
                  <span className="progress-percentage">
                    {uploadProgress[file.name] || 0}%
                  </span>
                </div>
              </div>
              <div
                onClick={() => onFileCancel(file.name)}
                className="file-upload-close-icon"
              >
                X
              </div>
            </div>
          ))}
      </div>
      <div className="file-list-container">
        <Dashboard data={fileListdata} />
      </div>
    </>
  );
};

export default FileUpload;
