# UCLA-Graph-Planner
## Overview
This repo is a node server that accepts JSON-formatted course data and uploads that data to Neo4j.
## Setup
1. Make sure a .env with the following format is added in the same directory as connectiontest.js
```
NEO4J_URI=[neo4j uri]
NEO4J_USER=[username]
NEO4J_PASSWORD=[password]
```
2. Run ```npm install```
## Course data format
The format of the JSON input to the Neo4j scripts should be like this following example (CS 111 for fall 2023):
```
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
                        ... more discussions ...
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
```
## Running
1. ```node connectiontest.js```
2. make a POST request to http://localhost:8080/importdata with the body of the request containing the JSON
3. to verify changes, check the Neo4j Aura dashboard at https://console.neo4j.io to visualize the updated graph

**NOTE: This repo will likely be deprecated in the future. The Neo4j script will likely be merged with the scraper repo at https://github.com/UCLA-Noms/SOC-scraper
