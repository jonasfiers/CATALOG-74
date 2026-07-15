const { dashService } = require("./dashService");
const driver = require("./neo4j");

(async () => {
    try {
        const categories = await dashService.getGroupCards(
            "38a6f9ee-c76d-4b4a-a41c-4943a2785525"
        );
        console.log(categories);
    } catch (err) {
        console.log(err);
    } finally {
        await driver.close();
    }
}) ();