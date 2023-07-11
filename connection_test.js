require("dotenv").config();
const express = require("express");
const app = express();
const port = 8080;
var cors = require('cors');
app.use(cors());

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
    "classes":[
        {
            "courseID":"COM SCI 32",
            "courseName":"Introduction to Computer Science II",
            "units":4,
            "departmentID":"CS",
            "courseDescription":"introduction blah blah",
            "coursePageLink":"cs32 link",
            "courseAvailabilityLink":"blah",
            "professor":"Smallberg",
            "quarter":"Fall 22",
            "location":"blah",
            "days":"MW",
            "time":"10:00 AM",
            "discussions":[
                {
                    "discussionID":123456789,
                    "section":"1A",
                    "ta":"ta1",
                    "location":"blah1",
                    "day":"F",
                    "time":"10:00 AM"
                },
                {
                    "discussionID":111111111,
                    "section":"1B",
                    "ta":"ta2",
                    "location":"blah2",
                    "day":"F",
                    "time":"12:00 PM"
                }
            ],
            "prereqs":[
                "COM SCI 31"
            ]
        }
    ]
}
`;


app.get("/importdata", (req, res) => {
    // let data = JSON.parse(req.data);
    importFromJSON(JSON.parse(sampleData)).then((result) => res.send("done importing data"));
});

async function importFromJSON(data) {
    const classes = data.classes;
    try {
        for (const cls of classes) {
            console.log("creating/updating course node")
            let result = await session.run(
                `MERGE (:Course {CourseID: "${cls.courseID}", Name: "${cls.courseName}", Units: ${cls.units}, DepartmentID: "${cls.departmentID}", Description: "${cls.courseDescription}", CoursePageLink: "${cls.coursePageLink}", AvailabilityLink: "${cls.courseAvailabilityLink}"})`
            );
            console.log("creating/updating term node")
            result = await session.run(
                `MERGE (:Term {Quarter: "${cls.quarter}", Professor: "${cls.professor}", Location: "${cls.location}", Time: "${cls.time}"})`
            );
            console.log("creating course term relationship")
            result = await session.run(
                `MERGE (c1:Course {CourseID: "${cls.courseID}"}) MERGE (t1:Term {Quarter: "${cls.quarter}", Professor: "${cls.professor}"}) MERGE (c1)-[:TAUGHT_BY]->(t1)`
            );
            console.log("creating prereq relationships")
            for (const prereq of cls.prereqs) {
                result = await session.run(
                    `MERGE (c1:Course {CourseID: "${prereq}"}) MERGE (c2:Course {CourseID: "${cls.courseID}"}) MERGE (c1)-[:IS_PREREQ_OF]->(c2)`
                );
            }
            console.log("creating discussion node/relationships")
            for (const discussion of cls.discussions) {
                result = await session.run(
                    `MERGE (:Discussion {DiscussionID: "${discussion.discussionID}", Section: "${discussion.section}", TA: "${discussion.ta}", Location: "${discussion.location}", Time: "${discussion.time}"})`
                );
                result = await session.run(
                    `MERGE (c1:Course {CourseID: "${cls.courseID}"}) MERGE (d1:Discussion {DiscussionID: "${discussion.discussionID}"}) MERGE (c1)-[:HAS_DISCUSSION]->(d1)`
                );
                result = await session.run(
                    `MERGE (d1:Discussion {DiscussionID: "${discussion.discussionID}"}) MERGE (t1:Term {Quarter: "${cls.quarter}", Professor: "${cls.professor}"}) MERGE (d1)-[:AVAILABLE_IN]->(t1)`
                );
            }
            console.log("done");
        }
    } finally {
        await session.close();
    }

    // on application exit:
    await driver.close();
}

async function test() {
    try {
        //     const result1 = await session.run(
        //   'CREATE (:Course {CourseID: "CS31", Name: "Introduction to Computer Science", Units: 4, DepartmentID: "CS", Description: "introduction blah blah", CoursePageLink: "cs31 link", AvailabilityLink: "blah"})'
        // );

        // const result2 = await session.run(
        //   'CREATE (:Course {CourseID: "CS32", Name: "Introduction to Computer Science II", Units: 4, DepartmentID: "CS", Description: "data structure blah", CoursePageLink: "cs32 link", AvailabilityLink: "blah"})'
        // );

        // const result3 = await session.run(
        //   'CREATE (:Course {CourseID: "CS33", Name: "Introduction to Computer Organization", Units: 5, DepartmentID: "CS", Description: "assembly blah", CoursePageLink: "cs33 link", AvailabilityLink: "blah"})'
        // );

        // const result4 = await session.run(
        //   'CREATE (:Course {CourseID: "CS35L", Name: "Software Construction Laboratory", Units: 4, DepartmentID: "CS", Description: "linux and git and stuff", CoursePageLink: "cs35l link", AvailabilityLink: "blah"})'
        // );

        // const result5 = await session.run(
        //   'CREATE (:Course {CourseID: "PHYS1A", Name: "Mechanics", Units: 5, DepartmentID: "PHYS", Description: "mechanics stuff", CoursePageLink: "physics1a link", AvailabilityLink: "blah"})'
        // );

        // const result6 = await session.run(
        //   'MATCH (c1:Course {CourseID: "CS32"}), (c2:Course {CourseID: "CS31"}) CREATE (c1)-[:PREREQUISITE]->(c2)'
        // );

        // const result7 = await session.run(
        //   'MATCH (c1:Course {CourseID: "CS33"}), (c2:Course {CourseID: "CS32"}) CREATE (c1)-[:PREREQUISITE]->(c2)'
        // );

        // const result8 = await session.run(
        //   'MATCH (c1:Course {CourseID: "CS35L"}), (c2:Course {CourseID: "CS31"}) CREATE (c1)-[:PREREQUISITE]->(c2)'
        // );

        // const result9 = await session.run(
        //   'CREATE (:Term {Quarter: "Fall 22", Professor: "Smallberg"})'
        // );

        // const result10 = await session.run(
        //   'CREATE (:Term {Quarter: "Winter 23", Professor: "Smallberg"})'
        // );

        // const result11 = await session.run(
        //   'CREATE (:Term {Quarter: "Winter 23", Professor: "Nachenberg"})'
        // );

        // const result12 = await session.run(
        //   'CREATE (:Term {Quarter: "Spring 23", Professor: "Reinman"})'
        // );

        // const result13 = await session.run(
        //   'CREATE (:Term {Quarter: "Winter 23", Professor: "Eggert"})'
        // );

        // const result14 = await session.run(
        //   'CREATE (:Term {Quarter: "Spring 23", Professor: "Eggert"})'
        // );

        // const result15 = await session.run(
        //   'CREATE (:Term {Quarter: "Spring 23", Professor: "Kusenko"})'
        // );

        // const result16 = await session.run(
        //     'MATCH (c1:Course {CourseID: "CS31"}), (t1:Term {Quarter: "Fall 22",Professor: "Smallberg"}) CREATE (c1)-[:OFFERED_IN]->(t1)'
        // );

        // const result17 = await session.run(
        //     'MATCH (c1:Course {CourseID: "CS31"}), (t2:Term {Quarter: "Winter 23", Professor: "Smallberg"}) CREATE (c1)-[:OFFERED_IN]->(t2)'
        // );

        // const result18 = await session.run(
        //     'MATCH (c1:Course {CourseID: "CS32"}), (t3:Term {Quarter: "Winter 23", Professor: "Nachenberg"}) CREATE (c1)-[:OFFERED_IN]->(t3)'
        // );

        // const result19 = await session.run(
        //     'MATCH (c1:Course {CourseID: "CS32"}), (t4:Term {Quarter: "Winter 23", Professor: "Smallberg"}) CREATE (c1)-[:OFFERED_IN]->(t4)'
        // );

        // const result20 = await session.run(
        //     'MATCH (c1:Course {CourseID: "CS33"}), (t5:Term {Quarter: "Spring 23", Professor: "Reinman"}) CREATE (c1)-[:OFFERED_IN]->(t5)'
        // );

        // const result21 = await session.run(
        //     'MATCH (c1:Course {CourseID: "CS35L"}), (t6:Term {Quarter: "Winter 23", Professor: "Eggert"}) CREATE (c1)-[:OFFERED_IN]->(t6)'
        // );

        // const result22 = await session.run(
        //     'MATCH (c1:Course {CourseID: "CS35L"}), (t7:Term {Quarter: "Spring 23", Professor: "Eggert"}) CREATE (c1)-[:OFFERED_IN]->(t7)'
        // );

        // const result23 = await session.run(
        //     'MATCH (c1:Course {CourseID: "PHYS1A"}), (t8:Term {Quarter: "Spring 23", Professor: "Kusenko"}) CREATE (c1)-[:OFFERED_IN]->(t8)'
        // );

        const result = await session.run(
            'MATCH (c:Course {CourseID: "CS33"})-[:OFFERED_IN]->(t:Term) RETURN t'
        );

        // const result = await session.run('MATCH (n) RETURN n LIMIT 25');

        console.log(result.records.map((record) => record.get(0).properties));
        // const node = singleRecord.get(0)

        // console.log(node.properties)
    } finally {
        await session.close();
    }

    // on application exit:
    await driver.close();
}

// test();
