const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE";           // 13.333 x 7.5
p.author = "Nordic Bio Cosmetic Production Oy";
p.title  = "Where is that pallet?";

const INK="101314", INK2="3D4644", MUTED="6D7673", STONE="F2F3F0", WHITE="FFFFFF",
      ACCENT="C9990B", ACCENT_L="E6B93C", GREEN="1E7A4C", GREENW="DCEEE3",
      RED="A93B2C", REDW="F6DFDA", RULE="D3D7D0", DARKCARD="1D2221";
const HEAD="Cambria", BODY="Calibri", MONO="Courier New";
const M=0.75, W=13.333, CW=W-2*M;

const sh = () => ({ type:"outer", color:"101314", blur:14, offset:3, angle:90, opacity:0.10 });

function slide(dark){
  const s=p.addSlide();
  s.background={ color: dark?INK:STONE };
  return s;
}
function tag(s,t,dark){
  s.addText(t.toUpperCase(),{x:M,y:0.55,w:CW,h:0.3,fontSize:11,bold:true,charSpacing:2.2,
    fontFace:MONO,color:dark?ACCENT_L:ACCENT,margin:0,valign:"middle"});
}
function title(s,t,opts){
  const o=opts||{};
  s.addText(t,{x:M,y:o.y||1.0,w:o.w||CW,h:o.h||1.15,fontSize:o.size||38,bold:true,
    fontFace:HEAD,color:o.color||INK,margin:0,valign:"top",lineSpacing:o.size?o.size*1.12:43});
}
function body(s,t,o){
  s.addText(t,{x:o.x,y:o.y,w:o.w,h:o.h,fontSize:o.size||15,fontFace:BODY,color:o.color||INK2,
    margin:0,valign:o.valign||"top",lineSpacing:o.size?o.size*1.5:23,align:o.align||"left",bold:o.bold||false});
}
function card(s,o){
  s.addShape(p.ShapeType.roundRect,{x:o.x,y:o.y,w:o.w,h:o.h,rectRadius:0.06,
    fill:{color:o.fill||WHITE},line:{color:o.line||RULE,width:o.lw||1},shadow:o.noshadow?undefined:sh()});
}
function chip(s,o){
  s.addShape(p.ShapeType.roundRect,{x:o.x,y:o.y,w:o.w,h:o.h||0.36,rectRadius:0.18,
    fill:{color:o.fill},line:{color:o.line||o.fill,width:1}});
  s.addText(o.text,{x:o.x,y:o.y,w:o.w,h:o.h||0.36,fontSize:o.size||11.5,fontFace:MONO,
    color:o.color,align:"center",valign:"middle",margin:0,bold:o.bold||false});
}
function note(s,t){ s.addNotes(t); }

/* ---------------- 1 · TITLE ---------------- */
{
  const s=slide(true);
  s.addText("NORDIC BIO COSMETIC PRODUCTION OY   ·   PROPOSAL   ·   AUGUST 2026",
    {x:M,y:1.75,w:CW,h:0.3,fontSize:11.5,bold:true,charSpacing:2.2,fontFace:MONO,color:ACCENT_L,margin:0});
  s.addText("Where is that pallet?",{x:M,y:2.3,w:11,h:1.5,fontSize:60,bold:true,fontFace:HEAD,color:WHITE,margin:0});
  s.addText("A simple system that always knows the answer —\nand remembers who moved it, and when.",
    {x:M,y:3.95,w:8.6,h:1.0,fontSize:19,fontFace:BODY,color:"C6CCC8",margin:0,lineSpacing:30});
  const items=[["2 stickers",2.55],["2 scans",2.3],["1 honest record",3.2]];
  let x=M;
  items.forEach(function(it){
    chip(s,{x:x,y:5.25,w:it[1],h:0.44,text:it[0],fill:DARKCARD,line:"3A423F",color:ACCENT_L,size:13});
    x+=it[1]+0.22;
  });
  note(s,"Opening: today nobody can answer this question quickly. This is a proposal to change that with two stickers and two scans.");
}

/* ---------------- 2 · THE STORY ---------------- */
{
  const s=slide(false); tag(s,"Tuesday, 09:14");
  title(s,"“I know we have amber jars\nsomewhere. I just don't\nknow where.”",{size:34,w:7.0,h:2.6});
  s.addText("MIKAEL, WAREHOUSE",{x:M,y:3.9,w:6,h:0.3,fontSize:11,bold:true,charSpacing:2,fontFace:MONO,color:MUTED,margin:0});
  card(s,{x:7.5,y:1.55,w:5.1,h:3.9});
  body(s,"He walks aisle A. Then aisle C. He climbs to check the top level. Twenty minutes later he gives up and tells the office the jars are finished.",
    {x:7.9,y:1.95,w:4.3,h:1.3,size:15});
  body(s,"They were not finished.",{x:7.9,y:3.3,w:4.3,h:0.35,size:16,color:RED,bold:true});
  body(s,"A pallet of 4 800 jars was standing in aisle B, where somebody put it last Thursday because aisle A was full that day.",
    {x:7.9,y:3.75,w:4.3,h:1.1,size:15});
  body(s,"Nobody did anything wrong. The information lived in one person's head — and that person was on holiday.",
    {x:M,y:4.6,w:6.4,h:1.1,size:15});
  note(s,"A real scenario everyone recognises. Nobody is at fault; the information simply has nowhere to live.");
}

