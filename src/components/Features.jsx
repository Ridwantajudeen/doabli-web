import { Colors } from "../constants/colors";

export default function Features() {
  const items = [
    {
      title: "Verified Runners",
      desc: "Every runner is vetted with identity checks, ratings and reviews."
    },
    {
      title: "Fast Matching",
      desc: "Post an errand and get applications from available runners instantly."
    },
    {
      title: "Seamless Communication",
      desc: "Chat directly with your runner inside the platform."
    }
  ];

  return (
    <section id="features"
      style={{
        background: Colors.dark.uiBackground,
        padding: "60px 32px",
        textAlign: "center",
        color: Colors.dark.title
      }}>
      
      <h2 style={{ fontSize: 36, marginBottom: 40 }}>Why Choose Errandly?</h2>

      <div style={{
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 32
      }}>
        {items.map((f, i) => (
          <div key={i} style={{
            width: 280,
            background: Colors.dark.background,
            padding: 24,
            borderRadius: 12,
            textAlign: "left"
          }}>
            <h3 style={{ marginBottom: 10 }}>{f.title}</h3>
            <p style={{ color: Colors.dark.text }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
