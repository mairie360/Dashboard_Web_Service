const assert = require('node:assert/strict');
const { test } = require('node:test');
require('./support/load-ts.cjs');
const { isUsableBootstrap, selectDashboardBootstrap } = require('../src/lib/dashboard-bootstrap.ts');
const bootstrap = () => ({ userFirstName:'Confirmed',projects:[{id:'p',title:'Project',progress:25,status:'review',dueDate:'2026-10-16'}],tasks:[{id:'t',projectId:'p',title:'Task',priority:'high',dueDate:'',completed:false}],events:[{id:1,title:'Meeting',date:'2026-10-16',startTime:'10:00',location:'Room'}],metrics:{totalProjects:1},sources:{projects:'available',tasks:'available',calendar:'unavailable'} });
test('the server projection preserves contracted scalar values and excludes nested unknown transport fields',()=>{
 const body=bootstrap();body.secret='never-serialize';for(const row of [...body.projects,...body.tasks,...body.events,body.metrics,body.sources])row.secret='never-serialize';
 const result=selectDashboardBootstrap(body);assert.deepEqual(result,bootstrap());assert.doesNotMatch(JSON.stringify(result),/never-serialize/);
 const minimal=bootstrap();minimal.events=[{id:'event',title:'Untimed',date:'2026-10-16'}];minimal.metrics.totalProjects=null;assert.deepEqual(selectDashboardBootstrap(minimal),minimal);
});
for(const[name,modify]of[
 ['missing identity',v=>delete v.userFirstName],['null list',v=>v.projects=null],['unknown availability',v=>v.sources.calendar='pending'],['null sources',v=>v.sources=null],
 ['null project',v=>v.projects=[null]],['unconfirmed project name',v=>v.projects[0].title=42],['nonfinite progress',v=>v.projects[0].progress=Infinity],['unknown status',v=>v.projects[0].status='unverified'],
 ['null task',v=>v.tasks=[null]],['unconfirmed task name',v=>v.tasks[0].title={}],['unknown priority',v=>v.tasks[0].priority='unverified'],
 ['null event',v=>v.events=[null]],['nonfinite event id',v=>v.events[0].id=NaN],['unconfirmed event date',v=>v.events[0].date=null],['nonstring time',v=>v.events[0].startTime=12],['nonstring location',v=>v.events[0].location=12],
])test(`refuses ${name} without claiming an empty confirmed dashboard`,()=>{const body=bootstrap();modify(body);assert.equal(isUsableBootstrap(body),false);assert.equal(selectDashboardBootstrap(body),null);});
for(const[name,modify]of[['unconfirmed completed flag',v=>v.tasks[0].completed='false'],['absent metrics',v=>delete v.metrics],['nonfinite metric',v=>v.metrics.totalProjects=Infinity]])test(`server refuses ${name} before serialization`,()=>{const body=bootstrap();modify(body);assert.equal(selectDashboardBootstrap(body),null);});
test('null, primitive and array bodies remain unavailable',()=>{for(const value of[null,{},[],false])assert.equal(selectDashboardBootstrap(value),null);});
