import sharp from 'sharp';

function getDoy(now) {
  const s = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - s) / 86400000);
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

export default async function handler(req, res) {
  // iPhone 13 exact: 1170x2532
  const W = 1170, H = 2532;

  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600000);
  const doy = getDoy(ist);
  const total = 365, left = total - doy, pct = Math.round(doy / total * 100);
  const wkDone = Math.floor(doy / 7);
  const curMin = ist.getHours() * 60 + ist.getMinutes();
  const curHour = ist.getHours();
  const streak = 12;

  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr = `${DAYS[ist.getDay()]}, ${MON[ist.getMonth()]} ${ist.getDate()}`;

  const TASKS = [
    { name:'Morning Meditation', time:'5:00 AM · 20 min', sh:5,  sm:0,  dur:20  },
    { name:'Morning Workout',    time:'5:30 AM · 45 min', sh:5,  sm:30, dur:45  },
    { name:'Deep Work Session',  time:'9:00 AM · 2 hrs',  sh:9,  sm:0,  dur:120 },
    { name:'Review & Plan',      time:'6:00 PM · 30 min', sh:18, sm:0,  dur:30  },
  ];

  const QUOTES = [
    'Small daily improvements lead to staggering long-term results.',
    'Push yourself — no one else is going to do it for you.',
    'What you do today determines who you will be tomorrow.',
    'Dream it. Believe it. Build it. The time is NOW.',
    'Every morning is a new chance to become your best self.',
    'The secret of getting ahead is getting started.',
  ];
  const quote = QUOTES[doy % QUOTES.length];

  // glasses based on time
  const glasses = Math.min(8, Math.max(0, Math.floor((curHour - 7) / 2)));

  // ── SVG BUILDER ──
  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="g1" cx="15%" cy="7%" r="60%"><stop offset="0%" stop-color="#5A46FF" stop-opacity="0.36"/><stop offset="100%" stop-color="#5A46FF" stop-opacity="0"/></radialGradient>
  <radialGradient id="g2" cx="88%" cy="13%" r="48%"><stop offset="0%" stop-color="#9670FF" stop-opacity="0.22"/><stop offset="100%" stop-color="#9670FF" stop-opacity="0"/></radialGradient>
  <radialGradient id="g3" cx="50%" cy="97%" r="62%"><stop offset="0%" stop-color="#1E96F0" stop-opacity="0.13"/><stop offset="100%" stop-color="#1E96F0" stop-opacity="0"/></radialGradient>
  <radialGradient id="g4" cx="10%" cy="55%" r="40%"><stop offset="0%" stop-color="#B43CFF" stop-opacity="0.08"/><stop offset="100%" stop-color="#B43CFF" stop-opacity="0"/></radialGradient>
  <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#6C52FF"/><stop offset="100%" stop-color="#A78BFA"/></linearGradient>
  <filter id="glow1"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="glowW"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>

