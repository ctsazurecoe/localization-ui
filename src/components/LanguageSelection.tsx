import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { getLanguages } from "../utils/getLanguages";

const LanguageSelection = forwardRef((props: { type: string }, ref) => {
  const { type } = props;
  const [languages, setLanguages] = useState<any[]>([
    { SSML_LANGUAGE: "select", DISPLAY_LANGUAGE: "Select Language" },
  ]);
  const [Language, setLanguage] = useState("");
  const [Locale, setLocale] = useState("");

  useEffect(() => {
    getLanguages()
      .then((list) => {
        setLanguages([...languages, ...list]);
      })
      .catch(console.error);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      Language,
      Locale,
    }),
    [Language, Locale]
  );

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(e.target.value);
    const label = e?.target?.options[e?.target?.selectedIndex]?.text;
    setLanguage(label);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        margin: "10px 0px",
      }}
    >
      <label>
        {type} Language<span style={{ color: "red" }}>*</span>
      </label>
      <select
        style={{ width: "330px", height: "20px" }}
        value={Locale}
        onChange={handleLanguageChange}
      >
        {languages.map((language) => (
          <option key={language.SSML_LANGUAGE} value={language.SSML_LANGUAGE}>
            {language.DISPLAY_LANGUAGE}
          </option>
        ))}
      </select>
    </div>
  );
});

export default LanguageSelection;
