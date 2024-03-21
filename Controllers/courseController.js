import {Course} from '../Models/Course.js'
import ErrorHandler from '../Util/ErrorHandler.js'
import getDataUri from '../Util/dataUri.js'
import cloudinary from 'cloudinary'

export const getAllCourses=async (req,res,next)=>{

        const keyword = req.query.keyword || ""
        const category = req.query.category || ""
 
        const courses =await Course.find(
            {
                title:{
                    $regex:keyword,
                    $options:"i"
                },
                category:{
                    $regex:category,
                    $options:"i"
                }
            }
        ).select("-lectures")
        res.status(200).json({
            success:true,
            courses
        })
   
}
export const createCourse=async (req,res,next)=>{
 
 
        const {title,description,category,createdBy}=req.body

        const file=req.file
        const fileUri = getDataUri(file)
        const myCloud = await cloudinary.v2.uploader.upload(fileUri.content)

        await Course.create({
            title,
            description,
            category,
            createdBy,
            poster:{
                public_id:myCloud.public_id,
                url:myCloud.secure_url
            }
        })

        res.status(201).json({
            success:true,
            message:"Course created successfully"
        })
}

export const getCourseLectures=async (req,res,next)=>{

    const course = await Course.findById(req.params.id)
    
    if(!course)return next(new ErrorHandler("Course not found",404))
    course.views+=1
    await course.save()
    res.status(200).json({
        success:true,
        lectures:course.lectures
    })

}

export const addLecture=async (req,res,next)=>{

    const course = await Course.findById(req.params.id)
    if(!course)return next(new ErrorHandler("Course not found",404))

    const {title,description}=req.body

    const file=req.file
    const fileUri = getDataUri(file)
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content,{
        resource_type:"video"
    })
    
    //upload file here
    course.lectures.push({
        title,description,video:{
            public_id:myCloud.public_id,
            url:myCloud.secure_url
        }
    })

    course.numOfVideos=course.lectures.length

    await course.save()
    res.status(200).json({
        success:true,
        message:"Lectures added in course"
    })

}

export const deleteCourse=async (req,res,next)=>{

    const {id}=req.params
    const course = await Course.findById(id)
    if(!course)return next(new ErrorHandler("Course not found",404))

    await cloudinary.v2.uploader.destroy(course.poster.public_id) //deleting course poster from cloudinary
    //deleting videos of each lecture of the particular course from cloudinary
    for (let i = 0; i < course.lectures.length; i++) { 
        await cloudinary.v2.uploader.destroy(course.lectures[i].video.public_id,{
            resource_type:"video"
        })
    }

    await course.deleteOne()

    res.status(200).json({
        success:true,
        message:"Course deleted successfully"
    })

}

export const deleteLecture=async (req,res,next)=>{

    const {courseId,lectureId}=req.query
    const course = await Course.findById(courseId)
    if(!course)return next(new ErrorHandler("Course not found",404))

    //finding lecture to be deleted
    const lecture = course.lectures.find((item)=>{
        if(item._id.toString()===lectureId.toString())return item
    })
    //delete lecture video from cloudinary
    await cloudinary.v2.uploader.destroy(lecture.video.public_id,{
        resource_type:"video"
    })
    //update lectures in the course
    course.lectures = course.lectures.filter((item)=>{
        if(item._id.toString()!==lectureId.toString())return item
    })

    course.numOfVideos = course.lectures.length
    await course.save()

    res.status(200).json({
        success:true,
        message:"Lecture deleted successfully"
    })
}


Course.watch().on("change",async()=>{
    const stats = await Stats.find({}).sort({createdAt:"desc"}).limit(1)   // stats for last month

    const courses = await Course.find({})

    let totalViews = 0;

    for(let i=0;i<courses.length;i++){
        totalViews+=courses[i].views
    }
    stats[0].views = totalViews
    stats[0].createdAt = new Date(Date.now())

    await stats[0].save()
})