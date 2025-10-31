// ========================================
// WORKOUT PLAN GENERATOR ENGINE
// ========================================
const EXERCISES = [
  {id:'squat', name:'Back Squat', muscle:'legs', type:'compound', equip:['barbell','rack']},
  {id:'fsquat', name:'Front Squat', muscle:'legs', type:'compound', equip:['barbell','rack']},
  {id:'goblet', name:'Goblet Squat', muscle:'legs', type:'compound', equip:['dumbbell','kettlebell']},
  {id:'legpress', name:'Leg Press', muscle:'legs', type:'compound', equip:['machine']},
  {id:'rdl', name:'Romanian Deadlift', muscle:'posterior', type:'compound', equip:['barbell','dumbbell']},
  {id:'dl', name:'Deadlift', muscle:'posterior', type:'compound', equip:['barbell']},
  {id:'hipthrust', name:'Hip Thrust', muscle:'glutes', type:'compound', equip:['barbell','bench']},
  {id:'bench', name:'Barbell Bench Press', muscle:'chest', type:'compound', equip:['barbell','bench']},
  {id:'dbbench', name:'DB Bench Press', muscle:'chest', type:'compound', equip:['dumbbell','bench']},
  {id:'pushup', name:'Push-up', muscle:'chest', type:'compound', equip:['bodyweight']},
  {id:'ohp', name:'Overhead Press', muscle:'shoulders', type:'compound', equip:['barbell']},
  {id:'dbohp', name:'DB Shoulder Press', muscle:'shoulders', type:'compound', equip:['dumbbell']},
  {id:'row', name:'Barbell Row', muscle:'back', type:'compound', equip:['barbell']},
  {id:'dbrow', name:'DB Row', muscle:'back', type:'compound', equip:['dumbbell','bench']},
  {id:'latpulldown', name:'Lat Pulldown', muscle:'back', type:'compound', equip:['machine','cable']},
  {id:'pulldown', name:'Assisted Pull-up / Pull-down', muscle:'back', type:'compound', equip:['machine']},
  {id:'pullup', name:'Pull-up', muscle:'back', type:'compound', equip:['bodyweight','bar']},
  {id:'curl', name:'Bicep Curl', muscle:'biceps', type:'accessory', equip:['dumbbell','barbell','cable']},
  {id:'tric', name:'Triceps Pushdown', muscle:'triceps', type:'accessory', equip:['cable']},
  {id:'skull', name:'Skullcrusher', muscle:'triceps', type:'accessory', equip:['barbell','dumbbell','bench']},
  {id:'latraise', name:'Lateral Raise', muscle:'shoulders', type:'accessory', equip:['dumbbell','cable']},
  {id:'fly', name:'Chest Fly', muscle:'chest', type:'accessory', equip:['dumbbell','cable','machine']},
  {id:'legcurl', name:'Leg Curl', muscle:'posterior', type:'accessory', equip:['machine']},
  {id:'legext', name:'Leg Extension', muscle:'quads', type:'accessory', equip:['machine']},
  {id:'calf', name:'Calf Raise', muscle:'calves', type:'accessory', equip:['machine','smith','bodyweight']},
  {id:'coreplank', name:'Plank', muscle:'core', type:'core', equip:['bodyweight']},
  {id:'corecable', name:'Cable Crunch', muscle:'core', type:'core', equip:['cable']},
  {id:'hanging', name:'Hanging Knee Raise', muscle:'core', type:'core', equip:['bar']},
];

const EQUIPMENT = ['barbell','dumbbell','machine','cable','kettlebell','bench','rack','smith','bodyweight','bar'];

const LEVEL_PARAMS = {
  beginner:    { setsMain:3,  setsAcc:2, repMain:[8,10], repAcc:[10,15], restMain:120, restAcc:60 },
  intermediate:{ setsMain:4,  setsAcc:3, repMain:[6,8],  repAcc:[8,12],  restMain:150, restAcc:75 },
  advanced:    { setsMain:5,  setsAcc:3, repMain:[4,6],  repAcc:[6,10],  restMain:180, restAcc:90 },
};

const GOAL_TWEAKS = {
  strength:    { repMainDelta:-2, repAccDelta:-2, restBoost:1.2 },
  hypertrophy: { repMainDelta:+2, repAccDelta:+2, restBoost:0.9 },
  endurance:   { repMainDelta:+4, repAccDelta:+4, restBoost:0.8 },
  recomp:      { repMainDelta:+0, repAccDelta:+0, restBoost:1.0 },
};

function progressionAdjust(levelParams, adherence, rpe){
  const p = {...levelParams};
  if(adherence==='yes' && rpe<=7){ p.setsMain += 1; }
  if(adherence==='no' || rpe>=9){ 
    p.setsMain = Math.max(2, p.setsMain-1);
    p.setsAcc = Math.max(1, p.setsAcc-1);
  }
  return p;
}

const rng = (min,max)=> Math.floor(Math.random()*(max-min+1))+min;
const pick = (arr)=> arr[Math.floor(Math.random()*arr.length)];
function withinEquip(ex, avail){ return ex.equip.some(e => avail.has(e)); }
function repRange(base, delta){ return [Math.max(3, base[0]+delta), Math.max(4, base[1]+delta)]; }
function fmtRange([a,b]){return `${a}–${b}`}

const SPLITS = {
  2: [ ['full'], ['full'] ],
  3: [ ['push'], ['pull'], ['legs'] ],
  4: [ ['upper'], ['lower'], ['upper'], ['lower'] ],
  5: [ ['upper'], ['lower'], ['push'], ['pull'], ['full'] ],
  6: [ ['push'], ['pull'], ['legs'], ['upper'], ['lower'], ['full'] ],
};

