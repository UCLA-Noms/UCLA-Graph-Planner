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
const user = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

const neo4j = require("neo4j-driver");

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();
const sampleData = [
`
{
    "major_reqs": {
        "Sociology": {
            "Preparation for the Major":
            {
                "Sociology": {
                    "type": "all",
                    "courses": [
                        "SOCIOL 1",
                        "SOCIOL 20"
                    ]
                },
                "Political Science or Statistics": {
                    "type": "one",
                    "courses": [
                        "POL SCI 6",
                        "STATS 10",
                        "STATS 13"
                    ]
                }
            },
            "The Major": {
                "Theory": {
                    "type": "all",
                    "courses": [
                        "SOCIOL 101",
                        "SOCIOL 102"
                    ]
                },
                "Methods": {
                    "type": "one",
                    "courses": [
                        "SOCIOL 106A",
                        "SOCIOL 106B",
                        "SOCIOL 110",
                        "SOCIOL 111",
                        "SOCIOL 112",
                        "SOCIOL 113",
                        "SOCIOL CM124A",
                        "SOCIOL 191H",
                        "STATS 112"
                    ]
                },
                "Core Areas": {
                    "Interactions": {
                        "type": "one",
                        "courses": [
                            "SOCIOL 111",
                            "SOCIOL CM124A",
                            "SOCIOL CM125",
                            "SOCIOL 126",
                            "SOCIOL 130",
                            "SOCIOL 132",
                            "SOCIOL 133",
                            "SOCIOL 134",
                            "SOCIOL 152"
                        ]
                    },
                    "Institutions and Social Processes": {
                        "type": "one",
                        "courses": [
                            "SOCIOL 116",
                            "SOCIOL 121",
                            "SOCIOL 143",
                            "SOCIOL 151",
                            "SOCIOL 158",
                            "SOCIOL 172",
                            "SOCIOL 173",
                            "SOCIOL M174",
                            "SOCIOL M175",
                            "SOCIOL M176",
                            "SOCIOL 181B"
                        ]
                    },
                    "Power and Inequality": {
                        "type": "one",
                        "courses": [
                            "SOCIOL 116",
                            "SOCIOL 121",
                            "SOCIOL 143",
                            "SOCIOL 151",
                            "SOCIOL 158",
                            "SOCIOL 172",
                            "SOCIOL 173",
                            "SOCIOL M174",
                            "SOCIOL M175",
                            "SOCIOL M176",
                            "SOCIOL 181B"
                        ]
                    }
                },
                "Electives": {
                    "type": "five",
                    "courses": [
                        "AF AMER 110A",
                        "ANTHRO 129",
                        "ASIA AM 103",
                        "COMM 100",
                        "POL SCI 116A"
                    ]
                }
            }
        }
    }
}
`

];


app.post("/importdata", async (req, res) => {
    let data = req.body;
    console.log(data);
    await importFromJSON(data).then((result) => res.send("done importing data"));

});

app.get("/importdatatest", async (req, res) => {
    for (const sample of sampleData) {
        await importFromJSON(JSON.parse(sample));
    }
    res.send("done importing data");
    session.close();
});

app.get("/importdatatest2", async (req, res) => {
    await importFromJSONTest2(JSON.parse(sampleData[0]))
    res.send("done importing data");
    session.close();
});

app.get("/closeconnection", (req, res) => {
    driver.close();
});

