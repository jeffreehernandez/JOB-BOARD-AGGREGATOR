const el=id=>document.getElementById(id);

// TOAST
function toast(msg){
const t=document.createElement('div');
t.className='toast';
t.innerText=msg;
document.body.appendChild(t);
setTimeout(()=>t.classList.add('show'),100);
setTimeout(()=>t.remove(),2500);
}

// DARK MODE
if(localStorage.getItem('dark')) document.body.classList.add('dark');

if(el('theme-toggle')){
el('theme-toggle').onclick=()=>{
document.body.classList.toggle('dark');
localStorage.setItem('dark',document.body.classList.contains('dark'));
};
}

// AUTH
if(!location.href.includes('login.html')){
if(!localStorage.getItem('currentUser')) location.href='login.html';
}

// LOGIN / REGISTER
if(el('submit-btn')){
let mode="login";

document.addEventListener('click',e=>{
if(e.target.id==="switch-btn"){
mode = mode==="login"?"register":"login";
el('form-title').innerText = mode==="login"?"Login":"Register";
el('submit-btn').innerText = mode==="login"?"Login":"Register";
el('switch-text').innerHTML = mode==="login"
? `Don’t have an account? <span id="switch-btn">Register</span>`
: `Already have an account? <span id="switch-btn">Login</span>`;
}
});

el('submit-btn').onclick=()=>{
let users=JSON.parse(localStorage.getItem('users'))||[];

if(mode==="login"){
let u=users.find(x=>x.username===username.value && x.password===password.value);
if(u){localStorage.setItem('currentUser',u.username);location.href='index.html';}
else toast("Invalid login");
}else{
users.push({username:username.value,password:password.value});
localStorage.setItem('users',JSON.stringify(users));
toast("Registered!");
}
};
}

// LOGOUT
if(el('logout-btn')){
el('logout-btn').onclick=()=>{
localStorage.removeItem('currentUser');
location.href='login.html';
};
}

const user=localStorage.getItem('currentUser');

// STORAGE (NOW STORES FULL JOB OBJECTS)
function getSaved(){return JSON.parse(localStorage.getItem(user+"_saved"))||[];}
function getApplied(){return JSON.parse(localStorage.getItem(user+"_applied"))||[];}
function setSaved(d){localStorage.setItem(user+"_saved",JSON.stringify(d));}
function setApplied(d){localStorage.setItem(user+"_applied",JSON.stringify(d));}

let jobs=[];

// LOAD JOBS
async function loadJobs(){
if(!el('jobs-container')) return;

const res=await fetch('https://remotive.com/api/remote-jobs');
const data=await res.json();
jobs=data.jobs;

populateFilters();
render(jobs);
}

// FILTER OPTIONS
function populateFilters(){
const locSet=new Set();
const typeSet=new Set();

jobs.forEach(j=>{
j.candidate_required_location.split(',').forEach(l=>locSet.add(l.trim()));
typeSet.add(j.job_type);
});

locSet.forEach(l=>el('filter-location').innerHTML+=`<option>${l}</option>`);
typeSet.forEach(t=>el('filter-type').innerHTML+=`<option>${t}</option>`);
}

// FILTER APPLY
function applyFilters(){
let f=[...jobs];

const s=el('search').value.toLowerCase();
const loc=el('filter-location').value;
const type=el('filter-type').value;
const date=el('filter-date').value;

if(s) f=f.filter(j=>j.title.toLowerCase().includes(s));
if(loc) f=f.filter(j=>j.candidate_required_location.includes(loc));
if(type) f=f.filter(j=>j.job_type===type);

if(date){
const now=new Date();
f=f.filter(j=>{
const d=new Date(j.publication_date);
return (now-d)/(1000*60*60*24)<=parseInt(date);
});
}

render(f);
}