const BLUEPRINT = {
  full: {
    main:  ['squat/goblet/legpress', 'bench/dbbench/pushup', 'row/dbrow/latpulldown/pullup'],
    acc:   ['rdl/hipthrust', 'latraise/fly', 'curl/tric', 'coreplank/corecable/hanging']
  },
  upper: {
    main:  ['bench/dbbench/pushup', 'row/latpulldown/pullup', 'ohp/dbohp'],
    acc:   ['latraise/fly', 'curl', 'tric', 'coreplank/corecable/hanging']
  },
  lower: {
    main:  ['squat/goblet/legpress', 'rdl/dl/hipthrust'],
    acc:   ['legext', 'legcurl', 'calf', 'coreplank']
  },
  push: {
    main:  ['bench/dbbench/pushup', 'ohp/dbohp'],
    acc:   ['fly', 'tric', 'latraise', 'coreplank']
  },
  pull: {
    main:  ['row/dbrow/latpulldown/pullup', 'rdl/dl'],
    acc:   ['curl', 'legcurl', 'coreplank/corecable/hanging']
  },
  legs: {
    main:  ['squat/goblet/legpress', 'rdl/hipthrust/dl'],
    acc:   ['legext', 'legcurl', 'calf', 'coreplank']
  }
};

function resolveSlot(slot, avail){
  const options = slot.split('/').map(id=>EXERCISES.find(e=>e.id===id)).filter(Boolean);
  const fit = options.filter(e=>withinEquip(e, avail));
  return (fit.length? pick(fit) : pick(options));
}

function generatePlan({level='beginner', days=3, goal='recomp', equipment=[], adherence='yes', rpe=7, week=1}){
  days = Math.min(6, Math.max(2, Number(days)||3));
  const split = SPLITS[days] || SPLITS[3];
  const base = LEVEL_PARAMS[level] || LEVEL_PARAMS.beginner;
  const tweaked = {...base};
  const g = GOAL_TWEAKS[goal] || GOAL_TWEAKS.recomp;
  const repMain = repRange(base.repMain, g.repMainDelta);
  const repAcc  = repRange(base.repAcc,  g.repAccDelta);
  tweaked.restMain = Math.round(base.restMain * g.restBoost);
  tweaked.restAcc  = Math.round(base.restAcc  * g.restBoost);

  const prog = progressionAdjust({ ...tweaked }, adherence, rpe);
  const avail = new Set(equipment);
  const daysOut = [];

  split.forEach((focusArr, i)=>{
    const focus = focusArr[0];
    const bp = BLUEPRINT[focus];
    const mains = bp.main.map(s=>resolveSlot(s, avail));
    const accs  = bp.acc.slice().sort(()=>Math.random()-0.5).slice(0, 3).map(s=>resolveSlot(s, avail));
    const dayName = `${['Mon','Tue','Wed','Thu','Fri','Sat'][i%6] || 'Day'} – ${focus.toUpperCase()}`;

    daysOut.push({
      name: dayName,
      focus,
      main: mains.map(x=>({ id:x.id, name:x.name, sets:prog.setsMain, reps:repMain, rest:prog.restMain })),
      accessories: accs.map(x=>({ id:x.id, name:x.name, sets:prog.setsAcc, reps:repAcc, rest:prog.restAcc })),
      note: week%4===0? 'Deload week: leave 3–4 reps in reserve (RIR) and reduce weight ~10–15%.' : 'Aim to leave 1–2 reps in reserve (RIR). Increase weight next week if all top sets feel ≤7 RPE.'
    });
  });

  return { meta:{ level, days, goal, week, adherence, rpe }, plan: daysOut };
}

// ========================================
// STORAGE & STATE
// ========================================
const USERS_KEY = "users";
const CURRENT_USER_KEY = "currentUser";
const LOGS_KEY = "neurofit.logs";
const SETTINGS_KEY = "neurofit.settings";
const PLAN_KEY = "neurofit.workoutPlan";

const store = {
    getUsers(){ return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); },
    setUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); },
    getCurrentUser(){ const r = localStorage.getItem(CURRENT_USER_KEY); return r ? JSON.parse(r) : null; },
    setCurrentUser(u){ localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u)); },
    clearCurrentUser(){ localStorage.removeItem(CURRENT_USER_KEY); },
    getLogs(){ return JSON.parse(localStorage.getItem(LOGS_KEY) || "[]"); },
    setLogs(arr){ localStorage.setItem(LOGS_KEY, JSON.stringify(arr)); },
    getSettings(){ return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); },
    setSettings(obj){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj)); },
    clearData(){ localStorage.removeItem(LOGS_KEY); localStorage.removeItem(SETTINGS_KEY); },
    getPlan(){ return JSON.parse(localStorage.getItem(PLAN_KEY) || "null"); },
    setPlan(obj){ localStorage.setItem(PLAN_KEY, JSON.stringify(obj)); }
};

function computeStreak(){
    const logs = store.getLogs();
    if (!logs.length) return 0;
    const days = new Set(logs.map(l => String(l.date).slice(0, 10)));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().slice(0, 10);
    let cursor = days.has(todayKey) ? +today : (+today - 86400000);
    let streak = 0;
    while (true){
        const key = new Date(cursor).toISOString().slice(0, 10);
        if (!days.has(key)) break;
        streak++;
        cursor -= 86400000;
    }
    return streak;
}

