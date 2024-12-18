import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import BASE_URL from "../baseUrl";

function ScoringTranslated({
  fileGUID,
  data,
  selectedSequence,
  setIsLoading,
  setTranslatedData,
}: any) {
  const dataExists = data && Object.keys(data).length > 0;
  const [finalText, setFinalText] = useState("");
  useEffect(() => {
    const highestScoreModel =
      dataExists &&
      ["GPT4", "LAMA"].reduce((acc: string, key: string) => {
        return data[key]?.score > data[acc]?.score ? key : acc;
      }, "GPT4");
    const finalTextDefaultValue = dataExists
      ? data["Final"]
        ? data["Final"]
        : data[highestScoreModel]?.Contextual
      : "";
    setFinalText(finalTextDefaultValue);
  }, [data]);
  const onTextSave = async () => {
    console.log("Text saved: ", finalText);
    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/updateTranslatedText`, {
        fileGUID,
        selectedSequence,
        finalTranslatedText: finalText,
      });
      toast.success("Text updated successfully");
      setTranslatedData((prevData: any) => {
        const updatedData = [...prevData];
        updatedData.filter(
          (item: any) => item.sequenceNumber === selectedSequence
        )[0].translation.Final = finalText;
        return updatedData;
      });
      return response;
    } catch (error) {
      toast.error("Failed to update");
      return "error";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          textAlign: "left",
          padding: "5px",
        }}
      >
        <button
          style={{ width: "100px", margin: "10px 10px auto auto" }}
          onClick={onTextSave}
        >
          Save
        </button>
        <div style={{ flex: 1 }}>
          <h3>{`GPT4 - ${dataExists ? data["GPT4"]?.score || 0 : 0}`}</h3>
          <textarea
            readOnly
            value={dataExists ? data["GPT4"]?.Contextual : ""}
          ></textarea>
        </div>
        <div style={{ flex: 1 }}>
          <h3>{`LAMA - ${dataExists ? data["LAMA"]?.score || 0 : 0}`}</h3>
          <textarea
            readOnly
            value={dataExists ? data["LAMA"]?.Contextual : ""}
          ></textarea>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Final</h3>
          <textarea
            id={selectedSequence}
            onChange={(e: any) => setFinalText(e.target.value)}
            value={finalText}
          ></textarea>
        </div>
      </div>
    </>
  );
}

export default ScoringTranslated;