// APPLY (REAL FILE UPLOAD)
function applyJob(job){

  // remove old modal if exists
  const old = document.querySelector('.modal');
  if(old) old.remove();

  const modal = document.createElement('div');
  modal.className = 'modal';

  modal.innerHTML = `
    <div class="modal-box">
      <h3>Apply for Job</h3>
      <p><b>${job.title}</b></p>

      <input type="file" id="resumeInput">
      <div class="file-name" id="fileName">No file selected</div>

      <button class="submit-btn" id="submitApply">Submit Application</button>
      <button class="close-btn" id="closeApply">Cancel</button>
    </div>
  `;

  document.body.appendChild(modal);

  const fileInput = modal.querySelector('#resumeInput');
  const fileName = modal.querySelector('#fileName');

  // show file name
  fileInput.addEventListener('change', () => {
    if(fileInput.files.length){
      fileName.textContent = fileInput.files[0].name;
    } else {
      fileName.textContent = "No file selected";
    }
  });

  // close
  modal.querySelector('#closeApply').onclick = () => modal.remove();

  // submit
  modal.querySelector('#submitApply').onclick = () => {
    const file = fileInput.files[0];

    if(!file){
      toast("Please upload your resume");
      return;
    }

    let applied = getApplied();

    // prevent duplicate
    if(!applied.find(j => j.id === job.id)){
      applied.push({
        id: job.id,
        title: job.title,
        company: job.company_name,
        resume: file.name
      });

      setApplied(applied);
      toast("Application submitted!");
    } else {
      toast("Already applied!");
    }

    modal.remove();
  };

  // click outside to close
  modal.addEventListener('click', (e) => {
    if(e.target === modal) modal.remove();
  });
}

// RENDER JOBS
function render(data){
const c=el('jobs-container');
if(!c) return;

c.innerHTML='';

data.forEach(job=>{
const card=document.createElement('div');
card.className='job-card';

const desc = job.description.replace(/<[^>]+>/g,'').slice(0,120);

card.innerHTML=`
<h3>${job.title}</h3>
<p><b>${job.company_name}</b></p>
<p>${job.candidate_required_location}</p>
<p>${desc}...</p>

<div class="card-buttons">
<button class="save">Save</button>
<button class="apply">Apply</button>
<button class="visit">Visit</button>
</div>
`;

c.appendChild(card);

// SAVE (STORE FULL JOB)
card.querySelector('.save').onclick=()=>{
let s=getSaved();

if(!s.find(x=>x.id===job.id)){
s.push({
id:job.id,
title:job.title,
company:job.company_name
});
setSaved(s);
toast("Saved!");
}
};

// APPLY
card.querySelector('.apply').onclick=()=>applyJob(job);

// VISIT
card.querySelector('.visit').onclick=()=>window.open(job.url);
});
}

// SAVED PAGE
if(el('saved-list')){
getSaved().forEach(job=>{
const div=document.createElement('div');
div.className='job-card';

div.innerHTML=`
<h3>${job.title}</h3>
<p>${job.company}</p>
<button class="remove">Remove</button>
`;

el('saved-list').appendChild(div);

div.querySelector('.remove').onclick=()=>{
let s=getSaved().filter(x=>x.id!==job.id);
setSaved(s);
div.remove();
};
});
}

// APPLIED PAGE
if(el('applied-list')){
getApplied().forEach(job=>{
const div=document.createElement('div');
div.className='job-card';

div.innerHTML=`
<h3>${job.title}</h3>
<p>${job.company}</p>
<p>${job.resume}</p>
<button class="remove">Remove</button>
`;

el('applied-list').appendChild(div);

div.querySelector('.remove').onclick=()=>{
let a=getApplied().filter(x=>x.id!==job.id);
setApplied(a);
div.remove();
};
});
}

// EVENTS
['search','filter-location','filter-type','filter-date'].forEach(id=>{
const e=el(id);
if(e) e.onchange=e.oninput=applyFilters;
});

// INIT
loadJobs();