const express=require('express');
const mongoose=require('mongoose');
const Counter=require('../models/Counter');
const {Application,STATUSES,FINAL_STATUSES}=require('../models/Application');
const router=express.Router();
const transitions={Applied:['Interview','Rejected'],Interview:['Offer','Rejected'],Offer:['Accepted','Declined'],Rejected:[],Accepted:[],Declined:[]};
const active=['Applied','Interview','Offer'];
const ok=(res,status,message,data)=>res.status(status).json({success:true,message,data});
const bad=(res,status,message)=>res.status(status).json({success:false,message,data:null});
const clean=x=>String(x??'').trim();
const esc=x=>clean(x).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const prefix=x=>(clean(x).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/gi,'').toUpperCase()+'XXX').slice(0,3);
function dateValue(value){
 const d=new Date(value); if(!value||Number.isNaN(d.getTime())) return null;
 const now=new Date(), today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
 if(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())>today) return 'future';
 return d;
}
function output(doc){
 const x=doc.toObject({virtuals:true});
 x.isOverdue=x.status==='Applied'&&new Date()>new Date(x.followUpDate);
 return x;
}
async function newId(company){
 const key=clean(company).toLowerCase();
 const c=await Counter.findOneAndUpdate({companyKey:key},{$inc:{seq:1},$setOnInsert:{companyKey:key}},{new:true,upsert:true,setDefaultsOnInsert:true});
 return `JA-${prefix(company)}-${String(c.seq).padStart(3,'0')}`;
}
const handle=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
router.get('/stats',handle(async(_req,res)=>{
 const rows=await Application.aggregate([{$group:{_id:'$status',count:{$sum:1}}}]);
 const data=Object.fromEntries(STATUSES.map(s=>[s,0])); rows.forEach(r=>data[r._id]=r.count);
 ok(res,200,'Counts retrieved',data);
}));
router.get('/',handle(async(req,res)=>{
 const filter={};
 if(req.query.status&&req.query.status!=='All'){
  if(!STATUSES.includes(req.query.status)) return bad(res,400,'Invalid status filter');
  filter.status=req.query.status;
 }
 if(clean(req.query.search)) filter.companyName={$regex:esc(req.query.search),$options:'i'};
 const docs=await Application.find(filter).sort({createdAt:-1});
 ok(res,200,'Applications retrieved',docs.map(output));
}));
router.get('/:id',handle(async(req,res)=>{
 if(!mongoose.isValidObjectId(req.params.id)) return bad(res,400,'Invalid application identifier');
 const doc=await Application.findById(req.params.id);
 if(!doc)return bad(res,404,'Application not found');
 ok(res,200,'Application retrieved',output(doc));
}));
router.post('/',handle(async(req,res)=>{
 const {companyName,jobRole,jobType,appliedDate,expectedSalary,notes}=req.body;
 if(!clean(companyName)||!clean(jobRole)||!appliedDate||!jobType)return bad(res,400,'Company name, job role, job type and applied date are required');
 if(!['Full-time','Internship','Contract'].includes(jobType))return bad(res,400,'Invalid job type');
 if(expectedSalary!==''&&expectedSalary!=null&&(!Number.isFinite(Number(expectedSalary))||Number(expectedSalary)<0))return bad(res,400,'Expected salary must be a non-negative number');
 const d=dateValue(appliedDate); if(d==='future')return bad(res,400,'Applied date cannot be in the future'); if(!d)return bad(res,400,'Please provide a valid applied date');
 const duplicate=await Application.findOne({companyName:{$regex:`^${esc(companyName)}$`,$options:'i'},jobRole:{$regex:`^${esc(jobRole)}$`,$options:'i'},status:{$in:active}});
 if(duplicate)return bad(res,409,'An active application already exists for this company and job role');
 const follow=new Date(d); follow.setUTCDate(follow.getUTCDate()+7);
 const doc=await Application.create({applicationId:await newId(companyName),companyName:clean(companyName),jobRole:clean(jobRole),jobType,appliedDate:d,expectedSalary:expectedSalary===''||expectedSalary==null?null:Number(expectedSalary),notes:clean(notes),status:'Applied',followUpDate:follow,statusHistory:[{status:'Applied',changedAt:new Date()}]});
 ok(res,201,'Application created',output(doc));
}));
router.put('/:id',handle(async(req,res)=>{
 if(!mongoose.isValidObjectId(req.params.id))return bad(res,400,'Invalid application identifier');
 if(['applicationId','appliedDate','status','followUpDate'].some(k=>k in req.body))return bad(res,400,'Application ID, applied date, status and follow-up date cannot be edited');
 const doc=await Application.findById(req.params.id);if(!doc)return bad(res,404,'Application not found');
 const company=req.body.companyName===undefined?doc.companyName:clean(req.body.companyName);
 const role=req.body.jobRole===undefined?doc.jobRole:clean(req.body.jobRole);
 const type=req.body.jobType===undefined?doc.jobType:req.body.jobType;
 if(!company||!role)return bad(res,400,'Company name and job role are required');
 if(!['Full-time','Internship','Contract'].includes(type))return bad(res,400,'Invalid job type');
 const salary=req.body.expectedSalary;
 if(salary!==undefined&&salary!==''&&salary!==null&&(!Number.isFinite(Number(salary))||Number(salary)<0))return bad(res,400,'Expected salary must be non-negative');
 const duplicate=await Application.findOne({_id:{$ne:doc._id},companyName:{$regex:`^${esc(company)}$`,$options:'i'},jobRole:{$regex:`^${esc(role)}$`,$options:'i'},status:{$in:active}});
 if(duplicate&&active.includes(doc.status))return bad(res,409,'An active application already exists for this company and job role');
 doc.companyName=company;doc.jobRole=role;doc.jobType=type;
 if(salary!==undefined)doc.expectedSalary=salary===''||salary===null?null:Number(salary);
 if(req.body.notes!==undefined)doc.notes=clean(req.body.notes);
 await doc.save();ok(res,200,'Application updated',output(doc));
}));
router.patch('/:id/status',handle(async(req,res)=>{
 if(!mongoose.isValidObjectId(req.params.id))return bad(res,400,'Invalid application identifier');
 const {status}=req.body;if(!STATUSES.includes(status))return bad(res,400,'Invalid status');
 const doc=await Application.findById(req.params.id);if(!doc)return bad(res,404,'Application not found');
 if(!transitions[doc.status].includes(status))return bad(res,400,`Invalid status transition: ${doc.status} cannot change to ${status}`);
 doc.status=status;doc.statusHistory.push({status,changedAt:new Date()});await doc.save();
 ok(res,200,'Status updated',output(doc));
}));
router.delete('/:id',handle(async(req,res)=>{
 if(!mongoose.isValidObjectId(req.params.id))return bad(res,400,'Invalid application identifier');
 const doc=await Application.findById(req.params.id);if(!doc)return bad(res,404,'Application not found');
 if(!['Applied',...FINAL_STATUSES].includes(doc.status))return bad(res,400,'Applications in Interview or Offer status cannot be deleted');
 await doc.deleteOne();ok(res,200,'Application deleted',{_id:doc._id});
}));
router.use((err,_req,res,_next)=>{
 console.error(err);
 if(err.code===11000)return bad(res,409,'Duplicate record conflict');
 if(err.name==='ValidationError')return bad(res,400,err.message);
 bad(res,500,'Internal server error');
});
module.exports=router;