async function writeMajorCategoryData(major, data, prev_category = null) {
    console.log("recurse")
    try {
        for (const category in data) {
            if (data[category].hasOwnProperty("courses")) { // deepest layer
                let result = await session.run(
                    `
                    MERGE (c:Category {Name: "${category}", Major: "${major}"})
                    ON CREATE SET c.type = "${data[category].type}"
                    ON MATCH SET c.type = "${data[category].type}"
                    `
                );
                for (const course of data[category].courses) {
                    console.log(course)
                    let result = await session.run(

                        `
                        MERGE (cat:Category {Name: "${category}"}) 
                        MERGE (c:Course {CourseID: "${course}"})
                        ON CREATE SET c.Name = "temp course name", c.Units = "5", c.Department = "${course.split(" ").slice(0, -1).join(" ")}", c.Description = "test description", c.CoursePageLink = "test link", c.AvailabilityLink = "test link"
                        ON MATCH SET c.Name = "temp course name", c.Units = "5", c.Department = "${course.split(" ").slice(0, -1).join(" ")}", c.Description = "test description", c.CoursePageLink = "test link", c.AvailabilityLink = "test link"
                        MERGE (l1:Lecture {InternalID: "${course}_L1", Quarter: "24W"})
                        ON CREATE SET l1.Section = "1", l1.Professor = "test professor", l1.Location = "test location", l1.Days = "${["M", "F"].join(",")}", l1.Time = "4pm-5:50pm"
                        ON MATCH SET l1.Section = "1", l1.Professor = "test professor", l1.Location = "test location", l1.Days = "${["M", "F"].join(",")}", l1.Time = "4pm-5:50pm"
                        MERGE (l1)-[:FROM_COURSE]->(c)
                        MERGE (t1:Term {Quarter: "24W"}) MERGE (l1)-[:TAUGHT_IN]->(t1)
                        MERGE (cat)-[:HAS_COURSE]->(c)
                        ` // need to account for cases where nodes with only course name or nodes with only course id
                    )
                }
            } else { // recurse
                await writeMajorCategoryData(major, data[category], category);
            }
            console.log(prev_category)
            if (prev_category) {
                let result = await session.run(
                    `
                    MERGE (c1:Category {Name: "${prev_category}", Major: "${major}"})
                    MERGE (c2:Category {Name: "${category}", Major: "${major}"})
                    MERGE (c1)-[:HAS_SUBCAT]->(c2)
                    `
                );
            } else {
                let result = await session.run(
                    `
                    MERGE (m:Major {Name: "${major}"})
                    MERGE (cat:Category {Name: "${category}", Major: "${major}"})
                    MERGE (m)-[:HAS_CAT]->(cat)
                    `
                )
            }
            console.log("category", category)
        }
    } catch (e) {
        console.log(e);
    }
}