/* ---------------- 3 · THE COST ---------------- */
{
  const s=slide(false); tag(s,"What that costs");
  title(s,"Four quiet losses",{size:38});
  const data=[
    ["20","min/day","Every person, every day, spent walking and looking instead of working."],
    ["2×","ordered","Material bought again because the first pallet could not be found."],
    ["Oldest","at the back","The newest pallet is easiest to reach, so the old one quietly ages."],
    ["No","history","When something goes wrong, nobody can say what happened, or when."]
  ];
  const cw=2.74, gap=0.28;
  data.forEach(function(d,i){
    const x=M+i*(cw+gap);
    card(s,{x:x,y:2.45,w:cw,h:2.9});
    s.addText([{text:d[0],options:{fontSize:33,bold:true,color:INK}},
               {text:"  "+d[1],options:{fontSize:14,color:MUTED}}],
      {x:x+0.28,y:2.72,w:cw-0.56,h:1.15,fontFace:HEAD,margin:0,valign:"top",lineSpacing:36});
    body(s,d[2],{x:x+0.28,y:3.95,w:cw-0.56,h:1.25,size:13});
  });
  body(s,"None of these is dramatic on any single day. Together they are why the warehouse feels busy without getting more done.",
    {x:M,y:5.6,w:11.4,h:0.7,size:15});
  note(s,"Quantify the problem without overclaiming: these are the four ways the missing information costs money.");
}

/* ---------------- 4 · THE IDEA ---------------- */
{
  const s=slide(true); tag(s,"The idea",true);
  s.addText("Give every shelf a house number.\nGive every pallet a name tag.",
    {x:M,y:1.6,w:11.5,h:2.0,fontSize:42,bold:true,fontFace:HEAD,color:WHITE,margin:0,lineSpacing:52});
  body(s,"Then a phone camera can connect the two in six seconds — and the warehouse can answer questions instead of guessing.",
    {x:M,y:3.85,w:8.4,h:1.0,size:18,color:"C6CCC8"});
  const items=["No new equipment","No app to install","No change to how pallets move","10 minutes of training"];
  const ws=[2.55,2.42,3.55,2.42]; let x=M;
  items.forEach(function(t,i){
    chip(s,{x:x,y:5.35,w:ws[i],h:0.46,text:t,fill:DARKCARD,line:"3A423F",color:"D9DFDB",size:12});
    x+=ws[i]+0.18;
  });
  note(s,"The whole proposal in one line. Emphasise what does NOT change — that is what makes it adoptable.");
}

/* ---------------- 5 · THE TWO STICKERS ---------------- */
{
  const s=slide(false); tag(s,"The two stickers");
  title(s,"This is the whole system.",{size:38});
  body(s,"One sticker stays on the rack forever. One label is printed when a pallet is created, and thrown away when the pallet is empty.",
    {x:M,y:2.35,w:5.6,h:1.2,size:15});
  body(s,"These two codes are real. Point a phone camera at the screen and it will read 14250-001 and LOC-A-01-3. That is everything the app needs.",
    {x:M,y:3.7,w:5.6,h:1.3,size:15});
  // pallet label
  card(s,{x:6.9,y:1.85,w:5.7,h:1.95,line:INK,lw:2.25});
  s.addImage({path:"qr-pallet.png",x:7.15,y:2.05,w:1.55,h:1.55});
  s.addText("14250",{x:8.85,y:2.08,w:3.4,h:0.62,fontSize:34,bold:true,fontFace:HEAD,color:INK,margin:0});
  s.addText("PALLET 001",{x:8.87,y:2.66,w:3.4,h:0.25,fontSize:10,fontFace:MONO,color:MUTED,charSpacing:1.6,margin:0});
  s.addText("Amber Jar 50 ml",{x:8.87,y:2.94,w:3.4,h:0.3,fontSize:14.5,bold:true,fontFace:BODY,color:INK,margin:0});
  s.addText("120 pcs  ·  + 1 more item",{x:8.87,y:3.24,w:3.4,h:0.28,fontSize:12.5,fontFace:BODY,color:INK2,margin:0});
  // location label
  card(s,{x:6.9,y:4.05,w:5.7,h:1.95,line:GREEN,lw:2.25});
  s.addImage({path:"qr-loc.png",x:7.15,y:4.25,w:1.55,h:1.55});
  s.addText("A-01-3",{x:8.85,y:4.3,w:3.4,h:0.6,fontSize:30,bold:true,fontFace:HEAD,color:GREEN,margin:0});
  s.addText("LOCATION",{x:8.87,y:4.86,w:3.4,h:0.25,fontSize:10,fontFace:MONO,color:MUTED,charSpacing:1.6,margin:0});
  s.addText("Aisle A · Rack 01 · Level 3",{x:8.87,y:5.14,w:3.4,h:0.3,fontSize:14.5,bold:true,fontFace:BODY,color:INK,margin:0});
  s.addText("holds 1 pallet",{x:8.87,y:5.44,w:3.4,h:0.28,fontSize:12.5,fontFace:BODY,color:INK2,margin:0});
  note(s,"Hand the room a printed copy of these two labels. Let someone scan them with their own phone — it makes the idea concrete in five seconds.");
}

