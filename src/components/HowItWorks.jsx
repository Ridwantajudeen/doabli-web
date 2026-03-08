import { Colors } from "../constants/colors";

export default function HowItWorks() {
  const steps = [
    "Create an account as a client or runner.",
    "Clients post errands. Runners apply.",
    "Clients choose the best applicant.",
    "Chat, complete, and rate the service."
  ];

  return (
    <section id="how" style={{
      background: Colors.dark.background,
      color: Colors.dark.title,
      padding: "60px 32px"
    }}>
      <h2 style={{ fontSize: 36, textAlign: "center" }}>
        How Doabli Works
      </h2>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        marginTop: 40,
        maxWidth: 600,
        marginInline: "auto"
      }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            padding: 20,
            borderRadius: 10,
            background: Colors.dark.uiBackground
          }}>
            <strong>Step {i + 1}: </strong> {step}
          </div>
        ))}
      </div>
    </section>
  );
}

