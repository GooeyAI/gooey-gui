import "./styles/custom.css";

const GOOEY_LOGO =
  "https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/2a3aacb4-0941-11ee-b236-02420a0001fb/thumbs/logo%20black.png_400x400.png";

const App = () => {
  const handleSubmit = (e: any) => {
    // show success text below input and clear input
    const phone = document.getElementById("phone") as HTMLInputElement;
    const checkbox = document.getElementById(
      "check-box-terms"
    ) as HTMLInputElement;
    e.preventDefault();
    const alertBox = document.getElementById("alert-box");
    if (alertBox) {
      if (!phone.value) {
        alertBox.innerText = "❌ Please enter your phone number";
      } else if (checkbox.checked && phone.value) {
        alertBox.innerText = "✅ Thanks for joining!";
        phone.value = "";
      }
      setTimeout(() => {
        alertBox.innerText = "";
      }, 3000);
    }
  };

  return (
    <main
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          border: "1px solid #eee",
          maxWidth: "400px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img
          src={GOOEY_LOGO}
          alt="gooey-logo"
          style={{
            width: "200px",
            margin: "auto",
            marginBottom: "20px",
          }}
        />
        <h2 style={{ textAlign: "center" }}>Gooey SMS</h2>
        <p style={{ color: "#010101", marginBottom: "-6px" }}>
          Enable Gooey SMS for your account
        </p>
        <p
          id="alert-box"
          style={{
            display: "block",
            minHeight: "1rem",
            color: "green",
            marginTop: "12px",
            fontSize: "0.8rem",
            lineHeight: "120%",
            marginBottom: "8px",
          }}
        />
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <input
              type="tel"
              id="phone"
              style={{
                width: "300px",
                border: "1px solid #eee",
                height: "30px",
                borderRadius: "5px",
                padding: "5px",
              }}
              placeholder="Enter your phone number"
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                marginLeft: "12px",
                cursor: "pointer",
              }}
            >
              Join now
            </button>
          </div>
          {/* // checkbox for terms and conditions */}
          <div
            style={{
              display: "flex",
              alignItems: "start",
              marginTop: "12px",
            }}
          >
            <input
              type="checkbox"
              id="check-box-terms"
              name="isAgreed"
            />

            <p
              style={{
                marginLeft: "8px",
                marginTop: 0,
                fontSize: "0.8rem",
                lineHeight: "120%",
              }}
            >
              I agree to receive SMS notifications from Gooey at the Phone
              Number provided above. Message and data rates may apply. Reply
              STOP to unsubscribe.
            </p>
          </div>
        </form>
      </div>
      {/* Privacy policy | Terms & Service */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <a
          href="https://gooey.ai/privacy/"
          style={{ color: "#000", fontSize: "0.8rem" }}
        >
          Privacy Policy
        </a>
        <span style={{ margin: "0 8px" }}>|</span>
        <a
          href="https://gooey.ai/terms"
          style={{ color: "#000", fontSize: "0.8rem" }}
        >
          Terms & Service
        </a>
      </div>
    </main>
  );
};

export default App;