/* ---------------- 6 · THE PALLET NUMBER ---------------- */
{
  const s=slide(false); tag(s,"The pallet number");
  title(s,"Your own product number, plus a counter.",{size:36,w:10.5});
  card(s,{x:M,y:2.5,w:11.83,h:2.05});
  s.addText([{text:"14250",options:{color:INK}},{text:"-001",options:{color:ACCENT}}],
    {x:M,y:2.75,w:11.83,h:0.85,fontSize:50,bold:true,fontFace:MONO,align:"center",margin:0});
  s.addText("YOUR PRODUCT NUMBER",{x:2.6,y:3.7,w:3.4,h:0.25,fontSize:10,bold:true,charSpacing:1.5,fontFace:MONO,color:MUTED,align:"center",margin:0});
  body(s,"Typed once. The name appears by itself.",{x:2.6,y:3.98,w:3.4,h:0.5,size:13,align:"center"});
  s.addText("ADDED BY THE SYSTEM",{x:7.3,y:3.7,w:3.4,h:0.25,fontSize:10,bold:true,charSpacing:1.5,fontFace:MONO,color:MUTED,align:"center",margin:0});
  body(s,"“The first pallet of 14250 we ever had.” Nobody types this.",{x:7.3,y:3.98,w:3.4,h:0.5,size:13,align:"center"});
  body(s,"Staff read it as “a pallet of 14250” — exactly how they already speak. The three extra digits are what let the system tell three identical pallets apart, which is the difference between knowing and guessing.",
    {x:M,y:4.9,w:11.4,h:1.0,size:15});
  note(s,"This is the one design decision worth defending: without the counter, two identical pallets are indistinguishable and locations become fiction.");
}

/* ---------------- 7 · CREATE A PALLET ---------------- */
{
  const s=slide(false); tag(s,"Example one");
  title(s,"A delivery arrives.",{size:38});
  body(s,"Mikael opens the app and fills in three things. The product name appears by itself as soon as he types the number — so nobody can spell the same jar two different ways.",
    {x:M,y:2.4,w:5.6,h:1.4,size:15});
  body(s,"He presses Create pallet. The system prints a label. He slips it into the plastic pocket on the pallet.",
    {x:M,y:3.95,w:5.6,h:1.0,size:15});
  s.addText("ELAPSED: ABOUT 30 SECONDS",{x:M,y:5.15,w:5.6,h:0.3,fontSize:11,bold:true,charSpacing:1.8,fontFace:MONO,color:MUTED,margin:0});
  card(s,{x:7.3,y:1.85,w:5.3,h:3.85});
  s.addText("CREATE PALLET",{x:7.65,y:2.15,w:4.6,h:0.3,fontSize:10.5,bold:true,charSpacing:1.8,fontFace:MONO,color:ACCENT,margin:0});
  const rows=[["Product ID","14250",MONO,INK],["Name","Amber Jar 50 ml  ✓",BODY,GREEN],["Quantity","120 pcs",MONO,INK]];
  rows.forEach(function(r,i){
    const y=2.65+i*0.62;
    s.addText(r[0],{x:7.65,y:y,w:1.75,h:0.4,fontSize:14,fontFace:BODY,color:MUTED,margin:0,valign:"middle"});
    s.addText(r[1],{x:9.5,y:y,w:2.75,h:0.4,fontSize:14,bold:true,fontFace:r[2],color:r[3],margin:0,valign:"middle",align:"right"});
    s.addShape(p.ShapeType.line,{x:7.65,y:y+0.45,w:4.6,h:0,line:{color:RULE,width:1}});
  });
  s.addText("+ Add another product to this pallet",{x:7.65,y:4.55,w:4.6,h:0.3,fontSize:13,fontFace:BODY,color:ACCENT,margin:0});
  s.addShape(p.ShapeType.roundRect,{x:7.65,y:5.0,w:4.6,h:0.5,rectRadius:0.06,fill:{color:GREEN},line:{color:GREEN,width:1}});
  s.addText("Create pallet & print label",{x:7.65,y:5.0,w:4.6,h:0.5,fontSize:14.5,bold:true,fontFace:BODY,color:WHITE,align:"center",valign:"middle",margin:0});
  note(s,"Show that data entry happens once per pallet, not per movement — and that the product list prevents inconsistent naming.");
}

