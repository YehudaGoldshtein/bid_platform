"use client";

export default function ProfilePage() {
  return (
    <div className="scroll" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'3rem',marginBottom:12}}>{"\uD83D\uDEA7"}</div>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,fontSize:'1.2rem',color:'var(--ink)',marginBottom:6}}>Coming Soon</div>
        <div style={{color:'var(--muted)',fontSize:'0.85rem'}}>This feature is under development.</div>
      </div>
    </div>
  );
}
