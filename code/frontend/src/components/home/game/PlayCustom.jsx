// src/pages/PlayCustom.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import WorldMap from "./WorldMap";
import QuitGame from "./QuitGame";
import CongratsDialog from "./CongratsDialog";
import { GameMode, ScoreEngine } from "../../../utils/score";
import { authedFetch } from "../../../utils/auth";

const scorer = new ScoreEngine();

export default function PlayCustom() {
  const [sp] = useSearchParams();
  const start = sp.get("from") || "";
  const end = sp.get("to") || "";
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

  async function handleConnected({steps, route}) {
    setStepsUsed(steps);
    const result = scorer.compute({
      mode: GameMode.Custom,
      optimalSteps,
      stepsUsed: steps,
      hasQuit: false,
    });
    setPoints(result.points);

    const maxResult = scorer.compute({
          mode: GameMode.Custom,
          optimalSteps,
          stepsUsed: optimalSteps,
          hasQuit: false,
        });
    const maxPoints = maxResult.points;

    if (!posted && result.points > 0) {
      setPosted(true);
      try {
        await authedFetch("https://backend.cyril-travle-mvp-game.win/api/score/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points: result.points }),
        });
        // optional: read { user } = await r.json() and update UI
        try {
          await authedFetch("https://backend.cyril-travle-mvp-game.win/api/game/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: 1,                 
              fastestRoute: data.path, 
              userRoute: route,        
              maxPoints,
              pointsAwarded: result.points,
            }),
          });
        } catch (e) {
          // optional: log
        }
      } catch (err) {
        // optional: toast/log  
        console.log(err)
        
      }
    }
    setShowCongrats(true);
  }




  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setErr("");

    fetch(
      `https://backend.cyril-travle-mvp-game.win/api//reachable/path?from=${encodeURIComponent(
        start
      )}&to=${encodeURIComponent(end)}`
    )
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed");
        return j;
      })
      .then((j) => {
        if (!ignore) setData(j);
      })
      .catch((e) => {
        if (!ignore) setErr(e.message || "Network error");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [start, end]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Link to="/" style={{ textDecoration: "none" }}>← Home</Link>
        <div style={{ marginTop: 12 }}>Loading route…</div>
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

  const optimalSteps = data?.countriesApart ?? 0;
  const isOptimal = stepsUsed <= optimalSteps;

  return (
    <>
      <WorldMap
        start={data.from}
        end={data.to}
        shortestPath={data.path}
        edges={data.edges}
        countriesApart={data.countriesApart}
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
        isReplay={false}
        onContinue={() => navigate("/home")}
      />
    </>
  );
}