/* ---------------- 8 · PUTTING IT AWAY ---------------- */
{
  const s=slide(false); tag(s,"Example two");
  title(s,"Putting it on the shelf.",{size:38});
  const steps=[["STEP 1","Scan the shelf","Point the phone at the sticker on the rack beam.","2 seconds",WHITE,RULE,INK],
               ["STEP 2","Scan the pallet","Point it at the label in the pallet pocket.","2 seconds",WHITE,RULE,INK],
               ["STEP 3","Confirm","The screen shows what will happen. One tap.","2 seconds",WHITE,RULE,INK],
               ["RESULT","The shelf turns red","On every screen in the building, within a second.","instant",REDW,RED,RED]];
  const cw=2.74, gap=0.28;
  steps.forEach(function(d,i){
    const x=M+i*(cw+gap);
    card(s,{x:x,y:2.5,w:cw,h:2.5,fill:d[4],line:d[5],lw:i===3?1.75:1});
    s.addText(d[0],{x:x+0.3,y:2.78,w:cw-0.6,h:0.25,fontSize:10.5,bold:true,charSpacing:1.6,fontFace:MONO,color:i===3?RED:ACCENT,margin:0});
    s.addText(d[1],{x:x+0.3,y:3.1,w:cw-0.6,h:0.65,fontSize:17,bold:true,fontFace:HEAD,color:d[6],margin:0,valign:"top"});
    body(s,d[2],{x:x+0.3,y:3.8,w:cw-0.6,h:0.85,size:13.5});
    s.addText(d[3],{x:x+0.3,y:4.62,w:cw-0.6,h:0.25,fontSize:11,fontFace:MONO,color:MUTED,margin:0});
  });
  body(s,"Nothing is saved until both scans are done. If someone is interrupted halfway, the app forgets it after ninety seconds and records nothing at all.",
    {x:M,y:5.4,w:11.4,h:0.8,size:15});
  note(s,"Six seconds, three taps. Stress that a half-finished scan records nothing — no phantom data.");
}

/* ---------------- 9 · THE MAP ---------------- */
{
  const s=slide(false); tag(s,"The screen on the office wall");
  title(s,"Green means free. Red means full.",{size:38});
  card(s,{x:M,y:2.4,w:11.83,h:3.1});
  s.addText("AISLE A — LIVE",{x:1.05,y:2.65,w:4,h:0.3,fontSize:11,bold:true,charSpacing:1.8,fontFace:MONO,color:MUTED,margin:0});
  const occ={"01-3":1,"05-3":1,"02-2":1,"06-2":1};
  const bays=["01","02","03","04","05","06"], lv=["3","2"];
  const cellW=1.72, cellH=0.86, gx=0.14, x0=1.05, y0=3.05;
  lv.forEach(function(l,r){
    bays.forEach(function(b,c){
      const id=b+"-"+l, taken=!!occ[id];
      const x=x0+c*(cellW+gx), y=y0+r*(cellH+gx);
      s.addShape(p.ShapeType.roundRect,{x:x,y:y,w:cellW,h:cellH,rectRadius:0.04,
        fill:{color:taken?REDW:GREENW},line:{color:taken?RED:GREEN,width:1}});
      s.addText(id,{x:x,y:y,w:cellW,h:cellH,fontSize:12,bold:true,fontFace:MONO,
        color:taken?RED:GREEN,align:"center",valign:"middle",margin:0});
    });
  });
  chip(s,{x:1.05,y:4.93,w:0.34,h:0.26,text:"",fill:GREENW,line:GREEN,color:GREEN});
  s.addText("Empty — ready for a pallet",{x:1.48,y:4.9,w:3.1,h:0.32,fontSize:13,fontFace:BODY,color:INK2,margin:0,valign:"middle"});
  chip(s,{x:4.75,y:4.93,w:0.34,h:0.26,text:"",fill:REDW,line:RED,color:RED});
  s.addText("Occupied — tap to see what is there",{x:5.18,y:4.9,w:4.2,h:0.32,fontSize:13,fontFace:BODY,color:INK2,margin:0,valign:"middle"});
  body(s,"Every square is one shelf place, with its code written on it. Tap one and you see the pallet standing there, who put it there, and when. The screen updates itself the moment anyone scans.",
    {x:M,y:5.7,w:11.4,h:0.9,size:15});
  note(s,"This is the slide that sells it. If there is a screen in the room, open the live version and click a square.");
}

