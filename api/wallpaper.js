import { createCanvas, GlobalFonts } from '@napi-rs/canvas';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function getDoy(now) {
  const s = new Date(now.getFullYear(),0,0);
  return Math.floor((now-s)/86400000);
}

export default async function handler(req, res) {
  const W=1170, H=2532;
  const canvas = createCanvas(W,H);
  const ctx = canvas.getContext('2d');

  // Use safe fallback font
  const F = 'sans-serif';

  const now = new Date();
  const ist = new Date(now.getTime()+(5.5*3600000));
  const doy = getDoy(ist);
  const total=365, left=total-doy, pct=Math.round(doy/total*100);
  const wkDone=Math.floor(doy/7);
  const curMin=ist.getHours()*60+ist.getMinutes();
  const curHour=ist.getHours();
  const streak=12;

  const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr=`${DAYS[ist.getDay()]}, ${MON[ist.getMonth()]} ${ist.getDate()}`;

  const TASKS=[
    {icon:'🧘',name:'Morning Meditation',time:'5:00 AM · 20 min',sh:5,sm:0,dur:20},
    {icon:'💪',name:'Morning Workout',   time:'5:30 AM · 45 min',sh:5,sm:30,dur:45},
    {icon:'📖',name:'Deep Work Session', time:'9:00 AM · 2 hrs',  sh:9,sm:0,dur:120},
    {icon:'🚀',name:'Review & Plan',     time:'6:00 PM · 30 min', sh:18,sm:0,dur:30},
  ];

  const QUOTES=[
    '"Small daily improvements lead to staggering long-term results."',
    '"Push yourself — no one else is going to do it for you."',
    '"What you do today determines who you\'ll be tomorrow."',
    '"Dream it. Believe it. Build it. The time is NOW."',
    '"Every morning is a new chance to become your best self."',
    '"The secret of getting ahead is getting started."',
  ];
  const quote=QUOTES[doy%QUOTES.length];

  // ── BACKGROUND ──
  ctx.fillStyle='#07070F'; ctx.fillRect(0,0,W,H);

  // Blobs
  const blobs=[
    [W*.15,H*.07,'rgba(90,70,255,0.36)',W*.6],
    [W*.88,H*.13,'rgba(150,110,255,0.22)',W*.48],
    [W*.5,H*.97,'rgba(30,150,240,0.13)',W*.62],
    [W*.1,H*.55,'rgba(180,60,255,0.08)',W*.4],
  ];
  blobs.forEach(([gx,gy,col,gr])=>{
    const g=ctx.createRadialGradient(gx,gy,0,gx,gy,gr);
    g.addColorStop(0,col); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  });

  // Grid
  ctx.strokeStyle='rgba(255,255,255,0.018)'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=96){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=96){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  // Stars (seeded)
  let seed=doy*7919+137;
  const rnd=()=>{seed=(seed*1664525+1013904223)&0xffffffff;return(seed>>>0)/4294967295;};
  for(let i=0;i<80;i++){
    ctx.beginPath();ctx.arc(rnd()*W,rnd()*H,rnd()*2.2+0.4,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${(rnd()*0.3+0.05).toFixed(2)})`; ctx.fill();
  }

  // ── DYNAMIC ISLAND ──
  ctx.fillStyle='#000000';
  roundRect(ctx,W/2-168,28,336,94,55); ctx.fill();

  // ── DATE ──
  ctx.fillStyle='rgba(255,255,255,0.45)';
  ctx.font=`400 46px ${F}`;
  ctx.textAlign='left';
  ctx.fillText(dateStr,62,196);

  // ── BADGE ROW y=590 ──
  const BY=590;
  ctx.font=`600 34px ${F}`;
  const badges=[
    {t:`${left} days left`,bg:'rgba(95,75,255,0.22)',br:'rgba(110,90,255,0.5)',fc:'#C4B0FF'},
    {t:`2026 · ${pct}% done`,bg:'rgba(255,255,255,0.07)',br:'rgba(255,255,255,0.13)',fc:'rgba(255,255,255,0.52)'},
    {t:`\uD83D\uDD25 ${streak} streak`,bg:'rgba(255,95,45,0.22)',br:'rgba(255,115,50,0.5)',fc:'#FF9060'},
  ];
  let bx=62;
  badges.forEach(b=>{
    const tw=ctx.measureText(b.t).width,bw=tw+66,bh=80;
    ctx.fillStyle=b.bg; roundRect(ctx,bx,BY,bw,bh,40); ctx.fill();
    ctx.strokeStyle=b.br; ctx.lineWidth=2.5; roundRect(ctx,bx,BY,bw,bh,40); ctx.stroke();
    ctx.fillStyle=b.fc; ctx.textAlign='left'; ctx.fillText(b.t,bx+33,BY+52);
    bx+=bw+20;
  });

  // ── DOT GRID ──
  const PX=60,DY=702,DH=236;
  ctx.fillStyle='rgba(255,255,255,0.042)';
  roundRect(ctx,PX,DY,W-PX*2,DH,40); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=2;
  roundRect(ctx,PX,DY,W-PX*2,DH,40); ctx.stroke();
  // shimmer
  const shg=ctx.createLinearGradient(PX,DY,W-PX,DY);
  shg.addColorStop(0,'transparent');shg.addColorStop(0.5,'rgba(255,255,255,0.14)');shg.addColorStop(1,'transparent');
  ctx.fillStyle=shg; ctx.fillRect(PX,DY,W-PX*2,3);

  // dots 26×2
  const COLS=26,ROWS=2,DS=20,DG=9;
  const dotTotalW=COLS*(DS+DG)-DG;
  const dsx=PX+(W-PX*2-dotTotalW)/2, dsy=DY+(DH-ROWS*(DS+DG+2))/2;
  for(let i=0;i<COLS*ROWS;i++){
    const col=i%COLS,row=Math.floor(i/COLS);
    const wk=Math.round((i/(COLS*ROWS))*53);
    const dx=dsx+col*(DS+DG), dy=dsy+row*(DS+DG+6);
    if(wk<wkDone){
      const dg=ctx.createRadialGradient(dx+DS/2,dy+DS/2,0,dx+DS/2,dy+DS/2,DS);
      dg.addColorStop(0,'#9B8AFF');dg.addColorStop(1,'#5C42EE');
      ctx.fillStyle=dg;ctx.shadowColor='rgba(108,82,255,0.7)';ctx.shadowBlur=8;
    } else if(wk===wkDone){
      ctx.fillStyle='#FFFFFF';ctx.shadowColor='rgba(255,255,255,1)';ctx.shadowBlur=20;
    } else {
      ctx.fillStyle='rgba(255,255,255,0.09)';ctx.shadowBlur=0;
    }
    roundRect(ctx,dx,dy,DS,DS,5); ctx.fill(); ctx.shadowBlur=0;
  }

  // ── GOAL ──
  const GY=968,GH=96;
  ctx.fillStyle='rgba(255,255,255,0.042)';
  roundRect(ctx,PX,GY,W-PX*2,GH,30); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.075)'; ctx.lineWidth=2;
  roundRect(ctx,PX,GY,W-PX*2,GH,30); ctx.stroke();
  ctx.fillStyle='#7C6AFF';ctx.shadowColor='rgba(124,106,255,0.9)';ctx.shadowBlur=12;
  ctx.beginPath();ctx.arc(PX+42,GY+GH/2,11,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,0.32)';ctx.font=`500 28px ${F}`;ctx.textAlign='left';
  ctx.fillText('Yearly Goal',PX+66,GY+56);
  ctx.fillStyle='rgba(255,255,255,0.88)';ctx.font=`700 34px ${F}`;
  ctx.fillText('Build your best year yet',PX+240,GY+56);

  // ── TASKS ──
  let TY=1086,nextSet=false;
  TASKS.forEach(t=>{
    const sm=t.sh*60+t.sm,em=sm+t.dur;
    let state,badge;
    if(curMin>=sm&&curMin<em){state='now';badge='NOW';}
    else if(curMin<sm&&!nextSet){state='next';badge='NEXT';nextSet=true;}
    else if(curMin<sm){state='later';badge='LATER';}
    else{state='done';badge='DONE';}

    const TH=140;
    if(state==='now')       ctx.fillStyle='rgba(95,75,255,0.15)';
    else if(state==='done') ctx.fillStyle='rgba(255,255,255,0.025)';
    else                    ctx.fillStyle='rgba(255,255,255,0.048)';
    roundRect(ctx,PX,TY,W-PX*2,TH,36); ctx.fill();

    if(state==='now')       ctx.strokeStyle='rgba(100,82,255,0.45)';
    else if(state==='next') ctx.strokeStyle='rgba(52,211,153,0.25)';
    else                    ctx.strokeStyle='rgba(255,255,255,0.08)';
    ctx.lineWidth=2.5; roundRect(ctx,PX,TY,W-PX*2,TH,36); ctx.stroke();

    // accent
    if(state==='now'){ctx.fillStyle='#7C6AFF';ctx.shadowColor='rgba(124,106,255,0.9)';ctx.shadowBlur=14;}
    else if(state==='next'){ctx.fillStyle='#34D399';ctx.shadowBlur=0;}
    else if(state==='later'){ctx.fillStyle='rgba(255,255,255,0.2)';ctx.shadowBlur=0;}
    else{ctx.fillStyle='rgba(255,255,255,0.1)';ctx.shadowBlur=0;}
    roundRect(ctx,PX,TY+24,5,TH-48,3); ctx.fill(); ctx.shadowBlur=0;

    // icon box
    const IW=90,IX=PX+28,IY=TY+(TH-IW)/2;
    ctx.fillStyle='rgba(255,255,255,0.1)';
    roundRect(ctx,IX,IY,IW,IW,22); ctx.fill();
    ctx.globalAlpha=state==='done'?0.35:1;
    ctx.font=`52px ${F}`;ctx.textAlign='center';
    ctx.fillText(t.icon,IX+IW/2,IY+64);

    // name + time
    ctx.fillStyle=state==='done'?'rgba(255,255,255,0.4)':'#FFFFFF';
    ctx.font=`700 38px ${F}`;ctx.textAlign='left';
    ctx.fillText(t.name,PX+136,TY+56);
    ctx.fillStyle='rgba(255,255,255,0.38)';ctx.font=`400 30px ${F}`;
    ctx.fillText(t.time,PX+136,TY+96);
    ctx.globalAlpha=1;

    // progress bar
    if(state==='now'){
      const p=Math.min(100,Math.round(((curMin-sm)/t.dur)*100));
      const bx=PX+136,by=TY+114,bw=W-PX*2-220,bh=9;
      ctx.fillStyle='rgba(255,255,255,0.08)';roundRect(ctx,bx,by,bw,bh,5);ctx.fill();
      const pg=ctx.createLinearGradient(bx,0,bx+bw,0);
      pg.addColorStop(0,'#6C52FF');pg.addColorStop(1,'#A78BFA');
      ctx.fillStyle=pg;ctx.shadowColor='rgba(108,82,255,0.5)';ctx.shadowBlur=8;
      roundRect(ctx,bx,by,Math.max(bw*(p/100),6),bh,5);ctx.fill();ctx.shadowBlur=0;
    }

    // badge pill
    ctx.font=`700 26px ${F}`;ctx.textAlign='center';
    const btw=ctx.measureText(badge).width+52,bth=54;
    const bx2=W-PX-btw-16,by2=TY+20;
    if(state==='now'){ctx.fillStyle='rgba(100,82,255,0.35)';ctx.strokeStyle='rgba(120,100,255,0.6)';}
    else if(state==='next'){ctx.fillStyle='rgba(52,211,153,0.18)';ctx.strokeStyle='rgba(52,211,153,0.35)';}
    else if(state==='later'){ctx.fillStyle='rgba(255,255,255,0.06)';ctx.strokeStyle='rgba(255,255,255,0.1)';}
    else{ctx.fillStyle='rgba(255,255,255,0.04)';ctx.strokeStyle='rgba(255,255,255,0.06)';}
    roundRect(ctx,bx2,by2,btw,bth,27);ctx.fill();
    ctx.lineWidth=1.5;roundRect(ctx,bx2,by2,btw,bth,27);ctx.stroke();
    if(state==='now')       ctx.fillStyle='#C4B0FF';
    else if(state==='next') ctx.fillStyle='#34D399';
    else                    ctx.fillStyle='rgba(255,255,255,0.32)';
    ctx.fillText(badge,bx2+btw/2,by2+36);

    TY+=TH+14;
  });

  // ── WATER ──
  const WY=TY,WH=124;
  ctx.fillStyle='rgba(255,255,255,0.042)';
  roundRect(ctx,PX,WY,W-PX*2,WH,34);ctx.fill();
  ctx.strokeStyle='rgba(56,189,248,0.22)';ctx.lineWidth=2;
  roundRect(ctx,PX,WY,W-PX*2,WH,34);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.3)';ctx.font=`600 26px ${F}`;ctx.textAlign='left';
  ctx.fillText('HYDRATION',PX+38,WY+44);
  const glasses=Math.min(8,Math.max(0,Math.floor((curHour-7)/2)));
  for(let i=0;i<8;i++){
    ctx.globalAlpha=i<glasses?1:0.14;
    ctx.font=`38px ${F}`;ctx.textAlign='left';
    ctx.fillText('\uD83D\uDCA7',PX+38+i*66,WY+96);
  }
  ctx.globalAlpha=1;
  ctx.fillStyle='rgba(56,189,248,0.9)';ctx.font=`600 30px ${F}`;ctx.textAlign='right';
  ctx.fillText(`${glasses} of 8 glasses`,W-PX-38,WY+72);

  // ── QUOTE ──
  const QY=WY+WH+16,QH=160;
  ctx.fillStyle='rgba(255,255,255,0.033)';
  roundRect(ctx,PX,QY,W-PX*2,QH,34);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=2;
  roundRect(ctx,PX,QY,W-PX*2,QH,34);ctx.stroke();
  // big quote mark
  ctx.fillStyle='rgba(95,75,255,0.12)';ctx.font=`900 210px serif`;ctx.textAlign='right';
  ctx.fillText('\u201C',W-PX+28,QY+166);
  // quote text
  ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font=`italic 500 32px ${F}`;ctx.textAlign='left';
  const words=quote.split(' ');let line='',qly=QY+52;
  const maxQW=W-PX*2-100;
  words.forEach((w,ni)=>{
    const test=line+w+' ';
    if(ctx.measureText(test).width>maxQW&&ni>0){ctx.fillText(line.trim(),PX+38,qly);line=w+' ';qly+=44;}
    else line=test;
  });
  ctx.fillText(line.trim(),PX+38,qly);
  ctx.fillStyle='#9B8AFF';ctx.font=`600 28px ${F}`;
  ctx.fillText('— Nexus Life OS',PX+38,qly+40);

  // ── POWERED ──
  ctx.fillStyle='rgba(255,255,255,0.1)';ctx.font=`400 22px ${F}`;ctx.textAlign='center';
  ctx.fillText('POWERED BY NEURAL INTELLIGENCE',W/2,H-62);

  // ── HOME INDICATOR ──
  ctx.fillStyle='rgba(255,255,255,0.22)';
  roundRect(ctx,W/2-204,H-36,408,14,7);ctx.fill();

  const buf=canvas.toBuffer('image/png');
  res.setHeader('Content-Type','image/png');
  res.setHeader('Cache-Control','no-cache,no-store,must-revalidate');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.send(buf);
}
