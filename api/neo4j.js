require('dotenv').config({path: '../.env'});
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'GetMeInPrettyPlease'
    )
);

(async () => {
    try {
        const serverInfo = await driver.getServerInfo();
        console.log('Connection established to Neo4j');
        console.log(serverInfo);
    } catch (err) {
        console.error('Warning: Could not connect to Neo4j on startup:', err.message);
    }
})();

module.exports = driver;