<!-- BG -->
<rect width="${W}" height="${H}" fill="#07070F"/>
<rect width="${W}" height="${H}" fill="url(#g1)"/>
<rect width="${W}" height="${H}" fill="url(#g2)"/>
<rect width="${W}" height="${H}" fill="url(#g3)"/>
<rect width="${W}" height="${H}" fill="url(#g4)"/>`;

  // Grid lines
  for (let x = 0; x < W; x += 96) svg += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="rgba(255,255,255,0.018)" stroke-width="1"/>`;
  for (let y = 0; y < H; y += 96) svg += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(255,255,255,0.018)" stroke-width="1"/>`;

  // Stars
  let seed = doy * 7919 + 137;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 4294967295; };
  for (let i = 0; i < 75; i++) {
    const sx = rnd()*W, sy = rnd()*H, sr = rnd()*2+0.4, so = (rnd()*0.28+0.05).toFixed(2);
    svg += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${sr.toFixed(1)}" fill="rgba(255,255,255,${so})"/>`;
  }

  // Dynamic Island
  svg += `<rect x="${W/2-168}" y="28" width="336" height="94" rx="55" fill="#000000"/>`;

  // Date
  svg += `<text x="62" y="196" font-family="Arial,Helvetica,sans-serif" font-size="46" font-weight="400" fill="rgba(255,255,255,0.45)">${escapeXml(dateStr)}</text>`;

  // ── BADGE ROW y=590 ──
  const BY = 590;
  const badgeData = [
    { text: `${left} days left`, bg:'rgba(95,75,255,0.22)', stroke:'rgba(110,90,255,0.5)', color:'#C4B0FF', approxW: 280 },
    { text: `2026 · ${pct}% done`, bg:'rgba(255,255,255,0.07)', stroke:'rgba(255,255,255,0.13)', color:'rgba(255,255,255,0.52)', approxW: 300 },
    { text: `${streak} streak`, bg:'rgba(255,95,45,0.22)', stroke:'rgba(255,115,50,0.5)', color:'#FF9060', approxW: 220 },
  ];
  let bxPos = 62;
  badgeData.forEach((b, bi) => {
    const bw = b.approxW, bh = 78;
    svg += `<rect x="${bxPos}" y="${BY}" width="${bw}" height="${bh}" rx="39" fill="${b.bg}" stroke="${b.stroke}" stroke-width="2.5"/>`;
    if (bi === 2) {
      // flame icon manually
      svg += `<text x="${bxPos+28}" y="${BY+51}" font-family="Arial,sans-serif" font-size="32" fill="#FF9060">&#x1F525;</text>`;
      svg += `<text x="${bxPos+68}" y="${BY+51}" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="600" fill="${b.color}">${escapeXml(b.text)}</text>`;
    } else {
      svg += `<text x="${bxPos+30}" y="${BY+51}" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="600" fill="${b.color}">${escapeXml(b.text)}</text>`;
    }
    bxPos += bw + 20;
  });

  // ── DOT GRID y=700 ──
  const PX = 60, DY = 700, DH = 236;
  svg += `<rect x="${PX}" y="${DY}" width="${W-PX*2}" height="${DH}" rx="40" fill="rgba(255,255,255,0.042)" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>`;
  // shimmer
  svg += `<defs><linearGradient id="shim" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="transparent"/><stop offset="50%" stop-color="rgba(255,255,255,0.14)"/><stop offset="100%" stop-color="transparent"/></linearGradient></defs>`;
  svg += `<rect x="${PX}" y="${DY}" width="${W-PX*2}" height="3" fill="url(#shim)"/>`;

  const COLS = 26, ROWS = 2, DS = 20, DG = 9;
  const dotTotalW = COLS*(DS+DG)-DG;
  const dsx = PX + (W-PX*2-dotTotalW)/2;
  const dsy = DY + (DH - ROWS*(DS+DG+6))/2;
  for (let i = 0; i < COLS*ROWS; i++) {
    const col = i%COLS, row = Math.floor(i/COLS);
    const wk = Math.round((i/(COLS*ROWS))*53);
    const dx = dsx + col*(DS+DG), dy = dsy + row*(DS+DG+6);
    if (wk < wkDone) {
      svg += `<rect x="${dx}" y="${dy}" width="${DS}" height="${DS}" rx="5" fill="#7B6AFF" filter="url(#glow1)"/>`;
    } else if (wk === wkDone) {
      svg += `<rect x="${dx}" y="${dy}" width="${DS}" height="${DS}" rx="5" fill="#FFFFFF" filter="url(#glowW)"/>`;
    } else {
      svg += `<rect x="${dx}" y="${dy}" width="${DS}" height="${DS}" rx="5" fill="rgba(255,255,255,0.09)"/>`;
    }
  }

  // ── GOAL ROW y=968 ──
  const GY = 968, GH = 96;
  svg += `<rect x="${PX}" y="${GY}" width="${W-PX*2}" height="${GH}" rx="30" fill="rgba(255,255,255,0.042)" stroke="rgba(255,255,255,0.075)" stroke-width="2"/>`;
  svg += `<circle cx="${PX+42}" cy="${GY+GH/2}" r="11" fill="#7C6AFF" filter="url(#glow1)"/>`;
  svg += `<text x="${PX+66}" y="${GY+56}" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="500" fill="rgba(255,255,255,0.32)">Yearly Goal</text>`;
  svg += `<text x="${PX+240}" y="${GY+56}" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="700" fill="rgba(255,255,255,0.88)">Build your best year yet</text>`;

  // ── TASKS ──
  let TY = 1086, nextSet = false;
  const taskColors = [
    { accent:'#7C6AFF', iconBg:'rgba(100,82,255,0.28)' },
    { accent:'#34D399', iconBg:'rgba(52,211,153,0.22)' },
    { accent:'#FB923C', iconBg:'rgba(251,146,60,0.22)' },
    { accent:'#38BDF8', iconBg:'rgba(56,189,248,0.2)'  },
  ];
  const taskSymbols = ['M', 'W', 'D', 'R']; // text fallback for icons

  TASKS.forEach((t, idx) => {
    const sm = t.sh*60+t.sm, em = sm+t.dur;
    let state, badge;
    if (curMin>=sm && curMin<em)           { state='now';   badge='NOW';  }
    else if (curMin<sm && !nextSet)        { state='next';  badge='NEXT'; nextSet=true; }
    else if (curMin<sm)                    { state='later'; badge='LATER'; }
    else                                   { state='done';  badge='DONE'; }

    const TH = 138, tc = taskColors[idx];
    let cardFill = 'rgba(255,255,255,0.048)', cardStroke = 'rgba(255,255,255,0.08)';
    if (state==='now')  { cardFill='rgba(95,75,255,0.15)'; cardStroke='rgba(100,82,255,0.45)'; }
    if (state==='done') { cardFill='rgba(255,255,255,0.025)'; }

    svg += `<rect x="${PX}" y="${TY}" width="${W-PX*2}" height="${TH}" rx="36" fill="${cardFill}" stroke="${cardStroke}" stroke-width="2.5"/>`;

    // accent bar
    let accentFill = state==='now'?'#7C6AFF':state==='next'?'#34D399':'rgba(255,255,255,0.15)';
    svg += `<rect x="${PX}" y="${TY+24}" width="5" height="${TH-48}" rx="3" fill="${accentFill}"/>`;

    // icon box
    const IW=90, IX=PX+28, IY=TY+(TH-IW)/2;
    svg += `<rect x="${IX}" y="${IY}" width="${IW}" height="${IW}" rx="22" fill="rgba(255,255,255,0.1)"/>`;
    // colored circle as icon indicator
    svg += `<circle cx="${IX+IW/2}" cy="${IY+IW/2}" r="18" fill="${tc.accent}" opacity="${state==='done'?'0.3':'0.7'}"/>`;
    // letter
    svg += `<text x="${IX+IW/2}" y="${IY+IW/2+9}" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="white" text-anchor="middle">${taskSymbols[idx]}</text>`;

    // name + time
    const textOp = state==='done'?'0.38':'1';
    svg += `<text x="${PX+136}" y="${TY+54}" font-family="Arial,Helvetica,sans-serif" font-size="38" font-weight="700" fill="rgba(255,255,255,${textOp})">${escapeXml(t.name)}</text>`;
    svg += `<text x="${PX+136}" y="${TY+94}" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="400" fill="rgba(255,255,255,${state==='done'?'0.28':'0.38'})">${escapeXml(t.time)}</text>`;

    // progress bar
    if (state==='now') {
      const p = Math.min(100, Math.round(((curMin-sm)/t.dur)*100));
      const bx=PX+136, by=TY+112, bw=W-PX*2-220, bh=9;
      svg += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="5" fill="rgba(255,255,255,0.08)"/>`;
      svg += `<rect x="${bx}" y="${by}" width="${Math.max(bw*(p/100),8)}" height="${bh}" rx="5" fill="url(#bar)"/>`;
    }

    // badge
    let badgeFill, badgeStroke, badgeColor;
    if (state==='now')       { badgeFill='rgba(100,82,255,0.35)'; badgeStroke='rgba(120,100,255,0.6)'; badgeColor='#C4B0FF'; }
    else if (state==='next') { badgeFill='rgba(52,211,153,0.18)'; badgeStroke='rgba(52,211,153,0.35)'; badgeColor='#34D399'; }
    else                     { badgeFill='rgba(255,255,255,0.05)'; badgeStroke='rgba(255,255,255,0.09)'; badgeColor='rgba(255,255,255,0.32)'; }
    const bw2=badge.length*18+52, bh2=52;
    const bx2=W-PX-bw2-16, by2=TY+20;
    svg += `<rect x="${bx2}" y="${by2}" width="${bw2}" height="${bh2}" rx="26" fill="${badgeFill}" stroke="${badgeStroke}" stroke-width="1.5"/>`;
    svg += `<text x="${bx2+bw2/2}" y="${by2+35}" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="${badgeColor}" text-anchor="middle" letter-spacing="2">${badge}</text>`;

    TY += TH + 14;
  });

  // ── WATER ──
  const WY = TY, WH = 124;
  svg += `<rect x="${PX}" y="${WY}" width="${W-PX*2}" height="${WH}" rx="34" fill="rgba(255,255,255,0.042)" stroke="rgba(56,189,248,0.22)" stroke-width="2"/>`;
  svg += `<text x="${PX+38}" y="${WY+44}" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="600" fill="rgba(255,255,255,0.3)">HYDRATION</text>`;

  // water drops as colored circles
  for (let i=0; i<8; i++) {
    const op = i < glasses ? '1' : '0.14';
    svg += `<circle cx="${PX+55+i*70}" cy="${WY+86}" r="18" fill="${i<glasses?'#38BDF8':'rgba(255,255,255,0.3)'}" opacity="${op}"/>`;
    if (i < glasses) svg += `<text x="${PX+55+i*70}" y="${WY+92}" font-family="Arial,sans-serif" font-size="16" fill="white" text-anchor="middle">&#9670;</text>`;
  }
  svg += `<text x="${W-PX-38}" y="${WY+72}" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="600" fill="rgba(56,189,248,0.9)" text-anchor="end">${glasses} of 8 glasses</text>`;

  // ── QUOTE ──
  const QY = WY+WH+16, QH = 168;
  svg += `<rect x="${PX}" y="${QY}" width="${W-PX*2}" height="${QH}" rx="34" fill="rgba(255,255,255,0.033)" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>`;
  svg += `<text x="${W-PX+24}" y="${QY+155}" font-family="Georgia,serif" font-size="200" font-weight="900" fill="rgba(95,75,255,0.12)" text-anchor="end">&#x201C;</text>`;

  // wrap quote
  const maxQChars = 52;
  const qWords = quote.split(' ');
  let qLine = '', qLines = [];
  qWords.forEach(w => {
    if ((qLine+w).length > maxQChars && qLine) { qLines.push(qLine.trim()); qLine=w+' '; }
    else qLine += w+' ';
  });
  if (qLine.trim()) qLines.push(qLine.trim());
  qLines.forEach((l, li) => {
    svg += `<text x="${PX+38}" y="${QY+54+li*46}" font-family="Arial,Helvetica,sans-serif" font-size="32" font-style="italic" font-weight="500" fill="rgba(255,255,255,0.5)">${escapeXml(li===0?'"'+l:l+(li===qLines.length-1?'"':''))}</text>`;
  });
  svg += `<text x="${PX+38}" y="${QY+54+qLines.length*46+4}" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="600" fill="#9B8AFF">— Nexus Life OS</text>`;

  // ── POWERED ──
  svg += `<text x="${W/2}" y="${H-62}" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="400" fill="rgba(255,255,255,0.1)" text-anchor="middle" letter-spacing="4">POWERED BY NEURAL INTELLIGENCE</text>`;

  // ── HOME INDICATOR ──
  svg += `<rect x="${W/2-204}" y="${H-36}" width="408" height="14" rx="7" fill="rgba(255,255,255,0.22)"/>`;

  svg += `</svg>`;

  // Convert SVG to PNG via sharp
  const pngBuffer = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 6 })
    .toBuffer();

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache,no-store,must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(pngBuffer);
}