function mount(templateId, data = {}){
    const template = document.getElementById(templateId);
    const clone = template.content.cloneNode(true);
    Object.keys(data).forEach(k => {
        const el = clone.querySelector(`[data-${k}]`);
        if (el) el.textContent = data[k];
    });
    const app = document.getElementById("app");
    app.innerHTML = "";
    app.appendChild(clone);
}

const $ = (sel, root = document) => root.querySelector(sel);
const on = (el, evt, cb) => el && el.addEventListener(evt, cb);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function scorePassword(pw){
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[a-z]/.test(pw) && /\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 4);
}

function validateRegister({ username, email, password }){
    const errors = {};
    if (!username || username.trim().length < 3) errors.username = "Username Must be at Least 3 Characters.";
    if (!emailRegex.test(email)) errors.email = "Enter a Valid Email Address.";
    if (scorePassword(password) < 3) errors.password = "Password Must be 8+ Chars with Upper/Lowercase, a Number, and Preferably a Symbol.";
    return { ok: Object.keys(errors).length === 0, errors };
}

function validateLogin({ email, password }){
    const errors = {};
    if (!emailRegex.test(email)) errors.email = "Invalid Email.";
    if (!password) errors.password = "Password is Required.";
    return { ok: Object.keys(errors).length === 0, errors };
}

function escapeHTML(str){
    return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function startOfWeek(d = new Date()){
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7;
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - day);
    return x;
}

function formatUnits(w){
    const units = store.getSettings().units || "lbs";
    return `${w} ${units}`;
}

function isAuthed(){ return !!store.getCurrentUser(); }
function guard(){ if (!isAuthed()){ location.hash = "#/login"; return false; } return true; }

// ========================================
// ROUTER
// ========================================
const routes = {
    "#/login": renderLogin,
    "#/register": renderRegister,
    "#/home": renderHome,
    "#/workouts/log": renderWorkoutLog,
    "#/workouts/diagram": renderBodyDiagram,
    "#/workouts/history": renderHistory,
    "#/progress": renderProgress,
    "#/settings": renderSettings,
    "#/generatePlan": renderGeneratePlan
};

function render(){
    const hash = location.hash || "#/login";
    const routeKey = hash.split("?")[0];
    const publicRoutes = ["#/login", "#/register"];
    const isPublic = publicRoutes.includes(routeKey);

    if (!isPublic && !isAuthed()){ location.hash = "#/login"; return; }
    (routes[routeKey] || routes["#/home"])();

    updateChrome();
    updateActiveNav(routeKey);
}

// ========================================
// RENDERERS
// ========================================
function renderLogin(){
    document.body.classList.add("auth");
    mount("login-template");
    $("#sidebar")?.classList.remove("open");

    const form = $("#loginForm");
    const msg = $("#loginMsg");

    on(form, "submit", (e) => {
        e.preventDefault();
        const payload = {email: $("#loginEmail").value.trim().toLowerCase(), password: $("#loginPassword").value};
        const v = validateLogin(payload);
        $("#loginEmailErr").textContent = v.errors.email || "";
        $("#loginPasswordErr").textContent = v.errors.password || "";
        if (!v.ok) return;

        const users = store.getUsers();
        const user = users[payload.email];
        if (user && user.password === payload.password){
            store.setCurrentUser({ username: user.username, email: payload.email });
            msg.className = "alert success";
            msg.textContent = "Login successful. Redirecting…";
            Notify.success(`Welcome back, ${user.username}!`, `Let's make progress today.`);

            const s = computeStreak();
            const streakMsg = s === 0 ? "Streak: 0 Days - Start Today! 💪" : "Streak: " + s + " Day" + (s === 1 ? "" : "s");
            Notify.info(streakMsg);

            document.body.classList.remove("auth");
            setTimeout(() => (location.hash = "#/home"), 200);
        } else {
            msg.className = "alert error";
            msg.textContent = "Invalid Email or Password.";
        }
    });
}

function renderRegister(){
    document.body.classList.add("auth");
    mount("register-template");
    $("#sidebar")?.classList.remove("open");
    
    const form = $("#regForm");
    const msg = $("#regMsg");
    const pw = $("#regPassword");
    const meter = $("#pwMeter");
    const meterFill = meter.querySelector(".meter-fill");

    on(pw, "input", () => {
        const s = scorePassword(pw.value);
        meter.className = `meter strength-${Math.max(1, s)}`;
        meterFill.style.width = `${(s / 4) * 100}%`;
    });
    
    on(form, "submit", (e) => {
        e.preventDefault();
        const payload = { username: $("#regUsername").value, email: $("#regEmail").value.trim().toLowerCase(), password: pw.value };
        const v = validateRegister(payload);
        $("#regUsernameErr").textContent = v.errors.username || "";
        $("#regEmailErr").textContent = v.errors.email || "";
        $("#regPasswordErr").textContent = v.errors.password || "";
        if (!v.ok) return;

        const users = store.getUsers();
        if (users[payload.email]) {
            msg.className = "alert error"; msg.textContent = "User already exists."; return;
        }
        
        users[payload.email] = { username: payload.username, password: payload.password };
        store.setUsers(users);
        msg.className = "alert success";
        msg.textContent = "Registration successful. You can log in now.";
        setTimeout(() => (location.hash = "#/login"), 600);
    });
}

function renderHome(){
    if (!guard()) return;
    document.body.classList.remove("auth");
    const user = store.getCurrentUser();
    mount("home-template", { username: user.username });
    
    const logs = store.getLogs();
    const weekStart = startOfWeek(new Date());
    const thisWeek = logs.filter(l => new Date(l.date) >= weekStart);
    const workoutsCount = new Set(thisWeek.map(l => l.date)).size;
    const volume = thisWeek.reduce((s, l) => s + l.sets * l.reps * l.weight, 0);
    $("#statWorkouts").textContent = String(workoutsCount);
    $("#statVolume").textContent = volume.toLocaleString();
    
    const list = $("#activityList");
    list.innerHTML = "";
    logs.slice(0, 5).forEach(l => {
        const li = document.createElement("li");
        li.textContent = `${l.date} • ${l.exercise} • ${l.sets}x${l.reps} @ ${formatUnits(l.weight)}`;
        list.appendChild(li);
    });
}