/* ---------------- 10 · TAKING IT ---------------- */
{
  const s=slide(false); tag(s,"Example three");
  title(s,"Production needs the jars.",{size:38});
  body(s,"Anna scans the shelf, scans the pallet, taps Take. The square turns green again and is offered to the next pallet that needs a home.",
    {x:M,y:2.4,w:5.3,h:1.3,size:15});
  body(s,"If she brings it back with 60 jars left, she puts it anywhere that is green and does the same two scans. The system does not mind where — it only wants to know.",
    {x:M,y:3.85,w:5.3,h:1.4,size:15});
  const rows=[["09:41","Scan shelf + pallet → Take","A-01-3 turns green. The pallet is “in Anna's hands”, not lost."],
              ["13:20","Back with 60 jars left","She scans B-02-1 and the pallet. B-02-1 turns red."],
              ["FRIDAY","Last jars used → Close","The shelf turns green, the label goes in the bin."]];
  rows.forEach(function(r,i){
    const y=2.0+i*1.25;
    card(s,{x:6.9,y:y,w:5.7,h:1.05});
    s.addText(r[0],{x:7.2,y:y+0.16,w:1.3,h:0.3,fontSize:11.5,bold:true,charSpacing:1.4,fontFace:MONO,color:ACCENT,margin:0});
    s.addText(r[1],{x:7.2,y:y+0.44,w:5.1,h:0.3,fontSize:15,bold:true,fontFace:HEAD,color:INK,margin:0});
    body(s,r[2],{x:7.2,y:y+0.72,w:5.1,h:0.28,size:12.5});
  });
  note(s,"The daily loop. Emphasise: a pallet is never nowhere — between shelves it is 'in someone's hands', and that is visible.");
}

/* ---------------- 11 · FINDING ---------------- */
{
  const s=slide(false); tag(s,"Example four");
  title(s,"“Where are the amber\njars?”",{size:36,w:6.2,h:1.3});
  body(s,"Type the name or the number. Every place holding it appears, oldest pallet first — so the right one to take is always at the top of the list.",
    {x:M,y:2.55,w:5.4,h:1.3,size:15});
  body(s,"This is the change people notice in the first week. Twenty minutes of walking becomes three seconds of typing.",
    {x:M,y:3.9,w:5.4,h:1.0,size:15,bold:true,color:INK});
  s.addShape(p.ShapeType.roundRect,{x:6.9,y:2.0,w:5.7,h:0.55,rectRadius:0.27,fill:{color:"E7E9E4"},line:{color:RULE,width:1}});
  s.addText("amber jar",{x:7.3,y:2.0,w:5.0,h:0.55,fontSize:15,fontFace:MONO,color:INK2,valign:"middle",margin:0});
  const res=[["14250-004  ·  A-01-3","oldest — take this",ACCENT],
             ["14250-005  ·  B-02-1","120 pcs",MUTED],
             ["14250-007  ·  C-03-2","120 pcs",MUTED]];
  card(s,{x:6.9,y:2.75,w:5.7,h:2.15});
  res.forEach(function(r,i){
    const y=2.95+i*0.65;
    s.addText(r[0],{x:7.2,y:y,w:3.0,h:0.45,fontSize:14,fontFace:MONO,color:INK,margin:0,valign:"middle"});
    s.addText(r[1],{x:10.3,y:y,w:2.0,h:0.45,fontSize:12,bold:i===0,fontFace:BODY,color:r[2],align:"right",margin:0,valign:"middle"});
    if(i<2) s.addShape(p.ShapeType.line,{x:7.2,y:y+0.5,w:5.1,h:0,line:{color:RULE,width:1}});
  });
  s.addText("Three pallets, three places, one glance.",{x:6.9,y:5.05,w:5.7,h:0.3,fontSize:13,fontFace:BODY,color:MUTED,margin:0});
  note(s,"Search is the feature staff will thank you for. Oldest-first is free, because pallet numbers only count upwards.");
}

