require("dotenv").config();


const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

const neo4j = require("neo4j-driver");

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();
const personName = "Alice";

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

test();
