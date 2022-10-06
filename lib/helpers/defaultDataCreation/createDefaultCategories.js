async function createDefaultCategories(Category) {
    await Category.create({
        title: "JS",
        description: "About JS"
    });

    await Category.create({
        title: "Web",
        description: "About Web Dev"
    })

    await Category.create({
        title: "Programming",
        description: "About Web Programming"
    })
}

module.exports = {createDefaultCategories}