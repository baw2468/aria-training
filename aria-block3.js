// ─── MAIN APP ────────────────────────────────────────────────────
var MEALS=["breakfast","lunch","dinner","snacks"];
var MEAL_ICON={breakfast:"☀️",lunch:"🥗",dinner:"🌙",snacks:"⚡"};
var MACROS=[{k:"cal",label:"Calories",ph:"620"},{k:"protein",label:"Protein g",ph:"42"},{k:"carbs",label:"Carbs g",ph:"80"},{k:"fat",label:"Fat g",ph:"18"}];
var TABS=[{id:"home",icon:"⌂",label:"Home"},{id:"calendar",icon:"◫",label:"Calendar"},{id:"insights",icon:"◎",label:"Insights"},{id:"run",icon:"🏃",label:"Log Run"},{id:"strength",icon:"⬡",label:"Strength"},{id:"nutrition",icon:"◈",label:"Nutrition"},{id:"health",icon:"♥",label:"Health"}];
var MNAMES=["January","February","March","April","May","June","July","August","September","October","November","December"];

function App(){
  var _tab=useState("home");var tab=_tab[0];var setTab=_tab[1];
  var _boot=useState(false);var boot=_boot[0];var setBoot=_boot[1];
  var _bootPct=useState(0);var bootPct=_bootPct[0];var setBootPct=_bootPct[1];
  var week=getWeek();var plan=PLAN[week]||PLAN[1];

  var _runs=useState([]);var runs=_runs[0];var setRuns=_runs[1];
  var _str=useState([]);var strength=_str[0];var setStrength=_str[1];
  var _hr=useState([]);var hr=_hr[0];var setHr=_hr[1];
  var _nu=useState([]);var nutrition=_nu[0];var setNutrition=_nu[1];
  var _syncing=useState(false);var syncing=_syncing[0];var setSyncing=_syncing[1];

  // Log Run state
  var _rDate=useState(toDay());var rDate=_rDate[0];var setRDate=_rDate[1];
  var _rType=useState("run");var rType=_rType[0];var setRType=_rType[1];
  var _rRaw=useState("");var rRaw=_rRaw[0];var setRRaw=_rRaw[1];
  var _rNotes=useState("");var rNotes=_rNotes[0];var setRNotes=_rNotes[1];
  var _rSaved=useState(false);var rSaved=_rSaved[0];var setRSaved=_rSaved[1];
  var _csvSt=useState(null);var csvSt=_csvSt[0];var setCsvSt=_csvSt[1];
  var _csvCt=useState(0);var csvCt=_csvCt[0];var setCsvCt=_csvCt[1];
  var csvRef=useRef(null);
  // Strength state
  var _sDate=useState(toDay());var sDate=_sDate[0];var setSDate=_sDate[1];
  var _sWkt=useState("A");var sWkt=_sWkt[0];var setSWkt=_sWkt[1];
  var _sSets=useState({});var sSets=_sSets[0];var setSSets=_sSets[1];
  var _sNotes=useState("");var sNotes=_sNotes[0];var setSNotes=_sNotes[1];
  var _sSaved=useState(false);var sSaved=_sSaved[0];var setSSaved=_sSaved[1];
  var _sView=useState(null);var sView=_sView[0];var setSView=_sView[1];
  var _exModal=useState(null);var exModal=_exModal[0];var setExModal=_exModal[1];
  // HR state
  var _hDate=useState(toDay());var hDate=_hDate[0];var setHDate=_hDate[1];
  var _hRest=useState("");var hRest=_hRest[0];var setHRest=_hRest[1];
  var _hAvg=useState("");var hAvg=_hAvg[0];var setHAvg=_hAvg[1];
  var _hMax=useState("");var hMax=_hMax[0];var setHMax=_hMax[1];
  var _hRec=useState("");var hRec=_hRec[0];var setHRec=_hRec[1];
  var _hHrv=useState("");var hHrv=_hHrv[0];var setHHrv=_hHrv[1];
  var _hSaved=useState(false);var hSaved=_hSaved[0];var setHSaved=_hSaved[1];
  // Nutrition state
  var _mData=useState({});var mData=_mData[0];var setMData=_mData[1];
  var _nDate=useState(toDay());var nDate=_nDate[0];var setNDate=_nDate[1];
  var _nType=useState("run");var nType=_nType[0];var setNType=_nType[1];
  var _nNotes=useState("");var nNotes=_nNotes[0];var setNNotes=_nNotes[1];
  var _nSaved=useState(false);var nSaved=_nSaved[0];var setNSaved=_nSaved[1];
  // Calendar state
  var _calMonth=useState(function(){var n=new Date();return{y:n.getFullYear(),m:n.getMonth()};});
  var calMonth=_calMonth[0];var setCalMonth=_calMonth[1];
  var _daySheet=useState(null);var daySheet=_daySheet[0];var setDaySheet=_daySheet[1];

  var today=toDay();

  // Boot animation
  useEffect(function(){
    var p=0;
    var iv=setInterval(function(){
      p+=Math.random()*20+12;
      if(p>=100){setBootPct(100);clearInterval(iv);setTimeout(function(){setBoot(true);},300);}
      else setBootPct(Math.min(p,99));
    },200);
    return function(){clearInterval(iv);};
  },[]);

  // Firebase load
  useEffect(function(){
    (async function(){
      try{
        var results=await Promise.all([dbGet("a8_r"),dbGet("a8_s"),dbGet("a8_h"),dbGet("a8_n")]);
        if(results[0])setRuns(JSON.parse(results[0].value));
        if(results[1])setStrength(JSON.parse(results[1].value));
        if(results[2])setHr(JSON.parse(results[2].value));
        if(results[3])setNutrition(JSON.parse(results[3].value));
      }catch(err){console.warn("Load error",err);}
    })();
  },[]);

  // Save helper with sync indicator
  var sv=function(k,d){setSyncing(true);dbSet(k,d).then(function(){setTimeout(function(){setSyncing(false);},1200);});};

  // Add run
  var addRun=function(){
    if(!rDate||!rRaw.trim())return;
    var p=parseGarmin(rRaw);
    var entry=Object.assign({date:rDate,type:rType,raw:rRaw,notes:rNotes,week:week},p);
    var u=[entry].concat(runs).slice(0,200);
    setRuns(u);sv("a8_r",u);setRRaw("");setRNotes("");setRDate(toDay());setRSaved(true);
    setTimeout(function(){setRSaved(false);},2000);
  };

  // CSV handler
  var handleCSV=function(ev){
    var f=ev.target.files&&ev.target.files[0];if(!f)return;
    setCsvSt("parsing");
    var r=new FileReader();
    r.onload=function(e2){
      try{
        var parsed=parseCSV(e2.target.result);
        if(!parsed.length){setCsvSt("error");return;}
        var ex=new Set(runs.map(function(r2){return r2.date+"_"+r2.dist;}));
        var fr=parsed.filter(function(r2){return !ex.has(r2.date+"_"+r2.dist);});
        var u=fr.concat(runs).sort(function(a,b){return b.date.localeCompare(a.date);}).slice(0,200);
        setRuns(u);sv("a8_r",u);setCsvCt(fr.length);setCsvSt("done");
        setTimeout(function(){setCsvSt(null);},4000);
      }catch(err){setCsvSt("error");setTimeout(function(){setCsvSt(null);},3000);}
    };
    r.readAsText(f);ev.target.value="";
  };

  // Strength helpers
  var getS=function(id,i,f){return sSets[id+"_"+i+"_"+f]||"";};
  var setS=function(id,i,f,v){setSSets(function(prev){var n=Object.assign({},prev);n[id+"_"+i+"_"+f]=v;return n;});};

  var addStr=function(){
    if(!sDate)return;
    var w=WORKOUTS[sWkt];
    var sets=w.exercises.map(function(ex){
      return{id:ex.id,name:ex.name,logs:Array.from({length:ex.sets},function(_,i){return{reps:getS(ex.id,i,"reps"),weight:parseFloat(getS(ex.id,i,"weight"))||0};}).filter(function(l){return l.reps;})};
    }).filter(function(ex){return ex.logs.length>0;});
    var entry={date:sDate,wkt:sWkt,sets:sets,notes:sNotes,week:week};
    var u=[entry].concat(strength).slice(0,200);
    setStrength(u);sv("a8_s",u);setSDate(toDay());setSNotes("");setSSets({});setSSaved(true);
    setTimeout(function(){setSSaved(false);},2000);
  };

  var addHR=function(){
    if(!hDate)return;
    var entry={date:hDate,resting:hRest?+hRest:null,runAvg:hAvg?+hAvg:null,runMax:hMax?+hMax:null,hrRecovery:hRec?+hRec:null,hrv:hHrv?+hHrv:null};
    var u=[entry].concat(hr).slice(0,200);
    setHr(u);sv("a8_h",u);setHDate(toDay());setHRest("");setHAvg("");setHMax("");setHRec("");setHHrv("");setHSaved(true);
    setTimeout(function(){setHSaved(false);},2000);
  };

  var getM=function(m,f){return mData[m+"_"+f]||"";};
  var setM=function(m,f,v){setMData(function(prev){var n=Object.assign({},prev);n[m+"_"+f]=v;return n;});};

  var mTot=MEALS.reduce(function(a,m){a.cal+=parseFloat(getM(m,"cal"))||0;a.protein+=parseFloat(getM(m,"protein"))||0;a.carbs+=parseFloat(getM(m,"carbs"))||0;a.fat+=parseFloat(getM(m,"fat"))||0;return a;},{cal:0,protein:0,carbs:0,fat:0});

  var saveNu=function(){
    if(!nDate||!mTot.cal)return;
    var meals={};
    MEALS.forEach(function(m){var c=parseFloat(getM(m,"cal"))||0;if(c>0)meals[m]={cal:c,protein:parseFloat(getM(m,"protein"))||0,carbs:parseFloat(getM(m,"carbs"))||0,fat:parseFloat(getM(m,"fat"))||0};});
    var entry={date:nDate,dayType:nType,meals:meals,calories:Math.round(mTot.cal),protein:Math.round(mTot.protein),carbs:Math.round(mTot.carbs),fat:Math.round(mTot.fat),notes:nNotes};
    var u=[entry].concat(nutrition).slice(0,200);
    setNutrition(u);sv("a8_n",u);setMData({});setNDate(toDay());setNNotes("");setNSaved(true);
    setTimeout(function(){setNSaved(false);},2500);
  };

  // Analysis
  var A=analyze(week,plan,runs,strength,hr,nutrition);
  var score=A.score;var factors=A.factors;var avgRest=A.avgRest;var avgHRV=A.avgHRV;var wkMi=A.wkMi;var wkStr=A.wkStr;var wkRuns=A.wkRuns;
  var rClr=score>=8?C.good:score>=6?C.warn:C.hr;
  var nuT=NT[nType];
  var calSt=mTot.cal>0?(mTot.cal<nuT.calLow?"Under":mTot.cal>nuT.calHigh+200?"Over":"Good"):null;
  var calClr=calSt==="Good"?C.good:calSt?C.warn:C.textSoft;

  var progData=function(exId){
    return strength.filter(function(s){return s.sets&&s.sets.some(function(ex){return ex.id===exId;});}).slice(0,20).reverse().map(function(s){
      var ex=s.sets.find(function(ex2){return ex2.id===exId;});
      var w=ex?Math.max.apply(null,ex.logs.map(function(l){return l.weight;}).filter(function(w2){return w2>0;})):0;
      return w>0?{date:s.date.slice(5),weight:w}:null;
    }).filter(Boolean);
  };

  var l7hr=hr.slice(0,7);

  // Today/tomorrow plans
  var todayPlan=getPlannedForDate(today);
  var tmr=new Date();tmr.setDate(tmr.getDate()+1);
  var tmrStr=tmr.getFullYear()+"-"+String(tmr.getMonth()+1).padStart(2,"0")+"-"+String(tmr.getDate()).padStart(2,"0");
  var tmrPlan=getPlannedForDate(tmrStr);

  // Calendar cells builder
  var buildCalCells=function(y,m){
    var first=new Date(y,m,1);var last=new Date(y,m+1,0);var result=[];
    for(var i=0;i<first.getDay();i++)result.push(null);
    for(var d2=1;d2<=last.getDate();d2++){
      var ds=y+"-"+String(m+1).padStart(2,"0")+"-"+String(d2).padStart(2,"0");
      var pl=getPlannedForDate(ds);
      var hasRun=!!(pl.plan&&pl.runLabel&&pl.runLabel!=="REST");
      var hasStr=!!(pl.plan&&pl.strWkt);
      var lr=runs.find(function(r){return r.date===ds&&isRunActivity(r.type);})||null;
      var ls=strength.find(function(s){return s.date===ds;})||null;
      result.push({d:d2,dateStr:ds,hasRun:hasRun,hasStr:hasStr,loggedRun:lr,loggedStr:ls,planned:pl,isToday:ds===today});
    }
    return result;
  };

  // ── BOOT SCREEN ──────────────────────────────────────────────────
  if(!boot){
    return e("div",{style:{minHeight:"100vh",background:"linear-gradient(135deg,"+C.bg+","+C.bgDeep+")",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif"}},
      e("div",{style:{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}},
        [[15,20,"#0ea5e9"],[70,10,"#6366f1"],[80,65,"#8b5cf6"],[20,75,"#f59e0b"]].map(function(x,i){
          return e("div",{key:i,style:{position:"absolute",left:x[0]+"%",top:x[1]+"%",width:250,height:250,borderRadius:"50%",background:"radial-gradient(circle,"+x[2]+"12 0%,transparent 70%)"}});
        })
      ),
      e("div",{style:{position:"relative",textAlign:"center",padding:32}},
        e("div",{style:{width:72,height:72,borderRadius:20,background:"linear-gradient(135deg,#0ea5e9,#6366f1,#8b5cf6)",margin:"0 auto 18px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 12px 40px rgba(99,102,241,0.4)"}},
          e("span",{style:{fontSize:32,fontWeight:900,color:"#fff"}},"A")
        ),
        e("div",{style:{fontSize:28,fontWeight:900,color:C.text,letterSpacing:-0.5,marginBottom:2}},"ARIA"),
        e("div",{style:{fontSize:11,color:C.textSoft,letterSpacing:3,marginBottom:32,textTransform:"uppercase"}},"Training Intelligence"),
        e("div",{style:{width:180,height:3,background:C.bgDeep,borderRadius:2,margin:"0 auto",overflow:"hidden",border:"1px solid "+C.border}},
          e("div",{style:{height:"100%",width:bootPct+"%",background:"linear-gradient(90deg,#0ea5e9,#6366f1,#8b5cf6)",borderRadius:2,transition:"width 0.2s"}})
        ),
        e("div",{style:{marginTop:8,fontSize:12,color:C.textSoft}},Math.round(bootPct)+"%")
      )
    );
  }

  // ── MAIN RENDER ───────────────────────────────────────────────────
  return e("div",{style:{minHeight:"100vh",background:"linear-gradient(160deg,"+C.bg+","+C.bgDeep+")",color:C.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",paddingBottom:82,position:"relative"}},

    // Syncing indicator
    syncing?e("div",{style:{position:"fixed",top:12,right:12,zIndex:999,background:"#10b981",color:"#fff",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,boxShadow:"0 2px 8px rgba(16,185,129,0.4)"}},"Saving..."):null,

    // Background blobs
    e("div",{style:{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}},
      e("div",{style:{position:"absolute",top:-80,right:-80,width:320,height:320,borderRadius:"50%",background:"radial-gradient(circle,#6366f10a 0%,transparent 70%)"}}),
      e("div",{style:{position:"absolute",bottom:80,left:-60,width:240,height:240,borderRadius:"50%",background:"radial-gradient(circle,#0ea5e908 0%,transparent 70%)"}})
    ),

    e("div",{style:{position:"relative",zIndex:1,maxWidth:680,margin:"0 auto",padding:"0 16px"}},

      // ════════════════════════════════════════════
      // HOME TAB
      // ════════════════════════════════════════════
      tab==="home"?e("div",{style:{paddingTop:20}},

        // Top bar
        e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}},
          e("div",null,
            e("div",{style:{fontSize:23,fontWeight:800,color:C.text,letterSpacing:-0.4}},"Good "+greet()+" 👋"),
            e("div",{style:{fontSize:13,color:C.textSoft,marginTop:2}},"Week "+week+"/23 · "+getDTR()+" days to race")
          ),
          e("div",{style:{textAlign:"right"}},
            e("div",{style:{fontSize:26,fontWeight:900,color:rClr,lineHeight:1}},score,e("span",{style:{fontSize:12,color:C.textSoft,fontWeight:400}},"/10")),
            e("div",{style:{fontSize:9,color:C.textSoft,letterSpacing:1,textTransform:"uppercase"}},"Readiness")
          )
        ),

        // Weekly summary card
        e("div",{style:Object.assign({},glass(),{overflow:"hidden",marginBottom:14})},
          e("div",{style:{background:PHASE_GRAD[plan.phase],padding:"14px 16px"}},
            e("div",{style:{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.75)",letterSpacing:2,textTransform:"uppercase",marginBottom:2}},"Phase "+plan.phase+" · "+PHASE_NAME[plan.phase]),
            e("div",{style:{fontSize:16,fontWeight:800,color:"#fff",marginBottom:1}},(plan&&plan.dates)||""),
            (plan&&plan.recovery)?e("div",{style:{fontSize:11,color:"rgba(255,255,255,0.8)",marginTop:3}},"⚡ Recovery week — adaptation happens now"):null
          ),
          e("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",borderBottom:"1px solid "+C.border}},
            [{l:"Miles",v:wkMi.toFixed(1)+"/"+plan.miles,c:"#6366f1"},{l:"Runs",v:wkRuns.length,c:"#0ea5e9"},{l:"Strength",v:wkStr.length+"/3",c:"#f59e0b"},{l:"Nutrition",v:nutrition.filter(function(n){var nd=new Date(n.date+"T00:00:00");var planWkStart=new Date(PLAN_START);planWkStart.setDate(planWkStart.getDate()+(week-1)*7);var planWkEnd=new Date(planWkStart);planWkEnd.setDate(planWkEnd.getDate()+6);return nd>=planWkStart&&nd<=planWkEnd;}).length+"d",c:"#06b6d4"}].map(function(x,i){
              return e("div",{key:i,style:{textAlign:"center",padding:"10px 4px",borderRight:i<3?"1px solid "+C.border:"none"}},
                e("div",{style:{fontSize:17,fontWeight:900,color:x.c,lineHeight:1}},x.v),
                e("div",{style:{fontSize:9,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",marginTop:2}},x.l)
              );
            })
          ),
          e("div",{style:{padding:"12px 16px"}},
            e("div",{style:{fontSize:13,color:C.textMid,lineHeight:1.55}},A.summary),
            factors.length>0?e("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}},
              factors.map(function(f,i){return e("span",{key:i,style:{fontSize:10,padding:"2px 8px",borderRadius:10,background:C.warn+"12",color:C.warn,border:"1px solid "+C.warn+"25",fontWeight:700}},f);})
            ):null
          )
        ),

        // Today's plan
        e("div",{style:cardS({marginBottom:14})},
          e("div",{style:{fontSize:13,fontWeight:800,color:C.text,marginBottom:12}},"Today's Plan"),
          (todayPlan.runLabel||todayPlan.strWkt)?e("div",{style:{display:"flex",flexDirection:"column",gap:8}},
            todayPlan.runLabel&&todayPlan.runLabel!=="REST"?e("div",{style:{display:"flex",gap:10,alignItems:"center",padding:"10px 12px",background:runColor(todayPlan.runType||"run")+"08",border:"1px solid "+runColor(todayPlan.runType||"run")+"22",borderRadius:10}},
              e("div",{style:{width:36,height:36,borderRadius:10,background:runColor(todayPlan.runType||"run"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}},"🏃"),
              e("div",{style:{flex:1}},
                e("div",{style:{fontSize:12,fontWeight:700,color:runColor(todayPlan.runType||"run"),marginBottom:2}},(todayPlan.runType||"run").replace("_"," ").toUpperCase()),
                e("div",{style:{fontSize:13,fontWeight:600,color:C.text}},todayPlan.runLabel)
              ),
              runs.find(function(r){return r.date===today&&isRunActivity(r.type);})?e("span",{style:{fontSize:10,fontWeight:700,color:C.good}},"✓ Done"):null
            ):null,
            todayPlan.strWkt?e("div",{style:{display:"flex",gap:10,alignItems:"center",padding:"10px 12px",background:WKT_COLOR[todayPlan.strWkt]+"08",border:"1px solid "+WKT_COLOR[todayPlan.strWkt]+"22",borderRadius:10}},
              e("div",{style:{width:36,height:36,borderRadius:10,background:WKT_COLOR[todayPlan.strWkt],display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}},"⬡"),
              e("div",{style:{flex:1}},
                e("div",{style:{fontSize:12,fontWeight:700,color:WKT_COLOR[todayPlan.strWkt],marginBottom:2}},"WORKOUT "+todayPlan.strWkt),
                e("div",{style:{fontSize:13,fontWeight:600,color:C.text}},WKT_LABEL[todayPlan.strWkt]+" · "+WKT_DAY[todayPlan.strWkt])
              ),
              strength.find(function(s){return s.date===today;})?e("span",{style:{fontSize:10,fontWeight:700,color:C.good}},"✓ Done"):null
            ):null,
            (function(){
              var runDone=runs.find(function(r){return r.date===today&&isRunActivity(r.type);});
              var strDone=strength.find(function(s){return s.date===today;});
              var showRun=!!(todayPlan.runLabel&&todayPlan.runLabel!=="REST");
              var showStr=!!todayPlan.strWkt;
              if(!showRun&&!showStr)return null;
              return e("div",{style:{display:"flex",gap:8,flexWrap:"wrap",paddingTop:4}},
                showRun?(runDone?
                  e("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 14px",background:C.good+"12",border:"1px solid "+C.good+"25",borderRadius:10}},
                    e("span",{style:{fontSize:12,color:C.good,fontWeight:700}},"✓ Run Logged")
                  ):
                  e("button",{onClick:function(){setTab("run");},style:{flex:1,padding:"10px 14px",background:"linear-gradient(90deg,#0ea5e9,#6366f1)",border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(99,102,241,0.3)"}},"Log Today's Run")
                ):null,
                showStr?(strDone?
                  e("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 14px",background:C.good+"12",border:"1px solid "+C.good+"25",borderRadius:10}},
                    e("span",{style:{fontSize:12,color:C.good,fontWeight:700}},"✓ Strength Logged")
                  ):
                  e("button",{onClick:function(){setTab("strength");},style:{flex:1,padding:"10px 14px",background:"#f59e0b",border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(245,158,11,0.3)"}},"Log Strength")
                ):null
              );
            })()
          ):e("div",{style:{padding:14,background:C.recovery+"08",border:"1px solid "+C.recovery+"20",borderRadius:10,fontSize:13,color:C.recovery,fontWeight:600}},"🌿 Rest day — recovery is training too.")
        ),

        // Tomorrow preview
        (tmrPlan.runLabel||tmrPlan.strWkt)?e("div",{style:cardS({marginBottom:14})},
          e("div",{style:{fontSize:12,fontWeight:700,color:C.textSoft,marginBottom:10}},"Tomorrow"),
          e("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},
            tmrPlan.runLabel&&tmrPlan.runLabel!=="REST"?e("div",{style:{display:"flex",gap:7,alignItems:"center",padding:"7px 12px",background:runColor(tmrPlan.runType||"run")+"08",border:"1px solid "+runColor(tmrPlan.runType||"run")+"20",borderRadius:8,flex:1}},
              e("span",{style:{fontSize:14}},"🏃"),
              e("div",null,e("div",{style:{fontSize:11,fontWeight:700,color:runColor(tmrPlan.runType||"run")}},(tmrPlan.runType||"run").replace("_"," ").toUpperCase()),e("div",{style:{fontSize:12,color:C.text}},tmrPlan.runLabel))
            ):null,
            tmrPlan.strWkt?e("div",{style:{display:"flex",gap:7,alignItems:"center",padding:"7px 12px",background:WKT_COLOR[tmrPlan.strWkt]+"08",border:"1px solid "+WKT_COLOR[tmrPlan.strWkt]+"20",borderRadius:8,flex:1}},
              e("span",{style:{fontSize:14}},"⬡"),
              e("div",null,e("div",{style:{fontSize:11,fontWeight:700,color:WKT_COLOR[tmrPlan.strWkt]}},"WORKOUT "+tmrPlan.strWkt),e("div",{style:{fontSize:12,color:C.text}},WKT_LABEL[tmrPlan.strWkt]))
            ):null
          )
        ):null,

        // Priority action
        A.actions.length>0?e("div",{style:{padding:"12px 14px",background:C.hr+"08",border:"1px solid "+C.hr+"20",borderRadius:12,marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}},
          e("div",{style:{width:20,height:20,borderRadius:"50%",background:C.hr+"12",border:"1px solid "+C.hr+"30",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:C.hr,marginTop:1}},"!"),
          e("div",{style:{fontSize:13,color:C.text,lineHeight:1.5}},e("span",{style:{fontWeight:700,color:C.hr}},"Priority: "),A.actions[0].t)
        ):null

      ):null,

      // ════════════════════════════════════════════
      // CALENDAR TAB
      // ════════════════════════════════════════════
      tab==="calendar"?e("div",{style:{paddingTop:20}},
        e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}},
          e("button",{onClick:function(){setCalMonth(function(cm){return cm.m===0?{y:cm.y-1,m:11}:{y:cm.y,m:cm.m-1};});},style:{width:34,height:34,borderRadius:10,border:"1px solid rgba(99,102,241,0.14)",background:"rgba(255,255,255,0.82)",color:"#64748b",fontSize:17,cursor:"pointer"}},"‹"),
          e("div",{style:{textAlign:"center"}},
            e("div",{style:{fontSize:18,fontWeight:800,color:C.text}},MNAMES[calMonth.m]+" "+calMonth.y),
            e("div",{style:{fontSize:11,color:C.textSoft}},"Tap any day for details")
          ),
          e("button",{onClick:function(){setCalMonth(function(cm){return cm.m===11?{y:cm.y+1,m:0}:{y:cm.y,m:cm.m+1};});},style:{width:34,height:34,borderRadius:10,border:"1px solid rgba(99,102,241,0.14)",background:"rgba(255,255,255,0.82)",color:"#64748b",fontSize:17,cursor:"pointer"}},"›")
        ),
        e("div",{style:{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap",justifyContent:"center"}},
          [["Long Run","#6366f1"],["Easy Run","#0ea5e9"],["Tempo","#8b5cf6"],["Strength","#f59e0b"],["Rest","#10b981"]].map(function(x){
            return e("div",{key:x[0],style:{display:"flex",alignItems:"center",gap:4}},
              e("div",{style:{width:8,height:8,borderRadius:2,background:x[1]}}),
              e("span",{style:{fontSize:10,color:C.textSoft}},x[0])
            );
          })
        ),
        e("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}},
          ["Su","Mo","Tu","We","Th","Fr","Sa"].map(function(dn){return e("div",{key:dn,style:{textAlign:"center",fontSize:10,fontWeight:700,color:C.textSoft,padding:"4px 0"}},dn);})
        ),
        e("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}},
          buildCalCells(calMonth.y,calMonth.m).map(function(cell,ci){
            if(!cell)return e("div",{key:"empty-"+ci,style:{paddingBottom:"100%"}});
            var cellRunC=cell.loggedRun?runColor(cell.loggedRun.type):cell.hasRun?runColor(cell.planned.runType||"run"):null;
            var cellStrC=cell.hasStr&&cell.planned.strWkt?(WKT_COLOR[cell.planned.strWkt]||"#f59e0b"):null;
            return e("button",{key:cell.dateStr,onClick:function(){if(cell.hasRun||cell.hasStr)setDaySheet(cell.dateStr);},style:{padding:"4px 3px",borderRadius:10,border:cell.isToday?"2px solid #6366f1":"1px solid rgba(99,102,241,0.14)",background:cell.isToday?"rgba(99,102,241,0.08)":(cell.hasRun||cell.hasStr)?"rgba(255,255,255,0.82)":"transparent",cursor:(cell.hasRun||cell.hasStr)?"pointer":"default",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",position:"relative",minHeight:52}},
              e("div",{style:{fontSize:12,fontWeight:cell.isToday?800:(cell.hasRun||cell.hasStr)?600:400,color:cell.isToday?"#6366f1":(cell.hasRun||cell.hasStr)?C.text:C.textSoft,marginBottom:3,lineHeight:1}},cell.d),
              e("div",{style:{display:"flex",flexDirection:"column",gap:2,width:"100%",alignItems:"center"}},
                cellRunC?e("div",{style:{width:"70%",height:4,borderRadius:2,background:cell.loggedRun?cellRunC:cellRunC+"88"}}):null,
                cellStrC?e("div",{style:{width:"70%",height:4,borderRadius:2,background:cell.loggedStr?cellStrC:cellStrC+"88"}}):null
              ),
              (cell.loggedRun||cell.loggedStr)?e("div",{style:{position:"absolute",top:2,right:3,width:6,height:6,borderRadius:"50%",background:C.good}}):null
            );
          })
        ),
        e("div",{style:cardS({marginTop:14})},
          e("div",{style:{fontSize:12,fontWeight:700,color:C.textSoft,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}},"This Month"),
          e("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}},
            (function(){
              var yr=calMonth.y,mo=calMonth.m;
              var mRuns=runs.filter(function(r){try{var rd=new Date(r.date+"T00:00:00");return rd.getFullYear()===yr&&rd.getMonth()===mo;}catch(e2){return false;}});
              var mStr=strength.filter(function(s){try{var sd=new Date(s.date+"T00:00:00");return sd.getFullYear()===yr&&sd.getMonth()===mo;}catch(e2){return false;}});
              var mMiles=mRuns.reduce(function(a,r){return a+parseFloat(r.dist||0);},0).toFixed(1);
              return [{label:"Runs",val:mRuns.length,clr:"#0ea5e9"},{label:"Miles",val:mMiles,clr:"#6366f1"},{label:"Strength",val:mStr.length,clr:"#f59e0b"}].map(function(x,xi){
                return e("div",{key:xi,style:{textAlign:"center"}},
                  e("div",{style:{fontSize:22,fontWeight:900,color:x.clr}},x.val),
                  e("div",{style:{fontSize:10,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",marginTop:2}},x.label)
                );
              });
            })()
          )
        )
      ):null,

      // ════════════════════════════════════════════
      // INSIGHTS TAB
      // ════════════════════════════════════════════
      tab==="insights"?e("div",{style:{paddingTop:20}},
        e("div",{style:{fontSize:22,fontWeight:800,color:C.text,marginBottom:4,letterSpacing:-0.3}},"Training Insights"),
        e("div",{style:{fontSize:13,color:C.textSoft,marginBottom:16}},"Tap any card for science basis"),
        e("div",{style:cardS({marginBottom:12,background:rClr+"07",border:"1px solid "+rClr+"20"})},
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
            e("div",null,
              e("div",{style:{fontSize:12,color:C.textMid,marginBottom:3}},"Weekly Readiness"),
              e("div",{style:{fontSize:44,fontWeight:900,color:rClr,lineHeight:1}},score,e("span",{style:{fontSize:15,color:C.textSoft,fontWeight:400}},"/10"))
            ),
            e("div",{style:{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}},
              factors.map(function(f,i){return e("span",{key:i,style:{fontSize:10,padding:"2px 8px",borderRadius:10,background:C.warn+"10",color:C.warn,border:"1px solid "+C.warn+"22",fontWeight:700}},f);})
            )
          )
        ),
        A.actions.length>0?e("div",{style:cardS({marginBottom:12})},
          e("div",{style:{fontSize:11,fontWeight:700,color:C.hr,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}},"Priority Actions"),
          A.actions.map(function(a,i){
            return e("div",{key:i,style:{display:"flex",gap:9,alignItems:"flex-start",padding:"8px 0",borderBottom:i<A.actions.length-1?"1px solid "+C.border:"none"}},
              e("div",{style:{width:19,height:19,borderRadius:"50%",background:a.p===1?C.hr+"10":C.warn+"10",border:"1px solid "+(a.p===1?C.hr:C.warn)+"28",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:a.p===1?C.hr:C.warn,marginTop:1}},a.p),
              e("div",{style:{fontSize:13,color:C.text,lineHeight:1.5}},a.t)
            );
          })
        ):null,
        A.warnings.length>0?e("div",{style:cardS({marginBottom:12})},
          e("div",{style:{fontSize:11,fontWeight:700,color:C.warn,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}},"⚠ Flags ("+A.warnings.length+")"),
          A.warnings.map(function(item,i){return e(ICard,{key:i,item:item,type:"warn"});})
        ):null,
        A.positives.length>0?e("div",{style:cardS({marginBottom:12})},
          e("div",{style:{fontSize:11,fontWeight:700,color:C.good,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}},"✓ Positive Signals"),
          A.positives.map(function(item,i){return e(ICard,{key:i,item:item,type:"good"});})
        ):null,
        A.warnings.length===0&&A.positives.length===0?e("div",{style:cardS({textAlign:"center",padding:36,color:C.textSoft,fontSize:14})},"Log runs, HR, and nutrition to generate insights."):null
      ):null,

      // ════════════════════════════════════════════
      // LOG RUN TAB
      // ════════════════════════════════════════════
      tab==="run"?e("div",{style:{paddingTop:20}},
        e("div",{style:{fontSize:22,fontWeight:800,color:C.text,marginBottom:4,letterSpacing:-0.3}},"Log a Run"),
        e("div",{style:{fontSize:13,color:C.textSoft,marginBottom:18}},"Upload your Garmin data"),

        // CSV upload
        e("div",{style:Object.assign({},cardS({marginBottom:14}),{borderTop:"3px solid #f59e0b"})},
          e("div",{style:{fontSize:15,fontWeight:700,color:C.text,marginBottom:3}},"⬆ Garmin CSV — Bulk Import"),
          e("div",{style:{fontSize:12,color:C.textSoft,marginBottom:14}},"connect.garmin.com/activities → \"Export CSV\" (top right)"),
          e("div",{style:{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}},
            e("input",{ref:csvRef,type:"file",accept:".csv",onChange:handleCSV,style:{display:"none"}}),
            e(Btn,{onClick:function(){csvRef.current&&csvRef.current.click();},color:"#f59e0b",disabled:csvSt==="parsing"},csvSt==="parsing"?"Parsing…":"Upload Garmin CSV"),
            csvSt==="done"?e("span",{style:{fontSize:13,color:C.good,fontWeight:700}},"✓ "+csvCt+" activities imported"):null,
            csvSt==="error"?e("span",{style:{fontSize:13,color:C.hr,fontWeight:700}},"⚠ Parse error — check format"):null
          )
        ),

        // Manual paste
        e("div",{style:Object.assign({},cardS({marginBottom:14}),{borderTop:"3px solid #0ea5e9"})},
          e("div",{style:{fontSize:15,fontWeight:700,color:C.text,marginBottom:16}},"Paste Single Activity"),
          e("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}},
            e("div",null,e(Lbl,null,"Date"),e(Inp,{type:"date",max:today,value:rDate,onChange:function(ev){setRDate(ev.target.value);}})),
            e("div",null,e(Lbl,null,"Type"),e(Sel,{value:rType,onChange:function(ev){setRType(ev.target.value);},opts:[["run","Easy Run"],["long_run","Long Run"],["tempo","Tempo"],["intervals","Intervals"],["recovery","Recovery"]]}))
          ),
          e("div",{style:{marginBottom:12}},e(Lbl,null,"Garmin Activity Summary"),e(Inp,{value:rRaw,onChange:function(ev){setRRaw(ev.target.value);},placeholder:"Distance: 5.2 mi | Avg Pace: 8:57/mi | Avg HR: 158 bpm | Max HR: 174 bpm | HR Recovery: 28 bpm | Calories: 520",multi:true})),
          e("div",{style:{marginBottom:16}},e(Lbl,null,"Notes"),e(Inp,{value:rNotes,onChange:function(ev){setRNotes(ev.target.value);},placeholder:"How did it feel?"})),
          e("div",{style:{display:"flex",gap:10,alignItems:"center"}},e(Btn,{onClick:addRun,color:"#0ea5e9",disabled:!rDate||!rRaw.trim()},"Save Run"),e(Saved,{show:rSaved}))
        ),

        // Recent runs list
        runs.length>0?e("div",{style:cardS()},
          (function(){var runCt=runs.filter(function(r){return isRunActivity(r.type);}).length;var otherCt=runs.length-runCt;return e("div",{style:{fontSize:12,fontWeight:700,color:C.textSoft,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}},"Recent Activities · "+runCt+" run"+(runCt!==1?"s":"")+(otherCt>0?" + "+otherCt+" other":""));}()),
          runs.slice(0,8).map(function(r,i){
            var isRun=isRunActivity(r.type);var actColor=isRun?runColor(r.type):C.textSoft;
            return e("div",{key:i,style:{display:"flex",gap:10,padding:"9px 0",borderBottom:i<7?"1px solid "+C.border:"none",alignItems:"flex-start"}},
              e("div",{style:{width:6,borderRadius:3,background:actColor,alignSelf:"stretch",flexShrink:0,minHeight:36}}),
              e("div",{style:{flex:1}},
                e("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:3}},
                  e("span",{style:{fontSize:13,fontWeight:600,color:C.text}},r.date),
                  e("div",{style:{display:"flex",gap:5}},
                    e(Tag,{color:actColor},r.type),
                    r.week?e(Tag,{color:"#6366f1"},"Wk"+r.week):null
                  )
                ),
                e("div",{style:{display:"flex",gap:10,flexWrap:"wrap"}},
                  r.dist?e("span",{style:{fontSize:12,color:C.textMid}},r.dist+" mi"):null,
                  r.pace?e("span",{style:{fontSize:12,color:C.textMid}},r.pace+"/mi"):null,
                  r.hrAvg?e("span",{style:{fontSize:12,color:C.hr}},"HR "+r.hrAvg+"/"+(r.hrMax||"?")+"bpm"):null,
                  r.hrRec?e("span",{style:{fontSize:12,color:C.good}},"−"+r.hrRec+"bpm rec"):null
                )
              )
            );
          })
        ):null
      ):null,

      // ════════════════════════════════════════════
      // STRENGTH TAB
      // ════════════════════════════════════════════
      tab==="strength"?e("div",{style:{paddingTop:20}},
        e("div",{style:{fontSize:22,fontWeight:800,color:C.text,marginBottom:4,letterSpacing:-0.3}},"Log Strength Session"),
        e("div",{style:{fontSize:13,color:C.textSoft,marginBottom:18}},"Track your sets, reps, and weight"),

        // Workout selector
        e("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}},
          Object.entries(WORKOUTS).map(function(kw){
            var k=kw[0],w=kw[1];
            return e("button",{key:k,onClick:function(){setSWkt(k);setSSets({});},style:{padding:"10px 6px",background:sWkt===k?w.color+"14":C.bgDeep,border:"2px solid "+(sWkt===k?w.color:C.border),borderRadius:12,cursor:"pointer",textAlign:"center",transition:"all 0.2s"}},
              e("div",{style:{fontSize:15,fontWeight:900,color:sWkt===k?w.color:C.textMid}},k),
              e("div",{style:{fontSize:9,color:C.textSoft,marginTop:1}},w.day.split(" ")[0])
            );
          })
        ),

        // Workout logger
        e("div",{style:Object.assign({},cardS({marginBottom:14}),{borderTop:"3px solid "+WORKOUTS[sWkt].color})},
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}},
            e("div",null,
              e("div",{style:{fontSize:15,fontWeight:800,color:C.text}},WORKOUTS[sWkt].label),
              e("div",{style:{fontSize:12,color:C.textSoft,marginTop:2}},WORKOUTS[sWkt].day)
            ),
            e("div",{style:{width:"44%"}},e(Lbl,null,"Date"),e(Inp,{type:"date",max:today,value:sDate,onChange:function(ev){setSDate(ev.target.value);}}))
          ),
          WORKOUTS[sWkt].exercises.map(function(ex){
            var frames=getFrames(ex.id);
            return e("div",{key:ex.id,style:{background:C.bgDeep,borderRadius:11,padding:12,marginBottom:8,border:"1px solid "+C.border}},
              e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}},
                e("div",{style:{flex:1}},
                  e("div",{style:{fontSize:13,fontWeight:700,color:C.text}},ex.name),
                  e("div",{style:{fontSize:11,color:C.textSoft,marginTop:1}},ex.sets+" sets · "+ex.reps+(ex.note?" · "+ex.note:""))
                ),
                frames.length>0?e("button",{onClick:function(){setExModal(ex);},style:{padding:"5px 10px",background:WORKOUTS[sWkt].color+"10",border:"1px solid "+WORKOUTS[sWkt].color+"28",borderRadius:8,color:WORKOUTS[sWkt].color,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0,marginLeft:8}},"How to →"):null
              ),
              e("div",{style:{display:"flex",gap:5,flexWrap:"wrap"}},
                Array.from({length:ex.sets},function(_,i){
                  return e("div",{key:i,style:{display:"flex",gap:3,alignItems:"center",background:"rgba(255,255,255,0.8)",borderRadius:7,padding:"5px 7px",border:"1px solid "+C.border}},
                    e("span",{style:{fontSize:9,color:C.textSoft,minWidth:16}},"S"+(i+1)),
                    e("input",{value:getS(ex.id,i,"reps"),onChange:function(ev){setS(ex.id,i,"reps",ev.target.value);},placeholder:"reps",style:{width:38,background:"transparent",border:"1px solid "+C.border,borderRadius:5,color:C.text,fontSize:12,padding:"3px 5px",outline:"none",textAlign:"center"}}),
                    !ex.bw?e("input",{value:getS(ex.id,i,"weight"),onChange:function(ev){setS(ex.id,i,"weight",ev.target.value);},placeholder:"lbs",style:{width:38,background:"transparent",border:"1px solid "+C.border,borderRadius:5,color:C.text,fontSize:12,padding:"3px 5px",outline:"none",textAlign:"center"}}):null
                  );
                })
              )
            );
          }),
          e("div",{style:{marginBottom:14}},e(Lbl,null,"Notes"),e(Inp,{value:sNotes,onChange:function(ev){setSNotes(ev.target.value);},placeholder:"Form notes, energy level, anything notable…",multi:true})),
          e("div",{style:{display:"flex",gap:10,alignItems:"center"}},e(Btn,{onClick:addStr,color:WORKOUTS[sWkt].color,disabled:!sDate},"Save Session"),e(Saved,{show:sSaved}))
        ),

        // Weight progression
        strength.length>0?e("div",{style:cardS()},
          e("div",{style:{fontSize:12,fontWeight:700,color:C.textSoft,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}},"Weight Progression"),
          e("div",{style:{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}},
            Object.values(WORKOUTS).flatMap(function(w){return w.exercises.filter(function(ex){return !ex.bw;});}).map(function(ex){
              var d=progData(ex.id);if(!d.length)return null;
              return e("button",{key:ex.id,onClick:function(){setSView(sView===ex.id?null:ex.id);},style:{padding:"5px 10px",background:sView===ex.id?C.strength+"14":"rgba(0,0,0,0.04)",border:"1px solid "+(sView===ex.id?C.strength:C.border),borderRadius:18,color:sView===ex.id?C.strength:C.textMid,fontSize:11,cursor:"pointer",fontWeight:600,transition:"all 0.2s"}},ex.name);
            })
          ),
          sView?(function(){
            var d=progData(sView);
            if(!d||d.length<2)return null;
            var latest=d[d.length-1].weight;var first=d[0].weight;var gain=latest-first;
            var exName=(Object.values(WORKOUTS).flatMap(function(w){return w.exercises;}).find(function(ex){return ex.id===sView;})||{}).name||sView;
            var W2=280,H2=80,pad=8;
            var maxW=Math.max.apply(null,d.map(function(p){return p.weight;}));
            var minW=Math.min.apply(null,d.map(function(p){return p.weight;}));
            var range=Math.max(maxW-minW,1);
            var pts=d.map(function(p,i){
              var x=pad+(i/(d.length-1))*(W2-2*pad);
              var y=H2-pad-((p.weight-minW)/range)*(H2-2*pad);
              return x+","+y;
            }).join(" ");
            return e("div",{style:{background:C.bgDeep,borderRadius:10,padding:12,marginBottom:10}},
              e("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:10}},
                e("span",{style:{fontSize:14,fontWeight:700,color:C.text}},exName),
                e("div",{style:{display:"flex",gap:12}},
                  e("div",{style:{textAlign:"right"}},e("div",{style:{fontSize:8,color:C.textSoft,letterSpacing:1,textTransform:"uppercase"}},"Now"),e("div",{style:{fontSize:18,fontWeight:900,color:C.run}},latest+"lbs")),
                  gain>0?e("div",{style:{textAlign:"right"}},e("div",{style:{fontSize:8,color:C.textSoft,letterSpacing:1,textTransform:"uppercase"}},"Gained"),e("div",{style:{fontSize:18,fontWeight:900,color:C.good}},"+"+gain+"lbs")):null
                )
              ),
              e("svg",{width:"100%",height:H2,viewBox:"0 0 "+W2+" "+H2,style:{overflow:"visible"}},
                e("polyline",{points:pts,fill:"none",stroke:"#f59e0b",strokeWidth:2.5,strokeLinejoin:"round"}),
                d.map(function(p,i){
                  var x=pad+(i/(d.length-1))*(W2-2*pad);
                  var y=H2-pad-((p.weight-minW)/range)*(H2-2*pad);
                  return e("circle",{key:i,cx:x,cy:y,r:4,fill:"#f59e0b"});
                })
              )
            );
          })():null
        ):null
      ):null,

      // ════════════════════════════════════════════
      // NUTRITION TAB
      // ════════════════════════════════════════════
      tab==="nutrition"?e("div",{style:{paddingTop:20}},
        e("div",{style:{fontSize:22,fontWeight:800,color:C.text,marginBottom:4,letterSpacing:-0.3}},"Log Nutrition"),
        e("div",{style:{fontSize:13,color:C.textSoft,marginBottom:18}},"Enter your meals for the day"),

        // Day type selector
        e("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}},
          Object.entries(NT).map(function(kt){
            var k=kt[0],t=kt[1];
            return e("button",{key:k,onClick:function(){setNType(k);},style:Object.assign({},glass(),{padding:"11px 8px",textAlign:"center",cursor:"pointer",border:"2px solid "+(nType===k?"#06b6d4":C.border),background:nType===k?"rgba(6,182,212,0.06)":C.bgCard,transition:"all 0.2s"})},
              e("div",{style:{fontSize:10,fontWeight:700,color:nType===k?"#06b6d4":C.textSoft,letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}},k),
              e("div",{style:{fontSize:13,fontWeight:800,color:nType===k?"#06b6d4":C.text}},t.cal),
              e("div",{style:{fontSize:9,color:C.textSoft,marginTop:1}},"cal"),
              nType===k?e("div",{style:{fontSize:9,color:"#06b6d4",marginTop:3,fontWeight:700}},"● selected"):null
            );
          })
        ),

        // Meal log form
        e("div",{style:Object.assign({},cardS({marginBottom:14}),{borderTop:"3px solid #06b6d4"})},
          e("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}},
            e("div",null,e(Lbl,null,"Date"),e(Inp,{type:"date",max:today,value:nDate,onChange:function(ev){setNDate(ev.target.value);}})),
            e("div",null,e(Lbl,null,"Day Type"),e(Sel,{value:nType,onChange:function(ev){setNType(ev.target.value);},opts:[["run","Run Day (Sun/Tue/Thu)"],["strength","Strength Day (Mon/Wed/Fri)"],["rest","Rest Day"]]}))
          ),
          MEALS.map(function(meal){
            return e("div",{key:meal,style:{background:C.bgDeep,borderRadius:11,padding:12,marginBottom:8,border:"1px solid "+C.border}},
              e("div",{style:{fontSize:14,fontWeight:700,color:C.text,marginBottom:10}},MEAL_ICON[meal]+" "+meal.charAt(0).toUpperCase()+meal.slice(1)),
              e("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}},
                MACROS.map(function(mac){
                  return e("div",{key:mac.k},
                    e("div",{style:{fontSize:9,color:C.textSoft,marginBottom:3,letterSpacing:1,fontWeight:600,textTransform:"uppercase"}},mac.label),
                    e("input",{value:getM(meal,mac.k),onChange:function(ev){setM(meal,mac.k,ev.target.value);},placeholder:mac.ph,style:{width:"100%",background:"rgba(255,255,255,0.8)",border:"1px solid "+C.border,borderRadius:8,color:C.text,fontSize:13,padding:"8px 9px",outline:"none",boxSizing:"border-box"}})
                  );
                })
              )
            );
          }),
          mTot.cal>0?e("div",{style:{padding:"12px 14px",background:"rgba(6,182,212,0.06)",border:"1px solid rgba(6,182,212,0.2)",borderRadius:10,marginBottom:12}},
            e("div",{style:{fontSize:10,fontWeight:700,color:"#06b6d4",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}},"Daily Totals"),
            e("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}},
              [["Calories",Math.round(mTot.cal),calClr,calSt],["Protein",Math.round(mTot.protein)+"g",C.textMid,null],["Carbs",Math.round(mTot.carbs)+"g",C.textMid,null],["Fat",Math.round(mTot.fat)+"g",C.textMid,null]].map(function(x){
                return e("div",{key:x[0],style:{textAlign:"center"}},
                  e("div",{style:{fontSize:9,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",marginBottom:3,fontWeight:600}},x[0]),
                  e("div",{style:{fontSize:18,fontWeight:900,color:x[2],lineHeight:1}},x[1]),
                  x[3]?e("div",{style:{fontSize:9,color:x[2],marginTop:2,fontWeight:700}},x[3]):null
                );
              })
            )
          ):null,
          e("div",{style:{marginBottom:12}},e(Lbl,null,"Notes"),e(Inp,{value:nNotes,onChange:function(ev){setNNotes(ev.target.value);},placeholder:"Missed lunch, low energy, anything notable…",multi:true})),
          e("div",{style:{display:"flex",gap:10,alignItems:"center"}},e(Btn,{onClick:saveNu,color:"#06b6d4",disabled:!nDate||!mTot.cal},"Save Day"),e(Saved,{show:nSaved}))
        ),

        // Nutrition history
        nutrition.length>0?e("div",{style:cardS()},
          e("div",{style:{fontSize:12,fontWeight:700,color:C.textSoft,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}},"History · "+nutrition.length+" days"),
          nutrition.slice(0,8).map(function(n,i){
            var t=NT[n.dayType]||NT.rest;
            var cs=n.calories<t.calLow?"Under":n.calories>t.calHigh+200?"Over":"Good";
            var cc=cs==="Good"?C.good:C.warn;
            return e("div",{key:i,style:{padding:"9px 0",borderBottom:i<7?"1px solid "+C.border:"none"}},
              e("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:3}},
                e("span",{style:{fontSize:13,fontWeight:600,color:C.text}},n.date),
                e("div",{style:{display:"flex",gap:5}},
                  e(Tag,{color:n.dayType==="run"?C.run:n.dayType==="strength"?C.strength:C.recovery},n.dayType||"rest"),
                  e(Tag,{color:cc},cs)
                )
              ),
              e("div",{style:{display:"flex",gap:10,flexWrap:"wrap"}},
                e("span",{style:{fontSize:12,color:C.textMid}},n.calories+" cal"),
                n.protein?e("span",{style:{fontSize:12,color:C.textMid}},n.protein+"g protein"):null,
                n.carbs?e("span",{style:{fontSize:12,color:C.textSoft}},n.carbs+"g carbs"):null
              )
            );
          })
        ):null
      ):null,

      // ════════════════════════════════════════════
      // HEALTH TAB
      // ════════════════════════════════════════════
      tab==="health"?e("div",{style:{paddingTop:20}},
        e("div",{style:{fontSize:22,fontWeight:800,color:C.text,marginBottom:4,letterSpacing:-0.3}},"Heart Rate & HRV"),
        e("div",{style:{fontSize:13,color:C.textSoft,marginBottom:18}},"Track recovery and fitness trends"),

        hr.length>0?e("div",{style:Object.assign({},cardS({marginBottom:14}),{borderTop:"3px solid "+C.hr})},
          e("div",{style:{display:"flex",gap:18,marginBottom:14}},
            e("div",null,e("div",{style:{fontSize:10,fontWeight:700,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",marginBottom:3}},"Avg Resting HR"),e("div",{style:{fontSize:28,fontWeight:900,color:C.hr,lineHeight:1}},avgRest||"—",e("span",{style:{fontSize:12,color:C.textSoft,fontWeight:400}},"bpm"))),
            e("div",null,e("div",{style:{fontSize:10,fontWeight:700,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",marginBottom:3}},"Avg HRV"),e("div",{style:{fontSize:28,fontWeight:900,color:C.good,lineHeight:1}},avgHRV||"—",e("span",{style:{fontSize:12,color:C.textSoft,fontWeight:400}},"ms"))),
            e("div",{style:{marginLeft:"auto",textAlign:"right"}},e("div",{style:{fontSize:10,fontWeight:700,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",marginBottom:3}},"Trend"),
              l7hr.length>=2&&l7hr[0].resting&&l7hr[1].resting?e("div",{style:{fontSize:14,fontWeight:800,color:l7hr[0].resting<l7hr[1].resting?C.good:C.warn}},l7hr[0].resting<l7hr[1].resting?"↓ Better":"↑ Watch"):e("div",{style:{fontSize:14,color:C.textSoft}},"—")
            )
          ),
          // HR trend SVG chart
          hr.filter(function(h){return h.resting;}).length>=3?(function(){
            var hData=hr.filter(function(h){return h.resting;}).slice(0,14).reverse();
            if(hData.length<2)return null;
            var W2=280,H2=80,pad=8;
            var maxH=Math.max.apply(null,hData.map(function(p){return p.resting;}));
            var minH=Math.min.apply(null,hData.map(function(p){return p.resting;}));
            var range=Math.max(maxH-minH,1);
            var pts=hData.map(function(p,i){
              var x=pad+(i/(hData.length-1))*(W2-2*pad);
              var y=H2-pad-((p.resting-minH)/range)*(H2-2*pad);
              return x+","+y;
            }).join(" ");
            return e("div",{style:{marginBottom:10}},
              e("div",{style:{fontSize:10,fontWeight:700,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Resting HR Trend"),
              e("svg",{width:"100%",height:H2,viewBox:"0 0 "+W2+" "+H2,style:{overflow:"visible"}},
                e("polyline",{points:pts,fill:"none",stroke:"#ef4444",strokeWidth:2.5,strokeLinejoin:"round"}),
                hData.map(function(p,i){
                  var x=pad+(i/(hData.length-1))*(W2-2*pad);
                  var y=H2-pad-((p.resting-minH)/range)*(H2-2*pad);
                  return e("circle",{key:i,cx:x,cy:y,r:4,fill:"#ef4444"});
                })
              )
            );
          })():null,
          l7hr.map(function(h,i){
            return e("div",{key:i,style:{display:"flex",justifyContent:"space-between",padding:"7px 0",borderTop:"1px solid "+C.border}},
              e("span",{style:{fontSize:12,color:C.textSoft,minWidth:78}},h.date),
              e("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}},
                h.resting?e("span",{style:{fontSize:12,color:C.hr}},"Rest "+h.resting+"bpm"):null,
                h.runAvg?e("span",{style:{fontSize:12,color:C.warn}},"Run "+h.runAvg+"/"+(h.runMax||"?")+"bpm"):null,
                h.hrRecovery?e("span",{style:{fontSize:12,color:C.good}},"−"+h.hrRecovery+"bpm rec"):null,
                h.hrv?e("span",{style:{fontSize:12,color:C.run}},"HRV "+h.hrv+"ms"):null
              )
            );
          })
        ):null,

        // HR log form
        e("div",{style:Object.assign({},cardS(),{borderTop:"3px solid "+C.hr})},
          e("div",{style:{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}},"Log Heart Rate Data"),
          e("div",{style:{fontSize:12,color:C.textSoft,marginBottom:14}},"Resting HR → Health Stats · Run HR → Activity · HRV → HRV Status"),
          e("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}},
            e("div",null,e(Lbl,null,"Date"),e(Inp,{type:"date",max:today,value:hDate,onChange:function(ev){setHDate(ev.target.value);}})),
            e("div",null,e(Lbl,null,"Resting HR (bpm)"),e(Inp,{value:hRest,onChange:function(ev){setHRest(ev.target.value);},placeholder:"e.g. 52"})),
            e("div",null,e(Lbl,null,"Run Avg HR (bpm)"),e(Inp,{value:hAvg,onChange:function(ev){setHAvg(ev.target.value);},placeholder:"e.g. 158"})),
            e("div",null,e(Lbl,null,"Run Max HR (bpm)"),e(Inp,{value:hMax,onChange:function(ev){setHMax(ev.target.value);},placeholder:"e.g. 174"})),
            e("div",null,e(Lbl,null,"HR Recovery (1-min)"),e(Inp,{value:hRec,onChange:function(ev){setHRec(ev.target.value);},placeholder:"e.g. 28"})),
            e("div",null,e(Lbl,null,"HRV (ms)"),e(Inp,{value:hHrv,onChange:function(ev){setHHrv(ev.target.value);},placeholder:"e.g. 48"}))
          ),
          e("div",{style:{display:"flex",gap:10,alignItems:"center"}},e(Btn,{onClick:addHR,color:C.hr,disabled:!hDate},"Save HR Data"),e(Saved,{show:hSaved}))
        )
      ):null

    ),

    // ── BOTTOM TAB BAR ──────────────────────────────────────────────
    e("div",{style:{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"rgba(240,244,255,0.94)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:"1px solid "+C.border,padding:"5px 0 max(5px,env(safe-area-inset-bottom))"}},
      e("div",{style:{maxWidth:680,margin:"0 auto",display:"flex",justifyContent:"space-around"}},
        TABS.map(function(t){
          return e("button",{key:t.id,onClick:function(){setTab(t.id);},style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"3px 1px",background:"none",border:"none",cursor:"pointer"}},
            e("div",{style:{fontSize:16,lineHeight:1,opacity:tab===t.id?1:0.3,transition:"opacity 0.2s"}},t.icon),
            e("div",{style:{fontSize:8,fontWeight:tab===t.id?800:500,color:tab===t.id?"#6366f1":C.textSoft,letterSpacing:0.3,textTransform:"uppercase"}},t.label),
            tab===t.id?e("div",{style:{width:14,height:2.5,borderRadius:2,background:"#6366f1"}}):null
          );
        })
      )
    ),

    // Day sheet modal
    daySheet?e(DaySheet,{dateStr:daySheet,runs:runs,strength:strength,onClose:function(){setDaySheet(null);}}):null,
    // Exercise modal from strength tab
    exModal?e(ExModal,{ex:exModal,color:WORKOUTS[sWkt]&&WORKOUTS[sWkt].color||C.strength,onClose:function(){setExModal(null);}}):null
  );
}

ReactDOM.render(R.createElement(App),document.getElementById("root"));