function renderWorkoutLog(){
    if (!guard()) return;
    document.body.classList.remove("auth");
    mount("workout-log-template");
    $("#sidebar")?.classList.remove("open");
    
    const form = $("#workoutForm");
    const err = $("#woErr");
    const ok = $("#woOK");
    const today = new Date().toISOString().slice(0, 10);
    $("#woDate").value = today;
    
    on(form, "submit", (e) => {
        e.preventDefault();
        err.textContent = ""; ok.textContent = "";
        
        const units = store.getSettings().units || "lbs";
        const notesEl = $("#woNotes");
        const payload = {
            id: crypto.randomUUID(),
            date: $("#woDate").value || today,
            exercise: $("#woExercise").value.trim(),
            sets: +$("#woSets").value,
            reps: +$("#woReps").value,
            weight: +$("#woWeight").value,
            notes: notesEl ? notesEl.value.trim() : "",
            units,
            createdAt: Date.now()
        };
        if (!payload.exercise || !payload.sets || !payload.reps) { err.textContent = "Please fill sets, reps, and exercise."; return; }
        
        const logs = store.getLogs();
        logs.unshift(payload);
        store.setLogs(logs);
        
        const details = `${payload.exercise}: ${payload.sets}×${payload.reps}${payload.weight ? ` @ ${formatUnits(payload.weight)}` : ""}`;
        Notify.success(Notify.praise(), details, 4500);
        ok.textContent = "Workout saved!";
        form.reset();
        $("#woDate").value = today;
    });
}

