require("dotenv").config();
const express = require("express");
const app = express();
const port = 8080;
var cors = require('cors');
app.use(cors());
app.use(express.json());

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

const neo4j = require("neo4j-driver");

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();
const personName = "Alice";
const sampleData = `
{
    "classes": {
        "COM SCI 111": {
            "courseID": "COM SCI 111",
            "courseName": "Operating Systems Principles",
            "units": 5,
            "departmentID": "COM SCI",
            "lectures": {
                "1": {
                    "lecture": "1",
                    "professor": "Eggert, P.R.",
                    "quarter": "23F",
                    "location": "Franz Hall 1178",
                    "days": [
                        "T",
                        "R"
                    ],
                    "time": "2pm-3:50pm",
                    "discussions": [
                        {
                            "section": "1A",
                            "ta": "Cao, Y.",
                            "location": "Geology Building 4660",
                            "days": [
                                "F"
                            ],
                            "time": "10am-11:50am"
                        },
                        {
                            "section": "1B",
                            "ta": "Roysar, B.",
                            "location": "Broad Art Center 2100A",
                            "days": [
                                "F"
                            ],
                            "time": "12pm-1:50pm"
                        },
                        {
                            "section": "1C",
                            "ta": "Cao, Y.",
                            "location": "Public Affairs Building 2270",
                            "days": [
                                "F"
                            ],
                            "time": "2pm-3:50pm"
                        },
                        {
                            "section": "1D",
                            "ta": "Roysar, B.",
                            "location": "Rolfe Hall 3135",
                            "days": [
                                "F"
                            ],
                            "time": "2pm-3:50pm"
                        }
                    ]
                }
            },
            "prereqs": [
                "Introduction to Computer Science II",
                "Introduction to Computer Organization",
                "Software Construction Laboratory"
            ]
        }
    }
}
`;


app.post("/importdata", (req, res) => {
    let data = req.body;
    console.log(data);
    importFromJSON(data).then((result) => res.send("done importing data"));

});

app.get("/importdatatest", (req, res) => {
    importFromJSON(JSON.parse(sampleData)).then((result) => res.send("done importing data")); // sample data
});

app.get("/closeconnection", (req, res) => {
    driver.close();
});

async function importFromJSON(data) {
    const classes = data.classes;
    console.log(classes)
    try {
        for (let cls in classes) {
            cls = classes[cls];
            console.log("creating/updating course node")
            console.log(cls)
            let result = await session.run(
                `
                MERGE (c:Course {CourseID: "${cls.courseID}"})
                ON CREATE SET c.Name = "${cls.courseName}", c.Units = "${cls.units}", c.Department = "${cls.departmentID}", c.Description = "${cls.courseDescription}", c.CoursePageLink = "${cls.coursePageLink}", c.AvailabilityLink = "${cls.courseAvailabilityLink}"
                ON MATCH SET c.Name = "${cls.courseName}", c.Units = "${cls.units}", c.Department = "${cls.departmentID}", c.Description = "${cls.courseDescription}", c.CoursePageLink = "${cls.coursePageLink}", c.AvailabilityLink = "${cls.courseAvailabilityLink}"
                `
            );
            console.log("creating/updating lecture and term nodes")
            for (const lecture in cls.lectures) {
                const lec = cls.lectures[lecture]
                console.log("lec")
                console.log(lec)
                result = await session.run(
                    `MERGE (l1:Lecture {Section: "${lec.lecture}", Professor: "${lec.professor}", Location: "${lec.location}", Days: "${lec.days.join(",")}", Time: "${lec.time}", Quarter: "${lec.quarter}"})
                    MERGE (c1:Course {CourseID: "${cls.courseID}"}) MERGE (l1)-[:FROM_COURSE]->(c1)
                    MERGE (t1:Term {Quarter: "${lec.quarter}"}) MERGE (l1)-[:TAUGHT_IN]->(t1)`
                );
                console.log("creating discussion node/relationships")
                for (const discussion in lec.discussions) {
                    result = await session.run(
                        `MERGE (d1:Discussion {Section: "${lec.discussions[discussion].section}", TA: "${lec.discussions[discussion].ta}", Location: "${lec.discussions[discussion].location}", Time: "${lec.discussions[discussion].time}", Days: "${lec.discussions[discussion].days.join(",")}"})
                        MERGE (l1:Lecture {Section: "${lec.lecture}", Professor: "${lec.professor}", Location: "${lec.location}", Days: "${lec.days.join(",")}", Time: "${lec.time}", Quarter: "${lec.quarter}"}) MERGE (l1)-[:HAS_DISCUSSION]->(d1)
                        MERGE (t1:Term {Quarter: "${lec.quarter}"}) MERGE (d1)-[:TAUGHT_IN]->(t1)`
                    );
                }
            }
            // console.log("creating course lecture relationship")
            console.log("creating prereq relationships")
            for (const prereq of cls.prereqs) {
                console.log("prereq")
                console.log(prereq)
                result = await session.run(
                    `MERGE (c1:Course {Name: "${prereq}"}) MERGE (c2:Course {CourseID: "${cls.courseID}"}) MERGE (c1)-[:IS_PREREQ_OF]->(c2)`
                );
            }
            console.log("done");
        }
    } finally {
        await session.close();
    }

    // on application exit:
    // await driver.close();
}


// test();
