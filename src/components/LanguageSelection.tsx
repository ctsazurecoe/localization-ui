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
    { SSML_LANGUAGE: "select", DISPLAY_LANGUAGE: "Select" },
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
    <div>
      <label>
        <strong>{type} Language:</strong>
        <select
          style={{ marginLeft: "10px" }}
          value={Locale}
          onChange={handleLanguageChange}
        >
          {languages.map((language) => (
            <option key={language.SSML_LANGUAGE} value={language.SSML_LANGUAGE}>
              {language.DISPLAY_LANGUAGE}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
});

export default LanguageSelection;
