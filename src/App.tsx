import { Route, Routes } from "react-router-dom";
import "./App.css";
import EditTranslations from "./components/EditTranslations";
import FileUpload from "./components/FileUpload";
import Localization from "./components/Localization";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<FileUpload />} />
        <Route path="/localization" element={<Localization />} />
        <Route path="/translations" element={<EditTranslations />} />
      </Routes>
    </>
  );
}

export default App;
