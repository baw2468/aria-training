// ─── REACT SETUP ─────────────────────────────────────────────────
var R=React;
var useState=R.useState;
var useEffect=R.useEffect;
var useRef=R.useRef;
var e=R.createElement;

// ─── STYLE HELPERS ───────────────────────────────────────────────
function glass(extra){return Object.assign({background:"rgba(255,255,255,0.82)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderRadius:14,border:"1px solid rgba(99,102,241,0.14)",boxShadow:"0 4px 20px rgba(99,102,241,0.07)"},extra||{});}
function cardS(extra){return glass(Object.assign({padding:16},extra||{}));}
function inpS(){return{width:"100%",background:"rgba(255,255,255,0.7)",border:"1px solid rgba(99,102,241,0.14)",borderRadius:10,color:C.text,fontFamily:"inherit",fontSize:14,padding:"10px 13px",outline:"none",boxSizing:"border-box"};}
function selS(){return{width:"100%",background:"rgba(255,255,255,0.85)",border:"1px solid rgba(99,102,241,0.14)",borderRadius:10,color:C.text,fontFamily:"inherit",fontSize:14,padding:"10px 13px",outline:"none"};}
function btnS(color,disabled){return{padding:"11px 20px",background:disabled?C.bgDeep:color,border:"none",borderRadius:11,color:disabled?C.textSoft:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:disabled?"default":"pointer",transition:"all 0.2s",boxShadow:disabled?"none":"0 4px 14px "+color+"35"};}

// ─── MINI COMPONENTS ─────────────────────────────────────────────
function Inp(props){
  if(props.multi)return e("textarea",Object.assign({},props,{style:Object.assign({},inpS(),{resize:"vertical",minHeight:85,lineHeight:1.6}),multi:undefined}));
  return e("input",Object.assign({},props,{style:inpS()}));
}
function Sel(props){
  return e("select",Object.assign({},props,{style:selS()}),
    (props.opts||[]).map(function(o){return e("option",{key:o[0],value:o[0]},o[1]);})
  );
}
function Btn(props){
  return e("button",{onClick:props.onClick,disabled:props.disabled,style:Object.assign({},btnS(props.color||"#6366f1",props.disabled),props.full?{width:"100%"}:{})},props.children);
}
function Lbl(props){
  return e("div",{style:{fontSize:11,fontWeight:700,color:props.color||C.textSoft,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}},props.children);
}
function Tag(props){
  return e("span",{style:{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,background:props.color+"14",border:"1px solid "+props.color+"28",color:props.color,whiteSpace:"nowrap"}},props.children);
}
function Saved(props){
  if(!props.show)return null;
  return e("span",{style:{fontSize:12,color:C.good,fontWeight:700}},"✓ Saved");
}

// ─── EXERCISE MODAL ───────────────────────────────────────────────
function ExModal(props){
  var ex=props.ex,color=props.color,onClose=props.onClose;
  var _f=useState(0);var frame=_f[0];var setFrame=_f[1];
  var _p=useState(true);var play=_p[0];var setPlay=_p[1];
  var frames=getFrames(ex.id)||[];
  useEffect(function(){
    if(!play||!frames.length)return;
    var iv=setInterval(function(){setFrame(function(f){return(f+1)%frames.length;});},850);
    return function(){clearInterval(iv);};
  },[play,frames.length]);
  var cur=frames[frame];
  return e("div",{style:{position:"fixed",inset:0,zIndex:2000,display:"flex",alignItems:"flex-end",justifyContent:"center"},onClick:onClose},
    e("div",{style:{position:"absolute",inset:0,background:"rgba(15,20,50,0.55)",backdropFilter:"blur(6px)"}}),
    e("div",{onClick:function(ev){ev.stopPropagation();},style:{position:"relative",width:"100%",maxWidth:480,background:"rgba(255,255,255,0.97)",borderRadius:"20px 20px 0 0",overflow:"hidden",boxShadow:"0 -12px 60px rgba(99,102,241,0.2)",maxHeight:"85vh",overflowY:"auto"}},
      e("div",{style:{height:4,background:"linear-gradient(90deg,"+color+","+color+"88)"}}),
      e("div",{style:{padding:"14px 18px 10px",borderBottom:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"sticky",top:0,background:"rgba(255,255,255,0.97)",zIndex:1}},
        e("div",null,
          e("div",{style:{fontSize:17,fontWeight:800,color:C.text}},ex.name),
          e("div",{style:{fontSize:12,color:C.textSoft,marginTop:1}},ex.muscle+" · "+ex.sets+" sets × "+ex.reps+(ex.note?" ("+ex.note+")":""))
        ),
        e("button",{onClick:onClose,style:{width:28,height:28,borderRadius:"50%",border:"1px solid "+C.border,background:C.bgDeep,color:C.textMid,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}},"×")
      ),
      frames.length>0?e("div",{style:{background:C.bg,padding:"18px 0 12px",textAlign:"center",borderBottom:"1px solid "+C.border}},
        e("svg",{width:160,height:110,viewBox:"0 0 100 90",style:{color:color,filter:"drop-shadow(0 0 10px "+color+"50)"},dangerouslySetInnerHTML:{__html:cur?cur.s:""}}),
        e("div",{style:{fontSize:10,fontWeight:700,color:C.textSoft,letterSpacing:2,textTransform:"uppercase",marginBottom:10}},cur?cur.l:""),
        e("div",{style:{display:"flex",justifyContent:"center",gap:6,marginBottom:10}},
          frames.map(function(_,i){return e("button",{key:i,onClick:function(){setFrame(i);setPlay(false);},style:{width:i===frame?22:8,height:8,borderRadius:4,background:i===frame?color:"rgba(0,0,0,0.12)",border:"none",cursor:"pointer",transition:"all 0.3s"}});})
        ),
        e("button",{onClick:function(){setPlay(function(p){return !p;});},style:{padding:"6px 16px",background:play?color+"12":"rgba(0,0,0,0.05)",border:"1px solid "+color+"35",borderRadius:20,color:color,fontSize:11,letterSpacing:1,cursor:"pointer",fontWeight:700}},play?"⏸ Pause":"▶ Play")
      ):null,
      e("div",{style:{padding:"14px 18px"}},
        e("div",{style:{fontSize:11,fontWeight:700,color:C.textSoft,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}},"Form Cues"),
        (ex.cues||[]).map(function(cue,i){
          return e("div",{key:i,style:{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}},
            e("div",{style:{width:22,height:22,borderRadius:"50%",background:color+"12",border:"1px solid "+color+"30",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:color}},i+1),
            e("div",{style:{fontSize:13,color:C.text,lineHeight:1.5,paddingTop:3}},cue)
          );
        })
      )
    )
  );
}

// ─── DAY DETAIL SHEET ─────────────────────────────────────────────
function DaySheet(props){
  var dateStr=props.dateStr,runs=props.runs,strength=props.strength,onClose=props.onClose;
  var _ex=useState(null);var exModal=_ex[0];var setExModal=_ex[1];
  var planned=getPlannedForDate(dateStr);
  var d=new Date(dateStr+"T00:00:00");
  var dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var monthNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var loggedRun=runs.find(function(r){return r.date===dateStr;})||null;
  var loggedStr=strength.find(function(s){return s.date===dateStr;})||null;
  var wktDef=planned.strWkt?WORKOUTS[planned.strWkt]:null;
  var wktColor=planned.strWkt?WKT_COLOR[planned.strWkt]:"#6366f1";
  return e("div",{style:{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"},onClick:onClose},
    e("div",{style:{position:"absolute",inset:0,background:"rgba(15,20,50,0.5)",backdropFilter:"blur(6px)"}}),
    e("div",{onClick:function(ev){ev.stopPropagation();},style:{position:"relative",width:"100%",maxWidth:480,background:"rgba(255,255,255,0.97)",borderRadius:"20px 20px 0 0",overflow:"hidden",boxShadow:"0 -12px 60px rgba(99,102,241,0.2)",maxHeight:"88vh",overflowY:"auto"}},
      e("div",{style:{padding:"14px 18px 12px",borderBottom:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"rgba(255,255,255,0.97)",zIndex:1}},
        e("div",null,
          e("div",{style:{fontSize:18,fontWeight:800,color:C.text}},dayNames[d.getDay()]),
          e("div",{style:{fontSize:13,color:C.textSoft}},monthNames[d.getMonth()]+" "+d.getDate()+" · Week "+planned.week)
        ),
        e("button",{onClick:onClose,style:{width:30,height:30,borderRadius:"50%",border:"1px solid "+C.border,background:C.bgDeep,color:C.textMid,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"×")
      ),
      e("div",{style:{padding:"14px 18px"}},
        (planned.runLabel||loggedRun)?e("div",{style:{marginBottom:16}},
          e("div",{style:{fontSize:11,fontWeight:700,color:C.textSoft,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}},"Run"),
          e("div",{style:{padding:"12px 14px",background:runColor(planned.runType||"run")+"08",border:"1px solid "+runColor(planned.runType||"run")+"25",borderRadius:12,marginBottom:loggedRun?8:0}},
            e("div",{style:{fontSize:11,fontWeight:700,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",marginBottom:4}},"Planned"),
            e("div",{style:{fontSize:14,fontWeight:700,color:runColor(planned.runType||"run")}},planned.runLabel||"—"),
            planned.plan&&planned.plan.notes?e("div",{style:{fontSize:11,color:C.textMid,marginTop:4,lineHeight:1.5}},planned.plan.notes):null
          ),
          loggedRun?e("div",{style:{padding:"12px 14px",background:runColor(loggedRun.type)+"10",border:"2px solid "+runColor(loggedRun.type)+"40",borderRadius:12}},
            e("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:8}},
              e("div",{style:{fontSize:11,fontWeight:700,color:C.textSoft,letterSpacing:1,textTransform:"uppercase"}},"Logged"),
              e("span",{style:{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,background:runColor(loggedRun.type)+"15",color:runColor(loggedRun.type)}},"✓ Completed")
            ),
            e("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}},
              [["Distance",loggedRun.dist?loggedRun.dist+" mi":"—"],["Pace",loggedRun.pace?loggedRun.pace+"/mi":"—"],["Time",loggedRun.time||"—"],["Avg HR",loggedRun.hrAvg?loggedRun.hrAvg+" bpm":"—"],["Max HR",loggedRun.hrMax?loggedRun.hrMax+" bpm":"—"],["HR Recovery",loggedRun.hrRec?"−"+loggedRun.hrRec+" bpm":"—"],["Calories",loggedRun.cal?loggedRun.cal+" cal":"—"],["Cadence",loggedRun.cad?loggedRun.cad+" spm":"—"]]
              .filter(function(x){return x[1]&&x[1]!=="—";})
              .map(function(x){return e("div",{key:x[0],style:{background:"rgba(255,255,255,0.7)",borderRadius:8,padding:"8px 10px"}},
                e("div",{style:{fontSize:10,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",marginBottom:2,fontWeight:600}},x[0]),
                e("div",{style:{fontSize:15,fontWeight:800,color:runColor(loggedRun.type)}},x[1])
              );})
            ),
            loggedRun.notes?e("div",{style:{fontSize:12,color:C.textMid,marginTop:10,fontStyle:"italic"}},'"'+loggedRun.notes+'"'):null
          ):null
        ):null,
        (wktDef||loggedStr)?e("div",null,
          e("div",{style:{fontSize:11,fontWeight:700,color:C.textSoft,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}},"Strength Training"),
          wktDef?e("div",{style:{padding:"12px 14px",background:wktColor+"08",border:"1px solid "+wktColor+"25",borderRadius:12,marginBottom:loggedStr?8:0}},
            e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}},
              e("div",null,
                e("div",{style:{fontSize:11,fontWeight:700,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",marginBottom:2}},"Planned · Workout "+planned.strWkt),
                e("div",{style:{fontSize:14,fontWeight:700,color:wktColor}},wktDef.label)
              ),
              loggedStr?e("span",{style:{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,background:wktColor+"15",color:wktColor}},"✓ Completed"):null
            ),
            wktDef.exercises.map(function(ex){
              var loggedEx=loggedStr&&loggedStr.sets?loggedStr.sets.find(function(s){return s.id===ex.id;}):null;
              var hasFrames=getFrames(ex.id).length>0;
              return e("div",{key:ex.id,style:{padding:"10px 12px",background:"rgba(255,255,255,0.6)",borderRadius:10,marginBottom:6,border:"1px solid "+wktColor+"15"}},
                e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:loggedEx?6:0}},
                  e("div",{style:{flex:1}},
                    e("div",{style:{fontSize:13,fontWeight:700,color:C.text}},ex.name),
                    e("div",{style:{fontSize:11,color:C.textSoft,marginTop:1}},ex.sets+" sets × "+ex.reps+(ex.note?" · "+ex.note:"")+" · "+ex.muscle)
                  ),
                  hasFrames?e("button",{onClick:function(){setExModal(ex);},style:{padding:"5px 11px",background:wktColor+"10",border:"1px solid "+wktColor+"30",borderRadius:8,color:wktColor,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0,marginLeft:8}},"How to →"):null
                ),
                loggedEx&&loggedEx.logs&&loggedEx.logs.length>0?e("div",{style:{display:"flex",gap:5,flexWrap:"wrap",marginTop:6}},
                  loggedEx.logs.map(function(l,j){return e("span",{key:j,style:{fontSize:11,padding:"3px 8px",background:wktColor+"12",borderRadius:6,color:wktColor,fontWeight:700}},"S"+(j+1)+": "+l.reps+"r"+(l.weight>0?" @"+l.weight+"lb":""));})
                ):null
              );
            }),
            loggedStr&&loggedStr.notes?e("div",{style:{fontSize:12,color:C.textMid,marginTop:8,fontStyle:"italic"}},'Notes: "'+loggedStr.notes+'"'):null
          ):null
        ):null,
        !planned.runLabel&&!wktDef&&!loggedRun&&!loggedStr?e("div",{style:{textAlign:"center",padding:"30px 0",color:C.textSoft,fontSize:14}},"Rest day — recovery is part of the plan."):null
      ),
      exModal?e(ExModal,{ex:exModal,color:wktColor,onClose:function(){setExModal(null);}}):null
    )
  );
}

// ─── INSIGHT CARD ─────────────────────────────────────────────────
function ICard(props){
  var item=props.item,type=props.type;
  var _o=useState(false);var open=_o[0];var setOpen=_o[1];
  var col=type==="warn"?C.warn:C.good;
  return e("div",{style:{marginBottom:6,background:col+"08",borderRadius:10,border:"1px solid "+col+"20",overflow:"hidden"}},
    e("div",{onClick:function(){if(item.s)setOpen(function(o){return !o;});},style:{padding:"10px 13px",cursor:item.s?"pointer":"default",display:"flex",gap:9,alignItems:"flex-start"}},
      e("span",{style:{color:col,flexShrink:0,fontSize:13,marginTop:1}},type==="warn"?"⚠":"✓"),
      e("div",{style:{flex:1}},
        e("div",{style:{fontSize:13,fontWeight:700,color:C.text,marginBottom:1}},item.t),
        e("div",{style:{fontSize:12,color:C.textMid,lineHeight:1.4}},item.b)
      ),
      item.s?e("span",{style:{fontSize:10,color:col+"70",flexShrink:0,marginTop:3}},open?"▲":"▼"):null
    ),
    open?e("div",{style:{padding:"7px 13px 10px",borderTop:"1px solid "+col+"15",background:col+"05",fontSize:11,color:C.textSoft,lineHeight:1.6,fontStyle:"italic"}},item.s):null
  );
}