function renderBodyDiagram(){
    if (!guard()) return;
    document.body.classList.remove("auth");
    mount("body-diagram-template");

    const contentArea = document.getElementById("app");
    if(contentArea) contentArea.classList.add("full-width");

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'videoModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle"> Exercise Video </h3>
                <button class="modal-close" aria-label="Close"> &times; </button>
            </div>
            <iframe id="modalVideo" class="modal-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
    `;
    document.body.appendChild(modal);

    const toggleBtn = document.getElementById("toggleViewBtn");
    const front = document.getElementById("frontView");
    const back = document.getElementById("backView");

    toggleBtn.addEventListener("click", () => {
        const isFront = front.style.display !== "none";
        front.style.display = isFront ? "none" : "block";
        back.style.display = isFront ? "block" : "none";
        toggleBtn.textContent = isFront ? "Show Front View" : "Show Back View";
    });

    const exercises = {
        chest: [
            {name: "Bench Press", img: "images/chest/Bench-Press.jpg", url: "https://www.youtube.com/embed/hWbUlkb5Ms4"},
            {name: "Close-Grip Bench Press", img: "images/chest/Close-Grip-Bench-Press.jpg", url: "https://www.youtube.com/embed/4yKLxOsrGfg"},
            {name: "Wide-Grip Bench Press", img: "images/chest/Wide-Grip-Bench-Press.jpg", url: "https://www.youtube.com/embed/NQNWLYJTtHA"},
            {name: "Incline Bench Press", img: "images/chest/Incline-Bench-Press.jpg", url: "https://www.youtube.com/embed/8fXfwG4ftaQ"},
            {name: "Decline Barbell Press", img: "images/chest/Decline-Barbell-Press.jpg", url: "https://www.youtube.com/embed/a-UFQE4oxWY"},
            {name: "Incline Dumbbell Bench Press", img: "images/chest/Incline-Dumbbell-Bench-Press.jpg", url: "https://www.youtube.com/embed/Gruq177Psnk"},
            {name: "Decline Dumbbell Bench Press", img: "images/chest/Decline-Dumbbell-Bench-Press.jpg", url: "https://www.youtube.com/embed/5JiZFjxyoJQ"},
            {name: "Dumbbell Chest Press", img: "images/chest/Dumbbell-Chest-Press.jpg", url: "https://www.youtube.com/embed/WbCEvFA0NJs"},
            {name: "Dumbbell Chest Flyes", img: "images/chest/Dumbbell-Chest-Flyes.jpg", url: "https://www.youtube.com/embed/rk8YayRoTRQ"},
            {name: "Machine Fly", img: "images/chest/Machine-Fly.jpg", url: "https://www.youtube.com/embed/xYExAgLt_4I"},
            {name: "Machine Chest Press", img: "images/chest/Machine-Chest-Press.jpg", url: "https://www.youtube.com/embed/Qu7-ceCvq7w"},
            {name: "Dumbbell Pullover", img: "images/chest/Dumbbell-Pullover.jpg", url: "https://www.youtube.com/embed/Datv2L6t3-4"},
            {name: "Cable Flyes", img: "images/chest/Cable-Flyes.jpg", url: "https://www.youtube.com/embed/y4RJDSOBEl8"},
            {name: "Incline Cable Flyes", img: "images/chest/Incline-Cable-Flyes.jpg", url: "https://www.youtube.com/embed/-Eq_GScOGOE"},
            {name: "Cable Crossover", img: "images/chest/Cable-Crossover.jpg", url: "https://www.youtube.com/embed/WIErn7-YvYQ"},
        ],
        biceps: [
            {name: "Standing Dumbbell Curls", img: "images/biceps/Standing Dumbbell Curls.jpg", url: "https://www.youtube.com/embed/oLyP6sORFOc"},
            {name: "Alternating Dumbbell Curls", img: "images/biceps/Alternating Dumbbell Curls.jpg", url: "https://www.youtube.com/embed/FHY_2t7R714"},
            {name: "Hammer Curls", img: "images/biceps/Hammer Curls.jpg", url: "https://www.youtube.com/embed/vm0zV_WQerE"},
            {name: "Concentration Curls", img: "images/biceps/Concentration Curls.jpg", url: "https://www.youtube.com/embed/EjUnEEfTSEY"},
            {name: "Incline Dumbbell Curls", img: "images/biceps/Incline Dumbbell Curls.jpg", url: "https://www.youtube.com/embed/fXFN8_1Bh6k"},
            {name: "Zottman Curls", img: "images/biceps/Zottman Curls.jpg", url: "https://www.youtube.com/embed/5Go_uOTnFl0"},
            {name: "Cross-Body Hammer Curls", img: "images/biceps/Cross-Body Hammer Curls.jpg", url: "https://www.youtube.com/embed/qmQkt1Y-FX8"},
            {name: "Seated Alternating Dumbbell Curls", img: "images/biceps/Seated Alternating Dumbbell Curls.jpg", url: "https://www.youtube.com/embed/16v_0ET03Oo"},
            {name: "Barbell Curls", img: "images/biceps/Barbell Curls.jpg", url: "https://www.youtube.com/embed/54x2WF1_Suc"},
            {name: "EZ Bar Curls", img: "images/biceps/EZ Bar Curls.jpg", url: "https://www.youtube.com/embed/KFinlAT6aEo"},
            {name: "Reverse Curls", img: "images/biceps/Reverse Curls.jpg", url: "https://www.youtube.com/embed/ZG2n5IcYIcY"},
            {name: "Wide-Grip Barbell Curls", img: "images/biceps/Wide-Grip Barbell Curls.jpg", url: "https://www.youtube.com/embed/pgeSaAKOXRs"},
            {name: "Close-Grip Barbell Curls", img: "images/biceps/Close-Grip Barbell Curls.jpg", url: "https://www.youtube.com/embed/a6ZJAmhCfjU"},
            {name: "Cable Bicep Curls", img: "images/biceps/Cable Bicep Curls.jpg", url: "https://www.youtube.com/embed/CrbTqNOlFgE"},
            {name: "Overhead Cable Curls", img: "images/biceps/Overhead Cable Curls.jpg", url: "https://www.youtube.com/embed/grFE5bhFmiQ"},
        ],
        abs: [
            {name: "Weighted Crunches", img: "images/abs/Weighted Crunches.jpg", url: "https://www.youtube.com/embed/Yg6GsyZoqK0"},
            {name: "Russian Twists", img: "images/abs/Russian Twists.jpg", url: "https://www.youtube.com/embed/aRUMRbl7KS4"},
            {name: "Dumbbell Side Bend", img: "images/abs/Dumbbell Side Bend.jpg", url: "https://www.youtube.com/embed/kqr_IjiUuyY"},
            {name: "Weighted Sit-Ups", img: "images/abs/Weighted Sit-Ups.jpg", url: "https://www.youtube.com/embed/MXOK5F6SKXQ"},
            {name: "Crunches", img: "images/abs/Crunches.jpg", url: "https://www.youtube.com/embed/eeJ_CYqSoT4"},
            {name: "Reverse Crunches", img: "images/abs/Reverse Crunches.jpg", url: "https://www.youtube.com/embed/JkTk8irSNKE"},
            {name: "Bicycle Crunches", img: "images/abs/Bicycle Crunches.jpg", url: "https://www.youtube.com/embed/CakPX7X-mSw"},
            {name: "Leg Raises", img: "images/abs/Leg Raises.jpg", url: "https://www.youtube.com/embed/FijNSgahpz0"},
            {name: "Flutter Kicks", img: "images/abs/Flutter Kicks.jpg", url: "https://www.youtube.com/embed/tPmybsDX8ZY"},
            {name: "Toe Touches", img: "images/abs/Toe Touches.jpg", url: "https://www.youtube.com/embed/20P7MU4Oaec"},
            {name: "Mountain Climbers", img: "images/abs/Mountain Climbers.jpg", url: "https://www.youtube.com/embed/dqjZ6BGhY9s"},
            {name: "V-Ups", img: "images/abs/V-Ups.jpg", url: "https://www.youtube.com/embed/Wks3wpNJqTg"},
            {name: "Plank", img: "images/abs/Plank.jpg", url: "https://www.youtube.com/embed/xe2MXatLTUw"},
            {name: "Side Plank", img: "images/abs/Side Plank.jpg", url: "https://www.youtube.com/embed/BFOyHDlY2UE"},
            {name: "Plank with Shoulder Tap", img: "images/abs/Plank with Shoulder Tap.jpg", url: "https://www.youtube.com/embed/gccQ1hMX46U"},
        ],
        quads: [
            {name: "Barbell Back Squat", img: "images/quads/Barbell Back Squat.jpg", url: "https://www.youtube.com/embed/S9iWwaqbD3Q"},
            {name: "Front Squat", img: "images/quads/Front Squat.jpg", url: "https://www.youtube.com/embed/_qv0m3tPd3s"},
            {name: "Hack Squat", img: "images/quads/Hack Squat.jpg", url: "https://www.youtube.com/embed/g9i05umL5vc"},
            {name: "Zercher Squat", img: "images/quads/Zercher Squat.jpg", url: "https://www.youtube.com/embed/xtMpMCCzPrU"},
            {name: "Box Squat", img: "images/quads/Box Squat.jpg", url: "https://www.youtube.com/embed/Go4tSkrFIL8"},
            {name: "Dumbbell Goblet Squat", img: "images/quads/Dumbbell Goblet Squat.jpg", url: "https://www.youtube.com/embed/lRYBbchqxtI"},
            {name: "Dumbbell Split Squat", img: "images/quads/Dumbbell Split Squat.jpg", url: "https://www.youtube.com/embed/sw4MzpC8l58"},
            {name: "Bulgarian Split Squat", img: "images/quads/Bulgarian Split Squat.jpg", url: "https://www.youtube.com/embed/or1frhkjBDc"},
            {name: "Dumbbell Step-Ups", img: "images/quads/Dumbbell Step-Ups.jpg", url: "https://www.youtube.com/embed/8q9LVgN2RD4"},
            {name: "Dumbbell Front Squat", img: "images/quads/Dumbbell Front Squat.jpg", url: "https://www.youtube.com/embed/0hw86JiWjCM"},
            {name: "Leg Press", img: "images/quads/Leg Press.jpg", url: "https://www.youtube.com/embed/EotSw18oR9w"},
            {name: "Leg Extensions", img: "images/quads/Leg Extensions.jpg", url: "https://www.youtube.com/embed/iQ92TuvBqRo"},
            {name: "Cable Pull Through", img: "images/quads/Cable Pull Through.jpg", url: "https://www.youtube.com/embed/SuTI-n84ezA"},
            {name: "Sissy Squat", img: "images/quads/Sissy Squat.jpg", url: "https://www.youtube.com/embed/f4ubaNbsq0Y"},
            {name: "Smith Machine Front Squat", img: "images/quads/Smith Machine Front Squat.jpg", url: "https://www.youtube.com/embed/NO-6L6Blneg"},
        ],
        traps: [
            {name: "Barbell Back Squat", img: "images/quads/Barbell Back Squat.jpg", url: "https://www.youtube.com/embed/S9iWwaqbD3Q"},
            {name: "Front Squat", img: "images/quads/Front Squat.jpg", url: "https://www.youtube.com/embed/_qv0m3tPd3s"},
            {name: "Hack Squat", img: "images/quads/Hack Squat.jpg", url: "https://www.youtube.com/embed/g9i05umL5vc"},
            {name: "Zercher Squat", img: "images/quads/Zercher Squat.jpg", url: "https://www.youtube.com/embed/xtMpMCCzPrU"},
            {name: "Box Squat", img: "images/quads/Box Squat.jpg", url: "https://www.youtube.com/embed/Go4tSkrFIL8"},
            {name: "Dumbbell Goblet Squat", img: "images/quads/Dumbbell Goblet Squat.jpg", url: "https://www.youtube.com/embed/lRYBbchqxtI"},
            {name: "Dumbbell Split Squat", img: "images/quads/Dumbbell Split Squat.jpg", url: "https://www.youtube.com/embed/sw4MzpC8l58"},
            {name: "Bulgarian Split Squat", img: "images/quads/Bulgarian Split Squat.jpg", url: "https://www.youtube.com/embed/or1frhkjBDc"},
            {name: "Dumbbell Step-Ups", img: "images/quads/Dumbbell Step-Ups.jpg", url: "https://www.youtube.com/embed/8q9LVgN2RD4"},
            {name: "Dumbbell Front Squat", img: "images/quads/Dumbbell Front Squat.jpg", url: "https://www.youtube.com/embed/0hw86JiWjCM"},
            {name: "Leg Press", img: "images/quads/Leg Press.jpg", url: "https://www.youtube.com/embed/EotSw18oR9w"},
            {name: "Leg Extensions", img: "images/quads/Leg Extensions.jpg", url: "https://www.youtube.com/embed/iQ92TuvBqRo"},
            {name: "Cable Pull Through", img: "images/quads/Cable Pull Through.jpg", url: "https://www.youtube.com/embed/SuTI-n84ezA"},
            {name: "Sissy Squat", img: "images/quads/Sissy Squat.jpg", url: "https://www.youtube.com/embed/f4ubaNbsq0Y"},
            {name: "Smith Machine Front Squat", img: "images/quads/Smith Machine Front Squat.jpg", url: "https://www.youtube.com/embed/NO-6L6Blneg"},
        ],
        delts: ["Overhead Press", "Lateral Raises"],
        lats: ["Pull-Ups", "Lat Pulldown"],
        glutes: ["Hip Thrusts", "Glute Bridge"],
        hams: ["Deadlifts", "Leg Curls"]
    };

    const muscleMap = {
        'quadsL': 'quads',
        'quadsR': 'quads',
        'deltsL': 'delts',
        'deltsR': 'delts',
        'hamsL': 'hams',
        'hamsR': 'hams',
        'biceps2': 'biceps'
    };

    function showMuscle(id, label){
        const info = document.getElementById("muscleInfo");
        const name = document.getElementById("muscleName");
        const gallery = document.getElementById("muscleExercises");

        if (!info || !name || !gallery) {
            console.error("Elements Not Found.");
            return;
        }
        
        name.textContent = label;
        gallery.innerHTML = "";
        const muscleExercises = exercises[id] || [];
        
        muscleExercises.forEach(ex => {
            console.log("Exercise:", ex.name, "Image path:", ex.img);
            
            const card = document.createElement("div");
            card.className = "workout-card";
            card.innerHTML = `
                <img src="${ex.img}" alt="${ex.name}" style="border: 2px solid var(--border);" />
                <h4> ${ex.name} </h4>
            `;

            const imgEl = card.querySelector('img');
            imgEl.addEventListener('load', () => console.log("Image loaded:", ex.name));
            imgEl.addEventListener('error', () => console.log("Image FAILED:", ex.name, ex.img));

            card.addEventListener("click", () => {
                document.getElementById('modalTitle').textContent = ex.name;
                document.getElementById('modalVideo').src = ex.url;
                modal.classList.add('show');
            });
            gallery.appendChild(card);
        });
        info.style.display = "block";
    }

    function closeModal(){
        modal.classList.remove('show');
        document.getElementById('modalVideo').src = '';
    }
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    })

    Object.keys(exercises).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.cursor = "pointer";
            el.addEventListener("click", () => {
                const label = id.replace(/L|R|2/, '').toUpperCase();
                showMuscle(id, label);
            });
        }
    });

    Object.entries(muscleMap).forEach(([svgId, exerciseGroup]) => {
        const el = document.getElementById(svgId);
        if (el) {
            el.style.cursor = "pointer";
            el.addEventListener("click", () => {
                const label = exerciseGroup.toUpperCase();
                showMuscle(exerciseGroup, label);
            });
        }
    });
}

function renderHistory(){
    if (!guard()) return;
    document.body.classList.remove("auth");
    mount("history-template");
    $("#sidebar")?.classList.remove("open");
    
    const tbody = $("#historyBody");
    const fDate = $("#filterDate");
    const fText = $("#filterText");
    const fSort = $("#filterSort");
    
    function reflow() {
        const logs = store.getLogs().slice();
        const dateVal = fDate.value;
        const textVal = fText.value.toLowerCase().trim();
        
        let list = logs.filter(l => (!dateVal || l.date === dateVal) && (!textVal || l.exercise.toLowerCase().includes(textVal)));
        if (fSort.value === "oldest") list.sort((a,b) => a.createdAt - b.createdAt);
        else if (fSort.value === "volume") list.sort((a,b) => (b.sets*b.reps*b.weight) - (a.sets*a.reps*a.weight));
        else list.sort((a,b) => b.createdAt - a.createdAt);
        
        tbody.innerHTML = "";
        list.forEach(l => {
            const tr = document.createElement("tr");
            const vol = l.sets * l.reps * l.weight;
            tr.innerHTML = `
                <td>${l.date}</td>
                <td>${escapeHTML(l.exercise)}</td>
                <td>${l.sets}</td>
                <td>${l.reps}</td>
                <td>${formatUnits(l.weight)}</td>
                <td>${vol}</td>
                <td>${escapeHTML(l.notes || "")}</td>
                <td><button class="btn btn-outline" data-del="${l.id}">Delete</button></td>`;
            tbody.appendChild(tr);
        });
        
        tbody.querySelectorAll("[data-del]").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-del");
                const remaining = store.getLogs().filter(x => x.id !== id);
                store.setLogs(remaining);
                reflow();
            });
        });
    }
    [fDate, fText, fSort].forEach(i => i.addEventListener("input", reflow));
    reflow();
}

function renderProgress(){
    if (!guard()) return;
    document.body.classList.remove("auth");
    mount("progress-template");
    $("#sidebar")?.classList.remove("open");
    
    const list = $("#progressList");
    const logs = store.getLogs();
    const byExercise = {};
    logs.forEach(l => {
        if (!byExercise[l.exercise]) byExercise[l.exercise] = { max: 0, sessions: 0, totalVal: 0 };
        byExercise[l.exercise].max = Math.max(byExercise[l.exercise].max, l.weight);
        byExercise[l.exercise].sessions += 1;
        byExercise[l.exercise].totalVal += l.sets * l.reps * l.weight;
    });
    
    const entries = Object.entries(byExercise);
    if (!entries.length) list.innerHTML = `<li class="helper">Log Some Workouts to See Progress.</li>`;
    else list.innerHTML = entries.map(([name, v]) =>
        `<li><strong>${escapeHTML(name)}</strong> — max ${formatUnits(v.max)}, sessions ${v.sessions}, volume ${v.totalVal.toLocaleString()}</li>`
    ).join("");
}

function renderGeneratePlan(){
    if (!guard()) return;
    document.body.classList.remove("auth");
    mount("generate-plan-template");
    $("#sidebar")?.classList.remove("open");

    const equipRow = $("#equipRow");
    EQUIPMENT.forEach(e => {
        const label = document.createElement('label');
        label.className = 'chip';
        label.innerHTML = `<input type="checkbox" value="${e}"> ${e}`;
        equipRow.appendChild(label);
    });

    const savedPlan = store.getPlan();
    if (savedPlan) {
        $("#planWeek").textContent = `Week ${savedPlan.meta.week}`;
    }

    function getSelectedEquip(){
        return Array.from(equipRow.querySelectorAll('input:checked')).map(x => x.value);
    }

    function renderPlanOutput(planData){
        const out = $("#planOutput");
        out.innerHTML = '';
        
        planData.plan.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-plan';
            
            const h4 = document.createElement('h4');
            h4.textContent = day.name;
            dayDiv.appendChild(h4);

            const exGrid = document.createElement('div');
            exGrid.className = 'exercise-grid';
            
            const makeExercise = (e, isMain) => {
                const div = document.createElement('div');
                div.className = 'exercise-item';
                const sets = `${e.sets} × ${fmtRange(e.reps)} reps`;
                div.innerHTML = `
                    <strong>${e.name}</strong> ${isMain ? '<span class="badge">Main</span>' : '<span class="badge" style="background:var(--muted)">Accessory</span>'}
                    <small>${sets} • Rest ${e.rest}s</small>
                `;
                return div;
            };

            day.main.forEach(m => exGrid.appendChild(makeExercise(m, true)));
            day.accessories.forEach(a => exGrid.appendChild(makeExercise(a, false)));
            
            dayDiv.appendChild(exGrid);

            const noteP = document.createElement('p');
            noteP.className = 'plan-note';
            noteP.textContent = day.note;
            dayDiv.appendChild(noteP);

            out.appendChild(dayDiv);
        });

        store.setPlan(planData);
        $("#planWeek").textContent = `Week ${planData.meta.week}`;
        Notify.success("Workout Plan Generated!", "Your personalized plan is ready.");
    }

    const genBtn = $("#generateBtn");
    on(genBtn, "click", () => {
        const profile = {
            level: $("#planLevel").value,
            days: $("#planDays").value,
            goal: $("#planGoal").value,
            equipment: getSelectedEquip(),
            adherence: $("#planAdherence").value,
            rpe: Number($("#planRPE").value) || 7,
            week: savedPlan ? savedPlan.meta.week : 1
        };

        if (profile.equipment.length === 0) {
            Notify.info("No Equipment Selected", "Select at least one piece of equipment for better results.");
            return;
        }

        const plan = generatePlan(profile);
        renderPlanOutput(plan);
    });

    if (savedPlan) {
        renderPlanOutput(savedPlan);
    }
}

function renderSettings(){
    if (!guard()) return;
    document.body.classList.remove("auth");
    mount("settings-template");
    $("#sidebar")?.classList.remove("open");

    const unitsSel = $("#unitsSelect");
    const weeklyGoal = $("#weeklyGoal");
    const saveBtn = $("#saveSettings");
    const clearBtn = $("#clearData");
    const msg = $("#settingsMsg");
    const s = store.getSettings();

    if (s.units) unitsSel.value = s.units;
    if (s.weeklyGoal) weeklyGoal.value = s.weeklyGoal;

    on(saveBtn, "click", () => {
        store.setSettings({...store.getSettings(), units: unitsSel.value, weeklyGoal: +weeklyGoal.value || null });
        msg.className = "alert success";
        msg.textContent = "Settings Saved.";
    });

    on(clearBtn, "click", () => {
        if (confirm("Delete All Logs and Settings?")){
            store.clearData();
            msg.className = "alert";
            msg.textContent = "All Data Cleared."
        }
    });
}

// ========================================
// CHROME UI
// ========================================
function updateChrome(){
    const authed = isAuthed();
    const logoutBtn = $("#logoutBtn");
    const settingsBtn = $("#settingsBtn");

    if (authed) {
        logoutBtn.classList.remove("hidden");
        settingsBtn.classList.remove("hidden");
    } else {
        logoutBtn.classList.add("hidden");
        settingsBtn.classList.add("hidden");
    }

    $("#shell").style.display = authed ? "grid" : "block";
    $("#sidebar").style.display = authed ? "block" : "none";
}

on ($("#menuToggle"), "click", () => {
    const sb = $("#sidebar");
    const open = sb.classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded", String(open));
});

on (document, "click", (e) => {
    if (e.target && e.target.id === "logoutBtn"){
        store.clearCurrentUser();
        location.hash = "#/login";
    }
    if (e.target && e.target.id === "settingsBtn"){
        location.hash = "#/settings";
    }
});

function updateActiveNav(routeKey) {
    document.querySelectorAll(".sidebar-link").forEach(a => {
        a.classList.toggle("active", a.getAttribute("href") === routeKey);
    });
}

// ========================================
// BOOT
// ========================================
window.addEventListener("hashchange", render);
window.addEventListener("load", () => {
    const authed = isAuthed();
    if (!location.hash) {
        location.hash = authed ? "#/home" : "#/login";
    }
    render();
});

// ========================================
// TOAST NOTIFICATIONS
// ========================================
const Notify = (() => {
    const containerId = "congrats";
    const PRAISE = ["Nice Work!", "Let's Go!", "Consistency is Key.", "Keep It Up!!", "Small Steps Add Up."];
    const icon = (t) => (t === "success" ? "✅" : t === "error" ? "⚠️" : "ℹ️");

    function ensureContainer() {
        let c = document.getElementById(containerId);
        if (!c) {
            c = document.createElement("div");
            c.id = containerId;
            c.className = "congrats";
            c.setAttribute("aria-live", "polite");
            c.setAttribute("aria-atomic", "true");
            document.body.appendChild(c);
        }
        return c;
    }

    function show({title, message = "", type = "info", duration = 3500}) {
        const c = ensureContainer();
        const el = document.createElement("div");

        el.className = `congrat congrat-${type}`;
        el.innerHTML = `
            <div class="congrat-icon">${icon(type)}</div>
            <div class="congrat-body">
                <strong>${title}</strong>
                ${message ? `<div class="congrat-msg">${message}</div>` : ""}
            </div>
            <button class="congrat-close" aria-label="Close">&times;</button>
        `;
        c.appendChild(el);
        requestAnimationFrame(() => el.classList.add("show"));

        const remove = () => {
            el.classList.remove("show");
            el.addEventListener("transitionend", () => el.remove(), {once: true});
        };

        const t = setTimeout(remove, duration);
        el.querySelector(".congrat-close").addEventListener("click", () => {clearTimeout(t); remove();});
    }

    return {
        show,
        success: (t, m, d) => show({title: t, message: m, type: "success", duration: d}),
        info: (t, m, d) => show({title: t, message: m, type: "info", duration: d}),
        praise: () => PRAISE[Math.floor(Math.random() * PRAISE.length)]
    };
})();
