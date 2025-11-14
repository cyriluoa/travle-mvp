import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import WorldMap from "./WorldMap";
import QuitGame from "./QuitGame";
import CongratsDialog from "./CongratsDialog";
import { GameMode, ScoreEngine } from "../../../utils/score";
import { authedFetch } from "../../../utils/auth";

const scorer = new ScoreEngine();

export default function PlayToday() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  // dialogs
  const [showQuit, setShowQuit] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [stepsUsed, setStepsUsed] = useState(0);
  const [points, setPoints] = useState(null);
  const [posted, setPosted] = useState(false);

  async function handleConnected({steps, route }) {
    setStepsUsed(steps);
    const result = scorer.compute({
      mode: GameMode.Today,
      optimalSteps,
      stepsUsed: steps,
      hasQuit: false,
    });
    setPoints(result.points);

     // theoretical max points if player used optimalSteps
    const maxResult = scorer.compute({
      mode: GameMode.Today,
      optimalSteps,
      stepsUsed: optimalSteps,
      hasQuit: false,
    });
    const maxPoints = maxResult.points;

    if (!posted && result.points > 0) {
      setPosted(true);
      try {
        await authedFetch("http://localhost:5000/api/score/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points: result.points }),
        });

        try {
          await authedFetch("http://localhost:5000/api/game/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: 0,                 // 0 = Play Today
              fastestRoute: data.path, // string[]
              userRoute: route,        // string[] from WorldMap
              maxPoints,
              pointsAwarded: result.points,
            }),
          });
        } catch (e) {
          // optional: log
        }
      } catch (e) {
        // optional: handle score/add error
      }
    }
    setShowCongrats(true);
  }

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setErr("");

    fetch("http://localhost:5000/api/random-today")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed");
        return j;
      })
      .then((j) => { if (!ignore) setData(j); })
      .catch((e) => { if (!ignore) setErr(e.message || "Network error"); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Link to="/" style={{ textDecoration: "none" }}>← Home</Link>
        <div style={{ marginTop: 12 }}>Loading today’s route…</div>
      </div>
    );
  }
  if (err && !data) {
    return (
      <div style={{ padding: 16 }}>
        <Link to="/" style={{ textDecoration: "none" }}>← Home</Link>
        <div style={{ marginTop: 12, color: "#b42318" }}>{err}</div>
      </div>
    );
  }

  // Backend fields: { date, start, end, path, length }
  const countriesApart = data.length;        // intermediates
  const edges = countriesApart + 1;          // borders crossed
  const optimalSteps = countriesApart;
  const isOptimal = stepsUsed <= optimalSteps;

  return (
    <>
      <WorldMap
        start={data.start}
        end={data.end}
        shortestPath={data.path}
        edges={edges}
        countriesApart={countriesApart}
        onQuit={() => setShowQuit(true)}
        onConnected={handleConnected}
      />

      <QuitGame
        open={showQuit}
        onCancel={() => setShowQuit(false)}
        onConfirm={() => navigate(-1)}
      />

      <CongratsDialog
        open={showCongrats}
        steps={stepsUsed}
        isOptimal={isOptimal}
        shortestPath={data.path}
        optimalSteps={optimalSteps}
        points={points}
        onContinue={() => navigate("/home")}
      />
    </>
  );
}
