const assert = require('node:assert/strict');
const { test } = require('node:test');
require('./support/load-ts.cjs');
const { isUsableBootstrap, selectDashboardBootstrap } = require('../src/lib/dashboard-bootstrap.ts');
const bootstrap = () => ({ userFirstName:'Confirmed',projects:[{id:'p',title:'Project',progress:25,status:'review',dueDate:'2026-10-16'}],tasks:[{id:'t',projectId:'p',title:'Task',priority:'high',dueDate:'',completed:false}],events:[{id:1,title:'Meeting',date:'2026-10-16',startTime:'10:00',location:'Room'}],metrics:{totalProjects:1},sources:{projects:'available',tasks:'available',calendar:'unavailable'} });
test('the server projection preserves contracted scalar values and excludes nested unknown transport fields',()=>{
 const body=bootstrap();body.secret='never-serialize';for(const row of [...body.projects,...body.tasks,...body.events,body.metrics,body.sources])row.secret='never-serialize';
 // A BFF without the MAIR-825 / MAIR-1106 fields gets their neutral values: no last name, role, commune, trainings nor unread badge.
 const legacy=(value)=>({...value,userLastName:'',userRole:null,communeName:null,trainings:[],unreadMessages:null,metrics:{...value.metrics,eventsThisMonth:null,eventsPeriod:{from:'',to:''}},sources:{...value.sources,trainings:'unavailable',messages:'unavailable'}});
 const result=selectDashboardBootstrap(body);assert.deepEqual(result,legacy(bootstrap()));assert.doesNotMatch(JSON.stringify(result),/never-serialize/);
 const minimal=bootstrap();minimal.events=[{id:'event',title:'Untimed',date:'2026-10-16'}];minimal.metrics.totalProjects=null;assert.deepEqual(selectDashboardBootstrap(minimal),legacy(minimal));
});
for(const[name,modify]of[
 ['missing identity',v=>delete v.userFirstName],['null list',v=>v.projects=null],['unknown availability',v=>v.sources.calendar='pending'],['null sources',v=>v.sources=null],
 ['null project',v=>v.projects=[null]],['unconfirmed project name',v=>v.projects[0].title=42],['nonfinite progress',v=>v.projects[0].progress=Infinity],['unknown status',v=>v.projects[0].status='unverified'],
 ['null task',v=>v.tasks=[null]],['unconfirmed task name',v=>v.tasks[0].title={}],['unknown priority',v=>v.tasks[0].priority='unverified'],
 ['null event',v=>v.events=[null]],['nonfinite event id',v=>v.events[0].id=NaN],['unconfirmed event date',v=>v.events[0].date=null],['nonstring time',v=>v.events[0].startTime=12],['nonstring location',v=>v.events[0].location=12],
])test(`refuses ${name} without claiming an empty confirmed dashboard`,()=>{const body=bootstrap();modify(body);assert.equal(isUsableBootstrap(body),false);assert.equal(selectDashboardBootstrap(body),null);});
for(const[name,modify]of[['unconfirmed completed flag',v=>v.tasks[0].completed='false'],['absent metrics',v=>delete v.metrics],['nonfinite metric',v=>v.metrics.totalProjects=Infinity]])test(`server refuses ${name} before serialization`,()=>{const body=bootstrap();modify(body);assert.equal(selectDashboardBootstrap(body),null);});
const v2=()=>({...bootstrap(),metrics:{totalProjects:1,eventsThisMonth:4,eventsPeriod:{from:'2026-10-01',to:'2026-10-31'}},userLastName:'Martin',userRole:'Agent',communeName:'Saint-Pierre',trainings:[{id:'training-4',title:'Accueil',status:'in-progress',completedModules:1,totalModules:4,progress:25,dueDate:'2026-12-15'}],unreadMessages:7,sources:{projects:'available',tasks:'available',calendar:'unavailable',trainings:'available',messages:'available'}});
test('MAIR-825/MAIR-1106/MAIR-1110: the server projection keeps the last name, role, commune, trainings with their due date and the unread count',()=>{
 const body=v2();body.trainings[0].secret='never-serialize';const result=selectDashboardBootstrap(body);assert.deepEqual(result,v2());assert.doesNotMatch(JSON.stringify(result),/never-serialize/);
});
test('MAIR-1106/MAIR-1110: a MAIR-825 BFF without the unread count nor due dates gets no badge and undated trainings',()=>{
 const body=v2();delete body.unreadMessages;delete body.sources.messages;delete body.trainings[0].dueDate;
 const expected=v2();expected.unreadMessages=null;expected.sources.messages='unavailable';expected.trainings[0].dueDate=null;
 assert.deepEqual(selectDashboardBootstrap(body),expected);
});
test('MAIR-1106: an unavailable Message API keeps the dashboard with no badge',()=>{
 const body=v2();body.unreadMessages=null;body.sources.messages='unavailable';assert.deepEqual(selectDashboardBootstrap(body),body);
});
for(const[name,modify]of[
 ['numeric last name',v=>v.userLastName=4],['object role',v=>v.userRole={}],['numeric commune',v=>v.communeName=1],['unknown trainings availability',v=>v.sources.trainings='pending'],
 ['trainings object',v=>v.trainings={}],['null training',v=>v.trainings=[null]],['unknown training status',v=>v.trainings[0].status='late'],['negative module count',v=>v.trainings[0].completedModules=-1],['nonfinite training progress',v=>v.trainings[0].progress=NaN],
 ['numeric training due date',v=>v.trainings[0].dueDate=20261215],['unknown messages availability',v=>v.sources.messages='pending'],
 ['negative unread count',v=>v.unreadMessages=-1],['fractional unread count',v=>v.unreadMessages=1.5],['textual unread count',v=>v.unreadMessages='7'],
])test(`MAIR-825: refuses ${name}`,()=>{const body=v2();modify(body);assert.equal(isUsableBootstrap(body),false);assert.equal(selectDashboardBootstrap(body),null);});
test('MAIR-1177: the server projection keeps the events of the month and their period',()=>{
 const body=v2();body.metrics.eventsPeriod.secret='never-serialize';const result=selectDashboardBootstrap(body);
 assert.deepEqual(result.metrics,{totalProjects:1,eventsThisMonth:4,eventsPeriod:{from:'2026-10-01',to:'2026-10-31'}});assert.doesNotMatch(JSON.stringify(result),/never-serialize/);
 const unavailable=v2();unavailable.metrics.eventsThisMonth=null;assert.deepEqual(selectDashboardBootstrap(unavailable).metrics,unavailable.metrics);
});
for(const[name,modify]of[
 ['negative count of the month',v=>v.metrics.eventsThisMonth=-1],['fractional count of the month',v=>v.metrics.eventsThisMonth=1.5],['textual count of the month',v=>v.metrics.eventsThisMonth='4'],
 ['null period',v=>v.metrics.eventsPeriod=null],['period without its last day',v=>delete v.metrics.eventsPeriod.to],['period in another format',v=>v.metrics.eventsPeriod.from='01/10/2026'],
])test(`MAIR-1177: refuses a ${name}`,()=>{const body=v2();modify(body);assert.equal(isUsableBootstrap(body),false);assert.equal(selectDashboardBootstrap(body),null);});
test('null, primitive and array bodies remain unavailable',()=>{for(const value of[null,{},[],false])assert.equal(selectDashboardBootstrap(value),null);});