/* ---------------- 12 · THE LOG ---------------- */
{
  const s=slide(false); tag(s,"The memory");
  title(s,"Every action is written down.\nNothing is ever erased.",{size:34,h:1.6});
  const head=["TIME","PERSON","ACTION","PALLET","PLACE","NOTE"];
  const rows=[["18.08 08:10","Mikael K.","CREATE","14250-004","—","120 pcs, label printed"],
              ["18.08 08:25","Mikael K.","PLACE","14250-004","A-01-3","from goods-in"],
              ["20.08 13:40","Anna L.","TAKE","14250-004","A-01-3","to production line 2"],
              ["20.08 16:05","Anna L.","EDIT","14250-004","—","120 → 60 pcs used"],
              ["20.08 16:06","Anna L.","PLACE","14250-004","B-02-1","returned, nearer slot"]];
  const colX=[0.95,2.85,4.3,5.75,7.65,9.1], colW=[1.85,1.4,1.4,1.85,1.4,3.2];
  card(s,{x:M,y:3.05,w:11.83,h:2.75,noshadow:false});
  s.addShape(p.ShapeType.rect,{x:M+0.01,y:3.06,w:11.81,h:0.5,fill:{color:"E7E9E4"},line:{color:"E7E9E4",width:0}});
  head.forEach(function(h,i){
    s.addText(h,{x:colX[i],y:3.06,w:colW[i],h:0.5,fontSize:9.5,bold:true,charSpacing:1.3,fontFace:MONO,color:MUTED,margin:0,valign:"middle"});
  });
  rows.forEach(function(r,ri){
    const y=3.62+ri*0.42;
    r.forEach(function(cell,ci){
      const isAct=ci===2;
      s.addText(cell,{x:colX[ci],y:y,w:colW[ci],h:0.38,fontSize:11.5,bold:isAct,fontFace:MONO,
        color:isAct?(cell==="TAKE"?GREEN:(cell==="PLACE"?RED:(cell==="EDIT"?ACCENT:"215B7E"))):INK2,margin:0,valign:"middle"});
    });
    if(ri<4) s.addShape(p.ShapeType.line,{x:0.95,y:y+0.4,w:11.4,h:0,line:{color:RULE,width:1}});
  });
  body(s,"Six months from now, “where was this pallet on 20 August, and who moved it?” takes five seconds to answer — and the answer exports to Excel for an auditor.",
    {x:M,y:6.05,w:11.4,h:0.8,size:15});
  note(s,"The log is what turns a convenience tool into a record you can defend in an audit. Corrections are added, never overwritten.");
}

/* ---------------- 13 · SERIAL NUMBERS ---------------- */
{
  const s=slide(false); tag(s,"A small but important detail");
  title(s,"Pallet numbers work like invoice numbers.",{size:36,w:11});
  body(s,"They count upwards. They are never reused, even after a pallet is finished.",
    {x:M,y:2.35,w:9,h:0.5,size:18,color:INK2});
  const ser=[["14250-001","dead"],["14250-002","dead"],["14250-003","dead"],
             ["14250-004","live"],["14250-005","live"],["14250-006","next"]];
  let x=M;
  ser.forEach(function(d){
    const w=1.78;
    const st=d[1];
    const fill = st==="dead"?STONE : (st==="live"?REDW:"FBF3D8");
    const line = st==="dead"?RULE : (st==="live"?RED:ACCENT);
    const col  = st==="dead"?MUTED : (st==="live"?RED:ACCENT);
    s.addShape(p.ShapeType.roundRect,{x:x,y:3.15,w:w,h:0.62,rectRadius:0.06,fill:{color:fill},line:{color:line,width:st==="dead"?1:1.75}});
    s.addText(d[0],{x:x,y:3.15,w:w,h:0.62,fontSize:14,bold:st!=="dead",fontFace:MONO,color:col,align:"center",valign:"middle",margin:0,strike:st==="dead"});
    x+=w+0.14;
  });
  const legend=[["finished and gone",MUTED,M,5.2],["standing in the warehouse now",RED,6.51,3.7],["the next one to be issued",ACCENT,10.35,2.4]];
  legend.forEach(function(l){
    s.addText(l[0],{x:l[2],y:3.92,w:l[3],h:0.3,fontSize:11.5,bold:true,fontFace:BODY,color:l[1],margin:0});
  });
  card(s,{x:M,y:4.5,w:11.83,h:1.35,fill:"FBF3D8",line:ACCENT,lw:1.5});
  body(s,"Because numbers only go up, the lowest number is always the oldest pallet. “Take the lowest number first” keeps stock rotating properly — with nothing to learn and nothing to configure.",
    {x:1.1,y:4.85,w:11.1,h:0.9,size:16,color:INK});
  note(s,"Reusing a number would destroy the history behind it. The side effect is free stock rotation.");
}

/* ---------------- 14 · WHAT IF ---------------- */
{
  const s=slide(false); tag(s,"The obvious objections");
  title(s,"“But what if…?”",{size:38});
  const qa=[["The label gets torn off?","The code is also printed in plain letters. Type it, or reprint the label in one tap."],
            ["There's no wifi in that aisle?","The phone keeps the scans and sends them when signal returns. The worker notices nothing."],
            ["Someone uses a shelf that is full?","The app stops them and offers the nearest free place — one of only two things it ever refuses."],
            ["Somebody forgets to scan?","The next person who finds the shelf empty taps “this rack is actually empty”, and it corrects itself."],
            ["Wrong button pressed?","Undo for a minute. After that the correction is a new line — the mistake stays visible, which is the point."],
            ["The system goes down?","Phones keep collecting scans. Every code is readable by eye, and the map can be printed each morning."]];
  const cw=3.78, chh=1.55, gx=0.24, gy=0.2;
  qa.forEach(function(d,i){
    const c=i%3, r=Math.floor(i/3);
    const x=M+c*(cw+gx), y=2.4+r*(chh+gy);
    card(s,{x:x,y:y,w:cw,h:chh});
    s.addText(d[0],{x:x+0.26,y:y+0.16,w:cw-0.52,h:0.52,fontSize:13.5,bold:true,fontFace:HEAD,color:INK,margin:0,valign:"top",lineSpacing:17});
    body(s,d[1],{x:x+0.26,y:y+0.74,w:cw-0.52,h:0.72,size:12.5});
  });
  card(s,{x:M,y:5.9,w:11.83,h:0.85,fill:"E7E9E4",line:RULE});
  body(s,"Twenty-eight situations like these are written down and answered in the full design document. The rule behind all of them: never stop the forklift — record what really happened and move on.",
    {x:1.05,y:6.1,w:11.2,h:0.5,size:14.5,color:INK});
  note(s,"Invite objections here. Anything they raise that is not on the list, write down — it belongs in the exception table.");
}

