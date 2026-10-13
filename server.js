const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));


// =====================================================
// DATABASE CONNECTION
// =====================================================

mongoose.connect("mongodb://127.0.0.1:27017/studentCourseDB")
    .then(() => {
        console.log("MongoDB connected to studentCourseDB");
    })
    .catch((err) => {
        console.log("MongoDB connection error:", err);
    });


// =====================================================
// STUDENT SCHEMA
// =====================================================

const studentSchema = new mongoose.Schema(
    {
        sid: {
            type: Number,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        age: {
            type: Number,
            required: true
        },

        marks: {
            type: Number,
            required: true
        }
    },
    {
        collection: "student_master"
    }
);


// =====================================================
// COURSE SCHEMA
// =====================================================

const courseSchema = new mongoose.Schema(
    {
        cid: {
            type: Number,
            required: true,
            unique: true
        },

        sid: {
            type: Number,
            required: true
        },

        cname: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        collection: "course_master"
    }
);


// =====================================================
// MODELS
// =====================================================

const Student = mongoose.model("StudentMaster", studentSchema);
const Course = mongoose.model("CourseMaster", courseSchema);


// =====================================================
// STUDENT CRUD
// =====================================================


// CREATE STUDENT
app.post("/students", async (req, res) => {

    try {

        const student = new Student({
            sid: Number(req.body.sid),
            name: req.body.name,
            age: Number(req.body.age),
            marks: Number(req.body.marks)
        });

        await student.save();

        res.json({
            success: true,
            message: "Student added successfully",
            student
        });

    } catch (error) {

        if (error.code === 11000) {

            return res.status(400).json({
                success: false,
                message: "SID already exists. Duplicate SID is not allowed."
            });

        }

        res.status(500).json({
            success: false,
            message: "Error adding student",
            error: error.message
        });
    }
});


// READ STUDENTS
// Uses $match, $sort and $project naturally based on query options
app.get("/students", async (req, res) => {

    try {

        const pipeline = [];

        const minMarks = Number(req.query.minMarks);
        const sort = req.query.sort;


        // $match
        if (!isNaN(minMarks)) {

            pipeline.push({
                $match: {
                    marks: {
                        $gte: minMarks
                    }
                }
            });

        }


        // $sort
        if (sort === "marks-desc") {

            pipeline.push({
                $sort: {
                    marks: -1
                }
            });

        } else if (sort === "marks-asc") {

            pipeline.push({
                $sort: {
                    marks: 1
                }
            });

        } else if (sort === "name-asc") {

            pipeline.push({
                $sort: {
                    name: 1
                }
            });

        } else {

            pipeline.push({
                $sort: {
                    sid: 1
                }
            });

        }


        // $project
        pipeline.push({
            $project: {
                _id: 0,
                sid: 1,
                name: 1,
                age: 1,
                marks: 1
            }
        });


        const students = await Student.aggregate(pipeline);

        res.json(students);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Error fetching students",
            error: error.message
        });

    }
});


// UPDATE STUDENT
app.put("/students/:sid", async (req, res) => {

    try {

        const sid = Number(req.params.sid);

        const student = await Student.findOneAndUpdate(

            { sid },

            {
                $set: {
                    name: req.body.name,
                    age: Number(req.body.age),
                    marks: Number(req.body.marks)
                }
            },

            {
                new: true,
                runValidators: true
            }

        );


        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }


        res.json({
            success: true,
            message: "Student updated successfully",
            student
        });


    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Error updating student",
            error: error.message
        });

    }
});


// DELETE STUDENT
app.delete("/students/:sid", async (req, res) => {

    try {

        const sid = Number(req.params.sid);


        // Foreign/reference constraint
        const courseExists = await Course.findOne({ sid });


        if (courseExists) {

            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete this student because the SID is being used by a course."
            });

        }


        const student = await Student.findOneAndDelete({ sid });


        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }


        res.json({
            success: true,
            message: "Student deleted successfully"
        });


    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Error deleting student",
            error: error.message
        });

    }
});


// =====================================================
// COURSE CRUD
// =====================================================


