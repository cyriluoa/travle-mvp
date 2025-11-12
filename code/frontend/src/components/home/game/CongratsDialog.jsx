// src/components/CongratsDialog.jsx
// src/pages/CongratsDialog.jsx
export default function CongratsDialog({ open, steps, isOptimal, shortestPath = [], optimalSteps, points, onContinue }) {
  if (!open) return null;
  return (
    <div onClick={onContinue} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:60 }}>
      <div onClick={(e)=>e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cg-title"
           style={{ width:520, maxWidth:"92vw", background:"rgba(20,25,40,.96)", color:"#e6e9ef", border:"1px solid rgba(255,255,255,.1)", borderRadius:16, padding:20 }}>
        <h3 id="cg-title" style={{ margin:0, marginBottom:6 }}>Congratulations</h3>
        <p style={{ marginTop:0, marginBottom:10 }}>You connected the two countries.</p>

        <div style={{ fontSize:14, lineHeight:1.5 }}>
          <div style={{ marginBottom:8 }}>You completed this in <strong>{steps}</strong> {steps === 1 ? "step" : "steps"}.</div>
          {isOptimal ? (
            <div>This matches the shortest possible number of guesses.</div>
          ) : (
            <>
              <div>The shortest path requires <strong>{optimalSteps}</strong> {optimalSteps === 1 ? "guess" : "guesses"}.</div>
              {shortestPath?.length ? <div style={{ marginTop:6, opacity:.95 }}>Shortest path: {shortestPath.join(" → ")}</div> : null}
            </>
          )}
          {typeof points === "number" ? (
            <div style={{ marginTop:10, fontWeight:600 }}>Points earned: {points}</div>
          ) : null}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
          <button type="button" onClick={onContinue}
                  style={{ padding:"10px 16px", borderRadius:10, border:"1px solid #111", background:"#111", color:"white", cursor:"pointer" }}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