/* ---------------- 15 · THREE PEOPLE ---------------- */
{
  const s=slide(false); tag(s,"What changes");
  title(s,"Three people, three different days.",{size:38});
  const people=[["WAREHOUSE","Six seconds per move","Two scans instead of remembering. In exchange: never searching again, and never being blamed for a pallet somebody else moved."],
                ["SUPERVISOR","Ten minutes a week","One screen shows anything the system could not settle by itself — usually three or four items. Everything else runs without them."],
                ["MANAGEMENT","Questions become answers","How full is the warehouse? Where is that material? Who moved it? What has not been touched for a year? One screen."]];
  const cw=3.78, gx=0.24;
  people.forEach(function(d,i){
    const x=M+i*(cw+gx);
    card(s,{x:x,y:2.5,w:cw,h:2.9});
    s.addText(d[0],{x:x+0.28,y:2.78,w:cw-0.56,h:0.28,fontSize:10.5,bold:true,charSpacing:1.6,fontFace:MONO,color:ACCENT,margin:0});
    s.addText(d[1],{x:x+0.28,y:3.12,w:cw-0.56,h:0.7,fontSize:18,bold:true,fontFace:HEAD,color:INK,margin:0,valign:"top"});
    body(s,d[2],{x:x+0.28,y:3.92,w:cw-0.56,h:1.35,size:13.5});
  });
  body(s,"Nobody is asked to fill in a form, keep a spreadsheet, or write anything down. The record is a by-product of doing the job.",
    {x:M,y:5.75,w:11.4,h:0.8,size:15});
  note(s,"Adoption argument: the system asks for no extra work, only a different six seconds.");
}

/* ---------------- 16 · WHAT IT TAKES ---------------- */
{
  const s=slide(false); tag(s,"What it takes");
  title(s,"Eight weeks, and one afternoon with a ladder.",{size:34,w:11.5});
  const weeks=[["WEEKS 1–2","Name the warehouse","Give every shelf place an address, print the stickers, put them up. Your own staff, two days."],
               ["WEEKS 1–4","Build the system","Scanning, the map, the log, the labels. Nothing else."],
               ["WEEKS 5–6","Try one aisle","Two volunteers, one week, alongside the old way. Fix what they find."],
               ["WEEK 7","Go live","Ten minutes of training each, standing at a rack with a phone in hand."]];
  const cw=2.74, gx=0.28;
  weeks.forEach(function(d,i){
    const x=M+i*(cw+gx);
    card(s,{x:x,y:2.35,w:cw,h:2.2});
    s.addText(d[0],{x:x+0.28,y:2.6,w:cw-0.56,h:0.25,fontSize:10.5,bold:true,charSpacing:1.5,fontFace:MONO,color:ACCENT,margin:0});
    s.addText(d[1],{x:x+0.28,y:2.9,w:cw-0.56,h:0.4,fontSize:16,bold:true,fontFace:HEAD,color:INK,margin:0});
    body(s,d[2],{x:x+0.28,y:3.35,w:cw-0.56,h:1.0,size:12.5});
  });
  const stats=[["€5–25","per month","Running cost. No licence per person, ever."],
               ["€0","hardware","The phones people already carry. A label printer is optional."],
               ["10","minutes","Training per person. The app has three screens."]];
  const sw=3.78, sg=0.24;
  stats.forEach(function(d,i){
    const x=M+i*(sw+sg);
    card(s,{x:x,y:4.8,w:sw,h:1.55,fill:"E7E9E4",line:RULE});
    s.addText([{text:d[0],options:{fontSize:30,bold:true,color:INK}},{text:"  "+d[1],options:{fontSize:13,color:MUTED}}],
      {x:x+0.28,y:5.02,w:sw-0.56,h:0.55,fontFace:HEAD,margin:0,valign:"middle"});
    body(s,d[2],{x:x+0.28,y:5.62,w:sw-0.56,h:0.6,size:12.5});
  });
  note(s,"The slow part is naming the warehouse, and it is your staff's job — not the developer's. Say that plainly.");
}

