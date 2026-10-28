const mongoose = require('mongoose');
const STATUSES=['Applied','Interview','Offer','Rejected','Accepted','Declined'];
const FINAL_STATUSES=['Rejected','Accepted','Declined'];
const schema=new mongoose.Schema({
 applicationId:{type:String,required:true,unique:true,immutable:true},
 companyName:{type:String,required:true,trim:true}, jobRole:{type:String,required:true,trim:true},
 jobType:{type:String,enum:['Full-time','Internship','Contract'],required:true},
 appliedDate:{type:Date,required:true,immutable:true}, expectedSalary:{type:Number,min:0,default:null},
 notes:{type:String,trim:true,default:''}, status:{type:String,enum:STATUSES,default:'Applied',required:true},
 followUpDate:{type:Date,required:true,immutable:true},
 statusHistory:[{status:{type:String,enum:STATUSES,required:true},changedAt:{type:Date,required:true,default:Date.now}}]
},{timestamps:true});
schema.set('toJSON',{virtuals:true}); schema.set('toObject',{virtuals:true});
module.exports={Application:mongoose.model('Application',schema),STATUSES,FINAL_STATUSES};
