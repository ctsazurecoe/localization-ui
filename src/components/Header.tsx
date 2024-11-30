export default function Header() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="app_header">Localization</div>
        <div>
          <img className="cog_logo" src="src/assets/cognizant_logo.png" />
        </div>
      </div>
      <hr />
    </>
  );
}