/* ---------------- 17 · BUY VS BUILD ---------------- */
{
  const s=slide(false); tag(s,"The fair question");
  title(s,"Why not just buy something?",{size:38});
  body(s,"You can. Odoo, Fishbowl and others do this — as one part of a much larger platform that also does purchasing, stock valuation and sales orders, at roughly €30–60 per person per month past the free tier.",
    {x:M,y:2.4,w:5.4,h:1.5,size:15});
  body(s,"The real cost is not the licence, it is the learning. To get the one piece we need, everyone on the floor has to learn all of it.",
    {x:M,y:4.05,w:5.4,h:1.1,size:15,bold:true,color:INK});
  body(s,"If Nordic Bio plans to move purchasing and accounting into one system anyway, buy the platform. If the need is “know where the pallets are”, build the small thing.",
    {x:M,y:5.3,w:5.4,h:1.1,size:15});
  card(s,{x:6.9,y:2.15,w:5.7,h:1.85});
  s.addText("BUY A PLATFORM",{x:7.2,y:2.4,w:5.1,h:0.28,fontSize:10.5,bold:true,charSpacing:1.6,fontFace:MONO,color:MUTED,margin:0});
  s.addText("Six modules to get one",{x:7.2,y:2.7,w:5.1,h:0.4,fontSize:17,bold:true,fontFace:HEAD,color:INK,margin:0});
  body(s,"Purchasing · valuation · sales · locations & scanning · lots & serials · reporting. Per-user fees. Months of adoption.",
    {x:7.2,y:3.15,w:5.1,h:0.75,size:12.5});
  card(s,{x:6.9,y:4.2,w:5.7,h:1.85,line:ACCENT,lw:2});
  s.addText("BUILD THIS",{x:7.2,y:4.45,w:5.1,h:0.28,fontSize:10.5,bold:true,charSpacing:1.6,fontFace:MONO,color:ACCENT,margin:0});
  s.addText("One module, shaped to your warehouse",{x:7.2,y:4.75,w:5.1,h:0.45,fontSize:17,bold:true,fontFace:HEAD,color:INK,margin:0});
  body(s,"Locations & scanning · live map · permanent log. One build, then a few euros a month. Two scans to learn.",
    {x:7.2,y:5.28,w:5.1,h:0.7,size:12.5});
  note(s,"Be even-handed. The honest answer depends on whether they want purchasing and accounting in one system within two years.");
}

/* ---------------- 18 · DECIDE ---------------- */
{
  const s=slide(true); tag(s,"Over to you",true);
  s.addText("Three things to decide.",{x:M,y:1.35,w:11,h:0.9,fontSize:42,bold:true,fontFace:HEAD,color:WHITE,margin:0});
  const dec=[["01","Is the pallet label acceptable?","One printed label per pallet, in a plastic pocket — the only new habit this asks for."],
             ["02","Do we start without batch numbers and expiry dates?","Recommended: yes. They can be added later without rebuilding anything — and are needed if this system should ever carry weight in a cosmetics GMP audit."],
             ["03","Who walks the warehouse and counts the shelf places?","That number decides the size of everything else, and it is the first job."]];
  dec.forEach(function(d,i){
    const y=2.5+i*1.15;
    s.addShape(p.ShapeType.roundRect,{x:M,y:y,w:11.83,h:1.0,rectRadius:0.06,fill:{color:DARKCARD},line:{color:"333B39",width:1}});
    s.addText(d[0],{x:1.05,y:y+0.16,w:0.6,h:0.35,fontSize:15,bold:true,fontFace:MONO,color:ACCENT_L,margin:0});
    s.addText(d[1],{x:1.75,y:y+0.14,w:10.4,h:0.35,fontSize:16.5,bold:true,fontFace:HEAD,color:WHITE,margin:0});
    s.addText(d[2],{x:1.75,y:y+0.52,w:10.4,h:0.42,fontSize:13,fontFace:BODY,color:"AEB6B2",margin:0});
  });
  s.addText("Then eight weeks later, nobody in this building has to wonder where a pallet is again.",
    {x:M,y:6.15,w:11.4,h:0.5,fontSize:18,italic:true,fontFace:BODY,color:ACCENT_L,margin:0});
  s.addText("Full design document — workflow, all 28 exceptions, data model, architecture, rollout and costs — available alongside this presentation.",
    {x:M,y:6.75,w:11.4,h:0.4,fontSize:11.5,fontFace:BODY,color:"7E8683",margin:0});
  note(s,"Close by asking for these three decisions, not for general approval. Decisions are what move the project.");
}

p.writeFile({ fileName: "/home/user/randomcams/nordic-mts/docs/Nordic-Bio-Pallet-Tracking.pptx" })
 .then(f => console.log("written:", f));
