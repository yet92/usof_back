const {init} = require('../index');

async function addCategoriesToPost() {
    const {Post, Category, disconnect} = await init({
        user: 'yzhuravlov',
        password: 'securepass'
    });

    try {
        const jsCategory = await Category.findOne({
            where: {title: 'JS'}
        });

        const programmingCategory = await Category.findOne({
           where: {title: 'Programming'}
        });

        const post = await Post.findByPk(1);

        await post.addCategory(jsCategory);
        await post.addCategory(programmingCategory);


    } catch (error) {
        console.log(error);
    }

    await disconnect();
}

addCategoriesToPost();