// CREATE COURSE
app.post("/courses", async (req, res) => {

    try {

        const cid = Number(req.body.cid);
        const sid = Number(req.body.sid);
        const cname = req.body.cname;


        // Foreign key/reference validation
        const studentExists = await Student.findOne({ sid });


        if (!studentExists) {

            return res.status(400).json({
                success: false,
                message:
                    "Student does not exist. Select a valid student before adding a course."
            });

        }


        const course = new Course({
            cid,
            sid,
            cname
        });


        await course.save();


        res.json({
            success: true,
            message: "Course added successfully",
            course
        });


    } catch (error) {

        if (error.code === 11000) {

            return res.status(400).json({
                success: false,
                message:
                    "CID already exists. Duplicate CID is not allowed."
            });

        }


        res.status(500).json({
            success: false,
            message: "Error adding course",
            error: error.message
        });

    }
});


// READ COURSES
app.get("/courses", async (req, res) => {

    try {

        const courses = await Course.aggregate([
            {
                $sort: {
                    cid: 1
                }
            },

            {
                $project: {
                    _id: 0,
                    cid: 1,
                    sid: 1,
                    cname: 1
                }
            }
        ]);

        res.json(courses);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Error fetching courses",
            error: error.message
        });

    }
});


// UPDATE COURSE
app.put("/courses/:cid", async (req, res) => {

    try {

        const cid = Number(req.params.cid);
        const sid = Number(req.body.sid);


        const studentExists = await Student.findOne({ sid });


        if (!studentExists) {

            return res.status(400).json({
                success: false,
                message:
                    "Student does not exist. Select a valid student."
            });

        }


        const course = await Course.findOneAndUpdate(

            { cid },

            {
                $set: {
                    sid,
                    cname: req.body.cname
                }
            },

            {
                new: true,
                runValidators: true
            }

        );


        if (!course) {

            return res.status(404).json({
                success: false,
                message: "Course not found"
            });

        }


        res.json({
            success: true,
            message: "Course updated successfully",
            course
        });


    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Error updating course",
            error: error.message
        });

    }
});


// DELETE COURSE
app.delete("/courses/:cid", async (req, res) => {

    try {

        const cid = Number(req.params.cid);

        const course = await Course.findOneAndDelete({ cid });


        if (!course) {

            return res.status(404).json({
                success: false,
                message: "Course not found"
            });

        }


        res.json({
            success: true,
            message: "Course deleted successfully"
        });


    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Error deleting course",
            error: error.message
        });

    }
});


// =====================================================
// STUDENT DROPDOWN DATA
// =====================================================

app.get("/student-options", async (req, res) => {

    try {

        const students = await Student.aggregate([

            {
                $sort: {
                    name: 1
                }
            },

            {
                $project: {
                    _id: 0,
                    sid: 1,
                    name: 1
                }
            }

        ]);


        res.json(students);


    } catch (error) {

        res.status(500).json({
            message: "Error fetching student options"
        });

    }
});


// =====================================================
// STUDENT + COURSE OVERVIEW
// Uses $lookup naturally
// =====================================================

app.get("/overview", async (req, res) => {

    try {

        const result = await Student.aggregate([

            {
                $lookup: {
                    from: "course_master",
                    localField: "sid",
                    foreignField: "sid",
                    as: "courseDetails"
                }
            },

            {
                $unwind: {
                    path: "$courseDetails",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {
                    _id: 0,
                    sid: 1,
                    name: 1,
                    marks: 1,

                    cid: "$courseDetails.cid",

                    courseName:
                        "$courseDetails.cname"
                }
            },

            {
                $sort: {
                    sid: 1
                }
            }

        ]);


        res.json(result);


    } catch (error) {

        res.status(500).json({
            message: "Error loading overview",
            error: error.message
        });

    }
});


// =====================================================
// DASHBOARD STATISTICS
// Uses $group naturally
// =====================================================

app.get("/stats", async (req, res) => {

    try {

        const totalStudents =
            await Student.countDocuments();


        const totalCourses =
            await Course.countDocuments();


        const result = await Student.aggregate([

            {
                $group: {
                    _id: null,

                    averageMarks: {
                        $avg: "$marks"
                    },

                    highestMarks: {
                        $max: "$marks"
                    }
                }
            }

        ]);


        const averageMarks =
            result.length > 0
                ? result[0].averageMarks
                : 0;


        const highestMarks =
            result.length > 0
                ? result[0].highestMarks
                : 0;


        res.json({
            totalStudents,
            totalCourses,
            averageMarks,
            highestMarks
        });


    } catch (error) {

        res.status(500).json({
            message: "Error fetching dashboard statistics"
        });

    }
});


// =====================================================
// START SERVER
// =====================================================

app.listen(3000, () => {

    console.log(
        "Server running on http://localhost:3000"
    );

});