async function importFromJSONTest2(data) {
    const classes = data.classes;
    console.log(classes)
    try {
        for (const major in data.major_reqs) {
            await writeMajorCategoryData(major, data.major_reqs[major]);
        }
        let result = await session.run(
            `
            MERGE (c1:Course {CourseID: "SOCIOL 101"}) MERGE (c2:Course {CourseID: "SOCIOL 102"}) MERGE (c1)-[:IS_PREREQ_OF]->(c2)
            MERGE (c3:Course {CourseID: "SOCIOL 1"}) MERGE (c4:Course {CourseID: "SOCIOL 20"}) MERGE (c3)-[:IS_PREREQ_OF]->(c4)
            ` // sociol 1 is not an actual prereq of sociol 20
        )
        // for (let cls in classes) {
        //     cls = classes[cls];
        //     console.log("creating/updating course node")
        //     console.log(cls)
        //     let result = await session.run(
        //         `
        //         MERGE (c:Course {Name: "${cls.courseName}"})
        //         ON CREATE SET c.CourseID = "${cls.courseID}", c.Units = "${cls.units}", c.Department = "${cls.departmentID}", c.Description = "${cls.courseDescription}", c.CoursePageLink = "${cls.coursePageLink}", c.AvailabilityLink = "${cls.courseAvailabilityLink}"
        //         ON MATCH SET c.CourseID = "${cls.courseID}", c.Units = "${cls.units}", c.Department = "${cls.departmentID}", c.Description = "${cls.courseDescription}", c.CoursePageLink = "${cls.coursePageLink}", c.AvailabilityLink = "${cls.courseAvailabilityLink}"
        //         `
        //     );
        //     console.log("creating/updating lecture and term nodes")
        //     for (const lecture in cls.lectures) {
        //         const lec = cls.lectures[lecture]
        //         console.log("lec")
        //         console.log(lec)
        //         result = await session.run(
        //             `
        //             MERGE (l1:Lecture {InternalID: "${lec.internalID}", Quarter: "${lec.quarter}"})
        //             ON CREATE SET l1.Section = "${lec.lecture}", l1.Professor = "${lec.professor}", l1.Location = "${lec.location}", l1.Days = "${lec.days.join(",")}", l1.Time = "${lec.time}"
        //             ON MATCH SET l1.Section = "${lec.lecture}", l1.Professor = "${lec.professor}", l1.Location = "${lec.location}", l1.Days = "${lec.days.join(",")}", l1.Time = "${lec.time}"
        //             MERGE (c1:Course {CourseID: "${cls.courseID}"}) MERGE (l1)-[:FROM_COURSE]->(c1)
        //             MERGE (t1:Term {Quarter: "${lec.quarter}"}) MERGE (l1)-[:TAUGHT_IN]->(t1)`
        //         );
        //         console.log("creating discussion node/relationships")
        //         for (const discussion of lec.discussions) {
        //             result = await session.run(
        //                 `
        //                 MERGE (d1:Discussion {InternalID: "${discussion.internalID}", Quarter: "${discussion.quarter}"})
        //                 ON CREATE SET d1.Section = "${discussion.section}", d1.TA = "${discussion.ta}", d1.Location = "${discussion.location}", d1.Days = "${discussion.days.join(",")}", d1.Time = "${discussion.time}"
        //                 ON MATCH SET d1.Section = "${discussion.section}", d1.TA = "${discussion.ta}", d1.Location = "${discussion.location}", d1.Days = "${discussion.days.join(",")}", d1.Time = "${discussion.time}"
        //                 MERGE (l1:Lecture {Section: "${lec.lecture}", Professor: "${lec.professor}", Location: "${lec.location}", Days: "${lec.days.join(",")}", Time: "${lec.time}", Quarter: "${lec.quarter}"}) MERGE (l1)-[:HAS_DISCUSSION]->(d1)
        //                 MERGE (t1:Term {Quarter: "${lec.quarter}"}) MERGE (d1)-[:TAUGHT_IN]->(t1)`
        //             );
        //         }
        //     }
        //     // console.log("creating course lecture relationship")
        //     console.log("creating prereq relationships")
        //     for (const prereq of cls.prereqs) {
        //         console.log("prereq")
        //         console.log(prereq)
        //         result = await session.run(
        //             `MERGE (c1:Course {Name: "${prereq}"}) MERGE (c2:Course {CourseID: "${cls.courseID}"}) MERGE (c1)-[:IS_PREREQ_OF]->(c2)`
        //         );
        //     }
        //     console.log("done");
        // }
    } finally {
        // await session.close();
    }

    // on application exit:
    // await driver.close();
}

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
                MERGE (c:Course {Name: "${cls.courseName}"})
                ON CREATE SET c.CourseID = "${cls.courseID}", c.Units = "${cls.units}", c.Department = "${cls.departmentID}", c.Description = "${cls.courseDescription}", c.CoursePageLink = "${cls.coursePageLink}", c.AvailabilityLink = "${cls.courseAvailabilityLink}"
                ON MATCH SET c.CourseID = "${cls.courseID}", c.Units = "${cls.units}", c.Department = "${cls.departmentID}", c.Description = "${cls.courseDescription}", c.CoursePageLink = "${cls.coursePageLink}", c.AvailabilityLink = "${cls.courseAvailabilityLink}"
                `
            );
            console.log("creating/updating lecture and term nodes")
            for (const lecture in cls.lectures) {
                const lec = cls.lectures[lecture]
                console.log("lec")
                console.log(lec)
                result = await session.run(
                    `
                    MERGE (l1:Lecture {InternalID: "${lec.internalID}", Quarter: "${lec.quarter}"})
                    ON CREATE SET l1.Section = "${lec.lecture}", l1.Professor = "${lec.professor}", l1.Location = "${lec.location}", l1.Days = "${lec.days.join(",")}", l1.Time = "${lec.time}"
                    ON MATCH SET l1.Section = "${lec.lecture}", l1.Professor = "${lec.professor}", l1.Location = "${lec.location}", l1.Days = "${lec.days.join(",")}", l1.Time = "${lec.time}"
                    MERGE (c1:Course {CourseID: "${cls.courseID}"}) MERGE (l1)-[:FROM_COURSE]->(c1)
                    MERGE (t1:Term {Quarter: "${lec.quarter}"}) MERGE (l1)-[:TAUGHT_IN]->(t1)`
                );
                console.log("creating discussion node/relationships")
                for (const discussion of lec.discussions) {
                    result = await session.run(
                        `
                        MERGE (d1:Discussion {InternalID: "${discussion.internalID}", Quarter: "${discussion.quarter}"})
                        ON CREATE SET d1.Section = "${discussion.section}", d1.TA = "${discussion.ta}", d1.Location = "${discussion.location}", d1.Days = "${discussion.days.join(",")}", d1.Time = "${discussion.time}"
                        ON MATCH SET d1.Section = "${discussion.section}", d1.TA = "${discussion.ta}", d1.Location = "${discussion.location}", d1.Days = "${discussion.days.join(",")}", d1.Time = "${discussion.time}"
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
        // await session.close();
    }

    // on application exit:
    // await driver.close();
}


// test();
